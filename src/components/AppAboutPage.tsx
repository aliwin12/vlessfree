import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Download, Shield, Zap, Smartphone, RefreshCw, 
  CheckCircle, Cpu, Calendar, ShieldCheck, Heart, AppWindow, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { db, doc, getDoc } from '../lib/firebase';

export default function AppAboutPage() {
  const [appVersion, setAppVersion] = useState<string>('v0.1');
  const [loadingVersion, setLoadingVersion] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Fetch the latest version from the database
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const docRef = doc(db, 'settings', 'versionsandroid');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && typeof data.value === 'string') {
            // Pick out the version portion (e.g. from "v0.1 ok" we extract "v0.1")
            const cleanVer = data.value.split(' ')[0] || 'v0.1';
            setAppVersion(cleanVer);
          }
        }
      } catch (error) {
        console.error("Error fetching native app version:", error);
      } finally {
        setLoadingVersion(false);
      }
    };
    fetchVersion();
  }, []);

  const handleDownloadClick = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Top Background Image Banner - Fading seamlessly to 100% transparent/black around middle page */}
      <div className="absolute top-0 inset-x-0 h-[65vh] min-h-[420px] md:h-[75vh] -z-10 pointer-events-none overflow-hidden select-none">
        <img 
          src="https://i.ibb.co/4RB585kR/2026-05-31-164833.png" 
          alt="App background" 
          className="w-full h-full object-cover object-top opacity-50 sm:opacity-60 md:opacity-75"
          referrerPolicy="no-referrer"
        />
        {/* Transparent gradient fading to black */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/0 via-[#050505]/40 to-[#050505] z-10" />
        <div className="absolute inset-0 bg-[#050505]/10 backdrop-blur-[2px] z-0" />
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 pb-24 relative z-20">
        
        {/* Navigation & Header Controls */}
        <div className="flex justify-between items-center mb-12 sm:mb-20">
          <Link 
            to="/" 
            className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white hover:text-black transition-all duration-300 border border-white/10 text-xs uppercase tracking-widest font-bold"
            id="back-home-button"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Назад на сайт
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold font-mono">
              App Status: Live
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 uppercase tracking-wider"
          >
            <Smartphone className="w-4 h-4" />
            Официальный android-клиент
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent"
          >
            Приложение vlessfree
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            Забудьте о ручном копировании ключей. Наш легкий, быстрый и абсолютно бесплатный клиент обеспечит авто-обновление серверов в одно нажатие прямо на вашем смартфоне.
          </motion.p>
        </div>

        {/* Primary Download and Version Module */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch mb-20">
          
          {/* Main Custom App Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-7 bg-white/[0.03] border border-white/10 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]"
            id="download-primary-card"
          >
            {/* Ambient inner glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-500" />
            
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block">Текущая версия</span>
                  <span className="text-xl font-bold font-mono text-indigo-400">
                    {loadingVersion ? '...' : appVersion}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Скачать официальный APK</h2>
              <p className="text-sm text-white/50 mb-8 leading-relaxed">
                Полнофункциональное, легкое приложение со встроенным списком серверов и автоматическим обновлением конфигураций. Установите и подключитесь за 5 секунд.
              </p>
            </div>

            <div className="space-y-4">
              <a 
                href="/vlessfree.apk" // Point directly to the uploaded file in public/vlessfree.apk
                download="vlessfree.apk"
                onClick={handleDownloadClick}
                className="w-full inline-flex items-center justify-center gap-3 py-4 sm:py-5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5 animate-bounce" />
                Скачать установщик (.apk)
              </a>

              <AnimatePresence>
                {downloadSuccess && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-xs text-indigo-300 font-medium font-mono"
                  >
                    🚀 Нажмите на файл в загрузках вашего телефона для запуска установки.
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center text-[10px] text-white/30 uppercase tracking-wider font-mono pt-4 border-t border-white/5">
                <span>Размер: ~18 MB</span>
                <span>Мин. версия: Android 8+</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Setup and Instructions Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-5 bg-white/[0.01] border border-white/5 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between"
            id="download-guide-card"
          >
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Как установить?
              </h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/50 shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Скачайте файл</h4>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">Нажмите кнопку «Скачать установщик» и дождитесь окончания загрузки .apk файла.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/50 shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Разрешите установку</h4>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">Если система заблокирует запуск, разрешите установку сторонних приложений в настройках вашего браузера или файлового менеджера.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white/50 shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Пользуйтесь бесплатно</h4>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">Запустите приложение, нажмите большую кнопку обновления и активируйте любое подключение напрямую.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 mt-8 md:mt-0 text-[10px] text-white/40 text-center leading-relaxed font-sans">
              Разработано специально для мгновенного доступа к VLESS ключам в обход ручной вставки.
            </div>
          </motion.div>

        </div>

        {/* Alternative v2rayNG Client Section */}
        <div className="bg-white/[0.01] border border-white/5 rounded-[32px] p-8 md:p-12">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-semibold uppercase tracking-wider">
                <AppWindow className="w-4 h-4" />
                Альтернативный способ
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">Использовать клиент v2rayNG</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Если вы предпочитаете использовать стандартное проверенное временем приложение v2rayNG, вы можете скачать его напрямую и импортировать наши ключи вручную.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <a 
                href="https://play.google.com/store/apps/details?id=com.v2ray.ang" 
                target="_blank" 
                rel="noreferrer"
                className="py-3.5 px-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                Play Store
              </a>
              <a 
                href="https://github.com/2dust/v2rayNG/releases" 
                target="_blank" 
                rel="noreferrer"
                className="py-3.5 px-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                GitHub APK
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
