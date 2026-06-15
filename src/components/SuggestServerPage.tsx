import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Send, RefreshCw, CheckCircle2, Globe, Activity, 
  Terminal, MapPin, AlertTriangle, Shield, Copy, Check, Lock, 
  Layers, FolderOpen, Calendar, Clock, Zap, Flame, Sparkles, Heart, Server, CheckSquare, Settings2, Info, EyeOff, Sliders
} from 'lucide-react';
import { db, auth, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp, doc, getDoc } from '../lib/firebase';

interface SuggestServerPageProps {
  currentUser: any;
  userProfile: any;
}

interface ParsedConfig {
  name: string;
  protocol: string;
  country: string;
  city: string;
  port: string;
  host: string;
  isValid: boolean;
}

export default function SuggestServerPage({ currentUser, userProfile }: SuggestServerPageProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(1);
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
    expiryDate: '', // HTML input date (YYYY-MM-DD)
    isScheduled: false,
    scheduledAt: '',
    notes: '',
    category: 'Общий обход block 🌐',
    customIcon: 'Globe',
    isPrivate: false,
    hideAuthor: false,
    speedLimit: 'Без лимита',
    allowedClients: [] as string[]
  });

  // Dynamic config extraction details
  const [parsedInfo, setParsedInfo] = useState<ParsedConfig | null>(null);

  // Live subscription verification status
  const [subVerifying, setSubVerifying] = useState(false);
  const [subVerifyResult, setSubVerifyResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);

  // Set initial default date (30 days from now)
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    const yyyy = defaultDate.getFullYear();
    const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(defaultDate.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, expiryDate: `${yyyy}-${mm}-${dd}` }));
  }, []);

  // Sync list of suggested servers
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

  // Display rules modal on first load if not accepted yet
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

  // Real-time automatic config parser
  const handleConfigChange = (text: string) => {
    setFormData(prev => ({ ...prev, config: text }));
    const trimmed = text.trim();
    if (!trimmed) {
      setParsedInfo(null);
      return;
    }

    try {
      const uriPrefixes = ['vless://', 'vmess://', 'ss://', 'trojan://', 'hysteria2://', 'hysteria://'];
      const matchedPrefix = uriPrefixes.find(p => trimmed.toLowerCase().startsWith(p));
      
      if (matchedPrefix) {
        let protocol = 'VLESS / REALITY';
        if (trimmed.startsWith('ss://')) protocol = 'Shadowsocks';
        if (trimmed.startsWith('trojan://')) protocol = 'Trojan';
        if (trimmed.startsWith('hysteria://') || trimmed.startsWith('hysteria2://')) protocol = 'Hysteria2';

        let name = '';
        let country = '';
        let city = '';
        let host = 'Auto';
        let port = 'Auto';

        // Try parsing hash remarks
        const hashIdx = trimmed.indexOf('#');
        if (hashIdx !== -1) {
          try {
            name = decodeURIComponent(trimmed.slice(hashIdx + 1));
          } catch (e) {
            name = trimmed.slice(hashIdx + 1);
          }
        }

        // Try parsing host / port
        // Standard shape: prefix://token[at]host:port?params
        const corePart = hashIdx !== -1 ? trimmed.slice(0, hashIdx) : trimmed;
        const mainPart = corePart.substring(matchedPrefix.length);
        const atIdx = mainPart.indexOf('@');
        let socketStr = atIdx !== -1 ? mainPart.substring(atIdx + 1) : mainPart;
        
        // Remove trailing query params
        const queryIdx = socketStr.indexOf('?');
        if (queryIdx !== -1) {
          socketStr = socketStr.substring(0, queryIdx);
        }

        const colonIdx = socketStr.lastIndexOf(':');
        if (colonIdx !== -1) {
          host = socketStr.substring(0, colonIdx);
          port = socketStr.substring(colonIdx + 1);
        }

        if (name) {
          // Preset Map for Automatic Location Flags & Codes guessing
          const locationMap: { [key: string]: { code: string; city: string } } = {
            'singapore': { code: 'SG', city: 'Singapore' },
            'сингапур': { code: 'SG', city: 'Singapore' },
            'sg': { code: 'SG', city: 'Singapore' },
            '🇸🇬': { code: 'SG', city: 'Singapore' },
            'usa': { code: 'US', city: 'New York' },
            'сша': { code: 'US', city: 'New York' },
            '🇺🇸': { code: 'US', city: 'New York' },
            'nl': { code: 'NL', city: 'Amsterdam' },
            'нидерланды': { code: 'NL', city: 'Amsterdam' },
            '🇳🇱': { code: 'NL', city: 'Amsterdam' },
            'pl': { code: 'PL', city: 'Warsaw' },
            'польша': { code: 'PL', city: 'Warsaw' },
            '🇵🇱': { code: 'PL', city: 'Warsaw' },
            'de': { code: 'DE', city: 'Frankfurt' },
            'германия': { code: 'DE', city: 'Frankfurt' },
            '🇩🇪': { code: 'DE', city: 'Frankfurt' },
            'fi': { code: 'FI', city: 'Helsinki' },
            'финляндия': { code: 'FI', city: 'Helsinki' },
            '🇫🇮': { code: 'FI', city: 'Helsinki' },
            'gb': { code: 'GB', city: 'London' },
            'london': { code: 'GB', city: 'London' },
            '🇬🇧': { code: 'GB', city: 'London' },
            'fr': { code: 'FR', city: 'Paris' },
            'франция': { code: 'FR', city: 'Paris' },
            '🇫🇷': { code: 'FR', city: 'Paris' },
            'tr': { code: 'TR', city: 'Istanbul' },
            'турция': { code: 'TR', city: 'Istanbul' },
            '🇹🇷': { code: 'TR', city: 'Istanbul' },
            'jp': { code: 'JP', city: 'Tokyo' },
            'tokyo': { code: 'JP', city: 'Tokyo' },
            '🇯🇵': { code: 'JP', city: 'Tokyo' },
            'ru': { code: 'RU', city: 'Moscow' },
            'россия': { code: 'RU', city: 'Moscow' },
            '🇷🇺': { code: 'RU', city: 'Moscow' }
          };

          const lowerName = name.toLowerCase();
          for (const [kw, loc] of Object.entries(locationMap)) {
            if (lowerName.includes(kw)) {
              country = loc.code;
              city = loc.city;
              break;
            }
          }
        }

        const info = { name, protocol, country, city, host, port, isValid: true };
        setParsedInfo(info);

        // Pre-populate fields automatically so user has to type less
        setFormData(prev => ({
          ...prev,
          name: prev.name || name,
          protocol,
          country: prev.country || country,
          city: prev.city || city
        }));
      } else {
        setParsedInfo({
          name: '',
          protocol: 'VLESS / REALITY',
          country: '',
          city: '',
          host: 'Unknown',
          port: 'Unknown',
          isValid: false
        });
      }
    } catch (err) {
      setParsedInfo({
        name: '',
        protocol: 'VLESS / REALITY',
        country: '',
        city: '',
        host: 'Unknown',
        port: 'Unknown',
        isValid: false
      });
    }
  };

  // Perform a live verification of subscription content before allowing publish
  const handleVerifySubscription = async () => {
    if (!formData.config || !formData.config.startsWith('http')) {
      alert('Пожалуйста, введите корректный URL-адрес подписки.');
      return;
    }

    setSubVerifying(true);
    setSubVerifyResult(null);

    try {
      const res = await fetch(`/api/fetch-subscription?url=${encodeURIComponent(formData.config.trim())}`);
      if (!res.ok) throw new Error(`HTTP Error Code: ${res.status}`);
      const data = await res.json();
      
      const content = data.content || '';
      let text = content;
      const cleaned = content.trim().replace(/[\s\n\r]/g, '');
      const hasProto = cleaned.includes('://');
      
      let isBase64 = false;
      if (!hasProto && cleaned.length > 10) {
        if (/^[a-zA-Z0-9+/=\-_]+$/.test(cleaned)) {
          isBase64 = true;
        }
      }

      if (isBase64) {
        try {
          let stdB64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
          while (stdB64.length % 4 !== 0) stdB64 += '=';
          text = atob(stdB64);
        } catch (e) {
          console.warn('Decode base64 fail');
        }
      }

      const protos = ['vless://', 'vmess://', 'ss://', 'ssr://', 'trojan://', 'hysteria://', 'hysteria2://', 'tuic://'];
      const configsFound = text.split(/[\r\n]+/)
        .map((line: string) => line.trim())
        .filter((line: string) => protos.some(proto => line.startsWith(proto)));

      setSubVerifyResult({
        success: true,
        count: configsFound.length
      });
    } catch (err) {
      setSubVerifyResult({
        success: false,
        count: 0,
        error: 'Не удалось проверить подписку. Убедитесь в активности URL-адреса.'
      });
    } finally {
      setSubVerifying(false);
    }
  };

  // Preset Date calculations
  const applyPresetDate = (days: number) => {
    const updated = new Date();
    updated.setDate(updated.getDate() + days);
    const yyyy = updated.getFullYear();
    const mm = String(updated.getMonth() + 1).padStart(2, '0');
    const dd = String(updated.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, expiryDate: `${yyyy}-${mm}-${dd}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentUser) {
      alert('Необходимо авторизоваться для публикации сервера или подписки.');
      return;
    }

    // Convert date string from standard HTML format (YYYY-MM-DD) to app format (DD.MM.YYYY)
    let formattedExpiry = '01.01.2027';
    if (formData.expiryDate) {
      const parts = formData.expiryDate.split('-');
      if (parts.length === 3) {
        formattedExpiry = `${parts[2]}.${parts[1]}.${parts[0]}`; // DD.MM.YYYY
      } else {
        formattedExpiry = formData.expiryDate;
      }
    }

    setIsSubmitting(true);
    try {
      const displayId = generateDisplayId();
      const metadata = await getClientMetadata();

      const isSub = postType === 'subscription';
      const name = isSub ? (formData.subscriptionName.trim() || 'Пользовательская подписка') : formData.name.trim();

      const advancedFields = {
        notes: formData.notes.trim() || '',
        category: formData.category || 'Общий обход block 🌐',
        customIcon: formData.customIcon || (isSub ? 'Folder' : 'Globe'),
        isPrivate: !!formData.isPrivate,
        hideAuthor: !!formData.hideAuthor,
        speedLimit: formData.speedLimit || 'Без лимита',
        allowedClients: formData.allowedClients || []
      };

      // Write directly to standard servers (live immediately)
      const liveServer = await addDoc(collection(db, 'servers'), {
        name,
        protocol: isSub ? 'Subscription' : formData.protocol,
        country: isSub ? 'Global' : (formData.country.trim().toUpperCase() || 'US'),
        city: isSub ? 'All' : (formData.city.trim() || 'Internet'),
        config: formData.config.trim(),
        latency: '30ms',
        load: 10,
        status: 'online',
        expiryDate: formattedExpiry,
        isUserPost: true,
        userId: currentUser.uid,
        username: userProfile?.username || 'anonymous',
        displayName: userProfile?.displayName || 'Пользователь',
        avatarUrl: userProfile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.username || 'anon'}`,
        postType,
        scheduledAt: formData.isScheduled && formData.scheduledAt ? formData.scheduledAt : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...advancedFields
      });

      // Write to suggestion log for user history support with 'approved' status
      const docRef = await addDoc(collection(db, 'server_suggestions'), {
        name,
        postType,
        protocol: isSub ? 'Subscription' : formData.protocol,
        country: isSub ? 'Global' : (formData.country.trim().toUpperCase() || 'US'),
        city: isSub ? 'All' : (formData.city.trim() || 'Internet'),
        config: formData.config.trim(),
        expiryDate: formattedExpiry,
        scheduledAt: formData.isScheduled && formData.scheduledAt ? formData.scheduledAt : null,
        displayId,
        status: 'approved',
        createdAt: serverTimestamp(),
        userIp: metadata.ip,
        browser: metadata.browser,
        userCountry: metadata.country,
        userId: currentUser.uid,
        username: userProfile?.username || 'anonymous',
        displayName: userProfile?.displayName || 'Пользователь',
        avatarUrl: userProfile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile?.username || 'anon'}`,
        serverId: liveServer.id,
        ...advancedFields
      });

      setGeneratedId(displayId);

      // Save to local history as approved
      const newHistoryItem = {
        id: docRef.id,
        displayId,
        name,
        createdAt: new Date().toISOString(),
        status: 'approved'
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

  // Guards check
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
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-serif italic mb-4">Не заполнено имя пользователя</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">
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

  if (userProfile?.isPublishBanned) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-md mx-auto min-h-screen flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[32px] p-8 text-center border border-rose-500/20 shadow-2xl"
        >
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold mb-4 text-white">Публикация ограничена</h2>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            Вы лишены права публикации серверов и папок-подписок по решению администрации сайта.
          </p>
          <div className="text-xs text-rose-500/80 font-semibold uppercase tracking-wider py-2 px-3 bg-rose-500/5 rounded-xl inline-block">
            🚫 ОГРАНИЧЕНИЕ АКТИВНО
          </div>
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
          <h2 className="text-3xl font-serif italic mb-4">Успешно опубликовано!</h2>
          <p className="text-white/40 leading-relaxed text-sm mb-8">
            Ваш сервер/подписка успешно добавлены и уже доступны на главной странице! Запишите или сохраните ID публикации ниже на случай, если захотите её удалить.
          </p>

          <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-8 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/20 mb-2">ID публикации</p>
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

  // Multi-step logic validations
  const handleNextStep = () => {
    if (activeStep === 1) {
      if (!formData.config.trim()) {
        alert('Пожалуйста, введите конфигурацию ключа или ссылку подписки!');
        return;
      }
      if (postType === 'subscription' && !formData.config.trim().startsWith('http')) {
        alert('Адрес подписки должен начинаться с http:// или https://');
        return;
      }
    }
    if (activeStep === 2) {
      const isSub = postType === 'subscription';
      if (isSub && !formData.subscriptionName.trim()) {
        alert('Введите название папки-подписки.');
        return;
      }
      if (!isSub && !formData.name.trim()) {
        alert('Введите название сервера.');
        return;
      }
      if (!isSub && !formData.country.trim()) {
        alert('Укажите двухзначный код страны.');
        return;
      }
    }
    setActiveStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto min-h-screen">
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
                    Нерабочие серверы или недейстрительные ссылки на подписки удаляются администрацией при регулярных проверках или по жалобам пользователей.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Придумывайте приличные названия. Посты с нецензурной лексикой или рекламой удаляются сразу, а ваш аккаунт блокируется навсегда.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Все публикуемые конфигурации привязываются к вашему публичному профилю <span className="text-indigo-400">@{userProfile.username}</span>.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-white/60 leading-relaxed">
                    Администрация оставляет за собой право модерировать, менять или удалять контент по своему усмотрению.
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

      {/* Main Publishing Wizard Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] p-8 md:p-12 relative overflow-hidden border border-white/5"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Activity size={120} />
        </div>

        {/* Wizard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif italic tracking-tighter">Мастер публикации VLESS</h1>
              <p className="text-white/40 text-xs">Разместите свой собственный рабочий сервер или ссылку-подписку</p>
            </div>
          </div>
          
          {/* Post Type Selector Tabs */}
          <div className="flex p-1 rounded-2xl bg-white/[0.03] border border-white/5 md:w-80">
            <button
              type="button"
              onClick={() => {
                setPostType('vless');
                setFormData(p => ({ ...p, config: '' }));
                setParsedInfo(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-all ${
                postType === 'vless'
                  ? 'bg-white text-black shadow-lg font-black'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Ключ
            </button>
            <button
              type="button"
              onClick={() => {
                setPostType('subscription');
                setFormData(p => ({ ...p, config: '' }));
                setSubVerifyResult(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-all ${
                postType === 'subscription'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-black'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Подписка
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mb-10 relative z-10">
          {[
            { nr: 1, text: 'Конфиг' },
            { nr: 2, text: 'Локация' },
            { nr: 3, text: 'Лимиты' },
            { nr: 4, text: 'Видимость' }
          ].map((s) => (
            <div key={s.nr} className="flex flex-col gap-2">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                activeStep >= s.nr 
                  ? postType === 'subscription' ? 'bg-emerald-500' : 'bg-indigo-500' 
                  : 'bg-white/5'
              }`} />
              <span className={`text-[9px] uppercase font-bold tracking-widest text-center ${
                activeStep === s.nr ? 'text-white' : 'text-white/20'
              }`}>
                {s.nr}. {s.text}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamic Form Content wrapper */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: CONFIGURATION / SUBLINK INPUT */}
            {activeStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                      {postType === 'vless' ? 'Вставьте ключ (vless://, trojan://, Shadowsocks)' : 'Вставьте ссылку на подписку (URL)'}
                    </label>
                    <span className="text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded font-mono">
                      {postType === 'vless' ? 'auto-parse enabled' : 'remote verify enabled'}
                    </span>
                  </div>

                  <div className="relative group">
                    <div className="absolute top-4 left-4 text-white/20 group-focus-within:text-indigo-400 transition-colors">
                      {postType === 'vless' ? <Terminal size={18} /> : <FolderOpen size={18} />}
                    </div>
                    
                    {postType === 'vless' ? (
                      <textarea
                        required
                        value={formData.config}
                        onChange={e => handleConfigChange(e.target.value)}
                        placeholder="vless://e881cba1-df5a-4632-a5e2-e1927acc8831@192.168.1.1:443?security=reality&sni=google.com#Singapore-Server"
                        className="w-full h-36 bg-white/[0.02] border border-white/5 rounded-2xl pt-4 pl-12 pr-4 text-xs focus:outline-none focus:border-white/20 transition-all resize-none font-mono text-white/80"
                      />
                    ) : (
                      <textarea
                        required
                        value={formData.config}
                        onChange={e => setFormData({ ...formData, config: e.target.value })}
                        placeholder="https://raw.githubusercontent.com/user/sub/main/vless.txt"
                        className="w-full h-24 bg-white/[0.02] border border-emerald-500/10 rounded-2xl pt-4 pl-12 pr-4 text-xs focus:outline-none focus:border-emerald-500/20 transition-all font-mono text-white/80"
                      />
                    )}
                  </div>
                </div>

                {/* Intelligent Parsed Info Cards */}
                {postType === 'vless' && parsedInfo && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl border bg-white/[0.02] border-white/5"
                  >
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Анализ конфигурации
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-white/20 text-[9px] uppercase tracking-wider">Протокол</div>
                        <div className="font-semibold text-white mt-0.5">{parsedInfo.protocol}</div>
                      </div>
                      <div>
                        <div className="text-white/20 text-[9px] uppercase tracking-wider">Хост</div>
                        <div className="font-mono text-white/60 mt-0.5 truncate" title={parsedInfo.host}>{parsedInfo.host}</div>
                      </div>
                      <div>
                        <div className="text-white/20 text-[9px] uppercase tracking-wider">Порт</div>
                        <div className="font-mono text-white mt-0.5">{parsedInfo.port}</div>
                      </div>
                      <div>
                        <div className="text-white/20 text-[9px] uppercase tracking-wider">Имя в ссылке</div>
                        <div className="font-bold text-amber-500 mt-0.5 truncate" title={parsedInfo.name}>{parsedInfo.name || 'Не указано'}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Live Subscription verify box */}
                {postType === 'subscription' && formData.config && (
                  <div className="p-4 rounded-2xl border bg-emerald-500/2 border-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> Тестирование папки-подписки
                      </div>
                      <p className="text-[11px] text-white/40 leading-relaxed">
                        Рекомендуется проверить ссылку на наличие валидных ключей перед публикацией в базу.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      disabled={subVerifying}
                      onClick={handleVerifySubscription}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-bold uppercase tracking-wider text-[9px] text-white rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {subVerifying ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Проверить'}
                    </button>
                  </div>
                )}

                {/* Sub verifying results */}
                {postType === 'subscription' && subVerifyResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
                      subVerifyResult.success 
                        ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/15' 
                        : 'bg-rose-500/5 text-rose-400 border-rose-500/15'
                    }`}
                  >
                    {subVerifyResult.success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                          <span>Проверка успешно завершена! Найдено <strong>{subVerifyResult.count}</strong> активных конфигураций протоколов внутри файла. Ссылка готова к размещению.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                        <div>{subVerifyResult.error}</div>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: DETAILS (NAME, COUNTRY, CITY) */}
            {activeStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                      {postType === 'vless' ? 'Название сервера' : 'Название папки / подписки'}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                        <Terminal size={16} />
                      </div>
                      <input
                        required
                        value={postType === 'vless' ? formData.name : formData.subscriptionName}
                        onChange={e => {
                          if (postType === 'vless') {
                            setFormData({ ...formData, name: e.target.value });
                          } else {
                            setFormData({ ...formData, subscriptionName: e.target.value });
                          }
                        }}
                        placeholder={postType === 'vless' ? 'Singapore High-Speed' : 'Премиум подписка Bypass'}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Protocol (only for Vless) */}
                  {postType === 'vless' ? (
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                        Протокол применения
                      </label>
                      <select
                        value={formData.protocol}
                        onChange={e => setFormData({ ...formData, protocol: e.target.value })}
                        className="w-full bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white appearance-none cursor-pointer font-medium"
                      >
                        <option value="VLESS / REALITY">VLESS / REALITY</option>
                        <option value="Shadowsocks">Shadowsocks</option>
                        <option value="Trojan">Trojan</option>
                        <option value="Hysteria2">Hysteria2</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                        Тип контента
                      </label>
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" /> Subscription Folder URL
                      </div>
                    </div>
                  )}
                </div>

                {postType === 'vless' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Country code */}
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                        Двухзначный код страны (ISO)
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                          <Globe size={16} />
                        </div>
                        <input
                          required
                          maxLength={2}
                          value={formData.country}
                          onChange={e => setFormData({ ...formData, country: e.target.value.toUpperCase().trim() })}
                          placeholder="SG, US, NL, PL, DE..."
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white uppercase font-mono font-bold tracking-widest"
                        />
                      </div>
                      <p className="text-[9px] text-white/20 ml-2">например: NL для Нидерландов, SG для Сингапура.</p>
                    </div>

                    {/* City name */}
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                        Город расположения
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-indigo-400 transition-colors">
                          <MapPin size={16} />
                        </div>
                        <input
                          required
                          value={formData.city}
                          onChange={e => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Amsterdam, Singapore..."
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: LIMITS, CATEGORIES & PRESETS */}
            {activeStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Expiry Pill Presets & Calendar Picker */}
                <div className="space-y-3 bg-white/[0.01] border border-white/5 p-6 rounded-3xl">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888]">Срок действия ключа/подписки</label>
                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> auto-inactive system active
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { l: '7 Дней', v: 7 },
                      { l: '30 Дней', v: 30 },
                      { l: '90 Дней', v: 90 },
                      { l: '180 Дней', v: 180 },
                      { l: '1 Год', v: 365 }
                    ].map(p => (
                      <button
                        key={p.l}
                        type="button"
                        onClick={() => applyPresetDate(p.v)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-[10px] uppercase tracking-wider font-bold transition-colors"
                      >
                        {p.l}
                      </button>
                    ))}
                  </div>

                  <input
                    required
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 text-xs font-mono text-white/70 focus:outline-none focus:border-white/20 mt-2"
                  />
                  <p className="text-[9px] text-white/20">
                    * По достижении выбранной даты сервер автоматически скроется с главной и отправится во вкладку "Архив/Неактивные".
                  </p>
                </div>

                {/* Performance selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                      Основное назначение
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 text-xs text-white/70 focus:outline-none"
                    >
                      <option value="Общий обход block 🌐">Общий обход block 🌐</option>
                      <option value="Для игр 🎮">Для игр 🎮</option>
                      <option value="Для работы/учебы 💼">Для работы/учебы 💼</option>
                      <option value="Для YouTube & Streaming 📺">Для YouTube & Streaming 📺</option>
                      <option value="Высокая защита 🔐">Высокая защита 🔐</option>
                    </select>
                  </div>

                  {/* speedLimit */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                      Ограничение пропускной способности
                    </label>
                    <select
                      value={formData.speedLimit}
                      onChange={e => setFormData({ ...formData, speedLimit: e.target.value })}
                      className="w-full bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 text-xs text-white/70 focus:outline-none"
                    >
                      <option value="Без лимита">Без лимита (Capped by host)</option>
                      <option value="10 Mbps">10 Mbps</option>
                      <option value="50 Mbps">50 Mbps</option>
                      <option value="100 Mbps">100 Mbps</option>
                      <option value="500 Mbps">500 Mbps</option>
                      <option value="1 Gbps">1 Gbps</option>
                    </select>
                  </div>
                </div>

                {/* Custom Decorative Icon */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1 block">
                    Визуальный маркер (Иконка)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'Globe', label: '🌐 Спутник' },
                      { key: 'Server', label: '🖥️ Виртуальн.' },
                      { key: 'Zap', label: '⚡ Молния-Турбо' },
                      { key: 'Flame', label: '🔥 Горячий' },
                      { key: 'Shield', label: '🛡️ Защищённый' },
                      { key: 'Sparkles', label: '✨ Магический' },
                      { key: 'Heart', label: '❤️ Избранное' }
                    ].map((ic) => (
                      <button
                        key={ic.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, customIcon: ic.key })}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-mono border transition-all ${
                          formData.customIcon === ic.key
                            ? 'bg-white text-black font-extrabold border-transparent'
                            : 'bg-white/5 hover:bg-white/10 text-white/50 border-white/5'
                        }`}
                      >
                        {ic.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clients support */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1 block">
                    Где тестировалось / Рекомендуемые клиенты
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['v2rayN', 'Sing-box', 'Nekobox', 'Shadowrocket', 'Hiddify', 'v2rayTun', 'Happ'].map((cl) => {
                      const isChecked = formData.allowedClients.includes(cl);
                      return (
                        <button
                          key={cl}
                          type="button"
                          onClick={() => {
                            const updated = isChecked
                              ? formData.allowedClients.filter(c => c !== cl)
                              : [...formData.allowedClients, cl];
                            setFormData({ ...formData, allowedClients: updated });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
                            isChecked
                              ? postType === 'subscription' ? 'bg-emerald-600 border-transparent text-white' : 'bg-indigo-600 border-transparent text-white'
                              : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {cl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PRIVACY, SYSTEM NOTATIONS, AND CONFIRMATION */}
            {activeStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Notes explainer */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">
                    Инструкции или примечания для пользователей
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Например: 'Рекомендуется прописать SNI: m.youtube.com в случае медленной загрузки видео' или 'Пароль отсутствует'."
                    maxLength={400}
                    className="w-full h-24 bg-white/[0.02] border border-white/5 focus:border-white/15 rounded-2xl p-4 text-xs focus:outline-none transition-all resize-none text-white/80"
                  />
                </div>

                {/* Anonymous / Private options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-white/75 font-semibold">Приватный сервер</span>
                      <span className="text-[9px] text-white/30">Скрывает сервер из основного листинга главной (только по direct ссылке)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.hideAuthor}
                      onChange={e => setFormData({ ...formData, hideAuthor: e.target.checked })}
                      className="accent-rose-500 w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-white/75 font-semibold">Анонимное предложение</span>
                      <span className="text-[9px] text-white/30">Скроет ваше авторство и ссылку на профиль со страницы серверов</span>
                    </div>
                  </label>
                </div>

                {/* Deferred timing check */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.03]">
                    <input 
                      type="checkbox"
                      checked={formData.isScheduled}
                      onChange={e => setFormData({ ...formData, isScheduled: e.target.checked })}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs text-white/80 font-semibold">Запланировать старт позже? (Отложенный запуск)</span>
                  </label>

                  {formData.isScheduled && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative"
                    >
                      <input 
                        required={formData.isScheduled}
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                        className="w-full bg-[#0d0d0d] border border-indigo-500/20 focus:border-indigo-500/40 rounded-2xl p-4 text-xs font-mono text-white/80 focus:outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Summary Pre-publication review */}
                <div className="p-5 rounded-2xl border bg-indigo-500/2 border-indigo-500/10 space-y-3">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Сводная информация публикации
                  </div>
                  <ul className="space-y-1.5 text-xs text-white/60 leading-relaxed">
                    <li>• Тип: <strong>{postType === 'vless' ? `Ключ ${formData.protocol}` : 'Закодированная подписка-папка'}</strong></li>
                    <li>• Название: <strong>{postType === 'vless' ? formData.name : formData.subscriptionName}</strong></li>
                    <li>• Активен до: <strong>{formData.expiryDate} (Будет сконвертировано в базу автоматически)</strong></li>
                    <li>• Степень приватности: <strong>{formData.isPrivate ? 'Приватная (доступ по direct-ссылке)' : 'Публичная на главной'}</strong></li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Wizard Bottom Controls Buttons */}
          <div className="flex items-center justify-between gap-4 pt-6 mt-10 border-t border-white/5 relative z-10">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-xl font-bold uppercase tracking-widest text-[10px] text-white"
              >
                Назад
              </button>
            ) : (
              <div />
            )}

            {activeStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className={`px-8 py-4 active:scale-[0.98] transition-all rounded-xl font-bold uppercase tracking-widest text-[10px] text-white flex items-center gap-1.5 ${
                  postType === 'subscription' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-500 hover:bg-indigo-600'
                }`}
              >
                Далее
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] transition-all ${
                  isSubmitting
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : postType === 'subscription' 
                  ? 'bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:scale-[1.02]'
                  : 'bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isSubmitting ? 'Отправка...' : 'Опубликовать'}
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Local History Section */}
      <div className="mt-12 space-y-6">
        <h3 className="text-sm font-serif italic text-white/40 ml-1">Ваша история предложений</h3>
        <div className="space-y-3">
          {historyItems.length > 0 ? (
            [...historyItems].reverse().map((item: any) => (
              <div key={item.id} className="glass p-4 rounded-2xl flex items-center justify-between group border border-white/5">
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
