import { Component, Input, signal } from '@angular/core';
import type { Editor } from '@tiptap/core';

// A Google-Docs-style palette: greys row + vivid colors.
const SWATCHES: string[] = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7',
  '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00',
  '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3',
  '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc', '#f4cccc',
];

@Component({
  selector: 'app-color-menu',
  templateUrl: './color-menu.html',
  styleUrl: './color-menu.scss',
})
export class ColorMenu {
  @Input({ required: true }) editor!: Editor;
  /** 'text' controls font color, 'highlight' controls background. */
  @Input({ required: true }) mode!: 'text' | 'highlight';

  readonly swatches = SWATCHES;
  readonly open = signal(false);

  get triggerLabel(): string {
    return this.mode === 'text' ? 'A' : '🖍';
  }

  get resetLabel(): string {
    return this.mode === 'text' ? 'Automatic (default)' : 'No highlight';
  }

  get title(): string {
    return this.mode === 'text' ? 'Text color' : 'Highlight color';
  }

  /** A small bar under the trigger letter showing the active color. */
  activeColor(): string {
    if (this.mode === 'text') {
      return (this.editor.getAttributes('textStyle')['color'] as string) || '#000000';
    }
    return (this.editor.getAttributes('highlight')['color'] as string) || 'transparent';
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  apply(color: string): void {
    if (this.mode === 'text') {
      this.editor.chain().focus().setColor(color).run();
    } else {
      this.editor.chain().focus().setHighlight({ color }).run();
    }
    this.open.set(false);
  }

  applyCustom(value: string): void {
    this.apply(value);
  }

  reset(): void {
    if (this.mode === 'text') {
      this.editor.chain().focus().unsetColor().run();
    } else {
      this.editor.chain().focus().unsetHighlight().run();
    }
    this.open.set(false);
  }
}
