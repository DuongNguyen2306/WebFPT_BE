# Package API — Contract FE ↔ BE

API public trả **một shape thống nhất** (mapper `toPackageFeResponse`). Admin create/update chấp nhận alias FE (`heroImage`, `tagline`, `monthlyPrice`, …).

## Endpoints

| Mục đích | Method + path |
|----------|----------------|
| Danh sách theo loại | `GET /api/v1/packages?type=INTERNET\|SPEEDX\|FPT_PLAY\|CAMERA\|SERVICE` |
| Chi tiết theo code | `GET /api/v1/packages/by-code/:code` |
| Chi tiết theo id | `GET /api/v1/packages/:id` |

Chỉ gói `isActive: true` trên list public.

## Response — field gốc

| Field | Kiểu | Bắt buộc | Ghi chú |
|-------|------|----------|---------|
| `id` | string | Có | ObjectId |
| `code` | string | Có | Slug URL |
| `type` | enum | Có | INTERNET, SPEEDX, FPT_PLAY, CAMERA, SERVICE |
| `name` | string | Có | |
| `shortName` | string | Khuyến nghị | SpeedX carousel |
| `displayCode` | string | Khuyến nghị | Hero thẻ |
| `tagline` | string | Khuyến nghị | = `shortDescription` |
| `description` | string | Tùy chọn | Fallback 1 dòng chi tiết |
| `promoBadge` | string | Khuyến nghị | Dải KM trên thẻ |
| `price` / `monthlyPrice` | number \| null | Có* | *null = liên hệ |
| `heroImage` | string | Có | = `imageUrl` nội bộ |
| `accentImage` / `secondaryImage` | string | Tùy chọn | |
| `specCaption` | string | Tùy chọn | |
| `specLine` | string | Tùy chọn | Khi không có Mbps |
| `features` | string[] | Khuyến nghị mạnh | Alias: `bullets`, `featureList` |
| `statIcon` | string | Tùy chọn | gauge \| tv \| camera \| sparkles (default theo type) |
| `isActive` | boolean | Có | |
| `metadata` | object | Có | Xem bảng dưới |

## `metadata`

| Field | Kiểu | Dùng UI |
|-------|------|---------|
| `downloadMbps` | number | Thẻ ↓, ô tốc độ |
| `uploadMbps` | number | Thẻ ↑, ô tốc độ |
| `maxDevices` | number | Ô thiết bị (alias `maxConnectedDevices`) |
| `includedEquipment` | string[] hoặc `{ label, imageUrl? }[]` | “Nhận thêm trong gói” |
| `privileges` | string[] hoặc `{ title, description?, icon? }[]` | “Đặc quyền” |
| `audience` | string | Tab carousel: personal, family, gamer, … |
| `heroHeadline` | string | Thay copy cứng FE (phase 2) |
| `promoBadge` | string | Mirror root nếu cần |
| `pricePrefix` | string | VD: "Chỉ từ" |
| `lifestyleImageUrl` | string | Ảnh marketing |

## Ví dụ response (Internet Giga)

```json
{
  "id": "674abc...",
  "code": "internet-giga",
  "type": "INTERNET",
  "name": "Internet Giga",
  "displayCode": "INTERNET GIGA",
  "tagline": "Phù hợp với cá nhân, gia đình nhỏ",
  "promoBadge": "Giảm 50k khi thanh toán Online",
  "price": 195000,
  "monthlyPrice": 195000,
  "heroImage": "https://cdn.../giga-hero.jpg",
  "accentImage": "https://cdn.../modem.png",
  "isActive": true,
  "statIcon": "gauge",
  "features": ["Modem Wi-Fi 6", "Kết nối lên đến 10 thiết bị"],
  "metadata": {
    "downloadMbps": 300,
    "uploadMbps": 300,
    "maxDevices": 10,
    "includedEquipment": ["Modem Wi-Fi 6 băng tần kép"],
    "privileges": ["Trang bị thiết bị hiện đại", "Tốc độ 300 Mbps đối xứng"],
    "audience": "personal"
  }
}
```

## Seed data

File: `data/packages.seed.json` — import: `npm run seed:packages`

## Liên quan khác

- Lead: `POST /api/v1/leads` — `packageId` = `id` gói
- Auth: xem `docs/PROMPT-FE.md`
