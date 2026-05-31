import { Mark, mergeAttributes } from '@tiptap/core';

export interface BookmarkAttrs {
  id: string;
  name: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bookmark: {
      setBookmark: (attrs: BookmarkAttrs) => ReturnType;
      unsetBookmark: () => ReturnType;
    };
  }
}

// A named anchor over a span of text. Links can target it via #<id>.
export const Bookmark = Mark.create({
  name: 'bookmark',
  inclusive: false,

  addAttributes() {
    return {
      id: { default: null },
      name: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-bookmark]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-bookmark': '',
        class: 'pd-bookmark',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setBookmark:
        (attrs: BookmarkAttrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetBookmark:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
