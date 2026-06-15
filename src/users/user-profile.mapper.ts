import { CustomerDocument } from '../customers/customer.schema';
import { AppRole } from '../common/enums';

export function toUserProfileResponse(customer: CustomerDocument) {
  return {
    id: customer._id.toString(),
    username: customer.username,
    fullName: customer.fullName,
    phone: customer.phone ?? null,
    address: customer.defaultAddress ?? null,
    email: customer.email ?? null,
    role: AppRole.CUSTOMER,
    status: customer.status,
  };
}
