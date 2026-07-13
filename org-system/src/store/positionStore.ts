import { create } from 'zustand';
import type { Position, OrgNodeStatus } from '@/types';
import { positions } from '@/mock/positionData';
import { generateUUID, generatePositionCode } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface PositionState {
  positions: Position[];
  selectedPositionId: string | null;
  loading: boolean;
  setSelectedPositionId: (id: string | null) => void;
  getPositionById: (id: string) => Position | undefined;
  getPositionsByOrgNode: (orgNodeId: string) => Position[];
  getPositionsByFunctionSet: (functionSetId: string) => Position[];
  getPositionsByStatus: (status: OrgNodeStatus) => Position[];
  addPosition: (position: Omit<Position, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Position;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  deletePosition: (id: string) => void;
  activatePosition: (id: string) => void;
  deactivatePosition: (id: string) => void;
  restorePosition: (id: string) => void;
  assignFunctionSet: (positionId: string, functionSetId: string) => void;
  unassignFunctionSet: (positionId: string, functionSetId: string) => void;
  searchPositions: (keyword: string) => Position[];
  getNextCode: () => string;
}

export const usePositionStore = create<PositionState>((set, get) => ({
  positions: positions,
  selectedPositionId: null,
  loading: false,

  setSelectedPositionId: (id) => set({ selectedPositionId: id }),

  getPositionById: (id) => get().positions.find((p) => p.id === id),

  getPositionsByOrgNode: (orgNodeId) =>
    get().positions.filter((p) => p.orgNodeId === orgNodeId),

  getPositionsByFunctionSet: (functionSetId) =>
    get().positions.filter((p) => p.functionSetIds.includes(functionSetId)),

  getPositionsByStatus: (status) =>
    get().positions.filter((p) => p.status === status),

  getNextCode: () => {
    const maxCode = get().positions.reduce((max, p) => {
      const num = parseInt(p.code.replace('POS_', ''), 10);
      return num > max ? num : max;
    }, 0);
    return generatePositionCode(maxCode + 1);
  },

  addPosition: (position) => {
    const newPosition: Position = {
      ...position,
      id: generateUUID(),
      code: get().getNextCode(),
      status: position.status || 'ACTIVE',
      functionSetIds: position.functionSetIds || [],
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    set((state) => ({ positions: [...state.positions, newPosition] }));
    return newPosition;
  },

  updatePosition: (id, updates) => {
    set((state) => ({
      positions: state.positions.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: getNow() } : p
      ),
    }));
  },

  deletePosition: (id) => {
    get().updatePosition(id, { status: 'DELETED' as OrgNodeStatus });
  },

  activatePosition: (id) => {
    get().updatePosition(id, { status: 'ACTIVE' as OrgNodeStatus });
  },

  deactivatePosition: (id) => {
    get().updatePosition(id, { status: 'INACTIVE' as OrgNodeStatus });
  },

  restorePosition: (id) => {
    get().updatePosition(id, { status: 'ACTIVE' as OrgNodeStatus });
  },

  assignFunctionSet: (positionId, functionSetId) => {
    const position = get().getPositionById(positionId);
    if (position && !position.functionSetIds.includes(functionSetId)) {
      get().updatePosition(positionId, {
        functionSetIds: [...position.functionSetIds, functionSetId],
      });
    }
  },

  unassignFunctionSet: (positionId, functionSetId) => {
    const position = get().getPositionById(positionId);
    if (position) {
      get().updatePosition(positionId, {
        functionSetIds: position.functionSetIds.filter((id) => id !== functionSetId),
      });
    }
  },

  searchPositions: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().positions.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw))
    );
  },
}));

export default usePositionStore;
