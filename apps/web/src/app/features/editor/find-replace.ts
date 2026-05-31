import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Editor } from '@tiptap/core';
import { getSearchState } from './extensions/search-replace';

@Component({
  selector: 'app-find-replace',
  imports: [FormsModule],
  templateUrl: './find-replace.html',
  styleUrl: './find-replace.scss',
})
export class FindReplace implements OnDestroy {
  @Input({ required: true }) editor!: Editor;
  @Output() closed = new EventEmitter<void>();

  term = '';
  replacement = '';
  caseSensitive = false;

  onTermChange() {
    this.editor.commands.setSearchTerm(this.term);
  }

  onCaseToggle() {
    this.editor.commands.setSearchCaseSensitive(this.caseSensitive);
  }

  next() {
    this.editor.commands.findNext();
  }

  prev() {
    this.editor.commands.findPrevious();
  }

  replaceOne() {
    this.editor.commands.replaceCurrent(this.replacement);
  }

  replaceAll() {
    this.editor.commands.replaceAll(this.replacement);
  }

  count(): string {
    const state = getSearchState(this.editor.state);
    if (!state || state.results.length === 0) {
      return this.term ? 'No results' : '';
    }
    return `${state.current + 1} / ${state.results.length}`;
  }

  close() {
    this.editor.commands.clearSearch();
    this.closed.emit();
  }

  ngOnDestroy() {
    this.editor.commands.clearSearch();
  }
}
