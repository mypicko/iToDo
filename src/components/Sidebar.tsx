import { useState } from 'react';
import { useAppStore } from '../store';
import type { FilterType, List as ListType } from '../types';

const filterItems: { id: FilterType; name: string; icon: string }[] = [
  { id: 'today', name: '今日待办', icon: 'sun' },
  { id: 'planned', name: '已计划', icon: 'calendar' },
  { id: 'important', name: '重要', icon: 'star' },
  { id: 'completed', name: '已完成', icon: 'check-circle' },
];

const icons: Record<string, JSX.Element> = {
  sun: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  'check-circle': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  list: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
};

export default function Sidebar() {
  const { lists, filter, selectedListId, setFilter, setSelectedListId, createList, deleteList, searchQuery, setSearchQuery } = useAppStore();
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleCreateList = async () => {
    if (newListName.trim()) {
      await createList({ name: newListName.trim() });
      setNewListName('');
      setShowNewListInput(false);
    }
  };

  const handleDeleteList = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个清单吗？')) {
      await deleteList(id);
    }
  };

  const getListIcon = (list: ListType) => {
    if (list.is_default) {
      return icons['sun'];
    }
    return icons['list'];
  };

  return (
    <div className="w-64 h-full bg-[#F3F2F1] flex flex-col border-r border-[#E1DFDD]">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-white border border-[#E1DFDD] rounded-md text-sm focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filter Items */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-0.5">
          {filterItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                filter === item.id && !selectedListId
                  ? 'bg-[#0078D4] text-white'
                  : 'text-[#323130] hover:bg-[#E1DFDD]'
              }`}
            >
              <span className={filter === item.id && !selectedListId ? 'text-white' : 'text-[#605E5C]'}>
                {icons[item.icon]}
              </span>
              {item.name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="my-3 mx-3 border-t border-[#E1DFDD]" />

        {/* Lists */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold text-[#605E5C] uppercase">清单</span>
            <button
              onClick={() => setShowNewListInput(true)}
              className="p-1 text-[#605E5C] hover:bg-[#E1DFDD] rounded"
              title="新建清单"
            >
              {icons['plus']}
            </button>
          </div>

          {showNewListInput && (
            <div className="px-2 py-1">
              <input
                type="text"
                placeholder="清单名称"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateList();
                  if (e.key === 'Escape') {
                    setShowNewListInput(false);
                    setNewListName('');
                  }
                }}
                onBlur={() => {
                  if (!newListName.trim()) {
                    setShowNewListInput(false);
                  }
                }}
                autoFocus
                className="w-full px-2 py-1 text-sm border border-[#0078D4] rounded focus:outline-none"
              />
            </div>
          )}

          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                selectedListId === list.id
                  ? 'bg-[#0078D4] text-white'
                  : 'text-[#323130] hover:bg-[#E1DFDD]'
              }`}
            >
              <span className={selectedListId === list.id ? 'text-white' : ''} style={{ color: list.color || '#605E5C' }}>
                {getListIcon(list)}
              </span>
              <span className="flex-1 text-left truncate">{list.name}</span>
              {!list.is_default && (
                <button
                  onClick={(e) => handleDeleteList(e, list.id)}
                  className={`p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#F3F2F1] ${
                    selectedListId === list.id ? 'text-white hover:bg-[#106EBE]' : 'text-[#605E5C]'
                  }`}
                  title="删除清单"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
