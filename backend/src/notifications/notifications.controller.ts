import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() req: any) {
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('Admin');
    return this.notificationsService.listNotifications(
      isAdmin ? undefined : req.user.id,
    );
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('Admin');
    return this.notificationsService.markAsRead(
      id,
      isAdmin ? undefined : req.user.id,
    );
  }

  @Post('read-all')
  markAllRead(@Req() req: any) {
    const roles = req.user.roles || [];
    const isAdmin = roles.includes('Admin');
    return this.notificationsService.markAllAsRead(
      isAdmin ? undefined : req.user.id,
    );
  }
}
