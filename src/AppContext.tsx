import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface AppState {
  templates: Array<{
    id: string;
    name: string;
    tags: string[];
    title: string;
    description: string;
    price: string;
    brand?: string;
    category?: string;
    material?: string;
    color?: string;
    size?: string;
    targetUser?: string;
  }>;
  settings: {
    themeColor: string;
    imageSize: string;
    toneOfVoice: string;
    systemPrompt: string;
  };
  stats: {
    totalGenerated: number;
    totalExported: number;
  };
  history: Array<{
    id: string;
    name: string;
    status: string;
    time: number;
    imageUrl?: string;
    title?: string;
    description?: string;
    price?: string;
  }>;
}

interface AppContextType {
  state: AppState;
  updateSettings: (newSettings: Partial<AppState['settings']>) => void;
  addGeneratedTask: (task: { id: string; name: string; imageUrl?: string; title?: string; description?: string; price?: string; }) => void;
  incrementExported: () => void;
  addTemplate: (template: Omit<AppState['templates'][0], 'id'>) => void;
  updateTemplate: (id: string, updates: Partial<AppState['templates'][0]>) => void;
  deleteTemplate: (id: string) => void;
  deleteHistoryItem: (id: string) => void;
  deleteHistoryItems: (ids: string[]) => void;
}

const defaultState: AppState = {
  templates: [
    {
      id: 'tpl-default',
      name: '默认爆款活动模板',
      tags: ['爆款', '通用', '活动标题'],
      title: '[限时特卖] {品牌} {类别}',
      description: '专为{目标用户}设计，采用顶级{材质}。尺寸：{尺寸}，颜色：{颜色}。核心卖点：{参考资产提取}',
      price: '¥ 99.00'
    }
  ],
  settings: {
    themeColor: '#ffffff',
    imageSize: '800x800',
    toneOfVoice: '极简高端',
    systemPrompt: '你是一个拥有十年经验的资深电商运营专家，精通各平台消费心理学。请根据用户提供的商品信息，生成具有极高转化率和点击率的文案。',
  },
  stats: {
    totalGenerated: 0,
    totalExported: 0,
  },
  history: [
    {
      id: 'TSK-1750',
      name: '水珠连衣裙 高速摄影',
      status: '已完成',
      time: Date.now(),
      imageUrl: 'https://images.unsplash.com/photo-1515347619252-9270081eb5e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      title: '灵动水珠，定格惊艳瞬间',
      description: '采用高速摄影技术，捕捉水珠飞溅的绝美形态，打造如梦似幻的视觉冲击力，完美展现夏日清凉与高定质感。',
      price: '¥ 1299.00'
    }
  ],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Try to load from localStorage first
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('easyVibeState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure templates array exists even if parsing old state version
        if (!parsed.templates) {
          parsed.templates = defaultState.templates;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved state');
      }
    }
    return defaultState;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('easyVibeState', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage (possibly quota exceeded):', e);
      // Optional: fallback logic to clear some history if quota exceeded, but for now we just catch the error to prevent crash
    }
  }, [state]);

  const updateSettings = (newSettings: Partial<AppState['settings']>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  const addGeneratedTask = (task: { id: string; name: string; imageUrl?: string; title?: string; description?: string; price?: string; }) => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalGenerated: prev.stats.totalGenerated + 1,
      },
      history: [
        {
          ...task,
          status: '已完成',
          time: Date.now(),
        },
        ...prev.history,
      ],
    }));
  };

  const incrementExported = () => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalExported: prev.stats.totalExported + 1,
      },
    }));
  };

  const addTemplate = (template: Omit<AppState['templates'][0], 'id'>) => {
    setState((prev) => ({
      ...prev,
      templates: [
        { ...template, id: `tpl-${Date.now()}` },
        ...(prev.templates || []),
      ],
    }));
  };

  const updateTemplate = (id: string, updates: Partial<AppState['templates'][0]>) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  };

  const deleteTemplate = (id: string) => {
    setState((prev) => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== id),
    }));
  };

  const deleteHistoryItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((item) => item.id !== id),
    }));
  };

  const deleteHistoryItems = (ids: string[]) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((item) => !ids.includes(item.id)),
    }));
  };

  return (
    <AppContext.Provider value={{ state, updateSettings, addGeneratedTask, incrementExported, addTemplate, updateTemplate, deleteTemplate, deleteHistoryItem, deleteHistoryItems }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
