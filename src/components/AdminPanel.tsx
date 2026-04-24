import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider, signInWithPopup, signOut, serversCollection, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from '../lib/firebase';
import { Trash2, Edit3, Plus, LogOut, Shield, ChevronRight, Save, X, Globe, Activity, Calendar, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import { MOCK_KEYS } from '../data/keys';

const ADMIN_EMAILS = ['bubinadubina5@gmail.com', 'intelxeonuser@gmail.com'];

const countryMapping: Record<string, string> = {
  'Нидерланды': 'NL',
  'Германия': 'DE',
  'Финляндия': 'FI',
  'Финлядия': 'FI', // Fix typo in user request
  'США': 'US',
  'Великобритания': 'UK',
  'Молдова': 'MD',
  'Индия': 'IN',
  'Казахстан': 'KZ',
  'Россия': 'RU',
  'Швеция': 'SE',
  'Турция': 'TR',
  'Япония': 'JP',
  'Бразилия': 'BR'
};

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [servers, setServers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    protocol: 'VLESS / REALITY',
    latency: '',
    load: 0,
    expiryDate: '',
    status: 'online',
    config: '',
    country: '',
    city: '',
    reason: '',
    isSpecial: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u && ADMIN_EMAILS.includes(u.email || '')) {
        setUser(u);
      } else {
        setUser(null);
        if (u) signOut(auth); // Sign out if not admin
      }
      setLoading(false);
    });

    const q = query(serversCollection, orderBy('createdAt', 'desc'));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServers(docs);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDocs();
    };
  }, []);

  const handleLogin = async () => {
    try {
      console.log("Attempting login...");
      await signInWithPopup(auth, googleProvider);
      console.log("Login call completed");
    } catch (error: any) {
      console.error("Login failed error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Окно входа заблокировано браузером. Пожалуйста, разрешите всплывающие окна для этого сайта.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, usually no need to alert
      } else {
        alert("Ошибка входа: " + error.message);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const importMockData = async () => {
    if (!window.confirm("Это импортирует 13 стандартных серверов. Продолжить?")) return;
    setIsImporting(true);
    try {
      for (const key of MOCK_KEYS) {
        // Extract country code from location string
        let countryCode = 'UN';
        for (const [name, code] of Object.entries(countryMapping)) {
          if (key.location.includes(name)) {
            countryCode = code;
            break;
          }
        }

        await addDoc(serversCollection, {
          name: key.name,
          protocol: key.protocol,
          latency: key.latency,
          load: key.load,
          expiryDate: key.expiryDate,
          status: key.status || 'online',
          config: key.config,
          country: countryCode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      alert("Импорт завершен!");
    } catch (error) {
      console.error("Import failed:", error);
      alert("Ошибка импорта: " + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'servers', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        await addDoc(serversCollection, {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setIsAdding(false);
      }
      setFormData({
        name: '', protocol: 'VLESS / REALITY', latency: '', load: 0, expiryDate: '', status: 'online', config: '', country: '', city: '', reason: '', isSpecial: false
      });
    } catch (error) {
      console.error("Operation failed:", error);
      alert("Ошибка при сохранении: " + (error as Error).message);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log("Attempting to delete server:", id);
    if (window.confirm("Удалить этот сервер?")) {
      try {
        const docRef = doc(db, 'servers', id);
        await deleteDoc(docRef);
        console.log("Delete successful for:", id);
        alert("Сервер успешно удален");
      } catch (error) {
        console.error("Delete failed for:", id, error);
        alert("Ошибка при удалении: " + (error as Error).message);
      }
    }
  };

  const handleDeleteSelected = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedServers.length === 0) return;
    console.log("Attempting to delete multiple servers:", selectedServers);
    if (window.confirm(`Удалить ${selectedServers.length} серверов?`)) {
      setLoading(true);
      try {
        for (const id of selectedServers) {
          await deleteDoc(doc(db, 'servers', id));
          console.log("Deleted:", id);
        }
        setSelectedServers([]);
        alert("Выбранные серверы удалены");
      } catch (error) {
        console.error("Batch delete failed:", error);
        alert("Ошибка при массовом удалении: " + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedServers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startEdit = (server: any) => {
    setEditingId(server.id);
    setFormData({
      name: server.name,
      protocol: server.protocol,
      latency: server.latency,
      load: server.load,
      expiryDate: server.expiryDate,
      status: server.status,
      config: server.config,
      country: server.country,
      city: server.city || '',
      reason: server.reason || '',
      isSpecial: server.isSpecial || false
    });
    setIsAdding(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <RefreshCw className="w-8 h-8 animate-spin text-white/20" />
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12 rounded-[40px] max-w-md w-full text-center border border-white/10"
        >
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="text-3xl font-serif italic mb-4">Вход в панель</h1>
          <p className="text-white/40 text-sm mb-8">Доступ только для администраторов</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl bg-white text-black font-bold uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
          >
            <Globe className="w-5 h-5" />
            Войти через Google
          </button>
          
          <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] text-left space-y-2">
            <p className="text-white/40 uppercase tracking-widest font-bold">Если окно не открывается:</p>
            <ul className="text-white/30 list-disc list-inside space-y-1">
              <li>Отключите блокировщик всплывающих окон</li>
              <li>Проверьте, добавлен ли домен в Authorized Domains в консоли Firebase</li>
              <li>Домен: <code className="text-white/60 break-all">{window.location.hostname}</code></li>
            </ul>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="mt-6 text-white/20 text-[10px] uppercase tracking-widest hover:text-white/60 transition-colors"
          >
            Вернуться на главную
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif italic mb-2">Админ-панель</h1>
          <p className="text-white/40 text-sm">Управление серверами в реальном времени</p>
        </div>
        <button onClick={handleLogout} className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({
              name: '', protocol: 'VLESS / REALITY', latency: '', load: 0, expiryDate: '27.04.2026', status: 'online', config: '', country: '', city: '', reason: '', isSpecial: false
            });
          }}
          className="px-6 py-4 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> Добавить сервер
        </button>
        
        {servers.length === 0 && (
          <button 
            disabled={isImporting}
            onClick={importMockData}
            className="px-6 py-4 rounded-2xl bg-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/20 transition-all disabled:opacity-50"
          >
            {isImporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
            Импортировать стандартные (13)
          </button>
        )}

        {selectedServers.length > 0 && (
          <button 
            onClick={handleDeleteSelected}
            className="px-6 py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-rose-500 hover:text-white transition-all animate-in fade-in slide-in-from-left-4"
          >
            <Trash2 className="w-5 h-5" /> Удалить выбранные ({selectedServers.length})
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <form onSubmit={handleSubmit} className="glass p-8 rounded-[40px] border border-white/20">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-serif italic">{editingId ? 'Редактировать сервер' : 'Новый сервер'}</h2>
                <button type="button" onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Название</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Server №1"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Страна (Код)</label>
                  <input 
                    required
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value.toUpperCase().slice(0, 2)})}
                    placeholder="NL"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Город</label>
                  <input 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    placeholder="Амстердам"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Задержка (опционально)</label>
                  <input 
                    value={formData.latency}
                    onChange={e => setFormData({...formData, latency: e.target.value})}
                    placeholder="42ms"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Нагрузка (%)</label>
                  <input 
                    type="number"
                    required
                    value={formData.load}
                    onChange={e => setFormData({...formData, load: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Активен до</label>
                  <input 
                    required
                    value={formData.expiryDate}
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                    placeholder="27.04.2026"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Статус</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none appearance-none"
                  >
                    <option value="online" className="bg-neutral-900">Online</option>
                    <option value="offline" className="bg-neutral-900">Offline</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Конфигурация (VLESS URL)</label>
                  <textarea 
                    required
                    value={formData.config}
                    onChange={e => setFormData({...formData, config: e.target.value})}
                    placeholder="vless://..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 focus:border-white/30 transition-all outline-none font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Причина (если оффлайн)</label>
                  <input 
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                    placeholder="Тех обслуживание..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-white/30 transition-all outline-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group p-2">
                  <input 
                    type="checkbox"
                    checked={formData.isSpecial}
                    onChange={e => setFormData({...formData, isSpecial: e.target.checked})}
                    className="w-5 h-5 rounded-lg border-white/10 bg-white/5 checked:bg-white accent-white"
                  />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">Специальный (пароль нужен)</span>
                </label>
              </div>

              <button 
                type="submit"
                className="w-full py-5 rounded-3xl bg-white text-black font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all"
              >
                <Save className="w-5 h-5" /> Сохранить изменения
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass rounded-[40px] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-6">
                  <input 
                    type="checkbox" 
                    onChange={e => {
                      if (e.target.checked) setSelectedServers(servers.map(s => s.id));
                      else setSelectedServers([]);
                    }}
                    checked={selectedServers.length === servers.length && servers.length > 0}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 accent-white"
                  />
                </th>
                <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Сервер</th>
                <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Страна</th>
                <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Нагрузка</th>
                <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Статус</th>
                <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Действия</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((server) => (
                <tr key={server.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${selectedServers.includes(server.id) ? 'bg-white/[0.03]' : ''}`}>
                  <td className="p-6">
                    <input 
                      type="checkbox" 
                      checked={selectedServers.includes(server.id)}
                      onChange={() => toggleSelect(server.id)}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 accent-white"
                    />
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-serif italic text-lg">{server.name}</span>
                      <span className="text-[10px] text-white/20 font-mono tracking-tighter truncate max-w-[200px]">{server.config}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold">{server.country}</span>
                      <span className="text-[10px] text-white/30">{server.city}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${server.load > 80 ? 'bg-rose-500' : server.load > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${server.load}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold">{server.load}%</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold border ${
                      server.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {server.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(server)} className="p-3 rounded-xl bg-white/5 hover:bg-white hover:text-black transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDelete(server.id, e)} className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {servers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-white/20 uppercase tracking-[0.2em] text-[10px] font-bold">
                    Список серверов пуст
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
