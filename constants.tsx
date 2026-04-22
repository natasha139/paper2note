
import { ThemeConfig, ThemeType } from './types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  cream: {
    bg: 'bg-[#fffcf0]',
    cardBg: 'bg-white',
    accent: 'text-[#ff2442]',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-500',
    iconColor: 'bg-[#fff0f3] text-[#ff2442]',
  },
  white: {
    bg: 'bg-white',
    cardBg: 'bg-gray-50',
    accent: 'text-[#3b82f6]',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    iconColor: 'bg-blue-50 text-blue-600',
  },
  minimal: {
    bg: 'bg-[#f5f5f5]',
    cardBg: 'bg-white',
    accent: 'text-black',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-500',
    iconColor: 'bg-gray-100 text-gray-800',
  },
  modern: {
    bg: 'bg-[#fafafa]',
    cardBg: 'bg-[#ffffff]',
    accent: 'text-[#ff6b6b]',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-500',
    iconColor: 'bg-orange-50 text-orange-600',
  },
  dark: {
    bg: 'bg-[#1a1a1a]',
    cardBg: 'bg-[#262626]',
    accent: 'text-amber-400',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-400',
    iconColor: 'bg-zinc-800 text-amber-400',
  },
  ocean: {
    bg: 'bg-[#f0f9ff]',
    cardBg: 'bg-white',
    accent: 'text-cyan-600',
    textPrimary: 'text-cyan-900',
    textSecondary: 'text-cyan-700/60',
    iconColor: 'bg-cyan-50 text-cyan-600',
  }
};
