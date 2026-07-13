import { create } from 'zustand';
import type { Resource, OrgNodeStatus, ResourceType } from '@/types';
import { resources, flattenResources } from '@/mock/resourceData';
import { generateUUID, generateResourceCode } from '@/utils/idGenerator';
import { getNow } from '@/utils/dateUtils';

interface ResourceState {
  resources: Resource[];
  selectedResourceId: string | null;
  loading: boolean;
  setSelectedResourceId: (id: string | null) => void;
  getResourceById: (id: string) => Resource | undefined;
  getChildren: (parentId: string | null) => Resource[];
  getDescendants: (parentId: string) => Resource[];
  getTree: () => Resource[];
  getFlatList: () => Resource[];
  getResourcesByType: (type: ResourceType) => Resource[];
  addResource: (resource: Omit<Resource, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'children'>) => Resource;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  activateResource: (id: string, cascade?: boolean) => void;
  deactivateResource: (id: string, cascade?: boolean) => void;
  moveResource: (id: string, newParentId: string | null, newSort?: number) => void;
  searchResources: (keyword: string) => Resource[];
  getNextCode: () => string;
}

const collectAllDescendantIds = (resourcesList: Resource[], parentId: string): string[] => {
  const ids: string[] = [];
  const findInList = (list: Resource[], pid: string): string[] => {
    const result: string[] = [];
    list.forEach((item) => {
      if (item.parentId === pid) {
        result.push(item.id);
        if (item.children && item.children.length > 0) {
          result.push(...findInList(item.children, item.id));
        }
      } else if (item.children && item.children.length > 0) {
        result.push(...findInList(item.children, pid));
      }
    });
    return result;
  };
  return findInList(resourcesList, parentId);
};

const updateInTree = (
  resourcesList: Resource[],
  id: string,
  updates: Partial<Resource>
): Resource[] => {
  return resourcesList.map((r) => {
    if (r.id === id) {
      return { ...r, ...updates };
    }
    if (r.children && r.children.length > 0) {
      return { ...r, children: updateInTree(r.children, id, updates) };
    }
    return r;
  });
};

const deleteFromTree = (resourcesList: Resource[], id: string): Resource[] => {
  return resourcesList
    .filter((r) => r.id !== id)
    .map((r) => {
      if (r.children && r.children.length > 0) {
        return { ...r, children: deleteFromTree(r.children, id) };
      }
      return r;
    });
};

const addToTree = (
  resourcesList: Resource[],
  parentId: string | null,
  newResource: Resource
): Resource[] => {
  if (parentId === null) {
    return [...resourcesList, newResource];
  }
  return resourcesList.map((r) => {
    if (r.id === parentId) {
      return { ...r, children: [...(r.children || []), newResource] };
    }
    if (r.children && r.children.length > 0) {
      return { ...r, children: addToTree(r.children, parentId, newResource) };
    }
    return r;
  });
};

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: resources,
  selectedResourceId: null,
  loading: false,

  setSelectedResourceId: (id) => set({ selectedResourceId: id }),

  getResourceById: (id) => {
    const flat = get().getFlatList();
    return flat.find((r) => r.id === id);
  },

  getChildren: (parentId) => {
    const findChildren = (list: Resource[]): Resource[] => {
      for (const item of list) {
        if (item.id === parentId && item.children) {
          return item.children.sort((a, b) => a.sort - b.sort);
        }
        if (item.children) {
          const found = findChildren(item.children);
          if (found.length > 0) return found;
        }
      }
      if (parentId === null) {
        return list.sort((a, b) => a.sort - b.sort);
      }
      return [];
    };
    return findChildren(get().resources);
  },

  getDescendants: (parentId) => {
    const result: Resource[] = [];
    const flat = get().getFlatList();
    const collect = (pid: string) => {
      const children = flat.filter((r) => r.parentId === pid);
      children.forEach((child) => {
        result.push(child);
        collect(child.id);
      });
    };
    collect(parentId);
    return result;
  },

  getTree: () => get().resources,

  getFlatList: () => flattenResources(get().resources),

  getResourcesByType: (type) =>
    get().getFlatList().filter((r) => r.type === type),

  getNextCode: () => {
    const flat = get().getFlatList();
    const maxCode = flat.reduce((max, r) => {
      const num = parseInt(r.code.replace('RES_', ''), 10);
      return num > max ? num : max;
    }, 0);
    return generateResourceCode(maxCode + 1);
  },

  addResource: (resource) => {
    const newResource: Resource = {
      ...resource,
      id: generateUUID(),
      code: get().getNextCode(),
      status: resource.status || 'ACTIVE',
      children: resource.type === 'MENU' ? [] : undefined,
    };
    set((state) => ({
      resources: addToTree(state.resources, resource.parentId, newResource),
    }));
    return newResource;
  },

  updateResource: (id, updates) => {
    set((state) => ({
      resources: updateInTree(state.resources, id, { ...updates }),
    }));
  },

  deleteResource: (id) => {
    set((state) => ({
      resources: deleteFromTree(state.resources, id),
      selectedResourceId: state.selectedResourceId === id ? null : state.selectedResourceId,
    }));
  },

  activateResource: (id, cascade = true) => {
    if (cascade) {
      const ids = [id, ...collectAllDescendantIds(get().resources, id).map((d) => d)];
      let updated = get().resources;
      ids.forEach((rid) => {
        updated = updateInTree(updated, rid, { status: 'ACTIVE' as OrgNodeStatus });
      });
      set({ resources: updated });
    } else {
      get().updateResource(id, { status: 'ACTIVE' as OrgNodeStatus });
    }
  },

  deactivateResource: (id, cascade = true) => {
    if (cascade) {
      const ids = [id, ...collectAllDescendantIds(get().resources, id).map((d) => d)];
      let updated = get().resources;
      ids.forEach((rid) => {
        updated = updateInTree(updated, rid, { status: 'INACTIVE' as OrgNodeStatus });
      });
      set({ resources: updated });
    } else {
      get().updateResource(id, { status: 'INACTIVE' as OrgNodeStatus });
    }
  },

  moveResource: (id, newParentId, newSort) => {
    const resource = get().getResourceById(id);
    if (!resource) return;

    const updates: Partial<Resource> = { parentId: newParentId };
    if (newSort !== undefined) {
      updates.sort = newSort;
    }

    set((state) => {
      let newResources = deleteFromTree(state.resources, id);
      const movedResource = { ...resource, ...updates };
      newResources = addToTree(newResources, newParentId, movedResource);
      return { resources: newResources };
    });
  },

  searchResources: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().getFlatList().filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.code.toLowerCase().includes(kw) ||
        (r.path && r.path.toLowerCase().includes(kw))
    );
  },
}));

export default useResourceStore;
