/**
 * Import gói từ data/packages.seed.json vào MongoDB.
 * Hỗ trợ field contract FE (heroImage, tagline, monthlyPrice, …).
 * Usage: npm run seed:packages
 */
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PackageSchema } from '../packages/package.schema';
import { normalizePackageInput } from '../packages/package-fe.mapper';

dotenv.config();

/** Bổ sung field FE khi file seed còn dùng tên cũ (imageUrl, deviceLimit, …) */
function enrichSeedRow(row: Record<string, unknown>): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    ...((row.metadata as Record<string, unknown>) ?? {}),
  };

  if (meta.maxDevices == null && meta.maxConnectedDevices == null) {
    if (typeof meta.deviceLimit === 'string') {
      const m = meta.deviceLimit.match(/(\d+)/);
      if (m) meta.maxDevices = Number(m[1]);
    }
  }

  const type = row.type as string;
  const hasSpeed =
    meta.downloadMbps != null ||
    meta.uploadMbps != null ||
    row.specLine != null;

  let specLine = row.specLine as string | undefined;
  if (!hasSpeed && (type === 'SPEEDX' || type === 'SERVICE') && !specLine) {
    specLine = 'Liên hệ tư vấn';
  }

  if (type === 'INTERNET' && meta.maxDevices == null) {
    meta.maxDevices = 10;
  }
  if (type === 'SPEEDX' && meta.maxDevices == null) {
    meta.maxDevices = 10;
  }

  const promoBadge = (row.promoBadge ?? meta.promoBadge) as string | undefined;

  return {
    ...row,
    tagline: row.tagline ?? row.shortDescription,
    heroImage: row.heroImage ?? row.imageUrl,
    accentImage: row.accentImage ?? row.accentImageUrl,
    promoBadge,
    specLine,
    metadata: meta,
  };
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Thiếu MONGODB_URI trong .env');
  }

  const jsonPath = path.join(process.cwd(), 'data', 'packages.seed.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy file: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const rows = JSON.parse(raw) as Record<string, unknown>[];
  const packages = rows.map((row) => {
    const normalized = normalizePackageInput(enrichSeedRow(row));
    if (!normalized.shortDescription) {
      throw new Error(`Gói ${row.code}: thiếu tagline hoặc shortDescription`);
    }
    if (!normalized.imageUrl) {
      throw new Error(`Gói ${row.code}: thiếu heroImage hoặc imageUrl`);
    }
    return normalized;
  });

  await mongoose.connect(uri);
  const Package =
    mongoose.models.Package ?? mongoose.model('Package', PackageSchema);

  const codes = packages.map((p) => p.code as string);
  const deleted = await Package.deleteMany({ code: { $in: codes } });
  console.log(`Đã xóa ${deleted.deletedCount} gói trùng code (nếu có).`);

  await Package.insertMany(packages);
  console.log(`Đã import ${packages.length} gói từ packages.seed.json.`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
