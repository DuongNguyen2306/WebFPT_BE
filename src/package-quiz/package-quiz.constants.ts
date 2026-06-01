import { PackageType } from '../common/enums';

/** Anchor section trên trang chủ FE — scroll sau khi gợi ý */
export const PACKAGE_TYPE_SECTION: Record<PackageType, string> = {
  [PackageType.INTERNET]: '#internet',
  [PackageType.SPEEDX]: '#internet',
  [PackageType.FPT_PLAY]: '#truyen-hinh',
  [PackageType.CAMERA]: '#camera',
  [PackageType.SERVICE]: '#dich-vu',
};

export const PACKAGE_TYPE_LABEL: Record<PackageType, string> = {
  [PackageType.INTERNET]: 'Internet Wifi',
  [PackageType.SPEEDX]: 'SpeedX',
  [PackageType.FPT_PLAY]: 'Truyền hình FPT Play',
  [PackageType.CAMERA]: 'Camera an ninh',
  [PackageType.SERVICE]: 'Dịch vụ thêm',
};
