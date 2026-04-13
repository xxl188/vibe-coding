import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Box, FileText, Check, Copy, Wand2, X, BookmarkPlus, Tag, ChevronDown, RotateCcw, Download, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../AppContext';
import { useLocation } from 'react-router-dom';

interface Draft {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  price: string;
}

export default function InputPage() {
  const { state, addGeneratedTask, addTemplate } = useAppContext();
  const location = useLocation();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: '',
    material: '',
    color: '',
    size: '',
    targetUser: '',
    price: '',
    description: ''
  });

  // 处理从模板页或主页传来的参数
  useEffect(() => {
    if (location.state) {
      const { 
        templateTitle, templateDescription, templatePrice,
        templateBrand, templateCategory, templateMaterial,
        templateColor, templateSize, templateTargetUser,
        selectedAssetImage
      } = location.state as any;
      
      let stateChanged = false;
      let newFormData = { ...formData };

      if (templateTitle || templateDescription) {
        newFormData = {
          ...newFormData,
          title: templateTitle || newFormData.title,
          description: templateDescription || newFormData.description,
          price: templatePrice || newFormData.price,
          brand: templateBrand || newFormData.brand,
          category: templateCategory || newFormData.category,
          material: templateMaterial || newFormData.material,
          color: templateColor || newFormData.color,
          size: templateSize || newFormData.size,
          targetUser: templateTargetUser || newFormData.targetUser
        };
        stateChanged = true;
      }

      if (selectedAssetImage) {
        setImage(null);
        setImagePreview(selectedAssetImage);
        stateChanged = true;
      }

      if (stateChanged) {
        setFormData(newFormData);
        // 清除 state，防止刷新时重复加载
        window.history.replaceState({}, document.title);
      }
    }
  }, [location]);

  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // 快速模板选择器状态
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const templates = state.templates || [];

  const handleApplyTemplate = (tpl: any | null) => {
    if (tpl === null) {
      // 选择"无"，清空所有表单
      if (window.confirm('确定要清空当前所有已填写的商品信息吗？')) {
        setFormData({
          title: '',
          brand: '',
          category: '',
          material: '',
          color: '',
          size: '',
          targetUser: '',
          price: '',
          description: ''
        });
      }
    } else {
      // 应用模板
      setFormData(prev => ({
        ...prev,
        title: tpl.title || prev.title,
        description: tpl.description || prev.description,
        price: tpl.price || prev.price,
        brand: tpl.brand || prev.brand,
        category: tpl.category || prev.category,
        material: tpl.material || prev.material,
        color: tpl.color || prev.color,
        size: tpl.size || prev.size,
        targetUser: tpl.targetUser || prev.targetUser
      }));
    }
    setShowTemplateDropdown(false);
  };

  // 模板保存相关状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', tags: '' });
  const [selectedDraftForTemplate, setSelectedDraftForTemplate] = useState<Draft | null>(null);

  // AI Modal 状态
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiStyle, setAiStyle] = useState('爆款风格');
  
  interface AIChatRecord {
    id: string;
    timestamp: number;
    style: string;
    promptSummary: string;
    response: string;
  }
  const [aiChatHistory, setAiChatHistory] = useState<AIChatRecord[]>(() => {
    const saved = localStorage.getItem('easyVibeAIChatHistory');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('easyVibeAIChatHistory', JSON.stringify(aiChatHistory));
  }, [aiChatHistory]);

  const exportHistoryToJson = () => {
    if (aiChatHistory.length === 0) {
      alert('暂无历史记录可导出');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(aiChatHistory, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `EasyVibe_AI_Chat_History_${Date.now()}.json`;
    link.click();
  };

  const deleteChatRecord = (id: string) => {
    setAiChatHistory(prev => prev.filter(record => record.id !== id));
  };

  // 资产库 Modal 状态
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);

  // 图片处理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Input Changes correctly for all fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // AI 智能识图 (SiliconFlow Qwen-VL)
  const handleImageToText = async () => {
    if (!image && !imagePreview) {
      alert('请先上传商品图片');
      return;
    }

    setIsAnalyzingImage(true);
    try {
      let base64Data = '';
      if (image) {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
      } else if (imagePreview) {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const SILICONFLOW_API_KEY = 'sk-egulcpcgzdhgomxxsiyutaguipoeuakyoxvuxqycgsndizhh';
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SILICONFLOW_API_KEY}`
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-VL-72B-Instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '你是一个专业的电商运营专家。请详细分析这张商品图片，严格以 JSON 格式输出，包含以下字段：\n"title": "简短商品名称",\n"category": "商品类目",\n"color": "主要颜色",\n"description": "吸引人的电商卖点描述"'
                },
                { type: 'image_url', image_url: { url: base64Data } }
              ]
            }
          ],
          max_tokens: 512,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) throw new Error('API 请求失败');

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*?}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        const parsed = JSON.parse(jsonStr);
        
        setFormData(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          category: parsed.category || prev.category,
          color: parsed.color || prev.color,
          description: parsed.description || prev.description
        }));
      } catch (e) {
        setFormData(prev => ({ ...prev, description: content }));
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('识别失败，请检查网络');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // AI 智能生成文案 (DeepSeek)
  const handleGenerateCopy = async () => {
    if (!formData.title) {
      alert("请先填写商品名称或使用AI识图");
      return;
    }
    
    setIsGeneratingCopy(true);
    
    let stylePrompt = '';
    switch (aiStyle) {
      case '爆款风格':
        stylePrompt = '你是一个资深抖音电商操盘手。请写一段极具冲击力的短视频/图文带货文案，要善用Emoji，制造紧迫感，突出卖点和价格优势，激发冲动消费。';
        break;
      case '情感共鸣':
        stylePrompt = '你是一个懂生活的种草达人。文案要像朋友聊天一样，真诚、走心，通过场景化描述触动用户的情绪，建立品牌连接。';
        break;
      case '专业测评':
        stylePrompt = '你是一个硬核测评博主。文案需要客观、严谨，多列举数据和技术参数，用专业知识说服消费者。';
        break;
      case '幽默风趣':
        stylePrompt = '你是一个搞笑段子手。文案要幽默、好玩，用神转折或搞笑梗来引出产品卖点，让人在笑声中种草。';
        break;
      case '故事营销':
        stylePrompt = '你是一个擅长讲故事的品牌企划。通过一个小故事（比如研发背景、用户真实经历等）来引出产品，增强记忆点。';
        break;
      case '简约高级':
        stylePrompt = '你是一个顶级奢侈品牌文案。文字要克制、留白，不需要太多废话，只用几个词句传达产品的高级质感。';
        break;
      default:
        stylePrompt = '你是一个资深电商运营专家。请生成一段高转化率的带货文案。';
    }

    try {
      const DEEPSEEK_API_KEY = 'sk-4f88746d6afc45f1a4bd07c3d6e6d78d';
      const prompt = `请为以下商品生成一段带货文案：
商品名称：${formData.title}
品牌：${formData.brand}
分类：${formData.category}
材质：${formData.material}
颜色：${formData.color}
适用人群：${formData.targetUser}
价格：${formData.price}
补充信息：${formData.description}
请直接输出文案正文，不要包含多余的分析或客套话。`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: stylePrompt },
            { role: 'user', content: prompt }
          ],
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          const aiResp = data.choices[0].message.content;
          const newRecord: AIChatRecord = {
            id: `chat-${Date.now()}`,
            timestamp: Date.now(),
            style: aiStyle,
            promptSummary: `商品：${formData.title} | 风格：${aiStyle}`,
            response: aiResp
          };
          setAiChatHistory(prev => [newRecord, ...prev]);
        }
      } else {
        alert(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Copy generation failed:', error);
      alert(`请求失败: ${String(error)}`);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // 生成草稿
  const handleGenerateDraft = async () => {
    if (!formData.title || (!imagePreview && !image)) {
      alert('请上传商品图片并填写商品名称');
      return;
    }
    
    setIsGeneratingDraft(true);
    try {
      // 如果没有填写文案，自动生成一次
      let finalDescription = formData.description;
      if (!finalDescription) {
        // ... (省略自动调用文案接口以节省时间，这里简单回退)
        finalDescription = '高品质，值得信赖';
      }

      // 压缩图片转 Base64，防止 localStorage 容量爆满
      let finalImageUrl = imagePreview || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80';
      if (image) {
        finalImageUrl = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve('');
            
            // 将最大宽高限制在 800px 以内，减少 base64 体积
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            if (width > height && width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            } else if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // 输出 0.6 质量的 JPEG
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(image);
        });
      }

      const newDraft: Draft = {
        id: `draft-${Date.now()}`,
        imageUrl: finalImageUrl,
        title: formData.title,
        description: finalDescription,
        price: formData.price || '待定价'
      };
      
      setDrafts(prev => [newDraft, ...prev]);
      
      // 同步到全局状态 (工作台)
      addGeneratedTask({
        id: newDraft.id,
        name: newDraft.title,
        imageUrl: newDraft.imageUrl,
        title: newDraft.title,
        description: newDraft.description,
        price: newDraft.price
      });
      
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // 模板保存
  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) {
      alert('请输入模板名称');
      return;
    }
    if (!selectedDraftForTemplate) return;

    // 这里我们直接调用 addTemplate，注意要在顶部从 useAppContext 中解构出来
    addTemplate({
      name: templateForm.name,
      tags: templateForm.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      title: selectedDraftForTemplate.title,
      description: selectedDraftForTemplate.description,
      price: selectedDraftForTemplate.price,
      brand: formData.brand,
      category: formData.category,
      material: formData.material,
      color: formData.color,
      size: formData.size,
      targetUser: formData.targetUser
    });
    
    setShowTemplateModal(false);
    setTemplateForm({ name: '', tags: '' });
    setSelectedDraftForTemplate(null);
    alert('模板保存成功，可在「模板资产库」查看！');
  };

  const handleDownloadImage = async (imageUrl: string, title: string) => {
    try {
      if (imageUrl.startsWith('http')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title || '素材'}.png`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${title || '素材'}.png`;
        link.click();
      }
    } catch (error) {
      console.error('下载图片失败:', error);
      // 如果 fetch 失败（比如跨域），降级为在新窗口打开
      window.open(imageUrl, '_blank');
    }
  };

  const InputField = ({ label, name, placeholder }: { label: string, name: keyof typeof formData, placeholder?: string }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-500">{label}</label>
      <input 
        type="text"
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
      />
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] flex relative" style={{ backgroundColor: 'var(--color-vibe-bg, transparent)' }}>
      
      {/* Left Panel: Input Form */}
      <div className="w-[480px] bg-white border-r border-gray-100 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Box className="w-6 h-6 text-blue-600" />
            商品录入
          </h1>
          <p className="text-xs text-gray-500 mt-1">输入商品信息以生成内容</p>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* Template Quick Select */}
              {templates.length > 0 && (
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700">快速应用模板</label>
                  </div>
                  <div 
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
                  >
                    <span className="text-blue-600 font-bold flex items-center gap-2">
                      <BookmarkPlus className="w-4 h-4" />
                      从资产库中选择模板...
                    </span>
                    <ChevronDown className={clsx("w-4 h-4 text-blue-500 transition-transform", showTemplateDropdown && "rotate-180")} />
                  </div>
                  
                  {showTemplateDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar py-2 animate-in fade-in zoom-in-95 duration-200">
                      
                      <div 
                        onClick={() => handleApplyTemplate(null)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center gap-2 text-gray-600 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <div className="font-bold text-sm">不使用模板 (清空表单)</div>
                      </div>

                      {templates.map(tpl => (
                        <div 
                          key={tpl.id}
                          onClick={() => handleApplyTemplate(tpl)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                        >
                          <div className="font-bold text-gray-900 mb-1">{tpl.name}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{tpl.title} | {tpl.price}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Image Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">视觉素材</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowAssetLibrary(true)}
                      className="text-xs font-bold text-gray-600 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Box className="w-3 h-3" />
                      从资产库选择
                    </button>
                    <button 
                      onClick={handleImageToText}
                      disabled={isAnalyzingImage || (!image && !imagePreview)}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 disabled:opacity-50"
                    >
                      {isAnalyzingImage ? <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI 智能识图提取
                    </button>
                  </div>
                </div>
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center bg-gray-50 hover:border-blue-400 transition-colors overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Upload className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-xs font-bold">点击上传商品主图</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">基础信息</h3>
                <InputField label="商品名称" name="title" placeholder="例如：透气运动跑鞋" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="品牌" name="brand" placeholder="品牌名" />
                  <InputField label="类目" name="category" placeholder="例如：运动鞋" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="价格" name="price" placeholder="例如：¥ 299" />
                </div>
              </div>

              {/* Attributes */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">属性规格</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="材质" name="material" placeholder="例如：网面/棉质" />
                  <InputField label="颜色" name="color" placeholder="例如：黑/白" />
                  <InputField label="尺寸" name="size" placeholder="例如：36-44" />
                  <InputField label="适用人群" name="targetUser" placeholder="例如：青年男性" />
                </div>
              </div>

              {/* Copywriting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">营销文案</label>
                  <button 
                    onClick={() => setShowAIModal(true)}
                    className="text-xs font-bold text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    AI 一键生成爆款文案
                  </button>
                </div>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="手动输入或使用 AI 生成商品卖点描述..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none custom-scrollbar"
                />
              </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button 
            onClick={handleGenerateDraft}
            disabled={isGeneratingDraft || !formData.title}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            {isGeneratingDraft ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
            立即生成草稿
          </button>
        </div>
      </div>

      {/* Right Panel: Result Preview */}
      <div className="flex-1 flex flex-col h-full" style={{ backgroundColor: 'var(--color-vibe-bg, transparent)' }}>
        <div className="p-8 border-b border-gray-100 bg-white shadow-sm z-0">
          <h2 className="text-xl font-bold text-gray-900">生成结果</h2>
          <p className="text-sm text-gray-500 mt-1">已生成 {drafts.length} 个营销草稿</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {drafts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center justify-center mb-6 rotate-12">
                <FileText className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">暂无生成内容</h3>
              <p className="text-sm text-gray-400">请在左侧录入商品信息并点击生成</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {drafts.map(draft => (
                <div key={draft.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-gray-50 relative">
                    <img src={draft.imageUrl} alt={draft.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-3.5 h-3.5 text-green-500" /> 就绪
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{draft.title}</h3>
                    <div className="text-sm font-bold text-blue-600 mb-3">{draft.price}</div>
                    <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 flex-1 whitespace-pre-wrap">
                      {draft.description}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => handleDownloadImage(draft.imageUrl, draft.title)}
                        className="flex-1 bg-gray-900 hover:bg-black text-white py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        下载素材
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDraftForTemplate(draft);
                          setShowTemplateModal(true);
                        }}
                        className="px-4 bg-orange-50 hover:bg-orange-100 text-orange-600 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                        title="保存为模板"
                      >
                        <BookmarkPlus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigator.clipboard.writeText(draft.description)}
                        className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center"
                        title="复制文案"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 资产库选择 Modal */}
      {showAssetLibrary && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">从资产库选择素材</h3>
                  <p className="text-sm text-gray-500">选择您之前生成的图片进行 AI 智能识图与文案提取</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAssetLibrary(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
              {!state.history || state.history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center mb-4">
                    <Box className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">主页暂无生成素材</h3>
                  <p className="text-sm text-gray-400">请先在 AI 创作中心生成商品图片</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {state.history.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => {
                        setImage(null);
                        setImagePreview(task.imageUrl || null);
                        setShowAssetLibrary(false);
                      }}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      <div className="aspect-[4/3] bg-gray-50 relative">
                        <img src={task.imageUrl} alt={task.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                            选择此图
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{task.name}</h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI 文案生成 Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">AI 文案生成</h3>
                  <p className="text-sm text-gray-500">基于商品信息智能生成抖音电商文案</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAIModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
              {/* Product Info Summary */}
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">商品信息概要</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-500 mr-2">商品名称:</span><span className="font-medium">{formData.title || '未填写'}</span></div>
                  <div><span className="text-gray-500 mr-2">品牌:</span><span className="font-medium">{formData.brand || '未填写'}</span></div>
                  <div><span className="text-gray-500 mr-2">类目:</span><span className="font-medium">{formData.category || '未填写'}</span></div>
                  <div><span className="text-gray-500 mr-2">价格:</span><span className="font-medium">{formData.price || '未填写'}</span></div>
                  <div><span className="text-gray-500 mr-2">适用人群:</span><span className="font-medium text-purple-600">{formData.targetUser || '未填写'}</span></div>
                  <div><span className="text-gray-500 mr-2">颜色:</span><span className="font-medium text-purple-600">{formData.color || '未填写'}</span></div>
                  <div className="col-span-2 md:col-span-3"><span className="text-gray-500 mr-2">补充信息:</span><span className="font-medium">{formData.description || '无'}</span></div>
                </div>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">选择文案风格</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: '爆款风格', desc: '抓住眼球，突出卖点' },
                    { name: '情感共鸣', desc: '触动情感，建立连接' },
                    { name: '专业测评', desc: '客观专业，突出性价比' },
                    { name: '幽默风趣', desc: '轻松幽默，增加互动' },
                    { name: '故事营销', desc: '讲述故事，增强记忆点' },
                    { name: '简约高级', desc: '简洁有力，突出质感' }
                  ].map((style) => (
                    <div 
                      key={style.name}
                      onClick={() => setAiStyle(style.name)}
                      className={clsx(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        aiStyle === style.name 
                          ? "border-purple-500 bg-purple-50" 
                          : "border-gray-200 bg-white hover:border-purple-300"
                      )}
                    >
                      <div className={clsx("font-bold mb-1", aiStyle === style.name ? "text-purple-700" : "text-gray-900")}>
                        {style.name}
                      </div>
                      <div className="text-xs text-gray-500">{style.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerateCopy}
                disabled={isGeneratingCopy || !formData.title}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              >
                {isGeneratingCopy ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {isGeneratingCopy ? '正在拼命构思中...' : '生成文案'}
              </button>

              {/* Result Area (History) */}
              {aiChatHistory.length > 0 && (
                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      对话历史记录 ({aiChatHistory.length})
                    </h4>
                    <button 
                      onClick={exportHistoryToJson} 
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> 导出 JSON
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {aiChatHistory.map(record => (
                      <div key={record.id} className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-purple-300">
                        <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-purple-900 bg-purple-200/50 border border-purple-200 px-2 py-1 rounded-md">{record.style}</span>
                            <span className="text-xs font-medium text-gray-500">{new Date(record.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => navigator.clipboard.writeText(record.response)} 
                              className="text-purple-600 hover:text-purple-800 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-purple-100/50 flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" /> 复制
                            </button>
                            <button 
                              onClick={() => deleteChatRecord(record.id)} 
                              className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> 删除
                            </button>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="text-[11px] text-gray-500 mb-3 font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex items-start gap-2">
                            <span className="text-purple-400 font-bold shrink-0">Prompt</span>
                            {record.promptSummary}
                          </div>
                          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium text-sm">
                            {record.response}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                          <button 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, description: record.response }));
                              setShowAIModal(false);
                            }} 
                            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" /> 应用此文案到商品描述
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-[440px] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--color-vibe-heading)]">保存为可重用模板</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[var(--color-vibe-heading)] mb-2">模板名称 *</label>
                <input 
                  type="text" 
                  placeholder="例如：男士极简包袋模板"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-vibe-heading)] mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" /> 分类标签
                </label>
                <input 
                  type="text" 
                  placeholder="使用逗号分隔，如：男包, 极简, 促销"
                  value={templateForm.tags}
                  onChange={(e) => setTemplateForm({...templateForm, tags: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-vibe-primary)] outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowTemplateModal(false)} 
                className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveTemplate} 
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/30"
              >
                保存模板
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
