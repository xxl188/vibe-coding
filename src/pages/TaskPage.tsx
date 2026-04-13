import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Shirt, Wand2, Layout, Maximize2, Download, RefreshCw, X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../AppContext';

const MODES = [
  { id: 'poster', icon: ImageIcon, title: '电商海报', desc: '生成高转化商品海报，支持背景替换' },
  { id: 'douyin', icon: Layout, title: '抖音首图', desc: '吸睛的短视频封面，竖屏比例' },
  { id: 'clothes', icon: Shirt, title: '模特换装', desc: 'AI一键替换服装，保持姿势不变' },
  { id: 'bg-replace', icon: Wand2, title: '多图融合', desc: '将多个元素巧妙融合入新场景，光影自然' }
];

const STYLES = [
  '高端大气', '极简留白', '户外自然', '科技赛博', '清新日系', '复古港风', '节日促销', '梦幻光影'
];

export default function TaskPage() {
  const { addGeneratedTask } = useAppContext();
  
  // UI State
  const [activeMode, setActiveMode] = useState('poster');
  const [activeStyle, setActiveStyle] = useState('');
  const [prompt, setPrompt] = useState('');
  
  // File State
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [extraImage, setExtraImage] = useState<File | null>(null);
  const [extraImagePreview, setExtraImagePreview] = useState<string | null>(null);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // 自动隐藏 Error Toast
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const handleModeChange = (modeId: string) => {
    setActiveMode(modeId);
    setResultImage(null); // 切换模式时清空生成的图片结果
    
    // 切换模式时自动清空之前填写的提示词和选择的风格
    setPrompt('');
    setActiveStyle('');
    
    // 根据需求，这里我们只清空提示词和风格，保留用户上传的图片
    // 这样如果用户传了图片想试试不同模式，就不需要重新上传了
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'ref' | 'extra') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      if (type === 'main') {
        setImage(file);
        setImagePreview(preview);
      } else if (type === 'ref') {
        setReferenceImage(file);
        setReferenceImagePreview(preview);
      } else {
        setExtraImage(file);
        setExtraImagePreview(preview);
      }
    }
  };

  const removeImage = (type: 'main' | 'ref' | 'extra', e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'main') {
      setImage(null);
      setImagePreview(null);
    } else if (type === 'ref') {
      setReferenceImage(null);
      setReferenceImagePreview(null);
    } else {
      setExtraImage(null);
      setExtraImagePreview(null);
    }
  };

  const urlOrFileToBase64 = async (source: File | string): Promise<string> => {
    let url = typeof source === 'string' ? source : URL.createObjectURL(source);
    
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 避免跨域图片的 canvas 污染问题
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas not supported');
        
        // 限制最大宽高，避免图片过大导致 Netlify 413 Payload Too Large
        let { width, height } = img;
        const MAX_SIZE = 1024;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // 压缩质量 0.8
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        if (typeof source !== 'string') URL.revokeObjectURL(url);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleGenerate = async () => {
    // 模特换装模式和背景替换模式下，如果没有输入 prompt，可以给予一个默认的
    let currentPrompt = prompt;
    if (!currentPrompt) {
      if (activeMode === 'clothes') {
        currentPrompt = '将图1的服装换为图2的服装';
      } else if (activeMode === 'bg-replace') {
        currentPrompt = '将图1作为主体，融入图2的背景中，如果提供了图3，将其作为辅助元素合理地放置在画面中，保持整体光影自然协调';
      } else if (!activeStyle) {
        alert('请输入提示词或选择一个风格');
        return;
      }
    }
    
    // 如果没有图片，则作为纯文本生图处理；如果有图片，则调用图生图 API
    if (activeMode === 'bg-replace') {
      if (!image && !imagePreview) {
        alert('多图融合模式下，请至少上传一张主体图（图1）和一张背景图（图2）。');
        return;
      }
      if (!referenceImage && !referenceImagePreview) {
        alert('多图融合模式下，请至少上传一张主体图（图1）和一张背景图（图2）。');
        return;
      }
    }

    setIsGenerating(true);
    setResultImage(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const finalPrompt = `${currentPrompt} ${activeStyle ? `, 风格要求: ${activeStyle}` : ''} ${activeMode === 'douyin' ? ', 适合抖音电商首图竖屏' : ''}`.trim();
      const isImageToImage = imagePreview || image || referenceImagePreview || referenceImage || extraImagePreview || extraImage;

      const payload: Record<string, unknown> = {
        model: 'doubao-seedream-4-5-251128',
        prompt: finalPrompt,
        response_format: 'b64_json',
        size: '2K'
      };

      if (isImageToImage) {
        const images: string[] = [];
        
        // 1. 处理主体图（图1，模特/主体）
        if (image) images.push(await urlOrFileToBase64(image));
        else if (imagePreview) images.push(await urlOrFileToBase64(imagePreview));

        // 2. 处理参考图（图2，目标服装图/背景图/风格图）
        if (referenceImage) images.push(await urlOrFileToBase64(referenceImage));
        else if (referenceImagePreview) images.push(await urlOrFileToBase64(referenceImagePreview));

        // 3. 处理额外融合图（图3，气球等补充元素）
        if (activeMode === 'bg-replace') {
          if (extraImage) images.push(await urlOrFileToBase64(extraImage));
          else if (extraImagePreview) images.push(await urlOrFileToBase64(extraImagePreview));
        }

        // 只有当有图片被添加时，才传递 image 参数
        if (images.length > 0) {
          payload.image = images;
          payload.sequential_image_generation = 'disabled'; // 多图生成必须关闭此项
        }
      }

      const response = await fetch('/api/volcengine/api/v3/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer cfc2a0d7-7304-4d5e-b539-0e969f27a5e0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      let newImgUrl = '';
      if (data.data && data.data.length > 0 && data.data[0].b64_json) {
        newImgUrl = `data:image/jpeg;base64,${data.data[0].b64_json}`;
      } else if (data.data && data.data.length > 0 && data.data[0].url) {
        newImgUrl = data.data[0].url;
      } else {
        throw new Error('API 返回数据格式不符合预期');
      }

      setResultImage(newImgUrl);
      
      // 生成更加语义化的标题 - 使用 DeepSeek 提取关键词
      let taskTitle = MODES.find(m => m.id === activeMode)?.title || '未命名';
      if (currentPrompt || activeStyle) {
        try {
          const DEEPSEEK_API_KEY = 'sk-4f88746d6afc45f1a4bd07c3d6e6d78d';
          const titlePrompt = `请根据以下用户的绘图提示词，提取或总结出最核心的 1 到 3 个关键词作为商品图片的短标题（例如："古风汉服"、"极简水杯"、"赛博朋克风外套"）。\n要求：\n1. 只输出标题文本，不要包含任何标点符号、解释或客套话。\n2. 总字数不要超过 10 个字。\n用户的提示词：${currentPrompt}\n用户选择的风格：${activeStyle || '无'}`;
          
          const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: titlePrompt }],
              stream: false
            })
          });
          
          if (dsResponse.ok) {
            const dsData = await dsResponse.json();
            if (dsData.choices && dsData.choices.length > 0) {
              taskTitle = dsData.choices[0].message.content.trim().substring(0, 15);
            }
          }
        } catch (e) {
          console.error('DeepSeek title extraction failed, falling back to basic extraction.', e);
          if (currentPrompt) {
            taskTitle = currentPrompt.substring(0, 10) + (currentPrompt.length > 10 ? '...' : '');
          } else if (activeStyle) {
            taskTitle = activeStyle;
          }
        }
      }

      addGeneratedTask({
        id: `TSK-${Math.floor(Math.random() * 10000)}`,
        name: taskTitle,
        imageUrl: newImgUrl,
        title: finalPrompt.substring(0, 20) + '...',
        description: `生成模式: ${MODES.find(m => m.id === activeMode)?.title}, 风格: ${activeStyle || '默认'}, 提示词: ${currentPrompt}`,
        price: '¥ 待定价'
      });

    } catch (error) {
      console.error('Generation failed:', error);
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorToast(isTimeout ? '请求超时，请检查网络或稍后重试' : `生成失败: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.download = `AI-Generated-${Date.now()}.png`;
    link.href = resultImage;
    link.click();
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col relative" style={{ backgroundColor: 'var(--color-vibe-bg, transparent)' }}>
      
      {/* Error Toast */}
      {errorToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-red-500/30 flex items-center gap-3 font-bold">
            <AlertCircle className="w-5 h-5" />
            {errorToast}
            <button 
              onClick={() => setErrorToast(null)}
              className="ml-2 hover:bg-red-600 p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-48 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI 创作中心</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-xl">选择创作模式，上传素材并输入提示词，AI 将为你生成高质量的电商视觉资产。</p>
            {/* Extra Image Upload (Visible only for Bg-Replace) */}
            {activeMode === 'bg-replace' && (
              <div className="space-y-2 transition-all duration-300 opacity-100 flex flex-col h-full">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">💡</div>
                  示例教程 / 案例展示
                </label>
                <div className="relative border border-gray-200 rounded-2xl h-[240px] flex flex-col items-center justify-center transition-all overflow-hidden bg-white shadow-sm p-4">
                  <div className="w-full h-full flex flex-col items-center text-center">
                    <h4 className="font-bold text-gray-800 mb-2">多图融合怎么玩？</h4>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      上传至少两张图片，系统会自动将<span className="text-blue-600 font-bold">图1主体</span>完美融合到<span className="text-purple-600 font-bold">图2背景</span>中。
                    </p>
                    <div className="flex items-center gap-2 w-full max-w-[200px] mb-4">
                      <div className="flex-1 aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-200">图1<br/>主体</div>
                      <span className="text-gray-300 font-bold">+</span>
                      <div className="flex-1 aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-200">图2<br/>背景</div>
                      <span className="text-gray-300 font-bold">=</span>
                      <div className="flex-1 aspect-square bg-blue-50 rounded-lg flex items-center justify-center text-xs font-bold text-blue-500 border border-blue-200 shadow-sm relative overflow-hidden group cursor-help">
                        大片
                        <div className="absolute inset-0 bg-black/80 text-white text-[10px] p-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">光影自然</div>
                      </div>
                    </div>
                    <div className="mt-auto w-full bg-blue-50 text-blue-600 text-xs py-2 px-3 rounded-lg flex items-start gap-2 text-left">
                      <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>提示：可在下方输入框内用文字进行额外风格控制（如：“图1放在海边，天气晴朗”）</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Mode Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODES.map((mode) => (
              <div
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={clsx(
                  "p-5 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col items-start gap-3",
                  activeMode === mode.id 
                    ? "border-blue-600 bg-blue-50/50 shadow-sm" 
                    : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-blue-200"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  activeMode === mode.id ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                )}>
                  <mode.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={clsx("font-bold text-base mb-1", activeMode === mode.id ? "text-blue-900" : "text-gray-900")}>{mode.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Area */}
          <div className={clsx(
            "grid gap-6",
            activeMode === 'bg-replace' ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
          )}>
            
            {/* Main Image Upload (Always visible) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs">1</div>
                {activeMode === 'clothes' ? '上传模特图 (主体)' : '上传商品图 (主体/可选)'}
              </label>
              <div className={clsx(
                "relative border-2 border-dashed rounded-2xl h-[240px] flex flex-col items-center justify-center transition-all overflow-hidden",
                imagePreview ? "border-transparent bg-gray-100" : "border-gray-300 hover:border-blue-400 bg-white cursor-pointer"
              )}>
                <input 
                  type="file" 
                  accept="image/*"
                  className={clsx("absolute inset-0 w-full h-full z-10", imagePreview ? "hidden" : "opacity-0 cursor-pointer")}
                  onChange={(e) => handleImageChange(e, 'main')}
                />
                {imagePreview ? (
                  <div className="relative w-full h-full group/preview">
                    <img src={imagePreview} alt="Main" className="w-full h-full object-contain p-2" />
                    <button 
                      onClick={(e) => removeImage('main', e)}
                      className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-600">点击或拖拽上传</span>
                    <span className="text-xs text-gray-400 mt-1">支持 JPG / PNG</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Image Upload (Always Visible for Bg-Replace, Douyin, Poster, Clothes) */}
            <div className="space-y-2 transition-all duration-300 opacity-100">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs">2</div>
                {activeMode === 'clothes' ? '上传服装图 (参考必填)' : activeMode === 'bg-replace' ? '上传背景图 (参考必填)' : '上传风格参考图 (可选)'}
              </label>
              <div className={clsx(
                "relative border-2 border-dashed rounded-2xl h-[240px] flex flex-col items-center justify-center transition-all overflow-hidden",
                referenceImagePreview ? "border-transparent bg-gray-100" : "border-gray-300 hover:border-purple-400 bg-white cursor-pointer"
              )}>
                <input 
                  type="file" 
                  accept="image/*"
                  className={clsx("absolute inset-0 w-full h-full z-10", referenceImagePreview ? "hidden" : "opacity-0 cursor-pointer")}
                  onChange={(e) => handleImageChange(e, 'ref')}
                />
                {referenceImagePreview ? (
                  <div className="relative w-full h-full group/preview">
                    <img src={referenceImagePreview} alt="Reference" className="w-full h-full object-contain p-2" />
                    <button 
                      onClick={(e) => removeImage('ref', e)}
                      className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity hover:bg-black/70 z-20 pointer-events-auto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-600">点击或拖拽上传</span>
                    <span className="text-xs text-gray-400 mt-1">{activeMode === 'clothes' ? '请上传清晰的服装平铺图' : '上传参考图以限定风格'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Extra Image Upload (Visible only for Bg-Replace) */}
            {activeMode === 'bg-replace' && (
              <div className="space-y-2 transition-all duration-300 opacity-100">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs">3</div>
                  上传融合图 (参考可选)
                </label>
                <div className={clsx(
                  "relative border-2 border-dashed rounded-2xl h-[240px] flex flex-col items-center justify-center transition-all overflow-hidden",
                  extraImagePreview ? "border-transparent bg-gray-100" : "border-gray-300 hover:border-indigo-400 bg-white cursor-pointer"
                )}>
                  <input 
                    type="file" 
                    accept="image/*"
                    className={clsx("absolute inset-0 w-full h-full z-10", extraImagePreview ? "hidden" : "opacity-0 cursor-pointer")}
                    onChange={(e) => handleImageChange(e, 'extra')}
                  />
                  {extraImagePreview ? (
                    <div className="relative w-full h-full group/preview">
                      <img src={extraImagePreview} alt="Extra" className="w-full h-full object-contain p-2" />
                      <button 
                        onClick={(e) => removeImage('extra', e)}
                        className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity hover:bg-black/70 z-20 pointer-events-auto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <span className="text-sm font-bold text-gray-600">点击或拖拽上传</span>
                      <span className="text-xs text-gray-400 mt-1">上传补充元素以丰富画面</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Result Area */}
          {(resultImage || isGenerating) && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" /> 生成结果
              </h3>
              
              {isGenerating ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                  <p className="text-lg font-bold text-gray-800">AI 正在施展魔法...</p>
                  <p className="text-sm text-gray-500 mt-2">预计需要 15-20 秒，请耐心等待</p>
                </div>
              ) : resultImage ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                  <div className="relative aspect-square md:aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img 
                      src={resultImage} 
                      alt="Generated" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="bg-white text-gray-900 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        <Maximize2 className="w-4 h-4" /> 放大预览
                      </button>
                      <button 
                        onClick={handleDownload}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        <Download className="w-4 h-4" /> 下载图片
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-white flex items-center justify-between">
                    <div className="text-sm text-gray-500 truncate pr-4">
                      <span className="font-bold text-gray-700 mr-2">Prompt:</span>
                      {prompt || activeStyle || '默认风格'}
                    </div>
                    <button 
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 text-blue-600 text-sm font-bold px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      <RefreshCw className="w-4 h-4" /> 重新生成
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </div>

      {/* Floating Bottom Prompt Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent pointer-events-none z-40">
        <div className="max-w-4xl mx-auto pointer-events-auto flex flex-col items-center">
          
          {/* Style Pills */}
          <div className="flex gap-2 mb-4 w-full overflow-x-auto pb-2 custom-scrollbar justify-start md:justify-center">
            {STYLES.map(style => (
              <button
                key={style}
                onClick={() => setActiveStyle(prev => prev === style ? '' : style)}
                className={clsx(
                  "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm",
                  activeStyle === style 
                    ? "bg-blue-600 text-white border border-blue-600" 
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                )}
              >
                {style}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 flex items-center gap-3 w-full transition-shadow focus-within:shadow-2xl focus-within:border-blue-300">
            <div className="pl-4 text-blue-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <input 
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder={
                activeMode === 'clothes' 
                  ? "选填，默认将图1服装换为图2。你也可以输入其他要求..." 
                  : activeMode === 'bg-replace'
                  ? "选填，例如：将图1放入图2的海边，图3的热气球飘在天空中"
                  : "描述你想要的画面效果，例如：放在高级展台上，阳光明媚..."
              }
              className="flex-1 bg-transparent py-3 outline-none text-gray-800 placeholder:text-gray-400 font-medium"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt && !activeStyle && activeMode !== 'clothes' && activeMode !== 'bg-replace')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {isGenerating ? '生成中...' : '立即生成'}
            </button>
          </div>

        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {isPreviewOpen && resultImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={resultImage} 
            alt="Fullscreen Preview" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

    </div>
  );
}
