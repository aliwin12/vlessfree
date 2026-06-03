import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Send, RefreshCw, CheckCircle2, Globe, Activity, 
  Terminal, MapPin, AlertTriangle, Shield, Copy, Check, Lock, 
  Layers, FolderOpen, Calendar, Clock 
} from 'lucide-react';
import { db, auth, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp, doc, getDoc } from '../lib/firebase';

interface SuggestServerPageProps {
  currentUser: any;
  userProfile: any;
}

export default function SuggestServerPage({ currentUser, userProfile }: SuggestServerPageProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  
  // Selection of Post Type: 'vless' or 'subscription'
  const [postType, setPostType] = useState<'vless' | 'subscription'>('vless');

  const [formData, setFormData] = useState({
    name: '',
    subscriptionName: '',
    protocol: 'VLESS / REALITY',
    country: '',
    city: '',
    config: '',
    expiryDate: '',
    isScheduled: false,
    scheduledAt: ''
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

    if (!currentUser) {
      alert('Необходимо авторизоваться для публикации сервера или подписки.');
      return;
    }

    setIsSubmitting(true);
    try {
      const displayId = generateDisplayId();
      const metadata = await getClientMetadata();

      // Set custom fields based on selected platform type
      const isSub = postType === 'subscription';
      const name = isSub ? (formData.subscriptionName.trim() || 'Пользовательская подписка') : formData.name.trim();

      const docRef = await addDoc(collection(db, 'server_suggestions'), {
        name,
        postType,
        protocol: isSub ? 'Subscription' : formData.protocol,
        country: isSub ? 'Global' : (formData.country.trim().toUpperCase() || 'US'),
        city: isSub ? 'All' : (formData.city.trim() || 'Internet'),
        config: formData.config.trim(),
        expiryDate: formData.expiryDate || '01.01.2027',
        scheduledAt: formData.isScheduled && formData.scheduledAt ? formData.scheduledAt : null,
        displayId,
        status: 'pending',
        createdAt: serverTimestamp(),
        userIp: metadata.ip,
        browser: metadata.browser,
        userCountry: metadata.country,
        userId: currentUser.uid,
        username: userProfile?.username || 'anonymous',
        displayName: userProfile?.displayName || 'Пользователь',
        avatarUrl: userProfile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.username || 'anon'}`
      });

      setGeneratedId(displayId);

      // Save to local history
      const newHistoryItem = {
        id: docRef.id,
        displayId,
        name,
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

  // Safe checks for user registration completeness (require a username to bind)
  if (!currentUser) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto min-h-screen flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[32px] p-8 text-center border border-white/5 shadow-2xl"
        >
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-serif italic mb-4">Вход в систему</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
            Чтобы опубликовать ключ или подписку от своего имени, вам необходимо войти в аккаунт.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] transition-transform"
          >
            Войти в Личный Кабинет
          </button>
        </motion.div>
      </div>
    );
  }

  if (!userProfile?.username) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto min-h-screen flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[32px] p-8 text-center border border-white/5 shadow-2xl"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-serif italic mb-4">Не заполнено имя пользователя</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed animate-pulse">
            Завершите заполнение личного профиля, чтобы делиться вашими конфигурациями с сообществом.
          </p>
          <button 
            onClick={() => navigate(`/user/profile`)}
            className="w-full py-4 bg-amber-500 text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] transition-transform"
          >
            Перейти к Профилю
          </button>
        </motion.div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-serif italic mb-4">Пост на премодерации!</h2>
          <p className="text-white/40 leading-relaxed text-sm mb-8">
            Ваш сервер/подписка отправлены администрации на проверку. Пожалуйста, запишите или сохраните ID заявки ниже.
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

              <h2 className="text-3xl font-serif italic mb-6">⚠️ Правила публикации</h2>
              
              <div className="space-y-4 mb-10">
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Если обнаружится, что добавленный сервер или ссылка на подписку не функционируют, администрация отклонит публикацию.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Придумайте приличное название подписке или серверу. Посты с нецензурной лексикой во избежание блокировок профиля отклоняются немедленно.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Все посты и папки подписок привязываются к вашей публичной странице автора <span className="text-indigo-400">@{userProfile.username}</span>.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Администрация оставляет за собой право модерировать, изменять или удалять предлагаемый контент по своему усмотрению.
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
                {countdown > 0 ? `Подождите ${countdown}с...` : 'Ознакомился и согласен'}
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

        <div className="flex items-center gap-4 mb-8 relative">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif italic tracking-tighter">Опубликовать сервер / пост</h1>
            <p className="text-white/40 text-xs">Добавьте собственный ключ VLESS или общую папку-подписку</p>
          </div>
        </div>

        {/* Post Type Selector Tabs */}
        <div className="flex p-1 rounded-2xl bg-white/[0.03] border border-white/5 mb-8">
          <button
            type="button"
            onClick={() => setPostType('vless')}
            className={`flex-1 py-3.5 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
              postType === 'vless'
                ? 'bg-white text-black shadow-lg font-black'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Ключ VLESS (vless://)
          </button>
          <button
            type="button"
            onClick={() => setPostType('subscription')}
            className={`flex-1 py-3.5 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
              postType === 'subscription'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-black'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            Подписка-Папка (Ссылка)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          
          {postType === 'vless' ? (
            <>
              {/* VLESS Section Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                    Название сервера
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                      <Terminal size={16} />
                    </div>
                    <input
                      required={postType === 'vless'}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Singapore Neon"
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
                    Страна (Двухзначный Код)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                      <Globe size={16} />
                    </div>
                    <input
                      required={postType === 'vless'}
                      maxLength={2}
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                      placeholder="SG, US, NL, PL..."
                      className="w-full bg-white/2 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all uppercase font-mono font-bold tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                    Город
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                      <MapPin size={16} />
                    </div>
                    <input
                      required={postType === 'vless'}
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
                  Конфигурация (vless://...)
                </label>
                <div className="relative group">
                  <div className="absolute top-4 left-4 text-white/20 group-focus-within:text-indigo-400 transition-colors">
                    <Terminal size={16} />
                  </div>
                  <textarea
                    required={postType === 'vless'}
                    value={formData.config}
                    onChange={e => setFormData({ ...formData, config: e.target.value })}
                    placeholder="vless://e881cba1-df5a-4632-a5e2-e1927acc8831@192.168.1.1:443?security=reality..."
                    className="w-full h-32 bg-white/2 border border-white/5 rounded-2xl pt-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all resize-none font-mono text-[11px]"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Subscription Fields Section */}
              <div className="space-y-4 animate-fadeIn">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                  Название папки / подписки
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-emerald-500 transition-colors">
                    <FolderOpen size={16} />
                  </div>
                  <input
                    required={postType === 'subscription'}
                    value={formData.subscriptionName}
                    onChange={e => setFormData({ ...formData, subscriptionName: e.target.value })}
                    placeholder="Супер-быстрое прокси для всех"
                    className="w-full bg-white/2 border border-emerald-500/10 focus:border-emerald-500/30 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none transition-all font-semibold"
                  />
                </div>
                <p className="text-[9px] text-white/20 ml-2">
                  ℹ️ Подписка будет автоматически добавлена на главную как папка (без надобности ввода паролей).
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                  Ссылка на файл подписки (URL)
                </label>
                <div className="relative group">
                  <div className="absolute top-4 left-4 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                    <Globe size={16} />
                  </div>
                  <textarea
                    required={postType === 'subscription'}
                    value={formData.config}
                    onChange={e => setFormData({ ...formData, config: e.target.value })}
                    placeholder="https://myvpnprofile.com/sub/all.txt"
                    className="w-full h-24 bg-white/2 border border-emerald-500/10 focus:border-emerald-500/30 rounded-2xl pt-4 pl-12 pr-4 text-sm focus:outline-none transition-all font-mono text-[11px]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Active Date expiry */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                Активен до
              </label>
              <input
                required
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full bg-white/2 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white/60"
              />
            </div>

            {/* Scheduled publication (запланированное опубликование) */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1 flex justify-between items-center">
                <span>Отложенный старт</span>
                <span className="text-[8px] text-[#ffdd67] lowercase">(опционально)</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.04]">
                  <input 
                    type="checkbox"
                    checked={formData.isScheduled}
                    onChange={e => setFormData({ ...formData, isScheduled: e.target.checked })}
                    className="accent-indigo-500 w-4 h-4"
                  />
                  <span className="text-xs text-white/60 font-medium">Запланировать публикацию?</span>
                </label>

                {formData.isScheduled && (
                  <div className="relative animate-slideDown">
                    <input 
                      required={formData.isScheduled}
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                      className="w-full bg-white/2 border border-indigo-500/20 focus:border-indigo-500/40 rounded-2xl p-4 text-xs font-mono text-white/80 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] transition-all text-xs ${
                isSubmitting
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : postType === 'subscription' 
                ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                : 'bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]'
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? 'Отправка...' : postType === 'subscription' ? 'Опубликовать папку-подписку' : 'Опубликовать ключ VLESS'}
            </button>
            <p className="mt-4 text-[9px] text-white/20 text-center leading-relaxed italic px-4">
              * Все добавленные публикации проходят премодерацию у администрации перед появлением на главной.
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
