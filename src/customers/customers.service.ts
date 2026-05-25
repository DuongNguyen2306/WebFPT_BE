import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './customer.schema';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private readonly model: Model<CustomerDocument>) {}

  create(data: { username: string; passwordHash: string; fullName: string; email?: string }) {
    return this.model.create({
      ...data,
      username: data.username.toLowerCase().trim(),
      email: data.email ? data.email.toLowerCase().trim() : undefined,
    });
  }

  findByUsername(username: string) {
    return this.model.findOne({ username: username.toLowerCase().trim() }).exec();
  }

  findByUsernameWithSecret(username: string) {
    return this.model
      .findOne({ username: username.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByEmail(email: string, excludeId?: string) {
    const e = email.toLowerCase().trim();
    const q = this.model.findOne({ email: e });
    if (excludeId) {
      q.where('_id').ne(excludeId);
    }
    return q.exec();
  }

  async updateProfile(
    id: string,
    patch: { fullName?: string; defaultAddress?: string; email?: string | null },
  ) {
    if (patch.email !== undefined && patch.email) {
      const other = await this.findByEmail(patch.email, id);
      if (other) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};

    if (patch.fullName !== undefined) $set.fullName = patch.fullName;
    if (patch.defaultAddress !== undefined) $set.defaultAddress = patch.defaultAddress;

    if (patch.email !== undefined) {
      if (patch.email === null || patch.email === '') {
        $unset.email = 1;
      } else {
        $set.email = patch.email.toLowerCase().trim();
      }
    }

    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    if (!Object.keys(update).length) {
      return this.model.findById(id).exec();
    }

    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }
}
