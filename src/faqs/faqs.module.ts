import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from './faq.schema';
import { FaqsService } from './faqs.service';
import { FaqsPublicController } from './faqs-public.controller';
import { AdminFaqsController } from './admin-faqs.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Faq.name, schema: FaqSchema }]),
    AuthModule,
  ],
  controllers: [FaqsPublicController, AdminFaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
