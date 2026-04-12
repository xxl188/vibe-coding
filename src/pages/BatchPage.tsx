import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, Play, Box } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../AppContext';
import * as XLSX from 'xlsx';

interface BatchTask {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  category: string;
  price: string;
  message?: string;
  // 新增保存解析数据的字段
  type: 'image-to-text' | 'text-to-image';
  sourceImage?: string; // URL
  prompt?: string;
  referenceImage?: string; // URL
  mode?: string;
  style?: string;
}

export default function BatchPage() {
  const { addGeneratedTask } = useAppContext();
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          
          let newTasks: BatchTask[] = [];

          // 1. 解析 Sheet 1: 批量看图写文案
          if (wb.SheetNames.includes("批量看图写文案")) {
            const ws1 = wb.Sheets["批量看图写文案"];
            const data1: any[][] = XLSX.utils.sheet_to_json(ws1, { header: 1 });
            
            for (let i = 0; i < data1.length; i++) {
              const row = data1[i];
              // 检查该行是否有任何有效数据
              const hasData = row && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
              if (!hasData) continue;
              
              const rowStr = row.map(c => String(c || '')).join(' ');
              
              // 过滤掉说明、表头、示例行（包含旧版模板中的示例关键词）
              if (
                rowStr.includes('使用说明') || 
                rowStr.includes('图片说明') || 
                rowStr.includes('商品图片') || 
                rowStr.includes('example.com') ||
                rowStr.includes('删除上方示例') ||
                rowStr.includes('拖拽插入此单元格')
              ) {
                continue;
              }
              
              const sourceImage = row[0] ? String(row[0]).trim() : '';
              let status: 'pending' | 'error' = 'pending';
              let message = undefined;
              
              if (!sourceImage) {
                 status = 'error';
                 message = '缺少图片链接 (不支持直接粘贴图片)';
              }
              
              newTasks.push({
                id: `batch-i2t-${Date.now()}-${i}`,
                type: 'image-to-text',
                sourceImage: sourceImage,
                name: row[1] ? String(row[1]) : `未命名商品 ${i}`,
                category: row[2] ? String(row[2]) : '通用类目',
                price: row[3] ? String(row[3]) : '¥待定',
                prompt: row[4] ? String(row[4]) : '',
                status: status,
                message: message
              });
            }
          }

          // 2. 解析 Sheet 2: 批量按文生图
          if (wb.SheetNames.includes("批量按文生图")) {
            const ws2 = wb.Sheets["批量按文生图"];
            const data2: any[][] = XLSX.utils.sheet_to_json(ws2, { header: 1 });
            
            for (let i = 0; i < data2.length; i++) {
              const row = data2[i];
              const hasData = row && row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
              if (!hasData) continue;
              
              const rowStr = row.map(c => String(c || '')).join(' ');
              
              if (
                rowStr.includes('使用说明') || 
                rowStr.includes('图片说明') || 
                rowStr.includes('画面描述') || 
                rowStr.includes('example.com') ||
                rowStr.includes('删除上方示例') ||
                rowStr.includes('拖拽插入此单元格') ||
                rowStr.includes('一瓶粉色香水') ||
                rowStr.includes('赛博朋克')
              ) {
                continue;
              }
              
              const prompt = row[0] ? String(row[0]).trim() : '';
              let status: 'pending' | 'error' = 'pending';
              let message = undefined;
              
              if (!prompt) {
                 status = 'error';
                 message = '缺少画面描述';
              }
              
              newTasks.push({
                id: `batch-t2i-${Date.now()}-${i}`,
                type: 'text-to-image',
                prompt: prompt,
                referenceImage: row[1] ? String(row[1]).trim() : '',
                mode: row[2] ? String(row[2]) : '电商海报',
                style: row[3] ? String(row[3]) : '默认',
                name: row[4] ? String(row[4]) : `生成任务 ${i}`,
                category: '视觉合成',
                price: '-',
                status: status,
                message: message
              });
            }
          }

          if (newTasks.length === 0) {
            alert('未能从文件中读取到有效数据，请检查是否删除了示例行或未填写必填项。');
          } else {
            setTasks(newTasks);
          }
        } catch (error) {
          console.error("Excel parse error", error);
          alert("解析文件失败，请确保上传的是正确的模板文件。");
        } finally {
          setIsUploading(false);
          // 清空 input 值，允许重复上传同一个文件
          e.target.value = '';
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleStartBatch = async () => {
    if (tasks.length === 0) return;
    setIsProcessing(true);
    
    // 使用一个局部变量来拷贝一份任务数组，避免闭包陷阱
    let currentTasks = [...tasks];
    let currentIndex = 0;
    
    const processNext = async () => {
      // 检查是否已经处理完所有任务
      if (currentIndex >= currentTasks.length) {
        setIsProcessing(false);
        alert('批量任务处理完成！');
        return;
      }

      const task = currentTasks[currentIndex];
      
      // 跳过已经成功或解析时出错的任务
      if (task.status === 'success' || task.status === 'error') {
        currentIndex++;
        processNext();
        return;
      }

      // 更新局部状态和 React 状态
      currentTasks[currentIndex] = { ...currentTasks[currentIndex], status: 'processing' };
      setTasks([...currentTasks]);

      try {
        if (task.type === 'image-to-text') {
          // 批量看图写文案逻辑 (调用 DeepSeek)
          const systemPrompt = `你是一个资深电商运营专家。请根据提供的商品图片和以下要求，生成高转化率的商品文案。
商品名称: ${task.name}
商品类目: ${task.category}
商品价格: ${task.price}
额外要求: ${task.prompt || '无'}`;

          const payload = {
            model: 'ep-20250216200236-x8r7x', // 假设这里使用和 InputPage 一样的 DeepSeek API 模型
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '请生成文案' }
            ],
            stream: false
          };

          const response = await fetch('/api/volcengine/api/v3/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer cfc2a0d7-7304-4d5e-b539-0e969f27a5e0'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error('API Request Failed');
          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          // 更新局部状态和 React 状态
          currentTasks[currentIndex] = { ...currentTasks[currentIndex], status: 'success', message: '生成文案成功' };
          setTasks([...currentTasks]);
          
          addGeneratedTask({
            id: task.id,
            name: `[批量文案] ${task.name}`,
            imageUrl: task.sourceImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            title: `批量生成的文案`,
            description: aiResponse,
            price: task.price
          });

        } else if (task.type === 'text-to-image') {
          // 批量按文生图逻辑 (调用 Doubao-seedream)
          const finalPrompt = `${task.prompt} ${task.style !== '默认' ? `, 风格要求: ${task.style}` : ''} ${task.mode === '抖音首图' ? ', 适合抖音电商首图竖屏' : ''}`.trim();
          
          const payload: any = {
            model: 'doubao-seedream-4-5-251128',
            prompt: finalPrompt,
            response_format: 'b64_json',
            size: '2K'
          };

          if (task.referenceImage) {
            payload.image = [await urlOrFileToBase64(task.referenceImage)];
          }

          const response = await fetch('/api/volcengine/api/v3/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer cfc2a0d7-7304-4d5e-b539-0e969f27a5e0'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error('API Request Failed');
          const data = await response.json();
          
          let newImgUrl = '';
          if (data.data && data.data[0] && data.data[0].b64_json) {
            newImgUrl = `data:image/jpeg;base64,${data.data[0].b64_json}`;
          } else {
            throw new Error('Invalid image data returned');
          }

          // 使用 Qwen-VL 分析生成的图片以获取更精准的标题
          let finalTitle = `[批量图片] ${task.name}`;
          try {
            const SILICONFLOW_API_KEY = 'sk-egulcpcgzdhgomxxsiyutaguipoeuakyoxvuxqycgsndizhh';
            const qwenResponse = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
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
                        text: '你是一个专业的电商图片编辑。请仔细观察这张图片，给它起一个简短、吸引人且符合内容的商品或场景标题（不要超过10个字）。请只返回标题文字本身，不要任何标点、引号或多余解释。'
                      },
                      { type: 'image_url', image_url: { url: newImgUrl } }
                    ]
                  }
                ],
                max_tokens: 50,
                temperature: 0.7,
                stream: false
              })
            });

            if (qwenResponse.ok) {
              const qwenData = await qwenResponse.json();
              if (qwenData.choices && qwenData.choices.length > 0) {
                const aiTitle = qwenData.choices[0].message.content.trim().replace(/['"]/g, '');
                if (aiTitle) finalTitle = aiTitle;
              }
            }
          } catch (e) {
            console.error('Qwen-VL title generation failed:', e);
            // 失败则使用回退标题
            finalTitle = task.prompt?.substring(0, 10) || finalTitle;
          }

          // 更新局部状态和 React 状态
          currentTasks[currentIndex] = { ...currentTasks[currentIndex], status: 'success', message: '生成图片成功' };
          setTasks([...currentTasks]);
          
          addGeneratedTask({
            id: task.id,
            name: finalTitle,
            imageUrl: newImgUrl,
            title: task.prompt?.substring(0, 20) || '生成的图片',
            description: `生成模式: ${task.mode}, 风格: ${task.style}`,
            price: '-'
          });
        }
      } catch (error) {
        currentTasks[currentIndex] = { ...currentTasks[currentIndex], status: 'error', message: String(error) };
        setTasks([...currentTasks]);
      }

      currentIndex++;
      processNext();
    };

    processNext();
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: 批量看图写文案
    const ws1Data = [
      ['⚠️ 使用说明：此表用于上传图片，让 AI 自动识别并写文案。第一行为表头，请勿删除。'],
      ['💡 图片说明：请在"商品图片"列中填入网络图片链接 (如 https://...)。注意：网页端暂不支持直接解析 Excel 内嵌的本地图片。'],
      ['商品图片 (必须是图片链接)', '商品名称 (选填)', '类目 (选填)', '价格 (选填)', '文案要求/卖点补充 (选填)'],
      ['https://example.com/shoe.jpg', '透气运动跑鞋', '鞋靴', '¥ 299', '强调夏季透气，适合跑步，语气活泼'],
      ['https://example.com/bag.jpg', '真皮单肩包', '箱包', '¥ 599', '极简高端风格，强调头层牛皮'],
      ['[请从这一行开始填写真实数据，删除上方示例]']
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
    // 合并第一行和第二行的说明单元格
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "批量看图写文案");

    // Sheet 2: 批量按文生图
    const ws2Data = [
      ['⚠️ 使用说明：此表用于上传文案和参考图，让 AI 自动生成高质量电商图片。第一行为表头，请勿删除。'],
      ['💡 图片说明：参考底图如果需要填写，请填入网络图片链接。注意：网页端暂不支持直接解析 Excel 内嵌的本地图片。'],
      ['画面描述/提示词 (必填)', '参考底图 (链接选填)', '生成模式 (选填)', '风格 (选填)', '商品名称 (选填)'],
      ['一瓶粉色香水放在高级大理石展台上，阳光明媚，光影自然', 'https://example.com/perfume.jpg', '电商海报', '极简留白', '玫瑰香水'],
      ['将商品放在赛博朋克风格的霓虹灯街道上，适合抖音竖屏', 'https://example.com/keyboard.jpg', '抖音首图', '科技赛博', '机械键盘'],
      ['[请从这一行开始填写真实数据，删除上方示例]']
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = [{ wch: 50 }, { wch: 45 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    ws2['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "批量按文生图");

    XLSX.writeFile(wb, "EasyVibe_批量导入标准模板.xlsx");
  };

  const successCount = tasks.filter(t => t.status === 'success').length;
  const errorCount = tasks.filter(t => t.status === 'error').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const processingCount = tasks.filter(t => t.status === 'processing').length;
  const hasUnfinishedTasks = pendingCount > 0 || processingCount > 0;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-vibe-bg, transparent)' }}>
      <div className="max-w-6xl mx-auto w-full px-8 py-10 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Box className="w-8 h-8 text-blue-600" />
              批量导入与生成
            </h1>
            <p className="text-gray-500 mt-2 text-sm">通过 Excel 模板一次性导入数百个商品，系统将自动分配 AI 算力进行批量文案撰写与图片合成。</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDownloadTemplate}
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              下载标准模板 (.xlsx)
            </button>
            <div className="relative">
              <button 
                disabled={isUploading || isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploading ? '解析中...' : '上传数据表'}
              </button>
              <input 
                type="file" 
                accept=".xlsx,.csv"
                onChange={handleFileUpload}
                disabled={isUploading || isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-6 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-sm font-bold text-gray-500 mb-1">总任务数</div>
              <div className="text-3xl font-extrabold text-gray-900">{tasks.length}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-sm font-bold text-gray-500 mb-1">等待中</div>
              <div className="text-3xl font-extrabold text-gray-500">{pendingCount}</div>
            </div>
            <div className="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm">
              <div className="text-sm font-bold text-green-600 mb-1">成功</div>
              <div className="text-3xl font-extrabold text-green-700">{successCount}</div>
            </div>
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
              <div className="text-sm font-bold text-red-600 mb-1">失败</div>
              <div className="text-3xl font-extrabold text-red-700">{errorCount}</div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden relative">
          
          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <FileSpreadsheet className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">暂无批量任务</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed text-sm">
                请先下载标准模板，按要求填写商品信息后上传。系统支持一次性处理最多 500 条数据。<br/><span className="font-bold text-amber-600">注意：图片列目前仅支持填入有效的图片链接（如 https://...），暂不支持直接解析 Excel 内嵌的本地图片。</span>
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-1">序号</div>
                <div className="col-span-4">商品名称</div>
                <div className="col-span-2">类目</div>
                <div className="col-span-2">价格</div>
                <div className="col-span-3 text-right">状态</div>
              </div>
              
              {/* Table Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {tasks.map((task, index) => (
                  <div key={task.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 items-center transition-colors">
                    <div className="col-span-1 text-sm font-mono text-gray-400">
                      {(index + 1).toString().padStart(3, '0')}
                    </div>
                    <div className="col-span-4 text-sm font-bold text-gray-900 truncate pr-4" title={task.name}>
                      {task.name}
                    </div>
                    <div className="col-span-2">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-bold">{task.category}</span>
                    </div>
                    <div className="col-span-2 text-sm font-mono text-gray-600">
                      {task.price}
                    </div>
                    <div className="col-span-3 flex justify-end">
                      {task.status === 'pending' && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                          等待处理
                        </span>
                      )}
                      {task.status === 'processing' && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          生成中...
                        </span>
                      )}
                      {task.status === 'success' && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          完成
                        </span>
                      )}
                      {task.status === 'error' && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md" title={task.message}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {task.message}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <div className="text-sm text-gray-500 font-medium">
                  {hasUnfinishedTasks ? (
                    <>预计处理时间：<span className="text-gray-900 font-bold">~{Math.ceil(tasks.filter(t => t.type === 'text-to-image' && (t.status === 'pending' || t.status === 'processing')).length * 8 + tasks.filter(t => t.type === 'image-to-text' && (t.status === 'pending' || t.status === 'processing')).length * 3)} 秒</span></>
                  ) : (
                    <span className="text-green-600 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> 队列处理完成</span>
                  )}
                </div>
                <button 
                  onClick={handleStartBatch}
                  disabled={isProcessing || !hasUnfinishedTasks}
                  className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-gray-900/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  {isProcessing ? '处理中...' : '开始执行队列'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
