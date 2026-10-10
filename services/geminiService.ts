import { PaperNoteData } from '../types';

export const polishNoteContent = async (data: PaperNoteData): Promise<Partial<PaperNoteData>> => {
  const response = await fetch('/api/polish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(70000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result.catchyTitle !== 'string' || !Array.isArray(result.takeaways)) {
    throw new Error(result?.error || 'AI 服务暂时不可用，请稍后重试');
  }
  return { catchyTitle: result.catchyTitle, oneSentenceValue: result.oneSentenceValue, takeaways: result.takeaways, tags: result.tags };
};
