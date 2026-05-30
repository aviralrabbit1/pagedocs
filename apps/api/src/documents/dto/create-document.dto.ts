import { IsIn, IsOptional, IsString } from 'class-validator';
import type {
  CreateDocumentDto as ICreateDocumentDto,
  StorageProvider,
} from '@pagedocs/shared-types';

export class CreateDocumentDto implements ICreateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['db', 'github', 'google_drive'])
  storageProvider?: StorageProvider;
}
