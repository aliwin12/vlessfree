import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Send, RefreshCw, CheckCircle2, Globe, Activity, Terminal, MapPin } from 'lucide-react';
import { db, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp } from '../lib/firebase';

export default function SuggestServerPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    protocol: 'VLESS / REALITY',
    country: '',
    city: '',
    config: '',
    suggestedBy: ''
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
      await addDoc(collection(db, 'server_suggestions'), {
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
      handleFirestoreError(error, OperationType.CREATE, 'server_suggestions');
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
          <h2 className="text-3xl font-serif italic mb-4">Спасибо за вклад!</h2>
          <p className="text-white/40 leading-relaxed text-sm">
            Ваш сервер отправлен на проверку. После одобрения администратором он появится в общем списке.
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
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/20 mt-4">
              Перенаправление на главную...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 max-w-2xl mx-auto min-h-screen">
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
        className="glass rounded-[32px] p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Activity size={120} />
        </div>

        <div className="flex items-center gap-4 mb-10 relative">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-serif italic tracking-tighter">Предложить сервер</h1>
            <p className="text-white/40 text-xs">Помогите сообществу расширить сеть</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                Название сервера
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-amber-500 transition-colors">
                  <Activity size={16} />
                </div>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Напр. Singapore Highspeed"
                  className="w-full bg-white/2 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                Протокол
              </label>
              <select
                value={formData.protocol}
                onChange={e => setFormData({ ...formData, protocol: e.target.value })}
                className="w-full bg-white/2 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer font-medium"
              >
                <option value="VLESS / REALITY" className="bg-[#050505]">VLESS / REALITY</option>
                <option value="Shadowsocks" className="bg-[#050505]">Shadowsocks</option>
                <option value="Trojan" className="bg-[#050505]">Trojan</option>
                <option value="Hysteria2" className="bg-[#050505]">Hysteria2</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                Страна (Код)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-amber-500 transition-colors">
                  <Globe size={16} />
                </div>
                <input
                  required
                  maxLength={2}
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                  placeholder="RU, SG, US, DE..."
                  className="w-full bg-white/2 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all uppercase font-mono font-bold tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                Город
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-amber-500 transition-colors">
                  <MapPin size={16} />
                </div>
                <input
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Напр. Moscow"
                  className="w-full bg-white/2 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
              Ссылка на конфиг / Ссылка
            </label>
            <div className="relative group">
              <div className="absolute top-4 left-4 text-white/20 group-focus-within:text-amber-500 transition-colors">
                <Terminal size={16} />
              </div>
              <textarea
                required
                value={formData.config}
                onChange={e => setFormData({ ...formData, config: e.target.value })}
                placeholder="vless://... или ссылка на файл"
                className="w-full h-32 bg-white/2 border border-white/5 rounded-2xl pt-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all resize-none font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
              Ваш ник / Телеграм (Опционально)
            </label>
            <input
              value={formData.suggestedBy}
              onChange={e => setFormData({ ...formData, suggestedBy: e.target.value })}
              placeholder="@username"
              className="w-full bg-white/2 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] transition-all text-xs ${
                isSubmitting
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]'
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? 'Отправка...' : 'Предложить сервер'}
            </button>
            <p className="mt-4 text-[9px] text-white/20 text-center leading-relaxed italic px-4">
              * Все предложенные сервера проходят премодерацию. Мы оставляем за собой право отклонить сервер без объяснения причин.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
