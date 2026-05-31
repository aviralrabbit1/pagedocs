import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  DocumentDto,
  DocumentSummaryDto,
  UpdateDocumentDto,
} from '@pagedocs/shared-types';
import { API_BASE_URL } from './config';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/documents`;

  list(): Observable<DocumentSummaryDto[]> {
    return this.http.get<DocumentSummaryDto[]>(this.base);
  }

  get(id: string): Observable<DocumentDto> {
    return this.http.get<DocumentDto>(`${this.base}/${id}`);
  }

  create(title?: string): Observable<DocumentDto> {
    return this.http.post<DocumentDto>(this.base, { title });
  }

  update(id: string, patch: UpdateDocumentDto): Observable<DocumentDto> {
    return this.http.patch<DocumentDto>(`${this.base}/${id}`, patch);
  }

  remove(id: string): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `${this.base}/${id}`,
    );
  }
}
