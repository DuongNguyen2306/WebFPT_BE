import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { CustomersModule } from '../customers/customers.module';
import { LeadsModule } from '../leads/leads.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, CustomersModule, LeadsModule],
  controllers: [MeController],
})
export class MeModule {}
