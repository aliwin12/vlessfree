/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Key, Shield, Globe, Copy, Check, RefreshCw, Zap, Cpu, Lock, Activity, Calendar, X, AlertTriangle, Monitor, Smartphone, Terminal, Info, ChevronRight, Download, ExternalLink, Menu, Share2, Folder, ChevronDown, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

import { MOCK_KEYS, VlessKey } from './data/keys';
import { db, collection, query, orderBy, onSnapshot, handleFirestoreError, OperationType, addDoc, serverTimestamp, getDocs, where } from './lib/firebase';
import AdminPanel from './components/AdminPanel';
import ReportPage from './components/ReportPage';

const UPDATES = [
  {
    version: '0.8',
    date: '24.04.2026',
    changes: [
      'Завершено техническое обслуживание.',
      'Добавлены 13 новых высокоскоростных серверов в разных локациях.'
    ]
  },
  {
    version: '0.7',
    date: '30.03.2026',
    changes: [
      'Временное отключение серверов для планового обслуживания.',
      'Сервис станет доступен в 17:55 по мск'
    ]
  },
  {
    version: '0.6',
    date: '21.03.2026',
    changes: [
      'Добавлена фильтрация серверов по странам через удобное выпадающее меню.',
      'Серверы на второй странице переименованы в Server №12 - Server №19.',
      'Все возвращенные серверы теперь имеют сквозную нумерацию.'
    ]
  },
  {
    version: '0.5',
    date: '21.03.2026',
    changes: [
      'Добавлен новый список серверов (№1, №2, №3, №5-№10).',
      'Спец сервер теперь работает как "Папка" с несколькими конфигурациями.',
      'Добавлен мини-баннер "Скоро будут ещё сервера" в раздел спец серверов.',
      'Добавлена возможность делиться конфигурациями отдельных серверов из папки.',
      'Удален информационный баннер о новых серверах в верхней панели.',
      'Восстановлен список неактивных серверов во вкладке "Неактивные".',
      'Server №10 (Old) переименован в Server №11 и снова активен.',
      'Спец папка теперь открывается на отдельной странице.',
      'Все неактивные сервера (№1-№9) возвращены в строй и активны до 22.03.2026 15:00.'
    ]
  },
  {
    version: '0.4',
    date: '21.03.2026',
    changes: [
      'Большинство серверов переведены в неактивный режим по истечении срока.',
      'Добавлен информационный баннер о новых серверах.',
      'Обновлен дизайн заголовка.'
    ]
  },
  {
    version: '0.3',
    date: '20.03.2026',
    changes: [
      'Удалены тестовые серверы №11, №12 и №13.'
    ]
  },
  {
    version: '0.2',
    date: '20.03.2026',
    changes: [
      'Добавлена пагинация: теперь на одной странице отображается не более 12 серверов.',
      'Добавлен новый Server №10 (Нидерланды).',
      'Создана страница "Обновления" для отслеживания изменений на сайте.',
      'Добавлена кнопка "Обновления" в верхнюю панель навигации.'
    ]
  },
  {
    version: '0.1',
    date: '19.03.2026',
    changes: [
      'Оптимизация интерфейса для мобильных устройств.'
    ]
  }
];

