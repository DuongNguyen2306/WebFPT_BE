# PROMPT FE ĐẦY ĐỦ — Landing + Khách hàng + Admin + Cloudinary

**Copy toàn bộ file này** vào chat Cursor / agent FE (Vite + React). Backend NestJS đã chạy sẵn.

---

## 0. Thông tin kết nối

| | |
|---|---|
| **API base** | `http://localhost:3000/api/v1` |
| **Swagger** | http://localhost:3000/api/docs |
| **DB** | MongoDB `telecom_landing` — collection `packages` (20 gói seed), `leads`, `customers`, `admins` |
| **FE `.env`** | `VITE_API_URL=http://localhost:3000/api/v1` |

### Auth chung (BẮT BUỘC mọi app)

- **Access token:** JSON field `accessToken` → header `Authorization: Bearer <token>`
- **Refresh token:** cookie HttpOnly `refreshToken`, `path=/api/v1` — **JS không đọc được**
- Mọi request (kể cả public lead nếu có login): **`credentials: 'include'`** (fetch) hoặc **`withCredentials: true`** (axios)
- **Refresh:** `POST /auth/refresh` body rỗng → `{ accessToken, role, kind }` (`role`: `CUSTOMER` | `ADMIN`, `kind`: `customer` | `admin`)
- **Logout:** `POST /auth/logout`
- **Phiên hiện tại:** `GET /auth/session` (Bearer) → `{ role, kind, profile }` — dùng cho cả khách và admin
- Interceptor: **401** → refresh **1 lần** → retry → vẫn 401 → logout

### Phân role (BẮT BUỘC)

| Loại | Collection | Đăng nhập | `role` trong JWT / response |
|------|------------|-----------|-----------------------------|
| **Khách** | `customers` | `username` + `password` | `CUSTOMER` |
| **Admin** | `admins` | `email` + `password` | `ADMIN` |

- Lưu token khách và admin **tách key** (vd. `customerAccessToken` / `adminAccessToken`).
- Route `/me` chỉ khách (`CustomerRoleGuard`). Route `/admin/*` chỉ admin.

### Tài khoản dev

- **Admin:** `POST /admin/auth/login` — `{ "email": "admin1", "password": "123456" }` (theo `.env` BE)
- **Khách:** `POST /auth/register` — tự tạo username (vd. `duong79`), **không dùng SĐT làm tài khoản**

---

## PHẦN A — LANDING (trang chủ + chi tiết gói + form)

### A.1 Thay mock data

Xóa / không dùng `src/data/*.js` mock. Gọi API thật:

| Section UI | Query |
|------------|-------|
| Internet | `GET /packages?type=INTERNET` |
| SpeedX | `GET /packages?type=SPEEDX` |
| FPT Play | `GET /packages?type=FPT_PLAY` |
| Camera | `GET /packages?type=CAMERA` |
| Dịch vụ thêm | `GET /packages?type=SERVICE` |

Chi tiết gói: `GET /packages/by-code/:code` (ưu tiên URL `/goi/:code`) hoặc `GET /packages/:id`.

### A.2 Shape gói (Package) — contract FE

Mỗi phần tử trong mảng `GET /packages` có dạng (admin list dùng cùng shape trong `items[]`):

```ts
export type PackageType = 'INTERNET' | 'SPEEDX' | 'FPT_PLAY' | 'CAMERA' | 'SERVICE';

export interface PackageFe {
  id: string;
  code: string;
  type: PackageType;
  name: string;
  shortName?: string;
  displayCode?: string;
  tagline: string;
  description?: string;
  promoBadge?: string;
  price: number | null;
  monthlyPrice: number | null;
  priceNote?: string;
  heroImage: string;
  accentImage?: string;
  secondaryImage?: string;
  specCaption?: string;
  specLine?: string;
  speedLabel?: string;
  features: string[];
  bullets: string[];
  featureList: string[];
  statIcon: 'gauge' | 'tv' | 'camera' | 'sparkles';
  isActive: boolean;
  sortOrder?: number;
  metadata: PackageMetadata;
}

export interface PackageMetadata {
  pricePrefix?: string;
  downloadMbps?: number;
  uploadMbps?: number;
  maxDevices?: number;
  maxConnectedDevices?: number;
  includedEquipment?: (string | { label?: string; name?: string; imageUrl?: string })[];
  privileges?: (string | { title: string; description?: string; icon?: string })[];
  audience?: 'personal' | 'family' | 'gamer' | 'combo-camera' | 'combo-tv' | string;
  heroHeadline?: string;
  lifestyleImageUrl?: string;
  promo?: { text?: string; validUntil?: string };
}
```

