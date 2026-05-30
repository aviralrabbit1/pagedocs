import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PageSetup } from '@pagedocs/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const DEFAULT_PAGE_SETUP: PageSetup = {
  margins: { top: 96, right: 96, bottom: 96, left: 96 },
  orientation: 'portrait',
  size: 'A4',
  columns: 1,
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.document.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        storageProvider: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  create(ownerId: string, dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        ownerId,
        title: dto.title ?? 'Untitled document',
        storageProvider: dto.storageProvider ?? 'db',
        pageSetup: DEFAULT_PAGE_SETUP as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async get(ownerId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
    });
    if (!doc) {
      throw new NotFoundException('Document not found.');
    }
    if (doc.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this document.');
    }
    return doc;
  }

  async update(ownerId: string, id: string, dto: UpdateDocumentDto) {
    const existing = await this.get(ownerId, id);

    const data: Prisma.DocumentUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.content !== undefined) {
      data.content = dto.content as unknown as Prisma.InputJsonValue;
    }
    if (dto.pageSetup !== undefined) {
      const merged = {
        ...(existing.pageSetup as object),
        ...dto.pageSetup,
      };
      data.pageSetup = merged as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.document.update({ where: { id }, data });
  }

  async remove(ownerId: string, id: string) {
    await this.get(ownerId, id);
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id, deleted: true };
  }
}
