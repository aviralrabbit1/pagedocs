import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { Node as PMNode } from '@tiptap/pm/model';

export interface SearchMatch {
  from: number;
  to: number;
}

export interface SearchState {
  term: string;
  caseSensitive: boolean;
  results: SearchMatch[];
  current: number; // index into results, -1 if none
  decorations: DecorationSet;
}

export const searchReplaceKey = new PluginKey<SearchState>('searchReplace');

interface SearchMeta {
  term?: string;
  caseSensitive?: boolean;
  setCurrent?: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setSearchCaseSensitive: (value: boolean) => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      replaceAll: (replacement: string) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

function findMatches(
  doc: PMNode,
  term: string,
  caseSensitive: boolean,
): SearchMatch[] {
  const results: SearchMatch[] = [];
  if (!term) {
    return results;
  }
  const needle = caseSensitive ? term : term.toLowerCase();
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) {
      return;
    }
    const haystack = caseSensitive ? node.text : node.text.toLowerCase();
    let idx = haystack.indexOf(needle);
    while (idx !== -1) {
      const from = pos + idx;
      results.push({ from, to: from + term.length });
      idx = haystack.indexOf(needle, idx + Math.max(term.length, 1));
    }
  });
  return results;
}

export function getSearchState(state: EditorState): SearchState | undefined {
  return searchReplaceKey.getState(state);
}

export const SearchReplace = Extension.create({
  name: 'searchReplace',

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchReplaceKey,
        state: {
          init: () => ({
            term: '',
            caseSensitive: false,
            results: [],
            current: -1,
            decorations: DecorationSet.empty,
          }),
          apply(tr: Transaction, value: SearchState, _old, newState): SearchState {
            const meta = tr.getMeta(searchReplaceKey) as SearchMeta | undefined;
            let term = value.term;
            let caseSensitive = value.caseSensitive;
            let current = value.current;

            if (meta) {
              if (meta.term !== undefined) {
                term = meta.term;
                current = -1;
              }
              if (meta.caseSensitive !== undefined) {
                caseSensitive = meta.caseSensitive;
              }
              if (meta.setCurrent !== undefined) {
                current = meta.setCurrent;
              }
            }

            if (!meta && !tr.docChanged) {
              return value;
            }

            const results = findMatches(newState.doc, term, caseSensitive);
            if (results.length === 0) {
              current = -1;
            } else if (current < 0 || current >= results.length) {
              current = meta?.setCurrent !== undefined ? current : 0;
              if (current < 0 || current >= results.length) {
                current = 0;
              }
            }

            const decorations = DecorationSet.create(
              newState.doc,
              results.map((m, i) =>
                Decoration.inline(m.from, m.to, {
                  class: i === current ? 'pd-search-current' : 'pd-search-match',
                }),
              ),
            );

            return { term, caseSensitive, results, current, decorations };
          },
        },
        props: {
          decorations(state) {
            return searchReplaceKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },

  addCommands() {
    const selectMatch =
      (indexResolver: (s: SearchState) => number) =>
      ({ state, dispatch }: { state: EditorState; dispatch?: (tr: Transaction) => void }) => {
        const search = searchReplaceKey.getState(state);
        if (!search || search.results.length === 0) {
          return false;
        }
        const index = indexResolver(search);
        const match = search.results[index];
        if (dispatch) {
          const tr = state.tr.setMeta(searchReplaceKey, { setCurrent: index });
          tr.setSelection(TextSelection.create(tr.doc, match.from, match.to));
          tr.scrollIntoView();
          dispatch(tr);
        }
        return true;
      };

    return {
      setSearchTerm:
        (term: string) =>
        ({ state, dispatch }) => {
          if (dispatch) {
            dispatch(state.tr.setMeta(searchReplaceKey, { term }));
          }
          return true;
        },
      setSearchCaseSensitive:
        (value: boolean) =>
        ({ state, dispatch }) => {
          if (dispatch) {
            dispatch(state.tr.setMeta(searchReplaceKey, { caseSensitive: value }));
          }
          return true;
        },
      findNext: () =>
        selectMatch((s) => (s.current + 1) % s.results.length),
      findPrevious: () =>
        selectMatch((s) => (s.current - 1 + s.results.length) % s.results.length),
      replaceCurrent:
        (replacement: string) =>
        ({ state, dispatch }) => {
          const search = searchReplaceKey.getState(state);
          if (!search || search.current < 0) {
            return false;
          }
          const match = search.results[search.current];
          if (dispatch) {
            const tr = state.tr.insertText(replacement, match.from, match.to);
            tr.setMeta(searchReplaceKey, { setCurrent: search.current });
            dispatch(tr);
          }
          return true;
        },
      replaceAll:
        (replacement: string) =>
        ({ state, dispatch }) => {
          const search = searchReplaceKey.getState(state);
          if (!search || search.results.length === 0) {
            return false;
          }
          if (dispatch) {
            const tr = state.tr;
            // Replace from last to first so earlier positions stay valid.
            for (let i = search.results.length - 1; i >= 0; i--) {
              const m = search.results[i];
              tr.insertText(replacement, m.from, m.to);
            }
            tr.setMeta(searchReplaceKey, { setCurrent: -1 });
            dispatch(tr);
          }
          return true;
        },
      clearSearch:
        () =>
        ({ state, dispatch }) => {
          if (dispatch) {
            dispatch(state.tr.setMeta(searchReplaceKey, { term: '' }));
          }
          return true;
        },
    };
  },
});
