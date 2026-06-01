import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NavigationService } from './navigation.service';

@ApiTags('Public — Navigation')
@Controller('navigation')
export class NavigationPublicController {
  constructor(private readonly navigation: NavigationService) {}

  @Get()
  @ApiOperation({
    summary: 'Menu điều hướng mega-menu (nhóm + items visible, sort displayOrder)',
  })
  list() {
    return this.navigation.findVisiblePublic();
  }
}
