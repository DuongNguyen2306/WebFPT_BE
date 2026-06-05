import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export type NewLeadDiscordPayload = {
  createdAt: Date;
  fullName: string;
  phone: string;
  address: string;
  packageName: string;
  source: string;
};

@Injectable()
export class DiscordNotifyService {
  private readonly logger = new Logger(DiscordNotifyService.name);

  async notifyNewRegistration(payload: NewLeadDiscordPayload): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();

    console.log('[Discord] notifyNewRegistration được gọi', {
      hasWebhookUrl: Boolean(webhookUrl),
      webhookPreview: webhookUrl ? `${webhookUrl.slice(0, 50)}...` : '(trống)',
      phone: payload.phone,
      fullName: payload.fullName,
    });

    if (!webhookUrl) {
      console.warn('[Discord] BỎ QUA — chưa có DISCORD_WEBHOOK_URL trong process.env');
      this.logger.warn('Discord chưa cấu hình (DISCORD_WEBHOOK_URL) — bỏ qua thông báo');
      return;
    }

    const createdAt = payload.createdAt.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    const content = [
      '🔔 **CÓ ĐƠN ĐĂNG KÝ MỚI TỪ WEBSITE!**',
      `📅 **Ngày tạo:** ${createdAt}`,
      `👤 **Họ tên:** ${payload.fullName}`,
      `📞 **Số điện thoại:** ${payload.phone}`,
      `📍 **Địa chỉ lắp đặt:** ${payload.address}`,
      `📦 **Gói quan tâm:** ${payload.packageName}`,
      `🌐 **Nguồn:** ${payload.source}`,
    ].join('\n');

    try {
      console.log('[Discord] Đang gửi POST tới webhook...');
      const res = await axios.post(
        webhookUrl,
        { content },
        { timeout: 10_000 },
      );
      console.log('[Discord] Gửi thành công!', { status: res.status, statusText: res.statusText });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const axiosDetail =
        axios.isAxiosError(err) && err.response
          ? { status: err.response.status, data: err.response.data }
          : null;
      console.error('[Discord] Gửi THẤT BẠI (đơn vẫn đã lưu):', message, axiosDetail);
      this.logger.error(`Gửi Discord thất bại (đơn vẫn đã lưu): ${message}`);
    }
  }
}
