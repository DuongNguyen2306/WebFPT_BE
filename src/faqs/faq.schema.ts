import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FaqDocument = HydratedDocument<Faq>;

@Schema({ timestamps: true, collection: 'faqs' })
export class Faq {
  @Prop({ type: String, required: true, trim: true })
  question!: string;

  @Prop({ type: String, required: true, trim: true })
  answer!: string;

  @Prop({ type: Number, default: 0, index: true })
  displayOrder!: number;

  @Prop({ type: Boolean, default: true, index: true })
  isVisible!: boolean;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);

FaqSchema.index({ isVisible: 1, displayOrder: 1 });
