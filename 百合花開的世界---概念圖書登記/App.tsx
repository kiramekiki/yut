import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, Moon, Sun, Search, Plus, Heart, Download, ChevronDown, Check, LayoutGrid, BookOpen, Book, Film, Tv, MoreHorizontal } from 'lucide-react';
import { Category, Entry, RATING_STYLES, CATEGORY_COLORS, Rating } from './types';
import Sidebar from './components/Sidebar';
import AddEntryModal from './components/AddEntryModal';
import { supabase } from './supabase';

const App: React.FC = () => {
 // --- State Management ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('theme') === 'dark' ||
             (!window.localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

// ⭐️ 修正點：只保留一行 entries 且初始值為 []
  const [entries, setEntries] = useState<Entry[]>([]); 
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [selectedRating, setSelectedRating] = useState<Rating | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const ratingDropdownRef = useRef<HTMLDivElement>(null);
// ⭐️ user 和 loading 狀態保留
  const [user, setUser] = useState<any>(null); // 用來儲存登入的使用者資訊
  const [loading, setLoading] = useState(true); // 用來顯示資料讀取中

  // --- Effects ---
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ratingDropdownRef.current && !ratingDropdownRef.current.contains(event.target as Node)) {
        setIsRatingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
// App.tsx - Effects 區塊，在 'Close dropdown when clicking outside' 之後

// Close dropdown when clicking outside
// ... (原來的 useEffect 邏輯) ...
  }, []);


// ⭐️ 新增：處理 Supabase 登入狀態監聽和資料初始化 (這是啟動資料讀取的關鍵！)
  useEffect(() => {
    // 監聽登入狀態：追蹤是否有管理員登入
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 首次讀取資料
    fetchEntries(); 

    // 清理函式 (在元件被移除時停止監聽)
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // 確保依賴陣列為空，只在網頁初始化時執行一次
  // --- Filter Logic ---
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesCategory = selectedCategory === 'ALL' || entry.category === selectedCategory;
      const matchesRating = selectedRating === 'ALL' || entry.rating === selectedRating;
      const matchesSearch = 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.note && entry.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.tags && entry.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      
      return matchesCategory && matchesRating && matchesSearch;
    });
  }, [entries, selectedCategory, selectedRating, searchTerm]);

  // --- Stats Calculation ---
  const stats = useMemo(() => ({
    total: entries.length,
    bible: entries.filter(e => e.rating === Rating.BIBLE).length,
    books: entries.filter(e => e.category === Category.MANGA || e.category === Category.NOVEL).length,
    movies: entries.filter(e => e.category === Category.MOVIE || e.category === Category.ANIMATION).length
  }), [entries]);
// ⭐️ 新增從 Supabase 讀取資料的函式
const fetchEntries = async () => {
  // 1. 設定讀取狀態為 True
  setLoading(true); 
  
  try {
    // 2. 執行 Supabase 查詢指令
    // .from('items')：指定從我們在 Supabase 建立的表格 'items' 讀取資料。
    // .select('*')：指定讀取表格中的所有欄位（title, author, tags 等）。
    // .order(...)：指定按照資料建立時間 (created_at) 倒序排列 (ascending: false)。
    const { data, error } = await supabase
      .from('items') 
      .select('*') 
      .order('created_at', { ascending: false }); 

    // 3. 處理錯誤
    if (error) {
      console.error('讀取資料失敗:', error.message);
      throw error;
    }
    
    // 4. 更新網頁狀態
    // 將 Supabase 讀出的資料 (data) 設定給 entries 狀態，並強制轉換為 Entry 類型。
    setEntries(data as Entry[]);
    
  } catch (error: any) {
    console.error("讀取資料失敗:", error.message);
    // 如果失敗，至少讓 entries 變回空陣列，避免網頁崩潰
    setEntries([]); 
  } finally {
    // 5. 不管成功或失敗，最後都要設定讀取狀態為 False
    setLoading(false);
  }
};
  // --- Handlers ---
