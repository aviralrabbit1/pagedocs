import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { DocumentSummaryDto } from '@pagedocs/shared-types';
import { AuthService } from '../../core/auth.service';
import { DocumentsService } from '../../core/documents.service';
import { RecentService, type RecentDoc } from '../../core/recent.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly documents = inject(DocumentsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly recentService = inject(RecentService);

  readonly docs = signal<DocumentSummaryDto[]>([]);
  readonly recent = signal<RecentDoc[]>([]);
  readonly loading = signal(true);
  readonly user = this.auth.user;

  async ngOnInit(): Promise<void> {
    await this.auth.loadCurrentUser();
    this.recent.set(this.recentService.list());
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.documents.list().subscribe({
      next: (docs) => {
        this.docs.set(docs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    this.documents.create().subscribe((doc) => {
      void this.router.navigate(['/documents', doc.id]);
    });
  }

  open(id: string): void {
    void this.router.navigate(['/documents', id]);
  }

  remove(id: string, event: Event): void {
    event.stopPropagation();
    this.documents.remove(id).subscribe(() => {
      this.recentService.remove(id);
      this.recent.set(this.recentService.list());
      this.refresh();
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
