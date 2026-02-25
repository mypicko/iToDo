import { useEffect } from 'react';
import { useAppStore } from './store';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';

function App() {
  const { fetchLists, fetchTasks } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await fetchLists();
      await fetchTasks();
    };
    init();
  }, []);

  return (
    <div className="flex h-screen bg-[#F3F2F1]">
      <Sidebar />
      <TaskList />
      <TaskDetail />
    </div>
  );
}

export default App;
