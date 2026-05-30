import { IsObject, IsOptional, IsString } from 'class-validator';
import type {
  PageSetup,
  ProseMirrorNode,
  UpdateDocumentDto as IUpdateDocumentDto,
} from '@pagedocs/shared-types';

export class UpdateDocumentDto implements IUpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  content?: ProseMirrorNode;

  @IsOptional()
  @IsObject()
  pageSetup?: Partial<PageSetup>;
}
