import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../api/supabaseClient';
import type { ChatMessage } from '../types';
import { getMyIdentity, randomizeIdentity } from '../utils/identity';
import { Send, Image as ImageIcon, RefreshCw, X, Download, Paperclip, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const Chat: React.FC = () => {
  const [identity, setIdentity] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'file', name?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setIdentity(getMyIdentity());
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          // If old record has id, remove just that message; otherwise clear all
          if (payload.old && (payload.old as ChatMessage).id) {
            setMessages((prev) => prev.filter((m) => m.id !== (payload.old as ChatMessage).id));
          } else {
            setMessages([]);
          }
        }
      )
      .subscribe();

    // Listen for clear signal dispatched by Settings page
    const handleStorageEvent = (e: StorageEvent | Event) => {
      const key = (e as StorageEvent).key ?? null;
      if (key === 'chat_clear_signal' || key === null) {
        const signal = localStorage.getItem('chat_clear_signal');
        if (signal) {
          setMessages([]);
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleRandomize = () => {
    setIdentity(randomizeIdentity());
  };

  const uploadAndSendFile = async (file: File) => {
    setUploading(true);
    setSelectedFile(null); // clear preview immediately
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat_uploads')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('อัปโหลดไฟล์ไม่สำเร็จ');
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat_uploads')
      .getPublicUrl(filePath);

    const isImage = file.type.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';
    
    const content = isImage 
      ? publicUrlData.publicUrl 
      : JSON.stringify({ url: publicUrlData.publicUrl, name: file.name, size: file.size });

    const { error: dbError } = await supabase.from('chat_messages').insert({
      sender_name: identity,
      message_type: messageType,
      content
    });

    if (dbError) {
      toast.error('ส่งข้อความแนบไฟล์ไม่สำเร็จ');
    }
    setUploading(false);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (selectedFile) {
      await uploadAndSendFile(selectedFile);
    }
    
    if (inputText.trim()) {
      const content = inputText.trim();
      setInputText('');

      const { error } = await supabase.from('chat_messages').insert({
        sender_name: identity,
        message_type: 'text',
        content
      });

      if (error) {
        toast.error('ส่งข้อความไม่สำเร็จ');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    e.target.value = ''; // allow selecting the same file again
  };

  const downloadMedia = async (media: { url: string, name?: string }) => {
    try {
      toast.loading('กำลังดาวน์โหลด...', { id: 'downloading' });
      const response = await fetch(media.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = media.name || `chat-download-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('บันทึกสำเร็จ', { id: 'downloading' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('ไม่สามารถบันทึกได้', { id: 'downloading' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] md:h-[100dvh] w-full max-w-4xl mx-auto bg-slate-900 overflow-hidden relative">
      {/* Chat Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl transform-gpu border-b border-slate-800 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-wide">แชท</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
              คุณคือ: <span className="font-black text-red-500">{identity}</span>
              <button 
                onClick={handleRandomize}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all duration-200 ease-out active:scale-95 ml-2"
                title="สุ่มชื่อใหม่"
              >
                <RefreshCw size={14} />
              </button>
            </p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_name === identity;
          const currDate = new Date(msg.created_at);
          const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null;
          const showDateSeparator = !prevDate || currDate.toDateString() !== prevDate.toDateString();
          const dateStr = `${currDate.getDate()}/${currDate.getMonth() + 1}/${(currDate.getFullYear() + 543).toString().slice(-2)}`;

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex flex-col items-center my-6">
                  <span className="text-xs bg-slate-800/80 text-slate-400 px-3 py-1 rounded-full font-bold">
                    {dateStr}
                  </span>
                </div>
              )}
              <div className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl shadow-md border border-slate-700 shrink-0 self-end">
                    {msg.sender_name.split(' ').pop()} {/* Emoji part */}
                  </div>
                )}
                
                {isMe && (
                  <div className="flex items-end mb-1 shrink-0">
                    <span className="text-xs font-bold text-slate-500">
                      {format(currDate, 'HH.mm')}
                    </span>
                  </div>
                )}

                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                     <p className="text-xs font-bold text-slate-400 mb-1.5 ml-2">{msg.sender_name}</p>
                  )}
                  
                  <div className={`px-5 py-3 shadow-md ${
                    isMe 
                      ? 'bg-gradient-to-br from-red-600 to-red-800 text-white rounded-3xl rounded-tr-sm border border-red-500/20' 
                      : 'bg-slate-800 text-white rounded-3xl rounded-tl-sm border border-slate-700'
                  }`}>
                    {msg.message_type === 'image' ? (
                      <img 
                        src={msg.content} 
                        alt="Upload" 
                        className="rounded-xl max-w-full h-auto object-cover max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => setPreviewMedia({ url: msg.content, type: 'image' })}
                      />
                    ) : msg.message_type === 'file' ? (
                      (() => {
                        try {
                          const fileData = JSON.parse(msg.content);
                          return (
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewMedia({ url: fileData.url, type: 'file', name: fileData.name })}
                            >
                              <div className={`p-2.5 rounded-xl ${isMe ? 'bg-black/20' : 'bg-slate-700'}`}>
                                <FileText size={24} className={isMe ? 'text-white' : 'text-slate-300'} />
                              </div>
                              <div className="flex flex-col overflow-hidden max-w-[150px] md:max-w-[200px]">
                                <span className="text-sm font-bold truncate">{fileData.name}</span>
                                <span className={`text-[11px] font-medium ${isMe ? 'text-red-200' : 'text-slate-400'}`}>
                                  {(fileData.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return <p className="font-medium text-sm">ไฟล์แนบ (ไม่สามารถอ่านข้อมูลได้)</p>;
                        }
                      })()
                    ) : (
                      <p className="break-words whitespace-pre-wrap leading-relaxed text-[15px] font-medium">{msg.content}</p>
                    )}
                  </div>
                </div>

                {!isMe && (
                  <div className="flex items-end mb-1 shrink-0">
                    <span className="text-xs font-bold text-slate-500">
                      {format(currDate, 'HH.mm')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {uploading && (
           <div className="flex justify-end">
              <div className="bg-red-500/50 text-white px-5 py-3 rounded-3xl rounded-tr-none animate-pulse font-bold text-sm">
                กำลังอัปโหลด...
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 md:p-4 pb-safe shrink-0 flex flex-col relative z-20">
        {selectedFile && (
          <div className="mb-3 p-3 bg-slate-800 rounded-2xl border border-slate-700 animate-in slide-in-from-bottom-2 flex items-center justify-between">
            <div className="relative inline-block">
              {selectedFile.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Selected" 
                  className="h-16 w-auto max-w-[120px] object-cover rounded-xl shadow-sm border border-slate-700" 
                />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center bg-slate-700 rounded-xl border border-slate-600 shadow-sm">
                  <FileText size={24} className="text-slate-300" />
                </div>
              )}
              <button 
                type="button"
                onClick={() => setSelectedFile(null)}
                className="absolute -top-2 -right-2 bg-slate-700 text-white hover:text-red-500 hover:bg-slate-600 rounded-full p-1 shadow-md border border-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="text-xs text-slate-400 font-bold px-3 truncate ml-2 flex-1">
              {selectedFile.name}
            </div>
          </div>
        )}
        
        <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <label className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all active:scale-95 cursor-pointer shrink-0">
            <ImageIcon size={22} />
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploading} />
          </label>
          <label className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all active:scale-95 cursor-pointer shrink-0 -ml-2">
            <Paperclip size={22} />
            <input type="file" className="hidden" onChange={handleFileSelect} disabled={uploading} />
          </label>
          <div className="flex-1 bg-slate-800 border border-slate-700 focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/50 rounded-full px-5 py-3 flex items-center shadow-inner transition-all">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={selectedFile ? "พิมพ์ข้อความพร้อมรูปภาพ..." : "พิมพ์ข้อความ..."} 
              className="w-full bg-transparent outline-none text-white placeholder:text-slate-500 font-medium"
            />
          </div>
          <button 
            type="submit" 
            disabled={(!inputText.trim() && !selectedFile) || uploading}
            className="p-3.5 bg-gradient-to-br from-red-600 to-red-800 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0 ml-1"
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transform-gpu p-4"
          >
            <div className="absolute top-0 left-0 right-0 p-4 pb-safe flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
              <button 
                onClick={() => setPreviewMedia(null)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all active:scale-95 shrink-0"
              >
                <X size={24} />
              </button>
              <div className="flex-1 flex justify-center px-4 overflow-hidden">
                 <span className="text-white text-sm font-bold truncate max-w-full drop-shadow-md">
                   {previewMedia.name || ''}
                 </span>
              </div>
              <button 
                onClick={() => downloadMedia(previewMedia)}
                className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0"
              >
                <Download size={20} />
                <span className="text-sm font-bold pr-1 hidden sm:inline">บันทึก</span>
              </button>
            </div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center mt-12"
            >
              {previewMedia.type === 'image' ? (
                <img 
                  src={previewMedia.url} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-slate-700/50"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <iframe 
                  src={previewMedia.url} 
                  className="w-full h-full bg-white rounded-2xl shadow-2xl"
                  title="File Preview"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
