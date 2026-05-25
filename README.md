# Telecom Landing API

Backend **NestJS 10** + **Mongoose** + **MongoDB** cho landing đăng ký dịch vụ (Internet, SpeedX, FPT Play, Camera, dịch vụ thêm): gói cước public, thu thập **lead**, đăng ký/đăng nhập **khách hàng**, khu vực **admin** quản lý gói & lead.

- **Base URL API**: `/api/v1`
- **OpenAPI (Swagger UI)**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs) (sau khi chạy `npm run start:dev`)

## Biến môi trường

Sao chép `.env.example` → `.env` và chỉnh giá trị.

| Biến | Mô tả |
|------|--------|
| `PORT` | Cổng HTTP (mặc định `3000`) |
| `MONGODB_URI` | Chuỗi kết nối MongoDB 6+ |
| `JWT_ACCESS_SECRET` | Secret ký **access token** (nên ≥ 32 ký tự) |
| `JWT_REFRESH_SECRET` | Secret ký **refresh token** (khác access) |
| `JWT_ACCESS_EXPIRES` | TTL access, ví dụ `15m` |
| `JWT_REFRESH_EXPIRES` | TTL refresh, ví dụ `7d` |
| `FRONTEND_ORIGINS` | Danh sách origin CORS, phân tách bằng dấu phẩy (Vite: `http://localhost:5173`) |
| `ADMIN_SEED_EMAIL` | Email admin dùng cho `npm run seed` |
| `ADMIN_SEED_PASSWORD` | Mật khẩu admin seed |
| `CLOUDINARY_CLOUD_NAME` | Cloud name (upload ảnh admin) |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |
| `CLOUDINARY_FOLDER` | Thư mục mặc định trên Cloudinary (vd. `telecom-packages`) |

### Upload ảnh gói (Cloudinary)

Admin (Bearer). **Không lưu file vào MongoDB** — chỉ lưu URL Cloudinary trong document gói.

**Cách 1 — một request (khuyến nghị):**

`POST /api/v1/admin/packages/with-image` — `multipart/form-data`

| Field | Mô tả |
|-------|--------|
| `file` | Ảnh chính (hero) → upload Cloudinary → `imageUrl` |
| `accentFile` | Ảnh phụ (tuỳ chọn) |
| `type` hoặc `category` | `INTERNET`, `internet`, `play`, … |
| `code`, `name`, `tagline`, `price`, `billingCycle`, `features`, `speed` / `speedLabel`, … | Text form |
| `folder` | Thư mục Cloudinary (tuỳ chọn) |

**Cách 2 — hai bước:**

1. `POST /api/v1/admin/uploads/image` — field `file` → `{ url, publicId, … }`
2. `POST /api/v1/admin/packages` — JSON body, gán `heroImage` / `accentImage` = `url`

- `POST /api/v1/admin/uploads/from-url` — body `{ "url": "https://..." }`

## Auth JWT — cách triển khai đã chọn

- **Access token**: trả trong JSON (`accessToken`) khi `POST /auth/register`, `POST /auth/login`, và `POST /auth/refresh`. FE gửi header `Authorization: Bearer <accessToken>` cho các route bảo vệ.
- **Refresh token**: JWT riêng, đặt trong cookie **HttpOnly** tên `refreshToken`, `path=/api/v1`, `SameSite=Lax`, `Secure` khi `NODE_ENV=production`. FE cần gọi refresh với `credentials: 'include'` (fetch) hoặc `withCredentials: true` (axios).
- **POST `/api/v1/auth/refresh`**: đọc refresh từ cookie, trả `accessToken` mới (dùng chung cho khách và admin).
- **POST `/api/v1/auth/logout`**: xóa cookie refresh.
- Mật khẩu lưu bằng **argon2**.

**Phân role & tài khoản**

| Loại | Collection | Đăng nhập | `role` trong JWT / response |
|------|------------|-----------|-----------------------------|
| Khách | `customers` (username + mật khẩu) | `POST /auth/register`, `POST /auth/login` | `CUSTOMER` |
| Admin | `admins` (email + mật khẩu) | `POST /admin/auth/login` | `ADMIN` |

