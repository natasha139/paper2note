
import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  Share2, 
  Info, 
  Settings, 
  Palette,
  FileText,
  Target,
  Maximize
} from 'lucide-react';
import { PaperNoteData, ThemeType } from './types';
import { polishNoteContent } from './services/geminiService';
import PreviewCard from './components/PreviewCard';

const INITIAL_DATA: PaperNoteData = {
  catchyTitle: '',
  paperTitle: '',
  authors: '',
  source: '',
  oneSentenceValue: '',
  researchQuestion: '',
  keyContribution: '',
  methods: [],
  strengths: [],
  limitations: [],
  takeaways: [],
  connection: '',
  questions: '',
  tags: ['论文笔记', '科研干货'],
  username: ''
};

export default function App() {
  const [data, setData] = useState<PaperNoteData>(() => {
    const saved = localStorage.getItem('paper2note_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });
  
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('paper2note_theme');
    return (saved as ThemeType) || 'cream';
  });

  const [aspectRatio, setAspectRatio] = useState<'3:4' | '1:1'>(() => {
    const saved = localStorage.getItem('paper2note_aspectRatio');
    return (saved as '3:4' | '1:1') || '3:4';
  });

  const [isAdaptive, setIsAdaptive] = useState<boolean>(() => {
    const saved = localStorage.getItem('paper2note_isAdaptive');
    return saved === 'true';
  });

  const [isPolishing, setIsPolishing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('paper2note_data', JSON.stringify(data));
    setCurrentSlide(0); // Reset slide on data change
  }, [data]);

  useEffect(() => {
    localStorage.setItem('paper2note_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('paper2note_aspectRatio', aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem('paper2note_isAdaptive', String(isAdaptive));
  }, [isAdaptive]);

  // Slide Splitting Logic
  const slides = React.useMemo(() => {
    if (isAdaptive) {
      return [{ visibleSections: ['header', 'highlights', 'researchQuestion', 'keyContribution', 'methods_takeaways', 'critique', 'questions_connection', 'footer'] }];
    }

    const totalChars = JSON.stringify(data).length;
    const threshold = aspectRatio === '3:4' ? 1400 : 900;
    
    // If brief enough, one slide
    if (totalChars < threshold && data.methods.length <= 6 && data.takeaways.length <= 6) {
      return [{ visibleSections: ['header', 'highlights', 'researchQuestion', 'keyContribution', 'methods_takeaways', 'critique', 'questions_connection', 'footer'] }];
    }
    
    // Otherwise split
    const result: { 
      visibleSections: string[], 
      listSplits?: { [key: string]: { start: number, end: number } } 
    }[] = [];

    // Slide 1: Intro
    result.push({ visibleSections: ['header', 'highlights', 'researchQuestion', 'keyContribution', 'footer'] });
    
    // Methods splitting
    if (data.methods.length > 0) {
      const perSlide = aspectRatio === '3:4' ? 8 : 6;
      for (let i = 0; i < data.methods.length; i += perSlide) {
        result.push({ 
          visibleSections: ['header', 'methods_only', 'footer'],
          listSplits: { methods: { start: i, end: i + perSlide } }
        });
      }
    }

    // Takeaways splitting
    if (data.takeaways.length > 0) {
      const perSlide = aspectRatio === '3:4' ? 8 : 6;
      for (let i = 0; i < data.takeaways.length; i += perSlide) {
        result.push({ 
          visibleSections: ['header', 'takeaways_only', 'footer'],
          listSplits: { takeaways: { start: i, end: i + perSlide } }
        });
      }
    }
    
    // Critique & Connection
    if (data.strengths.length > 0 || data.limitations.length > 0 || data.questions || data.connection) {
      result.push({ visibleSections: ['header', 'critique', 'questions_connection', 'footer'] });
    }
    
    return result;
  }, [data, aspectRatio, isAdaptive]);

  const handleInputChange = (field: keyof PaperNoteData, value: string | string[]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleListChange = (field: keyof PaperNoteData, index: number, value: string) => {
    const list = [...(data[field] as string[])];
    list[index] = value;
    setData(prev => ({ ...prev, [field]: list }));
  };

  const addListItem = (field: keyof PaperNoteData) => {
    const list = [...(data[field] as string[])];
    list.push('');
    setData(prev => ({ ...prev, [field]: list }));
  };

  const removeListItem = (field: keyof PaperNoteData, index: number) => {
    const list = [...(data[field] as string[])];
    list.splice(index, 1);
    setData(prev => ({ ...prev, [field]: list }));
  };

  const handlePolish = async () => {
    if (!data.paperTitle) {
      alert("请至少输入论文标题后再进行AI优化");
      return;
    }
    setIsPolishing(true);
    try {
      const polished = await polishNoteContent(data);
      setData(prev => ({ ...prev, ...polished }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleExport = async () => {
    if (!cardRef.current) return;
    
    // Final check for overflow in adaptive mode
    const contentBody = cardRef.current.querySelector('[data-id="content-body"]');
    if (isAdaptive && contentBody && contentBody.scrollHeight > cardRef.current.clientHeight) {
      const confirmExport = window.confirm("内容仍然略微超出单页范围，导出可能存在轻微裁剪。是否继续导出？建议减少内容或使用多页模式。");
      if (!confirmExport) return;
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, 
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      const safeTitle = data.paperTitle ? data.paperTitle.slice(0, 15).replace(/[^a-z0-9]/gi, '_') : 'Note';
      const slideSuffix = slides.length > 1 ? `_Slide${currentSlide + 1}` : '';
      link.download = `PaperNote_${aspectRatio.replace(':', '_')}${slideSuffix}_${safeTitle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f0f2f5]">
      {/* Sidebar - Form Control */}
      <div className="w-full md:w-[450px] lg:w-[550px] bg-white shadow-xl h-screen overflow-y-auto p-6 z-20 custom-scrollbar">
        <header className="flex items-center gap-2 mb-8 border-b pb-4">
          <div className="bg-[#ff2442] p-2 rounded-xl text-white">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Paper2Note</h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Scientific Note Creator</p>
          </div>
        </header>

        <div className="space-y-8">
          {/* Metadata Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Info size={18} className="text-[#ff2442]" />
              <h2 className="font-bold uppercase text-sm tracking-wider">论文基础信息</h2>
            </div>
            <div className="space-y-3">
              <Input label="主标题 (爆款名字)" value={data.catchyTitle} onChange={v => handleInputChange('catchyTitle', v)} placeholder="e.g. 深度学习入门必看！一文读懂..." />
              <Input label="原论文标题" value={data.paperTitle} onChange={v => handleInputChange('paperTitle', v)} placeholder="Paper Title" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="作者" value={data.authors} onChange={v => handleInputChange('authors', v)} placeholder="Authors" />
                <Input label="发表来源" value={data.source} onChange={v => handleInputChange('source', v)} placeholder="Journal/Conf" />
              </div>
            </div>
          </section>

          {/* AI Polishing Button */}
          <button 
            onClick={handlePolish}
            disabled={isPolishing}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm ${isPolishing ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-purple-500 to-[#ff2442] text-white shadow-lg hover:opacity-90 active:scale-95'}`}
          >
            {isPolishing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Sparkles size={18} />}
            {isPolishing ? 'AI正在琢磨爆款词汇...' : 'AI一键优化文案'}
          </button>

          {/* Core Content Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Target size={18} className="text-[#ff2442]" />
              <h2 className="font-bold uppercase text-sm tracking-wider">核心干货提取</h2>
            </div>
            <div className="space-y-4">
              <TextArea label="一句话价值点" value={data.oneSentenceValue} onChange={v => handleInputChange('oneSentenceValue', v)} placeholder="为什么要读这篇文章？" rows={2} />
              <TextArea label="研究问题" value={data.researchQuestion} onChange={v => handleInputChange('researchQuestion', v)} placeholder="解决了什么痛点？" rows={2} />
              <TextArea label="核心贡献" value={data.keyContribution} onChange={v => handleInputChange('keyContribution', v)} placeholder="主要创新点是什么？" rows={2} />
              
              <ListInput label="核心方法 (步骤)" list={data.methods} onChange={(i, v) => handleListChange('methods', i, v)} onAdd={() => addListItem('methods')} onRemove={(i) => removeListItem('methods', i)} />
              
              <div className="grid grid-cols-1 gap-4">
                <ListInput label="优势点" list={data.strengths} onChange={(i, v) => handleListChange('strengths', i, v)} onAdd={() => addListItem('strengths')} onRemove={(i) => removeListItem('strengths', i)} />
                <ListInput label="局限性" list={data.limitations} onChange={(i, v) => handleListChange('limitations', i, v)} onAdd={() => addListItem('limitations')} onRemove={(i) => removeListItem('limitations', i)} />
              </div>

              {/* Added Key Takeaways as requested */}
              <ListInput label="核心要点 (Key Takeaways)" list={data.takeaways} onChange={(i, v) => handleListChange('takeaways', i, v)} onAdd={() => addListItem('takeaways')} onRemove={(i) => removeListItem('takeaways', i)} />

              <TextArea label="存疑/待探讨 (Questions)" value={data.questions} onChange={v => handleInputChange('questions', v)} placeholder="读完后还有哪些不解或值得深挖的点？" rows={2} />
              
              {/* Added Connection to Research field specifically as requested */}
              <TextArea label="与我研究的相关性 (Connection)" value={data.connection} onChange={v => handleInputChange('connection', v)} placeholder="这篇论文如何影响或联系我现在的研究方向？" rows={3} />
            </div>
          </section>

          {/* Personalization Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <Settings size={18} className="text-[#ff2442]" />
              <h2 className="font-bold uppercase text-sm tracking-wider">个性化设置</h2>
            </div>
            <div className="space-y-3">
              <Input label="小红书 ID" value={data.username} onChange={v => handleInputChange('username', v)} placeholder="e.g. 芝士科研君" />
              <Input label="话题标签 (逗号分隔)" value={data.tags.join(', ')} onChange={v => handleInputChange('tags', v.split(',').map(t => t.trim()))} placeholder="科研, 论文, AI" />
            </div>
          </section>
        </div>

        <div className="h-24" /> {/* Spacer */}
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 h-screen bg-slate-100 overflow-y-auto relative flex flex-col">
        {/* Sticky Control Bar */}
        <div className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              {(['cream', 'white', 'minimal', 'modern', 'dark', 'ocean'] as ThemeType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black capitalize transition-all ${theme === t ? 'bg-[#ff2442] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              {(['3:4', '1:1'] as const).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${aspectRatio === ratio ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAdaptive(!isAdaptive)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black ${isAdaptive ? 'bg-purple-50 border-purple-200 text-purple-600 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'}`}
            >
              <Maximize size={12} />
              {isAdaptive ? '单页自适应已开启' : '启用单页自适应'}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {slides.length > 1 && (
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button 
                  onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
                  disabled={currentSlide === 0}
                  className="px-2 py-1 text-xs font-bold disabled:opacity-30"
                >
                  ←
                </button>
                <span className="px-3 text-[10px] font-black tracking-widest text-[#ff2442]">
                  {currentSlide + 1} / {slides.length}
                </span>
                <button 
                  onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="px-2 py-1 text-xs font-bold disabled:opacity-30"
                >
                  →
                </button>
              </div>
            )}
            
            <button 
              onClick={handleExport}
              className="bg-[#ff2442] text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-black hover:scale-105 active:scale-95 transition-all shadow-lg tracking-wider text-sm"
            >
              <Download size={16} /> 下载当前页
            </button>
          </div>
        </div>

        {/* Card Container */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="transform scale-[0.55] sm:scale-[0.75] md:scale-[0.85] lg:scale-100 xl:scale-110 origin-center transition-transform duration-500">
             <PreviewCard 
               data={data} 
               theme={theme} 
               cardRef={cardRef} 
               aspectRatio={aspectRatio} 
               visibleSections={slides[currentSlide]?.visibleSections}
               listSplits={slides[currentSlide]?.listSplits}
               isAdaptive={isAdaptive}
               slideInfo={{ current: currentSlide + 1, total: slides.length }}
             />
          </div>
        </div>
        
        <div className="pb-8 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <Share2 size={12} /> 预览模式: {aspectRatio === '3:4' ? '1080 x 1440' : '1080 x 1080'} (等比缩小)
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const Input: React.FC<{ label: string, value: string, onChange: (v: string) => void, placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#ff2442] focus:bg-white outline-none transition-all text-sm font-medium"
    />
  </div>
);

const TextArea: React.FC<{ label: string, value: string, onChange: (v: string) => void, placeholder?: string, rows?: number }> = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <textarea 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#ff2442] focus:bg-white outline-none transition-all text-sm font-medium resize-none"
    />
  </div>
);

const ListInput: React.FC<{ label: string, list: string[], onChange: (i: number, v: string) => void, onAdd: () => void, onRemove: (i: number) => void }> = ({ label, list, onChange, onAdd, onRemove }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <button onClick={onAdd} className="text-[#ff2442] hover:bg-[#fff0f3] p-1 rounded-md transition-colors">
        <Plus size={16} />
      </button>
    </div>
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input 
            type="text"
            value={item}
            onChange={(e) => onChange(i, e.target.value)}
            className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-[#ff2442] outline-none text-xs"
            placeholder={`条目 ${i + 1}`}
          />
          <button onClick={() => onRemove(i)} className="text-gray-300 hover:text-red-500 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {list.length === 0 && <p className="text-[10px] text-gray-300 italic">点击 "+" 添加内容</p>}
    </div>
  </div>
);
