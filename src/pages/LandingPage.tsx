import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Image as ImageIcon, Layout, Zap, Layers } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl text-gray-900 tracking-tight">电商素材工作台</span>
          <span className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-100 rounded uppercase tracking-wider">Beta</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 max-w-5xl mx-auto w-full">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/80 shadow-sm backdrop-blur-md mb-8 text-sm font-semibold text-indigo-600">
          <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          全新的 AI 电商内容生产范式
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
          让每一件商品，<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            拥有直击人心的视觉展现
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
          聚合火山引擎 Doubao、硅基流动 Qwen-VL 与 DeepSeek 顶尖大模型。从商品录入到图文生成，彻底重塑电商素材生产工作流，实现 10 倍降本增效。
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <button 
            onClick={() => navigate('/dashboard')}
            className="group relative px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg overflow-hidden shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:shadow-gray-900/30 transition-all hover:-translate-y-0.5 flex items-center gap-3"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
            <span className="relative z-10">进入工作台</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-lg shadow-gray-200/50 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">多端素材生成</h3>
            <p className="text-gray-500 leading-relaxed">一键生成电商横版海报、抖音竖屏首图，支持模特智能换装，覆盖全域营销场景。</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-lg shadow-gray-200/50 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI 智能打标</h3>
            <p className="text-gray-500 leading-relaxed">利用 VLM 视觉大模型反向解析生成图，联动 DeepSeek 输出高 CTR 的 10 字营销短标题。</p>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-lg shadow-gray-200/50 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
              <Layout className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">异步批量处理</h3>
            <p className="text-gray-500 leading-relaxed">创新 Excel 批量导入模式，后台自动挂起处理队列，将单图制作耗时从小时级压缩至 10 秒。</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-gray-400 text-sm z-10">
        &copy; {new Date().getFullYear()} 电商素材工作台. Powered by Vibe Coding.
      </footer>
    </div>
  );
}
