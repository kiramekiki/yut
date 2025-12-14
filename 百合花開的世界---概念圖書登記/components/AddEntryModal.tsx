import React, { useState, useRef } from 'react';
import { Category, Entry, Rating } from '../types';
import { X, Upload } from 'lucide-react';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: Entry) => void;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<Category>(Category.MANGA);
  const [rating, setRating] = useState<Rating>(Rating.ORDINARY);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;

    const newEntry: Entry = {
      id: Date.now().toString(),
      title,
      author,
      category,
      rating,
      note,
      tags: tags.split(/[,， ]+/).filter(t => t.trim().length > 0),
      coverUrl: coverUrl || `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200&h=300`,
      createdAt: Date.now(),
    };

    onAdd(newEntry);
    
    // Reset form
    setTitle('');
    setAuthor('');
    setNote('');
    setTags('');
    setCoverUrl('');
    onClose();
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

        <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            取消
          </button>
          <button 
            type="submit" 
            form="add-entry-form"
            className="px-6 py-2 rounded bg-stone-700 text-white text-sm hover:bg-stone-800 transition-all shadow-md"
          >
            確認登記
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;