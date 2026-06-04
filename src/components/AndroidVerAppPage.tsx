import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, Shield, Globe, Copy, Check, RefreshCw, Zap, Cpu, Lock, 
  Activity, Calendar, X, AlertTriangle, Monitor, Smartphone, 
  Terminal, Info, ChevronRight, Download, ExternalLink, Menu, 
  Share2, Folder, ChevronDown, Bell, Plus, Send, ShieldAlert,
  ArrowRight, Heart, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { db, collection, query, orderBy, onSnapshot, handleFirestoreError, OperationType, addDoc, serverTimestamp, getDocs, where, doc, getDoc } from '../lib/firebase';
import { VlessKey } from '../data/keys';

const COUNTRY_FLAGS: Record<string, string> = {
  'NL': '🇳🇱', 'DE': '🇩🇪', 'FI': '🇫🇮', 'US': '🇺🇸', 
  'UK': '🇬🇧', 'GB': '🇬🇧', 'MD': '🇲🇩', 'IN': '🇮🇳', 'KZ': '🇰🇿', 
  'RU': '🇷🇺', 'SE': '🇸🇪', 'TR': '🇹🇷', 'JP': '🇯🇵', 'BR': '🇧🇷'
};

const COUNTRY_NAMES: Record<string, string> = {
  'NL': 'Нидерланды', 'DE': 'Германия', 'FI': 'Финляндия', 'US': 'США', 
  'UK': 'Великобритания', 'MD': 'Молдова', 'IN': 'Индия', 'KZ': 'Казахстан', 
  'RU': 'Россия', 'SE': 'Швеция', 'TR': 'Турция', 'JP': 'Япония', 'BR': 'Бразилия'
};

