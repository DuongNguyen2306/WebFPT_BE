import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PackagesService } from '../packages/packages.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { Package } from '../packages/package.schema';
import { CreatePackageDto } from './dto/admin-package.dto';
import { normalizePackageInput, toPackageFeResponse } from '../packages/package-fe.mapper';

@Injectable()
export class AdminPackagesService {
  private readonly logger = new Logger(AdminPackagesService.name);

  constructor(
    private readonly packages: PackagesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createFromJson(dto: CreatePackageDto) {
    return this.persistPackage(dto, {});
  }

  /**
   * Luồng 1 request: upload ảnh Cloudinary → lưu URL vào MongoDB.
   * Field multipart: `file` (ảnh chính), `accentFile` (tuỳ chọn), còn lại là text form.
   */
  async createFromMultipart(
    dto: CreatePackageDto,
    files: { file?: Express.Multer.File[]; accentFile?: Express.Multer.File[] },
    folder?: string,
  ) {
    const heroFile = files.file?.[0];
    const accentFile = files.accentFile?.[0];
    const urls: { heroImage?: string; accentImage?: string } = {};

    urls.heroImage = await this.resolveHeroImageUrl(dto, heroFile, folder);

    if (accentFile?.buffer?.length) {
      urls.accentImage = await this.tryUploadFile(
        accentFile,
        folder?.trim() || `${this.cloudinary.defaultFolder()}/accents`,
        'accent',
      );
    }

    return this.persistPackage(dto, urls);
  }

  /** Cloudinary lỗi / không có file → URL ảnh dự phòng, không chặn request. */
  private async resolveHeroImageUrl(
    dto: CreatePackageDto,
    heroFile: Express.Multer.File | undefined,
    folder?: string,
  ): Promise<string> {
    const fromForm = (dto.heroImage ?? dto.imageUrl)?.trim();
    if (fromForm) return fromForm;

    if (heroFile?.buffer?.length) {
      return this.tryUploadFile(
        heroFile,
        folder?.trim() || `${this.cloudinary.defaultFolder()}/heroes`,
        'hero',
      );
    }

    this.logger.warn('Không có file ảnh hero — dùng ảnh mặc định dự phòng');
    return this.cloudinary.fallbackHeroImageUrl();
  }

  private async tryUploadFile(
    file: Express.Multer.File,
    folder: string,
    label: 'hero' | 'accent',
  ): Promise<string> {
    try {
      const up = await this.cloudinary.uploadBuffer(file.buffer, file.mimetype, {
        folder,
        filename: file.originalname?.replace(/\.[^.]+$/, ''),
        originalname: file.originalname,
      });
      return up.secure_url;
    } catch (error) {
      this.logger.warn(
        `Cloudinary ${label} upload thất bại — dùng ảnh mặc định (${this.cloudinary.fallbackHeroImageUrl()})`,
      );
      this.logger.debug(error);
      return this.cloudinary.fallbackHeroImageUrl();
    }
  }

  private async persistPackage(
    dto: CreatePackageDto,
    urls: { heroImage?: string; accentImage?: string },
  ) {
    const merged: Record<string, unknown> = {
      ...(dto as unknown as Record<string, unknown>),
      ...(urls.heroImage ? { heroImage: urls.heroImage } : {}),
      ...(urls.accentImage ? { accentImage: urls.accentImage } : {}),
    };

    const payload = normalizePackageInput(merged);
    if (!payload.shortDescription) {
      throw new BadRequestException('Thiếu tagline hoặc shortDescription');
    }
    if (!payload.imageUrl && !urls.heroImage) {
      const fallback = this.cloudinary.fallbackHeroImageUrl();
      merged.heroImage = fallback;
      merged.imageUrl = fallback;
    }

    try {
      const doc = await this.packages.create({
        ...(payload as Partial<Package>),
        metadata: (payload.metadata as Record<string, unknown>) ?? {},
        isActive: (payload.isActive as boolean | undefined) ?? true,
        sortOrder: (payload.sortOrder as number | undefined) ?? 0,
        price: payload.price === undefined ? null : (payload.price as number | null),
      });
      return toPackageFeResponse(doc.toObject() as unknown as Record<string, unknown>);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
        throw new ConflictException('Mã gói (code) đã tồn tại');
      }
      throw err;
    }
  }
}
