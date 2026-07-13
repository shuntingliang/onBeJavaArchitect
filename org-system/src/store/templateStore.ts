import { create } from 'zustand';
import type { Template, TemplateStatus, TemplateType, TemplateNode } from '@/types';
import { templates } from '@/mock/templateData';
import { generateUUID } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface TemplateState {
  templates: Template[];
  selectedTemplateId: string | null;
  loading: boolean;
  setSelectedTemplateId: (id: string | null) => void;
  getTemplateById: (id: string) => Template | undefined;
  getTemplatesByType: (type: TemplateType) => Template[];
  getTemplatesByStatus: (status: TemplateStatus) => Template[];
  getVersions: (code: string) => Template[];
  getLatestVersion: (code: string) => Template | undefined;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'versionNo'>) => Template;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  publishTemplate: (id: string) => void;
  draftTemplate: (id: string) => void;
  deactivateTemplate: (id: string) => void;
  createNewVersion: (sourceId: string, newVersion: string, content?: string, nodes?: TemplateNode[]) => Template;
  searchTemplates: (keyword: string) => Template[];
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: templates,
  selectedTemplateId: null,
  loading: false,

  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

  getTemplateById: (id) => get().templates.find((t) => t.id === id),

  getTemplatesByType: (type) => get().templates.filter((t) => t.type === type),

  getTemplatesByStatus: (status) => get().templates.filter((t) => t.status === status),

  getVersions: (code) =>
    get()
      .templates.filter((t) => t.code === code)
      .sort((a, b) => b.versionNo - a.versionNo),

  getLatestVersion: (code) => {
    const versions = get().getVersions(code);
    return versions.length > 0 ? versions[0] : undefined;
  },

  addTemplate: (template) => {
    const versions = get().getVersions(template.code);
    const maxVersionNo = versions.reduce((max, v) => Math.max(max, v.versionNo), 0);
    const newTemplate: Template = {
      ...template,
      id: generateUUID(),
      versionNo: maxVersionNo + 1,
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    set((state) => ({ templates: [...state.templates, newTemplate] }));
    return newTemplate;
  },

  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: getNow() } : t
      ),
    }));
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId,
    }));
  },

  publishTemplate: (id) => {
    get().updateTemplate(id, { status: 'PUBLISHED' as TemplateStatus });
  },

  draftTemplate: (id) => {
    get().updateTemplate(id, { status: 'DRAFT' as TemplateStatus });
  },

  deactivateTemplate: (id) => {
    get().updateTemplate(id, { status: 'INACTIVE' as TemplateStatus });
  },

  createNewVersion: (sourceId, newVersion, content, nodes?) => {
    const source = get().getTemplateById(sourceId);
    if (!source) {
      throw new Error('Source template not found');
    }

    const versions = get().getVersions(source.code);
    const maxVersionNo = versions.reduce((max, v) => Math.max(max, v.versionNo), 0);

    const newTemplate: Template = {
      ...source,
      id: generateUUID(),
      version: newVersion,
      versionNo: maxVersionNo + 1,
      status: 'DRAFT' as TemplateStatus,
      parentVersionId: sourceId,
      content: content !== undefined ? content : source.content,
      nodes: nodes !== undefined ? nodes : source.nodes,
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    set((state) => ({ templates: [...state.templates, newTemplate] }));
    return newTemplate;
  },

  searchTemplates: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().templates.filter(
      (t) =>
        t.name.toLowerCase().includes(kw) ||
        t.code.toLowerCase().includes(kw) ||
        t.version.toLowerCase().includes(kw)
    );
  },
}));

export default useTemplateStore;
