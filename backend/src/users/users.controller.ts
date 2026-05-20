import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('leaderboard')
  getLeaderboard(
    @Query('region') region?: string,
    @Query('period') period?: 'month' | 'global',
  ) {
    return this.usersService.getLeaderboard(region, period);
  }

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
