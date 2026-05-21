import {
  Controller, Get, Patch, Delete, Post, Param, Body, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { AdminService } from './admin.service';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { role?: UserRole; isActive?: boolean; firstName?: string; lastName?: string; region?: string },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('recalculate-xp')
  recalculateXP() {
    return this.adminService.recalculateAllXP();
  }

  @Get('stats')
  getStats() {
    return this.adminService.getGlobalStats();
  }

  @Get('achievements')
  listAchievements() {
    return this.adminService.listAchievements();
  }

  @Post('achievements')
  createAchievement(@Body() body: any) {
    return this.adminService.createAchievement(body);
  }

  @Patch('achievements/:id')
  updateAchievement(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateAchievement(id, body);
  }

  @Delete('achievements/:id')
  deleteAchievement(@Param('id') id: string) {
    return this.adminService.deleteAchievement(id);
  }
}
