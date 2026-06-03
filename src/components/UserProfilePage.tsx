import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, AtSign, Settings, Save, X, Globe, Clipboard, Check, 
  Send, Calendar, Cpu, Shield, RefreshCw, AlertCircle, Sparkles 
} from 'lucide-react';
import { 
  auth, db, handleFirestoreError, OperationType, 
  collection, query, where, getDocs, limit 
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction, deleteDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  username: string;
  displayName: string;
  bio?: string;
  telegram?: string;
  avatarUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const cleanUsername = (username || '').trim().toLowerCase();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Editing state toggler
  const [isEditing, setIsEditing] = useState(false);
  
  // Suggested servers array by this profile
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Form edit fields
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // Listener to track auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch profile logic
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!cleanUsername) return;
      setLoading(true);
      setNotFound(false);
      setIsEditing(false);

      try {
        // Step 1: Find user ID associated with this username
        const usernameDocRef = doc(db, 'usernames', cleanUsername);
        const usernameDocSnap = await getDoc(usernameDocRef);

        if (!usernameDocSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const uid = usernameDocSnap.data().uid;
        setProfileUid(uid);

        // Step 2: Fetch public profile fields
        const profileDocRef = doc(db, 'users', uid);
        const profileDocSnap = await getDoc(profileDocRef);

        if (profileDocSnap.exists()) {
          const profileData = profileDocSnap.data() as UserProfile;
          setProfile(profileData);
          
          // Initialize edit inputs
          setEditUsername(profileData.username || '');
          setEditDisplayName(profileData.displayName || '');
          setEditBio(profileData.bio || '');
          setEditTelegram(profileData.telegram || '');
          setEditAvatarUrl(profileData.avatarUrl || '');

          // Step 3: Fetch their successfully verified suggestions
          if (uid) {
            fetchUserSuggestions(uid);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [cleanUsername]);

  const fetchUserSuggestions = async (uid: string) => {
    setLoadingSuggestions(true);
    try {
      // Query serverSuggestions collection where userId == uid
      const suggestionsRef = collection(db, 'server_suggestions');
      
      // Check synchronously if the current signed in user is the owner of the profile
      const currentAuthedUser = auth.currentUser;
      const isProfileOwner = currentAuthedUser && currentAuthedUser.uid === uid;

      let q;
      if (isProfileOwner) {
        // Owner can query all of their own suggestions (pending, approved, rejected)
        q = query(suggestionsRef, where('userId', '==', uid));
      } else {
        // Guests or other users can only query approved suggestions
        q = query(suggestionsRef, where('userId', '==', uid), where('status', '==', 'approved'));
      }

      const querySnapshot = await getDocs(q);
      
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() as any });
      });
      
      // Sort suggestions by createdAt if local JS format allows
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setUserSuggestions(items);
    } catch (error) {
      console.warn("Could not query user suggestions (possibly missing rules):", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUid || !currentUser || currentUser.uid !== profileUid) return;

    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      if (!editDisplayName.trim()) {
        throw new Error('Имя для отображения не может быть пустым.');
      }

      const cleanEditUsername = editUsername.trim().toLowerCase();
      const oldUsername = (profile?.username || '').trim().toLowerCase();
      const usernameChanged = cleanEditUsername !== oldUsername;

      if (usernameChanged) {
        const validateUsername = (uname: string) => {
          return uname.length >= 3 && uname.length <= 15 && /^[a-zA-Z0-9_]+$/.test(uname);
        };
        if (!validateUsername(cleanEditUsername)) {
          throw new Error('Имя пользователя должно состоять из 3-15 латинских букв, цифр или символа подчеркивания.');
        }

        await runTransaction(db, async (transaction) => {
          const newUsernameRef = doc(db, 'usernames', cleanEditUsername);
          const oldUsernameRef = doc(db, 'usernames', oldUsername);
          const userDocRef = doc(db, 'users', profileUid);

          const newUsernameSnap = await transaction.get(newUsernameRef);
          if (newUsernameSnap.exists()) {
            throw new Error(`Имя пользователя @${cleanEditUsername} уже занято.`);
          }

          transaction.set(newUsernameRef, {
            uid: profileUid,
            createdAt: serverTimestamp()
          });

          transaction.delete(oldUsernameRef);

          transaction.update(userDocRef, {
            username: cleanEditUsername,
            displayName: editDisplayName.trim(),
            bio: editBio.trim(),
            telegram: editTelegram.trim().replace(/^@/, ''),
            avatarUrl: editAvatarUrl.trim(),
            updatedAt: serverTimestamp()
          });
        });

        // Reflect in local state
        const payload = {
          username: cleanEditUsername,
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          telegram: editTelegram.trim().replace(/^@/, ''),
          avatarUrl: editAvatarUrl.trim()
        };
        setProfile((prev) => prev ? { ...prev, ...payload } : null);
        setUpdateSuccess('Имя пользователя и профиль успешно изменены! Перенаправление...');

        setTimeout(() => {
          setIsEditing(false);
          setUpdateSuccess('');
          navigate(`/user/${cleanEditUsername}`);
        }, 1500);

      } else {
        const userDocRef = doc(db, 'users', profileUid);
        
        const payload = {
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          telegram: editTelegram.trim().replace(/^@/, ''), // Save raw username
          avatarUrl: editAvatarUrl.trim(),
          updatedAt: serverTimestamp()
        };

        await updateDoc(userDocRef, payload);

        // Reflect in local state
        setProfile((prev) => prev ? { ...prev, ...payload } : null);
        setUpdateSuccess('Настройки профиля сохранены успешно!');
        
        setTimeout(() => {
          setIsEditing(false);
          setUpdateSuccess('');
        }, 1500);
      }

    } catch (err: any) {
      console.error(err);
      setUpdateError(err.message || 'Произошла ошибка при обновлении профиля.');
    } finally {
      setUpdating(false);
    }
  };

  // Helper formatting for dates
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const generateDefaultAvatar = () => {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
  };

  const selectPredefinedAvatar = (seed: string) => {
    setEditAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  // Check ownership
  const isOwner = currentUser && profileUid && currentUser.uid === profileUid;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center pt-24 font-sans">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-white/40 tracking-wider font-mono text-xs uppercase animate-pulse">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 pt-24 font-sans">
        <div className="glass max-w-md w-full border border-white/5 rounded-[40px] p-10 text-center relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 select-none">Канал не найден</h2>
          <p className="text-white/50 text-xs sm:text-sm leading-relaxed mb-8">
            Запрашиваемый профиль кошелька VLESS Free не зарегистрирован в нашей системе или был удален.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold font-mono tracking-wider transition-all"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white pt-28 pb-20 px-4 font-sans">
      
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-purple-500/5 blur-[140px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10" id="profile-container">
        
        {/* Profile Card Header */}
        <div className="glass rounded-[32px] border border-white/10 p-6 md:p-10 mb-8 relative overflow-hidden">
          
          {/* Top-Right Settings Button for Owners */}
          {isOwner && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-6 right-6 p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/5 text-white/70 hover:text-white transition-all text-sm uppercase tracking-wider font-semibold flex items-center gap-2 z-25"
            >
              {isEditing ? <X size={15} /> : <Settings size={15} />}
              <span className="hidden sm:inline">{isEditing ? 'Закрыть' : 'Настройки'}</span>
            </button>
          )}

          {/* Social Avatar & Profile info */}
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <img 
                src={profile.avatarUrl || generateDefaultAvatar()} 
                alt={profile.displayName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateDefaultAvatar();
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] border-2 border-white/20 bg-black/60 object-cover relative z-10 p-2 shrink-0 transition-transform duration-300 group-hover:scale-[1.03]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-1 right-1 z-20 bg-indigo-500 text-white rounded-full p-1.5 border-2 border-black">
                <Sparkles size={11} className="animate-pulse" />
              </div>
            </div>

            <div className="flex-1 space-y-3 pt-2">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
                  {profile.displayName}
                </h1>
                <p className="text-sm font-mono text-indigo-400 font-semibold tracking-wider flex items-center justify-center md:justify-start gap-1">
                  <AtSign size={14} />{profile.username}
                </p>
              </div>

              {profile.bio ? (
                <p className="text-xs sm:text-sm text-white/70 font-light max-w-xl leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-xs text-white/30 italic font-mono">Био отсутствует</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-mono text-white/40">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Регистрация: {formatDate(profile.createdAt)}
                </span>
                
                {profile.telegram && (
                  <a 
                    href={`https://t.me/${profile.telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-full transition-all duration-200"
                  >
                    <Send size={11} />
                    @{profile.telegram}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic View Settings vs Suggestions list */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass rounded-[32px] border border-white/10 p-6 md:p-10 mb-8"
            >
              <h3 className="text-xl font-bold tracking-tight mb-1 select-none">Настройки Вашего Профиля</h3>
              <p className="text-xs text-white/40 mb-8">Отредактируйте публичные параметры вашего профиля-канала</p>

              {updateError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-3 px-4 rounded-xl mb-6 flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{updateError}</span>
                </div>
              )}

              {updateSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-3 px-4 rounded-xl mb-6 flex gap-2">
                  <Check size={16} className="shrink-0 mt-0.5" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfileSubmit} className="space-y-6">
                
                {/* Visual Seeds presets picker for Avatars */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Аватар</label>
                  <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <img 
                      src={editAvatarUrl || generateDefaultAvatar()} 
                      alt="avatar preview"
                      className="w-14 h-14 rounded-2xl border border-white/10 p-1 bg-black/40"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <p className="text-[10px] text-white/40 font-mono">Выберите один из готовых пресетов:</p>
                      <div className="flex flex-wrap gap-2">
                        {['vless', 'speed', 'turbo', 'shadow', 'crypt'].map(seed => (
                          <button
                            key={seed}
                            type="button"
                            onClick={() => selectPredefinedAvatar(seed)}
                            className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/5 border border-white/10 rounded-lg hover:border-indigo-500/40 transition-all uppercase"
                          >
                            {seed}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input 
                      type="url"
                      value={editAvatarUrl}
                      onChange={e => setEditAvatarUrl(e.target.value)}
                      placeholder="Или вставьте ссылку на картинку (https://...)"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-xl px-4 py-3 outline-none text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Username (@nickname) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Имя пользователя (латиница)</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      required
                      type="text"
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="alex_vless"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-11 pr-5 py-3.5 outline-none text-sm font-mono text-white"
                    />
                  </div>
                  <p className="text-[9px] text-[#ffdd67]/60 ml-1">
                    ⚠️ Внимание: изменение имени пользователя изменит адрес вашей страницы профиля!
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Публичное имя</label>
                  <input 
                    required
                    type="text"
                    value={editDisplayName}
                    onChange={e => setEditDisplayName(e.target.value)}
                    placeholder="Ваше имя"
                    maxLength={40}
                    className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl px-4 py-3.5 outline-none text-sm font-sans"
                  />
                </div>

                {/* Bio text block */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">О себе (Био)</label>
                  <textarea 
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    placeholder="Напишите кратко о себе или ваших VPN серверах..."
                    maxLength={200}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl px-4 py-3.5 outline-none text-sm font-sans resize-none"
                  />
                </div>

                {/* Telegram tag input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Никнейм в Telegram</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-white/30">@</span>
                    <input 
                      type="text"
                      value={editTelegram}
                      onChange={e => setEditTelegram(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="vlessfree_user"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-8 pr-4 py-3.5 outline-none text-sm font-mono text-white"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 border border-white/10 hover:bg-white/5 rounded-2xl text-xs uppercase font-extrabold tracking-widest transition-colors text-white/60"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs uppercase font-extrabold tracking-widest transition-colors shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                  >
                    {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={14} />}
                    Сохранить изменения
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            <motion.div
              key="content-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Profile suggestions list section */}
              <div className="mb-6">
                <h3 className="text-lg font-bold tracking-tight mb-4 select-none">
                  Рекомендации серверов от {profile.displayName} ({userSuggestions.length})
                </h3>

                {loadingSuggestions ? (
                  <div className="flex items-center gap-3 py-10 justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-white/40" />
                    <span className="text-xs font-mono text-white/40 uppercase">Получение предложений...</span>
                  </div>
                ) : userSuggestions.length === 0 ? (
                  <div className="glass rounded-[24px] border border-dashed border-white/10 p-12 text-center">
                    <Globe className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-sm text-white/40 select-none">Пользователь пока не добавил ни одного сервера.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userSuggestions.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold mb-2 inline-block">
                              ID {item.displayId}
                            </span>
                            <h4 className="text-base font-bold tracking-tight text-white mb-1 line-clamp-1">
                              {item.name || 'Анонимный сервер'}
                            </h4>
                            <p className="text-xs font-mono text-white/30 flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" />
                              {item.protocol || 'VLESS'}
                            </p>
                          </div>

                          <div className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-widest rounded-lg border font-mono select-none ${
                            item.status === 'approved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : item.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {item.status === 'approved' ? 'Одобрен' : item.status === 'rejected' ? 'Отклонен' : 'На проверке'}
                          </div>
                        </div>

                        {/* Config view block for approved item */}
                        {item.status === 'approved' ? (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1.5 font-mono">Конфиг сервера</span>
                            <div className="flex bg-[#030304] border border-white/5 rounded-xl px-3 py-2 justify-between items-center relative overflow-hidden group">
                              <code className="text-[10px] font-mono text-white/40 truncate select-all">{item.config}</code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.config);
                                }}
                                className="p-1 px-2.5 ml-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-mono font-bold uppercase shrink-0 transition-colors"
                              >
                                Копировать
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-white/5">
                            <p className="text-[10px] font-mono text-white/30 text-center italic">Конфиг скрыт на время проверки</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
