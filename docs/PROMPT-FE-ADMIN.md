# Prompt — Màn hình Admin (Vite + React)

> **Gộp landing + admin + upload:** dùng **[PROMPT-FE-FULL.md](./PROMPT-FE-FULL.md)** (khuyến nghị).

Copy toàn bộ khối dưới vào chat Cursor / agent FE (repo landing đã có hoặc tạo app admin riêng).

---

## Mục tiêu

Xây **khu vực quản trị** (route `/admin/*`) cho nhân viên FPT-style:

1. **Đăng nhập admin** (email + password)
2. **CRUD gói cước** (Create, Read, Update, soft Delete)
3. **Quản lý lead** (danh sách, lọc, cập nhật trạng thái + ghi chú)
4. **Upload ảnh Cloudinary** (từ máy hoặc URL) — gán URL vào `heroImage` / `accentImage` khi CRUD gói

**Không** có trong BE hiện tại (đừng làm UI trừ khi mock): CRUD khách hàng, CRUD tài khoản admin, hard delete gói/lead, tạo lead từ admin.

---

## Backend đã sẵn sàng

| Hạng mục | Giá trị |
|----------|--------|
| Base URL | `import.meta.env.VITE_API_URL` → `http://localhost:3000/api/v1` |
| Swagger | `http://localhost:3000/api/docs` |
| Contract gói (field FE) | `docs/PACKAGE_API_CONTRACT.md` |
| Auth admin | Access token JSON + refresh **HttpOnly cookie** |

### Auth (bắt buộc)

- **Login:** `POST /admin/auth/login`  
  Body: `{ "email": "admin@example.com", "password": "..." }`  
  Response: `{ accessToken, admin: { id, email, role: "ADMIN" } }` + Set-Cookie `refreshToken`
- **Mọi request admin:** `Authorization: Bearer <accessToken>` + **`credentials: 'include'`**
- **Refresh:** `POST /auth/refresh` (dùng chung endpoint khách — đọc cookie)
- **Logout:** `POST /auth/logout` (xóa cookie refresh)
- Lưu `accessToken` + `admin` trong memory hoặc `sessionStorage` (không localStorage nếu lo XSS)
- Route guard: chưa login → `/admin/login`; token hết hạn → refresh 1 lần → fail → logout

**Tài khoản seed (dev):** xem `.env` backend `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` (vd. `admin1` / `123456` sau seed).

---

## Cấu trúc route FE đề xuất

```
/admin/login          → form đăng nhập
/admin                → redirect → /admin/packages
/admin/packages       → bảng danh sách gói
/admin/packages/new   → form tạo gói
/admin/packages/:id/edit → form sửa gói
/admin/leads          → bảng lead + filter
/admin/leads/:id      → drawer/modal chi tiết + đổi status
```

Layout: sidebar (Gói cước, Lead), header (email admin, Đăng xuất).

---

## Module 1 — API client admin

Tạo `src/api/adminClient.ts` (axios khuyến nghị):

```ts
import axios from 'axios';

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

adminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminAccessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → POST /auth/refresh → retry (tối đa 1 lần)
```

Tách file:

- `src/api/adminAuth.ts` — login, logout, refresh
- `src/api/adminPackages.ts` — CRUD packages
- `src/api/adminLeads.ts` — list, patch lead

---

## Module 2 — Quản lý gói cước (CRUD)

### 2.1 Danh sách — `GET /admin/packages`

**Query:**

| Param | Kiểu | Mô tả |
|-------|------|--------|
| `type` | `INTERNET \| SPEEDX \| FPT_PLAY \| CAMERA \| SERVICE` | Lọc loại |
| `isActive` | `true \| false` | Lọc trạng thái (bỏ qua = tất cả) |
| `page` | number | Mặc định 1 |
| `limit` | number | Mặc định 20, max 100 |

**Response:**

```json
{
  "items": [ /* Package FE shape — xem PACKAGE_API_CONTRACT.md */ ],
  "total": 20,
  "page": 1,
  "limit": 20
}
```

**UI bảng cột gợi ý:** `displayCode` / `name`, `type`, `code`, `price` (format VND hoặc "Liên hệ" nếu null), `isActive` (badge), `sortOrder`, actions (Sửa, Ẩn).

**Filter bar:** select `type`, select `isActive` (Tất cả / Đang bán / Đã ẩn), nút "Thêm gói".

**Phân trang:** `page`, `limit`, hiển thị `total`.

### 2.2 Tạo gói — `POST /admin/packages`

