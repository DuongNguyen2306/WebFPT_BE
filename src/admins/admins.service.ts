import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './admin.schema';

@Injectable()
export class AdminsService {
  constructor(@InjectModel(Admin.name) private readonly model: Model<AdminDocument>) {}

  /** Chuẩn hóa login admin: field `email` (chuẩn) hoặc `username` (document cũ / Compass). */
  private loginFilter(account: string) {
    const key = account.toLowerCase().trim();
    return { $or: [{ email: key }, { username: key }] };
  }

  findByEmail(email: string) {
    return this.model.findOne(this.loginFilter(email)).exec();
  }

  findByEmailWithSecret(email: string) {
    return this.model.findOne(this.loginFilter(email)).select('+passwordHash').exec();
  }

  /** Đồng bộ document cũ: copy username → email nếu thiếu email */
  async migrateUsernameToEmail() {
    const docs = await this.model.find({ $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] }).exec();
    let n = 0;
    for (const d of docs) {
      const u = (d as AdminDocument & { username?: string }).username;
      if (u) {
        await this.model.updateOne({ _id: d._id }, { $set: { email: u.toLowerCase().trim() } });
        n += 1;
      }
    }
    return n;
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  create(data: { email: string; passwordHash: string }) {
    return this.model.create(data);
  }

  count() {
    return this.model.countDocuments().exec();
  }
}
