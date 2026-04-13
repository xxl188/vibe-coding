import React, { useState, useEffect } from 'react';
import { Save, Settings2, Image, Key } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../AppContext';

export default function SettingsPage() {
  const { state, updateSettings } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for the form, initialized from context
  const [localSettings, setLocalSettings] = useState(state.settings);

  // Apply preview color globally when localSettings.themeColor changes
  useEffect(() => {
    const color = localSettings.themeColor;
    document.documentElement.style.setProperty('--color-vibe-bg', color === '#ffffff' ? '#fcfcfc' : color);
    
    // Cleanup function: when unmounting or leaving the page without saving,
    // revert the background color back to the saved global state.
    return () => {
      const savedColor = state.settings.themeColor;
      document.documentElement.style.setProperty('--color-vibe-bg', savedColor === '#ffffff' ? '#fcfcfc' : savedColor);
    };
  }, [localSettings.themeColor, state.settings.themeColor]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      updateSettings(localSettings);
      setIsSaving(false);
      alert('设置已保存成功并应用到全局！');
    }, 600);
  };

  const handleColorChange = (color: string) => {
    setLocalSettings({ ...localSettings, themeColor: color });
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-12">
      
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-vibe-heading)] mb-2 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-[var(--color-vibe-primary)]" />
            全局偏好设置
          </h1>
          <p className="text-[var(--color-vibe-muted)]">配置默认生成规则与大模型接口，掌控你的工作流。</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={clsx(
            "bg-gradient-btn text-white rounded-lg py-2.5 px-6 flex items-center gap-2 font-bold transition-all shadow-sm border border-transparent",
            isSaving ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-0.5"
          )}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? '保存中...' : '保存配置'}</span>
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Section 1: Image Style */}
        <section className="vibe-card p-8">
          <h2 className="text-xl font-bold text-[var(--color-vibe-heading)] mb-6 flex items-center gap-2 border-b border-[var(--color-vibe-border)] pb-4">
            <Image className="w-5 h-5 text-[var(--color-vibe-muted)]" /> 图文风格偏好
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[var(--color-vibe-heading)] mb-2">默认视觉主色调</label>
              <div className="flex gap-4">
                {['#ffffff', '#000000', '#f3f4f6', '#ffedd5', '#dbeafe'].map((color, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleColorChange(color)}
                    className={clsx(
                      "w-10 h-10 rounded-full border-2 shadow-sm transition-all outline-none",
                      localSettings.themeColor === color 
                        ? "border-[var(--color-vibe-primary)] scale-110 ring-2 ring-offset-2 ring-[var(--color-vibe-primary)]" 
                        : "border-[var(--color-vibe-border)] hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-xs text-[var(--color-vibe-muted)] mt-3">注意：选择颜色后会即时预览背景变化，点击保存后生效。</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
