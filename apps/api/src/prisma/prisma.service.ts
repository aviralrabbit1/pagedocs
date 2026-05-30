import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Connect eagerly, but don't crash the API if the DB is briefly
    // unavailable at boot — Prisma reconnects on the first query.
    try {
      await this.$connect();
    } catch (err) {
      this.logger.warn(
        `Database not reachable at boot; will retry on first query. ${
          (err as Error).message
        }`,
      );
    }
  }
}