function Header({ scrolled }: { scrolled: boolean }) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
      scrolled ? 'py-2 md:py-4 glass border-b' : 'py-3 md:py-8 bg-transparent md:bg-transparent glass md:glass-none border-b md:border-none'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative flex flex-col items-center gap-4">
        <div className="w-full flex justify-center items-center relative">
          {/* Left Updates Button */}
          <Link 
            to="/updates" 
            className="hidden md:flex absolute left-0 items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white hover:text-black text-[10px] uppercase tracking-widest font-bold transition-all duration-300 border border-white/10"
          >
            <RefreshCw className="w-3 h-3" />
            Обновления
          </Link>

          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 flex items-center justify-center rounded-lg md:rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <img 
                src="https://s10.iimage.su/s/17/gzMssIvxlmD4o7bBXdXbwchG1mLsp8EHi8CdMFJ2o.png" 
                alt="vlessfree logo" 
                className="w-full h-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <img 
              src="https://s10.iimage.su/s/17/gW7gsFfxcyoojRD4cNLejI21W6YZc62Ieh9AfziAL.png" 
              alt="vlessfree" 
              className="h-6 md:h-10 w-auto object-contain glow-text"
              referrerPolicy="no-referrer"
            />
          </Link>
          
          {/* Desktop Button */}
          <div className="hidden md:flex absolute right-0 items-center gap-2">
            <Link 
              to="/report" 
              className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-all duration-300 border border-rose-500/20"
            >
              Репорты
            </Link>
            <Link 
              to="/how-to-use" 
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white hover:text-black text-[10px] uppercase tracking-widest font-bold transition-all duration-300 border border-white/10"
            >
              Как установить VPN
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] glass border-t pb-safe backdrop-blur-2xl"
    >
      <div className="flex justify-around items-center h-14 md:h-16">
        <Link 
          to="/updates" 
          className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${isActive('/updates') ? 'text-white' : 'text-white/30'}`}
        >
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-xl transition-all duration-300 ${isActive('/updates') ? 'bg-white/10' : ''}`}
          >
            <RefreshCw className={`w-5 h-5 ${isActive('/updates') ? 'glow-text' : ''}`} />
          </motion.div>
          <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive('/updates') ? 'opacity-100' : 'opacity-60'}`}>Обновы</span>
        </Link>
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${isActive('/') ? 'text-white' : 'text-white/30'}`}
        >
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-xl transition-all duration-300 ${isActive('/') ? 'bg-white/10' : ''}`}
          >
            <Globe className={`w-5 h-5 ${isActive('/') ? 'glow-text' : ''}`} />
          </motion.div>
          <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive('/') ? 'opacity-100' : 'opacity-60'}`}>Сервера</span>
        </Link>
        <Link 
          to="/report" 
          className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${isActive('/report') ? 'text-white' : 'text-white/30'}`}
        >
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-xl transition-all duration-300 ${isActive('/report') ? 'bg-white/10' : ''}`}
          >
            <AlertTriangle className={`w-5 h-5 ${isActive('/report') ? 'glow-text' : ''}`} />
          </motion.div>
          <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive('/report') ? 'opacity-100' : 'opacity-60'}`}>Репорт</span>
        </Link>
        <Link 
          to="/how-to-use" 
          className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-all duration-300 ${isActive('/how-to-use') ? 'text-white' : 'text-white/30'}`}
        >
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className={`p-1.5 rounded-xl transition-all duration-300 ${isActive('/how-to-use') ? 'bg-white/10' : ''}`}
          >
            <Smartphone className={`w-5 h-5 ${isActive('/how-to-use') ? 'glow-text' : ''}`} />
          </motion.div>
          <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive('/how-to-use') ? 'opacity-100' : 'opacity-60'}`}>Гайд</span>
        </Link>
      </div>
    </motion.nav>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-[20px] md:rounded-[32px] p-4 md:p-8 animate-pulse">
      <div className="flex justify-between items-start mb-4 md:mb-8">
        <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5" />
        <div className="w-16 h-3 bg-white/5 rounded" />
      </div>
      <div className="w-3/4 h-6 md:h-8 bg-white/5 rounded mb-2" />
      <div className="w-1/2 h-4 bg-white/5 rounded mb-4 md:mb-6" />
      <div className="w-1/3 h-3 bg-white/5 rounded mb-6 md:mb-8" />
      <div className="w-full h-12 md:h-14 bg-white/5 rounded-xl md:rounded-2xl" />
    </div>
  );
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // 19.03.2026 22:30 MSK = 19.03.2026 19:30 UTC
      const target = new Date(Date.UTC(2026, 2, 19, 19, 30, 0));

      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) return { h: 0, m: 0, s: 0 };

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      return { h, m, s };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null;
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <span className="font-mono tabular-nums">
      {timeLeft.h > 0 && `${pad(timeLeft.h)}:`}{pad(timeLeft.m)}:{pad(timeLeft.s)}
    </span>
  );
}

function HomePage({ keys, warnings = [], handleCopy, copiedId, selectedKey, setSelectedKey, activeTab, setActiveTab, loading, unlockedSpecial, onUnlockSpecial }: any) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const itemsPerPage = 12;

  const activeWarnings = warnings.filter((w: any) => w.active);
  const replaceWithWarning = activeWarnings.find((w: any) => w.replaceContent);

  const handleSpecialClick = (key: any) => {
    if (unlockedSpecial) {
      navigate('/special');
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const checkPassword = () => {
    if (password === 'XeonLonghornBurgeredCS2DetroitMafia3') {
      onUnlockSpecial();
      setShowPasswordPrompt(false);
      setPassword('');
      setPasswordError(false);
      navigate('/special');
    } else {
      setPasswordError(true);
    }
  };

  const handleShare = async (key: any) => {
    const shareData = {
      title: `VLESSFREE - ${key.name}`,
      text: `Конфигурация для ${key.name} (${key.location}):\n\n${key.config}\n\nПолучено через VLESSFREE`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard and show alert
        await navigator.clipboard.writeText(shareData.text);
        alert('Ссылка на конфигурацию скопирована в буфер обмена для отправки.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const countries = useMemo(() => {
    return Array.from(new Set(keys.map((key: any) => key.location.split(',')[0].trim())));
  }, [keys]);

  const filteredKeys = keys.filter((key: any) => {
    // Automatic inactivation check
    const parts = key.expiryDate?.split('.');
    let expiry: Date | null = null;
    if (parts && parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        expiry = new Date(year, month - 1, day);
        expiry.setHours(23, 59, 59, 999);
      }
    }

    const now = new Date();
    const isExpired = !expiry || expiry < now;

    if (activeTab === 'active') {
      return (key.status === 'online' || key.status === 'unstable') && !isExpired && !key.isComingSoon;
    } else if (activeTab === 'comingSoon') {
      return key.isComingSoon;
    } else {
      return (key.status === 'offline') || isExpired;
    }
  }).filter((key: any) => {
    const matchesCountry = !selectedCountry || key.location.startsWith(selectedCountry);
    return matchesCountry;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredKeys.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCountry]);

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate || typeof expiryDate !== 'string' || !expiryDate.includes('.')) return false;
    const parts = expiryDate.split('.');
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

    const expiry = new Date(year, month - 1, day);
    const now = new Date();
    // Set both to start of day for accurate day difference
    expiry.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isCriticallyExpiring = (expiryDate: string) => {
    if (!expiryDate || typeof expiryDate !== 'string' || !expiryDate.includes('.')) return false;
    const parts = expiryDate.split('.');
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

    // We assume expiry is at 23:59:59 of the given day
    const expiry = new Date(year, month - 1, day, 23, 59, 59, 999);
    const now = new Date();
    
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours <= 12 && diffHours > 0;
  };

  return (
    <main className="relative pt-32 md:pt-56 pb-28 md:pb-20 px-4 md:px-6 max-w-7xl mx-auto min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="mb-8 md:mb-16 text-center shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif italic mb-4 tracking-tighter leading-tight selectable glow-text-iphone">
            Ключи для <br className="hidden sm:block" /> 
            <span className="text-white/40">свободного интернета.</span>
          </h2>
          <p className="text-lg md:text-2xl text-white/40 font-serif italic tracking-tight">
            Актуальные конфигурации для обхода блокировок.
          </p>
        </motion.div>
      </section>
      <div style={{ display: 'none' }} id="corruption-gate"> { /*
            Актуальны�      {(keys.length > 0 && !replaceWithWarning) ? (
          */ } </div>
      
      {/* Warnings Section */}
      <AnimatePresence>
        {activeWarnings.map((warning: any) => (
          <motion.div
            key={warning.id}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 md:p-6 rounded-[24px] md:rounded-[32px] border flex items-center gap-4 ${
              warning.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
              warning.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
              'glass text-white/80'
            }`}>
              <div className="shrink-0 p-3 rounded-2xl bg-current opacity-10">
                {warning.type === 'error' ? <AlertTriangle className="w-6 h-6" /> : 
                 warning.type === 'warning' ? <Bell className="w-6 h-6" /> : 
                 <Info className="w-6 h-6" />}
              </div>
              <p className="text-sm md:text-base font-serif italic leading-relaxed">{warning.text}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {(keys.length > 0 && !replaceWithWarning) ? (
        <>
          {/* Tabs / Segmented Control */}
          <div className="flex justify-center mb-8 md:mb-16 shrink-0">
          <div className="glass p-1 rounded-xl md:rounded-3xl flex gap-1 bg-white/5">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-5 md:px-8 py-2 md:py-3 rounded-lg md:rounded-2xl text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                activeTab === 'active' 
                ? 'bg-white text-black shadow-xl scale-[1.02]' 
                : 'text-white/40 hover:text-white/60'
              }`}
            >
              Активные
            </button>
            <button 
              onClick={() => setActiveTab('comingSoon')}
              className={`px-5 md:px-8 py-2 md:py-3 rounded-lg md:rounded-2xl text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                activeTab === 'comingSoon' 
                ? 'bg-emerald-500 text-white shadow-xl scale-[1.02]' 
                : 'text-white/40 hover:text-white/60'
              }`}
            >
              Скоро будет
            </button>
            <button 
              onClick={() => setActiveTab('inactive')}
              className={`px-5 md:px-8 py-2 md:py-3 rounded-lg md:rounded-2xl text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                activeTab === 'inactive' 
                ? 'bg-rose-500 text-white shadow-xl scale-[1.02]' 
                : 'text-white/40 hover:text-white/60'
              }`}
            >
              Неактивные
            </button>
          </div>
      </div>

      {/* Subscription Button */}
      <div className="flex flex-col items-center justify-center mb-8 md:mb-12 shrink-0">
        <a 
          href="/suball" 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass group relative px-8 py-4 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 hover:border-white/30 transition-all duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/60 group-hover:text-white transition-colors duration-300">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white">vlessfree Sub✅</span>
              <span className="text-[8px] text-white/40 uppercase tracking-widest group-hover:text-white/60 transition-colors duration-300">Подписаться на все сервера</span>
            </div>
            <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors ml-4" />
          </div>
        </a>
        <p className="mt-4 text-[10px] text-white/30 font-serif italic tracking-wide">
          * рекомендуем обновлять подписку, чтобы получать новые ключи удобнее
        </p>
      </div>

      {/* Country Filter Dropdown */}
      <div className="flex justify-center mb-8 md:mb-12 relative z-[60]">
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="glass px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-all hover:border-white/30"
          >
            <Globe className="w-4 h-4 text-white/40" />
            <span>{selectedCountry || 'Все страны'}</span>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFilterOpen(false)}
                  className="fixed inset-0 z-[-1]"
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 glass rounded-3xl overflow-hidden shadow-2xl z-50 border-white/20"
                >
                  <div className="p-2 flex flex-col gap-1 max-h-80 overflow-y-auto no-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCountry(null);
                        setIsFilterOpen(false);
                      }}
                      className={`px-4 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-bold text-left transition-all ${
                        selectedCountry === null
                          ? 'bg-white text-black'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      Все страны
                    </button>
                    {countries.map((country: any) => (
                      <button
                        key={country}
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsFilterOpen(false);
                        }}
                        className={`px-4 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-bold text-left transition-all ${
                          selectedCountry === country
                            ? 'bg-white text-black'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nodes Grid / Empty State */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </motion.div>
        ) : filteredKeys.length > 0 ? (
          <div key={activeTab} className="flex flex-col gap-6">

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
            {currentItems.map((key: any, index: number) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`glass rounded-[20px] md:rounded-[32px] p-4 md:p-8 group hover:border-white/30 transition-all duration-500 ${key.status === 'offline' ? 'opacity-60 grayscale' : ''} relative overflow-hidden`}
              >
                {isExpiringSoon(key.expiryDate) && key.status !== 'offline' && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] z-30" />
                )}
                
                {key.isSpecial && !unlockedSpecial && (
                  <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/20 pointer-events-none" />
                )}
                
                <div className="flex justify-between items-start mb-4 md:mb-8 relative z-20">
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-500 ${key.status === 'offline' ? 'bg-rose-500/10 text-rose-500' : key.isComingSoon ? 'bg-emerald-500/10 text-emerald-500' : ''}`}>
                    <Globe className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  <div className="flex gap-2">
                    {key.isComingSoon && (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[8px] md:text-[9px] uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        COMING SOON
                      </span>
                    )}
                    {(key.isDisappearingSoon || isCriticallyExpiring(key.expiryDate)) && !key.isComingSoon && (
                      <motion.span 
                        animate={isCriticallyExpiring(key.expiryDate) ? { opacity: [1, 0.5, 1], scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[8px] md:text-[9px] uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                      >
                        СКОРО ИСЧЕЗНЕТ
                      </motion.span>
                    )}
                    {key.isSpecial && (
                      <span className="px-2 py-1 rounded-lg bg-amber-500 text-black text-[8px] md:text-[9px] uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        SPECIAL
                      </span>
                    )}
                    <button 
                      onClick={() => key.isSpecial && !unlockedSpecial ? handleSpecialClick(key) : setSelectedKey(key)}
                      className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 transition-opacity"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1 md:mb-2 relative z-20">
                  <h3 className="text-xl md:text-2xl font-serif italic tracking-tight selectable">{key.name}</h3>
                  {key.status === 'unstable' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[7px] md:text-[8px] uppercase tracking-widest font-bold border border-amber-500/20">
                      Нестабильный
                    </span>
                  )}
                  {key.status === 'offline' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[7px] md:text-[8px] uppercase tracking-widest font-bold border border-rose-500/20">
                      Отключен
                    </span>
                  )}
                </div>
                
                <div className={key.isSpecial && !unlockedSpecial ? 'blur-sm select-none pointer-events-none' : ''}>
                  <p className="text-xs md:text-sm text-white/40 mb-4 md:mb-6 selectable">{key.location}</p>

                  {key.reason && (
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6">
                      <p className="text-[9px] md:text-[10px] text-rose-500/60 uppercase tracking-widest font-bold mb-1">Причина:</p>
                      <p className="text-[11px] md:text-xs text-rose-500/80">{key.reason}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30 mb-6 md:mb-8">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>До: {key.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 relative z-20">
                  <button
                    onClick={() => {
                      if (key.isSpecial) {
                        handleSpecialClick(key);
                      } else {
                        handleCopy(key.id, key.config);
                      }
                    }}
                    disabled={key.status === 'offline'}
                    className={`w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                      key.status === 'offline'
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : copiedId === key.id 
                      ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                      : key.isSpecial && !unlockedSpecial
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : key.isSpecial && unlockedSpecial
                      ? 'bg-white/10 hover:bg-white hover:text-black'
                      : 'bg-white/5 hover:bg-white hover:text-black'
                    }`}
                  >
                    {key.isSpecial && !unlockedSpecial ? (
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Разблокировать
                      </div>
                    ) : key.isSpecial && unlockedSpecial ? (
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" /> Открыть папку
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        {copiedId === key.id ? (
                          <motion.div
                            key="check"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" /> Скопировано!
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" /> Копировать конфигурацию
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (key.isSpecial) {
                        handleSpecialClick(key);
                      } else {
                        handleShare(key);
                      }
                    }}
                    disabled={key.status === 'offline'}
                    className={`w-full py-3 md:py-3.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 ${
                      key.status === 'offline'
                      ? 'opacity-20 cursor-not-allowed'
                      : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {key.isSpecial ? <Folder className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {key.isSpecial ? 'Просмотреть содержимое' : 'Поделиться'}
                  </button>
                </div>
              </motion.div>
            ))}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 md:mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-3 rounded-xl border border-white/10 transition-all duration-300 ${
                    currentPage === 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white hover:text-black'
                  }`}
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl border border-white/10 text-[10px] font-bold transition-all duration-300 ${
                        currentPage === page ? 'bg-white text-black' : 'hover:bg-white/5'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-3 rounded-xl border border-white/10 transition-all duration-300 ${
                    currentPage === totalPages ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white hover:text-black'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : !loading && (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-32 text-center"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-8 h-8 opacity-20" />
            </div>
            {replaceWithWarning ? (
              <>
                <h3 className="text-2xl font-serif italic mb-2">Технические работы</h3>
                <p className="text-white/30 text-sm">Смотрите информацию в объявлении выше.</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-serif italic mb-2">
                  {activeTab === 'active' ? 'Нет активных серверов' : activeTab === 'comingSoon' ? 'Пока нет серверов в разработке' : 'Нет неактивных серверов'}
                </h3>
                <p className="text-white/30 text-sm">
                  {activeTab === 'active' ? 'Пожалуйста, подождите обновления списка.' : activeTab === 'comingSoon' ? 'Мы скоро добавим новые высокоскоростные узлы.' : 'Все доступные узлы работают в штатном режиме.'}
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  ) : !loading && (
    <motion.div 
      key="empty-no-keys"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-32 text-center"
    >
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
        <AlertTriangle className="w-8 h-8 opacity-20" />
      </div>
      {replaceWithWarning ? (
        <>
          <h3 className="text-2xl font-serif italic mb-2">Технические работы</h3>
          <p className="text-white/30 text-sm">Смотрите информацию в объявлении выше.</p>
        </>
      ) : (
        <>
          <h3 className="text-2xl font-serif italic mb-2">Нет доступных серверов</h3>
          <p className="text-white/30 text-sm">Пожалуйста, подождите обновления списка.</p>
        </>
      )}
    </motion.div>
  )}

      {/* Password Prompt Modal */}
      <AnimatePresence>
        {showPasswordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass p-8 rounded-[32px] max-w-md w-full border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-serif italic tracking-tight">Доступ ограничен</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setPassword('');
                    setPasswordError(false);
                  }}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <p className="text-sm text-white/40 mb-6 leading-relaxed">
                Этот сервер является специальным. Для получения доступа к конфигурации необходимо ввести пароль.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                    placeholder="Введите пароль..."
                    className={`w-full bg-white/5 border ${passwordError ? 'border-rose-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-amber-500/50 transition-colors`}
                    autoFocus
                  />
                  {passwordError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-rose-500 mt-2 font-bold uppercase tracking-widest"
                    >
                      Неверный пароль
                    </motion.p>
                  )}
                </div>

                <button
                  onClick={checkPassword}
                  className="w-full py-4 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-amber-500 transition-colors duration-300"
                >
                  Разблокировать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-24 md:mt-32 py-10 md:py-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-[10px] uppercase tracking-[0.2em] font-bold text-center md:text-left">
        <div className="flex flex-col gap-2">
          <p>© 2026 VLESSFREE</p>
        </div>
      </footer>
    </main>
  );
}

function HowToUsePage() {
  const platforms = [
    {
      name: 'Windows',
      icon: Monitor,
      app: 'v2rayTun',
      description: 'Мощный и легкий клиент для Windows с поддержкой всех современных протоколов.',
      tutorial: 'Скачайте установщик с официального сайта, установите и запустите. Нажмите "Import from Clipboard" после копирования ключа на нашем сайте.',
      link: 'https://v2raytun.com'
    },
    {
      name: 'iOS (iPhone)',
      icon: Smartphone,
      app: 'v2rayTun',
      description: 'Удобный и быстрый клиент для iOS. Поддерживает Reality и другие современные протоколы.',
      tutorial: 'Установите приложение из App Store. Нажмите на иконку "+" или "Import", выберите вариант импорта из буфера обмена (Clipboard).',
      link: 'https://apps.apple.com/us/app/v2raytun/id6476628951'
    },
    {
      name: 'Android',
      icon: Smartphone,
      app: 'v2rayTun',
      description: 'Стабильный клиент для Android. Простой интерфейс и высокая скорость работы.',
      tutorial: 'Установите APK, нажмите на значок "+" и выберите "Import from Clipboard". Выберите добавленный профиль и нажмите кнопку "V" для подключения.',
      link: 'https://play.google.com/store/apps/details?id=com.v2raytun.android'
    },
    {
      name: 'Linux',
      icon: Terminal,
      app: 'Karing',
      description: 'Современный кроссплатформенный клиент с отличной поддержкой Linux.',
      tutorial: 'Установите пакет для вашего дистрибутива. Перейдите в раздел подписок/узлов и вставьте скопированный ключ.',
      link: 'https://github.com/KaringX/karing/releases'
    }
  ];

  return (
    <main className="relative pt-32 md:pt-56 pb-28 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto min-h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 md:mb-16 text-center shrink-0"
      >
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif italic mb-4 md:mb-6 tracking-tighter leading-tight">
          Как установить <br className="hidden sm:block" />
          <span className="text-white/40">и настроить VPN.</span>
        </h2>
        <p className="text-white/40 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
          Следуйте инструкциям ниже для вашей операционной системы. Мы подобрали лучшие приложения для работы с нашими ключами.
        </p>
      </motion.div>

      <div className="grid gap-6 md:gap-8 flex-1">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-[24px] md:rounded-[32px] p-5 md:p-10 flex flex-col md:flex-row gap-5 md:gap-8 items-start hover:border-white/20 transition-all duration-500"
          >
            <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
              <platform.icon className="w-5 h-5 md:w-8 md:h-8" />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <h3 className="text-xl md:text-2xl font-serif italic tracking-tight">{platform.name}</h3>
                <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-white/10 text-[8px] md:text-[10px] uppercase tracking-widest font-bold">
                  {platform.app}
                </span>
              </div>
              
              <p className="text-white/60 mb-4 md:mb-6 text-xs md:text-sm leading-relaxed">
                {platform.description}
              </p>
              
              <div className="bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-white/5">
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30 mb-3 md:mb-4">
                  <Info className="w-3 h-3" />
                  <span>Инструкция</span>
                </div>
                <p className="text-xs md:text-sm leading-relaxed text-white/80">
                  {platform.tutorial}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 md:gap-4">
                <a 
                  href={platform.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 md:px-8 py-3 md:py-4 bg-white text-black rounded-lg md:rounded-xl text-[9px] md:text-[10px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" /> Скачать приложение
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 md:mt-20 p-6 md:p-10 glass rounded-[24px] md:rounded-[40px] text-center border-white/10 shrink-0">
        <h3 className="text-xl md:text-2xl font-serif italic mb-3 md:mb-4">Остались вопросы?</h3>
        <p className="text-white/40 text-xs md:text-sm mb-6 md:mb-8">
          Если у вас возникли трудности с настройкой, попробуйте поискать видео-туториалы по названию приложения на YouTube.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity"
        >
          Вернуться к списку серверов <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}

function UpdatesPage() {
  return (
    <main className="relative pt-32 md:pt-56 pb-28 md:pb-20 px-4 md:px-6 max-w-3xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 md:mb-20 text-center"
      >
        <h2 className="text-4xl md:text-6xl font-serif italic mb-4 tracking-tighter glow-text-iphone">Обновления</h2>
        <p className="text-white/40 font-serif italic">История изменений проекта VLESSFREE</p>
      </motion.div>

      <div className="space-y-8 md:space-y-12">
        {UPDATES.map((update, index) => (
          <motion.div
            key={update.version}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-8 md:pl-12 border-l border-white/10"
          >
            <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            
            <div className="flex items-baseline gap-4 mb-4">
              <h3 className="text-2xl md:text-3xl font-serif italic text-white">v{update.version}</h3>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white/20">{update.date}</span>
            </div>

            <ul className="space-y-3">
              {update.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/60 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <footer className="mt-24 md:mt-32 py-10 md:py-12 border-t border-white/10 opacity-40 text-[10px] uppercase tracking-[0.2em] font-bold text-center">
        <p>© 2026 VLESSFREE</p>
      </footer>
    </main>
  );
}

function SpecialFolderPage({ keys, handleCopy, copiedId, unlockedSpecial }: any) {
  const navigate = useNavigate();
  const specialFolder = keys.find((k: any) => k.isSpecial);

  useEffect(() => {
    if (!unlockedSpecial) {
      navigate('/');
    }
  }, [unlockedSpecial, navigate]);

  if (!specialFolder) return null;

  const handleShare = async (key: any) => {
    const shareData = {
      title: `VLESSFREE - ${key.name}`,
      text: `Конфигурация для ${key.name} (${key.location}):\n\n${key.config}\n\nПолучено через VLESSFREE`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('Ссылка на конфигурацию скопирована в буфер обмена для отправки.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <main className="relative pt-32 md:pt-56 pb-28 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 md:mb-20"
      >
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity mb-8"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Назад к серверам
        </Link>
        <h2 className="text-4xl md:text-6xl font-serif italic mb-4 tracking-tighter glow-text-iphone">Спец Папка</h2>
        <p className="text-white/40 font-serif italic">Эксклюзивные конфигурации VLESS</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...specialFolder.subKeys].sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        }).map((sub: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="glass rounded-[32px] p-8 border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-500">
                <Globe className="w-6 h-6" />
              </div>
              <div className="px-3 py-1 rounded-lg bg-amber-500 text-black text-[9px] uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                PREMIUM
              </div>
            </div>

            <h3 className="text-2xl font-serif italic mb-2 tracking-tight">{sub.name}</h3>
            <p className="text-sm text-white/40 mb-8">{sub.location}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleCopy(`special-${idx}`, sub.config)}
                className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  copiedId === `special-${idx}` ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white hover:text-black'
                }`}
              >
                {copiedId === `special-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedId === `special-${idx}` ? 'Скопировано' : 'Копировать ключ'}
              </button>
              <button
                onClick={() => handleShare(sub)}
                className="w-full py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <Share2 className="w-4 h-4" /> Поделиться
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {specialFolder.showMiniBanner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-8 rounded-[32px] bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 text-center"
        >
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-amber-500 animate-pulse">
            Скоро будут добавлены новые локации
          </p>
        </motion.div>
      )}
    </main>
  );
}

function MirrorScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[300] bg-[#050505] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="text-6xl mb-8">⏳</div>
      <h1 className="text-3xl md:text-4xl font-serif italic mb-4 tracking-tighter">
        Не загружается?
      </h1>
      <p className="text-white/50 mb-10 text-sm md:text-base max-w-xs">
        Попробуй тогда это зеркало
      </p>
      <a 
        href="https://vlessfree-djif23janskdq21.vercel.app/"
        className="px-10 py-4 rounded-2xl bg-white text-black font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
      >
        Зеркало
      </a>
    </motion.div>
  );
}

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 md:w-24 md:h-24 rounded-3xl border-2 border-white/10 flex items-center justify-center glass relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent animate-pulse" />
            <Zap className="w-10 h-10 md:w-12 md:h-12 text-white glow-text" />
          </motion.div>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute -bottom-4 left-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
          />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col items-center gap-2"
        >
          <h1 className="text-2xl md:text-3xl font-serif italic tracking-tighter text-white">
            VlessFree
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-1 h-1 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-white"
        >
          Загрузка конфигураций...
        </motion.div>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const [keys, setKeys] = useState<VlessKey[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      let userIp = 'Unknown';
      let country = 'Unknown';
      let geoData: any = null;

      const fetchGeo = async (url: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for each
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      };

      try {
        // Try chain of services
        try {
          geoData = await fetchGeo('https://ipapi.co/json/');
        } catch (e) {
          try {
            geoData = await fetchGeo('https://ipwho.is/');
          } catch (e2) {
            try {
              geoData = await fetchGeo('https://api.db-ip.com/v2/free/self');
            } catch (e3) {
              // Last resort: simple IP only
              const ipOnly = await fetchGeo('https://api.ipify.org?format=json');
              geoData = { ip: ipOnly.ip, country_name: 'Unknown' };
            }
          }
        }
      } catch (e) {
        console.warn('All geolocation services failed', e);
      }

      if (geoData) {
        userIp = geoData.ip || geoData.query || 'Unknown';
        country = geoData.country_name || geoData.country || 'Unknown';
      }

      try {
        // Check if blocked
        if (userIp !== 'Unknown') {
          const blockedSnap = await getDocs(query(collection(db, 'blocked_ips'), where('ip', '==', userIp)));
          if (!blockedSnap.empty) {
            document.body.innerHTML = '<div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#050505;color:white;font-family:serif;font-style:italic;padding:2rem;text-align:center;"><div style="width:80px;height:80px;background:rgba(244,63,94,0.1);border-radius:24px;display:flex;align-items:center;justify-content:center;margin-bottom:2rem;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div><h1 style="font-size:2rem;margin-bottom:1rem;">Доступ ограничен</h1><p style="opacity:0.4;max-width:400px;line-height:1.6;">Ваш IP-адрес был заблокирован за нарушение правил использования сервиса или подозрительную активность.</p></div>';
            return;
          }
        }

        // Log visit
        await addDoc(collection(db, 'visits'), {
          userIp,
          browser: navigator.userAgent,
          country,
          visitedAt: serverTimestamp()
        });
      } catch (e) {
        console.error('Visit log logic failed', e);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'warnings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setWarnings(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'warnings');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'servers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        const countryNames: Record<string, string> = {
          'NL': 'Нидерланды', 'DE': 'Германия', 'FI': 'Финляндия', 'US': 'США', 
          'UK': 'Великобритания', 'MD': 'Молдова', 'IN': 'Индия', 'KZ': 'Казахстан', 
          'RU': 'Россия', 'SE': 'Швеция', 'TR': 'Турция', 'JP': 'Япония', 'BR': 'Бразилия'
        };
        
        const baseLocation = countryNames[data.country] || data.country;
        const location = data.city ? `${baseLocation}, ${data.city}` : baseLocation;

        return { 
          id: doc.id, 
          ...data,
          location
        };
      }) as VlessKey[];

      // Natural sort by name numbers (1, 2, 3...)
      const sortedDocs = [...docs].sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const matchA = nameA.match(/\d+/);
        const matchB = nameB.match(/\d+/);
        
        if (matchA && matchB) {
          const numA = parseInt(matchA[0]);
          const numB = parseInt(matchB[0]);
          if (numA !== numB) return numA - numB;
        }
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });

      setKeys(sortedDocs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'servers');
    });
    return () => unsubscribe();
  }, []);

  const [copiedId, setCopiedId] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<VlessKey | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'comingSoon'>('active');
  const [showMirror, setShowMirror] = useState(false);
  const [unlockedSpecial, setUnlockedSpecial] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Mark app as loaded for the index.html failsafe
    (window as any).appLoaded = true;

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Detect iPhone and add class to body
    const isIPhone = /iPhone/i.test(navigator.userAgent);
    if (isIPhone) {
      document.body.classList.add('is-iphone');
    }

    // Show mirror suggestion if loading takes too long (e.g. 10 seconds)
    const mirrorTimer = setTimeout(() => {
      setShowMirror(loading);
    }, 10000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('is-iphone');
      clearTimeout(mirrorTimer);
    };
  }, [loading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleCopy = (id: any, config: string) => {
    navigator.clipboard.writeText(config);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-white selection:text-black pt-safe pb-safe">
      <AnimatePresence mode="wait">
        {showMirror ? (
          <MirrorScreen key="mirror" />
        ) : loading ? (
          <LoadingScreen key="loader" />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && location.pathname === '/' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full glass rounded-[32px] md:rounded-[40px] p-6 md:p-12 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
              
              <div className="text-6xl mb-6">⚠️</div>
              
              <h2 className="text-3xl md:text-4xl font-serif italic mb-4 tracking-tighter">
                Технические работы
              </h2>
              
              <p className="text-white/50 leading-relaxed mb-10 text-sm md:text-base">
                Сервис станет доступен в 17:55 по мск
              </p>

              <div className="glass bg-white/5 rounded-3xl p-8 mb-4 flex items-center justify-center min-h-[120px]">
                <div className="text-2xl md:text-3xl font-serif italic tracking-tight text-white">
                  Ура я теперь в т2
                </div>
              </div>
              
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-20 mb-10">
                мегафон говно
              </div>

              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-5 bg-white text-black rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                Понятно
              </button>
            </motion.div>
          </motion.div>
        )}

        {selectedKey && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
            onClick={() => setSelectedKey(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full glass rounded-[24px] md:rounded-[40px] p-5 md:p-12 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedKey(null)}
                className="absolute top-4 md:top-6 right-4 md:right-6 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/5 flex items-center justify-center mb-6 md:mb-8">
                <Globe className="w-6 h-6 md:w-8 md:h-8" />
              </div>

              <h2 className="text-2xl md:text-3xl font-serif italic mb-1 md:mb-2 tracking-tighter selectable">
                {selectedKey.name}
              </h2>
              <p className="text-white/40 text-xs md:text-sm mb-6 md:mb-8 selectable">{selectedKey.location}</p>

              <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30">Протокол</span>
                  <span className="text-xs md:text-sm font-mono selectable">{selectedKey.protocol}</span>
                </div>
                <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30">Активен до</span>
                  <span className="text-xs md:text-sm font-mono selectable">{selectedKey.expiryDate}</span>
                </div>
                <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30">Статус</span>
                  <span className={`text-xs md:text-sm flex items-center gap-2 ${
                    selectedKey.status === 'online' ? 'text-emerald-500' : 
                    selectedKey.status === 'unstable' ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse ${
                      selectedKey.status === 'online' ? 'bg-emerald-500' : 
                      selectedKey.status === 'unstable' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    {selectedKey.status === 'online' ? 'Online' : 
                     selectedKey.status === 'unstable' ? 'Нестабильный' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleCopy(selectedKey.id, selectedKey.config)}
                  className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    copiedId === selectedKey.id 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white text-black'
                  }`}
                >
                  {copiedId === selectedKey.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === selectedKey.id ? 'Скопировано' : 'Копировать ключ'}
                </button>

                <Link
                  to={`/report?serverId=${selectedKey.id}&serverName=${encodeURIComponent(selectedKey.name)}`}
                  className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-rose-500 border border-white/5"
                  onClick={() => setSelectedKey(null)}
                >
                  <AlertTriangle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  Сообщить о проблеме
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <Header scrolled={scrolled} />
      <BottomNav />

      <Routes>
        <Route path="/" element={
          <HomePage 
            keys={keys} 
            warnings={warnings}
            handleCopy={handleCopy} 
            copiedId={copiedId} 
            selectedKey={selectedKey} 
            setSelectedKey={setSelectedKey} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            loading={loading}
            unlockedSpecial={unlockedSpecial}
            onUnlockSpecial={() => setUnlockedSpecial(true)}
          />
        } />
        <Route path="/how-to-use" element={<HowToUsePage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/special" element={
          <SpecialFolderPage 
            keys={keys} 
            handleCopy={handleCopy} 
            copiedId={copiedId} 
            unlockedSpecial={unlockedSpecial} 
          />
        } />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
