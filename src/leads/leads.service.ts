import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from './lead.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { PackagesService } from '../packages/packages.service';
import { normalizeVnPhone } from '../common/utils/phone.util';
import { LeadRateLimitService } from './lead-rate-limit.service';
import { LeadStatus } from '../common/enums';
import { toLeadPublicItem, toLeadPublicList } from './lead-public.mapper';
import { DiscordNotifyService } from '../notifications/discord-notify.service';

export type AdminLeadPatch = {
  status?: LeadStatus;
  adminNote?: string;
  adminNotes?: string;
  packageName?: string;
  address?: string;
};

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private readonly model: Model<LeadDocument>,
    private readonly packages: PackagesService,
    private readonly rate: LeadRateLimitService,
    private readonly discord: DiscordNotifyService,
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
        speedLabel: pkg.speedLabel ?? null,
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

    const createdAt = doc.get('createdAt') as Date;
    console.log('[Leads] Đơn mới đã lưu DB, kích hoạt Discord notify', {
      leadId: doc._id.toString(),
      phone: doc.phone,
      discordWebhookConfigured: Boolean(process.env.DISCORD_WEBHOOK_URL?.trim()),
    });
    void this.discord.notifyNewRegistration({
      createdAt,
      fullName: doc.fullName,
      phone: doc.phone,
      address: doc.installAddress,
      packageName: packageSnapshot?.name ?? 'Chưa chọn gói',
      source: doc.source,
    });

    return {
      id: doc._id.toString(),
      status: doc.status,
      createdAt,
      fullName: doc.fullName,
      phone: doc.phone,
      installAddress: doc.installAddress,
      packageId: packageId?.toString() ?? null,
      packageSnapshot,
    };
  }

  /** Tra cứu đơn đã gửi theo SĐT (không cần đăng nhập). */
  async findHistoryByPhone(phoneRaw: string, opts: { ip?: string }) {
    const phone = normalizeVnPhone(phoneRaw);
    if (!phone) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }
    this.rate.checkLookupByPhone(opts.ip ?? 'unknown', phone);

    const docs = await this.model
      .find({ phone })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return {
      phone,
      total: docs.length,
      items: toLeadPublicList(docs as Record<string, unknown>[]),
    };
  }

  /** Chi tiết một đơn — chỉ khi SĐT khớp (dùng sau tra cứu). */
  async findOnePublicByIdAndPhone(id: string, phoneRaw: string, opts: { ip?: string }) {
    const phone = normalizeVnPhone(phoneRaw);
    if (!phone) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký');
    }
    this.rate.checkLookupByPhone(opts.ip ?? 'unknown', phone);

    const doc = await this.model.findOne({ _id: id, phone }).lean().exec();
    if (!doc) {
      throw new NotFoundException('Không tìm thấy đơn đăng ký với số điện thoại này');
    }
    return toLeadPublicItem(doc as Record<string, unknown>);
  }

  findForCustomer(customerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { customerId: new Types.ObjectId(customerId) };
    return Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments(filter).exec(),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }

  /** Lịch sử đăng ký: đơn gắn tài khoản hoặc cùng SĐT profile */
  findRegistrationsForUser(
    customerId: string,
    profilePhone: string | null | undefined,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const or: Record<string, unknown>[] = [
      { customerId: new Types.ObjectId(customerId) },
    ];

    const phone = profilePhone ? normalizeVnPhone(profilePhone) ?? profilePhone : null;
    if (phone) {
      or.push({ phone });
    }

    const filter = or.length > 1 ? { $or: or } : or[0];

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

  async updateAdmin(id: string, patch: AdminLeadPatch) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Lead không tồn tại');
    }

    const existing = await this.model.findById(id).lean().exec();
    if (!existing) {
      throw new NotFoundException('Lead không tồn tại');
    }

    const $set: Record<string, unknown> = {};
    if (patch.status !== undefined) $set.status = patch.status;

    const note = patch.adminNotes ?? patch.adminNote;
    if (note !== undefined) $set.adminNote = note.trim();

    if (patch.address !== undefined) {
      $set.installAddress = patch.address.trim();
    }

    if (patch.packageName !== undefined) {
      const name = patch.packageName.trim();
      if (existing.packageSnapshot) {
        $set.packageSnapshot = { ...existing.packageSnapshot, name };
      } else {
        $set.packageSnapshot = {
          code: '',
          name,
          price: null,
          type: 'SERVICE',
        };
      }
    }

    if (Object.keys($set).length === 0) {
      throw new BadRequestException('Không có trường nào để cập nhật');
    }

    const doc = await this.model.findByIdAndUpdate(id, { $set }, { new: true }).lean().exec();
    if (!doc) {
      throw new NotFoundException('Lead không tồn tại');
    }
    return doc;
  }
}
