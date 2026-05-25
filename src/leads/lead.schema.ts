import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { LeadStatus } from '../common/enums';

export type LeadDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  @Prop({ type: String, required: true, trim: true })
  fullName!: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  phone!: string;

  @Prop({ type: String, required: true, trim: true })
  installAddress!: string;

  @Prop({ type: Types.ObjectId, ref: 'Package', default: null })
  packageId!: Types.ObjectId | null;

  @Prop({ type: Object, default: null })
  packageSnapshot!: {
    code: string;
    name: string;
    price: number | null;
    type: string;
  } | null;

  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null })
  customerId!: Types.ObjectId | null;

  @Prop({ type: String, enum: LeadStatus, default: LeadStatus.NEW, index: true })
  status!: LeadStatus;

  @Prop({ type: String, default: 'WEB', trim: true })
  source!: string;

  @Prop({ type: String, trim: true })
  ip?: string;

  @Prop({ type: String, trim: true })
  adminNote?: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

LeadSchema.index({ phone: 1, createdAt: -1 });
LeadSchema.index({ status: 1, createdAt: -1 });