**Gói mẫu đủ field UI:** `internet-sky-f1`, `internet-giga`, `speedx-mesh-pro` (mesh dùng `specLine`, không Mbps).

### A.3 Map UI landing → field

#### Thẻ gói (carousel / lưới)

| UI | Field |
|----|-------|
| Dải KM cam/xanh | `promoBadge` |
| Hero thẻ | `displayCode`, `tagline`, `heroImage`, `accentImage` |
| Tên + giá | `name`, `price` + `priceNote` (null → "Liên hệ") |
| Tốc độ | `metadata.downloadMbps`, `metadata.uploadMbps` hoặc `specLine` |
| Bullet | `features` (3–5 dòng) |
| Link chi tiết | `/goi/${code}` |

#### Trang chi tiết `/goi/:code`

| Khối | Field |
|------|-------|
| Breadcrumb | `type`, `name` |
| Banner | `heroImage` |
| Tiêu đề | `name` (SpeedX: `shortName` ?? `name`) |
| Ô Giá | `price`, `metadata.pricePrefix` |
| Ô Tốc độ | `metadata.downloadMbps` + `uploadMbps` hoặc `specLine` |
| Ô Thiết bị | `metadata.maxDevices` — **không hardcode ≥10** nếu BE đã gửi |
| Thông tin chi tiết ✓ | `features[]` |
| Nhận thêm trong gói | `metadata.includedEquipment` + `accentImage` |
| Đặc quyền | `metadata.privileges` |
| Sticky Đăng ký | `id`, `name`, `price` |

#### FE vẫn có thể hardcode (BE chưa có)

- Hero chữ "INTERNET CHO CÁ NHÂN" / "SPEEDX WI-FI 7" theo `type` (phase 2: `metadata.heroHeadline`)
- Ảnh stock gia đình nếu không có `metadata.lifestyleImageUrl`

### A.4 Form đăng ký / Lead

```http
POST /leads
Content-Type: application/json
credentials: include
Authorization: Bearer <token>   # optional — nếu khách đã login
```

```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0912345678",
  "installAddress": "123 Đường ABC, Q1, TP.HCM",
  "packageId": "<id từ GET /packages>"
}
```

- Validate SĐT VN: 10 số, đầu `03|05|07|08|09`
- Response: `{ "id", "status": "NEW", "createdAt" }`
- Rate limit BE: 5/15phút/IP, 3/giờ/SĐT → hiển thị toast nếu 429

### A.5 Auth khách hàng (modal Đăng nhập / Đăng ký)

**Không dùng SĐT / email làm đăng nhập.** Chỉ **username** + mật khẩu (+ họ tên khi đăng ký).

| | |
|---|---|
| Đăng ký | `POST /auth/register` — `{ username, password, fullName, email? }` |
| Đăng nhập | `POST /auth/login` — `{ username, password }` |
| Profile | `GET /me`, `PATCH /me` |
| Lead của tôi | `GET /me/leads?page=1&limit=20` |

**Response đăng ký / đăng nhập:**

