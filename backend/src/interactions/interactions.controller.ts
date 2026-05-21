import {
  Controller, Post, Get, Delete, Param, Body, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InteractionsService } from './interactions.service';

@Controller('api/activities')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private interactionsService: InteractionsService) {}

  @Post(':id/like')
  @HttpCode(200)
  toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.interactionsService.toggleLike(id, req.user.id);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.interactionsService.getComments(id);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Req() req: any, @Body() body: { content: string }) {
    return this.interactionsService.addComment(id, req.user.id, body.content);
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @Req() req: any) {
    return this.interactionsService.deleteComment(id, req.user.id);
  }
}
