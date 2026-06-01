import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PackageType } from '../common/enums';

export type PackageQuizDocument = HydratedDocument<PackageQuiz>;

@Schema({ _id: false })
export class QuizTypeWeight {
  @Prop({ type: String, enum: PackageType, required: true })
  packageType!: PackageType;

  @Prop({ type: Number, default: 1, min: 0 })
  weight!: number;
}

export const QuizTypeWeightSchema = SchemaFactory.createForClass(QuizTypeWeight);

@Schema({ _id: false })
export class QuizOption {
  @Prop({ type: String, required: true, trim: true })
  code!: string;

  @Prop({ type: String, required: true, trim: true })
  label!: string;

  @Prop({ type: String, trim: true, default: '' })
  icon!: string;

  @Prop({ type: Number, default: 0 })
  displayOrder!: number;

  @Prop({ type: Boolean, default: true })
  isVisible!: boolean;

  @Prop({ type: [QuizTypeWeightSchema], default: [] })
  typeWeights!: QuizTypeWeight[];
}

export const QuizOptionSchema = SchemaFactory.createForClass(QuizOption);

@Schema({ _id: false })
export class QuizQuestion {
  @Prop({ type: String, required: true, trim: true })
  code!: string;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Boolean, default: true })
  multiSelect!: boolean;

  @Prop({ type: Number, default: 0 })
  displayOrder!: number;

  @Prop({ type: Boolean, default: true })
  isVisible!: boolean;

  @Prop({ type: [QuizOptionSchema], default: [] })
  options!: QuizOption[];
}

export const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ timestamps: true, collection: 'package_quizzes' })
export class PackageQuiz {
  @Prop({ type: String, required: true, unique: true, trim: true })
  code!: string;

  @Prop({ type: String, trim: true })
  tagline?: string;

  @Prop({ type: String, trim: true, default: 'wifi' })
  icon!: string;

  @Prop({ type: Boolean, default: true, index: true })
  isVisible!: boolean;

  @Prop({ type: Number, default: 0, index: true })
  displayOrder!: number;

  @Prop({ type: [QuizQuestionSchema], default: [] })
  questions!: QuizQuestion[];
}

export const PackageQuizSchema = SchemaFactory.createForClass(PackageQuiz);

PackageQuizSchema.index({ isVisible: 1, displayOrder: 1 });
