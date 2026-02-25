import { useState, useEffect } from 'react';
import { useAppStore } from '../store';

export default function TaskDetail() {
  const { selectedTask, setSelectedTask, updateTask, toggleTaskCompleted, toggleTaskImportant, lists } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [remindTime, setRemindTime] = useState('');
  const [repeatRule, setRepeatRule] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setContent(selectedTask.content || '');
      setDueDate(selectedTask.due_date ? selectedTask.due_date.split('T')[0] : '');
      setStartDate(selectedTask.start_date ? selectedTask.start_date.split('T')[0] : '');
      setRemindTime(selectedTask.remind_time ? selectedTask.remind_time.split('T')[0] : '');
      setRepeatRule(selectedTask.repeat_rule || '');
    }
  }, [selectedTask]);

  const handleSave = async () => {
    if (!selectedTask) return;

    await updateTask({
      id: selectedTask.id,
      title,
      content: content || undefined,
      due_date: dueDate ? `${dueDate}T00:00:00Z` : undefined,
      start_date: startDate ? `${startDate}T00:00:00Z` : undefined,
      remind_time: remindTime ? `${remindTime}T00:00:00Z` : undefined,
      repeat_rule: repeatRule || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setContent(selectedTask.content || '');
      setDueDate(selectedTask.due_date ? selectedTask.due_date.split('T')[0] : '');
      setStartDate(selectedTask.start_date ? selectedTask.start_date.split('T')[0] : '');
      setRemindTime(selectedTask.remind_time ? selectedTask.remind_time.split('T')[0] : '');
      setRepeatRule(selectedTask.repeat_rule || '');
    }
    setIsEditing(false);
  };

  const getListName = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    return list?.name || '未知清单';
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const repeatLabels: Record<string, string> = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年',
  };

  if (!selectedTask) {
    return (
      <div className="flex-1 h-full bg-white flex items-center justify-center text-[#605E5C]">
        <div className="text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-[#E1DFDD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>选择一个任务查看详情</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E1DFDD]">
        <button
          onClick={() => setSelectedTask(null)}
          className="p-2 hover:bg-[#F3F2F1] rounded-md transition-colors"
        >
          <svg className="w-5 h-5 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                保存
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-[#323130] hover:bg-[#F3F2F1] rounded-md text-sm"
              >
                取消
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-[#0078D4] hover:bg-[#F3F2F1] rounded-md text-sm"
            >
              编辑
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
              className="w-full text-2xl font-semibold border-b border-[#E1DFDD] focus:border-[#0078D4] focus:outline-none pb-2"
            />
          ) : (
            <h2 className={`text-2xl font-semibold ${selectedTask.is_completed ? 'line-through text-[#605E5C]' : 'text-[#323130]'}`}>
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
                : 'bg-[#F3F2F1] text-[#323130] hover:bg-[#E1DFDD]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {selectedTask.is_completed ? '已完成' : '标记为完成'}
          </button>

          <button
            onClick={() => toggleTaskImportant(selectedTask.id)}
            className={`p-2 rounded-md transition-colors ${
              selectedTask.is_important
                ? 'text-[#F7B500] bg-[#FFF4CE]'
                : 'text-[#605E5C] hover:bg-[#F3F2F1]'
            }`}
          >
            <svg className="w-5 h-5" fill={selectedTask.is_important ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* List */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm text-[#323130]">{getListName(selectedTask.list_id)}</span>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isEditing ? (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border border-[#E1DFDD] rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none"
              />
            ) : selectedTask.due_date ? (
              <span className="text-sm text-[#323130]">截止日期: {formatDateTime(selectedTask.due_date)}</span>
            ) : (
              <span className="text-sm text-[#605E5C]">无截止日期</span>
            )}
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isEditing ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-[#E1DFDD] rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none"
              />
            ) : selectedTask.start_date ? (
              <span className="text-sm text-[#323130]">开始日期: {formatDateTime(selectedTask.start_date)}</span>
            ) : (
              <span className="text-sm text-[#605E5C]">无开始日期</span>
            )}
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {isEditing ? (
              <input
                type="date"
                value={remindTime}
                onChange={(e) => setRemindTime(e.target.value)}
                className="border border-[#E1DFDD] rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none"
              />
            ) : selectedTask.remind_time ? (
              <span className="text-sm text-[#323130]">提醒: {formatDateTime(selectedTask.remind_time)}</span>
            ) : (
              <span className="text-sm text-[#605E5C]">无提醒</span>
            )}
          </div>

          {/* Repeat */}
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isEditing ? (
              <select
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value)}
                className="border border-[#E1DFDD] rounded px-2 py-1 text-sm focus:border-[#0078D4] focus:outline-none"
              >
                <option value="">不重复</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            ) : selectedTask.repeat_rule ? (
              <span className="text-sm text-[#323130]">重复: {repeatLabels[selectedTask.repeat_rule] || selectedTask.repeat_rule}</span>
            ) : (
              <span className="text-sm text-[#605E5C]">不重复</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[#323130] mb-2">备注</h3>
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="添加备注..."
              className="w-full h-40 p-3 border border-[#E1DFDD] rounded-md focus:border-[#0078D4] focus:outline-none resize-none"
            />
          ) : (
            <p className="text-sm text-[#605E5C] whitespace-pre-wrap">
              {selectedTask.content || '无备注'}
            </p>
          )}
        </div>

        {/* Created/Updated */}
        <div className="mt-8 pt-4 border-t border-[#E1DFDD]">
          <p className="text-xs text-[#605E5C]">
            创建于: {formatDateTime(selectedTask.created_at)}
          </p>
          <p className="text-xs text-[#605E5C]">
            更新于: {formatDateTime(selectedTask.updated_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
