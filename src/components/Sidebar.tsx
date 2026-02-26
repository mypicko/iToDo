import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { invoke } from '@tauri-apps/api/core';
import type { FilterType, List as ListType, Theme } from '../types';

const filterItems: { id: FilterType; nameZh: string; nameEn: string; icon: string }[] = [
  { id: 'all', nameZh: '任务', nameEn: 'Tasks', icon: 'list' },
  { id: 'today', nameZh: '我的一天', nameEn: 'My Day', icon: 'sun' },
  { id: 'planned', nameZh: '已计划', nameEn: 'Planned', icon: 'calendar' },
  { id: 'important', nameZh: '重要', nameEn: 'Important', icon: 'star' },
  { id: 'completed', nameZh: '已完成', nameEn: 'Completed', icon: 'check-circle' },
];

const themes: { value: Theme; nameZh: string; nameEn: string }[] = [
  { value: 'light', nameZh: '浅色', nameEn: 'Light' },
  { value: 'dark', nameZh: '深色', nameEn: 'Dark' },
  { value: 'system', nameZh: '跟随系统', nameEn: 'System' },
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
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  log: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  palette: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
};

export default function Sidebar({ onShowMessage }: { onShowMessage?: (msg: {title: string, message: string} | null) => void }) {
  const {
    lists,
    tasks,
    filter,
    selectedListId,
    setFilter,
    setSelectedListId,
    createList,
    deleteList,
    searchQuery,
    setSearchQuery,
    language,
    setLanguage,
    theme,
    setTheme
  } = useAppStore();

  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; listId: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isZh = language === 'zh-CN';
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Get task count for each list
  const getListTaskCount = (listId: string) => {
    return tasks.filter(t => t.list_id === listId && !t.is_completed).length;
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Close settings when clicking elsewhere
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleCreateList = async () => {
    if (newListName.trim()) {
      await createList({ name: newListName.trim() });
      setNewListName('');
      setShowNewListInput(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList(id);
    } catch (error) {
      console.error('Delete list error:', error);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, listId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, listId });
  };

  const getListIcon = (list: ListType) => {
    if (list.is_default) {
      return icons['sun'];
    }
    return icons['list'];
  };

  const getItemName = (item: typeof filterItems[0]) => {
    return isZh ? item.nameZh : item.nameEn;
  };

  const openLogFile = async () => {
    try {
      const logPath = await invoke<string>('get_log_path');
      onShowMessage?.({ title: isZh ? '日志存放路径' : 'Log Path', message: logPath });
    } catch (error) {
      console.error('Failed to get log path:', error);
    }
  };

  const showAbout = async () => {
    try {
      const logPath = await invoke<string>('get_log_path');
      const info = await invoke<{ app_name: string; version: string; developer: string; developer_email?: string; changelog: string }>('get_about_info');
      const aboutPath = logPath.replace(/\/logs$/, '') + 'about.json';
      const aboutText = `${info.app_name} v${info.version}\n\n${isZh ? '开发者' : 'Developer'}: ${info.developer}${info.developer_email ? ` (${info.developer_email})` : ''}\n\n${isZh ? '更新日志' : 'Changelog'}:\n${info.changelog}\n\n${isZh ? '关于信息文件路径' : 'About file path'}:\n${aboutPath}`;
      onShowMessage?.({ title: isZh ? '关于' : 'About', message: aboutText });
    } catch (error) {
      console.error('Failed to get about info:', error);
    }
  };

  return (
    <div className={`w-64 h-full flex flex-col border-r ${isDark ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-[#F3F2F1] border-[#E1DFDD]'}`}>
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <input
            type="text"
            placeholder={isZh ? '搜索任务...' : 'Search tasks...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-search-input
            className={`w-full px-3 py-2 pl-9 border rounded-md text-sm focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] ${
              isDark ? 'bg-[#3d3d3d] border-[#404040] text-white' : 'bg-white border-[#E1DFDD] text-[#323130]'
            }`}
          />
          <svg className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  : isDark
                    ? 'text-white hover:bg-[#404040]'
                    : 'text-[#323130] hover:bg-[#E1DFDD]'
              }`}
            >
              <span className={filter === item.id && !selectedListId ? 'text-white' : (isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]')}>
                {icons[item.icon]}
              </span>
              {getItemName(item)}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className={`my-3 mx-3 border-t ${isDark ? 'border-[#404040]' : 'border-[#E1DFDD]'}`} />

        {/* Lists */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-3 py-1">
            <span className={`text-xs font-semibold uppercase ${isDark ? 'text-[#a0a0a0]' : 'text-[#605E5C]'}`}>{isZh ? '清单' : 'Lists'}</span>
            <button
              onClick={() => setShowNewListInput(true)}
              className={`p-1 rounded ${isDark ? 'text-[#a0a0a0] hover:bg-[#404040]' : 'text-[#605E5C] hover:bg-[#E1DFDD]'}`}
              title={isZh ? '新建清单' : 'New List'}
            >
              {icons['plus']}
            </button>
          </div>

          {showNewListInput && (
            <div className="px-2 py-1">
              <input
                type="text"
                placeholder={isZh ? '清单名称' : 'List name'}
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
            <div
              key={list.id}
              className="relative group flex items-center justify-between px-2 py-1 hover:bg-gray-100"
              onClick={() => setSelectedListId(list.id)}
              onContextMenu={(e) => handleContextMenu(e, list.id)}
            >
              <div
                className={`flex items-center gap-3 px-2 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                  selectedListId === list.id
                    ? 'bg-[#0078D4] text-white'
                    : (isDark ? 'text-white' : 'text-[#323130]')
                }`}
              >
                <span className={selectedListId === list.id ? 'text-white' : ''} style={{ color: list.color || '#605E5C' }}>
                  {getListIcon(list)}
                </span>
                <span className="text-left truncate flex-1">{list.name}</span>
                {getListTaskCount(list.id) > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedListId === list.id
                      ? (isDark ? 'bg-white/30' : 'bg-white/30')
                      : (isDark ? 'bg-[#404040] text-white' : 'bg-[#E1DFDD]')
                  }`}>
                    {getListTaskCount(list.id)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings at bottom left */}
      <div className={`p-2 border-t ${isDark ? 'border-[#404040]' : 'border-[#E1DFDD]'}`}>
        <div className="relative" ref={settingsRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              isDark ? 'text-white hover:bg-[#404040]' : 'text-[#605E5C] hover:bg-[#E1DFDD]'
            } ${showSettings ? 'bg-[#0078D4] text-white' : ''}`}
          >
            {icons['settings']}
            {isZh ? '设置' : 'Settings'}
          </button>

          {showSettings && (
            <div className="absolute bottom-full left-0 mb-1 w-48 rounded-md shadow-lg border z-50 bg-white border-[#E1DFDD] p-1">
              {/* Language - Submenu */}
              <div className="relative group/popa">
                <div className="flex items-center justify-between px-3 py-2 text-sm text-[#323130] hover:bg-[#F3F2F1] rounded cursor-pointer">
                  <span>{isZh ? '语言' : 'Language'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div className="hidden group-hover/popa:block absolute left-full top-0 ml-1 w-32 bg-white rounded-md shadow-lg border border-[#E1DFDD] p-1">
                  <button onClick={() => setLanguage('zh-CN')} className={`w-full text-left px-3 py-1.5 text-sm rounded ${language === 'zh-CN' ? 'bg-[#0078D4] text-white' : 'hover:bg-[#F3F2F1] text-[#323130]'}`}>中文</button>
                  <button onClick={() => setLanguage('en-US')} className={`w-full text-left px-3 py-1.5 text-sm rounded ${language === 'en-US' ? 'bg-[#0078D4] text-white' : 'hover:bg-[#F3F2F1] text-[#323130]'}`}>English</button>
                </div>
              </div>

              {/* Theme - Submenu */}
              <div className="relative group/popb">
                <div className="flex items-center justify-between px-3 py-2 text-sm text-[#323130] hover:bg-[#F3F2F1] rounded cursor-pointer">
                  <span>{isZh ? '主题' : 'Theme'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
                <div className="hidden group-hover/popb:block absolute left-full top-0 ml-1 w-24 bg-white rounded-md shadow-lg border border-[#E1DFDD] p-1">
                  {themes.map((t) => (
                    <button key={t.value} onClick={() => setTheme(t.value)} className={`w-full text-left px-3 py-1.5 text-sm rounded ${theme === t.value ? 'bg-[#0078D4] text-white' : 'hover:bg-[#F3F2F1] text-[#323130]'}`}>{isZh ? t.nameZh : t.nameEn}</button>
                  ))}
                </div>
              </div>

              {/* Show Log */}
              <div
                onClick={() => { openLogFile(); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#323130] hover:bg-[#F3F2F1] rounded cursor-pointer"
              >
                {icons['log']}
                {isZh ? '显示日志' : 'Show Log'}
              </div>

              {/* About */}
              <div
                onClick={() => { showAbout(); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#323130] hover:bg-[#F3F2F1] rounded cursor-pointer"
              >
                {icons['info']}
                {isZh ? '关于' : 'About'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className={`fixed rounded-md shadow-lg border z-30 py-1 ${
            isDark ? 'bg-[#3d3d3d] border-[#404040]' : 'bg-white border-[#E1DFDD]'
          }`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDeleteList(contextMenu.listId)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm rounded ${
              isDark ? 'text-red-400 hover:bg-[#404040]' : 'text-[#D13438] hover:bg-[#F3F2F1]'
            }`}
          >
            {icons['trash']}
            {isZh ? '删除清单' : 'Delete List'}
          </button>
        </div>
      )}
    </div>
  );
}
