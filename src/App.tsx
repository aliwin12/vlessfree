/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, Shield, Globe, Copy, Check, RefreshCw, Zap, Cpu, Lock, Activity, Calendar, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
}

const MOCK_KEYS: VlessKey[] = [
  {
    id: 1,
    name: 'Первый сервер',
    location: 'Швеция',
    protocol: 'VLESS',
    latency: '0ms',
    load: 0,
    config: 'vless://5231b5bb-8fc7-48bb-bf33-72a6b92fa0d3@se-arn-3.blook.network:443?flow=xtls-rprx-vision&fp=chrome&pbk=7SoBLgSMueqCkQCm6c2CeJFWrS9OSYE4Wx1-77zA1h0&security=reality&sid=78c5fac2&sni=se-arn-3.blook.network&spx=%2F&type=tcp#%F0%9F%87%B8%F0%9F%87%AA%20%D0%A8%D0%B2%D0%B5%D1%86%D0%B8%D1%8F%203',
    expiryDate: '20.03.2026',
  }
];

export default function App() {
  const [keys] = useState<VlessKey[]>(MOCK_KEYS);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopy = (id: number, config: string) => {
    navigator.clipboard.writeText(config);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-white selection:text-black">
      <AnimatePresence>
        {showModal && (
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
      </AnimatePresence>

      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4 glass border-b' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <img 
                src="/src/logo.png" 
                alt="vlessfree logo" 
                className="w-full h-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <img 
              src="/src/logotext.png" 
              alt="vlessfree" 
              className="h-8 md:h-10 w-auto object-contain glow-text"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </header>

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

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keys.map((key, index) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="glass rounded-3xl p-8 group hover:border-white/30 transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-500">
                  <Globe className="w-6 h-6" />
                </div>
              </div>

              <h3 className="text-2xl font-serif italic mb-2">{key.name}</h3>
              <p className="text-sm text-white/40 mb-6">{key.location}</p>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-30 mb-8">
                <Calendar className="w-3 h-3" />
                <span>Активен до: {key.expiryDate}</span>
              </div>

              <button
                onClick={() => handleCopy(key.id, key.config)}
                className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                  copiedId === key.id 
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
        </div>

        {/* Footer */}
        <footer className="mt-32 py-12 border-t border-white/10 flex justify-between items-center opacity-40 text-[10px] uppercase tracking-[0.2em] font-bold">
          <div className="flex items-center gap-2">
            © 2026 
            <img 
              src="/src/logotext.png" 
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
    </div>
  );
}
