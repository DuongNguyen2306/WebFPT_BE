import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BannerDocument = HydratedDocument<Banner>;

@Schema({ timestamps: true, collection: 'banners' })
export class Banner {
  @Prop({ type: String, required: true, trim: true })
  imageUrl!: string;

  @Prop({ type: String, trim: true })
  title?: string;

  @Prop({ type: String, trim: true })
  subtitle?: string;

  @Prop({ type: Types.ObjectId, ref: 'Package', index: true })
  packageId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

BannerSchema.index({ isActive: 1, sortOrder: 1 });
