import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, Send, ChevronLeft, CheckCircle2, ShieldAlert, BadgeInfo, ZapOff, MoreHorizontal, RefreshCw } from 'lucide-react';
import { db, collection, addDoc, handleFirestoreError, OperationType, serverTimestamp, getDocs, orderBy, query, where } from '../lib/firebase';

const REASONS = [
  { id: 'not_working', label: 'Не работает', icon: ZapOff, color: 'text-rose-500' },
  { id: 'info_error', label: 'Неверная информация', icon: BadgeInfo, color: 'text-amber-500' },
  { id: 'slow_speed', label: 'Низкая скорость', icon: ShieldAlert, color: 'text-purple-500' },
  { id: 'other', label: 'Другое', icon: MoreHorizontal, color: 'text-white/60' },
];

export default function ReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const serverId = searchParams.get('serverId') || '';
  const serverName = searchParams.get('serverName') || '';

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [showMyReports, setShowMyReports] = useState(false);
  const [availableServers, setAvailableServers] = useState<any[]>([]);
  const [isLoadingServers, setIsLoadingServers] = useState(true);

  useEffect(() => {
    const syncReports = async () => {
      const stored = localStorage.getItem('my_reports');
      if (!stored) return;

      const localReports = JSON.parse(stored);
      setUserReports(localReports);

      // Fetch fresh statuses from Firestore
      try {
        const reportIds = localReports.map((r: any) => r.id).filter(Boolean);
        if (reportIds.length === 0) return;

        // Firestore 'in' query supports up to 30 elements
        const chunks = [];
        for (let i = 0; i < reportIds.length; i += 30) {
          chunks.push(reportIds.slice(i, i + 30));
        }

        let freshData: any[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'reports'), where('__name__', 'in', chunk));
          const snap = await getDocs(q);
          freshData = [...freshData, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
        }

        // Update local state and storage if statuses changed
        const updatedReports = localReports.map((lr: any) => {
          const fresh = freshData.find(fd => fd.id === lr.id);
          if (fresh && fresh.status !== lr.status) {
            return { ...lr, status: fresh.status };
          }
          return lr;
        });

        localStorage.setItem('my_reports', JSON.stringify(updatedReports));
        setUserReports(updatedReports);
      } catch (e) {
        console.error('Failed to sync report statuses', e);
      }
    };

    syncReports();

    // Fetch servers for selection
    const fetchServers = async () => {
      try {
        const q = query(collection(db, 'servers'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        const servers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableServers(servers);
      } catch (error) {
        console.error('Failed to fetch servers', error);
      } finally {
        setIsLoadingServers(false);
      }
    };
    fetchServers();
  }, []);

  const getClientMetadata = async () => {
    const browser = navigator.userAgent;
    let country = 'Unknown';
    let ip = 'Unknown';
    
    const fetchGeo = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error();
        return res.json();
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    };

    try {
      let data: any = null;
      try {
        data = await fetchGeo('https://ipapi.co/json/');
      } catch (e) {
        try {
          data = await fetchGeo('https://ipwho.is/');
        } catch (e2) {
          try {
            data = await fetchGeo('https://api.db-ip.com/v2/free/self');
          } catch (e3) {
            const ipOnly = await fetchGeo('https://api.ipify.org?format=json');
            data = { ip: ipOnly.ip, country_name: 'Unknown' };
          }
        }
      }
      
      if (data) {
        country = data.country_name || data.country || 'Unknown';
        ip = data.ip || data.query || 'Unknown';
      }
    } catch (e) {
      console.warn('Metadata fetch failed on all services');
    }
    return { browser, country, ip };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !serverId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const metadata = await getClientMetadata();
      const reportData = {
        serverId,
        serverName,
        reason,
        description,
        status: 'pending',
        createdAt: serverTimestamp(),
        userIp: metadata.ip,
        browser: metadata.browser,
        country: metadata.country,
      };

      const docRef = await addDoc(collection(db, 'reports'), reportData);
      
      // Save locally
      const newReport = { 
        id: docRef.id, 
        ...reportData, 
        createdAt: new Date().toISOString() 
      };
      const updatedLocal = [newReport, ...userReports];
      localStorage.setItem('my_reports', JSON.stringify(updatedLocal));
      setUserReports(updatedLocal);

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setIsSubmitting(false);
      setReason('');
      setDescription('');
    }
  };

  const handleServerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    const sName = availableServers.find(s => s.id === sId)?.name || '';
    setSearchParams({ serverId: sId, serverName: sName });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass max-w-md w-full p-12 text-center rounded-[32px]"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-serif italic mb-4">Спасибо за отчет!</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Мы проверим стабильность сервера {serverName} в ближайшее время.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 glass hover:bg-white/5 rounded-2xl transition-colors text-xs font-bold uppercase tracking-widest"
          >
            Вернуться на главную
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 max-w-2xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Назад</span>
        </motion.button>

        <button 
          onClick={() => setShowMyReports(!showMyReports)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 transition-all"
        >
          {showMyReports ? 'К форме' : `Мои отчеты (${userReports.length})`}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] p-8 md:p-12"
      >
        {showMyReports ? (
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <BadgeInfo className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-serif italic tracking-tighter">Мои отчеты</h1>
                <p className="text-white/40 text-xs">История ваших обращений</p>
              </div>
            </div>

            <div className="space-y-4">
              {userReports.map((r, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold">{r.serverName}</h4>
                      <p className="text-[10px] text-white/40">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                      r.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      r.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {r.status === 'pending' ? 'Ожидает' : r.status === 'resolved' ? 'Решено' : 'Отклонено'}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 italic">
                    {REASONS.find(re => re.id === r.reason)?.label || r.reason}
                  </p>
                  {r.description && <p className="text-xs text-white/40">{r.description}</p>}
                </div>
              ))}
              {userReports.length === 0 && (
                <p className="text-center py-12 text-white/20 italic">У вас еще нет отчетов</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl font-serif italic tracking-tighter">Сообщить о проблеме</h1>
                <p className="text-white/40 text-xs">Расскажите нам о неисправности</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                  Выберите сервер
                </label>
                <select
                  value={serverId}
                  onChange={handleServerChange}
                  className="w-full bg-white/2 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
                  disabled={isLoadingServers}
                >
                  <option value="" disabled className="bg-[#050505]">Выберите сервер из списка</option>
                  {availableServers.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#050505]">
                      {s.name} ({s.location})
                    </option>
                  ))}
                </select>
                {isLoadingServers && <p className="text-[10px] text-white/20 ml-2 animate-pulse">Загрузка серверов...</p>}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                  Выберите причину
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REASONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReason(item.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
                        reason === item.id 
                        ? 'glass border-white/20 bg-white/5' 
                        : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/3'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-1">
                  Дополнительное описание (Опционально)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите проблему подробнее..."
                  className="w-full h-32 bg-white/2 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-white/20 transition-colors resize-none placeholder:text-white/10"
                />
              </div>

              <div className="space-y-6">
                <button
                  type="submit"
                  disabled={!reason || isSubmitting}
                  className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-[0.2em] transition-all text-xs ${
                    !reason || isSubmitting
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-[1.02]'
                  }`}
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Отправка...' : 'Отправить репорт'}
                </button>

                <p className="text-[9px] text-white/20 text-center leading-relaxed italic">
                  * учтите, что при чрезмерном отправлении репортов, мы в праве ограничить вам эту возможность, а может и вовсе ограничить доступ к сайту.
                </p>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
