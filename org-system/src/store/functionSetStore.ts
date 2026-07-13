import { create } from 'zustand';
import type { FunctionSet, OrgNodeStatus } from '@/types';
import { functionSets } from '@/mock/functionSetData';
import { generateUUID, generateFunctionSetCode } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface FunctionSetState {
  functionSets: FunctionSet[];
  selectedFunctionSetId: string | null;
  loading: boolean;
  setSelectedFunctionSetId: (id: string | null) => void;
  getFunctionSetById: (id: string) => FunctionSet | undefined;
  getFunctionSetsByStatus: (status: OrgNodeStatus) => FunctionSet[];
  addFunctionSet: (fs: Omit<FunctionSet, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => FunctionSet;
  updateFunctionSet: (id: string, updates: Partial<FunctionSet>) => void;
  deleteFunctionSet: (id: string) => void;
  activateFunctionSet: (id: string) => void;
  deactivateFunctionSet: (id: string) => void;
  assignResource: (functionSetId: string, resourceId: string) => void;
  unassignResource: (functionSetId: string, resourceId: string) => void;
  batchAssignResources: (functionSetId: string, resourceIds: string[]) => void;
  searchFunctionSets: (keyword: string) => FunctionSet[];
  getNextCode: () => string;
}

export const useFunctionSetStore = create<FunctionSetState>((set, get) => ({
  functionSets: functionSets,
  selectedFunctionSetId: null,
  loading: false,

  setSelectedFunctionSetId: (id) => set({ selectedFunctionSetId: id }),

  getFunctionSetById: (id) => get().functionSets.find((fs) => fs.id === id),

  getFunctionSetsByStatus: (status) =>
    get().functionSets.filter((fs) => fs.status === status),

  getNextCode: () => {
    const maxCode = get().functionSets.reduce((max, fs) => {
      const num = parseInt(fs.code.replace('FNS_', ''), 10);
      return num > max ? num : max;
    }, 0);
    return generateFunctionSetCode(maxCode + 1);
  },

  addFunctionSet: (fs) => {
    const newFs: FunctionSet = {
      ...fs,
      id: generateUUID(),
      code: get().getNextCode(),
      status: fs.status || 'ACTIVE',
      resourceIds: fs.resourceIds || [],
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    set((state) => ({ functionSets: [...state.functionSets, newFs] }));
    return newFs;
  },

  updateFunctionSet: (id, updates) => {
    set((state) => ({
      functionSets: state.functionSets.map((fs) =>
        fs.id === id ? { ...fs, ...updates, updatedAt: getNow() } : fs
      ),
    }));
  },

  deleteFunctionSet: (id) => {
    set((state) => ({
      functionSets: state.functionSets.filter((fs) => fs.id !== id),
      selectedFunctionSetId:
        state.selectedFunctionSetId === id ? null : state.selectedFunctionSetId,
    }));
  },

  activateFunctionSet: (id) => {
    get().updateFunctionSet(id, { status: 'ACTIVE' as OrgNodeStatus });
  },

  deactivateFunctionSet: (id) => {
    get().updateFunctionSet(id, { status: 'INACTIVE' as OrgNodeStatus });
  },

  assignResource: (functionSetId, resourceId) => {
    const fs = get().getFunctionSetById(functionSetId);
    if (fs && !fs.resourceIds.includes(resourceId)) {
      get().updateFunctionSet(functionSetId, {
        resourceIds: [...fs.resourceIds, resourceId],
      });
    }
  },

  unassignResource: (functionSetId, resourceId) => {
    const fs = get().getFunctionSetById(functionSetId);
    if (fs) {
      get().updateFunctionSet(functionSetId, {
        resourceIds: fs.resourceIds.filter((id) => id !== resourceId),
      });
    }
  },

  batchAssignResources: (functionSetId, resourceIds) => {
    const fs = get().getFunctionSetById(functionSetId);
    if (fs) {
      const newResourceIds = [...new Set([...fs.resourceIds, ...resourceIds])];
      get().updateFunctionSet(functionSetId, { resourceIds: newResourceIds });
    }
  },

  searchFunctionSets: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().functionSets.filter(
      (fs) =>
        fs.name.toLowerCase().includes(kw) ||
        fs.code.toLowerCase().includes(kw) ||
        (fs.description && fs.description.toLowerCase().includes(kw))
    );
  },
}));

export default useFunctionSetStore;