- JWT access chứa `sub`, `kind` (`customer` \| `admin`), `role` (`CUSTOMER` \| `ADMIN`).
- Route khách (`/me`, …) dùng `CustomerRoleGuard`; route admin (`/admin/*`) dùng `AdminRoleGuard` — token sai loại → **403**.
- `GET /auth/session` — đọc profile theo access token (cả khách và admin).
- `GET /me` — chỉ khách; `GET /admin/auth/me` — chỉ admin.
- **Mật khẩu đăng nhập** luôn lấy từ MongoDB (`passwordHash` trong `admins` / `customers`), **không** đọc `.env` khi login.
- Tạo admin lần đầu: `npm run seed:admin` (chỉ khi chưa có email đó). Ghi đè mật khẩu DB bằng .env: `ADMIN_FORCE_RESET_PASSWORD=true npm run seed:admin`.
- Đổi mật khẩu trong Compass: `npm run hash:password -- MatKhauMoi` → copy hash vào field `passwordHash`.

## Chạy local

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run start:dev
```

MongoDB phải chạy và khớp `MONGODB_URI`.

### Thiết lập lại database (khuyến nghị)

Xóa sạch 4 collection app và import lại gói + admin (theo `.env`):

```bash
npm run db:setup
```

Sau đó restart API: `npm run start:dev`.

### Seed dữ liệu mẫu (từng phần)

```bash
npm run seed:packages   # chỉ gói (từ data/packages.seed.json)
npm run seed:admin      # chỉ admin (ADMIN_SEED_EMAIL / PASSWORD)
npm run seed            # gói built-in + admin (legacy)
npm run db:consolidate  # copy từ DB test → telecom_landing (nếu còn data cũ)
```

## Docker Compose (API + MongoDB)

```bash
docker compose up --build
```

API: `http://localhost:3000`, Swagger: `/api/docs`. Đặt `JWT_*` và `ADMIN_SEED_*` qua env hoặc file `.env` trước khi compose (xem `docker-compose.yml`).

## Quy ước API chính

- **Public gói**: `GET /packages`, `GET /packages/:id`, `GET /packages/by-code/:code` — chỉ gói `isActive: true`.
- **Public lead**: `POST /leads` — có thể gửi kèm Bearer (khách) để gắn `customerId`. Rate limit in-memory: **5 req / 15 phút / IP**, **3 req / giờ / SĐT** (single instance; production nên Redis).
- **Khách**: `POST /auth/register`, `POST /auth/login` (body: `username`, `password`, `fullName`), `GET/PATCH /me`, `GET /me/leads`.
- **Admin** (Bearer, role admin): `GET/POST/PATCH/DELETE /admin/packages`, `GET/PATCH /admin/leads`.
- **Xóa gói admin**: **soft delete** — `DELETE /admin/packages/:id` đặt `isActive: false` (không xóa document).

## Bảo mật & vận hành

- **Helmet**, **CORS** theo `FRONTEND_ORIGINS`, **ValidationPipe** (`class-validator`).
- **Throttler** toàn cục (mặc định 120 req/phút/IP) — bổ sung cho abuse chung.
- Log: không log mật khẩu; hạn chế log PII đầy đủ trong handler (chỉ id/trạng thái khi cần).

## Kiểm thử

```bash
npm run test:e2e
```

Gồm các case: `GET /packages?type=INTERNET`, `POST /auth/register`, `POST /leads` (MongoDB in-memory).

## Cấu trúc thư mục (rút gọn)

- `src/packages` — schema + public admin read/write service
- `src/leads` — lead + rate limit
- `src/customers` — khách hàng
- `src/admins` — quản trị
- `src/auth` — JWT, cookie refresh
- `src/me` — profile khách
- `src/admin` — route admin
- `src/seed/run-seed.ts` — seed CLI

## FE tích hợp nhanh

1. Gọi `GET /api/v1/packages` (lọc `?type=INTERNET` …) thay mock `src/data/*.js`.
2. Form đăng ký → `POST /api/v1/leads` với `packageId` (ObjectId gói đang active).
3. Đăng nhập khách: `POST /api/v1/auth/login` + lưu `accessToken`; mọi request `credentials: 'include'` nếu dùng refresh.
4. Admin: `POST /api/v1/admin/auth/login`, Bearer cho `/admin/*`.
