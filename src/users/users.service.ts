import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { LeadsService } from '../leads/leads.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { toUserProfileResponse } from './user-profile.mapper';
import { toRegistrationList } from './registration.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly customers: CustomersService,
    private readonly leads: LeadsService,
  ) {}

  async getProfile(customerId: string) {
    const customer = await this.customers.findById(customerId);
    if (!customer) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    return toUserProfileResponse(customer);
  }

  async updateProfile(customerId: string, dto: UpdateUserProfileDto) {
    if (dto.fullName === undefined && dto.phone === undefined && dto.address === undefined) {
      throw new BadRequestException('Không có trường nào để cập nhật');
    }

    const updated = await this.customers.updateProfile(customerId, {
      fullName: dto.fullName,
      phone: dto.phone,
      defaultAddress: dto.address,
    });

    if (!updated) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    return toUserProfileResponse(updated);
  }

  async getRegistrations(customerId: string, page: number, limit: number) {
    const customer = await this.customers.findById(customerId);
    if (!customer) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const { items, total } = await this.leads.findRegistrationsForUser(
      customerId,
      customer.phone,
      page,
      limit,
    );

    return {
      items: toRegistrationList(items as Record<string, unknown>[]),
      total,
      page,
      limit,
    };
  }
}
