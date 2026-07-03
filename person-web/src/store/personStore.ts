import { create } from 'zustand';
import { Person } from '@/types/person';
import { initialPersons } from '@/data/mockData';

interface PersonStore {
  persons: Person[];
  searchQuery: string;
  sortBy: 'joinDate' | 'name';
  selectedPerson: Person | null;
  isModalOpen: boolean;
  isDrawerOpen: boolean;
  modalMode: 'create' | 'edit';
  deleteId: string | null;

  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'joinDate' | 'name') => void;
  openCreateModal: () => void;
  openEditModal: (person: Person) => void;
  closeModal: () => void;
  openDrawer: (person: Person) => void;
  closeDrawer: () => void;
  confirmDelete: (id: string) => void;
  cancelDelete: () => void;
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (id: string, person: Omit<Person, 'id'>) => void;
  deletePerson: (id: string) => void;
}

export const usePersonStore = create<PersonStore>((set) => ({
  persons: initialPersons,
  searchQuery: '',
  sortBy: 'joinDate',
  selectedPerson: null,
  isModalOpen: false,
  isDrawerOpen: false,
  modalMode: 'create',
  deleteId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),

  openCreateModal: () =>
    set({ isModalOpen: true, modalMode: 'create', selectedPerson: null }),
  openEditModal: (person) =>
    set({ isModalOpen: true, modalMode: 'edit', selectedPerson: person }),
  closeModal: () =>
    set({ isModalOpen: false, selectedPerson: null }),

  openDrawer: (person) =>
    set({ isDrawerOpen: true, selectedPerson: person }),
  closeDrawer: () =>
    set({ isDrawerOpen: false, selectedPerson: null }),

  confirmDelete: (id) => set({ deleteId: id }),
  cancelDelete: () => set({ deleteId: null }),

  addPerson: (person) =>
    set((state) => ({
      persons: [
        ...state.persons,
        { ...person, id: crypto.randomUUID() },
      ],
    })),
  updatePerson: (id, person) =>
    set((state) => ({
      persons: state.persons.map((p) =>
        p.id === id ? { ...person, id } : p
      ),
    })),
  deletePerson: (id) =>
    set((state) => ({
      persons: state.persons.filter((p) => p.id !== id),
      deleteId: null,
      isDrawerOpen: state.selectedPerson?.id === id ? false : state.isDrawerOpen,
      selectedPerson: state.selectedPerson?.id === id ? null : state.selectedPerson,
    })),
}));