const handleAddEntry = () => { // ⚠️ 請將這裡的內容替換
    // ⭐️ 替換後的內容：呼叫 fetchEntries 重新讀取，並關閉 Modal
    fetchEntries(); // 呼叫上面新增的函式，從 Supabase 取得最新資料
    setIsModalOpen(false); // 確保在新增完成後關閉 Modal
  };
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lily_collection.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Uses Lucide icons for "monochrome emoji" look requested
  const categoriesList = [
    { id: 'ALL', label: '全部', icon: LayoutGrid },
    { id: Category.MANGA, label: '漫畫', icon: BookOpen },
    { id: Category.NOVEL, label: '小說', icon: Book },
    { id: Category.MOVIE, label: '電影', icon: Film },
    { id: Category.ANIMATION, label: '動畫', icon: Tv },
    { id: Category.OTHER, label: '其他', icon: MoreHorizontal },
  ];

  // Matches the colorful emojis from the screenshot for the dropdown
  const ratingOptions = [
    { id: 'ALL', label: '所有等級', icon: '' },
    { id: Rating.BIBLE, label: '聖經', icon: '👑' },
    { id: Rating.TOP_TIER, label: '極品', icon: '🌹' },
    { id: Rating.DESTINY, label: '頂級', icon: '✨' },
    { id: Rating.ORDINARY, label: '普通', icon: '☕' },
    { id: Rating.MYSTERIOUS, label: '神秘', icon: '🔮' },
  ];

  const getRatingLabel = (r: Rating | 'ALL') => {
    if (r === 'ALL') return '所有等級';
    const option = ratingOptions.find(o => o.id === r);
    return option ? option.label : r;
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-earth-50 dark:bg-[#191919] transition-colors duration-300 font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center px-6 py-4 z-20">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-earth-600 dark:text-earth-300 hover:bg-earth-200 dark:hover:bg-stone-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-earth-200 dark:hover:bg-stone-800 text-earth-600 dark:text-earth-300 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-12 pb-12 custom-scrollbar">
          
          <div className="max-w-6xl mx-auto w-full">
            
            {/* Title Section */}
            <section className="text-center mb-16 mt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] tracking-widest text-stone-500 dark:text-stone-400 font-bold uppercase mb-6">
                <Heart size={10} className="text-rose-400 fill-rose-400" />
                Notion Library Collection
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-medium text-earth-800 dark:text-earth-100 mb-4 tracking-tight">
                百合圖書與電影
              </h1>
              <p className="text-lg text-earth-500 dark:text-stone-400 italic font-serif mb-8">
                在細膩的情感流動中，尋找靈魂的共鳴
              </p>
              <p className="max-w-2xl mx-auto text-sm leading-7 text-earth-600 dark:text-stone-400">
                這裡是真心靈花園的角落。不需要繁雜的評分系統，我們用「聖經」來膜拜，用「極品」來珍藏，用「神秘」來標記那些難以言喻的電波。記錄下每一次的心動與惆悵。
              </p>
            </section>

            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-earth-50/95 dark:bg-[#191919]/95 backdrop-blur-sm py-4 mb-8 border-b border-earth-200 dark:border-stone-800">
              <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                
                {/* Left Side: Categories & Rating */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  {/* Category Buttons - Monochrome Icons */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar max-w-full">
                    {categoriesList.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button 
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id as Category | 'ALL')}
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors border
                            ${selectedCategory === cat.id 
                              ? 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-earth-800 dark:text-stone-100 shadow-sm font-medium' 
                              : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }
                          `}
                        >
                          <Icon size={16} strokeWidth={selectedCategory === cat.id ? 2 : 1.5} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block h-6 w-px bg-stone-300 dark:bg-stone-700 mx-2"></div>

                  {/* Rating Dropdown - Matches Screenshot */}
                  <div className="relative" ref={ratingDropdownRef}>
                    <button
                      onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-all border
                        ${isRatingDropdownOpen || selectedRating !== 'ALL'
                          ? 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-earth-800 dark:text-stone-100 shadow-sm' 
                          : 'border-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }
                      `}
                    >
                      <span>
                        {getRatingLabel(selectedRating)}
                      </span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isRatingDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isRatingDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-stone-800 rounded-md shadow-xl border border-stone-200 dark:border-stone-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                         {ratingOptions.map((option) => (
                           <button
                             key={option.id}
                             onClick={() => {
                               setSelectedRating(option.id as Rating | 'ALL');
                               setIsRatingDropdownOpen(false);
                             }}
                             className={`
                               w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors
                               ${selectedRating === option.id 
                                 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' 
                                 : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                               }
                             `}
                           >
                             <span className="w-5 text-center text-base">{option.icon}</span>
                             <span className="flex-1 font-medium">{option.label}</span>
                             {selectedRating === option.id && <Check size={14} />}
                           </button>
                         ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Search & Actions */}
                <div className="flex items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
                  <div className="flex-1 xl:w-64 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-600 transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="搜尋作品..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-sm outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors placeholder:text-stone-300"
                    />
                  </div>
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors whitespace-nowrap shadow-sm"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">匯出</span>
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-[#5e5045] dark:bg-stone-700 text-white rounded text-sm hover:bg-[#4a403a] dark:hover:bg-stone-600 transition-colors whitespace-nowrap shadow-sm"
                  >
                    <Plus size={16} />
                    <span>新增</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Content */}
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-stone-400">
                <Search size={32} className="mb-4 opacity-50" />
                <p>沒有找到相關的收藏...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex bg-white dark:bg-[#202020] rounded-lg overflow-hidden border border-stone-100 dark:border-stone-800 shadow-soft hover:shadow-md transition-shadow group h-48"
                  >
                    {/* Left: Image/Icon Area */}
                    <div className="w-32 bg-stone-100 dark:bg-stone-900 flex-shrink-0 relative overflow-hidden">
                       {entry.coverUrl ? (
                          <img src={entry.coverUrl} alt={entry.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <span className="text-2xl font-serif opacity-30">{entry.title[0]}</span>
                          </div>
                       )}
                       {/* Icon Overlay */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-md rounded flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart size={14} fill="currentColor" />
                       </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            {entry.category === Category.MANGA || entry.category === Category.NOVEL ? 'MANGA / NOVEL' : 'ANIME / MOVIE'}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${RATING_STYLES[entry.rating]}`}>
                            {entry.rating}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-1 leading-tight group-hover:text-[#8c7b6d] transition-colors cursor-pointer">
                          {entry.title}
                        </h3>
                        <p className="text-xs text-stone-500 mb-3">by {entry.author}</p>
                        
                        {entry.note && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 italic line-clamp-2 leading-relaxed">
                            "{entry.note}"
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {entry.tags?.map(tag => (
                          <span key={tag} className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Section */}
            <footer className="mt-20 pb-12">
              <div className="bg-[#8c7b6d] dark:bg-stone-800 rounded-xl p-8 md:p-12 text-center text-[#fbf7f3] dark:text-stone-300 relative overflow-hidden shadow-lg">
                <div className="relative z-10 flex flex-col items-center">
                  <h3 className="text-3xl font-serif font-medium mb-4 text-white tracking-wide">今日的百合能量</h3>
                  <p className="text-sm opacity-90 leading-7 max-w-lg mx-auto mb-10 text-stone-100">
                    每一部作品都是一次靈魂的相遇。記得不要只看評，寫下一句話，未來的你會感謝此刻細膩的自己。
                  </p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                     <div className="bg-stone-900/10 rounded-lg p-4 backdrop-blur-sm flex flex-col items-center justify-center h-24 hover:bg-stone-900/20 transition-colors border border-white/5">
                        <span className="text-3xl font-bold text-white mb-1">{stats.total}</span>
                        <span className="text-xs text-stone-100 tracking-wider">總收藏</span>
                     </div>
                     <div className="bg-stone-900/10 rounded-lg p-4 backdrop-blur-sm flex flex-col items-center justify-center h-24 hover:bg-stone-900/20 transition-colors border border-white/5">
                        <span className="text-3xl font-bold text-white mb-1">{stats.bible}</span>
                        <span className="text-xs text-stone-100 tracking-wider">聖經級</span>
                     </div>
                     <div className="bg-stone-900/10 rounded-lg p-4 backdrop-blur-sm flex flex-col items-center justify-center h-24 hover:bg-stone-900/20 transition-colors border border-white/5">
                        <span className="text-3xl font-bold text-white mb-1">{stats.books}</span>
                        <span className="text-xs text-stone-100 tracking-wider">圖書</span>
                     </div>
                     <div className="bg-stone-900/10 rounded-lg p-4 backdrop-blur-sm flex flex-col items-center justify-center h-24 hover:bg-stone-900/20 transition-colors border border-white/5">
                        <span className="text-3xl font-bold text-white mb-1">{stats.movies}</span>
                        <span className="text-xs text-stone-100 tracking-wider">電影</span>
                     </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
              </div>
              
              <div className="text-center mt-8 text-[10px] text-stone-400 uppercase tracking-widest">
                © 2024 Lily Garden Collection
              </div>
            </footer>

          </div>
        </main>
      </div>

      {/* Modal */}
      <AddEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddEntry}
      />
    </div>
  );
};

export default App;
