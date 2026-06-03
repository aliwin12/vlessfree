import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, UserPlus, Mail, Lock, User, AtSign, ArrowRight, 
  Smartphone, ShieldAlert, Check, RefreshCw 
} from 'lucide-react';
import { 
  auth, googleProvider, db, handleFirestoreError, OperationType,
  doc, getDoc, addDoc, collection, serverTimestamp 
} from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut
} from 'firebase/auth';
import { setDoc, runTransaction } from 'firebase/firestore';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Post-Google login username picker modal state
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const [googleUsername, setGoogleUsername] = useState('');
  const [googleDisplayName, setGoogleDisplayName] = useState('');

  const validateUsername = (uname: string) => {
    return uname.length >= 3 && uname.length <= 15 && /^[a-zA-Z0-9_]+$/.test(uname);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Sign In logic
        if (!email || !password) {
          throw new Error('Пожалуйста, заполните электронную почту и пароль.');
        }
        await signInWithEmailAndPassword(auth, email, password);
        
        // Fetch profile to verify profile existence
        const currentUser = auth.currentUser;
        if (currentUser) {
          const profileDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (!profileDoc.exists()) {
            // Profile somehow doesn't exist, prompt for setup
            setPendingGoogleUser({ uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName || '' });
            setGoogleDisplayName(currentUser.displayName || '');
            setShowGoogleSetup(true);
            setIsLoading(false);
            return;
          }
          const profileData = profileDoc.data();
          setSuccessMsg(`Успешный вход! С возвращением, ${profileData.displayName || 'пользователь'}`);
          setTimeout(() => navigate(`/user/${profileData.username}`), 1500);
        }
      } else {
        // Registration logic
        const cleanUsername = username.trim().toLowerCase();
        
        if (!validateUsername(cleanUsername)) {
          throw new Error('Имя пользователя должно состоять из 3-15 латинских букв, цифр или символа подчеркивания.');
        }
        if (!displayName.trim()) {
          throw new Error('Пожалуйста, укажите ваше имя.');
        }
        if (!email || !password) {
          throw new Error('Пожалуйста, укажите почту и пароль.');
        }
        if (password.length < 6) {
          throw new Error('Пароль должен состоять минимум из 6 символов.');
        }

        // Guard username uniqueness via simple getDoc for unauthenticated scope
        const usernameRefCheck = doc(db, 'usernames', cleanUsername);
        const usernameSnapCheck = await getDoc(usernameRefCheck);
        if (usernameSnapCheck.exists()) {
          throw new Error(`Имя пользователя @${cleanUsername} уже занято.`);
        }

        // If username is free, create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update auth profile
        await updateProfile(user, { displayName: displayName.trim() });

        // Save username claim and profile in database atomically via transaction,
        // re-verifying username uniqueness within the auth transaction to prevent races.
        await runTransaction(db, async (transaction) => {
          const usernameRef = doc(db, 'usernames', cleanUsername);
          const profileRef = doc(db, 'users', user.uid);

          const usernameSnap = await transaction.get(usernameRef);
          if (usernameSnap.exists()) {
            throw new Error(`Имя пользователя @${cleanUsername} уже занято.`);
          }

          transaction.set(usernameRef, {
            uid: user.uid,
            createdAt: serverTimestamp()
          });

          transaction.set(profileRef, {
            username: cleanUsername,
            displayName: displayName.trim(),
            bio: '',
            telegram: '',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
            followersCount: 0,
            followingCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });

        setSuccessMsg('Регистрация прошла успешно! Добро пожаловать.');
        setTimeout(() => navigate(`/user/${cleanUsername}`), 1500);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Friendly Russian translates
      let msg = err.message || 'Ошибка аутентификации.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Этот адрес электронной почты уже используется.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Пароль слишком простой.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Неверная почта или пароль.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Некорректный адрес электронной почты.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists
      const profileDoc = await getDoc(doc(db, 'users', user.uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        setSuccessMsg(`Рады вас видеть, ${profileData.displayName || 'пользователь'}!`);
        setTimeout(() => navigate(`/user/${profileData.username}`), 1500);
      } else {
        // Prompt for setting up username
        setPendingGoogleUser({ uid: user.uid, email: user.email, displayName: user.displayName || '' });
        setGoogleDisplayName(user.displayName || user.email?.split('@')[0] || 'Пользователь');
        setShowGoogleSetup(true);
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setErrorMsg(err.code === 'auth/popup-blocked' 
        ? 'Окно авторизации заблокировано вашим браузером. Пожалуйста, разрешите всплывающие окна.' 
        : err.message || 'Ошибка входа через Google.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;

    setIsLoading(true);
    setErrorMsg('');
    
    const cleanUsername = googleUsername.trim().toLowerCase();

    if (!validateUsername(cleanUsername)) {
      setErrorMsg('Имя пользователя должно состоять из 3-15 латинских букв, цифр или символа подчеркивания.');
      setIsLoading(false);
      return;
    }

    if (!googleDisplayName.trim()) {
      setErrorMsg('Укажите имя для отображения.');
      setIsLoading(false);
      return;
    }

    try {
      // Check and claim username uniqueness and write profile in a single atomic transaction
      await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, 'usernames', cleanUsername);
        const profileRef = doc(db, 'users', pendingGoogleUser.uid);

        const usernameSnap = await transaction.get(usernameRef);
        if (usernameSnap.exists()) {
          throw new Error(`Имя пользователя @${cleanUsername} уже занято.`);
        }

        transaction.set(usernameRef, {
          uid: pendingGoogleUser.uid,
          createdAt: serverTimestamp()
        });

        transaction.set(profileRef, {
          username: cleanUsername,
          displayName: googleDisplayName.trim(),
          bio: '',
          telegram: '',
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
          followersCount: 0,
          followingCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      setSuccessMsg('Профиль успешно создан!');
      setShowGoogleSetup(false);
      setPendingGoogleUser(null);
      setTimeout(() => navigate(`/user/${cleanUsername}`), 1500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ошибка при сохранении имени пользователя.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white pt-24 pb-16 flex items-center justify-center font-sans">
      {/* Background stars / atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[140px] rounded-full" />
      </div>

      <div className="w-full max-w-md px-4 relative z-10" id="auth-panel-wrapper">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 text-xs uppercase tracking-widest font-bold font-mono transition-colors"
        >
          <Smartphone size={14} /> Назад на главную
        </Link>

        <div className="glass rounded-[32px] border border-white/10 p-6 sm:p-10 shadow-[0_0_80px_rgba(99,102,241,0.06)] relative overflow-hidden">
          
          {/* Form Tabs */}
          <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5 relative z-10">
            <button 
              onClick={() => { setIsLogin(true); setErrorMsg(''); }}
              className={`flex-1 py-3 text-xs uppercase font-extrabold tracking-wider rounded-xl transition-all duration-300 ${
                isLogin ? 'bg-[#0a0a0c] text-white shadow-xl border border-white/10' : 'text-white/40 hover:text-white/80'
              }`}
            >
              Вход
            </button>
            <button 
              onClick={() => { setIsLogin(false); setErrorMsg(''); }}
              className={`flex-1 py-3 text-xs uppercase font-extrabold tracking-wider rounded-xl transition-all duration-300 ${
                !isLogin ? 'bg-[#0a0a0c] text-white shadow-xl border border-white/10' : 'text-white/40 hover:text-white/80'
              }`}
            >
              Регистрация
            </button>
          </div>

          <h2 className="text-3xl font-bold mb-2 tracking-tight text-white select-none text-center">
            {isLogin ? 'С возвращением!' : 'Создать аккаунт'}
          </h2>
          <p className="text-xs text-white/40 text-center mb-8">
            {isLogin ? 'Войдите в свой профиль vlessfree' : 'Регистрация дает вам собственный социальный профиль'}
          </p>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-3 px-4 rounded-xl mb-6 flex gap-2.5 items-start"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-3 px-4 rounded-xl mb-6 flex gap-2.5 items-start"
              >
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard Authentication Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1.5">Имя пользователя (латиница)</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      required
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="alex_vless"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-11 pr-5 py-3.5 outline-none text-sm transition-all focus:bg-white/[0.06] font-mono text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1.5">Полное имя</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      required
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Алексей"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-11 pr-5 py-3.5 outline-none text-sm transition-all focus:bg-white/[0.06] text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1.5">Электронная почта</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-11 pr-5 py-3.5 outline-none text-sm transition-all focus:bg-white/[0.06] text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1.5">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-11 pr-5 py-3.5 outline-none text-sm transition-all focus:bg-white/[0.06] text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-[0_0_25px_rgba(99,102,241,0.25)]"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                <>
                  Войти в профиль <LogIn className="w-4 h-4" />
                </>
              ) : (
                <>
                  Зарегистрироваться <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-8 text-center select-none">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/10" />
            <span className="relative z-10 px-4 bg-[#0a0a0c] text-[10px] uppercase font-bold tracking-widest text-white/30">
              Или
            </span>
          </div>

          {/* Google Sign In option */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-bold uppercase tracking-widest transition-all duration-300"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.93 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.55 8.91 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.36 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.38c-.28 1.44-1.1 2.67-2.33 3.49l3.61 2.8c2.12-1.95 3.3-4.82 3.3-8.42z"/>
              <path fill="#FBBC05" d="M5.36 14.5c-.24-.72-.38-1.5-.38-2.5s.14-1.78.38-2.5L1.5 6.5C.54 8.42 0 10.58 0 13s.54 4.58 1.5 6.5l3.86-3z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.61-2.8c-1.1.74-2.5 1.18-4.35 1.18-3.09 0-5.73-2.51-6.66-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z"/>
            </svg>
            Войти через Google
          </button>
        </div>
      </div>

      {/* Modern custom Google Setup user Modal */}
      <AnimatePresence>
        {showGoogleSetup && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass max-w-md w-full border border-indigo-500/30 rounded-[32px] p-6 sm:p-10 text-left relative"
            >
              <h2 className="text-3xl font-bold mb-2 tracking-tight">Финальный шаг</h2>
              <p className="text-xs text-white/50 mb-8">
                Пожалуйста, выберите уникальное имя пользователя и настройте публичный профиль VLESS Free.
              </p>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs py-3 px-4 rounded-xl mb-6">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleGoogleSetupSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1.5">Имя пользователя (латиница)</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      required
                      type="text"
                      value={googleUsername}
                      onChange={e => setGoogleUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="alex_vless"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-11 pr-5 py-3.5 outline-none text-sm transition-all focus:bg-white/[0.06] font-mono text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#888] ml-1.5">Отображаемое имя</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      required
                      type="text"
                      value={googleDisplayName}
                      onChange={e => setGoogleDisplayName(e.target.value)}
                      placeholder="Алексей"
                      className="w-full bg-white/[0.04] border border-white/5 focus:border-indigo-500/30 rounded-2xl pl-11 pr-5 py-3.5 outline-none text-sm transition-all focus:bg-white/[0.06] text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      signOut(auth);
                      setShowGoogleSetup(false);
                      setPendingGoogleUser(null);
                    }}
                    className="flex-1 py-4 border border-white/10 hover:bg-white/5 rounded-2xl text-xs uppercase font-extrabold tracking-widest transition-colors text-white/60"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs uppercase font-extrabold tracking-widest transition-colors shadow-lg hover:shadow-indigo-500/30"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Готово'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
