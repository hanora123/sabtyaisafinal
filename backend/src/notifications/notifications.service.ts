import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(userId?: string) {
    return this.prisma.notification.findMany({
      where: userId
        ? { OR: [{ targetUserId: userId }, { targetUserId: null }] }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId?: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('الإشعار غير موجود');

    if (
      userId &&
      notification.targetUserId &&
      notification.targetUserId !== userId
    ) {
      throw new NotFoundException('الإشعار غير موجود');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId?: string) {
    return this.prisma.notification.updateMany({
      where: userId
        ? {
            OR: [{ targetUserId: userId }, { targetUserId: null }],
            isRead: false,
          }
        : { isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
