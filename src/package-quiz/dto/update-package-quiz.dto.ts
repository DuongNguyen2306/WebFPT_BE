import { PartialType } from '@nestjs/swagger';
import { CreatePackageQuizDto } from './create-package-quiz.dto';

export class UpdatePackageQuizDto extends PartialType(CreatePackageQuizDto) {}
