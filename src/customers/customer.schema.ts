import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CustomerStatus } from '../common/enums';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ timestamps: true, collection: 'customers' })
export class Customer {
  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true })
  username!: string;

  @Prop({ type: String, trim: true, sparse: true, unique: true })
  email?: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, required: true, trim: true })
  fullName!: string;

  /** SĐT liên hệ / tra cứu đơn — dùng ghép lịch sử đăng ký theo phone */
  @Prop({ type: String, trim: true, sparse: true, index: true })
  phone?: string;

  @Prop({ type: String, trim: true })
  defaultAddress?: string;

  /** Khách không có role trong DB — quyền CUSTOMER chỉ trong JWT khi đăng nhập */

  @Prop({ type: String, enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status!: CustomerStatus;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
