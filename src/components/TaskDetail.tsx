import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import type { RepeatRule } from '../types';

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

export default function TaskDetail() {
  const {
    selectedTask,
    setSelectedTask,
    updateTask,
    toggleTaskCompleted,
    toggleTaskImportant,
    lists,
    language,
    theme,
    subtasks,
    createSubtask,
    deleteSubtask,
    toggleSubtaskCompleted
  } = useAppStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [remindDate, setRemindDate] = useState('');
  const [remindTime, setRemindTime] = useState('');
  const [repeatType, setRepeatType] = useState<RepeatRule['type'] | ''>('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  const isZh = language === 'zh-CN';
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const days = isZh ? weekDays : weekDaysEn;
  const currentSubtasks = selectedTask ? subtasks[selectedTask.id] || [] : [];

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setContent(selectedTask.content || '');
      setDueDate(selectedTask.due_date ? selectedTask.due_date.split('T')[0] : '');
      setStartDate(selectedTask.start_date ? selectedTask.start_date.split('T')[0] : '');

      // Parse remind_time with both date and time
      if (selectedTask.remind_time) {
        const remindDateTime = new Date(selectedTask.remind_time);
        setRemindDate(remindDateTime.toISOString().split('T')[0]);
        setRemindTime(remindDateTime.toTimeString().slice(0, 5));
      } else {
        setRemindDate('');
        setRemindTime('');
      }

      if (selectedTask.repeat_rule) {
        try {
          const rule = JSON.parse(selectedTask.repeat_rule);
          setRepeatType(rule.type || '');
          setSelectedWeekDays(rule.days || []);
          setSelectedMonthDays(rule.daysOfMonth || []);
        } catch {
          setRepeatType(selectedTask.repeat_rule as RepeatRule['type']);
          setSelectedWeekDays([]);
          setSelectedMonthDays([]);
        }
      } else {
        setRepeatType('');
        setSelectedWeekDays([]);
        setSelectedMonthDays([]);
      }
    }
  }, [selectedTask]);

  const handleSave = async () => {
    if (!selectedTask) return;

    let repeatRule: string | undefined;
    if (repeatType) {
      const rule: RepeatRule = { type: repeatType as RepeatRule['type'] };
      if (repeatType === 'weekly' && selectedWeekDays.length > 0) {
        rule.days = selectedWeekDays;
      }
      if (repeatType === 'monthly' && selectedMonthDays.length > 0) {
        rule.daysOfMonth = selectedMonthDays;
      }
      repeatRule = JSON.stringify(rule);
    }

    // Combine remind date and time
    let remindDateTime: string | undefined;
    if (remindDate && remindTime) {
      remindDateTime = `${remindDate}T${remindTime}:00Z`;
    } else if (remindDate) {
      remindDateTime = `${remindDate}T00:00:00Z`;
    }

    await updateTask({
      id: selectedTask.id,
      title,
      content: content || undefined,
      due_date: dueDate ? `${dueDate}T00:00:00Z` : undefined,
      start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
      remind_time: remindDateTime,
      repeat_rule: repeatRule,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setContent(selectedTask.content || '');
      setDueDate(selectedTask.due_date ? selectedTask.due_date.split('T')[0] : '');
      setStartDate(selectedTask.start_date ? selectedTask.start_date.split('T')[0] : '');

      if (selectedTask.remind_time) {
        const remindDateTime = new Date(selectedTask.remind_time);
        setRemindDate(remindDateTime.toISOString().split('T')[0]);
        setRemindTime(remindDateTime.toTimeString().slice(0, 5));
      } else {
        setRemindDate('');
        setRemindTime('');
      }

      if (selectedTask.repeat_rule) {
        try {
          const rule = JSON.parse(selectedTask.repeat_rule);
          setRepeatType(rule.type || '');
          setSelectedWeekDays(rule.days || []);
          setSelectedMonthDays(rule.daysOfMonth || []);
        } catch {
          setRepeatType(selectedTask.repeat_rule as RepeatRule['type']);
          setSelectedWeekDays([]);
          setSelectedMonthDays([]);
        }
      } else {
        setRepeatType('');
        setSelectedWeekDays([]);
        setSelectedMonthDays([]);
      }
    }
    setIsEditing(false);
    setShowRepeatOptions(false);
  };

  const handleAddSubtask = async () => {
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    await createSubtask({
      task_id: selectedTask.id,
      title: newSubtaskTitle.trim()
    });
    setNewSubtaskTitle('');
    setShowSubtaskInput(false);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!selectedTask) return;
    await deleteSubtask(subtaskId, selectedTask.id);
  };

  const getListName = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    return list?.name || (isZh ? '未知清单' : 'Unknown List');
  };

  const handleChangeList = async (newListId: string) => {
    if (!selectedTask || newListId === selectedTask.list_id) return;
    await updateTask({
      id: selectedTask.id,
      list_id: newListId,
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(isZh ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRepeatLabel = (ruleStr?: string) => {
    if (!ruleStr) return isZh ? '不重复' : 'Does not repeat';
    try {
      const rule = JSON.parse(ruleStr) as RepeatRule;
      const typeLabels: Record<string, string> = {
        daily: isZh ? '每天' : 'Daily',
        weekly: isZh ? '每周' : 'Weekly',
        monthly: isZh ? '每月' : 'Monthly',
        yearly: isZh ? '每年' : 'Yearly',
      };

      if (rule.type === 'weekly' && rule.days && rule.days.length > 0) {
        const dayLabels = rule.days.map(d => {
          const idx = weekDaysEn.indexOf(d);
          return idx >= 0 ? days[idx] : d;
        });
        return `${typeLabels[rule.type]} (${dayLabels.join(', ')})`;
      }

      if (rule.type === 'monthly' && rule.daysOfMonth && rule.daysOfMonth.length > 0) {
        return `${typeLabels[rule.type]} (${rule.daysOfMonth.join(', ')}${isZh ? '日' : ''})`;
      }

      return typeLabels[rule.type] || ruleStr;
    } catch {
      return ruleStr;
    }
  };

  const toggleWeekDay = (day: string) => {
    setSelectedWeekDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleMonthDay = (day: number) => {
    setSelectedMonthDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const completedSubtasks = currentSubtasks.filter(s => s.is_completed).length;

  if (!selectedTask) {
    return (
      <div className={`flex-1 h-full flex items-center justify-center ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-[#E1DFDD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>{isZh ? '选择一个任务查看详情' : 'Select a task to view details'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 h-full flex flex-col ${isDark ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-[#404040]' : 'border-[#E1DFDD]'}`}>
        <button
          onClick={() => setSelectedTask(null)}
          className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-[#404040]' : 'hover:bg-[#F3F2F1]'}`}
        >
          <svg className={`w-5 h-5 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-[#0078D4] text-white rounded-md text-sm hover:bg-[#106EBE]"
              >
                {isZh ? '保存' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className={`px-3 py-1.5 rounded-md text-sm ${isDark ? 'text-white hover:bg-[#404040]' : 'text-[#323130] hover:bg-[#F3F2F1]'}`}
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`px-3 py-1.5 rounded-md text-sm ${isDark ? 'text-[#0078D4] hover:bg-[#404040]' : 'text-[#0078D4] hover:bg-[#F3F2F1]'}`}
            >
              {isZh ? '编辑' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Title */}
        <div className="mb-6">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full text-2xl font-semibold border-b focus:border-[#0078D4] focus:outline-none pb-2 ${
                isDark ? 'border-[#404040] bg-transparent text-white' : 'border-[#E1DFDD] text-[#323130]'
              }`}
            />
          ) : (
            <h2 className={`text-2xl font-semibold ${
              selectedTask.is_completed
                ? isDark ? 'line-through text-[#a0a0a0]' : 'line-through text-[#605E5C]'
                : isDark ? 'text-white' : 'text-[#323130]'
            }`}>
              {selectedTask.title}
            </h2>
          )}
        </div>

        {/* Status Row */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => toggleTaskCompleted(selectedTask.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              selectedTask.is_completed
                ? 'bg-[#0078D4] text-white'
                : isDark
                  ? 'bg-[#404040] text-white hover:bg-[#505050]'
                  : 'bg-[#F3F2F1] text-[#323130] hover:bg-[#E1DFDD]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {selectedTask.is_completed ? (isZh ? '已完成' : 'Completed') : (isZh ? '标记为完成' : 'Mark as complete')}
          </button>

          <button
            onClick={() => toggleTaskImportant(selectedTask.id)}
            className={`p-2 rounded-md transition-colors ${
              selectedTask.is_important
                ? 'text-[#F7B500] bg-[#FFF4CE]'
                : isDark
                  ? 'text-[#a0a0a0] hover:bg-[#404040]'
                  : 'text-[#605E5C] hover:bg-[#F3F2F1]'
            }`}
          >
            <svg className="w-5 h-5" fill={selectedTask.is_important ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>

        {/* Subtasks Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#323130]'}`}>
              {isZh ? '子任务' : 'Subtasks'}
              {currentSubtasks.length > 0 && (
                <span className={`ml-2 font-normal ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
                  ({completedSubtasks}/{currentSubtasks.length})
                </span>
              )}
            </h3>
            <button
              onClick={() => setShowSubtaskInput(true)}
              className="text-[#0078D4] text-sm hover:underline"
            >
              {isZh ? '+ 添加子任务' : '+ Add subtask'}
            </button>
          </div>

          {showSubtaskInput && (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask();
                  if (e.key === 'Escape') {
                    setShowSubtaskInput(false);
                    setNewSubtaskTitle('');
                  }
                }}
                placeholder={isZh ? '子任务标题' : 'Subtask title'}
                autoFocus
                className={`flex-1 px-3 py-2 border rounded-md text-sm focus:border-[#0078D4] focus:outline-none ${
                  isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
                }`}
              />
              <button
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-[#0078D4] text-white rounded-md text-sm hover:bg-[#106EBE]"
              >
                {isZh ? '添加' : 'Add'}
              </button>
            </div>
          )}

          {currentSubtasks.length > 0 && (
            <div className="space-y-2">
              {currentSubtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleSubtaskCompleted(subtask.id)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      subtask.is_completed
                        ? 'bg-[#0078D4] border-[#0078D4]'
                        : isDark
                          ? 'border-[#a0a0a0] hover:border-[#0078D4]'
                          : 'border-[#605E5C] hover:border-[#0078D4]'
                    }`}
                  >
                    {subtask.is_completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${
                    subtask.is_completed
                      ? isDark ? 'line-through text-[#a0a0a0]' : 'line-through text-[#605E5C]'
                      : isDark ? 'text-white' : 'text-[#323130]'
                  }`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity ${
                      isDark ? 'text-[#a0a0a0] hover:text-[#D13438]' : 'text-[#605E5C] hover:text-[#D13438]'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* List */}
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {isEditing ? (
              <select
                value={selectedTask.list_id}
                onChange={(e) => handleChangeList(e.target.value)}
                className={`border rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none ${
                  isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
                }`}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-sm ${isDark ? 'text-white' : 'text-[#323130]'}`}>{getListName(selectedTask.list_id)}</span>
            )}
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isEditing ? (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`border rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none ${
                  isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
                }`}
              />
            ) : selectedTask.due_date ? (
              <span className={`text-sm ${isDark ? 'text-white' : 'text-[#323130]'}`}>{isZh ? '截止日期' : 'Due date'}: {formatDateTime(selectedTask.due_date)}</span>
            ) : (
              <span className={`text-sm ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>{isZh ? '无截止日期' : 'No due date'}</span>
            )}
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isEditing ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`border rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none ${
                  isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
                }`}
              />
            ) : selectedTask.start_date ? (
              <span className={`text-sm ${isDark ? 'text-white' : 'text-[#323130]'}`}>{isZh ? '开始日期' : 'Start date'}: {formatDateTime(selectedTask.start_date)}</span>
            ) : (
              <span className={`text-sm ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>{isZh ? '无开始日期' : 'No start date'}</span>
            )}
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {isEditing ? (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={remindDate}
                  onChange={(e) => setRemindDate(e.target.value)}
                  className={`border rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none ${
                    isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
                  }`}
                />
                <input
                  type="time"
                  value={remindTime}
                  onChange={(e) => setRemindTime(e.target.value)}
                  className={`border rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none ${
                    isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
                  }`}
                />
              </div>
            ) : selectedTask.remind_time ? (
              <span className={`text-sm ${isDark ? 'text-white' : 'text-[#323130]'}`}>{isZh ? '提醒' : 'Reminder'}: {formatDateTime(selectedTask.remind_time)}</span>
            ) : (
              <span className={`text-sm ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>{isZh ? '无提醒' : 'No reminder'}</span>
            )}
          </div>

          {/* Repeat */}
          <div className="flex items-start gap-3">
            <svg className={`w-5 h-5 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'} mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <select
                    value={repeatType}
                    onChange={(e) => {
                      setRepeatType(e.target.value as RepeatRule['type']);
                      setShowRepeatOptions(e.target.value === 'weekly' || e.target.value === 'monthly');
                    }}
                    className={`border rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none ${
                      isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
                    }`}
                  >
                    <option value="">{isZh ? '不重复' : 'Does not repeat'}</option>
                    <option value="daily">{isZh ? '每天' : 'Daily'}</option>
                    <option value="weekly">{isZh ? '每周' : 'Weekly'}</option>
                    <option value="monthly">{isZh ? '每月' : 'Monthly'}</option>
                    <option value="yearly">{isZh ? '每年' : 'Yearly'}</option>
                  </select>

                  {/* Weekly: Select days */}
                  {showRepeatOptions && repeatType === 'weekly' && (
                    <div className="mt-2">
                      <p className={`text-xs mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>{isZh ? '选择星期几（可多选）' : 'Select days of week (multi-select)'}</p>
                      <div className="flex flex-wrap gap-1">
                        {days.map((day, idx) => (
                          <button
                            key={day}
                            onClick={() => toggleWeekDay(weekDaysEn[idx])}
                            className={`px-2 py-1 text-xs rounded border ${
                              selectedWeekDays.includes(weekDaysEn[idx])
                                ? 'bg-[#0078D4] text-white border-[#0078D4]'
                                : isDark
                                  ? 'border-[#404040] text-white hover:bg-[#404040]'
                                  : 'border-[#E1DFDD] text-[#323130] hover:bg-[#F3F2F1]'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly: Select days of month */}
                  {showRepeatOptions && repeatType === 'monthly' && (
                    <div className="mt-2">
                      <p className={`text-xs mb-1 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>{isZh ? '选择每月几号（可多选）' : 'Select days of month (multi-select)'}</p>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {monthDays.map(day => (
                          <button
                            key={day}
                            onClick={() => toggleMonthDay(day)}
                            className={`w-7 h-7 text-xs rounded border ${
                              selectedMonthDays.includes(day)
                                ? 'bg-[#0078D4] text-white border-[#0078D4]'
                                : isDark
                                  ? 'border-[#404040] text-white hover:bg-[#404040]'
                                  : 'border-[#E1DFDD] text-[#323130] hover:bg-[#F3F2F1]'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedTask.repeat_rule ? (
                <span className={`text-sm ${isDark ? 'text-white' : 'text-[#323130]'}`}>{isZh ? '重复' : ' Repeat'}: {getRepeatLabel(selectedTask.repeat_rule)}</span>
              ) : (
                <span className={`text-sm ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>{isZh ? '不重复' : 'Does not repeat'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8">
          <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#323130]'}`}>{isZh ? '备注' : 'Notes'}</h3>
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isZh ? '添加备注...' : 'Add notes...'}
              className={`w-full h-40 p-3 border rounded-md focus:border-[#0078D4] focus:outline-none resize-none ${
                isDark ? 'border-[#404040] bg-[#3d3d3d] text-white' : 'border-[#E1DFDD] text-[#323130]'
              }`}
            />
          ) : (
            <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
              {selectedTask.content || (isZh ? '无备注' : 'No notes')}
            </p>
          )}
        </div>

        {/* Created/Updated */}
        <div className={`mt-8 pt-4 border-t ${isDark ? 'border-[#404040]' : 'border-[#E1DFDD]'}`}>
          <p className={`text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
            {isZh ? '创建于' : 'Created'}: {formatDateTime(selectedTask.created_at)}
          </p>
          <p className={`text-xs ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>
            {isZh ? '更新于' : 'Updated'}: {formatDateTime(selectedTask.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
