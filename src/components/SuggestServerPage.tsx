import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Send, RefreshCw, CheckCircle2, Globe, Activity, Terminal, MapPin, AlertTriangle, Shield, Copy, Check } from 'lucide-react';
import { db, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp, doc, getDoc } from '../lib/firebase';

export default function SuggestServerPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    protocol: 'VLESS / REALITY',
    country: '',
    city: '',
    config: '',
    suggestedBy: '',
    expiryDate: ''
  });

  useEffect(() => {
    const fetchHistory = async () => {
      const localHistory = JSON.parse(localStorage.getItem('my_suggestions') || '[]');
      if (localHistory.length === 0) return;

      const updatedHistory = await Promise.all(localHistory.map(async (item: any) => {
        try {
          const docSnap = await getDoc(doc(db, 'server_suggestions', item.id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            return { ...item, status: data.status };
          }
          return item;
        } catch (e) {
          return item;
        }
      }));

      // Update localStorage with fresh statuses
      localStorage.setItem('my_suggestions', JSON.stringify(updatedHistory));
      setHistoryItems(updatedHistory);
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('disclaimer_accepted');
    if (!hasAccepted) {
      setShowDisclaimer(true);
    }
  }, []);

  useEffect(() => {
    if (showDisclaimer && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showDisclaimer, countdown]);

  const handleAccept = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

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

  const generateDisplayId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const copyId = () => {
    navigator.clipboard.writeText(generatedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const displayId = generateDisplayId();
      const metadata = await getClientMetadata();
      const docRef = await addDoc(collection(db, 'server_suggestions'), {
        ...formData,
        displayId,
        status: 'pending',
        createdAt: serverTimestamp(),
        userIp: metadata.ip,
        browser: metadata.browser,
        userCountry: metadata.country
      });

      setGeneratedId(displayId);

      // Save to local history
      const newHistoryItem = {
        id: docRef.id,
        displayId,
        name: formData.name,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      const history = JSON.parse(localStorage.getItem('my_suggestions') || '[]');
      history.push(newHistoryItem);
      localStorage.setItem('my_suggestions', JSON.stringify(history));
      setHistoryItems(history);

      setIsSuccess(true);
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
          <h2 className="text-3xl font-serif italic mb-4">Предложение отправлено!</h2>
          <p className="text-white/40 leading-relaxed text-sm mb-8">
            Ваш сервер отправлен на проверку. Пожалуйста, сохраните этот ID — он понадобится для удаления или отслеживания статуса.
          </p>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-8 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/20 mb-2">ID заявки</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-4xl font-mono font-black tracking-[0.2em] text-amber-500 selection:bg-amber-500 selection:text-black">
                {generatedId}
              </span>
              <button 
                onClick={copyId}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Скопировать"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
            {copied && <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Скопировано!</p>}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform"
            >
              Вернуться на главную
            </button>
            <Link
              to="/remove-server"
              className="block w-full py-4 rounded-xl border border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors"
            >
              Запрос на удаление
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 max-w-2xl mx-auto min-h-screen">
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass max-w-lg w-full rounded-[40px] p-8 md:p-12 relative border border-white/5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <AlertTriangle size={160} />
              </div>

              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-8">
                <Shield className="w-8 h-8 text-amber-500" />
              </div>

              <h2 className="text-3xl font-serif italic mb-6">⚠️ Пожалуйста, прочтите текст внизу</h2>
              
              <div className="space-y-4 mb-10">
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Если обнаружится, что информация о сервере неверна/сервер не рабочий, то, администрация отклонит заявку на добавление сервера.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Название сервера не должно содержать нецензурную лексику, чужие личные данные, и т.д., при нарушении этого правила, будет выдан запрет на заявку на 1 день, затем на 3 дня, 7 дней, 14 д (максимум).
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Администрация может отклонить заявку по своему усмотрению, не объясняя причины.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Администрация может проигнорировать/отклонить заявку, если она уже существует.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Администрация может удалить сервер в любое время, если посчитает это необходимым.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-xs text-white/80 leading-relaxed">
                    Если вы хотите, чтобы ваш сервер был удалён, <Link to="/remove-server" className="text-amber-500 font-bold hover:underline">отправьте запрос на удаление</Link>.
                  </p>
                </div>
              </div>

              <button
                disabled={countdown > 0}
                onClick={handleAccept}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] transition-all text-[10px] ${
                  countdown > 0
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white text-black hover:scale-[1.02]'
                }`}
              >
                {countdown > 0 ? `Подождите ${countdown}с...` : 'Я принимаю условия'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <p className="text-white/40 text-xs text-balance">Добавьте свою конфигурацию в нашу сеть</p>
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
                  <Terminal size={16} />
                </div>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Singapore Highspeed"
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
                  placeholder="SG, US, DE..."
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
                  placeholder="Singapore"
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
              Активен до (Опционально)
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full bg-white/2 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white/60"
            />
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

      {/* Local History Section */}
      <div className="mt-12 space-y-6">
        <h3 className="text-sm font-serif italic text-white/40 ml-1">Ваша история предложений</h3>
        <div className="space-y-3">
          {historyItems.length > 0 ? (
            [...historyItems].reverse().map((item: any) => (
              <div key={item.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-white/5 text-white/40">
                      ID: {item.displayId}
                    </span>
                  </div>
                  <div className="text-[9px] text-white/20 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${
                  item.status === 'pending' ? 'text-amber-500 bg-amber-500/10' :
                  item.status === 'approved' ? 'text-emerald-500 bg-emerald-500/10' :
                  'text-rose-500 bg-rose-500/10'
                }`}>
                  {item.status === 'pending' ? 'Ожидание' : item.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[10px] uppercase tracking-widest text-white/10 font-bold border border-dashed border-white/5 rounded-2xl">
              История пуста
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

