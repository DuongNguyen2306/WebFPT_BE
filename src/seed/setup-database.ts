/**
 * Thiết lập lại database app (telecom_landing):
 * - Xóa sạch: packages, admins, customers, leads, menus
 * - Import gói từ data/packages.seed.json + menu từ data/menus.seed.json
 * - Tạo admin theo ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD
 *
 * Usage: npm run db:setup
 */
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { PackageSchema } from '../packages/package.schema';
import { AdminSchema, BuiltInAdminRole } from '../admins/admin.schema';
import { CustomerSchema } from '../customers/customer.schema';
import { LeadSchema } from '../leads/lead.schema';
import { MenuSchema } from '../navigation/menu.schema';
import { PackageQuizSchema } from '../package-quiz/package-quiz.schema';
import { normalizePackageInput } from '../packages/package-fe.mapper';
dotenv.config();

const APP_COLLECTIONS = ['packages', 'admins', 'customers', 'leads', 'menus', 'package_quizzes'] as const;

function buildUriWithDb(baseUri: string, dbName: string): string {
  const qIndex = baseUri.indexOf('?');
  const query = qIndex >= 0 ? baseUri.slice(qIndex) : '';
  const withoutQuery = qIndex >= 0 ? baseUri.slice(0, qIndex) : baseUri;
  const lastSlash = withoutQuery.lastIndexOf('/');
  const prefix =
    lastSlash > 'mongodb://'.length ? withoutQuery.slice(0, lastSlash) : withoutQuery.replace(/\/$/, '');
  return `${prefix}/${dbName}${query}`;
}

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
    meta.downloadMbps != null || meta.uploadMbps != null || row.specLine != null;

  let specLine = row.specLine as string | undefined;
  if (!hasSpeed && (type === 'SPEEDX' || type === 'SERVICE') && !specLine) {
    specLine = 'Liên hệ tư vấn';
  }

  if (type === 'INTERNET' && meta.maxDevices == null) meta.maxDevices = 10;
  if (type === 'SPEEDX' && meta.maxDevices == null) meta.maxDevices = 10;

  const promoBadge = (row.promoBadge ?? meta.promoBadge) as string | undefined;

  return {
    ...row,
    tagline: row.tagline ?? row.shortDescription,
    heroImage: row.heroImage ?? row.imageUrl,
    bannerImage: row.bannerImage ?? row.bannerImageUrl,
    accentImage: row.accentImage ?? row.accentImageUrl,
    promoBadge,
    specLine,
    metadata: meta,
  };
}

async function countDocs(conn: mongoose.Connection, name: string) {
  if (!conn.db) return 0;
  const cols = await conn.db.listCollections({ name }).toArray();
  if (!cols.length) return 0;
  return conn.db.collection(name).countDocuments();
}

async function run() {
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) throw new Error('Thiếu MONGODB_URI trong .env');

  const targetDb = 'telecom_landing';
  const uri = buildUriWithDb(baseUri, targetDb);

  const jsonPath = path.join(process.cwd(), 'data', 'packages.seed.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy: ${jsonPath}`);
  }

  console.log('=== Thiết lập lại database ===\n');
  console.log(`Database: ${targetDb}`);
  console.log(`URI: ${uri.replace(/:[^:@/]+@/, ':****@')}\n`);

  const conn = await mongoose.createConnection(uri).asPromise();
  const Package = conn.model('Package', PackageSchema);
  const Admin = conn.model('Admin', AdminSchema);
  const Menu = conn.model('Menu', MenuSchema);
  const PackageQuiz = conn.model('PackageQuiz', PackageQuizSchema);
  conn.model('Customer', CustomerSchema);
  conn.model('Lead', LeadSchema);

  console.log('--- Trước khi reset ---');
  for (const c of APP_COLLECTIONS) {
    console.log(`  ${c}: ${await countDocs(conn, c)}`);
  }

  console.log('\n--- Xóa dữ liệu app ---');
  for (const c of APP_COLLECTIONS) {
    if (!conn.db) continue;
    const r = await conn.db.collection(c).deleteMany({});
    console.log(`  ${c}: đã xóa ${r.deletedCount} document`);
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

  await Package.insertMany(packages);
  console.log(`\n--- Packages: đã import ${packages.length} gói ---`);

  const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin1').toLowerCase().trim();
  const password = process.env.ADMIN_SEED_PASSWORD ?? '123456';
  const passwordHash = await argon2.hash(password);
  await Admin.create({
    email,
    passwordHash,
    role: BuiltInAdminRole.ADMIN,
  });
  console.log(`--- Admin: "${email}" / mật khẩu theo ADMIN_SEED_PASSWORD ---`);

  const menusPath = path.join(process.cwd(), 'data', 'menus.seed.json');
  if (fs.existsSync(menusPath)) {
    const menuRows = JSON.parse(fs.readFileSync(menusPath, 'utf-8')) as Record<string, unknown>[];
    await Menu.insertMany(menuRows);
    console.log(`--- Menus: đã import ${menuRows.length} nhóm menu ---`);
  } else {
    console.log('--- Menus: bỏ qua (không có menus.seed.json) ---');
  }

  const quizPath = path.join(process.cwd(), 'data', 'package-quiz.seed.json');
  if (fs.existsSync(quizPath)) {
    const quizRows = JSON.parse(fs.readFileSync(quizPath, 'utf-8')) as Record<string, unknown>[];
    await PackageQuiz.insertMany(quizRows);
    console.log(`--- Package quiz: đã import ${quizRows.length} bộ câu hỏi ---`);
  } else {
    console.log('--- Package quiz: bỏ qua (không có package-quiz.seed.json) ---');
  }

  console.log('\n--- Sau khi setup ---');
  for (const c of APP_COLLECTIONS) {
    console.log(`  ${c}: ${await countDocs(conn, c)}`);
  }

  console.log('\nĐăng nhập admin: POST /api/v1/admin/auth/login');
  console.log(`  { "email": "${email}", "password": "<ADMIN_SEED_PASSWORD>" }`);
  console.log('\nMenu public: GET /api/v1/navigation');
  console.log('Quiz public: GET /api/v1/package-quiz?code=home-needs');
  console.log('Import riêng: npm run seed:navigation | npm run seed:package-quiz\n');

  await conn.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
