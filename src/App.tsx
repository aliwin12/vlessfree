/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, Shield, Globe, Copy, Check, RefreshCw, Zap, Cpu, Lock, Activity, Calendar, X, AlertTriangle, Monitor, Smartphone, Terminal, Info, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

const TARGET_DATE = new Date('2026-03-18T07:00:00');

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = TARGET_DATE.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-4 justify-center items-center font-mono text-2xl md:text-3xl tracking-tighter">
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[10px] uppercase opacity-40 tracking-widest">дн</span>
      </div>
      <span className="opacity-20">:</span>
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[10px] uppercase opacity-40 tracking-widest">ч</span>
      </div>
      <span className="opacity-20">:</span>
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[10px] uppercase opacity-40 tracking-widest">мин</span>
      </div>
      <span className="opacity-20">:</span>
      <div className="flex flex-col items-center">
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[10px] uppercase opacity-40 tracking-widest">сек</span>
      </div>
    </div>
  );
}

interface VlessKey {
  id: number;
  name: string;
  location: string;
  protocol: string;
  latency: string;
  config: string;
  load: number;
  expiryDate: string;
  status?: 'online' | 'unstable' | 'offline';
  reason?: string;
}

const MOCK_KEYS: VlessKey[] = [
  {
    id: 1,
    name: 'Первый сервер',
    location: '🇸🇪 Швеция',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://5231b5bb-8fc7-48bb-bf33-72a6b92fa0d3@se-arn-3.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=7SoBLgSMueqCkQCm6c2CeJFWrS9OSYE4Wx1-77zA1h0&security=reality&sid=78c5fac2&sni=se-arn-3.blook.network&spx=%2F&type=tcp#%F0%9F%87%B8%F0%9F%87%AA%20%D0%A8%D0%B2%D0%B5%D1%86%D0%B8%D1%8F%203',
    expiryDate: '20.03.2026',
    status: 'online',
  },
  {
    id: 2,
    name: 'Server №2',
    location: '🇵🇱 Польша, Варшава',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://5b9eb611-8b7b-4d06-8d3f-b7df5c84f9e0@pl-waw-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=q1GJ-cUUd4FGu0ZfsXosBvyzbJmpRHrZYMidWhAqMQI&security=reality&sid=578dc0c4&sni=pl-waw-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%B5%F0%9F%87%B1%20%D0%9F%D0%BE%D0%BB%D1%8C%D1%88%D0%B0%201',
    expiryDate: '20.03.2026',
    status: 'online',
  },
  {
    id: 3,
    name: 'Server №3',
    location: '🇧🇷 Бразилия, Сан-Паулу',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://9d1d67f4-8d61-4c45-a42d-5de6aed3d38f@br-gru-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=GYqQl8suX6lgrJZ27CkhMwtxmDGkd45QxKBJGaHUgQM&security=reality&sid=7cc366b3&sni=br-gru-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%A7%F0%9F%87%B7%20%D0%91%D1%80%D0%B0%D0%B7%D0%B8%D0%BB%D0%B8%D1%8F%201',
    expiryDate: '20.03.2026',
    status: 'online',
  },
  {
    id: 4,
    name: 'Server №4',
    location: '🇨🇾 Кипр',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://8dc7722c-2767-4eea-a28b-2f8daacc07e3@pqh29v4.globalfymain.com:8880?encryption=none&security=none&type=grpc#Republic of Cyprus%201089%20/%20VlessKey.com%20/%20t.me/VlessVpnFree',
    expiryDate: 'Неизвестно',
    status: 'unstable',
  },
  {
    id: 5,
    name: 'Server №5',
    location: '🇲🇩 Молдова, Кишинёв',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://ef4fecc9-9af1-4b18-8f2c-8e3df89f7ea5@md-kiv-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=rc7lXHj8W1qb-DhJzxTQPJ3TL9IAKkc4kqXCfCsRlXo&security=reality&sid=237e0856&sni=md-kiv-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%B2%F0%9F%87%A9%20%D0%9C%D0%BE%D0%BB%D0%B4%D0%BE%D0%B2%D0%B0%201',
    expiryDate: '20.03.2026',
    status: 'online',
  },
  {
    id: 6,
    name: 'Server №6',
    location: '🇰🇿 Казахстан, Алматы',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://aeed5327-8b56-4089-a18c-fcca6d17d2d6@kz-ala-2.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=1qOetCE3B75XXzhHHF-0Y2fXEROUWY6gA0REH6tc8FM&security=reality&sid=6966f5d4&sni=kz-ala-2.blook.network&spx=%2F&type=tcp#%F0%9F%87%B0%F0%9F%87%BF%20%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD%202',
    expiryDate: '20.03.2026',
    status: 'online',
  },
  {
    id: 7,
    name: 'Server №7',
    location: '🇳🇬 Нигерия, Лагос',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://0b27cea6-53e7-46f9-a21d-2eea1f9f607b@ng-los-1.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=bnOJ_uKtqdg94h0Jt3cGJJAnXhW-UAdWKZBfbiaT9ho&security=reality&sid=3c642112&sni=ng-los-1.blook.network&spx=%2F&type=tcp#%F0%9F%87%B3%F0%9F%87%AC%20%D0%9D%D0%B8%D0%B3%D0%B5%D1%80%D0%B8%D1%8F%201',
    expiryDate: '20.03.2026',
    status: 'online',
  },
  {
    id: 8,
    name: 'Server №8',
    location: '🇬🇧 Великобритания, Лондон',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://35e9c5d8-6d91-41d3-9587-585150c50936@uk-lhr-2.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=p0MkIIxkklgPs4vJJP5Qp9RxdqgMnjmgoIt5t8g6uSU&security=reality&sid=794dbecd&sni=uk-lhr-2.blook.network&spx=%2F&type=tcp#%F0%9F%87%AC%F0%9F%87%A7%20%D0%92%D0%B5%D0%BB%D0%B8%D0%BA%D0%BE%D0%B1%D1%80%D0%B8%D1%82%D0%B0%D0%BD%D0%B8%D1%8F%202',
    expiryDate: '20.03.2026',
    status: 'online',
  }
];

