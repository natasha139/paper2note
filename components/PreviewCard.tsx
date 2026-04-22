
import React from 'react';
import { PaperNoteData, ThemeType } from '../types';
import { THEMES } from '../constants';
import { 
  BookOpen, 
  Lightbulb, 
  Target, 
  Workflow, 
  CheckCircle2, 
  AlertCircle, 
  Link,
  Star,
  HelpCircle,
  Bookmark,
  GitBranch
} from 'lucide-react';

interface PreviewCardProps {
  data: PaperNoteData;
  theme: ThemeType;
  cardRef: React.RefObject<HTMLDivElement>;
  aspectRatio: '3:4' | '1:1';
  slideInfo?: {
    current: number;
    total: number;
  };
  visibleSections?: (keyof PaperNoteData | 'header' | 'highlights' | 'footer' | 'methods_takeaways' | 'methods_only' | 'takeaways_only' | 'critique' | 'questions_connection')[];
  listSplits?: {
    [key: string]: { start: number, end: number };
  };
  isAdaptive?: boolean;
}

const PreviewCard: React.FC<PreviewCardProps> = ({ data, theme, cardRef, aspectRatio, slideInfo, visibleSections, listSplits, isAdaptive }) => {
  const activeTheme = THEMES[theme];
  const [overflowAdjustment, setOverflowAdjustment] = React.useState(0);
  const [scaleFactor, setScaleFactor] = React.useState(1);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const dimensions = aspectRatio === '3:4' 
    ? { width: '540px', height: '720px' } 
    : { width: '540px', height: '540px' };

  // Height reduction factor for 1:1
  const heightFactor = aspectRatio === '1:1' ? 0.7 : 1.0;
  
  // Base total character estimation
  const totalLength = JSON.stringify(data).length;
  
  // Density Levels: 0 (Normal), 1 (Compact), 2 (Single Page Fit)
  const baseDensity = isAdaptive 
    ? (totalLength > 1800 * heightFactor ? 2 : totalLength > 1200 * heightFactor ? 1 : 0) 
    : (totalLength > 1500 ? 1 : 0);
  
  const density = Math.min(2, baseDensity + overflowAdjustment);
  
  // Helper to check if a section should be rendered
  const isVisible = (section: string) => !visibleSections || visibleSections.includes(section as any);

  // Partial list render helper
  const getListItems = (key: 'methods' | 'takeaways') => {
    const list = data[key] as string[];
    const split = listSplits?.[key];
    if (split) {
      return list.slice(split.start, split.end);
    }
    return list;
  };

  // Reset adjustment when data/aspect ratio changes
  React.useEffect(() => {
    setOverflowAdjustment(0);
    setScaleFactor(1);
  }, [data, aspectRatio, isAdaptive]);

  // Real-time overflow detection & Ultimate Fit
  React.useLayoutEffect(() => {
    if (isAdaptive && cardRef?.current && contentRef.current) {
      // Small delay to allow layout to settle
      const timer = setTimeout(() => {
        const containerHeight = cardRef.current?.clientHeight || 0;
        // Calculate total content height including scaling
        const contentHeight = contentRef.current?.scrollHeight || 0;
        
        if (contentHeight > containerHeight) {
          if (density < 2) {
            setOverflowAdjustment(prev => prev + 1);
          } else {
            // Ultimate Fit: Scale down content body
            const targetScale = (containerHeight - 20) / contentHeight; // Leave small margin
            const newScale = Math.max(0.65, Math.min(1, targetScale));
            if (Math.abs(newScale - scaleFactor) > 0.01) {
              setScaleFactor(newScale);
            }
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [data, density, aspectRatio, isAdaptive, cardRef, scaleFactor]);

  const fontSizes = {
    title: density === 2 ? 'text-sm' : density === 1 ? 'text-lg' : 'text-2xl',
    content: density === 2 ? 'text-[7.5px]' : density === 1 ? 'text-[11px]' : 'text-[13px]',
    sectionTitle: 'text-[9px]',
    padding: density === 2 ? 'p-2' : density === 1 ? 'p-6' : 'p-8',
    spacing: density === 2 ? 'space-y-0' : density === 1 ? 'space-y-3' : 'space-y-6',
    gap: density === 2 ? 'gap-0' : density === 1 ? 'gap-3' : 'gap-5'
  };

  const mergeLists = isAdaptive && density >= 2;
  
  return (
    <div 
      ref={cardRef}
      className={`${activeTheme.bg} relative shadow-2xl mx-auto flex flex-col overflow-hidden transition-all duration-300`}
      style={{ 
        ...dimensions,
        fontSize: fontSizes.content.includes('[') ? fontSizes.content.match(/\[(.*?)\]/)?.[1] : '14px'
      }}
    >
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      {/* Save Sticker / Slide Info */}
      <div className={`absolute top-4 right-4 z-10 flex flex-col items-end gap-2 ${density === 2 ? 'scale-50 origin-top-right' : density === 1 ? 'scale-75 origin-top-right' : ''}`}>
        <div className="bg-[#ff2442] text-white text-[10px] px-3 py-1 rounded-full font-bold rotate-6 shadow-lg flex items-center gap-1 border border-white/20">
          <Star size={10} fill="white" /> 干货速存
        </div>
        {slideInfo && slideInfo.total > 1 && !isAdaptive && (
          <div className="bg-black/80 text-white text-[9px] px-2 py-0.5 rounded-md font-black tracking-tighter shadow-md">
            SIDE {slideInfo.current} / {slideInfo.total}
          </div>
        )}
      </div>

      <div 
        ref={contentRef} 
        data-id="content-body"
        className={`h-full flex flex-col relative z-20 ${fontSizes.padding} ${fontSizes.spacing} transition-transform duration-500`}
        style={{ 
          transform: scaleFactor !== 1 ? `scale(${scaleFactor})` : 'none',
          transformOrigin: 'top center'
        }}
      >
        {/* Header Section */}
        {isVisible('header') && (
          <header className={`${density >= 2 ? 'mb-0 scale-[0.8]' : aspectRatio === '1:1' || density >= 1 ? 'mb-1' : 'mb-6'} text-center flex flex-col items-center origin-top transition-transform`}>
            {density < 2 && (
              <div className="inline-block bg-[#ff2442] px-3 py-0.5 mb-1.5 rounded-full shadow-sm">
                <span className="text-white text-[8px] font-black tracking-[0.3em] uppercase">Academic Insight</span>
              </div>
            )}
            <h1 className={`${fontSizes.title} ${isVisible('highlights') ? '' : 'font-bold'} font-academic font-black ${activeTheme.textPrimary} leading-tight px-4 tracking-tight`}>
              {data.catchyTitle || '论文速读笔记'}
            </h1>
            
            <div className={`w-full ${activeTheme.cardBg} border-y border-gray-100 ${density === 2 ? 'py-0 px-2' : density === 1 ? 'py-2 px-4' : 'py-3 px-6'} shadow-sm relative overflow-hidden group mt-0.5`}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff2442]"></div>
              <div className="flex flex-col items-center">
                {density < 1 && (
                  <div className="bg-gray-50 p-1 rounded-full mb-1">
                    <BookOpen size={aspectRatio === '1:1' ? 12 : 14} className={`${activeTheme.accent}`} />
                  </div>
                )}
                <p className={`font-bold ${density === 2 ? 'text-[8px]' : density === 1 ? 'text-[10px]' : 'text-[11px]'} ${activeTheme.textPrimary} text-center max-w-[95%] leading-snug break-words`}>
                  {data.paperTitle || '待输入论文标题'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-[0.5px] w-2 bg-gray-200"></div>
                  <p className={`text-[7px] ${activeTheme.textSecondary} font-medium italic opacity-70`}>
                    {data.authors || '作者'} · {data.source || '期刊'}
                  </p>
                  <div className="h-[0.5px] w-2 bg-gray-200"></div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Value Highlight Box */}
        {isVisible('highlights') && (
          <div className={`bg-white/40 backdrop-blur-md border border-white/60 ${density === 2 ? 'p-1 mb-0 rounded-lg' : density === 1 ? 'p-2.5 mb-3 rounded-2xl' : 'p-5 mb-8 rounded-2xl'} shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] relative`}>
             {density < 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white w-6 h-6 flex items-center justify-center text-sm shadow-md rounded-full border border-gray-50 z-20">✨</div>}
            <p className={`text-[#ff2442] font-black ${density === 2 ? 'text-[7.5px]' : 'text-[11px]'} text-center italic leading-relaxed px-2`}>
              "{data.oneSentenceValue || '一句话总结核心价值...'}"
            </p>
          </div>
        )}

        {/* Content Body */}
        <div className={`flex-1 ${fontSizes.spacing}`}>
          {/* Main Content Sections */}
          {(isVisible('researchQuestion') || isVisible('keyContribution')) && (
            <div className={`grid grid-cols-1 ${fontSizes.gap}`}>
              {isVisible('researchQuestion') && (
                <Section 
                  icon={<Target size={density === 2 ? 8 : 10} />} 
                  title="研究问题" 
                  content={data.researchQuestion} 
                  theme={activeTheme} 
                  density={density}
                />
              )}

              {isVisible('keyContribution') && (
                <Section 
                  icon={<Lightbulb size={density === 2 ? 8 : 10} />} 
                  title="核心贡献" 
                  content={data.keyContribution} 
                  theme={activeTheme} 
                  density={density}
                />
              )}
            </div>
          )}

          {/* Methods & Takeaways Group */}
          {(isVisible('methods_takeaways') || isVisible('methods_only') || isVisible('takeaways_only')) && (
            <>
              {mergeLists ? (
                <div className="bg-white/30 rounded-lg p-1.5 border border-white/40 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`p-0.5 rounded-md ${activeTheme.iconColor} shadow-sm`}>
                      <Workflow size={7} />
                    </span>
                    <h3 className={`font-black text-[7px] uppercase tracking-widest ${activeTheme.textPrimary}`}>核心全景</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ul className="space-y-0">
                      {data.methods.slice(0, 12).map((item, i) => (
                        <li key={i} className={`text-[7px] ${activeTheme.textPrimary} flex gap-0.5 items-start leading-tight`}>
                          <span className="text-[#ff2442] font-black opacity-50">•</span>
                          <span className="opacity-95 break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-0">
                      {data.takeaways.slice(0, 12).map((item, i) => (
                        <li key={i} className={`text-[7px] ${activeTheme.textPrimary} flex gap-0.5 items-start leading-tight`}>
                          <span className="text-[#ff2442] font-black opacity-50">#</span>
                          <span className="opacity-95 break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className={`grid ${isVisible('methods_takeaways') ? 'grid-cols-2' : 'grid-cols-1'} ${fontSizes.gap}`}>
                  {(isVisible('methods_takeaways') || isVisible('methods_only')) && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`p-1 rounded-lg ${activeTheme.iconColor} shadow-sm border border-white/50`}>
                            <Workflow size={ density === 2 ? 8 : 10} />
                          </span>
                          <h3 className={`font-black ${density === 2 ? 'text-[7.5px]' : 'text-[9px]'} uppercase tracking-widest ${activeTheme.textPrimary}`}>
                            核心方法 {listSplits?.methods ? `(${listSplits.methods.start + 1})` : ''}
                          </h3>
                        </div>
                        <ul className="pl-1 space-y-0.5">
                          {getListItems('methods').map((item, i) => (
                            <li key={i} className={`${fontSizes.content} ${activeTheme.textPrimary} flex gap-1 items-start`}>
                              <span className="text-[#ff2442] font-black text-[7.5px] mt-0.5">
                                {listSplits?.methods ? listSplits.methods.start + i + 1 : i + 1}.
                              </span>
                              <span className="opacity-90 break-words leading-tight">{item}</span>
                            </li>
                          ))}
                        </ul>
                    </div>
                  )}
                  
                  {(isVisible('methods_takeaways') || isVisible('takeaways_only')) && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`p-1 rounded-lg ${activeTheme.iconColor} shadow-sm border border-white/50`}>
                            <Bookmark size={ density === 2 ? 8 : 10} />
                          </span>
                          <h3 className={`font-black ${density === 2 ? 'text-[7.5px]' : 'text-[9px]'} uppercase tracking-widest ${activeTheme.textPrimary}`}>
                            核心要点 {listSplits?.takeaways ? `(${listSplits.takeaways.start + 1})` : ''}
                          </h3>
                        </div>
                        <ul className="pl-1 space-y-0.5">
                          {getListItems('takeaways').map((item, i) => (
                            <li key={i} className={`${fontSizes.content} ${activeTheme.textPrimary} flex gap-1 items-start`}>
                              <span className="text-[#ff2442] font-black">•</span>
                              <span className="opacity-90 break-words leading-tight">{item}</span>
                            </li>
                          ))}
                        </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Strengths & Limitations */}
          {isVisible('critique') && (
            <div className={`grid grid-cols-2 ${fontSizes.gap}`}>
              <MiniSection 
                icon={<CheckCircle2 size={density === 2 ? 7 : 10} className="text-green-600" />} 
                title="优势" 
                items={data.strengths} 
                theme={activeTheme}
                density={density}
              />
              <MiniSection 
                icon={<AlertCircle size={density === 2 ? 7 : 10} className="text-amber-600" />} 
                title="局限" 
                items={data.limitations} 
                theme={activeTheme}
                density={density}
              />
            </div>
          )}

          {/* Questions & Connection */}
          {isVisible('questions_connection') && (
            <div className={`grid grid-cols-1 ${density === 2 ? 'gap-0.5' : 'gap-3'}`}>
              {isVisible('questions') && data.questions && (
                <Section 
                  icon={<HelpCircle size={density === 2 ? 7 : 10} />} 
                  title="存疑探讨" 
                  content={data.questions} 
                  theme={activeTheme} 
                  density={density}
                />
              )}

              {isVisible('connection') && data.connection && (
                <Section 
                  icon={<GitBranch size={density === 2 ? 7 : 10} />} 
                  title="研究相关" 
                  content={data.connection} 
                  theme={activeTheme} 
                  density={density}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isVisible('footer') && (
          <footer className={`mt-auto ${density === 2 ? 'pt-0' : 'pt-2'} border-t border-gray-100/30`}>
            {density < 1 && (
              <div className={`flex flex-wrap gap-1 mb-1.5 justify-center`}>
                {data.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="bg-gray-50/50 text-gray-500 text-[8px] px-1.5 py-0.5 rounded-md border border-gray-100 font-medium">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center text-[7px] text-gray-400 opacity-60">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#ff2442] to-[#ff6b6b] flex items-center justify-center text-white font-black text-[5px] shadow-sm">
                  {data.username ? data.username[0].toUpperCase() : 'P'}
                </div>
                <span className={`font-black ${activeTheme.textPrimary} text-[7px]`}>@{data.username || '科研笔记'}</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-50/50 px-1 py-0.5 rounded-md border border-gray-100/50">
                <Link size={4} className="text-[#ff2442]" /> 
                <span className="font-bold text-[5.5px] text-gray-500 uppercase tracking-tighter italic">Zero-Crop Fit</span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode, title: string, content: string, theme: any, density?: number }> = ({ icon, title, content, theme, density }) => (
  <div className={density === 2 ? 'space-y-0' : 'space-y-1'}>
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className={`p-0.5 rounded-lg ${theme.iconColor} shadow-sm border border-white/50`}>{icon}</span>
      <h3 className={`font-black ${density === 2 ? 'text-[7.5px]' : density === 1 ? 'text-[9px]' : 'text-[10px]'} uppercase tracking-tight ${theme.textPrimary}`}>{title}</h3>
    </div>
    <p className={`${density === 2 ? 'text-[8px] pl-5' : density === 1 ? 'text-[10.5px] pl-7' : 'text-[11px] pl-8'} ${theme.textPrimary} leading-snug opacity-90 break-words`}>
      {content || '请输入相关内容...'}
    </p>
  </div>
);

const MiniSection: React.FC<{ icon: React.ReactNode, title: string, items: string[], theme: any, density?: number }> = ({ icon, title, items, theme, density }) => (
  <div className={`${theme.cardBg} ${density === 2 ? 'p-1.5' : density === 1 ? 'p-2.5' : 'p-3'} rounded-xl border border-gray-100 shadow-sm transition-all`}>
    <div className="flex items-center gap-1 mb-1">
      {icon}
      <h4 className={`${density === 2 ? 'text-[7.5px]' : 'text-[9px]'} font-black uppercase tracking-tight ${theme.textPrimary}`}>{title}</h4>
    </div>
    <ul className={density === 2 ? 'space-y-0' : 'space-y-0.5'}>
      {items.map((item, i) => (
        <li key={i} className={`${density === 2 ? 'text-[7.5px]' : 'text-[8.5px]'} ${theme.textPrimary} leading-tight flex gap-1`}>
          <span className="opacity-40">•</span>
          <span className="break-words">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default PreviewCard;
