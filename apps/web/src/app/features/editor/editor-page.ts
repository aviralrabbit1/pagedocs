import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { Editor } from '@tiptap/core';
import * as Y from 'yjs';
import type { ProseMirrorNode } from '@pagedocs/shared-types';
import { DocumentsService } from '../../core/documents.service';
import { RecentService } from '../../core/recent.service';
import { buildExtensions } from './editor-extensions';
import { EditorToolbar } from './toolbar';
import { FindReplace } from './find-replace';

type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

@Component({
  selector: 'app-editor-page',
  imports: [FormsModule, RouterLink, DatePipe, EditorToolbar, FindReplace],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.scss',
})
export class EditorPage implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documents = inject(DocumentsService);
  private readonly recent = inject(RecentService);

  @ViewChild('host', { static: true })
  private readonly host!: ElementRef<HTMLDivElement>;

  readonly editor = signal<Editor | null>(null);
  readonly title = signal('');
  readonly saveStatus = signal<SaveStatus>('saved');
  readonly loading = signal(true);
  readonly showFind = signal(false);
  readonly showInfo = signal(false);
  readonly createdAt = signal<string | null>(null);
  readonly lastModified = signal<string | null>(null);

  private docId = '';
  private ydoc?: Y.Doc;
  private readonly saveSubject = new Subject<void>();
  private saveSub?: Subscription;
  private paramSub?: Subscription;
  private retryTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    this.saveSub = this.saveSubject
      .pipe(debounceTime(800))
      .subscribe(() => this.save());

    // React to id changes too: the router reuses this component when
    // navigating between documents (e.g. the "New document" button).
    this.paramSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      if (id && id !== this.docId) {
        this.loadDocument(id);
      }
    });
  }

  private loadDocument(id: string): void {
    // Flush any pending edits to the previous document before switching.
    if (this.editor() && this.saveStatus() !== 'saved') {
      this.save();
    }
    this.teardownEditor();

    this.docId = id;
    this.loading.set(true);
    this.showFind.set(false);
    this.showInfo.set(false);

    this.documents.get(id).subscribe({
      next: (doc) => {
        this.title.set(doc.title);
        this.createdAt.set(doc.createdAt);
        this.lastModified.set(doc.updatedAt);
        this.createEditor(doc.content);
        this.recent.record(doc.id, doc.title, new Date().toISOString());
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.saveStatus.set('error');
      },
    });
  }

  private createEditor(content: ProseMirrorNode | null): void {
    const ydoc = new Y.Doc();
    this.ydoc = ydoc;

    const editor = new Editor({
      element: this.host.nativeElement,
      extensions: buildExtensions(ydoc),
      autofocus: true,
      onUpdate: () => {
        this.saveStatus.set('dirty');
        this.saveSubject.next();
      },
    });

    // Seed the fresh Y.Doc from the stored JSON snapshot (no update emit,
    // so opening a document doesn't immediately mark it dirty).
    if (content) {
      editor.commands.setContent(content as never, false);
    }

    this.saveStatus.set('saved');
    this.editor.set(editor);
  }

  onTitleChange(): void {
    this.recent.updateTitle(this.docId, this.title());
    this.saveStatus.set('dirty');
    this.saveSubject.next();
  }

  newDocument(): void {
    this.documents.create().subscribe((doc) => {
      void this.router.navigate(['/documents', doc.id]);
    });
  }

  toggleFind(): void {
    this.showFind.update((v) => !v);
  }

  toggleInfo(): void {
    this.showInfo.update((v) => !v);
  }

  wordCount(): number {
    const text = this.editor()?.state.doc.textContent.trim() ?? '';
    return text ? text.split(/\s+/).length : 0;
  }

  charCount(): number {
    return this.editor()?.state.doc.textContent.length ?? 0;
  }

  saveStatusLabel(): string {
    switch (this.saveStatus()) {
      case 'saving':
        return 'Saving…';
      case 'dirty':
        return 'Unsaved changes';
      case 'error':
        return 'Save failed';
      default:
        return 'All changes saved';
    }
  }

  private save(): void {
    const editor = this.editor();
    if (!editor || !this.docId) {
      return;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    const savingId = this.docId;
    this.saveStatus.set('saving');
    this.documents
      .update(savingId, {
        title: this.title(),
        content: editor.getJSON() as unknown as ProseMirrorNode,
      })
      .subscribe({
        next: (doc) => {
          this.saveStatus.set('saved');
          if (savingId === this.docId) {
            this.lastModified.set(doc.updatedAt);
          }
        },
        error: () => {
          // Keep the work: surface the failure and retry shortly so a
          // transient backend/DB blip doesn't drop unsaved changes.
          this.saveStatus.set('error');
          this.retryTimer = setTimeout(() => this.saveSubject.next(), 4000);
        },
      });
  }

  private teardownEditor(): void {
    this.editor()?.destroy();
    this.ydoc?.destroy();
    this.editor.set(null);
  }

  ngOnDestroy(): void {
    this.saveSub?.unsubscribe();
    this.paramSub?.unsubscribe();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.teardownEditor();
  }
}
