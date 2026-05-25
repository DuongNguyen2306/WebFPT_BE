import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from './lead.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { PackagesService } from '../packages/packages.service';
import { normalizeVnPhone } from '../common/utils/phone.util';
import { LeadRateLimitService } from './lead-rate-limit.service';
import { LeadStatus } from '../common/enums';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private readonly model: Model<LeadDocument>,
    private readonly packages: PackagesService,
    private readonly rate: LeadRateLimitService,
  ) {}

  async create(dto: CreateLeadDto, opts: { ip?: string; customerId?: string }) {
    const phone = normalizeVnPhone(dto.phone);
    if (!phone) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }
    this.rate.checkIp(opts.ip ?? 'unknown');
    this.rate.checkPhone(phone);

    let packageId: Types.ObjectId | null = null;
    let packageSnapshot: Lead['packageSnapshot'] = null;

    if (dto.packageId) {
      const pkg = await this.packages.findByIdForSnapshot(dto.packageId);
      if (!pkg) {
        throw new BadRequestException('Gói không tồn tại hoặc đã ngừng kinh doanh');
      }
      packageId = new Types.ObjectId(dto.packageId);
      packageSnapshot = {
        code: pkg.code,
        name: pkg.name,
        price: pkg.price ?? null,
        type: pkg.type,
      };
    }

    const customerId = opts.customerId ? new Types.ObjectId(opts.customerId) : null;

    const doc = await this.model.create({
      fullName: dto.fullName.trim(),
      phone,
      installAddress: dto.installAddress.trim(),
      packageId,
      packageSnapshot,
      customerId,
      status: LeadStatus.NEW,
      source: 'WEB',
      ip: opts.ip,
    });

    return {
      id: doc._id.toString(),
      status: doc.status,
      createdAt: doc.get('createdAt') as Date,
    };
  }

  findForCustomer(customerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { customerId: new Types.ObjectId(customerId) };
    return Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments(filter).exec(),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  findAdminList(filters: {
    status?: LeadStatus;
    from?: Date;
    to?: Date;
    phone?: string;
    page: number;
    limit: number;
  }) {
    const q: Record<string, unknown> = {};
    if (filters.status) q.status = filters.status;
    if (filters.phone) q.phone = normalizeVnPhone(filters.phone) ?? filters.phone;
    if (filters.from || filters.to) {
      q.createdAt = {};
      if (filters.from) (q.createdAt as Record<string, Date>).$gte = filters.from;
      if (filters.to) (q.createdAt as Record<string, Date>).$lte = filters.to;
    }
    const skip = (filters.page - 1) * filters.limit;
    return Promise.all([
      this.model.find(q).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean().exec(),
      this.model.countDocuments(q).exec(),
    ]).then(([items, total]) => ({ items, total, page: filters.page, limit: filters.limit }));
  }

  async updateAdmin(id: string, patch: { status?: LeadStatus; adminNote?: string }) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Lead không tồn tại');
    }
    const $set: Record<string, unknown> = {};
    if (patch.status !== undefined) $set.status = patch.status;
    if (patch.adminNote !== undefined) $set.adminNote = patch.adminNote;
    const doc = await this.model.findByIdAndUpdate(id, { $set }, { new: true }).lean().exec();
    if (!doc) {
      throw new NotFoundException('Lead không tồn tại');
    }
    return doc;
  }
}
