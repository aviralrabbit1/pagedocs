import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Collaboration from '@tiptap/extension-collaboration';
import type * as Y from 'yjs';

import { FontSize } from './extensions/font-size';
import { Indent } from './extensions/indent';
import { Bookmark } from './extensions/bookmark';
import { SearchReplace } from './extensions/search-replace';

// Builds the full Phase 1 extension set, bound to a Yjs document so the
// editor is collaboration-ready from day one (real-time provider added in
// Phase 6). History is delegated to Yjs, so StarterKit's history is disabled.
export function buildExtensions(ydoc: Y.Doc): Extensions {
  return [
    StarterKit.configure({
      history: false,
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    FontFamily,
    FontSize,
    Indent,
    Bookmark,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
    }),
    SearchReplace,
    Collaboration.configure({ document: ydoc }),
  ];
}

export const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

export const FONT_SIZES = ['10', '12', '14', '16', '18', '24', '32', '48'];
