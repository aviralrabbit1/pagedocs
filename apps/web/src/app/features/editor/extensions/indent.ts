import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const STEP = 32; // px per indent level
const MAX_LEVEL = 8;

// Adds block indentation (margin-left) to paragraphs and headings.
// Lists keep their own Tab-based nesting; this targets top-level blocks.
export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return { types: ['paragraph', 'heading'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) => {
              const value = parseInt(element.style.marginLeft || '0', 10);
              return Number.isNaN(value) ? 0 : Math.round(value / STEP);
            },
            renderHTML: (attributes: { indent?: number }) => {
              if (!attributes.indent) {
                return {};
              }
              return { style: `margin-left: ${attributes.indent * STEP}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const setIndent = (delta: number) => () => {
      return ({ state, dispatch }: { state: any; dispatch: any }): boolean => {
        const { selection, tr } = state;
        const { from, to } = selection;
        let changed = false;
        state.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (!this.options.types.includes(node.type.name)) {
            return;
          }
          const current = (node.attrs.indent as number) ?? 0;
          const next = Math.min(MAX_LEVEL, Math.max(0, current + delta));
          if (next !== current) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: next,
            });
            changed = true;
          }
        });
        if (changed && dispatch) {
          dispatch(tr);
        }
        return changed;
      };
    };

    return {
      indent: setIndent(1),
      outdent: setIndent(-1),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-]': () => this.editor.commands.indent(),
      'Mod-[': () => this.editor.commands.outdent(),
    };
  },
});