```json
{
  "accessToken": "<jwt>",
  "role": "CUSTOMER",
  "user": {
    "id": "...",
    "username": "duong79",
    "fullName": "Dương",
    "email": null,
    "role": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

Cookie HttpOnly `refreshToken` được set tự động (credentials include).

**Validate username (FE — file `src/lib/username.js`):**

- 3–32 ký tự: `a-z`, `0-9`, `_` (lưu lowercase)
- Regex: `/^[a-z0-9_]{3,32}$/` sau khi `trim().toLowerCase()`
- Ví dụ hợp lệ: `duong79`, `user_01`
- Ví dụ không hợp lệ: `0794442282` (đó là SĐT lead, không phải username)

**Mật khẩu:** tối thiểu **8** ký tự (khớp BE).

**UI modal gợi ý:**

| Tab | Field |
|-----|-------|
| Đăng nhập | Tên đăng nhập, Mật khẩu |
| Đăng ký | Họ và tên, Tên đăng nhập, Mật khẩu |

**Không bắt buộc email** trên form đăng ký khách.

Lưu `accessToken` + `user` (có `username`); navbar hiển thị `user.fullName` hoặc `user.username`.

```ts
// src/lib/username.js
export function normalizeUsername(raw: string): string;
export function validateUsernameMessage(raw: string): string | null;
```

```ts
// src/api/authApi.js
registerCustomer({ username, password, fullName });
loginCustomer({ username, password });
// Sau success: setCustomerSession(data.accessToken, data.user)
```

---

## PHẦN B — ADMIN (`/admin/*`)

### B.1 Routes

```
/admin/login
/admin/packages              → bảng + filter
/admin/packages/new          → form tạo
/admin/packages/:id/edit     → form sửa
/admin/leads                 → bảng + filter
/admin/leads/:id             → drawer chi tiết (optional route)
```

Layout: sidebar (Gói cước | Lead), header email + Đăng xuất. Guard: chưa login → `/admin/login`.

### B.2 API client admin

```ts
// src/api/adminClient.ts
import axios from 'axios';

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

adminApi.interceptors.request.use((c) => {
  const t = sessionStorage.getItem('adminAccessToken');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
```

Files: `adminAuth.ts`, `adminPackages.ts`, `adminLeads.ts`, `adminUploads.ts`.

### B.3 Đăng nhập admin

```http
POST /admin/auth/login
{ "email": "admin1", "password": "123456" }
→ { accessToken, role: "ADMIN", admin: { id, email, role: "ADMIN" } }
```

```http
GET /admin/auth/me
Authorization: Bearer <admin token>
→ { id, email, role: "ADMIN" }
```

Lưu `sessionStorage.adminAccessToken`, `sessionStorage.adminUser`.

### B.4 CRUD gói

| Action | API |
|--------|-----|
| List | `GET /admin/packages?type=&isActive=&page=1&limit=20` |
| Create | `POST /admin/packages` |
| Update | `PATCH /admin/packages/:id` |
| Ẩn (soft delete) | `DELETE /admin/packages/:id` → `isActive: false` |
| Bật lại | `PATCH /admin/packages/:id` `{ "isActive": true }` |

Response list: `{ items: PackageFe[], total, page, limit }`.

**Body tạo/sửa** (alias được):

```json
{
  "type": "INTERNET",
  "code": "internet-giga",
  "name": "Internet Giga",
  "displayCode": "INTERNET GIGA",
  "tagline": "Phù hợp cá nhân, gia đình nhỏ",
  "promoBadge": "Giảm 50k khi thanh toán Online",
  "price": 195000,
  "billingCycle": "MONTHLY",
  "heroImage": "https://res.cloudinary.com/.../hero.jpg",
  "accentImage": "https://res.cloudinary.com/.../modem.png",
  "features": ["Modem Wi-Fi 6", "Kết nối 10 thiết bị"],
  "specLine": "Liên hệ tư vấn",
  "isActive": true,
  "sortOrder": 1,
  "metadata": {
    "downloadMbps": 300,
    "uploadMbps": 300,
    "maxDevices": 10,
    "includedEquipment": ["Modem Wi-Fi 6 băng tần kép"],
    "privileges": ["Trang bị thiết bị hiện đại"],
    "audience": "personal"
  }
}
```

`billingCycle`: `MONTHLY` | `ONCE` | `FREE`. `price: null` = Liên hệ.

### B.5 Upload ảnh Cloudinary (TRƯỚC khi lưu gói)

BE **không** nhận file trong `POST /admin/packages` — upload riêng, lấy `url` gán vào `heroImage` / `accentImage`.

#### Từ máy

```http
POST /admin/uploads/image
Authorization: Bearer <admin token>
Content-Type: multipart/form-data

file: <binary>
folder: packages/heroes   (optional)
```

Max **5MB**, JPEG/PNG/WebP/GIF.

```ts
const form = new FormData();
form.append('file', file);
form.append('folder', 'packages/heroes');
const { data } = await adminApi.post('/admin/uploads/image', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
setHeroImageUrl(data.url);
```

#### Từ URL có sẵn

```http
POST /admin/uploads/from-url
{ "url": "https://example.com/photo.jpg", "folder": "packages/modems" }
```

**Response cả hai:**

```json
{
  "url": "https://res.cloudinary.com/dgntcyf41/...",
  "publicId": "telecom-packages/xyz",
  "width": 800,
  "height": 600,
  "format": "jpg",
  "bytes": 120400,
  "folder": "telecom-packages"
}
```

#### UI form gói (admin)

- **Ảnh hero:** [Chọn file] → upload → preview + ô URL (readonly)
- **Ảnh phụ:** tương tự → `accentImage`
- Hoặc: ô "Dán URL ảnh" + nút "Đưa lên Cloudinary" → `from-url`
- Metadata equipment: mỗi item có thể `{ label, imageUrl }` sau upload

### B.6 Quản lý Lead

**List:** `GET /admin/leads?status=&from=&to=&phone=&page=&limit=`

```ts
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';

export interface Lead {
  _id: string;
  fullName: string;
  phone: string;
  installAddress: string;
  packageId?: string;
  packageSnapshot?: { code: string; name: string; price: number | null; type: string };
  customerId?: string | null;
  status: LeadStatus;
  source: string;
  ip?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Cập nhật:** `PATCH /admin/leads/:id`

```json
{ "status": "CONTACTED", "adminNote": "Gọi lại 18h" }
```

Badge: NEW (xanh) | CONTACTED (vàng) | CONVERTED (xanh đậm) | CANCELLED (xám).

**Không có:** tạo lead từ admin, xóa lead, CRUD khách, CRUD user admin.

---

## PHẦN C — Cấu trúc thư mục FE đề xuất

```
src/
  api/
    client.ts           # public axios + credentials
    adminClient.ts      # admin axios
    packages.ts
    leads.ts
    auth.ts
    adminAuth.ts
    adminPackages.ts
    adminLeads.ts
    adminUploads.ts
  hooks/
    usePackages.ts
    usePackageByCode.ts
  pages/
    Home.tsx
    PackageDetail.tsx   # /goi/:code
    admin/
      AdminLogin.tsx
      PackageList.tsx
      PackageForm.tsx
      LeadList.tsx
  components/
    PackageCard.tsx
    PackageDetailSections.tsx
    LeadForm.tsx
    ImageUploader.tsx   # Cloudinary flow
  types/
    package.ts
    lead.ts
```

---

## PHẦN D — Helper FE

```ts
export function formatVnd(price: number | null): string {
  if (price == null) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export function packageSpeedText(p: PackageFe): string | null {
  const d = p.metadata?.downloadMbps;
  const u = p.metadata?.uploadMbps;
  if (d != null && u != null) return `${d} Mbps / ${u} Mbps`;
  return p.specLine ?? p.speedLabel ?? null;
}

export function normalizeEquipment(
  items: PackageMetadata['includedEquipment'],
): { label: string; imageUrl?: string }[] {
  if (!items?.length) return [];
  return items.map((x) =>
    typeof x === 'string' ? { label: x } : { label: x.label ?? x.name ?? '', imageUrl: x.imageUrl },
  );
}
```

---

## PHẦN E — Checklist hoàn thành

### Landing
- [ ] 5 section gọi `GET /packages?type=...`
- [ ] Trang `/goi/:code` map đủ metadata (không fallback giả)
- [ ] Form lead + validate SĐT + `packageId`
- [ ] Đăng ký / đăng nhập khách (**username**, không SĐT) + refresh cookie
- [ ] `credentials` + Bearer đúng chỗ

### Admin
- [ ] Login / logout / refresh
- [ ] CRUD gói + soft delete + bật lại
- [ ] Upload Cloudinary (file + from-url) → gán URL form
- [ ] List/filter lead + patch status + adminNote

### Kỹ thuật
- [ ] `VITE_API_URL` trong `.env`
- [ ] Không hardcode JWT secret
- [ ] Loading / error / empty state
- [ ] Format VND + ngày vi-VN

---

## PHẦN F — Bảng endpoint tổng hợp

```
# Public
GET    /packages
GET    /packages/by-code/:code
GET    /packages/:id
POST   /leads

# Auth (khách + admin dùng chung refresh/logout)
POST   /auth/register      # body: username, password, fullName, email?
POST   /auth/login         # body: username, password
POST   /auth/refresh       # → accessToken, role, kind
POST   /auth/logout
GET    /auth/session       # Bearer → role, kind, profile
GET    /me
PATCH  /me
GET    /me/leads

# Admin
POST   /admin/auth/login
GET    /admin/auth/me
GET    /admin/packages
POST   /admin/packages
PATCH  /admin/packages/:id
DELETE /admin/packages/:id
POST   /admin/uploads/image
POST   /admin/uploads/from-url
GET    /admin/leads
PATCH  /admin/leads/:id
```

---

## PHẦN G — Ghi chú cho agent

1. Ưu tiên **axios** + interceptor refresh.
2. Tách token khách / admin trong `sessionStorage`.
3. Component `PackageCard` và `PackageDetail` dùng chung type `PackageFe`.
4. Admin form: upload ảnh **trước**, sau đó submit gói với URL Cloudinary.
5. Test nhanh: Swagger http://localhost:3000/api/docs
6. Không implement tính năng BE chưa có (hard delete, admin CRUD users, …).

**Kết thúc prompt.**
