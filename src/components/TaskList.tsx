import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import type { FilterType } from '../types';

const filterTitles: Record<FilterType, string> = {
  all: '任务',
  today: '我的一天',
  planned: '已计划',
  important: '重要',
  completed: '已完成',
};

const filterTitlesEn: Record<FilterType, string> = {
  all: 'Tasks',
  today: 'My Day',
  planned: 'Planned',
  important: 'Important',
  completed: 'Completed',
};

export default function TaskList() {
  const {
    tasks,
    lists,
    subtasks,
    selectedListId,
    filter,
    selectedTask,
    setSelectedTask,
    createTask,
    toggleTaskCompleted,
    toggleTaskImportant,
    deleteTask,
    language,
    theme
  } = useAppStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewTaskInput, setShowNewTaskInput] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

  const isZh = language === 'zh-CN';
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  const currentList = selectedListId ? lists.find(l => l.id === selectedListId) : null;
  const title = currentList ? currentList.name : (isZh ? filterTitles[filter] : filterTitlesEn[filter]);

  const handleCreateTask = async () => {
    if (newTaskTitle.trim()) {
      // If a list is selected, use it; otherwise use the first list
      const targetListId = selectedListId || (lists.length > 0 ? lists[0].id : null);
      if (targetListId) {
        await createTask({
          title: newTaskTitle.trim(),
          list_id: targetListId,
        });
        setNewTaskTitle('');
        setShowNewTaskInput(false);
      }
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
    setContextMenu(null);
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Delete task error:', error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return isZh ? '今天' : 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return isZh ? '明天' : 'Tomorrow';
    } else {
      return date.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Calculate next occurrence for repeat tasks
  const getNextOccurrence = (repeatRule?: string): string | null => {
    if (!repeatRule) return null;

    try {
      const rule = JSON.parse(repeatRule);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (rule.type) {
        case 'daily':
          // Next occurrence is tomorrow if today is passed
          const nextDaily = new Date(today);
          nextDaily.setDate(nextDaily.getDate() + 1);
          return formatDate(nextDaily.toISOString());

        case 'weekly':
          if (rule.days && rule.days.length > 0) {
            const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const todayIdx = today.getDay();
            const sortedDays = [...rule.days].sort((a: string, b: string) =>
              weekDaysEn.indexOf(a) - weekDaysEn.indexOf(b)
            );

            for (const day of sortedDays) {
              const dayIdx = weekDaysEn.indexOf(day);
              if (dayIdx > todayIdx) {
                const nextWeekly = new Date(today);
                nextWeekly.setDate(nextWeekly.getDate() + (dayIdx - todayIdx));
                return formatDate(nextWeekly.toISOString());
              }
            }
            // If all days have passed this week, return first day next week
            const nextWeekIdx = weekDaysEn.indexOf(sortedDays[0]);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + (7 - todayIdx + nextWeekIdx));
            return formatDate(nextWeek.toISOString());
          }
          return null;

        case 'monthly':
          if (rule.daysOfMonth && rule.daysOfMonth.length > 0) {
            const todayDate = today.getDate();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            for (const dayOfMonth of rule.daysOfMonth.sort((a: number, b: number) => a - b)) {
              if (dayOfMonth > todayDate) {
                const nextMonthly = new Date(currentYear, currentMonth, dayOfMonth);
                return formatDate(nextMonthly.toISOString());
              }
            }
            // If all days have passed this month, return first day next month
            const nextMonth = new Date(currentYear, currentMonth + 1, rule.daysOfMonth[0]);
            return formatDate(nextMonth.toISOString());
          }
          return null;

        case 'yearly':
          const nextYearly = new Date(today);
          nextYearly.setFullYear(nextYearly.getFullYear() + 1);
          return formatDate(nextYearly.toISOString());

        default:
          return null;
      }
    } catch {
      return null;
    }
  };

  return (
    <div className={`w-96 h-full flex flex-col border-r ${isDark ? 'border-[#404040] bg-[#2d2d2d]' : 'border-[#E1DFDD] bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-[#404040]' : 'border-[#E1DFDD]'}`}>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#323130]'}`}>{title}</h2>
        <p className={`text-sm ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'} mt-1`}>
          {tasks.filter(t => !t.is_completed).length} {isZh ? '个未完成' : 'remaining'}
        </p>
      </div>

      {/* Add Task - show when a list is selected or when using 'all' filter with lists available */}
      {(selectedListId || (filter === 'all' && lists.length > 0)) && (
        <div className={`p-3 border-b ${isDark ? 'border-[#404040]' : 'border-[#E1DFDD]'}`}>
          {showNewTaskInput ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder={isZh ? '添加任务' : 'Add task'}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'border-[#404040] bg-[#3d3d3d] text-white focus:border-[#0078D4]'
                    : 'border-[#0078D4] bg-white text-[#323130] focus:ring-[#0078D4]'
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  className="px-3 py-1.5 bg-[#0078D4] text-white rounded-md text-sm hover:bg-[#106EBE]"
                >
                  {isZh ? '添加' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowNewTaskInput(false);
                    setNewTaskTitle('');
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    isDark ? 'text-white hover:bg-[#404040]' : 'text-[#323130] hover:bg-[#F3F2F1]'
                  }`}
                >
                  {isZh ? '取消' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewTaskInput(true)}
              data-add-task-button
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isDark ? 'text-[#a0a0a0] hover:bg-[#404040]' : 'text-[#605E5C] hover:bg-[#F3F2F1]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isZh ? '添加任务' : 'Add task'}
            </button>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>{isZh ? '暂无任务' : 'No tasks yet'}</p>
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-[#404040]' : 'divide-[#F3F2F1]'}`}>
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                onContextMenu={(e) => handleContextMenu(e, task.id)}
                className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                  isDark
                    ? `hover:bg-[#3d3d3d] ${selectedTask?.id === task.id ? 'bg-[#3d3d3d]' : ''}`
                    : `hover:bg-[#F3F2F1] ${selectedTask?.id === task.id ? 'bg-[#F3F2F1]' : ''}`
                } ${task.is_completed ? 'opacity-60' : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => handleToggleComplete(e, task.id)}
                  className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.is_completed
                      ? 'bg-[#0078D4] border-[#0078D4]'
                      : isDark
                        ? 'border-[#a0a0a0] hover:border-[#0078D4]'
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
                  <p className={`text-sm ${task.is_completed ? (isDark ? 'line-through text-[#a0a0a0]' : 'line-through text-[#605E5C]') : (isDark ? 'text-white' : 'text-[#323130]')}`}>
                    {task.title}
                  </p>
                  {(task.due_date || task.remind_time || task.repeat_rule || (subtasks[task.id] && subtasks[task.id].length > 0)) && (
                    <div className="flex items-center gap-2 mt-1">
                      {/* Subtask progress */}
                      {subtasks[task.id] && subtasks[task.id].length > 0 && (
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {subtasks[task.id].filter(s => s.is_completed).length}/{subtasks[task.id].length}
                        </span>
                      )}
                      {/* Repeat - Next occurrence */}
                      {task.repeat_rule && (
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {getNextOccurrence(task.repeat_rule) || (isZh ? '重复' : 'Repeats')}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.remind_time && (
                        <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
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
                    task.is_important ? 'text-[#F7B500]' : (isDark ? 'text-[#a0a0a0] hover:text-[#F7B500]' : 'text-[#605E5C] hover:text-[#F7B500]')
                  }`}
                >
                  <svg className="w-5 h-5" fill={task.is_important ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-md shadow-lg border border-[#E1DFDD] z-30 py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDeleteTask({ stopPropagation: () => {} } as React.MouseEvent, contextMenu.taskId)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#F3F2F1] ${
              isDark ? 'text-red-400' : 'text-[#D13438]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isZh ? '删除' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
