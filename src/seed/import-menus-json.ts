/**
 * Import menu điều hướng từ data/menus.seed.json
 * Usage: npm run seed:navigation
 */
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { MenuSchema } from '../navigation/menu.schema';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI');

  const file = path.join(process.cwd(), 'data', 'menus.seed.json');
  if (!fs.existsSync(file)) throw new Error(`Không tìm thấy ${file}`);
  const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>[];

  await mongoose.connect(uri);
  const Menu = mongoose.models.Menu ?? mongoose.model('Menu', MenuSchema);

  await Menu.deleteMany({});
  await Menu.insertMany(rows);
  console.log(`Đã import ${rows.length} nhóm menu từ menus.seed.json`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
