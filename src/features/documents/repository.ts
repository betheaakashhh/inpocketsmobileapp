import { useQuery } from '@tanstack/react-query';

import { api } from '@/core/api/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AppDocument {
  id: string;
  documentType: string;
  contentType: string;
  sizeBytes: number;
  version: number;
  isImmutable: boolean;
  createdAt: Date;
  documentFamilyId: string;
}

export const isImageDoc = (d: AppDocument) => d.contentType.startsWith('image/');

export function readableSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const docFromJson = (j: any): AppDocument => ({
  id: j.id,
  documentType: j.document_type,
  contentType: j.content_type,
  sizeBytes: j.size_bytes,
  version: j.version,
  isImmutable: j.is_immutable,
  createdAt: new Date(j.created_at),
  documentFamilyId: j.document_family_id,
});

export const documentsRepository = {
  async list(): Promise<AppDocument[]> {
    const d = await api.get<{ items: unknown[] }>('/documents');
    return d.items.map(docFromJson);
  },
  async listVersions(familyId: string): Promise<AppDocument[]> {
    const d = await api.get<{ items: unknown[] }>(`/documents/family/${familyId}/versions`);
    return d.items.map(docFromJson);
  },
  /** Returns base64 so it can be shown via a data: URI. */
  getContentBase64: (id: string) => api.getBase64(`/documents/${id}/content`),
};

export const useDocuments = () => useQuery({ queryKey: ['documents'], queryFn: documentsRepository.list });
