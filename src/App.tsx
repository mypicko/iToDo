import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';

function App() {
  const { fetchLists, fetchTasks, fetchAllSubtasks, theme, selectedTask, toggleTaskCompleted, toggleTaskImportant, setSelectedTask } = useAppStore();
  const [showMessage, setShowMessage] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchLists();
      await fetchTasks();
      await fetchAllSubtasks();
    };
    init();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New task (focus on add task input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const addButton = document.querySelector('[data-add-task-button]') as HTMLButtonElement;
        if (addButton) addButton.click();
      }

      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      // Escape: Close task detail
      if (e.key === 'Escape' && selectedTask) {
        setSelectedTask(null);
      }

      // Enter (when task is selected): Toggle complete
      if (e.key === 'Enter' && selectedTask) {
        // Don't toggle if user is typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        await toggleTaskCompleted(selectedTask.id);
      }

      // I key: Toggle important (when task is selected)
      if (e.key === 'i' && selectedTask && !((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA')) {
        e.preventDefault();
        await toggleTaskImportant(selectedTask.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask, setSelectedTask, toggleTaskCompleted, toggleTaskImportant]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#1f1f1f');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#a0a0a0');
      root.style.setProperty('--border-color', '#404040');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f3f2f1');
      root.style.setProperty('--text-primary', '#323130');
      root.style.setProperty('--text-secondary', '#605E5C');
      root.style.setProperty('--border-color', '#E1DFDD');
    } else {
      // System theme
      root.classList.remove('dark');
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
        root.style.setProperty('--bg-primary', '#1f1f1f');
        root.style.setProperty('--bg-secondary', '#2d2d2d');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#a0a0a0');
        root.style.setProperty('--border-color', '#404040');
      } else {
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f3f2f1');
        root.style.setProperty('--text-primary', '#323130');
        root.style.setProperty('--text-secondary', '#605E5C');
        root.style.setProperty('--border-color', '#E1DFDD');
      }
    }
  }, [theme]);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Message dialog modal
  const MessageDialog = () => {
    if (!showMessage) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-3 text-[#323130]">{showMessage.title}</h3>
          <pre className="text-sm bg-[#F3F2F1] p-3 rounded whitespace-pre-wrap text-[#323130] max-h-64 overflow-y-auto mb-4">{showMessage.message}</pre>
          <div className="flex justify-end">
            <button
              onClick={() => setShowMessage(null)}
              className="px-4 py-2 bg-[#0078D4] text-white rounded hover:bg-[#106EBE]"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-screen ${isDark ? 'bg-[#1f1f1f]' : 'bg-[#F3F2F1]'}`}>
      <MessageDialog />
      <Sidebar onShowMessage={setShowMessage} />
      <div className={`flex-1 ${isDark ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
        <TaskList />
      </div>
      <div className={`flex-1 ${isDark ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
        <TaskDetail />
      </div>
    </div>
  );
}

export default App;
