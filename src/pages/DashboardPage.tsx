import React, { useState, useRef } from 'react';
import { Plus, ArrowRight, Image as ImageIcon, Sparkles, Trash2, X, Download, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import clsx from 'clsx';

export default function DashboardPage() {
  const { state, deleteHistoryItem, deleteHistoryItems, incrementExported } = useAppContext();
  const navigate = useNavigate();
  
  const [previewItem, setPreviewItem] = useState<typeof state.history[0] | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // 批量删除相关状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('确定要删除这个生成资产吗？删除后不可恢复。')) {
      deleteHistoryItem(id);
      if (previewItem?.id === id) {
        setPreviewItem(null);
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`确定要删除选中的 ${selectedIds.size} 个资产吗？删除后不可恢复。`)) {
      deleteHistoryItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === state.history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(state.history.map(item => item.id)));
    }
  };

  const handleDownload = async () => {
    if (!previewItem || !previewRef.current) return;
    setIsExporting(true);
    
    try {
      const domtoimage = (await import('dom-to-image')).default;
      
      const dataUrl = await domtoimage.toPng(previewRef.current as Node, {
        quality: 1,
        bgcolor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `Easy-Vibe-${previewItem.name}.png`;
      link.href = dataUrl;
      link.click();
      
      incrementExported();
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出图片失败');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-dot-grid" style={{ backgroundColor: 'var(--color-vibe-bg, transparent)' }}>
      
      {/* Canvas Area */}
      <div className="w-full h-full overflow-y-auto custom-scrollbar p-8 pb-32">
        {state.history.length > 0 && (
          <div className="max-w-[1600px] mx-auto mb-6 flex justify-end">
            {isSelectionMode ? (
              <div className="flex items-center gap-3 animate-in fade-in duration-200">
                <span className="text-sm font-medium text-gray-600 mr-2">
                  已选择 {selectedIds.size} 项
                </span>
                <button 
                  onClick={toggleSelectAll}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  {selectedIds.size === state.history.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  全选
                </button>
                <button 
                  onClick={handleBatchDelete}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除所选
                </button>
                <button 
                  onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSelectionMode(true)}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-[var(--color-vibe-primary)] hover:text-[var(--color-vibe-primary)] text-gray-600 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <CheckSquare className="w-4 h-4" />
                批量管理
              </button>
            )}
          </div>
        )}

        {state.history.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-20">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-indigo-100">
              <Sparkles className="w-10 h-10 text-[var(--color-vibe-primary)]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Easy Vibe</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              这里是您的创作画布。您还没有生成任何商品图文资产，通过下方的输入框或者前往“商品生成”页面开始您的第一次创作吧。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-[1600px] mx-auto">
            {state.history.map((item) => (
              <div 
                key={item.id} 
                className={clsx(
                  "bg-white rounded-2xl shadow-sm border overflow-hidden transition-all group flex flex-col cursor-pointer relative",
                  isSelectionMode 
                    ? selectedIds.has(item.id) 
                      ? "border-purple-500 ring-2 ring-purple-500 shadow-md" 
                      : "border-gray-200 hover:border-gray-400"
                    : "border-gray-200 hover:shadow-xl hover:border-[var(--color-vibe-primary)]"
                )}
                onClick={() => {
                  if (isSelectionMode) {
                    setSelectedIds(prev => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  } else {
                    setPreviewItem(item);
                  }
                }}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="absolute top-4 left-4 z-20 w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center">
                    {selectedIds.has(item.id) ? (
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                )}

                {/* Delete Button on Hover (Hidden in Selection Mode) */}
                {!isSelectionMode && (
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      crossOrigin={item.imageUrl.startsWith('blob:') || item.imageUrl.startsWith('data:') ? undefined : "anonymous"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  {/* Subtle gradient overlay at bottom for better text contrast if we had text overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="p-5 flex flex-col gap-2">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-mono text-gray-400">{item.id}</span>
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-md">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="absolute bottom-0 left-0 w-full p-8 pointer-events-none flex justify-center bg-gradient-to-t from-white via-white/80 to-transparent">
        <div 
          className="pointer-events-auto w-full max-w-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full p-2 flex items-center border border-gray-200 hover:border-gray-300 transition-colors cursor-text group"
          onClick={() => navigate('/tasks')}
        >
          <div className="flex-1 px-6 text-gray-400 font-medium text-lg outline-none select-none">
            What do you want to create?
          </div>
          <button className="w-12 h-12 bg-indigo-50 text-[var(--color-vibe-primary)] rounded-full flex items-center justify-center hover:bg-[var(--color-vibe-primary)] hover:text-white transition-colors shadow-sm group-hover:scale-105">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
          <button 
            onClick={() => setPreviewItem(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col md:flex-row w-full max-w-7xl h-[90vh] md:h-[80vh] px-4 md:px-8 gap-6 md:gap-8 relative">
            {/* Image Preview */}
            <div className="w-full md:w-3/5 bg-black/50 flex items-center justify-center relative rounded-2xl overflow-hidden group p-8">
              {previewItem.imageUrl ? (
                <div ref={previewRef} className="relative w-full max-w-md aspect-square shadow-xl ring-1 ring-white/10 rounded-xl overflow-hidden bg-white">
                  <img 
                    src={previewItem.imageUrl} 
                    alt={previewItem.name} 
                    crossOrigin={previewItem.imageUrl.startsWith('blob:') || previewItem.imageUrl.startsWith('data:') ? undefined : "anonymous"}
                    className="w-full h-full object-cover"
                  />
                  {(previewItem.title || previewItem.price) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                      <div className="text-white font-bold text-2xl mb-2 leading-tight drop-shadow-md">{previewItem.title || previewItem.name}</div>
                      {previewItem.price && <div className="text-white/90 font-bold text-lg drop-shadow-md">{previewItem.price}</div>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p>无预览图</p>
                </div>
              )}
            </div>

            {/* Details Panel */}
            <div className="w-full md:w-2/5 flex flex-col bg-white/10 rounded-2xl p-8 backdrop-blur-md border border-white/10 text-white shrink-0 overflow-y-auto custom-scrollbar">
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                      {previewItem.status}
                    </span>
                    <span className="text-xs font-mono text-gray-400">ID: {previewItem.id}</span>
                  </div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">主标题</div>
                  <h2 className="text-xl font-bold leading-tight">{previewItem.title || previewItem.name}</h2>
                </div>
                
                {previewItem.price && (
                  <div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">价格设置</div>
                    <div className="text-lg text-blue-400 font-bold">{previewItem.price}</div>
                  </div>
                )}

                {previewItem.description && (
                  <div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">核心卖点与文案</div>
                    <div className="text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-lg">
                      {previewItem.description}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">生成时间</div>
                  <p className="text-sm font-mono bg-black/20 p-3 rounded-lg inline-block">{new Date(previewItem.time).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <button 
                  onClick={() => {
                    navigate('/layers', { 
                      state: { 
                        selectedAssetImage: previewItem.imageUrl 
                      } 
                    });
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 mb-2"
                >
                  <RefreshCcw className="w-5 h-5" /> 智能修改文案与卖点
                </button>

                <button 
                  onClick={handleDownload}
                  className="w-full py-3.5 bg-[var(--color-vibe-primary)] hover:bg-[var(--color-vibe-primary-hover)] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[var(--color-vibe-primary)]/20"
                  disabled={!previewItem.imageUrl || isExporting}
                >
                  {isExporting ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {isExporting ? '正在生成图片...' : '下载此资产'}
                </button>
                <button 
                  onClick={() => handleDelete(previewItem.id)}
                  className="w-full py-3.5 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" /> 删除此资产
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
