/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Key, Shield, Globe, Copy, Check, RefreshCw, Zap, Cpu, Lock, Activity, Calendar, X, AlertTriangle, Monitor, Smartphone, Terminal, Info, ChevronRight, Download, ExternalLink, Menu, Share2, Folder, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

interface VlessKey {
  id: number | string;
  name: string;
  location: string;
  protocol: string;
  latency: string;
  config: string;
  load: number;
  expiryDate: string;
  status?: 'online' | 'unstable' | 'offline';
  reason?: string;
  isSpecial?: boolean;
  subKeys?: { name: string; config: string; location: string }[];
  showMiniBanner?: boolean;
}

const MOCK_KEYS: VlessKey[] = [];

const UPDATES = [
  {
    version: '0.7',
    date: '30.03.2026',
    changes: [
      'Временное отключение серверов для планового обслуживания.',
      'Сервера будут доступны 31.03.2026 в 16:00.'
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
    <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
      scrolled ? 'py-4 bg-white border-b-[4px] border-brutal-black' : 'py-8 md:py-12 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            <img 
              src="https://s10.iimage.su/s/17/gzMssIvxlmD4o7bBXdXbwchG1mLsp8EHi8CdMFJ2o.png" 
              alt="logo" 
              className="w-full h-full object-contain p-2"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-3xl font-black tracking-tighter leading-none">VLESSFREE</span>
            <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40">Secure Access</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/updates" className="brutal-btn py-2 px-4 text-[10px]">
            Обновления
          </Link>
          <Link to="/how-to-use" className="brutal-btn-secondary py-2 px-4 text-[10px]">
            Инструкция
          </Link>
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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] pb-safe"
    >
      <div className="mx-4 mb-6 bg-white border-[3px] border-brutal-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex justify-around items-center h-20 px-2">
        <Link 
          to="/updates" 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive('/updates') ? 'bg-accent-primary' : 'hover:bg-accent-primary/10'}`}
        >
          <RefreshCw className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Обновы</span>
        </Link>
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all border-x-[3px] border-brutal-black ${isActive('/') ? 'bg-accent-secondary text-white' : 'hover:bg-accent-secondary/10'}`}
        >
          <Globe className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Сервера</span>
        </Link>
        <Link 
          to="/how-to-use" 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive('/how-to-use') ? 'bg-accent-tertiary text-white' : 'hover:bg-accent-tertiary/10'}`}
        >
          <Smartphone className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Гайд</span>
        </Link>
      </div>
    </motion.nav>
  );
}

function SkeletonCard() {
  return (
    <div className="brutal-card p-8 animate-pulse">
      <div className="flex justify-between items-start mb-8">
        <div className="w-12 h-12 bg-brutal-black/10" />
        <div className="w-16 h-4 bg-brutal-black/10" />
      </div>
      <div className="w-3/4 h-8 bg-brutal-black/10 mb-4" />
      <div className="w-1/2 h-4 bg-brutal-black/10 mb-8" />
      <div className="w-full h-14 bg-brutal-black/10" />
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

function HomePage({ keys, handleCopy, copiedId, selectedKey, setSelectedKey, activeTab, setActiveTab, loading, unlockedSpecial, onUnlockSpecial }: any) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const itemsPerPage = 12;

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
    const matchesTab = activeTab === 'active' 
      ? (key.status === 'online' || key.status === 'unstable')
      : (key.status === 'offline');
    
    const matchesCountry = !selectedCountry || key.location.startsWith(selectedCountry);
    
    return matchesTab && matchesCountry;
  });

  const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredKeys.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCountry]);

  return (
    <main className="relative pt-40 md:pt-64 pb-32 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="fixed inset-0 brutal-grid-bg pointer-events-none" />
      
      {/* Neo-Brutalist Hero */}
      <section className="mb-24 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-block bg-accent-tertiary text-white border-[3px] border-brutal-black px-6 py-2 font-black uppercase tracking-widest mb-8 -rotate-2">
            Next Gen VLESS Sharing
          </div>
          <h1 className="text-6xl md:text-9xl font-black mb-8 tracking-tighter leading-[0.85]">
            Свобода <br /> 
            <span className="bg-accent-primary px-4 py-2 border-[4px] border-brutal-black inline-block mt-4 rotate-1">в каждом ключе.</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto leading-tight">
            Высокоскоростные VLESS конфигурации для обхода любых ограничений. 
            Безопасно, анонимно, бесплатно.
          </p>
        </motion.div>
      </section>

      {/* Maintenance Banner - Neo-Brutalist */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-32 brutal-card p-8 md:p-16 bg-accent-primary relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white border-[4px] border-brutal-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-3">
            <Calendar className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="bg-brutal-black text-white inline-block px-4 py-1 font-black uppercase tracking-widest mb-4">Maintenance Schedule</div>
            <h2 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter leading-none">
              Сервера будут <br /> <span className="bg-white px-4 border-[3px] border-brutal-black">31.03.2026 16:00</span>
            </h2>
            <p className="text-brutal-black font-bold text-lg md:text-xl max-w-xl">
              Мы проводим глобальное обновление инфраструктуры для повышения стабильности и скорости.
            </p>
          </div>
        </div>
      </motion.div>

      {keys.length > 0 && (
        <div className="space-y-16">
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex gap-4 p-2 bg-white border-[3px] border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button 
                onClick={() => setActiveTab('active')}
                className={`brutal-pill ${activeTab === 'active' ? 'active' : 'hover:bg-accent-secondary/10'}`}
              >
                Активные
              </button>
              <button 
                onClick={() => setActiveTab('inactive')}
                className={`brutal-pill ${activeTab === 'inactive' ? 'active' : 'hover:bg-accent-secondary/10'}`}
              >
                Неактивные
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="brutal-btn-secondary flex items-center gap-4"
              >
                <Globe className="w-5 h-5" />
                <span>{selectedCountry || 'Все страны'}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-4 w-64 bg-white border-[3px] border-brutal-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 z-50"
                  >
                    <button
                      onClick={() => { setSelectedCountry(null); setIsFilterOpen(false); }}
                      className="w-full text-left px-4 py-3 font-bold hover:bg-accent-primary transition-colors border-b-2 border-brutal-black last:border-0"
                    >
                      Все страны
                    </button>
                    {countries.map((country: any) => (
                      <button
                        key={country}
                        onClick={() => { setSelectedCountry(country); setIsFilterOpen(false); }}
                        className="w-full text-left px-4 py-3 font-bold hover:bg-accent-primary transition-colors border-b-2 border-brutal-black last:border-0"
                      >
                        {country}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="bento-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : currentItems.length > 0 ? (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bento-grid"
              >
                {currentItems.map((key: any, index: number) => (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`brutal-card p-8 group ${key.status === 'offline' ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 border-[3px] border-brutal-black bg-accent-primary flex items-center justify-center group-hover:bg-accent-secondary group-hover:text-white transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Globe className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {key.isSpecial && <span className="bg-accent-tertiary text-white border-2 border-brutal-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">SPECIAL</span>}
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{key.protocol}</span>
                      </div>
                    </div>

                    <h3 className="text-3xl font-black mb-1 tracking-tighter">{key.name}</h3>
                    <p className="font-bold opacity-40 text-sm mb-8">{key.location}</p>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
                        <span className="opacity-40">Status</span>
                        <span className={key.status === 'online' ? 'text-emerald-600' : 'text-rose-600'}>{key.status}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
                        <span className="opacity-40">Expiry</span>
                        <span>{key.expiryDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => handleCopy(key.id, key.config)}
                        className="flex-1 brutal-btn text-xs"
                      >
                        {copiedId === key.id ? 'Copied' : 'Copy Key'}
                      </button>
                      <button
                        onClick={() => handleShare(key)}
                        className="w-14 h-14 brutal-btn-secondary flex items-center justify-center p-0"
                      >
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center brutal-card bg-white"
              >
                <div className="w-24 h-24 bg-accent-tertiary/10 border-[3px] border-brutal-black flex items-center justify-center mx-auto mb-8 rotate-3">
                  <AlertTriangle className="w-12 h-12 text-accent-tertiary" />
                </div>
                <h3 className="text-4xl font-black mb-2 tracking-tighter">Серверов пока нет</h3>
                <p className="font-bold opacity-40">Ожидайте обновления 31 марта.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Password Prompt Modal - Neo-Brutalist */}
      <AnimatePresence>
        {showPasswordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brutal-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="brutal-card p-8 md:p-12 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-tertiary" />
              
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-tertiary border-[3px] border-brutal-black flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter">Доступ ограничен</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setPassword('');
                    setPasswordError(false);
                  }}
                  className="p-2 hover:bg-accent-tertiary/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="font-bold opacity-60 mb-8 leading-tight">
                Этот сервер является специальным. Для получения доступа к конфигурации необходимо ввести пароль.
              </p>

              <div className="space-y-6">
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
                    className={`w-full bg-bg-main border-[3px] ${passwordError ? 'border-rose-500' : 'border-brutal-black'} px-6 py-4 font-bold focus:outline-none focus:bg-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
                    autoFocus
                  />
                  {passwordError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-rose-600 mt-3 font-black uppercase tracking-widest"
                    >
                      Неверный пароль
                    </motion.p>
                  )}
                </div>

                <button
                  onClick={checkPassword}
                  className="w-full brutal-btn"
                >
                  Разблокировать
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-32 py-12 border-t-[3px] border-brutal-black flex flex-col md:flex-row justify-between items-center gap-6 font-black uppercase tracking-widest text-xs">
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
      description: 'Современный кроссплатформенный клиент с открытым исходным кодом.',
      tutorial: 'Установите пакет для вашего дистрибутива. Скопируйте ключ, в приложении выберите "Add from Clipboard".',
      link: 'https://karing.app'
    }
  ];

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-40 md:pt-64 pb-32 px-6 max-w-5xl mx-auto min-h-screen"
    >
      <div className="fixed inset-0 brutal-grid-bg pointer-events-none" />
      
      <div className="text-center mb-24 relative">
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6">Как подключиться?</h1>
        <div className="inline-block bg-accent-primary border-[3px] border-brutal-black px-6 py-2 font-black uppercase tracking-widest -rotate-1">
          Простая инструкция для всех устройств
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="brutal-card p-8 md:p-12 bg-white"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-accent-secondary border-[3px] border-brutal-black flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <platform.icon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{platform.name}</h3>
                <span className="bg-accent-tertiary text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-brutal-black">{platform.app}</span>
              </div>
            </div>

            <p className="font-bold opacity-60 mb-8 leading-tight">{platform.description}</p>
            
            <div className="bg-bg-main border-[3px] border-brutal-black p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="flex items-center gap-2"><Info className="w-4 h-4" /> Шаги:</span>
              </h4>
              <p className="text-sm font-bold leading-tight opacity-80">{platform.tutorial}</p>
            </div>

            <a 
              href={platform.link}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn w-full flex items-center justify-center gap-3"
            >
              Скачать клиент <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        ))}
      </div>
    </motion.main>
  );
}

function UpdatesPage() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-40 md:pt-64 pb-32 px-6 max-w-4xl mx-auto min-h-screen"
    >
      <div className="fixed inset-0 brutal-grid-bg pointer-events-none" />
      
      <div className="text-center mb-20 relative">
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6">История обновлений</h1>
        <div className="inline-block bg-accent-secondary text-white border-[3px] border-brutal-black px-6 py-2 font-black uppercase tracking-widest rotate-1">
          Следите за развитием VLESSFREE
        </div>
      </div>

      <div className="space-y-12 relative">
        {UPDATES.map((update, index) => (
          <motion.div
            key={update.version}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="brutal-card p-8 md:p-12 bg-white"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-accent-primary border-[3px] border-brutal-black flex items-center justify-center text-brutal-black font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {update.version}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter">Версия {update.version}</h3>
                  <p className="text-brutal-black/40 text-xs uppercase tracking-widest font-black">{update.date}</p>
                </div>
              </div>
            </div>

            <ul className="space-y-4">
              {update.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-4 font-bold text-brutal-black/70 leading-tight">
                  <div className="w-2.5 h-2.5 bg-accent-tertiary border-2 border-brutal-black mt-1.5 shrink-0" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </motion.main>
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
    <main className="relative pt-40 md:pt-64 pb-32 px-6 max-w-5xl mx-auto min-h-screen">
      <div className="fixed inset-0 brutal-grid-bg pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-24 relative"
      >
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-white border-[3px] border-brutal-black px-4 py-2 font-black uppercase tracking-widest text-[10px] hover:bg-accent-primary transition-colors mb-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Назад к серверам
        </Link>
        <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter">Спец Папка</h2>
        <div className="inline-block bg-accent-tertiary text-white border-[3px] border-brutal-black px-6 py-2 font-black uppercase tracking-widest rotate-1">
          Эксклюзивные конфигурации VLESS
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
        {specialFolder.subKeys.map((sub: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="brutal-card p-8 md:p-12 bg-white group"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 border-[3px] border-brutal-black bg-accent-primary flex items-center justify-center group-hover:bg-accent-secondary group-hover:text-white transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Globe className="w-8 h-8" />
              </div>
              <div className="bg-accent-tertiary text-white border-[3px] border-brutal-black px-4 py-1 font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                PREMIUM
              </div>
            </div>

            <h3 className="text-3xl font-black mb-2 tracking-tighter">{sub.name}</h3>
            <p className="font-bold opacity-40 text-sm mb-12">{sub.location}</p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleCopy(`special-${idx}`, sub.config)}
                className={`w-full brutal-btn ${copiedId === `special-${idx}` ? 'bg-emerald-500 text-white' : ''}`}
              >
                {copiedId === `special-${idx}` ? 'Скопировано' : 'Копировать ключ'}
              </button>
              <button
                onClick={() => handleShare(sub)}
                className="w-full brutal-btn-secondary flex items-center justify-center gap-3"
              >
                <Share2 className="w-5 h-5" /> Поделиться
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
          className="mt-20 brutal-card p-12 bg-accent-primary text-center rotate-1"
        >
          <p className="text-xl font-black uppercase tracking-[0.2em] animate-pulse">
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
      className="fixed inset-0 z-[300] bg-bg-main flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="fixed inset-0 brutal-grid-bg pointer-events-none" />
      <div className="text-8xl mb-12 rotate-12">⏳</div>
      <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
        Не загружается?
      </h1>
      <p className="font-black uppercase tracking-widest opacity-40 mb-12 max-w-xs">
        Попробуй тогда это зеркало
      </p>
      <a 
        href="https://vlessfree-djif23janskdq21.vercel.app/"
        className="brutal-btn text-xl"
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
      className="fixed inset-0 z-[200] bg-bg-main flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="fixed inset-0 brutal-grid-bg pointer-events-none" />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-12">
          <motion.div
            animate={{ 
              rotate: [0, 90, 180, 270, 360],
              x: [0, 10, 0, -10, 0],
              y: [0, -10, 0, 10, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="w-24 h-24 bg-accent-primary border-[4px] border-brutal-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center"
          >
            <Zap className="w-12 h-12 text-brutal-black" />
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            VlessFree
          </h1>
          <div className="flex gap-3">
            <div className="w-4 h-4 bg-accent-primary border-2 border-brutal-black animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-4 h-4 bg-accent-secondary border-2 border-brutal-black animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-4 h-4 bg-accent-tertiary border-2 border-brutal-black animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="bg-brutal-black text-white px-6 py-2 font-black uppercase tracking-[0.3em] text-[10px] -rotate-1">
          Загрузка конфигураций...
        </div>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const [keys] = useState<VlessKey[]>(MOCK_KEYS);
  const [copiedId, setCopiedId] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [selectedKey, setSelectedKey] = useState<VlessKey | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(true);
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

    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Show mirror suggestion if loading takes too long (e.g. 10 seconds)
    const mirrorTimer = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          setShowMirror(true);
        }
        return prev;
      });
    }, 10000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('is-iphone');
      clearTimeout(timer);
      clearTimeout(mirrorTimer);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleCopy = (id: any, config: string) => {
    navigator.clipboard.writeText(config);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-accent-primary selection:text-brutal-black">
      <Header scrolled={scrolled} />
      
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={
            <HomePage 
              keys={keys} 
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
        </Routes>
      </AnimatePresence>

      <BottomNav />

      {/* Modals with Neo-Brutalist design */}
      <AnimatePresence>
        {showModal && location.pathname === '/' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brutal-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full brutal-card p-12 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-accent-primary" />
              <div className="text-6xl mb-8 rotate-12">⚠️</div>
              <h2 className="text-4xl font-black mb-4 tracking-tighter">Технические работы</h2>
              <p className="font-bold opacity-60 leading-tight mb-10">
                Мы обновляем сервера. Они будут доступны 31.03.2026 в 16:00.
              </p>
              <button 
                onClick={() => setShowModal(false)}
                className="w-full brutal-btn"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brutal-black/40 backdrop-blur-sm"
            onClick={() => setSelectedKey(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full brutal-card p-12 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedKey(null)}
                className="absolute top-6 right-6 w-10 h-10 border-[3px] border-brutal-black bg-white flex items-center justify-center hover:bg-accent-tertiary hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-16 h-16 border-[3px] border-brutal-black bg-accent-primary flex items-center justify-center mb-8 text-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Globe className="w-8 h-8" />
              </div>

              <h2 className="text-4xl font-black mb-2 tracking-tighter selectable">
                {selectedKey.name}
              </h2>
              <p className="font-bold opacity-40 text-sm mb-10 selectable">{selectedKey.location}</p>

              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center py-4 border-b-[3px] border-brutal-black">
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-40">Протокол</span>
                  <span className="text-sm font-mono font-bold selectable">{selectedKey.protocol}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b-[3px] border-brutal-black">
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-40">Активен до</span>
                  <span className="text-sm font-mono font-bold selectable">{selectedKey.expiryDate}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b-[3px] border-brutal-black">
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-40">Статус</span>
                  <span className={`text-sm font-black flex items-center gap-2 ${
                    selectedKey.status === 'online' ? 'text-emerald-600' : 
                    selectedKey.status === 'unstable' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    <div className={`w-2 h-2 border-2 border-brutal-black animate-pulse ${
                      selectedKey.status === 'online' ? 'bg-emerald-500' : 
                      selectedKey.status === 'unstable' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    {selectedKey.status === 'online' ? 'Online' : 
                     selectedKey.status === 'unstable' ? 'Нестабильный' : 'Offline'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handleCopy(selectedKey.id, selectedKey.config)}
                className={`w-full brutal-btn ${
                  copiedId === selectedKey.id ? 'bg-emerald-500 text-white' : ''
                }`}
              >
                {copiedId === selectedKey.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copiedId === selectedKey.id ? 'Скопировано' : 'Копировать ключ'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