function Header({ scrolled }: { scrolled: boolean }) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4 glass border-b' : 'py-8 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 relative flex justify-center items-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 flex items-center justify-center rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]">
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
            className="h-8 md:h-10 w-auto object-contain glow-text"
            referrerPolicy="no-referrer"
          />
        </Link>
        
        <Link 
          to="/how-to-use" 
          className="absolute right-6 px-4 py-2 rounded-xl bg-white/5 hover:bg-white hover:text-black text-[10px] uppercase tracking-widest font-bold transition-all duration-300 border border-white/10"
        >
          Как установить VPN
        </Link>
      </div>
    </header>
  );
}

function HomePage({ keys, handleCopy, copiedId, selectedKey, setSelectedKey, activeTab, setActiveTab }: any) {
  const filteredKeys = keys.filter((key: any) => {
    if (activeTab === 'active') return key.status === 'online' || key.status === 'unstable';
    return key.status === 'offline';
  });

  return (
    <main className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-7xl font-serif italic mb-4 tracking-tighter leading-tight">
            Ключи для <br /> 
            <span className="text-white/40">свободного интернета.</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/40 font-serif italic tracking-tight">
            Актуальные ключи VLESS
          </p>
        </motion.div>
      </section>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-12">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-8 py-3 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
            activeTab === 'active' 
            ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
            : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Активные
        </button>
        <button 
          onClick={() => setActiveTab('inactive')}
          className={`px-8 py-3 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
            activeTab === 'inactive' 
            ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.1)]' 
            : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Неактивные
        </button>
      </div>

      {/* Nodes Grid / Empty State */}
      <AnimatePresence mode="wait">
        {filteredKeys.length > 0 ? (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredKeys.map((key: any, index: number) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`glass rounded-3xl p-8 group hover:border-white/30 transition-all duration-500 ${key.status === 'offline' ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-500 ${key.status === 'offline' ? 'bg-rose-500/10 text-rose-500' : ''}`}>
                    <Globe className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => setSelectedKey(key)}
                    className="text-[10px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 transition-opacity"
                  >
                    Подробнее
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-serif italic tracking-tight">{key.name}</h3>
                  {key.status === 'unstable' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] uppercase tracking-widest font-bold border border-amber-500/20">
                      Нестабильный
                    </span>
                  )}
                  {key.status === 'offline' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] uppercase tracking-widest font-bold border border-rose-500/20">
                      Отключен
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/40 mb-6">{key.location}</p>

                {key.reason && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 mb-6">
                    <p className="text-[10px] text-rose-500/60 uppercase tracking-widest font-bold mb-1">Причина:</p>
                    <p className="text-xs text-rose-500/80">{key.reason}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-30 mb-8">
                  <Calendar className="w-3 h-3" />
                  <span>Активен до: {key.expiryDate}</span>
                </div>

                <button
                  onClick={() => handleCopy(key.id, key.config)}
                  disabled={key.status === 'offline'}
                  className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                    key.status === 'offline'
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : copiedId === key.id 
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-white/5 hover:bg-white hover:text-black'
                  }`}
                >
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
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
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
            <h3 className="text-2xl font-serif italic mb-2">
              {activeTab === 'active' ? 'Нет активных серверов' : 'Нет неактивных серверов'}
            </h3>
            <p className="text-white/30 text-sm">
              {activeTab === 'active' ? 'Пожалуйста, подождите обновления списка.' : 'Все доступные узлы работают в штатном режиме.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-32 py-12 border-t border-white/10 flex justify-between items-center opacity-40 text-[10px] uppercase tracking-[0.2em] font-bold">
        <div className="flex items-center gap-2">
          © 2026 
          <img 
            src="https://s10.iimage.su/s/17/gW7gsFfxcyoojRD4cNLejI21W6YZc62Ieh9AfziAL.png" 
            alt="vlessfree" 
            className="h-4 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-right">
          Сайт может обновляться раз в два дня
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
    <main className="relative pt-40 pb-20 px-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 text-center"
      >
        <h2 className="text-5xl md:text-6xl font-serif italic mb-6 tracking-tighter">
          Как установить <br />
          <span className="text-white/40">и настроить VPN.</span>
        </h2>
        <p className="text-white/40 max-w-2xl mx-auto leading-relaxed">
          Следуйте инструкциям ниже для вашей операционной системы. Мы подобрали лучшие приложения для работы с нашими ключами.
        </p>
      </motion.div>

      <div className="grid gap-8">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start hover:border-white/20 transition-all duration-500"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
              <platform.icon className="w-8 h-8" />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h3 className="text-2xl font-serif italic tracking-tight">{platform.name}</h3>
                <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-widest font-bold">
                  {platform.app}
                </span>
              </div>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                {platform.description}
              </p>
              
              <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-30 mb-4">
                  <Info className="w-3 h-3" />
                  <span>Инструкция</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  {platform.tutorial}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a 
                  href={platform.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-[10px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" /> Скачать приложение
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 p-10 glass rounded-[40px] text-center border-white/10">
        <h3 className="text-2xl font-serif italic mb-4">Остались вопросы?</h3>
        <p className="text-white/40 text-sm mb-8">
          Если у вас возникли трудности с настройкой, попробуйте поискать видео-туториалы по названию приложения на YouTube.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
        >
          Вернуться к списку серверов <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}

function AppContent() {
  const [keys] = useState<VlessKey[]>(MOCK_KEYS);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [selectedKey, setSelectedKey] = useState<VlessKey | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleCopy = (id: number, config: string) => {
    navigator.clipboard.writeText(config);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-white selection:text-black">
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
              className="relative max-w-lg w-full glass rounded-[40px] p-8 md:p-12 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
              
              <div className="text-6xl mb-6">⚠️</div>
              
              <h2 className="text-3xl md:text-4xl font-serif italic mb-4 tracking-tighter">
                Ещё доделываем
              </h2>
              
              <p className="text-white/50 leading-relaxed mb-10 text-sm md:text-base">
                Доделываю ещё сайт и сервера ищу нормальные, так что будет мало серверов в первое время
              </p>

              <div className="glass bg-white/5 rounded-3xl p-8 mb-4">
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 mb-6">
                  До переноса номера в т2
                </div>
                <CountdownTimer />
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
              className="relative max-w-lg w-full glass rounded-[40px] p-8 md:p-12 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedKey(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-8">
                <Globe className="w-8 h-8" />
              </div>

              <h2 className="text-3xl font-serif italic mb-2 tracking-tighter">
                {selectedKey.name}
              </h2>
              <p className="text-white/40 mb-8">{selectedKey.location}</p>

              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">Протокол</span>
                  <span className="text-sm font-mono">{selectedKey.protocol}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">Активен до</span>
                  <span className="text-sm font-mono">{selectedKey.expiryDate}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">Статус</span>
                  <span className={`text-sm flex items-center gap-2 ${
                    selectedKey.status === 'online' ? 'text-emerald-500' : 
                    selectedKey.status === 'unstable' ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
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
                className={`w-full py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  copiedId === selectedKey.id 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white text-black'
                }`}
              >
                {copiedId === selectedKey.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedId === selectedKey.id ? 'Скопировано' : 'Копировать ключ'}
              </button>
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

      <Routes>
        <Route path="/" element={
          <HomePage 
            keys={keys} 
            handleCopy={handleCopy} 
            copiedId={copiedId} 
            selectedKey={selectedKey} 
            setSelectedKey={setSelectedKey} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
        } />
        <Route path="/how-to-use" element={<HowToUsePage />} />
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
