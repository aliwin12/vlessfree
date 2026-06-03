import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, AtSign, Settings, Save, X, Globe, Clipboard, Check, 
  Send, Calendar, Cpu, Shield, RefreshCw, AlertCircle, Sparkles,
  Folder, Lock, Copy, ChevronRight, Users
} from 'lucide-react';
import { 
  auth, db, handleFirestoreError, OperationType, 
  collection, query, where, getDocs, limit 
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction, deleteDoc, setDoc, writeBatch, increment, onSnapshot } from 'firebase/firestore';

interface UserProfile {
  username: string;
  displayName: string;
  bio?: string;
  telegram?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const cleanUsername = (username || '').trim().toLowerCase();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Follower/Following lists & statistics
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

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

  // Suggestion tabs
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<'all' | 'keys' | 'subs'>('all');

  // Detailed Modal states (similar to main page)
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<any>(null);

  const [unpackedConfigs, setUnpackedConfigs] = useState<string[]>([]);
  const [loadingUnpack, setLoadingUnpack] = useState(false);
  const [unpackError, setUnpackError] = useState<string | null>(null);
  const [copiedUnpackedIdx, setCopiedUnpackedIdx] = useState<number | null>(null);

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

  // Fetch logged in user profile when auth status changes
  useEffect(() => {
    if (currentUser) {
      const fetchCurrentUserProfile = async () => {
        try {
          const udoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (udoc.exists()) {
            setCurrentUserProfile(udoc.data());
          }
        } catch (e) {
          console.error("Error fetching current user profile for following logic:", e);
        }
      };
      fetchCurrentUserProfile();
    } else {
      setCurrentUserProfile(null);
    }
  }, [currentUser]);

