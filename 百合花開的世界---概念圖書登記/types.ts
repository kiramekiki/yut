export enum Category {
  MANGA = '漫畫',
  NOVEL = '小說',
  MOVIE = '電影',
  ANIMATION = '動畫',
  OTHER = '其他'
}

export enum Rating {
  BIBLE = '聖經',
  TOP_TIER = '極品',
  STRICT = '嚴格',
  ORDINARY = '普通',
  MYSTERIOUS = '神秘',
  DESTINY = '緣分'
}

export interface Entry {
  id: string;
  title: string;
  author: string;
  category: Category;
  rating: Rating;
  coverUrl: string; // Base64 or URL
  note?: string;
  tags: string[];
  createdAt: number;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.MANGA]: 'text-orange-600 dark:text-orange-400',
  [Category.NOVEL]: 'text-blue-600 dark:text-blue-400',
  [Category.MOVIE]: 'text-purple-600 dark:text-purple-400',
  [Category.ANIMATION]: 'text-pink-600 dark:text-pink-400',
  [Category.OTHER]: 'text-gray-600 dark:text-gray-400',
};

// More subtle, tag-like styles for the screenshot look
export const RATING_STYLES: Record<Rating, string> = {
  [Rating.BIBLE]: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  [Rating.TOP_TIER]: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
  [Rating.STRICT]: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600',
  [Rating.ORDINARY]: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600',
  [Rating.MYSTERIOUS]: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800',
  [Rating.DESTINY]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
};