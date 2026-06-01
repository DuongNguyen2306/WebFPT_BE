/**
 * Import bộ câu hỏi gợi ý loại gói từ data/package-quiz.seed.json
 * Usage: npm run seed:package-quiz
 */
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PackageQuizSchema } from '../package-quiz/package-quiz.schema';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI');

  const file = path.join(process.cwd(), 'data', 'package-quiz.seed.json');
  if (!fs.existsSync(file)) throw new Error(`Không tìm thấy ${file}`);
  const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>[];

  await mongoose.connect(uri);
  const PackageQuiz = mongoose.models.PackageQuiz ?? mongoose.model('PackageQuiz', PackageQuizSchema);

  for (const row of rows) {
    const code = String(row.code ?? '').trim();
    await PackageQuiz.findOneAndUpdate({ code }, { $set: row }, { upsert: true });
  }

  console.log(`Đã upsert ${rows.length} bộ câu hỏi từ package-quiz.seed.json`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
