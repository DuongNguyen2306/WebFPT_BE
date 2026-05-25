import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

export enum BuiltInAdminRole {
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true, collection: 'admins' })
export class Admin {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, trim: true })
  fullName?: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, enum: BuiltInAdminRole, default: BuiltInAdminRole.ADMIN })
  role!: BuiltInAdminRole;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
