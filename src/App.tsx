import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, Image as ImageIcon, Wand2, Grid, Settings as SettingsIcon, Share2, Sparkles, ArrowLeft, Plus } from 'lucide-react';
import clsx from 'clsx';
import { AppProvider, useAppContext } from './AppContext';

// Pages
import DashboardPage from './pages/DashboardPage';
import TaskPage from './pages/TaskPage';
import InputPage from './pages/InputPage';
import BatchPage from './pages/BatchPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';

function Navigation() {
  const location = useLocation();
  const { state } = useAppContext();

  // Apply theme color globally when it changes
  useEffect(() => {
    const color = state.settings.themeColor;
    document.documentElement.style.setProperty('--color-vibe-bg', color === '#ffffff' ? '#fcfcfc' : color);
  }, [state.settings.themeColor]);

  const navItems = [
    { path: '/dashboard', icon: Home, label: '首页' },
    { path: '/layers', icon: Layers, label: '商品录入' },
    { path: '/tasks', icon: Wand2, label: 'AI 创作中心' },
    { path: '/grid', icon: Grid, label: '批量导入' },
    { path: '/settings', icon: SettingsIcon, label: '全局偏好设置' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="w-[72px] shrink-0 h-screen flex flex-col bg-white border-r border-gray-100 z-50 items-center py-6 hidden md:flex shadow-sm relative">
        <div className="flex flex-col gap-6 w-full px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <div key={item.path} className="relative group">
                <Link
                  to={item.path}
                  className={clsx(
                    "flex items-center justify-center w-12 h-12 rounded-2xl transition-all",
                    isActive 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-2" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  )}
                >
                  <Icon className={clsx("w-5 h-5", isActive && "stroke-[2.5px]")} />
                </Link>
                {/* Tooltip */}
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg pointer-events-none translate-x-[-10px] group-hover:translate-x-0">
                  {item.label}
                  {/* Tooltip Arrow */}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50 flex items-center justify-around p-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center justify-center p-2.5 rounded-xl transition-all",
                isActive 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                  : "text-gray-400"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive && "stroke-[2.5px]")} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function TopHeader() {
  const navigate = useNavigate();
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-indigo-900 tracking-tight">电商素材工作台</span>
          <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-100 rounded uppercase tracking-wider">Beta</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
          <Sparkles className="w-4 h-4" /> Transform
        </button>
      </div>
    </header>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden" style={{ backgroundColor: 'var(--color-vibe-bg, #fcfcfc)' }}>
      <Navigation />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <TopHeader />
        <main className="flex-1 overflow-y-auto relative w-full h-full custom-scrollbar" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/layers" element={<AppLayout><InputPage /></AppLayout>} />
          <Route path="/tasks" element={<AppLayout><TaskPage /></AppLayout>} />
          <Route path="/grid" element={<AppLayout><BatchPage /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
