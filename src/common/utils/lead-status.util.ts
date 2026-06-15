import { LeadStatus } from '../enums';

/** Nhãn trạng thái đơn đăng ký (hiển thị FE) */
export const LEAD_STATUS_LABEL_VI: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: 'Mới',
  [LeadStatus.CONTACTED]: 'Đang tư vấn',
  [LeadStatus.CONVERTED]: 'Đã chốt',
  [LeadStatus.INSTALLED]: 'Đã lắp đặt',
  [LeadStatus.CANCELLED]: 'Hủy đơn',
};

export function getLeadStatusLabelVi(status: string | undefined): string {
  if (!status) return '—';
  return LEAD_STATUS_LABEL_VI[status as LeadStatus] ?? status;
}
