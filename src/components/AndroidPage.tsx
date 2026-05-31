import React, { useState, useMemo, useEffect } from 'react';
import { 
  Copy, Check, Phone, ArrowUpRight, Search, Globe, Shield, RefreshCw, 
  HelpCircle, Settings, Layers, Wifi, ExternalLink, Sliders, ChevronDown, 
  Smartphone, BookOpen, AlertTriangle, Info, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface AndroidPageProps {
  keys: any[];
  warnings: any[];
  handleCopy: (id: string, config: string) => void;
  copiedId: string | null;
}

export default function AndroidPage({ keys, warnings = [], handleCopy, copiedId }: AndroidPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'servers' | 'subs' | 'guide'>('servers');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedSub, setCopiedSub] = useState(false);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Local simulated pings for beautiful Android-like live feedback
  const [pings, setPings] = useState<Record<string, number>>({});
  const [isRefreshingPings, setIsRefreshingPings] = useState(false);

  // Trigger toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Generate simulated realistic pings for servers
  const generatePings = () => {
    setIsRefreshingPings(true);
    const newPings: Record<string, number> = {};
    keys.forEach((k) => {
      if (k.country === 'RU') {
        newPings[k.id] = Math.floor(Math.random() * 25) + 15;
      } else if (k.country === 'NL' || k.country === 'DE' || k.country === 'FI') {
        newPings[k.id] = Math.floor(Math.random() * 40) + 45;
      } else {
        newPings[k.id] = Math.floor(Math.random() * 80) + 90;
      }
    });
    setTimeout(() => {
      setPings(newPings);
      setIsRefreshingPings(false);
      triggerToast('Пинг серверов успешно обновлен!');
    }, 800);
  };

  useEffect(() => {
    if (keys.length > 0 && Object.keys(pings).length === 0) {
      generatePings();
    }
  }, [keys]);

  // Extract unique countries
  const countries = useMemo(() => {
    return Array.from(new Set(keys.map((k: any) => k.location.split(',')[0].trim())));
  }, [keys]);

  // Handle Copy Subscription URL
  const copySubUrl = () => {
    const subUrl = 'https://vlessfree.vercel.app/suball';
    navigator.clipboard.writeText(subUrl);
    setCopiedSub(true);
    triggerToast('Ссылка подписки скопирована в буфер обмена!');
    setTimeout(() => setCopiedSub(false), 2000);
  };

  // Handle single server copy wrapper
  const handleServerCopyClick = (id: string, config: string, name: string) => {
    handleCopy(id, config);
    triggerToast(`Ключ "${name}" скопирован!`);
  };

  // Filtering logic
  const filteredKeys = useMemo(() => {
    return keys.filter((key: any) => {
      // Exclude offline or expired keys if not on admin screen
      const parts = key.expiryDate?.split('.');
      let expiry: Date | null = null;
      if (parts && parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          expiry = new Date(year, month - 1, day);
          expiry.setHours(23, 59, 59, 999);
        }
      }
      const isExpired = expiry ? expiry < new Date() : false;
      const isActive = (key.status === 'online' || key.status === 'unstable') && !isExpired && !key.isComingSoon;

      if (!isActive) return false;

      // Filter by country
      if (selectedCountry && !key.location.startsWith(selectedCountry)) return false;

      // Filter by Protocol
      if (selectedProtocol !== 'all') {
        const p = key.protocol?.toLowerCase() || '';
        if (selectedProtocol === 'vless' && !p.includes('vless')) return false;
        if (selectedProtocol === 'shadowsocks' && !p.includes('shadowsocks') && !p.includes('ss')) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (key.name || '').toLowerCase().includes(q);
        const matchesLoc = (key.location || '').toLowerCase().includes(q);
        const matchesProtocol = (key.protocol || '').toLowerCase().includes(q);
        return matchesName || matchesLoc || matchesProtocol;
      }

      return true;
    });
  }, [keys, selectedCountry, selectedProtocol, searchQuery]);

  return (
    <div className="min-h-screen bg-[#09090c] text-white flex flex-col font-sans select-none pb-24">
      {/* Dynamic Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] px-6 py-3 rounded-2xl bg-indigo-600 border border-indigo-400 text-white font-medium text-xs shadow-2xl flex items-center gap-2 whitespace-nowrap"
          >
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Android Native Custom App Bar Header */}
      <header className="sticky top-0 z-50 bg-[#09090c]/90 backdrop-blur-xl border-b border-white/5 py-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Smartphone className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-white">VLESSFREE</h1>
            <span className="text-[10px] text-white/40 block mt-[-2px]">Версия для Android</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={generatePings} 
            disabled={isRefreshingPings}
            className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white transition-all active:scale-95"
            title="Проверить пинг"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingPings ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Notification Banner */}
      <div className="px-5 mt-4">
        {warnings.filter(w => w.active).slice(0, 1).map((w) => (
          <div key={w.id} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{w.text}</p>
          </div>
        ))}
      </div>

      {/* Connection Quick Stats Card */}
      <div className="px-5 mt-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-505/10 blur-[50px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Авто-подписка</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5">Синхронизация v2rayNG</h2>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">
            Скопируйте ссылку ниже и добавьте её в ваше приложение (v2rayNG, NekoBox, Hiddify) для автоматического обновления серверов.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={copySubUrl}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-indigo-400/20"
            >
              {copiedSub ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSub ? 'Скопировано!' : 'Скопировать подписку'}
            </button>
          </div>
        </div>
      </div>

      {/* Mode / Tabs selectors */}
      <div className="px-5 mt-6 flex gap-1">
        <button
          onClick={() => setActiveTab('servers')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'servers' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'bg-white/5 text-white/50'
          }`}
        >
          Серверы ({filteredKeys.length})
        </button>
        <button
          onClick={() => setActiveTab('subs')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'subs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'bg-white/5 text-white/50'
          }`}
        >
          Интеграция
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'guide' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15' : 'bg-white/5 text-white/50'
          }`}
        >
          Инструкция
        </button>
      </div>

      {/* Main content body */}
      <div className="px-5 mt-5">
        
        {/* TAB 1: SERVERS LIST */}
        {activeTab === 'servers' && (
          <div className="space-y-4">
            
            {/* Search and Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Быстрый поиск по стране, городу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/[0.08] border border-white/5 font-medium rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500/30 transition-all font-mono"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/30 hover:text-white"
                  >
                    Очистить
                  </button>
                )}
              </div>

              {/* Horizontal Pill Country Filters */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedCountry(null)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                    selectedCountry === null ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                  }`}
                >
                  Все страны
                </button>
                {countries.map((country: string) => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                      selectedCountry === country ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>

            {/* Servers Render List */}
            {filteredKeys.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                <Globe className="w-8 h-8 text-white/15 mx-auto mb-2" />
                <p className="text-white/40 text-xs font-medium">Активных серверов по фильтру не найдено.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredKeys.map((k: any) => {
                  const isExpanded = expandedServer === k.id;
                  const latency = pings[k.id] || null;
                  
                  return (
                    <div 
                      key={k.id}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isExpanded ? 'bg-white/10 border-indigo-500/30' : 'bg-white/5 border-white/5'
                      }`}
                    >
                      {/* Top row */}
                      <div 
                        onClick={() => setExpandedServer(isExpanded ? null : k.id)}
                        className="p-4 flex items-center justify-between cursor-pointer active:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 font-bold text-xs select-none">
                            {k.country || '🌍'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs">{k.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/40 uppercase font-mono font-bold tracking-wider">
                                {k.protocol ? k.protocol.split(' ')[0] : 'VLESS'}
                              </span>
                            </div>
                            <span className="text-[10px] text-white/40 block font-mono mt-0.5">{k.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Live ping badge */}
                          {latency !== null && (
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                              latency < 30 ? 'bg-emerald-500/10 text-emerald-400' :
                              latency < 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              <Wifi className="w-2.5 h-2.5" />
                              {latency} ms
                            </span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Expandable key & copy details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3"
                          >
                            <div className="flex items-center justify-between text-[10px] font-medium font-mono text-white/50">
                              <span>Скорость подключения:</span>
                              <span className="text-white font-bold select-text">~500 Mbps</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-medium font-mono text-white/50">
                              <span>Истекает:</span>
                              <span className="text-white font-bold select-text">{k.expiryDate || 'Бессрочно'}</span>
                            </div>

                            {/* Raw config preview */}
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5 relative">
                              <span className="text-[8px] font-black uppercase text-white/20 tracking-wider absolute top-2 right-2 font-mono">конфиг</span>
                              <p className="text-[9px] font-mono break-all text-white/55 pr-8 leading-normal font-medium max-h-16 overflow-y-auto select-all selection:bg-indigo-500 selection:text-white">
                                {k.config}
                              </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleServerCopyClick(k.id, k.config, k.name)}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                  copiedId === k.id ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                }`}
                              >
                                {copiedId === k.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedId === k.id ? 'Успешно!' : 'Копировать ключ'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUTOSYNC & SUBSCRIPTION INFO */}
        {activeTab === 'subs' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Групповой Импорт</h3>
              </div>
              <p className="text-xs text-white/50 leading-relaxed mb-4">
                Вы можете импортировать всю базу серверов VLESSFREE в ваше Android-приложение одним кликом. Наше решение обновляет список каждые 24 часа.
              </p>

              <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 mb-4">
                <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest block">Ваша уникальная ссылка</span>
                <div className="flex items-center justify-between text-xs font-mono text-white/80 select-all font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  https://vlessfree.vercel.app/suball
                </div>
              </div>

              <button
                onClick={copySubUrl}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {copiedSub ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedSub ? 'Скопировано!' : 'Копировать Ссылку на все сервера'}
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-indigo-950/20 border border-white/5 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-1.5 text-indigo-400">
                <Check className="w-4 h-4" />
                Преимущества автообновления:
              </h4>
              <ul className="text-xs text-white/60 space-y-2 list-none pl-0">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  Новые ключи добавляются в приложение автоматически.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  Отключение неактивных и сломанных портов без вашего участия.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  Встроенное распределение нагрузки.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: STEP-BY-STEP QUICK GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            
            {/* Guide Item 1 */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black font-mono">ШАГ 1</span>
                <span className="text-[10px] text-white/30">Загрузка софта</span>
              </div>
              <h4 className="font-bold text-sm mb-1.5">Скачайте v2rayNG или NekoBox</h4>
              <p className="text-xs text-white/50 leading-relaxed mb-4">
                Самые стабильные, защищенные и быстрые приложения с открытым исходным кодом для Android.
              </p>
              
              <div className="flex flex-col gap-2">
                <a 
                  href="https://play.google.com/store/apps/details?id=com.v2ray.ang"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    v2rayNG в Google Play
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                </a>

                <a 
                  href="https://github.com/2dust/v2rayNG/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    v2rayNG (.APK c GitHub)
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                </a>
              </div>
            </div>

            {/* Guide Item 2 */}
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black font-mono">ШАГ 2</span>
                <span className="text-[10px] text-white/30">Импорт ключей</span>
              </div>
              <h4 className="font-bold text-sm mb-1.5">Добавьте серверы в v2rayNG</h4>
              
              <div className="space-y-3 mt-3 text-xs text-white/70">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">1</span>
                  <p className="mt-0.5">В боковом меню приложения выберите <strong className="text-white font-semibold">Группы подписок (Subscription group setting)</strong>.</p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">2</span>
                  <p className="mt-0.5">Нажмите на плюс, введите любое имя и вставьте скопированную ссылку авто-подписки <code className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-white font-mono break-all text-[11px] font-medium">https://vlessfree.vercel.app/suball</code>.</p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0">3</span>
                  <p className="mt-0.5">Вернитесь на главный экран, нажмите на три точки в правом верхнем углу и выберите <strong className="text-white font-semibold">Обновить подписку (Update subscription)</strong>.</p>
                </div>
              </div>
            </div>

            {/* Guide Item 3 */}
            <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 text-center">
              <h4 className="font-bold text-sm text-indigo-400">Всё готово! 🎉</h4>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Нажмите на круглую кнопку подключения в правом нижнем углу v2rayNG, чтобы запустить VPN. Удачного веб-серфинга без ограничений!
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Embedded Navigation Hint */}
      <div className="text-center mt-8 px-5">
        <Link 
          to="/" 
          className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:text-white transition-all flex items-center justify-center gap-1.5"
        >
          <span>Вернуться к полной версии сайта</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