  // Realtime followers and following lists
  useEffect(() => {
    if (!profileUid) return;

    // Realtime followers listener
    const followersUnsub = onSnapshot(collection(db, 'users', profileUid, 'followers'), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push(doc.data());
      });
      setFollowersList(list);
      
      // Auto-update isFollowing state
      if (auth.currentUser) {
        const found = list.some(f => f.followerUid === auth.currentUser?.uid);
        setIsFollowing(found);
      } else {
        setIsFollowing(false);
      }
    }, (err) => {
      console.warn("Could not load followers:", err);
    });

    // Realtime following listener
    const followingUnsub = onSnapshot(collection(db, 'users', profileUid, 'following'), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push(doc.data());
      });
      setFollowingList(list);
    }, (err) => {
      console.warn("Could not load following:", err);
    });

    return () => {
      followersUnsub();
      followingUnsub();
    };
  }, [profileUid, currentUser]);

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

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login'); // We can redirect to AuthPage or equivalent if they are unregistered
      return;
    }
    if (!profileUid || !profile) return;
    
    setFollowActionLoading(true);
    try {
      const batch = writeBatch(db);
      const followerRef = doc(db, 'users', profileUid, 'followers', currentUser.uid);
      const followingRef = doc(db, 'users', currentUser.uid, 'following', profileUid);
      const targetUserRef = doc(db, 'users', profileUid);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      if (isFollowing) {
        // Unfollow logic
        batch.delete(followerRef);
        batch.delete(followingRef);
        batch.update(targetUserRef, {
          followersCount: increment(-1)
        });
        batch.update(currentUserRef, {
          followingCount: increment(-1)
        });
        
        await batch.commit();
        setIsFollowing(false);
      } else {
        // Follow logic
        let fDisplay = currentUser.displayName || 'Пользователь VLESS';
        let fUsername = currentUser.email ? currentUser.email.split('@')[0] : 'user';
        let fAvatar = currentUser.photoURL || '';

        if (currentUserProfile) {
          fDisplay = currentUserProfile.displayName || fDisplay;
          fUsername = currentUserProfile.username || fUsername;
          fAvatar = currentUserProfile.avatarUrl || fAvatar;
        }

        batch.set(followerRef, {
          followerUid: currentUser.uid,
          username: fUsername,
          displayName: fDisplay,
          avatarUrl: fAvatar,
          createdAt: serverTimestamp()
        });

        batch.set(followingRef, {
          followingUid: profileUid,
          username: profile.username || '',
          displayName: profile.displayName || '',
          avatarUrl: profile.avatarUrl || '',
          createdAt: serverTimestamp()
        });

        batch.update(targetUserRef, {
          followersCount: increment(1)
        });
        batch.update(currentUserRef, {
          followingCount: increment(1)
        });

        await batch.commit();
        setIsFollowing(true);
      }
    } catch (err: any) {
      console.error("Error toggling follow status:", err);
      alert('Не удалось изменить статус подписки: ' + (err.message || err));
    } finally {
      setFollowActionLoading(false);
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

  function getSlug(text: string): string {
    const ru: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
      'я': 'ya'
    };
    const transliterated = (text || '')
      .toLowerCase()
      .split('')
      .map(char => ru[char] !== undefined ? ru[char] : char)
      .join('');

    const slug = transliterated
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || 'sub';
  }

  // Effect to automatically fetch and unpack subscription links
  useEffect(() => {
    if (selectedKey && selectedKey.postType === 'subscription') {
      setLoadingUnpack(true);
      setUnpackError(null);
      setUnpackedConfigs([]);

      fetch(`/api/fetch-subscription?url=${encodeURIComponent(selectedKey.config)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return res.json();
        })
        .then(data => {
          const content = data.content || '';
          let text = content;
          const hasProto = content.includes('://');
          const isBase64 = /^[a-zA-Z0-9+/=\s\n\r]+$/.test(content) && content.trim().length > 10 && !hasProto;
          if (isBase64) {
            try {
              text = atob(content.replace(/[\s\n\r]/g, ''));
            } catch (e) {
              console.error("Base64 decode error client-side in profile:", e);
            }
          }
          
          const protos = ['vless://', 'vmess://', 'ss://', 'ssr://', 'trojan://', 'hysteria://', 'hysteria2://', 'tuic://'];
          const lines = text.split(/[\r\n]+/)
            .map((line: string) => line.trim())
            .filter((line: string) => protos.some(proto => line.startsWith(proto)));

          setUnpackedConfigs(lines);
          setLoadingUnpack(false);
        })
        .catch(err => {
          console.error("Error unpacking subscription in profile", err);
          setUnpackError('Не удалось загрузить или распаковать папку-подписку.');
          setLoadingUnpack(false);
        });
    } else {
      setUnpackedConfigs([]);
      setLoadingUnpack(false);
      setUnpackError(null);
    }
  }, [selectedKey]);

  const handleCopy = (id: any, config: string, name: string, isSub: boolean) => {
    if (isSub) {
      const urlUser = profile?.username || 'anonymous';
      const cleanSubName = getSlug(name || '');
      const customSubUrl = `https://vlessfree.vercel.app/${urlUser}/${cleanSubName}`;
      navigator.clipboard.writeText(customSubUrl);
    } else {
      navigator.clipboard.writeText(config);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyUnpackedConfig = (idx: number, config: string) => {
    if (!selectedKey) return;
    let configWithoutTag = config;
    if (config.includes('#')) {
      configWithoutTag = config.split('#')[0];
    }
    const cleanUsername = profile?.username || 'anonymous';
    const tag = `${selectedKey.name} | от @${cleanUsername} | vlessfree [${idx + 1}]`;
    const finalConfig = `${configWithoutTag}#${encodeURIComponent(tag)}`;

    navigator.clipboard.writeText(finalConfig);
    setCopiedUnpackedIdx(idx);
    setTimeout(() => setCopiedUnpackedIdx(null), 2000);
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

              {/* Followers and Following Counters */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 pt-3 font-mono border-t border-white/5">
                <button 
                  onClick={() => setShowFollowersModal(true)}
                  className="flex items-center gap-2 hover:text-indigo-400 transition-colors text-left"
                  title="Посмотреть подписчиков"
                >
                  <span className="text-base sm:text-lg font-bold text-white">
                    {followersList.length}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-semibold">
                    подписчиков
                  </span>
                </button>
                
                <button 
                  onClick={() => setShowFollowingModal(true)}
                  className="flex items-center gap-3 hover:text-indigo-400 transition-colors text-left"
                  title="Посмотреть подписки"
                >
                  <span className="text-base sm:text-lg font-bold text-white">
                    {followingList.length}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-semibold">
                    подписок
                  </span>
                </button>
              </div>

              {/* Guest Follow Button */}
              {!isOwner && (
                <div className="pt-2 flex justify-center md:justify-start">
                  <button
                    onClick={handleFollowToggle}
                    disabled={followActionLoading}
                    className={`px-5 py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-widest font-extrabold transition-all duration-300 flex items-center justify-center gap-2 border ${
                      isFollowing
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500 hover:text-white hover:shadow-[0_4px_20px_rgba(244,63,94,0.3)]'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01]'
                    }`}
                  >
                    {followActionLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : isFollowing ? (
                      <>Вы подписаны • Отписаться</>
                    ) : (
                      <>Подписаться на канал</>
                    )}
                  </button>
                </div>
              )}
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
                <h3 className="text-lg font-bold tracking-tight mb-6 select-none text-center sm:text-left">
                  Рекомендации серверов от {profile.displayName} ({userSuggestions.length})
                </h3>

                {/* Tabs / Segmented Control */}
                <div className="flex justify-center sm:justify-start mb-8 shrink-0">
                  <div className="glass p-1 rounded-2xl flex gap-1 bg-white/5 border border-white/5">
                    <button 
                      onClick={() => setActiveSuggestionTab('all')}
                      className={`px-5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                        activeSuggestionTab === 'all' 
                        ? 'bg-white text-black shadow-xl scale-[1.02]' 
                        : 'text-white/40 hover:text-white/65'
                      }`}
                    >
                      Все
                    </button>
                    <button 
                      onClick={() => setActiveSuggestionTab('keys')}
                      className={`px-5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                        activeSuggestionTab === 'keys' 
                        ? 'bg-white text-black shadow-xl scale-[1.02]' 
                        : 'text-white/40 hover:text-white/65'
                      }`}
                    >
                      VLESS-ключи
                    </button>
                    <button 
                      onClick={() => setActiveSuggestionTab('subs')}
                      className={`px-5 py-2.5 rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                        activeSuggestionTab === 'subs' 
                        ? 'bg-emerald-500 text-white shadow-xl scale-[1.02]' 
                        : 'text-white/40 hover:text-white/65'
                      }`}
                    >
                      Подписки
                    </button>
                  </div>
                </div>

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
                  <>
                    {(() => {
                      const filteredSuggestions = userSuggestions.filter((item) => {
                        const isSub = item.postType === 'subscription';
                        if (activeSuggestionTab === 'keys') return !isSub;
                        if (activeSuggestionTab === 'subs') return isSub;
                        return true;
                      });

                      if (filteredSuggestions.length === 0) {
                        return (
                          <div className="glass rounded-[24px] border border-dashed border-white/10 p-12 text-center">
                            <p className="text-sm text-white/40 select-none">В этом разделе пока пусто.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                          {filteredSuggestions.map((item, index) => {
                            const isSub = item.postType === 'subscription';
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                className={`glass rounded-[20px] md:rounded-[32px] p-5 md:p-8 group hover:border-white/30 transition-all duration-500 flex flex-col justify-between gap-6 relative overflow-hidden ${
                                  item.status === 'offline' || item.status === 'rejected' ? 'opacity-65 grayscale' : ''
                                } ${
                                  isSub ? 'border-emerald-500/20 bg-emerald-500/[0.015]' : ''
                                }`}
                              >
                                
                                <div className="flex justify-between items-start">
                                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-500 ${
                                    item.status === 'offline' ? 'bg-rose-500/10 text-rose-500' : 
                                    isSub ? 'bg-emerald-500/10 text-emerald-400' : ''
                                  }`}>
                                    {isSub ? <Folder className="w-4 h-4 md:w-6 md:h-6" /> : <Globe className="w-4 h-4 md:w-6 md:h-6" />}
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <div className={`px-2 py-0.5 rounded-lg border text-[8px] md:text-[9px] uppercase tracking-widest font-mono font-bold select-none ${
                                      item.status === 'approved' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : item.status === 'rejected'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                      {item.status === 'approved' ? 'Одобрен' : item.status === 'rejected' ? 'Отклонен' : 'На проверке'}
                                    </div>
                                    <button 
                                      onClick={() => setSelectedKey(item)}
                                      className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30 hover:opacity-100 transition-opacity ml-1.5"
                                    >
                                      Подробнее
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg md:text-xl font-serif italic tracking-tight text-white line-clamp-1">{item.name || 'Анонимный сервер'}</h3>
                                    {item.status === 'unstable' && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[7px] md:text-[8px] uppercase tracking-widest font-bold border border-amber-500/20">
                                        Нестабильный
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-white/40">
                                    {isSub ? 'Нигде • Общая папка-подписка' : (item.location || 'Локация не указана')}
                                  </p>
                                </div>

                                {item.reason && item.status === 'rejected' && (
                                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                                    <p className="text-[9px] text-rose-500/60 uppercase tracking-widest font-bold mb-0.5 font-mono">Причина отклонения:</p>
                                    <p className="text-xs text-rose-500/80 leading-relaxed font-sans">{item.reason}</p>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30 font-mono">
                                  <Calendar className="w-3 h-3" />
                                  <span>До: {item.expiryDate || 'Бессрочно'}</span>
                                </div>

                                <div className="flex flex-col gap-3 relative z-20">
                                  <button
                                    onClick={() => handleCopy(item.id, item.config, item.name, isSub)}
                                    disabled={item.status === 'rejected'}
                                    className={`w-full py-3 md:py-3.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                      item.status === 'rejected'
                                      ? 'bg-white/5 text-white/20 cursor-not-allowed border border-transparent'
                                      : copiedId === item.id 
                                      ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                                      : isSub
                                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-transparent'
                                      : 'bg-white/5 hover:bg-white hover:text-black border border-white/5'
                                    }`}
                                  >
                                    {copiedId === item.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" /> Скопировано
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" /> {isSub ? 'Скопировать ссылку' : 'Скопировать конфиг'}
                                      </>
                                    )}
                                  </button>
                                </div>

                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Local selected key details modal */}
        <AnimatePresence>
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
                className="relative max-w-lg w-full glass rounded-[24px] md:rounded-[40px] p-5 md:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedKey(null)}
                  className="absolute top-4 md:top-6 right-4 md:right-6 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </button>

                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/5 flex items-center justify-center mb-6 md:mb-8">
                  {selectedKey.postType === 'subscription' ? (
                    <Folder className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
                  ) : (
                    <Globe className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  )}
                </div>

                <h2 className="text-2xl md:text-3xl font-serif italic mb-1 md:mb-2 tracking-tighter text-white">
                  {selectedKey.name}
                </h2>
                <p className="text-white/40 text-xs md:text-sm mb-6 md:mb-8">
                  {selectedKey.postType === 'subscription' ? 'Нигде • Общая папка-подписка без пароля' : (selectedKey.location || 'Рекомендация пользователя')}
                </p>

                <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 text-left">
                  <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30">Протокол</span>
                    <span className="text-xs md:text-sm font-mono text-white">
                      {selectedKey.postType === 'subscription' ? 'Subscription Link' : (selectedKey.protocol || 'VLESS')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30">Активен до</span>
                    <span className="text-xs md:text-sm font-mono text-white">{selectedKey.expiryDate || 'Бессрочно'}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-30">Статус</span>
                    <span className={`text-xs md:text-sm flex items-center gap-2 ${
                      selectedKey.status === 'approved' ? 'text-emerald-500' : 
                      selectedKey.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'
                    }`}>
                      <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse ${
                        selectedKey.status === 'approved' ? 'bg-emerald-500' : 
                        selectedKey.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      {selectedKey.status === 'approved' ? 'Одобрен' : 
                       selectedKey.status === 'rejected' ? 'Отклонен' : 'На проверке'}
                    </span>
                  </div>
                </div>

                {selectedKey.postType === 'subscription' && selectedKey.status === 'approved' && (
                  <div className="mt-2 border-t border-white/5 pt-6 pb-6 text-left">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold opacity-30 mb-3 flex justify-between items-center">
                      <span>Содержимое папки (авто-распаковка)</span>
                      <span className="text-emerald-400 font-mono lowercase">
                        {loadingUnpack ? 'распаковка...' : `${unpackedConfigs.length} серверов`}
                      </span>
                    </h3>

                    {loadingUnpack ? (
                      <div className="space-y-2 py-2">
                        <div className="h-11 bg-white/5 rounded-xl animate-pulse" />
                        <div className="h-11 bg-white/5 rounded-xl animate-pulse" />
                      </div>
                    ) : unpackError ? (
                      <p className="text-xs text-rose-500 py-2">{unpackError}</p>
                    ) : unpackedConfigs.length === 0 ? (
                      <p className="text-xs text-white/30 italic py-2">В этой папке пока нет распакованных конфигураций.</p>
                    ) : (
                      <div className="space-y-2 max-h-[190px] overflow-y-auto pr-2 custom-scrollbar">
                        {unpackedConfigs.map((config, idx) => {
                          const proto = config.split('://')[0].toUpperCase();
                          return (
                            <div key={idx} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl hover:bg-white/[0.04] transition-all">
                              <div className="flex flex-col gap-0.5 truncate pr-4">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{proto} НАСТРОЙКА #{idx + 1}</span>
                                <span className="text-[11px] text-white/70 font-mono truncate">
                                  {config.split('#')[1] ? decodeURIComponent(config.split('#')[1]) : config.substring(0, 45) + '...'}
                                </span>
                              </div>
                              <button
                                onClick={() => copyUnpackedConfig(idx, config)}
                                className={`p-2 rounded-lg transition-all shrink-0 ${
                                  copiedUnpackedIdx === idx 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-white/5 text-white/60 hover:bg-white hover:text-black hover:scale-105'
                                }`}
                                title="Копировать конфигурацию"
                              >
                                {copiedUnpackedIdx === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      const isSub = selectedKey.postType === 'subscription';
                      handleCopy(selectedKey.id, selectedKey.config, selectedKey.name, isSub);
                    }}
                    disabled={selectedKey.status === 'rejected'}
                    className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                      selectedKey.status === 'rejected'
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : copiedId === selectedKey.id 
                      ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                      : selectedKey.postType === 'subscription'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                      : 'bg-white text-black hover:bg-white/90'
                    }`}
                  >
                    {copiedId === selectedKey.id ? (
                      <>
                        <Check className="w-4 h-4" /> Скопировано в буфер
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> {selectedKey.postType === 'subscription' ? 'Скопировать ссылку' : 'Скопировать VLESS ключ'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Followers Modal */}
        <AnimatePresence>
          {showFollowersModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowFollowersModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative max-w-md w-full glass rounded-[24px] md:rounded-[40px] p-6 md:p-10 max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowFollowersModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                  Подписчики
                </h2>
                <p className="text-white/40 text-xs mb-6 font-mono">
                  Всего подписчиков на канал: {followersList.length}
                </p>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {followersList.length === 0 ? (
                    <div className="text-center py-10 text-white/30 italic text-xs font-mono">
                      Список подписчиков пуст
                    </div>
                  ) : (
                    followersList.map((follower, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                        onClick={() => {
                          setShowFollowersModal(false);
                          navigate(`/user/${follower.username}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={follower.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${follower.username}`}
                            alt={follower.displayName} 
                            className="w-10 h-10 rounded-xl bg-black/45 border border-white/10 p-1 group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{follower.displayName}</h4>
                            <span className="text-[10px] font-mono text-white/40">@{follower.username}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Following Modal */}
        <AnimatePresence>
          {showFollowingModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
              onClick={() => setShowFollowingModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative max-w-md w-full glass rounded-[24px] md:rounded-[40px] p-6 md:p-10 max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowFollowingModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                  Подписки
                </h2>
                <p className="text-white/40 text-xs mb-6 font-mono">
                  Интересные каналы пользователя: {followingList.length}
                </p>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {followingList.length === 0 ? (
                    <div className="text-center py-10 text-white/30 italic text-xs font-mono">
                      Список подписок пуст
                    </div>
                  ) : (
                    followingList.map((followed, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                        onClick={() => {
                          setShowFollowingModal(false);
                          navigate(`/user/${followed.username}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={followed.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${followed.username}`}
                            alt={followed.displayName} 
                            className="w-10 h-10 rounded-xl bg-black/45 border border-white/10 p-1 group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{followed.displayName}</h4>
                            <span className="text-[10px] font-mono text-white/40">@{followed.username}</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
