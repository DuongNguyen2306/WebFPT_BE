# API cho Frontend — FPT Telecom Landing

## URL khi deploy

| Môi trường | Base URL API | Swagger UI | OpenAPI JSON |
|------------|--------------|------------|--------------|
| Local | `http://localhost:3000/api/v1` | http://localhost:3000/api/docs | http://localhost:3000/api/docs-json |
| Production | `https://<domain-be>/api/v1` | `https://<domain-be>/api/docs` | `https://<domain-be>/api/docs-json` |

Cấu hình FE (Vite):

```env
VITE_API_URL=https://<domain-be>/api/v1
```

## Xác thực

1. **Đăng nhập:** `POST /auth/login-unified`  
   Body: `{ "account": "admin1", "password": "..." }`  
   Response: `{ accessToken, role, user | admin }`  
   Cookie: `refreshToken` (HttpOnly) — axios `withCredentials: true`

2. **Gọi API bảo vệ:** Header  
   `Authorization: Bearer <accessToken>`

3. **Làm mới token:** `POST /auth/refresh` (cookie tự gửi)

4. **Admin:** `role === "ADMIN"` → routes `/admin/*`  
   **Khách:** `role === "CUSTOMER"` → `/me/*`

## Nhóm API public (không bắt buộc login)

| Tag Swagger | Prefix | Mục đích |
|-------------|--------|----------|
| Public — Packages | `/packages` | Gói cước |
| Public — Leads | `/leads` | Đăng ký + tra cứu SĐT |
| Public — FAQs | `/faqs` | FAQ |
| Public — Navigation | `/navigation` | Mega-menu |
| Public — Package quiz | `/package-quiz` | Khảo sát 3 câu → gợi ý gói |
| Public — Banners | `/banners` | Carousel |

## Luồng FE quan trọng

### Package quiz (3 câu)

1. `GET /package-quiz?code=home-needs` → `questions[]`
2. Wizard UI → thu thập `answers[]`
3. `POST /package-quiz/recommend` → `packages`, `resultsPath`, `recommendedTypes`
4. Navigate `resultsPath` (vd. `/ket-qua-tu-van?types=...`)

### Đăng ký gói

`POST /leads` → response có `id`, `packageSnapshot` → màn hình thành công

### Tra cứu đơn (guest)

`GET /leads/history?phone=0912345678`

## Export OpenAPI (cho codegen)

Trên máy BE:

```bash
npm run swagger:export
```

File: `docs/openapi.json`

## Lỗi chuẩn

```json
{
  "statusCode": 400,
  "message": "Mô tả lỗi",
  "error": "Bad Request"
}
```

`message` có thể là `string` hoặc `string[]` (validation).
