# Xử lý lỗi thường gặp

## Nhiều database trên Atlas (test, sample_mflix, telecom_landing)

App **chỉ dùng** `telecom_landing` với 4 collection: `packages`, `admins`, `customers`, `leads`.

| Database | Ý nghĩa |
|----------|---------|
| **telecom_landing** | ✅ Database chính — giữ lại |
| **test** | Data cũ khi URI không ghi tên DB — gom rồi xóa |
| **sample_mflix** | Sample Atlas — **không** thuộc app, xóa tay trên Compass nếu muốn |
| admin / config / local | System MongoDB — không đụng |

```bash
# Gom data từ test → telecom_landing + reset admin
npm run db:consolidate
npm run seed:packages

# Sau khi kiểm tra Compass, xóa DB test:
# PowerShell:
$env:DROP_TEST_DB="true"; npm run db:consolidate
```

`.env` phải trỏ đúng:

```env
MONGODB_URI=mongodb+srv://...@cluster.mongodb.net/telecom_landing?appName=FPT
```

---

## `ERR_CONNECTION_REFUSED` / Không kết nối API (cổng 3000)

**Nguyên nhân:** NestJS chưa lắng nghe cổng 3000 (thường do **MongoDB chưa kết nối được**).

**Log thường thấy:**

```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster
... IP isn't whitelisted
```

**Cách xử lý (Atlas):**

1. Vào [MongoDB Atlas](https://cloud.mongodb.com) → cluster **FPT** → **Network Access**
2. **Add IP Address** → **Add Current IP Address** (hoặc dev: `0.0.0.0/0` — chỉ dùng tạm)
3. Đợi 1–2 phút, restart backend:

```bash
cd "d:\BE tiến"
npm run start:dev
```

4. Khi thấy log `Nest application successfully started`, mở:  
   http://localhost:3000/api/docs

**Dev local (không dùng Atlas):**

```bash
docker compose up mongo -d
```

Sửa `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/telecom_landing
```

Rồi `npm run seed` và `npm run seed:packages`.

---

## Đăng nhập admin `admin1` / `123456`

- Field API vẫn tên `email` nhưng **không bắt buộc định dạng email** (chấp nhận `admin1`).
- Tài khoản seed: `ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD` trong `.env` BE.
- Nếu chưa có admin trong DB: `npm run seed`

---

## FE: `ReferenceError: email is not defined`

Trong `AdminLoginPage.jsx` phải gọi:

```js
await loginAdmin({ email: login, password });
```

**Không** dùng `{ email, password }` nếu state tên `username` / `login`.

Sau khi sửa: hard refresh trình duyệt (Ctrl+Shift+R).

---

## FE `.env`

```env
VITE_API_URL=http://localhost:3000/api/v1
```
