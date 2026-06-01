import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PackagesModule } from './packages/packages.module';
import { LeadsModule } from './leads/leads.module';
import { AdminModule } from './admin/admin.module';
import { CustomersModule } from './customers/customers.module';
import { MeModule } from './me/me.module';
import { BannersModule } from './banners/banners.module';
import { FaqsModule } from './faqs/faqs.module';
import { NavigationModule } from './navigation/navigation.module';
import { PackageQuizModule } from './package-quiz/package-quiz.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    CustomersModule,
    AuthModule,
    PackagesModule,
    LeadsModule,
    MeModule,
    BannersModule,
    FaqsModule,
    NavigationModule,
    PackageQuizModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
