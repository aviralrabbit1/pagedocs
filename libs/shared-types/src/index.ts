// Shared, compile-time-only types for PageDocs.
// IMPORTANT: keep this package type-only (no runtime values / no `enum`,
// use string-literal unions instead) so consumers can `import type` it
// without any runtime module resolution.

// ── Enumerated string unions ──────────────────────────────────────────────
export type AuthProvider = 'local' | 'google';
export type StorageProvider = 'db' | 'github' | 'google_drive';
export type OAuthProvider = 'google' | 'github' | 'google_drive';
export type PermissionRole = 'owner' | 'editor' | 'commenter' | 'viewer';
export type ExportTarget = 'docx' | 'pdf' | 'rtf' | 'txt';
export type ExportJobStatus = 'queued' | 'processing' | 'done' | 'failed';
export type SuggestionType = 'insert' | 'delete' | 'format';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

// ── Domain entities (API surface shapes) ──────────────────────────────────
export interface UserDto {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  createdAt: string;
}

export interface PageSetup {
  margins: { top: number; right: number; bottom: number; left: number };
  orientation: 'portrait' | 'landscape';
  size: 'A4' | 'Letter' | 'Legal' | string;
  columns: number;
}

export interface DocumentSummaryDto {
  id: string;
  title: string;
  storageProvider: StorageProvider;
  ownerId: string;
  updatedAt: string;
  createdAt: string;
}

export interface DocumentDto extends DocumentSummaryDto {
  // ProseMirror/Yjs document JSON (null when stored externally).
  content: ProseMirrorNode | null;
  pageSetup: PageSetup;
  currentVersionId: string | null;
}

// Minimal structural type for a ProseMirror document node.
export interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

export interface CommentDto {
  id: string;
  documentId: string;
  authorId: string;
  anchor: Record<string, unknown>;
  body: string;
  resolved: boolean;
  parentId: string | null;
  createdAt: string;
}

export interface DocumentVersionDto {
  id: string;
  documentId: string;
  authorId: string;
  label: string | null;
  createdAt: string;
}

// ── Auth DTOs ──────────────────────────────────────────────────────────────
export interface RegisterDto {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResultDto extends AuthTokensDto {
  user: UserDto;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
}

// ── Document write DTOs ─────────────────────────────────────────────────────
export interface CreateDocumentDto {
  title?: string;
  storageProvider?: StorageProvider;
}

export interface UpdateDocumentDto {
  title?: string;
  content?: ProseMirrorNode;
  pageSetup?: Partial<PageSetup>;
}
