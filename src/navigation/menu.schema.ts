import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MenuDocument = HydratedDocument<Menu>;

@Schema({ _id: false })
export class MenuItem {
  @Prop({ type: String, required: true, trim: true })
  label!: string;

  @Prop({ type: String, required: true, trim: true })
  link!: string;

  /** Mã gói (code) — FE có thể ưu tiên `/goi/:packageCode` khi có */
  @Prop({ type: String, trim: true })
  packageCode?: string;

  @Prop({ type: Number, default: 0 })
  displayOrder!: number;

  @Prop({ type: Boolean, default: false })
  isNew!: boolean;

  @Prop({ type: Boolean, default: true })
  isVisible!: boolean;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
MenuItemSchema.set('suppressReservedKeysWarning', true);

@Schema({ timestamps: true, collection: 'menus' })
export class Menu {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, trim: true, default: '' })
  icon!: string;

  @Prop({ type: Number, default: 0, index: true })
  displayOrder!: number;

  @Prop({ type: Boolean, default: true, index: true })
  isVisible!: boolean;

  @Prop({ type: [MenuItemSchema], default: [] })
  items!: MenuItem[];
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

MenuSchema.index({ isVisible: 1, displayOrder: 1 });
