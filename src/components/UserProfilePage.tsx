import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, AtSign, Settings, Save, X, Globe, Clipboard, Check, 
  Send, Calendar, Cpu, Shield, RefreshCw, AlertCircle, Sparkles,
  Folder, Lock, Copy, ChevronRight, Users, Zap, Flame, Heart, Server
} from 'lucide-react';
import { 
  auth, db, handleFirestoreError, OperationType, 
  collection, query, where, getDocs, limit 
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction, deleteDoc, setDoc, writeBatch, increment, onSnapshot } from 'firebase/firestore';

const getCustomIcon = (iconName: string, isSub: boolean) => {
  switch (iconName) {
    case 'Shield': return <Shield className="w-4 h-4 md:w-6 md:h-6" />;
    case 'Zap': return <Zap className="w-4 h-4 md:w-6 md:h-6 text-amber-400" />;
    case 'Flame': return <Flame className="w-4 h-4 md:w-6 md:h-6 text-rose-500" />;
    case 'Sparkles': return <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-indigo-400" />;
    case 'Heart': return <Heart className="w-4 h-4 md:w-6 md:h-6 text-red-500" />;
    case 'Server': return <Server className="w-4 h-4 md:w-6 md:h-6 text-indigo-300" />;
    default: return isSub ? <Folder className="w-4 h-4 md:w-6 md:h-6" /> : <Globe className="w-4 h-4 md:w-6 md:h-6" />;
  }
};

const profileColors: Record<string, { accent: string; bg: string; text: string; shadow: string; border: string }> = {
  indigo: { accent: 'bg-indigo-600 hover:bg-indigo-500', bg: 'indigo-500', text: 'text-indigo-400', shadow: 'rgba(99,102,241,0.25)', border: 'border-indigo-500/20' },
  emerald: { accent: 'bg-emerald-600 hover:bg-emerald-500', bg: 'emerald-500', text: 'text-emerald-400', shadow: 'rgba(16,185,129,0.25)', border: 'border-emerald-500/20' },
  amber: { accent: 'bg-amber-600 hover:bg-amber-500', bg: 'amber-500', text: 'text-amber-400', shadow: 'rgba(245,158,11,0.25)', border: 'border-amber-500/20' },
  rose: { accent: 'bg-rose-600 hover:bg-rose-500', bg: 'rose-500', text: 'text-rose-400', shadow: 'rgba(244,63,94,0.25)', border: 'border-rose-500/20' },
  violet: { accent: 'bg-violet-600 hover:bg-violet-500', bg: 'violet-500', text: 'text-violet-400', shadow: 'rgba(139,92,246,0.25)', border: 'border-violet-500/20' },
  sky: { accent: 'bg-sky-600 hover:bg-sky-500', bg: 'sky-500', text: 'text-sky-400', shadow: 'rgba(14,165,233,0.25)', border: 'border-sky-500/20' }
};

