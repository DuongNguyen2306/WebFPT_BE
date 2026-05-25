import mongoose from 'mongoose';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { PackageSchema } from '../packages/package.schema';
import { AdminSchema, BuiltInAdminRole } from '../admins/admin.schema';
import { BillingCycle, PackageType } from '../common/enums';

dotenv.config();

const IMG = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

function buildPackages() {
  const rows: Array<{
    type: PackageType;
    code: string;
    name: string;
    displayCode?: string;
    shortDescription: string;
    price: number | null;
    priceNote?: string;
    billingCycle: BillingCycle;
    speedLabel?: string;
    features: string[];
    imageUrl: string;
    accentImageUrl?: string;
    metadata: Record<string, unknown>;
    isActive: boolean;
    sortOrder: number;
  }> = [];

  const types: PackageType[] = [
    PackageType.INTERNET,
    PackageType.SPEEDX,
    PackageType.FPT_PLAY,
    PackageType.CAMERA,
    PackageType.SERVICE,
  ];

  const labels: Record<PackageType, { name: string; speed?: string; tag: string }[]> = {
    [PackageType.INTERNET]: [
      { name: 'Internet Giga', speed: '1 Gbps', tag: 'Tốc độ cao, ổn định cho gia đình' },
      { name: 'Internet Giga Plus', speed: '2 Gbps', tag: 'Game & 4K, độ trễ thấp' },
      { name: 'Internet Sky', speed: '500 Mbps', tag: 'Tiết kiệm, đủ dùng học tập' },
      { name: 'Internet Meta', speed: '300 Mbps', tag: 'Gói phổ thông, lắp nhanh' },
    ],
    [PackageType.SPEEDX]: [
      { name: 'SpeedX 1', speed: 'Wi-Fi 6', tag: 'Mesh toàn nhà' },
      { name: 'SpeedX 2', speed: 'Wi-Fi 6E', tag: 'Ưu tiên thiết bị chơi game' },
      { name: 'SpeedX Pro', speed: '2 Gbps', tag: 'Backhaul wired' },
      { name: 'SpeedX Lite', speed: '300 Mbps', tag: 'Căn hộ nhỏ' },
    ],
    [PackageType.FPT_PLAY]: [
      { name: 'FPT Play K+', tag: 'Thể thao bản quyền' },
      { name: 'FPT Play HBO', tag: 'Phim bom tấn' },
      { name: 'FPT Play Family', tag: 'Kênh trẻ em' },
      { name: 'FPT Play Max', tag: 'Gói all-in' },
    ],
    [PackageType.CAMERA]: [
      { name: 'Camera Safe 2MP', tag: 'Góc rộng, xem đêm' },
      { name: 'Camera AI 4MP', tag: 'Nhận diện người' },
      { name: 'Camera Cloud', tag: 'Lưu trữ đám mây' },
      { name: 'Camera Kit 4 cam', tag: 'An ninh toàn diện' },
    ],
    [PackageType.SERVICE]: [
      { name: 'F-Safe', tag: 'Bảo mật & lọc web' },
      { name: 'Smarthome Basic', tag: 'Điều khiển thiết bị' },
      { name: 'Static IP', tag: 'IP tĩnh doanh nghiệp' },
      { name: 'Care 24/7', tag: 'Hỗ trợ ưu tiên' },
    ],
  };

  types.forEach((type) => {
    labels[type].forEach((item, idx) => {
      const n = idx + 1;
      const code = `${type.toLowerCase().replace(/_/g, '-')}-${n}`;
      rows.push({
        type,
        code,
        name: item.name,
        displayCode: `${type.replace('_', ' ')} ${n}`.toUpperCase(),
        shortDescription: item.tag,
        price: type === PackageType.SERVICE && n === 4 ? null : 199000 + n * 50000,
        priceNote: type === PackageType.SERVICE && n === 4 ? 'Liên hệ' : '/tháng',
        billingCycle: type === PackageType.SERVICE && n === 3 ? BillingCycle.ONCE : BillingCycle.MONTHLY,
        speedLabel: item.speed,
        features: ['Lắp đặt tại nhà', 'Hỗ trợ 24/7', 'Ưu đãi online'],
        imageUrl: IMG(code),
        accentImageUrl: IMG(`${code}-accent`),
        metadata:
          type === PackageType.INTERNET
            ? { downloadMbps: 1000 * n, uploadMbps: 500, promoBadge: 'Online only' }
            : { bundle: true },
        isActive: true,
        sortOrder: n,
      });
    });
  });

  return rows;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Thiếu MONGODB_URI');
  }
  await mongoose.connect(uri);
  const Package = mongoose.models.Package ?? mongoose.model('Package', PackageSchema);
  const Admin = mongoose.models.Admin ?? mongoose.model('Admin', AdminSchema);

  const packs = buildPackages();
  await Package.deleteMany({ code: { $in: packs.map((p) => p.code) } });
  await Package.insertMany(packs);

  const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMeAdmin123!';
  const passwordHash = await argon2.hash(password);
  const forceReset = process.env.ADMIN_FORCE_RESET_PASSWORD === 'true';
  const existing = await Admin.findOne({ email });
  if (!existing) {
    await Admin.create({
      email,
      passwordHash,
      role: BuiltInAdminRole.ADMIN,
    });
    console.log(`Đã tạo admin: ${email} (mật khẩu lưu hash trong DB)`);
  } else if (forceReset) {
    await Admin.updateOne({ email }, { $set: { passwordHash } });
    console.log(`Admin "${email}" — đã reset mật khẩu theo .env (ADMIN_FORCE_RESET_PASSWORD=true)`);
  } else {
    console.log(`Admin "${email}" đã tồn tại — giữ mật khẩu trong DB (không ghi đè .env)`);
  }

  console.log(`Đã seed ${packs.length} gói cước.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
