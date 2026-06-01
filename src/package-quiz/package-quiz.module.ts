import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PackageQuiz, PackageQuizSchema } from './package-quiz.schema';
import { PackageQuizService } from './package-quiz.service';
import { PackageQuizPublicController } from './package-quiz-public.controller';
import { AdminPackageQuizController } from './admin-package-quiz.controller';
import { AuthModule } from '../auth/auth.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PackageQuiz.name, schema: PackageQuizSchema }]),
    AuthModule,
    PackagesModule,
  ],
  controllers: [PackageQuizPublicController, AdminPackageQuizController],
  providers: [PackageQuizService],
  exports: [PackageQuizService],
})
export class PackageQuizModule {}
