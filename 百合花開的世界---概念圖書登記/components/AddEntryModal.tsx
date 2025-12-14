import React, { useState, useRef } from 'react';
import { Category, Entry, Rating } from '../types';
import { X, Upload } from 'lucide-react';
import { supabase } from '../supabase';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
// ⚠️ 修改：onAdd 不再接收 Entry 參數，因為它只負責觸發 App.tsx 重新讀取
  onAdd: () => void; // 替換 (entry: Entry)
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
// ... (其他狀態不變)
  const [coverUrl, setCoverUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
// ⭐️ 新增：處理圖片檔案物件和載入狀態
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ⭐️ 新增：儲存檔案物件，待上傳到 Supabase
      setCoverFile(file); 
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

// AddEntryModal.tsx - handleSubmit 函式 (完整替換)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    setLoading(true); // 開始載入

    try {
      let finalCoverUrl = coverUrl;

      // 1. 處理封面圖片上傳到 Supabase Storage
      if (coverFile) {
        // 生成唯一的檔名
        const filePath = `covers/${Date.now()}-${coverFile.name}`;
        
        // 上傳檔案
        const { error: uploadError } = await supabase.storage
          .from('covers') // 替換為您的 Storage Bucket 名稱 (這裡假設為 'covers')
          .upload(filePath, coverFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('圖片上傳失敗:', uploadError);
          throw new Error('圖片上傳失敗');
        }
        
        // 取得公開 URL
        const { data: publicUrlData } = supabase.storage
            .from('covers')
            .getPublicUrl(filePath);

        if (publicUrlData) {
            finalCoverUrl = publicUrlData.publicUrl;
        }
      } else if (!finalCoverUrl) {
        // 如果沒有上傳新圖片且也沒有 coverUrl，則使用預設圖片
        finalCoverUrl = `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200&h=300`;
      }


      // 2. 準備資料庫寫入物件
      const entryData = {
        title,
        author,
        category,
        rating,
        note,
        tags: tags.split(/[,， ]+/).filter(t => t.trim().length > 0),
        coverUrl: finalCoverUrl,
        // created_at 會由 Supabase 自動處理，不需要傳遞 id
      };

      // 3. 寫入 Supabase 資料庫
      const { error: insertError } = await supabase
        .from('items') // 確保表格名稱為 'items'
        .insert([entryData]);

      if (insertError) {
        console.error('資料寫入失敗:', insertError.message);
        throw new Error(insertError.message);
      }

      // 4. 成功後處理
      onAdd(); // 觸發 App.tsx 重新讀取
      
      // Reset form states
      setTitle('');
      setAuthor('');
      setNote('');
      setTags('');
      setCoverUrl('');
      setCoverFile(null);
      
      onClose(); // 關閉 Modal

    } catch (error) {
      console.error('新增收藏失敗', error);
      alert(`新增收藏失敗：${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#fbf7f3] dark:bg-stone-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-stone-200 dark:border-stone-700">
        <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center">
          <h2 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100">新增收藏</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="add-entry-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex gap-6">
                {/* Image Upload - Compact */}
                <div className="flex-shrink-0">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer group relative w-24 h-36 rounded border border-dashed border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 flex flex-col items-center justify-center overflow-hidden transition-colors hover:border-stone-500"
                  >
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={20} className="text-stone-300 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-stone-400">封面</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="flex-1 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">作品名稱</label>
                        <input 
                        type="text" 
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:border-stone-400 outline-none transition-colors font-serif"
                        placeholder="請輸入名稱"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">作者</label>
                        <input 
                        type="text" 
                        required
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:border-stone-400 outline-none transition-colors"
                        placeholder="作者名字"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">分類</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 rounded border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:border-stone-400 outline-none"
                >
                  {Object.values(Category).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">標籤 (用空格或逗號分隔)</label>
                  <input 
                    type="text" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:border-stone-400 outline-none transition-colors"
                    placeholder="校園 唯美..."
                  />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">心中定位</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Rating).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRating(r)}
                    className={`
                      py-1 px-3 text-sm rounded border transition-all
                      ${rating === r 
                        ? 'border-stone-600 bg-stone-600 text-white shadow-sm' 
                        : 'border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }
                    `}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">心得小記</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 rounded border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:border-stone-400 outline-none transition-shadow resize-none h-24 text-sm leading-relaxed"
                placeholder="寫下這部作品帶給您的感受..."
              />
            </div>

          </form>
        </div>

    // AddEntryModal.tsx - JSX 區塊 (約在檔案最底部)

        <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex justify-end gap-3">
          <button 
// ... (取消按鈕不變) ...
            type="submit" 
            form="add-entry-form"
// ⚠️ 修改：新增 disabled 屬性，並修改按鈕內容
            disabled={loading}
            className="px-6 py-2 rounded bg-stone-700 text-white text-sm hover:bg-stone-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
                <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    儲存中...
                </>
            ) : (
                '確認登記'
            )}
          </button>
        </div>
export default AddEntryModal;
