import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const DEFAULT_PACKAGE_FALLBACK_IMAGE =
  'https://res.cloudinary.com/dgntcyf41/image/upload/v1716644000/sample.jpg';

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

@Injectable()
export class CloudinaryService {
  private configured = false;
  /** ms — Cloudinary mặc định ~60s, ảnh lớn/network chậm cần cao hơn */
  private readonly uploadTimeoutMs: number;

  constructor(private readonly config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    const rawTimeout = Number(config.get<string>('CLOUDINARY_TIMEOUT_MS') ?? 300_000);
    this.uploadTimeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 300_000;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        timeout: this.uploadTimeoutMs,
      });
      this.configured = true;
    }
  }

  isEnabled(): boolean {
    return this.configured;
  }

  defaultFolder(): string {
    return this.config.get<string>('CLOUDINARY_FOLDER') ?? 'telecom-packages';
  }

  fallbackHeroImageUrl(): string {
    return (
      this.config.get<string>('PACKAGE_FALLBACK_HERO_IMAGE_URL')?.trim() ||
      DEFAULT_PACKAGE_FALLBACK_IMAGE
    );
  }

  /** Windows đôi khi gửi application/octet-stream — suy từ tên file. */
  resolveMimetype(mimetype: string, originalname?: string): string {
    if (ALLOWED_MIME.has(mimetype)) return mimetype;
    const ext = originalname?.split('.').pop()?.toLowerCase();
    if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
    return mimetype;
  }

  async uploadBuffer(
    buffer: Buffer,
    mimetype: string,
    options?: { folder?: string; filename?: string; originalname?: string },
  ): Promise<UploadApiResponse> {
    this.assertConfigured();
    const resolved = this.resolveMimetype(mimetype, options?.originalname ?? options?.filename);
    if (!ALLOWED_MIME.has(resolved)) {
      throw new BadRequestException(
        `Định dạng ảnh không hỗ trợ (${mimetype}). Chỉ JPEG, PNG, WebP hoặc GIF.`,
      );
    }

    const folder = options?.folder ?? this.defaultFolder();
    const uploadOptions = {
      folder,
      resource_type: 'image' as const,
      use_filename: true,
      unique_filename: true,
      filename_override: options?.filename,
      timeout: this.uploadTimeoutMs,
    };

    try {
      return await this.uploadStreamPromise(buffer, uploadOptions);
    } catch (err: unknown) {
      throw this.mapUploadError(err);
    }
  }

  /** Stream binary — nhanh hơn data-URI base64 (~+33% kích thước). */
  private uploadStreamPromise(
    buffer: Buffer,
    options: Record<string, unknown>,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result'));
          return;
        }
        resolve(result);
      });
      stream.end(buffer);
    });
  }

  async uploadFromUrl(url: string, folder?: string): Promise<UploadApiResponse> {
    this.assertConfigured();
    try {
      return await cloudinary.uploader.upload(url, {
        folder: folder ?? this.defaultFolder(),
        resource_type: 'image',
        timeout: this.uploadTimeoutMs,
      });
    } catch (err: unknown) {
      throw this.mapUploadError(err);
    }
  }

  private mapUploadError(err: unknown): Error {
    const e = err as { error?: { message?: string; http_code?: number; name?: string } };
    const msg = e?.error?.message ?? (err instanceof Error ? err.message : 'Upload failed');
    const isTimeout =
      e?.error?.name === 'TimeoutError' ||
      e?.error?.http_code === 499 ||
      /timeout/i.test(String(msg));
    if (isTimeout) {
      return new ServiceUnavailableException(
        `Cloudinary quá thời gian chờ (${this.uploadTimeoutMs / 1000}s). Thử ảnh dưới 2MB, kiểm tra mạng/VPN tới api.cloudinary.com, hoặc tăng CLOUDINARY_TIMEOUT_MS trong .env`,
      );
    }
    return new BadRequestException(msg);
  }

  toPublicPayload(result: UploadApiResponse) {
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      folder: result.folder,
    };
  }

  private assertConfigured() {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Cloudinary chưa cấu hình. Thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào .env',
      );
    }
  }
}
