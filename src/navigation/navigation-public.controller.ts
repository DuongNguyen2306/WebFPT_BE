import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NavigationService } from './navigation.service';
import { NavigationListResponseDto } from '../swagger/swagger-responses.dto';

@ApiTags('Public — Navigation')
@Controller('navigation')
export class NavigationPublicController {
  constructor(private readonly navigation: NavigationService) {}

  @Get()
  @ApiOperation({
    summary: 'Mega-menu (nhóm + items visible)',
    description: 'FE: icon string → map Lucide. Item isNew → badge「Mới」.',
  })
  @ApiOkResponse({ type: NavigationListResponseDto })
  list() {
    return this.navigation.findVisiblePublic();
  }
}