export default function AndroidVerAppPage() {
  const [keys, setKeys] = useState<VlessKey[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'servers' | 'exports' | 'guides' | 'report'>('servers');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Get version from URL parameters and compare with setting.
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [versionStatus, setVersionStatus] = useState<'checking' | 'up_to_date' | 'outdated' | 'no_version'>('checking');

  // Custom toast notification helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Silent check of the version of the Android app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ver = params.get('v') || params.get('version') || params.get('app_version') || params.get('ver');
    if (ver) {
      setAppVersion(ver);
      
      const checkVersion = async () => {
        try {
          const docRef = doc(db, 'settings', 'versionsandroid');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && typeof data.value === 'string') {
              const latest = data.value.trim();
              setLatestVersion(latest);
              
              // Normalize and compare
              const cleanApp = ver.toLowerCase().replace(/[^0-9.]/g, '');
              const cleanLatest = latest.toLowerCase().replace(/[^0-9.]/g, '');
              
              if (cleanApp && cleanLatest && cleanApp === cleanLatest) {
                setVersionStatus('up_to_date');
              } else {
                setVersionStatus('outdated');
              }
            } else {
              setVersionStatus('no_version');
            }
          } else {
            setVersionStatus('no_version');
          }
        } catch (error) {
          console.error("Error silently checking app version:", error);
          setVersionStatus('no_version');
        }
      };
      
      checkVersion();
    } else {
      setVersionStatus('no_version');
    }
  }, []);

  // Report Form States
  const [reportServerId, setReportServerId] = useState('');
  const [reportReason, setReportReason] = useState('not_working');
  const [reportDesc, setReportDesc] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Load servers from Firebase
  useEffect(() => {
    const q = query(collection(db, 'servers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        const baseLocation = COUNTRY_NAMES[data.country] || data.country;
        const location = data.city ? `${baseLocation}, ${data.city}` : baseLocation;

        return { 
          id: doc.id, 
          ...data,
          location
        };
      }) as VlessKey[];

      // Sort naturally by names
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
      console.error('Failed to load servers for Android app page:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load warnings from Firebase
  useEffect(() => {
    const q = query(collection(db, 'warnings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setWarnings(docs.filter((w: any) => w.active));
    }, (error) => {
      console.error('Failed to load warnings:', error);
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (id: string | number, config: string, label: string) => {
    navigator.clipboard.writeText(config);
    setCopiedId(id);
    showToast(`Скопировано: ${label}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copySubscriptionUrl = () => {
    const subUrl = `${window.location.origin}/suball`;
    navigator.clipboard.writeText(subUrl);
    showToast('Ссылка подписки скопирована!');
  };

  const copyAllKeys = () => {
    const activeConfigs = keys
      .filter(k => k.status === 'online' || k.status === 'unstable')
      .map(k => k.config)
      .join('\n');
    
    if (activeConfigs) {
      navigator.clipboard.writeText(activeConfigs);
      showToast('Все активные доступы скопированы в буфер!');
    } else {
      showToast('Нет активных серверов для копирования.');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportServerId || isSubmittingReport) return;

    setIsSubmittingReport(true);
    try {
      const selectedServerObj = keys.find(k => k.id === reportServerId);
      const serverName = selectedServerObj?.name || 'Unknown';

      const reportData = {
        serverId: reportServerId,
        serverName,
        reason: reportReason,
        description: reportDesc,
        status: 'pending',
        createdAt: serverTimestamp(),
        userIp: 'AndroidAppWebView',
        browser: navigator.userAgent,
        country: 'By Android App',
      };

      await addDoc(collection(db, 'reports'), reportData);
      setReportSuccess(true);
      setReportDesc('');
      showToast('Отчет отправлен! Спасибо за бдительность.');
      setTimeout(() => setReportSuccess(false), 4000);
    } catch (err) {
      console.error('Error submitting report:', err);
      showToast('Не удалось отправить отчет. Попробуйте еще раз.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const activeKeys = useMemo(() => {
    return keys.filter(key => {
      // Excluded checks (same checks as standard filters)
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
      const isOnline = (key.status === 'online' || key.status === 'unstable') && !isExpired && !key.isComingSoon;
      
      if (!isOnline) return false;

      if (searchQuery) {
        const queryNorm = searchQuery.toLowerCase();
        const matchesName = key.name?.toLowerCase().includes(queryNorm);
        const matchesLocation = key.location?.toLowerCase().includes(queryNorm);
        return matchesName || matchesLocation;
      }
      return true;
    });
  }, [keys, searchQuery]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500 selection:text-white pb-32 font-sans md:px-0">
      
      {/* Background ambience overlay (optimized subtle blur) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-indigo-500/8 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-emerald-500/8 blur-[100px] rounded-full" />
      </div>

      {/* Main app content relative container to overlay on background */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 space-y-6">
        
        {/* Mobile Header Block */}
        <header className="flex items-center justify-between pb-2 border-b border-white/5">
          <Link to="/androidverapp" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative">
              <img 
                src="https://s10.iimage.su/s/17/gW7gsFfxcyoojRD4cNLejI21W6YZc62Ieh9AfziAL.png" 
                alt="vlessfree Logo" 
                className="h-8 w-auto min-w-[32px] object-contain glow-text"
              />
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-sm font-sans font-black tracking-tight text-white uppercase flex items-center gap-1.5 leading-none">
                VLESSFREE <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">App</span>
              </h1>
              <p className="text-[10px] text-white/40 font-mono mt-0.5">Встроенный Веб-интерфейс</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#22c55e]/90 font-mono bg-emerald-500/10 px-2 py-1 rounded-xl flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Synced
            </span>
            <button 
              onClick={() => window.location.reload()} 
              aria-label="Refresh app data"
              className="p-2 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl border border-white/5 transition-all text-white/60"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Warnings Marquee Notification under Android view */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning) => (
              <div 
                key={warning.id}
                className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-start gap-2.5 text-amber-500 text-xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium font-sans">{warning.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Native Touch-friendly Custom Tab Bar Container */}
        <nav className="grid grid-cols-4 gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
          <button
            onClick={() => setActiveTab('servers')}
            className={`py-3 rounded-xl font-bold text-[9px] uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
              activeTab === 'servers' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Shield className="w-4 h-4" />
            Ключи
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`py-3 rounded-xl font-bold text-[9px] uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
              activeTab === 'exports' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Download className="w-4 h-4" />
            Импорт
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`py-3 rounded-xl font-bold text-[9px] uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
              activeTab === 'guides' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Гайды
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 rounded-xl font-bold text-[9px] uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
              activeTab === 'report' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Репорт
          </button>
        </nav>

        {/* Dynamic Display Area */}
        <div className="space-y-4">

          {/* TAB 1: SERVERS LISTING */}
          {activeTab === 'servers' && (
            <div className="space-y-4">
              
              {/* Quick info-card display */}
              <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 rounded-3xl flex justify-between items-center sm:p-5">
                <div>
                  <h3 className="font-bold text-sm text-indigo-300">Быстрый старт</h3>
                  <p className="text-[11px] text-white/50 mt-1 max-w-[200px]">
                    Выберите сервер из списка ниже и скопируйте VLESS ключ для v2rayNG
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[22px] font-black font-mono tracking-tight text-white block">
                    {keys.filter(k => k.status === 'online' || k.status === 'unstable').length}
                  </span>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Активно</span>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Поиск по стране или номеру..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-5 py-3.5 text-xs outline-none focus:border-indigo-500/30 transition-all text-white placeholder:text-white/20 font-sans"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Loader */}
              {loading && (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
                  <p className="text-xs text-white/40 font-mono">Загрузка защищенных серверов...</p>
                </div>
              )}

              {/* Server cards container */}
              {!loading && (
                <div className="grid grid-cols-1 gap-3.5">
                  {activeKeys.map((item) => {
                    const countryCode = item.country || 'NL';
                    const flagEmoji = COUNTRY_FLAGS[countryCode] || '🌐';
                    const countryName = COUNTRY_NAMES[countryCode] || item.location;
                    const cleanNameStr = item.name || `Сервер #${item.id}`;
                    
                    return (
                      <div 
                        key={item.id}
                        className="p-4 bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 relative group flex flex-col justify-between"
                      >
                        {/* Header card meta */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[20px] select-none filter drop-shadow">{flagEmoji}</span>
                            <div>
                              <h4 className="text-sm font-sans font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-tight">
                                {cleanNameStr}
                                {item.status === 'unstable' && (
                                  <span className="bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    Нестабилен
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-white/40 mt-0.5">{item.location}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 font-bold">
                              {item.latency || '25ms'}
                            </span>
                          </div>
                        </div>

                        {/* Middle detailed metadata block: Protocol, Expire, Load */}
                        <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-white/[0.03] text-[10px] text-white/40 font-mono mb-4">
                          <div>
                            <span className="block text-[8px] text-white/20 uppercase tracking-widest leading-none mb-1">Протокол</span>
                            <span className="text-indigo-300 font-bold">{item.protocol || 'VLESS / REALITY'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-white/20 uppercase tracking-widest leading-none mb-1">Пропуск. Способ.</span>
                            <div className="flex items-center gap-1 text-white/80 font-bold">
                              <Cpu className="w-3 h-3 text-white/30" />
                              {(100 - (item.load || 20))}%
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-[8px] text-white/20 uppercase tracking-widest leading-none mb-1">Действует до</span>
                            <span className="text-white/70 font-semibold">{item.expiryDate || 'Бессрочно'}</span>
                          </div>
                        </div>

                        {/* Interactive Load Status Visual Bar */}
                        <div className="space-y-1 mb-4 select-none">
                          <div className="flex justify-between items-center text-[8px] uppercase tracking-widest text-[#ffffff]/30 font-bold">
                            <span>Загрузка железа</span>
                            <span>{item.load || 18}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden flex">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                (item.load || 18) > 70 ? 'bg-rose-500' :
                                (item.load || 18) > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${item.load || 18}%` }}
                            />
                          </div>
                        </div>

                        {/* Big Touch-friendly action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(item.id, item.config, cleanNameStr)}
                            className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 select-none active:scale-[0.98] ${
                              copiedId === item.id
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                            }`}
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Скопировано!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Копировать ключ</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setReportServerId(String(item.id));
                              setActiveTab('report');
                            }}
                            aria-label="Report server issue"
                            className="p-3.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-400 active:scale-95 border border-white/5 hover:border-white/10 rounded-xl transition-all"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })}

                  {activeKeys.length === 0 && (
                    <div className="p-8 text-center border border-white/5 border-dashed rounded-3xl text-white/30 italic text-xs">
                      Подходящие серверы не найдены
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXPORTS & IMPORTS */}
          {activeTab === 'exports' && (
            <div className="space-y-5">
              
              <div className="p-5 bg-indigo-500/10 border border-indigo-500/10 rounded-2xl relative overflow-hidden">
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 select-none">
                  <Download className="w-32 h-32 text-indigo-500" />
                </div>
                <h3 className="font-sans font-black text-sm text-indigo-300 uppercase tracking-wider">Групповой Импорт</h3>
                <p className="text-xs text-white/55 mt-1.5 leading-relaxed max-w-sm">
                  Для быстрой конфигурации скопируйте все активные сервера в один клик. v2rayNG и Nekobox могут автоматически разобрать список ключей из вашего буфера обмена.
                </p>
                
                <div className="mt-5 space-y-3 relative z-10">
                  <button
                    onClick={copyAllKeys}
                    className="w-full py-4 bg-white text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4 text-black" />
                    Копировать все {keys.length} ключей
                  </button>
                </div>
              </div>

              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative overflow-hidden">
                <div className="absolute right-[-10px] bottom-[-10px] opacity-5 select-none animate-pulse">
                  <Globe className="w-32 h-32 text-emerald-500" />
                </div>
                <h3 className="font-sans font-black text-sm text-emerald-300 uppercase tracking-wider">Подписка Vlessfree</h3>
                <p className="text-xs text-white/55 mt-1.5 leading-relaxed max-w-sm">
                  Вместо постоянного ручного обновления, добавьте один раз ссылку подписки внутри v2rayNG или Nekobox. Приложение само будет подтягивать новые и изменять закрывшиеся сервера.
                </p>

                <div className="mt-5 space-y-3 relative z-10">
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xl block text-[11px] font-mono select-all truncate text-white/60 mb-2">
                    https://vlessfree.vercel.app/suball
                  </div>
                  <button
                    onClick={copySubscriptionUrl}
                    className="w-full py-4 bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4 text-white" />
                    Скопировать ссылку подписки
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: GUIDES */}
          {activeTab === 'guides' && (
            <div className="space-y-4">
              
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-white">Установка v2rayNG (Рекомендуем)</h4>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed pl-10">
                  Скачайте из Play Store приложение <b>v2rayNG</b>. Это лучший и самый надежный клиент для конфигураций VLESS в Android.
                </p>
                <div className="pl-10 flex gap-2">
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.v2ray.ang" 
                    target="_blank" 
                    rel="noreferrer"
                    className="py-2 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    Play Store <ExternalLink className="w-3 h-3" />
                  </a>
                  <a 
                    href="https://github.com/2dust/v2rayNG/releases" 
                    target="_blank" 
                    rel="noreferrer"
                    className="py-2 px-3 bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    GitHub APK <Download className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-white">Простой импорт за 2 шага</h4>
                </div>
                <div className="text-[11px] text-white/50 space-y-2 pl-10 leading-relaxed font-sans">
                  <p>
                    <b>Шаг А:</b> Нажмите на кнопку под любым сервером в списке <b>"Копировать ключ"</b>.
                  </p>
                  <p>
                    <b>Шаг Б:</b> Откройте приложение <b>v2rayNG</b>, нажмите на плюс в верхнем правом углу экрана, и выберите <b>"Импортировать профиль из буфера обмена"</b> (Import config from Clipboard).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-white">Запуск соединения</h4>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed pl-10">
                  Выберите импортированный сервер в главном списке нажатием на него (с левой стороны загорится фиолетовая полоса), затем кликните по большому плавающему круглому значку <b>V</b> внизу экрана для старта. Предоставьте системе права на VPN-подключение.
                </p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] font-bold text-xs">
                    4
                  </div>
                  <h4 className="text-sm font-bold text-white">Устранение неполадок</h4>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed pl-10">
                  Если Инстаграм или YouTube все равно тормозит – выберите другой сервер из списка нашей утилиты, они имеют разную балансировку нагрузки и локации. Также проверьте текущее время устройства – неточность в часовом поясе более чем на 30 секунд лишает VLESS-клиенты возможности авторизоваться на сервере.
                </p>
              </div>

            </div>
          )}

          {/* TAB 4: DIRECT ERRORS REPORTING */}
          {activeTab === 'report' && (
            <div className="space-y-5">
              
              <div className="p-5 bg-rose-500/10 border border-rose-500/10 rounded-2xl relative overflow-hidden">
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 select-none">
                  <AlertTriangle className="w-24 h-24 text-rose-500" />
                </div>
                <h3 className="font-sans font-black text-sm text-rose-400 uppercase tracking-widest">Сообщить о падении</h3>
                <p className="text-xs text-white/55 mt-1.5 leading-relaxed">
                  Если конкретный сервер в приложении перестал подключаться, сообщите об этом. Мониторинг незамедлительно зафиксирует сбой и администрация заново перенастроит конфигурацию.
                </p>
              </div>

              {reportSuccess ? (
                <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 text-center rounded-2xl space-y-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Репорт успешно отправлен!</h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Наш технический бот уже получил оповещение и проверяет работоспособность указанного сервера. Благодарим за помощь!
                  </p>
                  <button 
                    onClick={() => setActiveTab('servers')}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    Вернуться к серверам
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl block">
                  
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-white/30 block ml-1">Неисправный сервер</label>
                    <select
                      value={reportServerId}
                      onChange={(e) => setReportServerId(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500/20 outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#05055] text-white">-- Выберите сервер --</option>
                      {keys.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#050505]">
                          {s.name} ({s.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-white/30 block ml-1">Причина проблемы</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white focus:border-indigo-500/20 outline-none appearance-none"
                    >
                      <option value="not_working" className="bg-[#050505]">Не подключается / Ошибка рукопожатия</option>
                      <option value="slow_speed" className="bg-[#050505]">Низкая скорость / Ужасно лагает</option>
                      <option value="info_error" className="bg-[#050505]">Неверный VLESS-конфиг</option>
                      <option value="other" className="bg-[#050505]">Другая причина</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-white/30 block ml-1">Комментарий (Опционально)</label>
                    <textarea
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="Опишите подробности сбоя..."
                      className="w-full h-24 bg-white/5 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500/20 outline-none resize-none placeholder:text-white/25 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!reportServerId || isSubmittingReport}
                    className={`w-full py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      !reportServerId || isSubmittingReport
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    {isSubmittingReport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Отправить отчет о сбое</span>
                  </button>

                </form>
              )}

            </div>
          )}

        </div>

        {/* Small brand footer for androidverapp */}
        <footer className="text-center pt-8 pb-10 space-y-2 select-none">
          <div className="flex justify-center items-center gap-1 text-[10px] text-white/20">
            <span>Made with</span>
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
            <span>for VLESSFREE Users</span>
          </div>
          <p className="text-[8px] text-white/10 uppercase tracking-widest font-bold">Secure VLESS configs platform • Version 0.8</p>
          
          {appVersion && (
            <div className="text-[9px] text-white/20 font-mono mt-2 pt-1 border-t border-white/5 inline-block px-3">
              {versionStatus === 'checking' && <span>Проверка версии приложения ({appVersion})...</span>}
              {versionStatus === 'up_to_date' && (
                <span className="text-emerald-500/80 flex items-center justify-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Приложение v{appVersion} обновлено
                </span>
              )}
              {versionStatus === 'outdated' && (
                <Link to="/versionsandroid" className="text-amber-500/90 font-semibold hover:underline flex flex-col items-center gap-0.5 animate-pulse cursor-pointer">
                  <span>Доступно обновление ({latestVersion})</span>
                  <span className="text-[8px] opacity-75 text-white/30">(у вас установлена {appVersion})</span>
                </Link>
              )}
            </div>
          )}
        </footer>

      </div>

      {/* Embedded toast system for high utility without annoying window.alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 left-4 right-4 z-[999] pointer-events-none flex justify-center"
          >
            <div className="px-5 py-3.5 bg-[#1F2937]/95 border border-white/10 rounded-2xl text-xs text-white font-medium text-center shadow-2xl backdrop-blur flex items-center gap-2 leading-none max-w-sm">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
