import { useState } from 'react';
import { useAppStore } from '../store';
import type { FilterType } from '../types';

const filterTitles: Record<FilterType, string> = {
  all: '所有任务',
  today: '今日待办',
  planned: '已计划',
  important: '重要',
  completed: '已完成',
};

export default function TaskList() {
  const { tasks, lists, selectedListId, filter, selectedTask, setSelectedTask, createTask, toggleTaskCompleted, toggleTaskImportant, deleteTask } = useAppStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);

  const currentList = selectedListId ? lists.find(l => l.id === selectedListId) : null;
  const title = currentList ? currentList.name : filterTitles[filter];

  const handleCreateTask = async () => {
    if (newTaskTitle.trim() && selectedListId) {
      await createTask({
        title: newTaskTitle.trim(),
        list_id: selectedListId,
      });
      setNewTaskTitle('');
      setShowNewTaskInput(false);
    }
  };

  const handleToggleComplete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleTaskCompleted(id);
  };

  const handleToggleImportant = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleTaskImportant(id);
  };

  const handleDeleteTask = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个任务吗？')) {
      await deleteTask(id);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-96 h-full bg-white flex flex-col border-r border-[#E1DFDD]">
      {/* Header */}
      <div className="p-4 border-b border-[#E1DFDD]">
        <h2 className="text-xl font-semibold text-[#323130]">{title}</h2>
        <p className="text-sm text-[#605E5C] mt-1">
          {tasks.filter(t => !t.is_completed).length} 个未完成
        </p>
      </div>

      {/* Add Task */}
      {selectedListId && (
        <div className="p-3 border-b border-[#E1DFDD]">
          {showNewTaskInput ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="添加任务"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTask();
                  if (e.key === 'Escape') {
                    setShowNewTaskInput(false);
                    setNewTaskTitle('');
                  }
                }}
                autoFocus
                className="w-full px-3 py-2 border border-[#0078D4] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0078D4]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  className="px-3 py-1.5 bg-[#0078D4] text-white rounded-md text-sm hover:bg-[#106EBE]"
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowNewTaskInput(false);
                    setNewTaskTitle('');
                  }}
                  className="px-3 py-1.5 text-[#323130] hover:bg-[#F3F2F1] rounded-md text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewTaskInput(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[#605E5C] hover:bg-[#F3F2F1] rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加任务
            </button>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#605E5C]">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>暂无任务</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3F2F1]">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-[#F3F2F1] transition-colors ${
                  selectedTask?.id === task.id ? 'bg-[#F3F2F1]' : ''
                } ${task.is_completed ? 'opacity-60' : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => handleToggleComplete(e, task.id)}
                  className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.is_completed
                      ? 'bg-[#0078D4] border-[#0078D4]'
                      : 'border-[#605E5C] hover:border-[#0078D4]'
                  }`}
                >
                  {task.is_completed && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.is_completed ? 'line-through text-[#605E5C]' : 'text-[#323130]'}`}>
                    {task.title}
                  </p>
                  {(task.due_date || task.remind_time) && (
                    <div className="flex items-center gap-2 mt-1">
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-xs text-[#605E5C]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.remind_time && (
                        <span className="flex items-center gap-1 text-xs text-[#605E5C]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          {formatDate(task.remind_time)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Important Star */}
                <button
                  onClick={(e) => handleToggleImportant(e, task.id)}
                  className={`flex-shrink-0 p-1 rounded transition-colors ${
                    task.is_important ? 'text-[#F7B500]' : 'text-[#605E5C] hover:text-[#F7B500]'
                  }`}
                >
                  <svg className="w-5 h-5" fill={task.is_important ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => handleDeleteTask(e, task.id)}
                  className="flex-shrink-0 p-1 text-[#605E5C] hover:text-[#D13438] rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
