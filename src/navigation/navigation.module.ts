import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Menu, MenuSchema } from './menu.schema';
import { NavigationService } from './navigation.service';
import { NavigationPublicController } from './navigation-public.controller';
import { AdminNavigationController } from './admin-navigation.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Menu.name, schema: MenuSchema }]),
    AuthModule,
  ],
  controllers: [NavigationPublicController, AdminNavigationController],
  providers: [NavigationService],
  exports: [NavigationService],
})
export class NavigationModule {}
