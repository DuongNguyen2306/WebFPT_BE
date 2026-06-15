import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CustomersModule } from '../customers/customers.module';
import { LeadsModule } from '../leads/leads.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, CustomersModule, LeadsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
