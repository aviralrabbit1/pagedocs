import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { DocumentSummaryDto } from '@pagedocs/shared-types';
import { AuthService } from '../../core/auth.service';
import { DocumentsService } from '../../core/documents.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly documents = inject(DocumentsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly docs = signal<DocumentSummaryDto[]>([]);
  readonly loading = signal(true);
  readonly user = this.auth.user;

  async ngOnInit(): Promise<void> {
    await this.auth.loadCurrentUser();
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
      // Phase 1 will route to the editor; for now just refresh the list.
      this.refresh();
      void doc;
    });
  }

  remove(id: string): void {
    this.documents.remove(id).subscribe(() => this.refresh());
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