const bannerPresets = [
  { id: 'preset1', name: 'Абстракция', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  { id: 'preset2', name: 'Рассвет', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80' },
  { id: 'preset3', name: 'Аврора', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80' },
  { id: 'preset4', name: 'Неон', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80' },
  { id: 'preset5', name: 'Космос', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80' },
  { id: 'preset6', name: 'Матрица', url: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80' }
];

interface UserProfile {
  username: string;
  displayName: string;
  bio?: string;
  telegram?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  followersCount?: number;
  followingCount?: number;
  createdAt?: any;
  updatedAt?: any;
  statusText?: string;
  profileColor?: string;
  donationUrl?: string;
  contactOther?: string;
  showHistoryOnPublic?: boolean;
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const cleanUsername = (username || '').trim().toLowerCase();

  const getProfileColors = (col?: string) => {
    switch (col) {
      case 'emerald':
        return {
          glow: 'bg-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]',
          border: 'border-emerald-500/30 hover:border-emerald-500/40',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/30',
          followBg: 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          avatarGlow: 'bg-emerald-500/20'
        };
      case 'amber':
        return {
          glow: 'bg-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]',
          border: 'border-amber-500/30 hover:border-amber-500/40',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/10 hover:bg-amber-500/30',
          followBg: 'bg-amber-600 hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
          avatarGlow: 'bg-amber-500/20'
        };
      case 'rose':
        return {
          glow: 'bg-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.1)]',
          border: 'border-rose-500/30 hover:border-rose-500/40',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/10 hover:bg-rose-500/30',
          followBg: 'bg-rose-600 hover:bg-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]',
          avatarGlow: 'bg-rose-500/20'
        };
      case 'violet':
        return {
          glow: 'bg-violet-500/20 shadow-[0_0_50px_rgba(139,92,246,0.1)]',
          border: 'border-violet-500/30 hover:border-violet-500/40',
          text: 'text-violet-400',
          badge: 'bg-violet-500/20 text-violet-400 border-violet-500/10 hover:bg-violet-500/30',
          followBg: 'bg-violet-600 hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]',
          avatarGlow: 'bg-violet-500/20'
        };
      case 'sky':
        return {
          glow: 'bg-sky-500/20 shadow-[0_0_50px_rgba(14,165,233,0.1)]',
          border: 'border-sky-500/30 hover:border-sky-500/40',
          text: 'text-sky-400',
          badge: 'bg-sky-500/20 text-sky-400 border-sky-500/10 hover:bg-sky-500/30',
          followBg: 'bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]',
          avatarGlow: 'bg-sky-500/20'
        };
      default:
        return {
          glow: 'bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]',
          border: 'border-indigo-500/30 hover:border-indigo-500/40',
          text: 'text-indigo-400',
          badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/10 hover:bg-indigo-500/30',
          followBg: 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
          avatarGlow: 'bg-indigo-500/20'
        };
    }
  };

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [profileUid, setProfileUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const activeColors = getProfileColors(profile?.profileColor);
  
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
  const [editBannerUrl, setEditBannerUrl] = useState('');

  const [editStatusText, setEditStatusText] = useState('');
  const [editProfileColor, setEditProfileColor] = useState('indigo');
  const [editDonationUrl, setEditDonationUrl] = useState('');
  const [editContactOther, setEditContactOther] = useState('');
  const [editShowHistoryOnPublic, setEditShowHistoryOnPublic] = useState(true);

  // States for editing suggestions
  const [editingPost, setEditingPost] = useState<any>(null);
  const [savingPost, setSavingPost] = useState(false);
  const [editPostName, setEditPostName] = useState('');
  const [editPostExpiryDate, setEditPostExpiryDate] = useState('');
  const [editPostStatus, setEditPostStatus] = useState<'online' | 'unstable' | 'offline'>('online');
  const [editPostNotes, setEditPostNotes] = useState('');
  const [editPostCategory, setEditPostCategory] = useState('');
  const [editPostIcon, setEditPostIcon] = useState('');
  const [editPostIsPrivate, setEditPostIsPrivate] = useState(false);
  const [editPostHideAuthor, setEditPostHideAuthor] = useState(false);
  const [editPostAllowedClients, setEditPostAllowedClients] = useState<string[]>([]);
  const [editPostSpeedLimit, setEditPostSpeedLimit] = useState('');
  const [editPostIsPinned, setEditPostIsPinned] = useState(false);

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
          setEditBannerUrl(profileData.bannerUrl || '');
          setEditStatusText(profileData.statusText || '');
          setEditProfileColor(profileData.profileColor || 'indigo');
          setEditDonationUrl(profileData.donationUrl || '');
          setEditContactOther(profileData.contactOther || '');
          setEditShowHistoryOnPublic(profileData.showHistoryOnPublic !== false);

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
            bannerUrl: editBannerUrl.trim(),
            statusText: editStatusText.trim(),
            profileColor: editProfileColor,
            donationUrl: editDonationUrl.trim(),
            contactOther: editContactOther.trim(),
            showHistoryOnPublic: !!editShowHistoryOnPublic,
            updatedAt: serverTimestamp()
          });
        });

        // Reflect in local state
        const payload = {
          username: cleanEditUsername,
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          telegram: editTelegram.trim().replace(/^@/, ''),
          avatarUrl: editAvatarUrl.trim(),
          bannerUrl: editBannerUrl.trim(),
          statusText: editStatusText.trim(),
          profileColor: editProfileColor,
          donationUrl: editDonationUrl.trim(),
          contactOther: editContactOther.trim(),
          showHistoryOnPublic: !!editShowHistoryOnPublic
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
          bannerUrl: editBannerUrl.trim(),
          statusText: editStatusText.trim(),
          profileColor: editProfileColor,
          donationUrl: editDonationUrl.trim(),
          contactOther: editContactOther.trim(),
          showHistoryOnPublic: !!editShowHistoryOnPublic,
          updatedAt: serverTimestamp()
        };

        await updateDoc(userDocRef, payload);

        // Reflect in local state
        const localPayload = {
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          telegram: editTelegram.trim().replace(/^@/, ''), // Save raw username
          avatarUrl: editAvatarUrl.trim(),
          bannerUrl: editBannerUrl.trim(),
          statusText: editStatusText.trim(),
          profileColor: editProfileColor,
          donationUrl: editDonationUrl.trim(),
          contactOther: editContactOther.trim(),
          showHistoryOnPublic: !!editShowHistoryOnPublic
        };
        setProfile((prev) => prev ? { ...prev, ...localPayload } : null);
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

  const handleDeletePost = async (item: any) => {
    if (!window.confirm(`Вы уверены, что хотите навсегда удалить публикацию "${item.name}"?`)) return;
    
    try {
      // 1. Delete from server_suggestions
      await deleteDoc(doc(db, 'server_suggestions', item.id));
      
      // 2. Delete from servers
      if (item.serverId) {
        await deleteDoc(doc(db, 'servers', item.serverId));
      } else {
        // Fallback: search and delete matching name & config
        const serversRef = collection(db, 'servers');
        const q = query(serversRef, where('userId', '==', profileUid), where('name', '==', item.name));
        const snap = await getDocs(q);
        snap.forEach(async (docRef) => {
          if (docRef.data().config === item.config) {
            await deleteDoc(doc(db, 'servers', docRef.id));
          }
        });
      }
      
      // Refresh local list
      setUserSuggestions(prev => prev.filter(s => s.id !== item.id));
      alert('Публикация успешно удалена!');
    } catch (error: any) {
      console.error("Error deleting post:", error);
      alert('Не удалось удалить публикацию: ' + (error.message || error));
    }
  };

  const handleEditSettings = (item: any) => {
    setEditingPost(item);
    setEditPostName(item.name || '');
    setEditPostExpiryDate(item.expiryDate || '');
    setEditPostStatus(item.status || 'online');
    setEditPostNotes(item.notes || '');
    setEditPostCategory(item.category || '');
    setEditPostIcon(item.customIcon || '');
    setEditPostIsPrivate(!!item.isPrivate);
    setEditPostHideAuthor(!!item.hideAuthor);
    setEditPostAllowedClients(item.allowedClients || []);
    setEditPostSpeedLimit(item.speedLimit || '');
    setEditPostIsPinned(!!item.isPinned);
  };

  const handleEditPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setSavingPost(true);
    
    try {
      // Auto-format expiryDate from YYYY-MM-DD to DD.MM.YYYY if needed
      let formattedEditExpiry = editPostExpiryDate.trim();
      if (formattedEditExpiry.includes('-')) {
        const parts = formattedEditExpiry.split('-');
        if (parts.length === 3) {
          formattedEditExpiry = `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
      }

      const payload = {
        name: editPostName.trim(),
        expiryDate: formattedEditExpiry,
        status: editPostStatus,
        notes: editPostNotes.trim(),
        category: editPostCategory,
        customIcon: editPostIcon,
        isPrivate: !!editPostIsPrivate,
        hideAuthor: !!editPostHideAuthor,
        allowedClients: editPostAllowedClients,
        speedLimit: editPostSpeedLimit,
        isPinned: !!editPostIsPinned,
        updatedAt: serverTimestamp()
      };
      
      // 1. Update in server_suggestions
      await updateDoc(doc(db, 'server_suggestions', editingPost.id), payload);
      
      // 2. Update in servers
      if (editingPost.serverId) {
         await updateDoc(doc(db, 'servers', editingPost.serverId), {
           name: editPostName.trim(),
           expiryDate: formattedEditExpiry,
           status: editPostStatus,
           notes: editPostNotes.trim(),
           category: editPostCategory,
           customIcon: editPostIcon,
           isPrivate: !!editPostIsPrivate,
           hideAuthor: !!editPostHideAuthor,
           allowedClients: editPostAllowedClients,
           speedLimit: editPostSpeedLimit,
           isPinned: !!editPostIsPinned,
           updatedAt: serverTimestamp()
         });
      } else {
         // Fallback: query and update
         const serversRef = collection(db, 'servers');
         const q = query(serversRef, where('userId', '==', profileUid), where('name', '==', editingPost.name));
         const snap = await getDocs(q);
         snap.forEach(async (docRef) => {
           if (docRef.data().config === editingPost.config) {
             await updateDoc(doc(db, 'servers', docRef.id), {
               name: editPostName.trim(),
               expiryDate: formattedEditExpiry,
               status: editPostStatus,
               notes: editPostNotes.trim(),
               category: editPostCategory,
               customIcon: editPostIcon,
               isPrivate: !!editPostIsPrivate,
               hideAuthor: !!editPostHideAuthor,
               allowedClients: editPostAllowedClients,
               speedLimit: editPostSpeedLimit,
               isPinned: !!editPostIsPinned,
               updatedAt: serverTimestamp()
             });
           }
         });
      }
      
      // Update local lists
      setUserSuggestions(prev => prev.map(s => s.id === editingPost.id ? { ...s, ...payload } : s));
      setEditingPost(null);
      alert('Параметры публикации успешно обновлены!');
    } catch (error: any) {
      console.error("Error updating post settings:", error);
      alert('Не удалось обновить параметры публикации: ' + (error.message || error));
    } finally {
      setSavingPost(false);
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

      const configStr = (selectedKey.config || '').trim();
      const isUrl = configStr.startsWith('http://') || configStr.startsWith('https://');

      const processContent = (content: string) => {
        let text = content;
        const cleanedText = content.trim().replace(/[\s\n\r]/g, '');
        const hasProto = cleanedText.includes('://');
        let isBase64 = false;

        if (!hasProto && cleanedText.length > 10) {
          const base64Regex = /^[a-zA-Z0-9+/=\-_]+$/;
          if (base64Regex.test(cleanedText)) {
            isBase64 = true;
          }
        }

        if (isBase64) {
          try {
            let standardBase64 = cleanedText
              .replace(/-/g, '+')
              .replace(/_/g, '/');
            while (standardBase64.length % 4 !== 0) {
              standardBase64 += '=';
            }
            const binaryString = atob(standardBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            text = new TextDecoder('utf-8').decode(bytes);
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
      };

      if (isUrl) {
        fetch(`/api/fetch-subscription?url=${encodeURIComponent(configStr)}`)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return res.json();
          })
          .then(data => {
            processContent(data.content || '');
          })
          .catch(err => {
            console.error("Error unpacking subscription in profile", err);
            setUnpackError('Не удалось загрузить или распаковать папку-подписку.');
            setLoadingUnpack(false);
          });
      } else {
        processContent(configStr);
      }
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
      const reqHost = window.location.origin;
      const customSubUrl = `${reqHost}/${urlUser}/${cleanSubName}`;
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
        
        {/* Profile Card Header with YouTube-style Banner */}
        <div className={`glass rounded-[32px] border ${activeColors.border} p-0 mb-8 relative overflow-hidden transition-all duration-500`}>
          
          {/* YouTube Style Header Banner */}
          <div className="relative h-40 sm:h-52 md:h-60 w-full overflow-hidden">
            {profile.bannerUrl ? (
              <img 
                src={profile.bannerUrl} 
                alt="Channel Banner" 
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                }}
              />
            ) : (
              <div className={`w-full h-full absolute inset-0 bg-gradient-to-r transition-all duration-700 ${
                profile.profileColor === 'emerald' ? 'from-emerald-950 via-teal-900 to-zinc-950' :
                profile.profileColor === 'amber' ? 'from-amber-950 via-amber-900 to-stone-950' :
                profile.profileColor === 'rose' ? 'from-rose-950 via-purple-900 to-stone-950' :
                profile.profileColor === 'violet' ? 'from-violet-950 via-fuchsia-950 to-neutral-950' :
                profile.profileColor === 'sky' ? 'from-sky-950 via-blue-900 to-slate-950' :
                'from-indigo-950 via-indigo-900 to-slate-950'
              }`} />
            )}
            {/* Visual bottom subtle shade override for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Top-Right Settings Button for Owners */}
          {isOwner && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-4 right-4 p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/10 text-white/70 hover:text-white transition-all text-xs uppercase tracking-wider font-semibold flex items-center gap-2 z-20 backdrop-blur-md"
            >
              {isEditing ? <X size={13} /> : <Settings size={13} />}
              <span className="hidden sm:inline">{isEditing ? 'Закрыть' : 'Настройки'}</span>
            </button>
          )}

          {/* Header Details Area (padded container under the banner) */}
          <div className="p-6 md:p-10 pt-4 md:pt-6 relative z-10">
            
            {/* Social Avatar & Profile info with Overlap offset */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8 -mt-20 sm:-mt-24 md:-mt-28 relative z-20">
              <div className="relative group shrink-0">
                <div className={`absolute inset-0 ${activeColors.glow} blur-xl rounded-full scale-95 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                <img 
                  src={profile.avatarUrl || generateDefaultAvatar()} 
                  alt={profile.displayName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = generateDefaultAvatar();
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[32px] border-4 border-[#0a0a0b] bg-black/80 object-cover relative z-10 p-1.5 shrink-0 transition-transform duration-300 group-hover:scale-[1.03] shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute bottom-1 right-1 z-20 ${profile.profileColor === 'emerald' ? 'bg-emerald-500' : profile.profileColor === 'amber' ? 'bg-amber-500' : profile.profileColor === 'rose' ? 'bg-rose-500' : profile.profileColor === 'violet' ? 'bg-violet-500' : profile.profileColor === 'sky' ? 'bg-sky-500' : 'bg-indigo-500'} text-white rounded-full p-1.5 border-2 border-[#0a0a0b] shadow-lg`}>
                  <Sparkles size={11} className="animate-pulse" />
                </div>
              </div>

              <div className="flex-1 space-y-3 pt-4 md:pt-12">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none">
                  {profile.displayName}
                </h1>
                <p className={`text-sm font-mono ${activeColors.text} font-semibold tracking-wider flex items-center justify-center md:justify-start gap-1`}>
                  <AtSign size={14} />{profile.username}
                </p>
                {profile.statusText && (
                  <div className="pt-1.5 flex justify-center md:justify-start">
                    <p className="text-[11px] italic text-white/60 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 inline-flex items-center gap-1.5 select-none font-mono">
                      <span>✨</span> {profile.statusText}
                    </p>
                  </div>
                )}
              </div>

              {profile.bio ? (
                <p className="text-xs sm:text-sm text-white/70 font-light max-w-xl leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-xs text-white/30 italic font-mono">Био отсутствует</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-[10px] sm:text-xs font-mono text-white/40">
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

                {profile.donationUrl && (
                  <a 
                    href={profile.donationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-full transition-all"
                  >
                    💖 Донат автору
                  </a>
                )}

                {profile.contactOther && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 rounded-full font-sans select-all">
                    🌐 {profile.contactOther}
                  </span>
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

                {/* Visual Banner Presets & custom image editor */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888]">Баннер профиля</label>
                    {editBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setEditBannerUrl('')}
                        className="text-[9px] uppercase tracking-wider font-extrabold text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1"
                      >
                        <X size={10} /> Сбросить баннер
                      </button>
                    )}
                  </div>

                  {/* Banner Preview */}
                  <div className="relative aspect-[21/9] sm:aspect-[24/7] w-full rounded-2xl border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center group/bnp">
                    {editBannerUrl ? (
                      <img 
                        src={editBannerUrl} 
                        alt="Banner Preview" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full absolute inset-0 bg-gradient-to-r transition-all duration-500 ${
                        editProfileColor === 'emerald' ? 'from-emerald-950 via-teal-900 to-zinc-950' :
                        editProfileColor === 'amber' ? 'from-amber-950 via-amber-900 to-stone-950' :
                        editProfileColor === 'rose' ? 'from-rose-950 via-purple-900 to-stone-950' :
                        editProfileColor === 'violet' ? 'from-violet-950 via-fuchsia-950 to-neutral-950' :
                        editProfileColor === 'sky' ? 'from-sky-950 via-blue-900 to-slate-950' :
                        'from-indigo-950 via-indigo-900 to-slate-950'
                      }`} />
                    )}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/50 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                        {editBannerUrl ? 'Кастомный баннер' : 'Дефолтный градиент темы'}
                      </p>
                    </div>
                  </div>

                  {/* Banner Presets */}
                  <div className="space-y-2 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] text-white/40 font-mono ml-1">Баннеры (готовые):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {bannerPresets.map(preset => {
                        const isSelected = editBannerUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setEditBannerUrl(preset.url)}
                            className={`p-1 bg-black/40 border rounded-xl overflow-hidden text-left transition-all duration-300 relative group truncate flex flex-col gap-1.5 cursor-pointer ${
                              isSelected 
                                ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 scale-102' 
                                : 'border-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="h-10 w-full rounded-lg overflow-hidden bg-zinc-900 relative">
                              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-[1px] flex items-center justify-center">
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-white/70 px-1 truncate w-full">
                              {preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="pt-2">
                      <input 
                        type="url"
                        value={editBannerUrl}
                        onChange={e => setEditBannerUrl(e.target.value)}
                        placeholder="Или вставьте прямую ссылку на свой фон/баннер (https://...)"
                        className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-xl px-4 py-3 outline-none text-xs sm:text-sm font-mono text-white placeholder-white/30"
                      />
                    </div>
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

                {/* Advanced Profile customization settings fields */}
                <div className="border-t border-white/5 pt-6 mt-6 space-y-6">
                  <h4 className="text-xs uppercase font-serif italic text-indigo-400 tracking-wider">Дополнительные Настройки Профиля</h4>
                  
                  {/* Status text */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Статус (Текст под аватаром)</label>
                    <input 
                      type="text"
                      value={editStatusText}
                      onChange={e => setEditStatusText(e.target.value)}
                      placeholder="Например: Поставщик стабильных Vless конфигураций 🚀"
                      maxLength={80}
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl px-4 py-3.5 outline-none text-sm font-sans"
                    />
                  </div>

                  {/* Profile Color Accent */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Цветовая гамма/Акцент профиля</label>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {Object.keys(profileColors).map((color) => {
                        const isSelected = editProfileColor === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditProfileColor(color)}
                            className={`py-2 px-1 rounded-xl text-[9px] uppercase tracking-wider font-extrabold border transition-all duration-300 flex items-center justify-center ${
                              isSelected 
                                ? 'border-white bg-white/10 text-white shadow-md' 
                                : 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white/60'
                            }`}
                          >
                            <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                              color === 'indigo' ? 'bg-indigo-505' :
                              color === 'emerald' ? 'bg-emerald-500' :
                              color === 'amber' ? 'bg-amber-500' :
                              color === 'rose' ? 'bg-rose-500' :
                              color === 'violet' ? 'bg-violet-500' : 'bg-sky-500'
                            }`} />
                            {color === 'indigo' ? 'Индиго' :
                             color === 'emerald' ? 'Изумруд' :
                             color === 'amber' ? 'Янтарь' :
                             color === 'rose' ? 'Роза' :
                             color === 'violet' ? 'Фиолет' : 'Синий'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Donation Link */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Ссылка на донат (Donation Link)</label>
                    <input 
                      type="url"
                      value={editDonationUrl}
                      onChange={e => setEditDonationUrl(e.target.value)}
                      placeholder="https://yoomoney.ru/... или https://donationalerts.com/..."
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl px-4 py-3.5 outline-none text-sm font-sans"
                    />
                  </div>

                  {/* Alternative contact */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Альтернативный контакт/Сайт</label>
                    <input 
                      type="text"
                      value={editContactOther}
                      onChange={e => setEditContactOther(e.target.value)}
                      placeholder="Например: VK Group, email, или персональный сайт"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl px-4 py-3.5 outline-none text-sm font-sans"
                    />
                  </div>

                  {/* Show history toggle */}
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-white mb-0.5">Публичная история</h4>
                      <p className="text-[10px] text-white/40">Показывать ваши одобренные публикации в истории профиля для гостей.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditShowHistoryOnPublic(!editShowHistoryOnPublic)}
                      className={`w-11 h-6 rounded-full transition-all duration-300 relative p-0.5 flex-shrink-0 ${
                        editShowHistoryOnPublic ? 'bg-indigo-600' : 'bg-white/10'
                      }`}
                    >
                      <span className={`block w-5 h-5 rounded-full bg-white transition-all duration-300 transform ${
                        editShowHistoryOnPublic ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
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
                        ? 'bg-white text-black shadow-xl scale-[1.02]' 
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
                ) : (
                  <>
                    {(() => {
                      const filteredSuggestions = userSuggestions.filter((item) => {
                        // If has isPrivate, only show to the profile owner
                        if (item.isPrivate && !isOwner) return false;

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
                                    {getCustomIcon(item.customIcon, isSub)}
                                  </div>
                                  <div className="flex gap-2 items-center flex-wrap justify-end">
                                    {item.isPrivate && (
                                      <div className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/10 text-[8px] md:text-[9px] uppercase tracking-widest font-black font-mono">
                                        Приватный 🔒
                                      </div>
                                    )}
                                    {item.category && (
                                      <div className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[8px] md:text-[9px] uppercase tracking-widest font-bold">
                                        {item.category}
                                      </div>
                                    )}
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
                                  <p className="text-xs text-white/40 flex flex-wrap items-center gap-2">
                                    <span>{isSub ? 'Нигде • Общая папка-подписка' : (item.location || 'Локация не указана')}</span>
                                    {item.speedLimit && item.speedLimit !== 'Без лимита' && (
                                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-mono text-white/60">
                                        ⚡ {item.speedLimit}
                                      </span>
                                    )}
                                  </p>
                                </div>

                                {item.notes && (
                                  <div className="text-[11px] text-white/50 bg-white/[0.012] border border-white/5 rounded-xl p-3 leading-relaxed text-left select-text line-clamp-3">
                                    📝 <span className="italic">{item.notes}</span>
                                  </div>
                                )}

                                {item.allowedClients && item.allowedClients.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.allowedClients.map((cl: string) => (
                                      <span key={cl} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 text-[7px] uppercase tracking-wider font-mono">
                                        {cl}
                                      </span>
                                    ))}
                                  </div>
                                )}

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

                                  {isOwner && (
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                      <button
                                        onClick={() => handleEditSettings(item)}
                                        className="py-2.5 rounded-xl border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-1.5 text-white/70 hover:text-white transition-all duration-300"
                                      >
                                        ⚙️ Настройки
                                      </button>
                                      <button
                                        onClick={() => handleDeletePost(item)}
                                        className="py-2.5 rounded-xl border border-red-500/10 hover:border-red-500/25 bg-red-500/5 hover:bg-red-500/15 text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-1.5 text-red-400 hover:text-red-300 transition-all duration-300"
                                      >
                                        🗑️ Удалить
                                      </button>
                                    </div>
                                  )}
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

        {/* Suggestion Post Edit Settings Modal */}
        <AnimatePresence>
          {editingPost && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl overflow-y-auto"
              onClick={() => setEditingPost(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative max-w-lg w-full glass rounded-[24px] md:rounded-[40px] p-6 md:p-10 my-8 flex flex-col gap-6 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setEditingPost(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <div>
                  <h2 className="text-xl md:text-2xl font-serif italic tracking-tight text-white mb-2">
                    ⚙️ Настройки Публикации
                  </h2>
                  <p className="text-white/40 text-xs font-mono">
                    ID: {editingPost.id} ({editingPost.postType === 'subscription' ? 'Подписка' : 'Сервер'})
                  </p>
                </div>

                <form onSubmit={handleEditPostSubmit} className="space-y-4 md:space-y-5">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Название публикации</label>
                    <input 
                      required
                      type="text"
                      value={editPostName}
                      onChange={e => setEditPostName(e.target.value)}
                      placeholder="Укажите понятное имя"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-xl px-4 py-3 outline-none text-sm font-sans"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Дата истечения (expiryDate)</label>
                    <input 
                      type="text"
                      value={editPostExpiryDate}
                      onChange={e => setEditPostExpiryDate(e.target.value)}
                      placeholder="Например: 2026-12-31"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-xl px-4 py-3 outline-none text-sm font-mono text-white"
                    />
                  </div>

                  {/* Status selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Статус подключения</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['online', 'unstable', 'offline'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setEditPostStatus(status as any)}
                          className={`py-2 rounded-xl text-[9px] uppercase tracking-wider font-bold border transition-all duration-300 ${
                            editPostStatus === status 
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                              : 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white/60'
                          }`}
                        >
                          {status === 'online' ? '🟢 Online' : status === 'unstable' ? '🟡 Нестабильный' : '🔴 Offline'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed Limit */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Лимит скорости</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Без лимита', '50 Мбит/с', '100 Мбит/с', '1 Гбит/с'].map((limit) => (
                        <button
                          key={limit}
                          type="button"
                          onClick={() => setEditPostSpeedLimit(limit)}
                          className={`py-2 rounded-xl text-[9px] uppercase tracking-wider font-bold border transition-all duration-305 ${
                            editPostSpeedLimit === limit 
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                              : 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white/60'
                          }`}
                        >
                          {limit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Декоративная иконка (customIcon)</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['Globe', 'Shield', 'Zap', 'Flame', 'Sparkles', 'Heart'].map((iconName) => (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setEditPostIcon(iconName)}
                          className={`py-2.5 rounded-xl border flex items-center justify-center transition-all duration-305 ${
                            editPostIcon === iconName 
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 scale-105' 
                              : 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white/60 hover:scale-102'
                          }`}
                          title={iconName}
                        >
                          {getCustomIcon(iconName, false)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description/Notes text block */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1">Инструкции / Примечание</label>
                    <textarea 
                      value={editPostNotes}
                      onChange={e => setEditPostNotes(e.target.value)}
                      placeholder="Ограничения, порты, рекомендуемые настройки подключения..."
                      maxLength={150}
                      rows={2}
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-xl px-4 py-3 outline-none text-xs font-sans resize-none text-white"
                    />
                  </div>

                  {/* Toggles Group */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4 text-xs">
                    {/* Private toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">Приватный ключ 🔒</h4>
                        <p className="text-[9px] text-white/40">Скрыть из общей ленты, доступен только вам в профиле.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditPostIsPrivate(!editPostIsPrivate)}
                        className={`w-11 h-6 rounded-full transition-all duration-305 relative p-0.5 flex-shrink-0 ${
                          editPostIsPrivate ? 'bg-indigo-600' : 'bg-white/10'
                        }`}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-white transition-all duration-305 transform ${
                          editPostIsPrivate ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Hide author toggle */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div>
                        <h4 className="font-bold text-white">Анонимная публикация 🕵️</h4>
                        <p className="text-[9px] text-white/40">Скрыть ваше имя на карточке этого ключа в общей ленте.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditPostHideAuthor(!editPostHideAuthor)}
                        className={`w-11 h-6 rounded-full transition-all duration-305 relative p-0.5 flex-shrink-0 ${
                          editPostHideAuthor ? 'bg-indigo-600' : 'bg-white/10'
                        }`}
                      >
                        <span className={`block w-5 h-5 rounded-full bg-white transition-all duration-305 transform ${
                          editPostHideAuthor ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingPost(null)}
                      className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-colors text-white/60"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={savingPost}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs uppercase font-extrabold tracking-widest transition-colors shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      {savingPost ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={12} />}
                      Сохранить
                    </button>
                  </div>
                </form>
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