Body chấp nhận **alias FE** (BE normalize):

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `type` | Có | enum 5 loại |
| `code` | Có | slug unique, vd. `internet-giga` |
| `name` | Có | |
| `billingCycle` | Có | `MONTHLY \| ONCE \| FREE` |
| `heroImage` hoặc `imageUrl` | Có | URL ảnh |
| `tagline` hoặc `shortDescription` | Có | Mô tả ngắn |
| `features` | Khuyến nghị | `string[]`, ≥ 1 dòng |
| `price` / `monthlyPrice` | Có* | `null` = liên hệ |
| `displayCode`, `shortName`, `promoBadge`, `description` | Tùy chọn | |
| `accentImage` | Tùy chọn | |
| `specCaption`, `specLine` | Tùy chọn | `specLine` khi không có Mbps |
| `statIcon` | Tùy chọn | gauge \| tv \| camera \| sparkles |
| `isActive` | Tùy chọn | default `true` |
| `sortOrder` | Tùy chọn | default `0` |
| `metadata` | Khuyến nghị | object — xem bảng dưới |

**`metadata` form (Internet/SpeedX):**

```json
{
  "downloadMbps": 300,
  "uploadMbps": 300,
  "maxDevices": 10,
  "includedEquipment": ["Modem Wi-Fi 6", "ONT 1G"],
  "privileges": ["Trang bị thiết bị hiện đại", "Hỗ trợ 24/7"],
  "audience": "personal"
}
```

Hoặc `includedEquipment` / `privileges` dạng object (phase 2):

```json
"privileges": [{ "title": "...", "description": "...", "icon": "wifi" }]
```

**Form UX:**

- Tab/section: Thông tin cơ bản | Giá & tốc độ | Nội dung (features) | Metadata JSON hoặc field con
- Preview thẻ gói (optional) dùng cùng component landing
- Submit → toast thành công → redirect list
- Lỗi 409/400 → hiển thị message BE

### 2.3 Sửa gói — `PATCH /admin/packages/:id`

- `GET` chi tiết: dùng `GET /packages/:id` (public, chỉ active) **hoặc** lấy từ list admin (đã có cả `isActive: false`)
- Gửi `PATCH` partial body (cùng field như POST)
- Response: object gói đã map FE shape

### 2.4 Xóa (ẩn) gói — `DELETE /admin/packages/:id`

- **Soft delete:** BE đặt `isActive: false`, **không xóa DB**
- UI: confirm "Ẩn gói khỏi website?" — không dùng từ "Xóa vĩnh viễn"
- Sau delete: refresh list hoặc badge "Đã ẩn"
- Cho phép **bật lại:** `PATCH` `{ "isActive": true }`

### 2.5 Upload ảnh (Cloudinary) — trước khi lưu gói

BE **không** lưu file trên server — chỉ upload lên **Cloudinary** và trả **URL**. Admin form gói: chọn ảnh máy **hoặc** dán URL → gọi API upload → điền `heroImage` / `accentImage` bằng `url` trả về.

**Cấu hình BE (`.env`):** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` (mặc định `telecom-packages`).

#### Upload từ máy

```http
POST /admin/uploads/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Field | Mô tả |
|-------|--------|
| `file` | File ảnh (bắt buộc), max **5MB**, JPEG/PNG/WebP/GIF |
| `folder` | Tùy chọn, vd. `packages/heroes` |

**Response:**

```json
{
  "url": "https://res.cloudinary.com/.../image/upload/v123/telecom-packages/abc.jpg",
  "publicId": "telecom-packages/abc",
  "width": 800,
  "height": 600,
  "format": "jpg",
  "bytes": 120400,
  "folder": "telecom-packages"
}
```

**FE (axios):**

```ts
const form = new FormData();
form.append('file', file);
form.append('folder', 'packages/heroes');
await adminApi.post('/admin/uploads/image', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
// setHeroImage(res.data.url)
```

#### Upload từ URL có sẵn

```http
POST /admin/uploads/from-url
Content-Type: application/json

{ "url": "https://example.com/photo.jpg", "folder": "packages/modems" }
```

Cùng shape response như trên.

#### Form gói — UI gợi ý

- **Ảnh hero:** nút "Chọn từ máy" | ô "Dán URL ảnh" + nút "Tải lên Cloudinary" | preview thumbnail
- **Ảnh phụ (modem):** tương tự → `accentImage`
- Thiết bị kèm (`metadata.includedEquipment`): mỗi dòng có thể upload ảnh nhỏ → lưu `{ label, imageUrl }` trong metadata (BE đã hỗ trợ object[])

