import { create } from 'zustand';
import type { OrgNode, OrgNodeStatus, OrgNodeType } from '@/types';
import { orgNodes } from '@/mock/orgData';
import { generateUUID } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface OrgState {
  nodes: OrgNode[];
  selectedNodeId: string | null;
  loading: boolean;
  setSelectedNodeId: (id: string | null) => void;
  getNodeById: (id: string) => OrgNode | undefined;
  getChildren: (parentId: string | null) => OrgNode[];
  getDescendants: (parentId: string) => OrgNode[];
  getPath: (nodeId: string) => OrgNode[];
  addNode: (node: Omit<OrgNode, 'id' | 'createdAt' | 'updatedAt'>) => OrgNode;
  updateNode: (id: string, updates: Partial<OrgNode>) => void;
  deleteNode: (id: string) => void;
  activateNode: (id: string) => void;
  deactivateNode: (id: string, includeChildren?: boolean) => void;
  deriveNode: (sourceId: string, newName: string, newParentId: string | null) => OrgNode;
  mergeNodes: (sourceIds: string[], targetId: string) => void;
  moveNode: (id: string, newParentId: string | null, newSort?: number) => void;
  getTree: () => OrgNode[];
  getNodesByType: (type: OrgNodeType) => OrgNode[];
  searchNodes: (keyword: string) => OrgNode[];
}

export const useOrgStore = create<OrgState>((set, get) => ({
  nodes: orgNodes,
  selectedNodeId: null,
  loading: false,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  getNodeById: (id) => get().nodes.find((n) => n.id === id),

  getChildren: (parentId) =>
    get()
      .nodes.filter((n) => n.parentId === parentId)
      .sort((a, b) => a.sort - b.sort),

  getDescendants: (parentId) => {
    const result: OrgNode[] = [];
    const collect = (pid: string) => {
      const children = get().nodes.filter((n) => n.parentId === pid);
      children.forEach((child) => {
        result.push(child);
        collect(child.id);
      });
    };
    collect(parentId);
    return result;
  },

  getPath: (nodeId) => {
    const path: OrgNode[] = [];
    let currentId: string | null = nodeId;
    while (currentId) {
      const node = get().getNodeById(currentId);
      if (node) {
        path.unshift(node);
        currentId = node.parentId;
      } else {
        break;
      }
    }
    return path;
  },

  addNode: (node) => {
    const newNode: OrgNode = {
      ...node,
      id: generateUUID(),
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    return newNode;
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: getNow() } : n
      ),
    }));
  },

  deleteNode: (id) => {
    const descendants = get().getDescendants(id);
    const idsToDelete = [id, ...descendants.map((d) => d.id)];
    set((state) => ({
      nodes: state.nodes.filter((n) => !idsToDelete.includes(n.id)),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  activateNode: (id) => {
    get().updateNode(id, { status: 'ACTIVE' as OrgNodeStatus });
  },

  deactivateNode: (id, includeChildren = true) => {
    if (includeChildren) {
      const descendants = get().getDescendants(id);
      const ids = [id, ...descendants.map((d) => d.id)];
      set((state) => ({
        nodes: state.nodes.map((n) =>
          ids.includes(n.id) ? { ...n, status: 'INACTIVE' as OrgNodeStatus, updatedAt: getNow() } : n
        ),
      }));
    } else {
      get().updateNode(id, { status: 'INACTIVE' as OrgNodeStatus });
    }
  },

  deriveNode: (sourceId, newName, newParentId) => {
    const source = get().getNodeById(sourceId);
    if (!source) {
      throw new Error('Source node not found');
    }
    const newNode: OrgNode = {
      ...source,
      id: generateUUID(),
      name: newName,
      code: `${source.code}_D`,
      parentId: newParentId,
      createdAt: getNow(),
      updatedAt: getNow(),
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));

    const sourceChildren = get().getChildren(sourceId);
    const deriveChildren = (parentSourceId: string, newParentId: string) => {
      const children = get().getChildren(parentSourceId);
      children.forEach((child) => {
        const newChild: OrgNode = {
          ...child,
          id: generateUUID(),
          parentId: newParentId,
          code: `${child.code}_D`,
          createdAt: getNow(),
          updatedAt: getNow(),
        };
        set((state) => ({ nodes: [...state.nodes, newChild] }));
        deriveChildren(child.id, newChild.id);
      });
    };
    deriveChildren(sourceId, newNode.id);

    return newNode;
  },

  mergeNodes: (sourceIds, targetId) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        sourceIds.includes(n.id) && n.parentId
          ? { ...n, parentId: targetId, updatedAt: getNow() }
          : n
      ),
    }));
  },

  moveNode: (id, newParentId, newSort) => {
    const updates: Partial<OrgNode> = { parentId: newParentId };
    if (newSort !== undefined) {
      updates.sort = newSort;
    }
    get().updateNode(id, updates);
  },

  getTree: () => {
    const roots = get()
      .nodes.filter((n) => n.parentId === null)
      .sort((a, b) => a.sort - b.sort);
    const buildTree = (nodes: OrgNode[]): OrgNode[] => {
      return nodes.map((node) => {
        const children = get()
          .nodes.filter((n) => n.parentId === node.id)
          .sort((a, b) => a.sort - b.sort);
        return {
          ...node,
          children: children.length > 0 ? buildTree(children) : undefined,
        } as OrgNode;
      });
    };
    return buildTree(roots);
  },

  getNodesByType: (type) => get().nodes.filter((n) => n.type === type),

  searchNodes: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(kw) ||
        n.code.toLowerCase().includes(kw)
    );
  },
}));

export default useOrgStore;
