import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider, signInWithPopup, signOut, serversCollection, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, handleFirestoreError, OperationType, limit, where, getDocs } from '../lib/firebase';
import { Trash2, Edit3, Plus, LogOut, Shield, ChevronRight, Save, X, Globe, Activity, Calendar, ExternalLink, RefreshCw, Layers, AlertTriangle, Bell, Eye, EyeOff, Info, UserX, Users, MapPin, MonitorSmartphone, Check, Hash, Copy, Terminal } from 'lucide-react';
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
  const [warnings, setWarnings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [removals, setRemovals] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingWarning, setIsAddingWarning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWarningId, setEditingWarningId] = useState<string | null>(null);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'active' | 'inactive' | 'comingSoon' | 'reports' | 'visits' | 'blocked' | 'suggestions' | 'removals'>('active');
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
    isSpecial: false,
    isComingSoon: false,
    isDisappearingSoon: false
  });

  const [warningFormData, setWarningFormData] = useState({
    text: '',
    type: 'info' as 'info' | 'warning' | 'error',
    active: true,
    replaceContent: false
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
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
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

      setServers(sortedDocs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'servers');
    });

    const warningsQuery = query(collection(db, 'warnings'), orderBy('createdAt', 'desc'));
    const unsubscribeWarnings = onSnapshot(warningsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setWarnings(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'warnings');
    });

    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setReports(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    const visitsQuery = query(collection(db, 'visits'), orderBy('visitedAt', 'desc'), limit(100));
    const unsubscribeVisits = onSnapshot(visitsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setVisits(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'visits');
    });

    const blockedQuery = query(collection(db, 'blocked_ips'), orderBy('blockedAt', 'desc'));
    const unsubscribeBlocked = onSnapshot(blockedQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setBlockedIps(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blocked_ips');
    });

    const suggestionsQuery = query(collection(db, 'server_suggestions'), orderBy('createdAt', 'desc'));
    const unsubscribeSuggestions = onSnapshot(suggestionsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setSuggestions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'server_suggestions');
    });

    const removalsQuery = query(collection(db, 'server_removals'), orderBy('createdAt', 'desc'));
    const unsubscribeRemovals = onSnapshot(removalsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setRemovals(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'server_removals');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDocs();
      unsubscribeWarnings();
      unsubscribeReports();
      unsubscribeVisits();
      unsubscribeBlocked();
      unsubscribeSuggestions();
      unsubscribeRemovals();
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
      handleFirestoreError(error, OperationType.CREATE, 'servers');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Determine which tab the server should belong to after save
      const [day, month, year] = formData.expiryDate.split('.').map(Number);
      const expiry = new Date(year, month - 1, day);
      expiry.setHours(23, 59, 59, 999);
      const now = new Date();
      
      const willBeComingSoon = formData.isComingSoon;
      const willBeActive = formData.status === 'online' && expiry >= now && !willBeComingSoon;
      const willBeInactive = formData.status === 'offline' || (expiry < now && !willBeComingSoon);

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

      // Automatically switch to the correct tab so the user sees the server
      if (willBeComingSoon) setAdminActiveTab('comingSoon');
      else if (willBeActive) setAdminActiveTab('active');
      else if (willBeInactive) setAdminActiveTab('inactive');

      setFormData({
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
        isSpecial: false,
        isComingSoon: false,
        isDisappearingSoon: false
      });
      
      alert(editingId ? "Изменения сохранены" : "Сервер успешно добавлен");
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'servers');
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
        handleFirestoreError(error, OperationType.DELETE, 'servers');
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
        handleFirestoreError(error, OperationType.DELETE, 'servers');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleWarningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWarningId) {
        await updateDoc(doc(db, 'warnings', editingWarningId), {
          ...warningFormData,
          updatedAt: serverTimestamp()
        });
        setEditingWarningId(null);
      } else {
        await addDoc(collection(db, 'warnings'), {
          ...warningFormData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setIsAddingWarning(false);
      }
      setWarningFormData({
        text: '', type: 'info', active: true, replaceContent: false
      });
    } catch (error) {
      handleFirestoreError(error, editingWarningId ? OperationType.UPDATE : OperationType.CREATE, 'warnings');
    }
  };

  const handleDeleteWarning = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Удалить это предупреждение?")) {
      try {
        await deleteDoc(doc(db, 'warnings', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'warnings');
      }
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reports');
    }
  };

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Удалить этот репорт?")) {
      try {
        await deleteDoc(doc(db, 'reports', reportId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'reports');
      }
    }
  };

  const handleApproveSuggestion = async (suggestion: any) => {
    try {
      // 1. Create the actual server
      await addDoc(serversCollection, {
        name: suggestion.name,
        protocol: suggestion.protocol,
        country: suggestion.country,
        city: suggestion.city,
        config: suggestion.config,
        latency: '30ms', // Initial default
        load: 10, // Initial default
        status: 'online',
        expiryDate: suggestion.expiryDate || '01.01.2027', // Use suggested or default
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Mark suggestion as approved
      await updateDoc(doc(db, 'server_suggestions', suggestion.id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });

      alert(`Сервер "${suggestion.name}" успешно одобрен и добавлен!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'servers');
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    if (window.confirm("Отклонить это предложение?")) {
      try {
        await updateDoc(doc(db, 'server_suggestions', suggestionId), {
          status: 'rejected',
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'server_suggestions');
      }
    }
  };

  const handleDeleteSuggestion = async (suggestionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Удалить предложение окончательно?")) {
      try {
        await deleteDoc(doc(db, 'server_suggestions', suggestionId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'server_suggestions');
      }
    }
  };

  const handleDeleteRemoval = async (removalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Удалить запрос на удаление?")) {
      try {
        await deleteDoc(doc(db, 'server_removals', removalId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'server_removals');
      }
    }
  };

  const handleBlockIp = async (ip: string) => {
    if (window.confirm(`Заблокировать IP ${ip}?`)) {
      try {
        // First check if already blocked
        const q = query(collection(db, 'blocked_ips'), where('ip', '==', ip));
        const snap = await getDocs(q);
        if (!snap.empty) {
          alert("Этот IP уже заблокирован");
          return;
        }

        await addDoc(collection(db, 'blocked_ips'), {
          ip,
          blockedAt: serverTimestamp(),
          reason: 'Заблокирован админом'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'blocked_ips');
      }
    }
  };

  const handleUnblockIp = async (id: string) => {
    if (window.confirm("Разблокировать этот IP?")) {
      try {
        await deleteDoc(doc(db, 'blocked_ips', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'blocked_ips');
      }
    }
  };

  const toggleWarningActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'warnings', id), {
        active: !currentStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'warnings');
    }
  };

  const startEditWarning = (warning: any) => {
    setEditingWarningId(warning.id);
    setWarningFormData({
      text: warning.text,
      type: warning.type,
      active: warning.active,
      replaceContent: warning.replaceContent || false
    });
    setIsAddingWarning(true);
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
      isSpecial: server.isSpecial || false,
      isComingSoon: server.isComingSoon || false,
      isDisappearingSoon: server.isDisappearingSoon || false
    });
    setIsAdding(true);
  };

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

    const expiry = new Date(year, month - 1, day, 23, 59, 59, 999);
    const now = new Date();
    
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours <= 12 && diffHours > 0;
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

        <button 
          onClick={() => {
            setIsAddingWarning(true);
            setEditingWarningId(null);
            setWarningFormData({
              text: '', type: 'info', active: true, replaceContent: false
            });
          }}
          className="px-6 py-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-amber-500 hover:text-white transition-all"
        >
          <Bell className="w-5 h-5" /> Добавить объявление
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
        {isAddingWarning && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <form onSubmit={handleWarningSubmit} className="glass p-8 rounded-[40px] border border-amber-500/20">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-serif italic text-amber-500">{editingWarningId ? 'Редактировать объявление' : 'Новое объявление'}</h2>
                </div>
                <button type="button" onClick={() => setIsAddingWarning(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Текст сообщения</label>
                  <textarea 
                    required
                    value={warningFormData.text}
                    onChange={e => setWarningFormData({...warningFormData, text: e.target.value})}
                    placeholder="Например: Технические работы на серверах..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-4 focus:border-amber-500/30 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/30 ml-2">Тип</label>
                    <select 
                      value={warningFormData.type}
                      onChange={e => setWarningFormData({...warningFormData, type: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-amber-500/30 transition-all outline-none appearance-none"
                    >
                      <option value="info" className="bg-neutral-900">Инфо (Белый)</option>
                      <option value="warning" className="bg-neutral-900">Предупреждение (Оранжевый)</option>
                      <option value="error" className="bg-neutral-900">Ошибка (Красный)</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col justify-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={warningFormData.active}
                        onChange={e => setWarningFormData({...warningFormData, active: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-amber-500"
                      />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">Показать сейчас</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={warningFormData.replaceContent}
                        onChange={e => setWarningFormData({...warningFormData, replaceContent: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-amber-500"
                      />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">Заменить весь список серверов</span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 rounded-3xl bg-amber-500 text-black font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all"
                >
                  <Save className="w-5 h-5" /> {editingWarningId ? 'Обновить объявление' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

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
                
                <div className="flex flex-col justify-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.isSpecial}
                      onChange={e => setFormData({...formData, isSpecial: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-white"
                    />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">Специальный (в папке)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.isComingSoon}
                      onChange={e => setFormData({...formData, isComingSoon: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-amber-500"
                    />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">Скоро будет</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.isDisappearingSoon}
                      onChange={e => setFormData({...formData, isDisappearingSoon: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-white/10 bg-white/5 accent-rose-500"
                    />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">Скоро исчезнет</span>
                  </label>
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

      {warnings.length > 0 && (
        <div className="mb-12 space-y-4">
          <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-4 mb-4">Активные объявления</h2>
          {warnings.map(warning => (
            <motion.div 
              layout
              key={warning.id}
              className={`p-4 rounded-3xl border flex items-center justify-between gap-4 ${
                warning.type === 'error' ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' :
                warning.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' :
                'bg-white/5 border-white/10 text-white/60'
              } ${!warning.active ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="flex items-center gap-4 flex-1">
                {warning.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : 
                 warning.type === 'warning' ? <Bell className="w-5 h-5" /> : 
                 <Info className="w-5 h-5" />}
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{warning.text}</p>
                  <div className="flex gap-3 mt-1">
                    {warning.replaceContent && (
                      <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/20">Hiding Servers</span>
                    )}
                    {!warning.active && (
                      <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/40">Disabled</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleWarningActive(warning.id, warning.active)}
                  className="p-2.5 rounded-xl bg-black/20 hover:bg-black/40 transition-all border border-white/5"
                  title={warning.active ? 'Hide' : 'Show'}
                >
                  {warning.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => startEditWarning(warning)}
                  className="p-2.5 rounded-xl bg-black/20 hover:bg-black/40 transition-all border border-white/5"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleDeleteWarning(warning.id, e)}
                  className="p-2.5 rounded-xl bg-black/20 hover:bg-black/40 transition-all border border-white/5 text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => setAdminActiveTab('active')}
          className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
            adminActiveTab === 'active' ? 'bg-white text-black shadow-xl shadow-white/10' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Активные ({servers.filter(s => {
            const parts = s.expiryDate?.split('.');
            if (!parts || parts.length !== 3) return false;
            const [day, month, year] = parts.map(Number);
            if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
            
            const expiry = new Date(year, month - 1, day);
            expiry.setHours(23, 59, 59, 999);
            const now = new Date();
            return s.status === 'online' && expiry >= now && !s.isComingSoon;
          }).length})
        </button>
        <button 
          onClick={() => setAdminActiveTab('comingSoon')}
          className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
            adminActiveTab === 'comingSoon' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/10' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Скоро будет ({servers.filter(s => s.isComingSoon).length})
        </button>
        <button 
          onClick={() => setAdminActiveTab('inactive')}
          className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
            adminActiveTab === 'inactive' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Неактивные ({servers.filter(s => {
            const parts = s.expiryDate?.split('.');
            if (!parts || parts.length !== 3) return true; // Invalid date counts as inactive if not coming soon
            const [day, month, year] = parts.map(Number);
            if (isNaN(day) || isNaN(month) || isNaN(year)) return true;

            const expiry = new Date(year, month - 1, day);
            expiry.setHours(23, 59, 59, 999);
            const now = new Date();
            return s.status === 'offline' || (expiry < now && !s.isComingSoon);
          }).length})
        </button>
        <button 
          onClick={() => setAdminActiveTab('reports')}
          className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${
            adminActiveTab === 'reports' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Репорты ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button 
          onClick={() => setAdminActiveTab('visits')}
          className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${
            adminActiveTab === 'visits' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Визиты
        </button>
        <button 
          onClick={() => setAdminActiveTab('suggestions')}
          className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${
            adminActiveTab === 'suggestions' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Предложки ({suggestions.filter(s => s.status === 'pending').length})
        </button>
        <button 
          onClick={() => setAdminActiveTab('removals')}
          className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${
            adminActiveTab === 'removals' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Удаление ({removals.filter(r => r.status === 'pending').length})
        </button>
        <button 
          onClick={() => setAdminActiveTab('blocked')}
          className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${
            adminActiveTab === 'blocked' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          Бан ({blockedIps.length})
        </button>
      </div>

      <div className="glass rounded-[40px] border border-white/10 overflow-hidden">
        {adminActiveTab === 'reports' ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Сервер</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Пользователь</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Причина</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Описание</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Статус</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Действия</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="font-serif italic">{report.serverName}</div>
                      <div className="text-[10px] opacity-40">{report.createdAt?.toDate?.().toLocaleString() || 'Неизвестно'}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 group">
                          <code className="text-[10px] text-amber-500">{report.userIp}</code>
                          <button 
                            onClick={() => handleBlockIp(report.userIp)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            title="Заблокировать IP"
                          >
                            <UserX className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] opacity-40">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{report.country}</span>
                        </div>
                        <div className="text-[9px] opacity-40 max-w-[150px] truncate" title={report.browser}>
                          {report.browser}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        report.reason === 'not_working' ? 'bg-rose-500/10 text-rose-500' :
                        report.reason === 'info_error' ? 'bg-amber-500/10 text-amber-500' :
                        report.reason === 'slow_speed' ? 'bg-purple-500/10 text-purple-500' : 'bg-white/10 text-white/60'
                      }`}>
                        {report.reason === 'not_working' ? 'Не работает' :
                         report.reason === 'info_error' ? 'Инфо ошибка' :
                         report.reason === 'slow_speed' ? 'Медленно' : 'Другое'}
                      </span>
                    </td>
                    <td className="p-6 text-xs text-white/60 max-w-xs">{report.description || '-'}</td>
                    <td className="p-6">
                      <select 
                        value={report.status}
                        onChange={(e) => handleUpdateReportStatus(report.id, e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-lg text-xs p-2 focus:outline-none focus:border-white/20"
                      >
                        <option value="pending">Ожидает</option>
                        <option value="resolved">Решено</option>
                        <option value="dismissed">Отклонено</option>
                      </select>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-white/20 italic">Нет активных репортов</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : adminActiveTab === 'visits' ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">IP / Страна</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Браузер</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Время</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Действия</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs text-amber-500">{visit.userIp}</code>
                        <span className="text-[10px] opacity-40 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {visit.country}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-xs opacity-60">
                        <MonitorSmartphone className="w-3 h-3" />
                        <span className="max-w-xs truncate" title={visit.browser}>{visit.browser}</span>
                      </div>
                    </td>
                    <td className="p-6 text-xs opacity-40">
                      {visit.visitedAt?.toDate?.().toLocaleString() || 'Неизвестно'}
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => handleBlockIp(visit.userIp)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                        title="Заблокировать"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-white/20 italic">Нет логов посещений</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : adminActiveTab === 'suggestions' ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">ID / Сервер</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Предложил</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Метаданные</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Конфиг</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Статус</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black w-fit uppercase tracking-tighter">
                          #{s.displayId}
                        </div>
                        <div className="font-bold flex items-center gap-2">
                          {s.name}
                          <span className="text-[10px] opacity-40 font-normal">{s.country} - {s.city}</span>
                        </div>
                        <div className="text-[9px] opacity-40">
                          {s.createdAt?.toDate?.().toLocaleString() || 'Неизвестно'}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-bold">{s.suggestedBy || 'Аноним'}</div>
                      <div className="text-[9px] opacity-40 mt-1 flex items-center gap-1">
                        <code className="text-amber-500/100">{s.userIp}</code>
                        <span>({s.userCountry})</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] text-white/60">
                          <Terminal className="w-3 h-3 text-amber-500" />
                          <span>{s.protocol}</span>
                        </div>
                        {s.expiryDate && (
                          <div className="flex items-center gap-2 text-[10px] text-emerald-500/60">
                            <Calendar className="w-3 h-3" />
                            <span>До {s.expiryDate}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-white/40 max-w-[150px] truncate" title={s.browser}>
                          <MonitorSmartphone className="w-3 h-3" />
                          <span className="truncate">{s.browser || 'Нет данных'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="relative group/config">
                        <div className="max-w-[180px] truncate text-[9px] font-mono p-2 bg-white/5 rounded border border-white/5 cursor-help" title={s.config}>
                          {s.config}
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(s.config);
                            alert("Конфиг скопирован!");
                          }}
                          className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-white text-black opacity-0 group-hover/config:opacity-100 transition-opacity shadow-lg"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        s.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {s.status === 'pending' ? 'Ожидание' :
                         s.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        {s.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveSuggestion(s)}
                              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                              title="Одобрить"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRejectSuggestion(s.id)}
                              className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                              title="Отклонить"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={(e) => handleDeleteSuggestion(s.id, e)}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                          title="Удалить навсегда"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {suggestions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-white/20 italic">Список предложений пуст</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : adminActiveTab === 'removals' ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Сервер / ID Заявки</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Причина</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Пользователь</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Время</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {removals.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div className="font-bold text-rose-500">{r.serverId}</div>
                      <div className="text-[10px] opacity-40 mt-1 flex items-center gap-1 group cursor-help">
                        <Hash className="w-2.5 h-2.5" />
                        <span>{r.suggestionId}</span>
                        {/* Status Check if suggestion ID exists */}
                        {suggestions.some(s => s.displayId === r.suggestionId) ? (
                          <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-tighter ml-2">Verified ID</div>
                        ) : (
                          <div className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[7px] font-black uppercase tracking-tighter ml-2">Unverified ID</div>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs text-white/60 max-w-xs">{r.reason}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <code className="text-[10px] text-amber-500/60">{r.userIp}</code>
                        <div className="text-[9px] opacity-30 italic">{r.userCountry}</div>
                      </div>
                    </td>
                    <td className="p-6 text-[10px] opacity-40">
                      {r.createdAt?.toDate?.().toLocaleString() || 'Неизвестно'}
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={(e) => handleDeleteRemoval(r.id, e)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold uppercase tracking-widest text-[9px]"
                      >
                        Удалить запрос
                      </button>
                    </td>
                  </tr>
                ))}
                {removals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-white/20 italic">Нет запросов на удаление</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : adminActiveTab === 'blocked' ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">IP</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Дата блока</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Причина</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 text-right">Разблокировать</th>
                </tr>
              </thead>
              <tbody>
                {blockedIps.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <code className="text-rose-500 font-bold">{b.ip}</code>
                    </td>
                    <td className="p-6 text-xs opacity-40">
                      {b.blockedAt?.toDate?.().toLocaleString() || 'Неизвестно'}
                    </td>
                    <td className="p-6 text-xs opacity-60 italic">{b.reason}</td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => handleUnblockIp(b.id)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {blockedIps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-white/20 italic">Черный список пуст</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                <th className="p-6">
                  <input 
                    type="checkbox" 
                    onChange={e => {
                      const filteredServers = servers.filter(s => {
                        const parts = s.expiryDate?.split('.');
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
                        const isActive = s.status === 'online' && !isExpired && !s.isComingSoon;
                        const isComing = s.isComingSoon;
                        const isInactive = s.status === 'offline' || (isExpired && !isComing);
                        
                        if (adminActiveTab === 'active') return isActive;
                        if (adminActiveTab === 'comingSoon') return isComing;
                        return isInactive;
                      });
                      if (e.target.checked) setSelectedServers(filteredServers.map(s => s.id));
                      else setSelectedServers([]);
                    }}
                    checked={selectedServers.length > 0 && selectedServers.length === servers.filter(s => {
                      const parts = s.expiryDate?.split('.');
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
                      const isActive = s.status === 'online' && !isExpired && !s.isComingSoon;
                      const isComing = s.isComingSoon;
                      const isInactive = s.status === 'offline' || (isExpired && !isComing);

                      if (adminActiveTab === 'active') return isActive;
                      if (adminActiveTab === 'comingSoon') return isComing;
                      return isInactive;
                    }).length}
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
              {servers.filter(s => {
                const parts = s.expiryDate?.split('.');
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
                const isActive = s.status === 'online' && !isExpired && !s.isComingSoon;
                const isComing = s.isComingSoon;
                const isInactive = s.status === 'offline' || (isExpired && !isComing);

                if (adminActiveTab === 'active') return isActive;
                if (adminActiveTab === 'comingSoon') return isComing;
                return isInactive;
              }).map((server) => {
                const expiring = isExpiringSoon(server.expiryDate) && server.status !== 'offline';
                return (
                  <tr key={server.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${selectedServers.includes(server.id) ? 'bg-white/[0.03]' : ''} ${expiring ? 'bg-amber-500/[0.03]' : ''} ${server.isComingSoon ? 'bg-emerald-500/[0.03]' : ''} relative`}>
                    <td className="p-6">
                      <input 
                        type="checkbox" 
                        checked={selectedServers.includes(server.id)}
                        onChange={() => toggleSelect(server.id)}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 accent-white"
                      />
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col relative">
                        <div className="flex items-center gap-2">
                          <span className="font-serif italic text-lg">{server.name}</span>
                          {(expiring || isCriticallyExpiring(server.expiryDate)) && (
                            <AlertTriangle className={`w-4 h-4 ${isCriticallyExpiring(server.expiryDate) ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                          )}
                          {server.isComingSoon && (
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[8px] font-bold uppercase tracking-widest">Будет</div>
                          )}
                          {server.isDisappearingSoon && (
                            <div className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 text-[8px] font-bold uppercase tracking-widest">Уходит</div>
                          )}
                        </div>
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
                    <div className="flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold border w-fit ${
                        server.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {server.status}
                      </span>
                      {isCriticallyExpiring(server.expiryDate) && (
                        <span className="px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold border w-fit flex items-center gap-1 bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          ИСТЕКАЕТ СЕГОДНЯ
                        </span>
                      )}
                      {server.isComingSoon && (
                        <span className="px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold border w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          СКОРО БУДЕТ
                        </span>
                      )}
                      {(server.isDisappearingSoon || isCriticallyExpiring(server.expiryDate)) && !server.isComingSoon && (
                        <span className="px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold border w-fit bg-rose-500/10 text-rose-500 border-rose-500/20">
                          СКОРО ИСЧЕЗНЕТ
                        </span>
                      )}
                    </div>
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
                );
              })}
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
      )}
    </div>
  </div>
);
}