**Lưu gói:** vẫn `POST/PATCH /admin/packages` với `heroImage: "<url từ Cloudinary>"` — không gửi file trong body gói.

---

## Module 3 — Quản lý lead

### 3.1 Danh sách — `GET /admin/leads`

**Query:**

| Param | Mô tả |
|-------|--------|
| `status` | `NEW \| CONTACTED \| CONVERTED \| CANCELLED` |
| `from`, `to` | ISO date — lọc `createdAt` |
| `phone` | Tìm SĐT (BE chuẩn hóa VN) |
| `page`, `limit` | Phân trang |

**Response:**

```json
{
  "items": [
    {
      "_id": "...",
      "fullName": "...",
      "phone": "0912345678",
      "installAddress": "...",
      "packageId": "...",
      "packageSnapshot": { "code", "name", "price", "type" },
      "customerId": null,
      "status": "NEW",
      "source": "WEB",
      "ip": "...",
      "adminNote": "",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**UI bảng:** Ngày tạo, Họ tên, SĐT, Gói (`packageSnapshot.name` hoặc "—"), Địa chỉ (rút gọn), Status (badge màu), Actions (Chi tiết).

**Filter:** status, khoảng ngày (date range → `from`/`to`), ô tìm phone.

**Badge màu gợi ý:**

| status | Màu | Label |
|--------|-----|-------|
| NEW | xanh | Mới |
| CONTACTED | vàng | Đã liên hệ |
| CONVERTED | xanh đậm | Chốt |
| CANCELLED | xám | Hủy |

### 3.2 Cập nhật lead — `PATCH /admin/leads/:id`

Body (một hoặc cả hai):

```json
{
  "status": "CONTACTED",
  "adminNote": "Gọi lại 18h, khách quan tâm gói Sky F1"
}
```

**UI chi tiết (drawer/modal):**

- Hiển thị đủ field read-only: họ tên, phone, địa chỉ, snapshot gói, IP, source, `customerId` (có/không)
- Select đổi `status`
- Textarea `adminNote`
- Nút Lưu → `PATCH` → đóng + refresh row

---

## Module 4 — Types TypeScript (gợi ý)

```ts
export type PackageType = 'INTERNET' | 'SPEEDX' | 'FPT_PLAY' | 'CAMERA' | 'SERVICE';
export type BillingCycle = 'MONTHLY' | 'ONCE' | 'FREE';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';

export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN';
}

export interface PackageFe { /* copy từ PACKAGE_API_CONTRACT.md */ }

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Lead {
  _id: string;
  fullName: string;
  phone: string;
  installAddress: string;
  packageId?: string;
  packageSnapshot?: { code: string; name: string; price: number | null; type: string };
  customerId?: string;
  status: LeadStatus;
  source: string;
  ip?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Module 5 — State & UX chung

- **Loading / error** mỗi trang (skeleton bảng, toast lỗi)
- **Empty state** khi `items.length === 0`
- **Format giá:** `new Intl.NumberFormat('vi-VN').format(price) + 'đ'`
- **Format ngày:** `vi-VN` locale
- Responsive: bảng scroll ngang mobile
- Không log password; không hiển thị `passwordHash`

---

## Checklist hoàn thành (Definition of Done)

- [ ] Login admin, refresh cookie, logout
- [ ] Guard `/admin/*` trừ `/admin/login`
- [ ] List packages + filter + pagination
- [ ] Create package (form đủ field MVP + metadata)
- [ ] Edit package
- [ ] Soft delete + khôi phục `isActive: true`
- [ ] List leads + filter status/date/phone + pagination
- [ ] Patch lead status + adminNote
- [ ] Axios/fetch `withCredentials` + Bearer
- [ ] Env `VITE_API_URL` documented trong README FE

---

## Tham chiếu nhanh endpoint

```
POST   /admin/auth/login
POST   /auth/refresh
POST   /auth/logout

POST   /admin/uploads/image          # multipart file
POST   /admin/uploads/from-url       # JSON { url, folder? }

GET    /admin/packages?type=&isActive=&page=&limit=
POST   /admin/packages
PATCH  /admin/packages/:id
DELETE /admin/packages/:id          # soft → isActive false

GET    /admin/leads?status=&from=&to=&phone=&page=&limit=
PATCH  /admin/leads/:id
```

---

## Ghi chú tích hợp landing

- Component **preview gói** có thể tái dùng type `PackageFe` từ contract chung
- Admin form nên dùng cùng enum `type` với landing sections
- Sau khi admin sửa gói, landing `GET /packages` thấy ngay (không cache CDN lâu ở dev)

Kết thúc prompt.
