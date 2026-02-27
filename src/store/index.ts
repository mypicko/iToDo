import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Task, List, Subtask, CreateTaskInput, UpdateTaskInput, CreateListInput, UpdateListInput, CreateSubtaskInput, UpdateSubtaskInput, FilterType, Language } from '../types';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  lists: List[];
  tasks: Task[];
  subtasks: Record<string, Subtask[]>;
  selectedListId: string | null;
  selectedTask: Task | null;
  filter: FilterType;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  language: Language;
  theme: Theme;

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

  fetchSubtasks: (taskId: string) => Promise<void>;
  fetchAllSubtasks: () => Promise<void>;
  createSubtask: (input: CreateSubtaskInput) => Promise<Subtask>;
  updateSubtask: (input: UpdateSubtaskInput) => Promise<Subtask>;
  deleteSubtask: (id: string, taskId: string) => Promise<void>;
  toggleSubtaskCompleted: (id: string) => Promise<Subtask>;

  setSelectedListId: (id: string | null) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  clearError: () => void;

  // Import/Export
  exportTasks: (listId?: string) => Promise<void>;
  importTasks: () => Promise<Task[]>;
}

export const useAppStore = create<AppState>((set, get) => ({
  lists: [],
  tasks: [],
  subtasks: {},
  selectedListId: null,
  selectedTask: null,
  filter: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,
  language: 'zh-CN',
  theme: 'light',

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

  // Subtask actions
  fetchSubtasks: async (taskId: string) => {
    try {
      const subtasks = await invoke<Subtask[]>('get_subtasks', { taskId });
      const { subtasks: currentSubtasks } = get();
      set({ subtasks: { ...currentSubtasks, [taskId]: subtasks } });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  fetchAllSubtasks: async () => {
    try {
      const allSubtasks = await invoke<Subtask[]>('get_all_subtasks');
      const { subtasks: currentSubtasks } = get();
      // Group subtasks by task_id
      const newSubtasks: Record<string, Subtask[]> = {};
      for (const subtask of allSubtasks) {
        if (!newSubtasks[subtask.task_id]) {
          newSubtasks[subtask.task_id] = [];
        }
        newSubtasks[subtask.task_id].push(subtask);
      }
      set({ subtasks: { ...currentSubtasks, ...newSubtasks } });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  createSubtask: async (input: CreateSubtaskInput) => {
    try {
      const subtask = await invoke<Subtask>('create_subtask', { input });
      const { subtasks } = get();
      const taskSubtasks = subtasks[input.task_id] || [];
      set({ subtasks: { ...subtasks, [input.task_id]: [...taskSubtasks, subtask] } });
      return subtask;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateSubtask: async (input: UpdateSubtaskInput) => {
    try {
      const subtask = await invoke<Subtask>('update_subtask', { input });
      const { subtasks } = get();
      const taskId = Object.keys(subtasks).find(key =>
        subtasks[key].some(s => s.id === input.id)
      );
      if (taskId) {
        set({
          subtasks: {
            ...subtasks,
            [taskId]: subtasks[taskId].map(s => s.id === input.id ? subtask : s)
          }
        });
      }
      return subtask;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteSubtask: async (id: string, taskId: string) => {
    try {
      await invoke('delete_subtask', { id });
      const { subtasks } = get();
      set({
        subtasks: {
          ...subtasks,
          [taskId]: subtasks[taskId].filter(s => s.id !== id)
        }
      });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  toggleSubtaskCompleted: async (id: string) => {
    try {
      const subtask = await invoke<Subtask>('toggle_subtask_completed', { id });
      const { subtasks } = get();
      const taskId = Object.keys(subtasks).find(key =>
        subtasks[key].some(s => s.id === id)
      );
      if (taskId) {
        set({
          subtasks: {
            ...subtasks,
            [taskId]: subtasks[taskId].map(s => s.id === id ? subtask : s)
          }
        });
      }
      return subtask;
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
    if (task) {
      get().fetchSubtasks(task.id);
    }
  },

  setFilter: (filter: FilterType) => {
    set({ selectedListId: null, searchQuery: '' });
    get().fetchFilteredTasks(filter);
  },

  setSearchQuery: (query: string) => {
    get().searchTasks(query);
  },

  setLanguage: (language: Language) => {
    set({ language });
  },

  setTheme: (theme: Theme) => {
    set({ theme });
  },

  clearError: () => {
    set({ error: null });
  },

  // Import/Export
  exportTasks: async (listId?: string) => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const filePath = await save({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: `itodo-export-${new Date().toISOString().slice(0, 10)}.json`
      });
      if (filePath) {
        await invoke('export_tasks_to_path', { filePath, listId: listId || null });
      }
    } catch (error) {
      console.error('Export error:', error);
      set({ error: String(error) });
      throw error;
    }
  },

  importTasks: async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      });
      if (filePath && typeof filePath === 'string') {
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const jsonData = await readTextFile(filePath);
        const importedTasks = await invoke<Task[]>('import_tasks', { jsonData });
        // Refresh tasks after import
        await get().fetchTasks();
        return importedTasks;
      }
      return [];
    } catch (error) {
      console.error('Import error:', error);
      set({ error: String(error) });
      return [];
    }
  },
}));
