import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './lead.schema';
import { LeadsService } from './leads.service';
import { LeadsPublicController } from './leads-public.controller';
import { LeadRateLimitService } from './lead-rate-limit.service';
import { PackagesModule } from '../packages/packages.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    PackagesModule,
    AuthModule,
  ],
  controllers: [LeadsPublicController],
  providers: [LeadsService, LeadRateLimitService],
  exports: [LeadsService],
})
export class LeadsModule {}
