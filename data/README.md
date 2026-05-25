# Dữ liệu gói cước (JSON)

File **`packages.seed.json`**: 20 gói (4 × mỗi loại) — **đã cập nhật contract FE mới** (`tagline`, `heroImage`, `promoBadge`, `metadata.maxDevices`, `includedEquipment`, `privileges`, `specLine`, …).

Gói mẫu **`internet-sky-f1`** bám sát UI landing (giá, tốc độ, thiết bị, chi tiết, thiết bị kèm, đặc quyền) trong field `metadata`.

## Import vào MongoDB

**Cách 1 — script (khuyến nghị):**

```bash
npm run seed:packages
```

Ghi đè các document có cùng `code` rồi insert lại.

**Cách 2 — mongoimport:**

```bash
mongoimport --uri="mongodb://localhost:27017/telecom_landing" --collection=packages --file=data/packages.seed.json --jsonArray --drop
```

(`--drop` xóa hết collection `packages` trước khi import — cẩn thận trên DB production.)

**Cách 3 — Compass:** Collections → `packages` → Add Data → Import JSON → chọn `packages.seed.json`.

## Field `metadata` (linh hoạt cho FE)

| Key | Mô tả |
|-----|--------|
| `pricePrefix` | VD: `"Chỉ từ"` |
| `downloadMbps` / `uploadMbps` | Số Mbps cho card tốc độ |
| `deviceLimit` | VD: `"≥ 8 Thiết bị"` |
| `includedEquipment` | `[{ name, imageUrl }]` — block "Nhận thêm trong gói" |
| `privileges` | `[{ icon, title, description }]` — "Đặc quyền dành riêng" |
| `promo` | `{ text, validUntil }` |
| `lifestyleImageUrl` | Ảnh gia đình / marketing |
| `contactOnly` | `true` → giá `null`, hiển thị "Liên hệ" |
