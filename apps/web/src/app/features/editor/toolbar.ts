import { Component, Input } from '@angular/core';
import type { Editor } from '@tiptap/core';
import { FONT_FAMILIES, FONT_SIZES } from './editor-extensions';
import { ColorMenu } from './color-menu';

@Component({
  selector: 'app-editor-toolbar',
  imports: [ColorMenu],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class EditorToolbar {
  @Input({ required: true }) editor!: Editor;

  readonly fonts = FONT_FAMILIES;
  readonly sizes = FONT_SIZES;

  isActive(name: string, attrs?: Record<string, unknown>): boolean {
    return this.editor.isActive(name, attrs);
  }

  isAlign(value: string): boolean {
    return this.editor.isActive({ textAlign: value });
  }

  // ── inline marks ──────────────────────────────────────────────
  toggleBold() {
    this.editor.chain().focus().toggleBold().run();
  }
  toggleItalic() {
    this.editor.chain().focus().toggleItalic().run();
  }
  toggleUnderline() {
    this.editor.chain().focus().toggleUnderline().run();
  }
  toggleStrike() {
    this.editor.chain().focus().toggleStrike().run();
  }
  toggleCode() {
    this.editor.chain().focus().toggleCode().run();
  }

  // ── block type ────────────────────────────────────────────────
  currentBlock(): string {
    if (this.editor.isActive('heading', { level: 1 })) return 'h1';
    if (this.editor.isActive('heading', { level: 2 })) return 'h2';
    if (this.editor.isActive('heading', { level: 3 })) return 'h3';
    return 'p';
  }
  setBlock(value: string) {
    const chain = this.editor.chain().focus();
    if (value === 'p') {
      chain.setParagraph().run();
    } else {
      const level = Number(value.replace('h', '')) as 1 | 2 | 3;
      chain.toggleHeading({ level }).run();
    }
  }

  // ── fonts ─────────────────────────────────────────────────────
  setFontFamily(value: string) {
    if (value) {
      this.editor.chain().focus().setFontFamily(value).run();
    } else {
      this.editor.chain().focus().unsetFontFamily().run();
    }
  }
  setFontSize(value: string) {
    if (value) {
      this.editor.chain().focus().setFontSize(`${value}px`).run();
    } else {
      this.editor.chain().focus().unsetFontSize().run();
    }
  }

  // ── colors ────────────────────────────────────────────────────
  clearFormatting() {
    this.editor.chain().focus().unsetAllMarks().clearNodes().run();
  }

  // ── alignment ─────────────────────────────────────────────────
  setAlign(value: 'left' | 'center' | 'right' | 'justify') {
    this.editor.chain().focus().setTextAlign(value).run();
  }

  // ── lists & indent ────────────────────────────────────────────
  toggleBullet() {
    this.editor.chain().focus().toggleBulletList().run();
  }
  toggleOrdered() {
    this.editor.chain().focus().toggleOrderedList().run();
  }
  indent() {
    this.editor.chain().focus().indent().run();
  }
  outdent() {
    this.editor.chain().focus().outdent().run();
  }

  // ── links & bookmarks ─────────────────────────────────────────
  setLink() {
    const previous = this.editor.getAttributes('link')['href'] as
      | string
      | undefined;
    const url = window.prompt('Link URL (leave empty to remove):', previous ?? '');
    if (url === null) {
      return;
    }
    if (url === '') {
      this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    this.editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }
  addBookmark() {
    const name = window.prompt('Bookmark name:');
    if (!name) {
      return;
    }
    const id = `bm-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    this.editor.chain().focus().setBookmark({ id, name }).run();
  }

  // ── history (provided by Yjs Collaboration) ───────────────────
  undo() {
    this.editor.chain().focus().undo().run();
  }
  redo() {
    this.editor.chain().focus().redo().run();
  }
}
