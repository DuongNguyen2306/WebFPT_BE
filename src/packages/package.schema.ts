import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BillingCycle, PackageType } from '../common/enums';

export type PackageDocument = HydratedDocument<Package>;

@Schema({ timestamps: true, collection: 'packages' })
export class Package {
  @Prop({ type: String, enum: PackageType, required: true, index: true })
  type!: PackageType;

  @Prop({ type: String, required: true, unique: true, trim: true })
  code!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  shortName?: string;

  @Prop({ type: String, trim: true })
  displayCode?: string;

  /** Mô tả ngắn (legacy); API public trả thêm `tagline` */
  @Prop({ type: String, required: true, trim: true })
  shortDescription!: string;

  @Prop({ type: String, trim: true })
  tagline?: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String, trim: true })
  promoBadge?: string;

  @Prop({ type: Number, default: null })
  price!: number | null;

  @Prop({ type: String, trim: true })
  priceNote?: string;

  @Prop({ type: String, enum: BillingCycle, required: true })
  billingCycle!: BillingCycle;

  @Prop({ type: String, trim: true })
  speedLabel?: string;

  @Prop({ type: String, trim: true })
  specCaption?: string;

  @Prop({ type: String, trim: true })
  specLine?: string;

  @Prop({ type: String, trim: true })
  statIcon?: string;

  @Prop({ type: [String], default: [] })
  features!: string[];

  @Prop({ type: String, required: true, trim: true })
  imageUrl!: string;

  @Prop({ type: String, trim: true })
  accentImageUrl?: string;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;
}

export const PackageSchema = SchemaFactory.createForClass(Package);

PackageSchema.index({ type: 1, isActive: 1, sortOrder: 1 });
