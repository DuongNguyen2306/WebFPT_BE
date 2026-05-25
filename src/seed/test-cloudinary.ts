/**
 * Kiểm tra mạng + credentials Cloudinary (chạy: npm run test:cloudinary)
 */
import 'dotenv/config';
import * as dns from 'dns/promises';
import * as https from 'https';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const timeoutMs = Number(process.env.CLOUDINARY_TIMEOUT_MS ?? 60_000);

/** 1x1 PNG đỏ (68 bytes) */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function httpsHead(host: string, path = '/'): Promise<{ status?: number; ms: number; error?: string }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: host, path, method: 'GET', timeout: 20_000 },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode, ms: Date.now() - start });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ ms: Date.now() - start, error: 'timeout' });
    });
    req.on('error', (e) => resolve({ ms: Date.now() - start, error: e.message }));
    req.end();
  });
}

async function main() {
  console.log('=== Cloudinary diagnostic ===\n');

  console.log('1) Biến môi trường');
  console.log('   CLOUDINARY_CLOUD_NAME:', cloudName ? `${cloudName} (ok)` : 'THIẾU');
  console.log('   CLOUDINARY_API_KEY:', apiKey ? `${apiKey.slice(0, 4)}… (ok)` : 'THIẾU');
  console.log('   CLOUDINARY_API_SECRET:', apiSecret ? '*** (ok)' : 'THIẾU');
  console.log('   CLOUDINARY_TIMEOUT_MS:', timeoutMs);

  console.log('\n2) DNS');
  for (const host of ['api.cloudinary.com', 'res.cloudinary.com']) {
    try {
      const a = await dns.lookup(host);
      console.log(`   ${host} → ${a.address}`);
    } catch (e) {
      console.log(`   ${host} → LỖI: ${(e as Error).message}`);
    }
  }

  console.log('\n3) HTTPS (20s timeout)');
  for (const [host, path] of [
    ['api.cloudinary.com', '/v1_1/healthcheck'],
    ['res.cloudinary.com', '/'],
  ] as const) {
    const r = await httpsHead(host, path);
    if (r.error) console.log(`   ${host}${path} → FAIL (${r.ms}ms): ${r.error}`);
    else console.log(`   ${host}${path} → HTTP ${r.status} (${r.ms}ms)`);
  }

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('\n❌ Thiếu cấu hình Cloudinary trong .env');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    timeout: timeoutMs,
  });

  console.log('\n4) Upload thử ảnh 1x1 PNG (stream)');
  const start = Date.now();
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: process.env.CLOUDINARY_FOLDER ?? 'telecom-packages', resource_type: 'image', timeout: timeoutMs },
        (err, res) => (err ? reject(err) : resolve(res!)),
      );
      stream.end(TINY_PNG);
    });
    console.log(`   OK (${Date.now() - start}ms)`);
    console.log('   secure_url:', result.secure_url);
    console.log('   public_id:', result.public_id);
    console.log('\n✅ Cloudinary hoạt động — lỗi upload trước đó có thể do mạng tạm thời hoặc ảnh quá lớn.');
  } catch (err: unknown) {
    const e = err as { error?: { message?: string; http_code?: number; name?: string } };
    console.log(`   FAIL (${Date.now() - start}ms)`);
    console.log('   error:', JSON.stringify(e?.error ?? err, null, 2));
    console.log(
      '\n❌ Upload thất bại. Nếu timeout/499: máy không kết nối được api.cloudinary.com (firewall/VPN/ISP).',
    );
    console.log('   Thử: tắt VPN, hotspot, hoặc upload trực tiếp từ FE (unsigned preset).');
    process.exit(1);
  }
}

main();
