import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { Editor } from '@tiptap/core';
import * as Y from 'yjs';
import type { ProseMirrorNode } from '@pagedocs/shared-types';
import { DocumentsService } from '../../core/documents.service';
import { buildExtensions } from './editor-extensions';
import { EditorToolbar } from './toolbar';
import { FindReplace } from './find-replace';

type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

@Component({
  selector: 'app-editor-page',
  imports: [FormsModule, RouterLink, EditorToolbar, FindReplace],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.scss',
})
export class EditorPage implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly documents = inject(DocumentsService);

  @ViewChild('host', { static: true })
  private readonly host!: ElementRef<HTMLDivElement>;

  readonly editor = signal<Editor | null>(null);
  readonly title = signal('');
  readonly saveStatus = signal<SaveStatus>('saved');
  readonly loading = signal(true);
  readonly showFind = signal(false);

  private docId = '';
  private ydoc?: Y.Doc;
  private readonly saveSubject = new Subject<void>();
  private saveSub?: Subscription;
  private retryTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    this.docId = this.route.snapshot.paramMap.get('id') ?? '';
    this.saveSub = this.saveSubject
      .pipe(debounceTime(800))
      .subscribe(() => this.save());

    this.documents.get(this.docId).subscribe({
      next: (doc) => {
        this.title.set(doc.title);
        this.createEditor(doc.content);
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

    this.editor.set(editor);
  }

  onTitleChange(): void {
    this.saveStatus.set('dirty');
    this.saveSubject.next();
  }

  toggleFind(): void {
    this.showFind.update((v) => !v);
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
    this.saveStatus.set('saving');
    this.documents
      .update(this.docId, {
        title: this.title(),
        content: editor.getJSON() as unknown as ProseMirrorNode,
      })
      .subscribe({
        next: () => this.saveStatus.set('saved'),
        error: () => {
          // Keep the work: surface the failure and retry shortly so a
          // transient backend/DB blip doesn't drop unsaved changes.
          this.saveStatus.set('error');
          this.retryTimer = setTimeout(() => this.saveSubject.next(), 4000);
        },
      });
  }

  ngOnDestroy(): void {
    this.saveSub?.unsubscribe();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.editor()?.destroy();
    this.ydoc?.destroy();
  }
}
