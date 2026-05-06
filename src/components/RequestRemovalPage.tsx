import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Trash2, Send, RefreshCw, CheckCircle2, ShieldAlert, Terminal, Hash } from 'lucide-react';
import { db, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp } from '../lib/firebase';

export default function RequestRemovalPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    serverId: '',
    suggestionId: '',
    reason: ''
  });

  const getClientMetadata = async () => {
    const browser = navigator.userAgent;
    let country = 'Unknown';
    let ip = 'Unknown';
    
    const fetchGeo = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error();
        const data = await res.json();
        return {
          ip: data.ip || data.query || data.ipAddress || data.address || null,
          country: data.country_name || data.country || data.countryName || data.country_code || null
        };
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    };

    try {
      let data: any = null;
      const services = [
        'https://ipapi.co/json/',
        'https://freeipapi.com/api/json',
        'https://ipwho.is/',
        'https://api.db-ip.com/v2/free/self'
      ];

      for (const url of services) {
        try {
          data = await fetchGeo(url);
          if (data && data.ip) break;
        } catch (e) {
          continue;
        }
      }
      
      if (!data) {
        const res = await fetch('https://api.ipify.org?format=json');
        const ipData = await res.json();
        data = { ip: ipData.ip, country: 'Unknown' };
      }
      
      if (data) {
        country = data.country || 'Unknown';
        ip = data.ip || 'Unknown';
      }
    } catch (e) {
      console.warn('Metadata fetch failed on all services');
    }
    return { browser, country, ip };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const metadata = await getClientMetadata();
      await addDoc(collection(db, 'server_removals'), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
        userIp: metadata.ip,
        browser: metadata.browser,
        userCountry: metadata.country
      });

      setIsSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'server_removals');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-[40px] p-12 text-center max-w-md w-full border border-emerald-500/20"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-serif italic mb-4">Запрос отправлен</h2>
          <p className="text-white/40 leading-relaxed text-sm">
            Ваш запрос на удаление сервера принят в работу. Администрация проверит данные и удалит сервер, если владение подтвердится.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 max-w-xl mx-auto min-h-screen">
      <motion.button 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">Назад</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] p-8 md:p-12 relative overflow-hidden border border-rose-500/10"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trash2 size={120} />
        </div>

        <div className="flex items-center gap-4 mb-10 relative">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-serif italic tracking-tighter">Удаление сервера</h1>
            <p className="text-white/40 text-xs">Запрос на отзыв вашей конфигурации</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
              Название сервера в списке
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-rose-500 transition-colors">
                <Terminal size={16} />
              </div>
              <input
                required
                value={formData.serverId}
                onChange={e => setFormData({ ...formData, serverId: e.target.value })}
                placeholder="Как он отображается в списке"
                className="w-full bg-white/2 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
              ID заявки (6 цифр)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-rose-500 transition-colors">
                <Hash size={16} />
              </div>
              <input
                required
                maxLength={6}
                value={formData.suggestionId}
                onChange={e => setFormData({ ...formData, suggestionId: e.target.value.replace(/\D/g, '') })}
                placeholder="Напр. 123456"
                className="w-full bg-white/2 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all font-mono font-bold tracking-widest"
              />
            </div>
            <p className="text-[9px] text-white/20 italic ml-1">* Нам это нужно, чтобы подтвердить ваше владение сервером</p>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
              Причина удаления
            </label>
            <textarea
              required
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Почему вы хотите удалить сервер?"
              className="w-full h-32 bg-white/2 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all resize-none"
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] transition-all text-xs ${
                isSubmitting
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.2)] hover:scale-[1.02]'
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? 'Отправка...' : 'Отправить запрос'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
