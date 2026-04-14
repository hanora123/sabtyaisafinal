import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(query: { userId?: string; action?: string; limit?: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        userId: query.userId,
        action: query.action,
      },
      take: query.limit || 100,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true } } },
    });
  }
}
