import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Task, List, CreateTaskInput, UpdateTaskInput, CreateListInput, UpdateListInput, FilterType } from '../types';

interface AppState {
  lists: List[];
  tasks: Task[];
  selectedListId: string | null;
  selectedTask: Task | null;
  filter: FilterType;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLists: () => Promise<void>;
  fetchTasks: (listId?: string) => Promise<void>;
  fetchFilteredTasks: (filter: FilterType) => Promise<void>;
  searchTasks: (query: string) => Promise<void>;

  createList: (input: CreateListInput) => Promise<List>;
  updateList: (input: UpdateListInput) => Promise<List>;
  deleteList: (id: string) => Promise<void>;

  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskImportant: (id: string) => Promise<Task>;
  toggleTaskCompleted: (id: string) => Promise<Task>;

  setSelectedListId: (id: string | null) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  lists: [],
  tasks: [],
  selectedListId: null,
  selectedTask: null,
  filter: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchLists: async () => {
    try {
      set({ isLoading: true, error: null });
      const lists = await invoke<List[]>('get_lists');
      set({ lists, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchTasks: async (listId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const tasks = await invoke<Task[]>('get_tasks', { listId: listId || null });
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  fetchFilteredTasks: async (filter: FilterType) => {
    try {
      set({ isLoading: true, error: null, filter });
      let tasks: Task[];

      switch (filter) {
        case 'today':
          tasks = await invoke<Task[]>('get_today_tasks');
          break;
        case 'planned':
          tasks = await invoke<Task[]>('get_planned_tasks');
          break;
        case 'important':
          tasks = await invoke<Task[]>('get_important_tasks');
          break;
        case 'completed':
          tasks = await invoke<Task[]>('get_completed_tasks');
          break;
        default:
          tasks = await invoke<Task[]>('get_tasks', { listId: get().selectedListId || null });
      }

      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  searchTasks: async (query: string) => {
    try {
      set({ isLoading: true, error: null, searchQuery: query });
      if (!query.trim()) {
        const { filter } = get();
        await get().fetchFilteredTasks(filter);
        return;
      }
      const tasks = await invoke<Task[]>('search_tasks', { query });
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createList: async (input: CreateListInput) => {
    try {
      set({ isLoading: true, error: null });
      const list = await invoke<List>('create_list', { input });
      await get().fetchLists();
      set({ isLoading: false });
      return list;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateList: async (input: UpdateListInput) => {
    try {
      set({ isLoading: true, error: null });
      const list = await invoke<List>('update_list', { input });
      await get().fetchLists();
      set({ isLoading: false });
      return list;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  deleteList: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await invoke('delete_list', { id });
      await get().fetchLists();
      const { selectedListId } = get();
      if (selectedListId === id) {
        set({ selectedListId: null });
        await get().fetchTasks();
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  createTask: async (input: CreateTaskInput) => {
    try {
      set({ isLoading: true, error: null });
      const task = await invoke<Task>('create_task', { input });
      const { filter } = get();
      if (filter === 'all') {
        await get().fetchTasks(get().selectedListId || undefined);
      } else {
        await get().fetchFilteredTasks(filter);
      }
      set({ isLoading: false });
      return task;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateTask: async (input: UpdateTaskInput) => {
    try {
      set({ isLoading: true, error: null });
      const task = await invoke<Task>('update_task', { input });
      const { filter } = get();
      if (filter === 'all') {
        await get().fetchTasks(get().selectedListId || undefined);
      } else {
        await get().fetchFilteredTasks(filter);
      }
      const { selectedTask } = get();
      if (selectedTask?.id === task.id) {
        set({ selectedTask: task });
      }
      set({ isLoading: false });
      return task;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await invoke('delete_task', { id });
      const { filter } = get();
      if (filter === 'all') {
        await get().fetchTasks(get().selectedListId || undefined);
      } else {
        await get().fetchFilteredTasks(filter);
      }
      const { selectedTask } = get();
      if (selectedTask?.id === id) {
        set({ selectedTask: null });
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  toggleTaskImportant: async (id: string) => {
    try {
      const task = await invoke<Task>('toggle_task_important', { id });
      const { tasks } = get();
      set({ tasks: tasks.map(t => t.id === id ? task : t) });
      const { selectedTask } = get();
      if (selectedTask?.id === id) {
        set({ selectedTask: task });
      }
      return task;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  toggleTaskCompleted: async (id: string) => {
    try {
      const task = await invoke<Task>('toggle_task_completed', { id });
      const { tasks } = get();
      set({ tasks: tasks.map(t => t.id === id ? task : t) });
      const { selectedTask } = get();
      if (selectedTask?.id === id) {
        set({ selectedTask: task });
      }
      return task;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  setSelectedListId: (id: string | null) => {
    set({ selectedListId: id, filter: 'all', searchQuery: '' });
    get().fetchTasks(id || undefined);
  },

  setSelectedTask: (task: Task | null) => {
    set({ selectedTask: task });
  },

  setFilter: (filter: FilterType) => {
    set({ selectedListId: null, searchQuery: '' });
    get().fetchFilteredTasks(filter);
  },

  setSearchQuery: (query: string) => {
    get().searchTasks(query);
  },

  clearError: () => {
    set({ error: null });
  },
}));
