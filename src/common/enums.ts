export enum PackageType {
  INTERNET = 'INTERNET',
  SPEEDX = 'SPEEDX',
  FPT_PLAY = 'FPT_PLAY',
  CAMERA = 'CAMERA',
  SERVICE = 'SERVICE',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ONCE = 'ONCE',
  FREE = 'FREE',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CONVERTED = 'CONVERTED',
  INSTALLED = 'INSTALLED',
  CANCELLED = 'CANCELLED',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}

export enum JwtSubjectKind {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

/** Role trong JWT và document (admin: collection admins; khách: customers) */
export enum AppRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}
