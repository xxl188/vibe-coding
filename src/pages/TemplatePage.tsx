import React, { useState } from 'react';
import { Box, Search, Tag, Copy, FileText, ChevronRight, Trash2, Edit2, X } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { Link, useNavigate } from 'react-router-dom';

export default function TemplatePage() {
  const { state, deleteTemplate, updateTemplate } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // 编辑弹窗状态
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const templates = state.templates || [];
  
  const filteredTemplates = templates.filter(tpl => {
    const searchLower = searchTerm.toLowerCase();
    const matchName = tpl.name?.toLowerCase().includes(searchLower);
    const matchTags = Array.isArray(tpl.tags) && tpl.tags.some(tag => tag?.toLowerCase().includes(searchLower));
    return matchName || matchTags;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12" style={{ backgroundColor: 'var(--color-vibe-bg, transparent)' }}>
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-vibe-heading)] mb-2 flex items-center gap-3">
            <Box className="w-8 h-8 text-[var(--color-vibe-primary)]" />
            模板资产库
          </h1>
          <p className="text-[var(--color-vibe-muted)]">管理你保存的可重用图文模板，提升批量生成的效率。</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="搜索模板名称或标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[var(--color-vibe-border)] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-[var(--color-vibe-muted)] absolute left-3.5 top-3" />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="vibe-card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[var(--color-vibe-bg)] rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-[var(--color-vibe-muted)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-vibe-heading)] mb-2">没有找到模板</h3>
          <p className="text-[var(--color-vibe-muted)] text-sm max-w-md mb-6">
            你还没有保存过任何模板，或者没有匹配当前搜索词的模板。你可以在商品生成页面将满意的结果保存为模板。
          </p>
          <Link to="/layers" className="bg-[var(--color-vibe-primary)] hover:bg-[var(--color-vibe-primary-hover)] text-white rounded-lg py-2.5 px-6 text-sm font-bold transition-all shadow-sm">
            去商品录入
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(tpl => (
            <div key={tpl.id} className="vibe-card p-6 flex flex-col hover:-translate-y-1 transition-transform relative group/card">
              <button 
                onClick={() => {
                  if (window.confirm('确定要删除这个模板吗？')) {
                    deleteTemplate(tpl.id);
                  }
                }}
                className="absolute -top-3 -right-3 bg-red-100 text-red-500 p-2 rounded-full shadow-sm opacity-0 group-hover/card:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10"
                title="删除模板"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button 
                onClick={() => setEditingTemplate({ ...tpl, tags: tpl.tags.join(', ') })}
                className="absolute -top-3 right-8 bg-blue-100 text-blue-500 p-2 rounded-full shadow-sm opacity-0 group-hover/card:opacity-100 hover:bg-blue-500 hover:text-white transition-all z-10"
                title="编辑模板详情"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-[var(--color-vibe-heading)] text-lg line-clamp-1" title={tpl.name}>
                  {tpl.name}
                </h3>
                <div className="flex gap-1.5 flex-wrap justify-end pl-2">
                  {tpl.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="bg-[var(--color-vibe-primary)]/10 text-[var(--color-vibe-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </span>
                  ))}
                  {tpl.tags.length > 2 && (
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">+{tpl.tags.length - 2}</span>
                  )}
                </div>
              </div>
              
              <div className="bg-[var(--color-vibe-bg)] rounded-lg p-4 font-mono text-[11px] text-[var(--color-vibe-text)] mb-6 flex-1 border border-[var(--color-vibe-border)]/50">
                <div className="mb-2"><span className="text-[var(--color-vibe-muted)] font-bold">TITLE:</span> <br/><span className="text-[var(--color-vibe-primary)]">{tpl.title}</span></div>
                <div className="mb-2 line-clamp-3"><span className="text-[var(--color-vibe-muted)] font-bold">DESC:</span> <br/>{tpl.description}</div>
                <div><span className="text-[var(--color-vibe-muted)] font-bold">PRICE:</span> {tpl.price}</div>
              </div>

              <button 
                onClick={() => {
                  navigate('/layers', { 
                    state: { 
                      templateTitle: tpl.title,
                      templateDescription: tpl.description,
                      templatePrice: tpl.price,
                      templateBrand: tpl.brand,
                      templateCategory: tpl.category,
                      templateMaterial: tpl.material,
                      templateColor: tpl.color,
                      templateSize: tpl.size,
                      templateTargetUser: tpl.targetUser
                    } 
                  });
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-white border border-[var(--color-vibe-border)] text-sm font-bold text-[var(--color-vibe-heading)] hover:bg-[var(--color-vibe-bg)] hover:text-[var(--color-vibe-primary)] hover:border-[var(--color-vibe-primary)] transition-colors group"
              >
                <Copy className="w-4 h-4" />
                去应用此模板
                <ChevronRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* 编辑弹窗 */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-[var(--color-vibe-heading)]">编辑模板详情</h3>
              <button 
                onClick={() => setEditingTemplate(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">模板名称</label>
                  <input 
                    type="text" 
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">标签 (逗号分隔)</label>
                  <input 
                    type="text" 
                    value={editingTemplate.tags}
                    onChange={e => setEditingTemplate({...editingTemplate, tags: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">默认商品名称 (TITLE)</label>
                  <input 
                    type="text" 
                    value={editingTemplate.title}
                    onChange={e => setEditingTemplate({...editingTemplate, title: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">默认价格 (PRICE)</label>
                  <input 
                    type="text" 
                    value={editingTemplate.price}
                    onChange={e => setEditingTemplate({...editingTemplate, price: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">品牌</label>
                  <input 
                    type="text" value={editingTemplate.brand || ''} onChange={e => setEditingTemplate({...editingTemplate, brand: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">类目</label>
                  <input 
                    type="text" value={editingTemplate.category || ''} onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">材质</label>
                  <input 
                    type="text" value={editingTemplate.material || ''} onChange={e => setEditingTemplate({...editingTemplate, material: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">颜色</label>
                  <input 
                    type="text" value={editingTemplate.color || ''} onChange={e => setEditingTemplate({...editingTemplate, color: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">尺寸</label>
                  <input 
                    type="text" value={editingTemplate.size || ''} onChange={e => setEditingTemplate({...editingTemplate, size: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">适用人群</label>
                  <input 
                    type="text" value={editingTemplate.targetUser || ''} onChange={e => setEditingTemplate({...editingTemplate, targetUser: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">营销文案 (DESC)</label>
                <textarea 
                  value={editingTemplate.description}
                  onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                  rows={6}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingTemplate(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  const tagsArray = editingTemplate.tags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean);
                  updateTemplate(editingTemplate.id, {
                    name: editingTemplate.name,
                    tags: tagsArray,
                    title: editingTemplate.title,
                    price: editingTemplate.price,
                    description: editingTemplate.description,
                    brand: editingTemplate.brand,
                    category: editingTemplate.category,
                    material: editingTemplate.material,
                    color: editingTemplate.color,
                    size: editingTemplate.size,
                    targetUser: editingTemplate.targetUser
                  });
                  setEditingTemplate(null);
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-[var(--color-vibe-primary)] hover:bg-[var(--color-vibe-primary-hover)] shadow-lg shadow-[var(--color-vibe-primary)]/30 transition-all"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
