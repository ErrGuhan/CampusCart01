'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const ADMIN_EMAILS = [
  'guhan24td0781@svcet.ac.in',
  'guhan@svcet.ac.in',
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === email.trim().toLowerCase());
}

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  username: string;
  role: 'student' | 'seller' | 'admin';
  department: string | null;
  year: string | null;
  bio: string | null;
  skills: string[];
  avatar_url: string | null;
  is_seller: boolean;
  is_verified: boolean;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

type SignUpParams = {
  email: string;
  password: string;
  displayName: string;
  department?: string;
  year?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: SignUpParams) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
};

const STORAGE_KEY_USER = 'campuscart_auth_user';
const STORAGE_KEY_PROFILE = 'campuscart_auth_profile';
const STORAGE_KEY_ACCOUNTS = 'campuscart_registered_accounts';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  updateUserProfile: async () => {},
  signOut: async () => {},
});

function getStoredAccounts(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredAccount(profile: Profile) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredAccounts();
    const idx = existing.findIndex((a) => a.email.toLowerCase() === profile.email.toLowerCase());
    if (idx >= 0) {
      existing[idx] = profile;
    } else {
      existing.push(profile);
    }
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(existing));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed admin status
  const isAdmin = Boolean(
    profile?.role === 'admin' ||
    isAdminEmail(user?.email) ||
    isAdminEmail(profile?.email)
  );

  useEffect(() => {
    // 1. Initial local restore
    const localUser = localStorage.getItem(STORAGE_KEY_USER);
    const localProfile = localStorage.getItem(STORAGE_KEY_PROFILE);

    if (localUser && localProfile) {
      try {
        const u = JSON.parse(localUser);
        const p = JSON.parse(localProfile);
        if (isAdminEmail(u?.email) || isAdminEmail(p?.email)) {
          p.role = 'admin';
        }
        setUser(u);
        setProfile(p);
        setLoading(false);
      } catch {
        setUser(null);
        setProfile(null);
      }
    }

    // 2. Firebase live Auth listener
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
          setUser(authUser);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));
          await fetchProfile(firebaseUser.uid, firebaseUser.email ?? '');
        } else {
          const uStr = localStorage.getItem(STORAGE_KEY_USER);
          const pStr = localStorage.getItem(STORAGE_KEY_PROFILE);
          if (uStr && pStr) {
            try {
              const u = JSON.parse(uStr);
              const p = JSON.parse(pStr);
              if (isAdminEmail(u?.email) || isAdminEmail(p?.email)) {
                p.role = 'admin';
              }
              setUser(u);
              setProfile(p);
            } catch {}
          } else {
            setUser(null);
            setProfile(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase auth listener notice:', err);
      setLoading(false);
    }
  }, []);

  async function fetchProfile(userId: string, userEmail: string) {
    const isUserAdmin = isAdminEmail(userEmail);

    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const p: Profile = {
          id: userId,
          email: data.email || userEmail,
          display_name: data.display_name || data.displayName || 'Student',
          username: data.username || 'student',
          role: isUserAdmin ? 'admin' : (data.role || (data.is_seller ? 'seller' : 'student')),
          department: data.department || null,
          year: data.year || null,
          bio: data.bio || null,
          skills: data.skills || [],
          avatar_url: data.avatar_url || data.avatarUrl || null,
          is_seller: data.is_seller ?? true,
          is_verified: isUserAdmin ? true : (data.is_verified ?? true),
        };
        setProfile(p);
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(p));
        return;
      }
    } catch (err) {
      console.warn('Firestore profile fetch notice:', err);
    }

    // Fallback profile if not in Firestore
    const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (isUserAdmin) p.role = 'admin';
        setProfile(p);
        return;
      } catch {}
    }

    const fallback: Profile = {
      id: userId,
      email: userEmail,
      display_name: isUserAdmin ? 'Guhan M' : (userEmail.split('@')[0] || 'Student'),
      username: isUserAdmin ? 'guhan' : (userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'),
      role: isUserAdmin ? 'admin' : 'student',
      department: isUserAdmin ? 'Computer Science & Engineering' : 'Engineering',
      year: isUserAdmin ? '4th Year' : 'Student',
      bio: isUserAdmin ? 'Full-stack developer, IoT builder & Founder of CampusCart.' : null,
      skills: isUserAdmin ? ['Next.js', 'React', 'Python', 'IoT', 'Platform Admin'] : [],
      avatar_url: isUserAdmin ? 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300' : null,
      is_seller: true,
      is_verified: true,
    };
    setProfile(fallback);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(fallback));
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const trimmedEmail = email.trim();
    const isUserAdmin = isAdminEmail(trimmedEmail);

    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const u: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
      };
      setUser(u);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
      await fetchProfile(cred.user.uid, cred.user.email ?? trimmedEmail);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signIn notice:', err);

      // Handle invalid API key / demo mode / offline seamlessly
      const isConfigIssue =
        err.code === 'auth/api-key-not-valid' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/internal-error' ||
        err.message?.includes('api-key-not-valid') ||
        err.message?.includes('API key');

      if (isConfigIssue) {
        const accounts = getStoredAccounts();
        const existing = accounts.find((a) => a.email.toLowerCase() === trimmedEmail.toLowerCase());

        const uid = existing ? existing.id : 'usr_' + Math.random().toString(36).slice(2, 10);
        const displayName = isUserAdmin ? 'Guhan M' : (existing ? existing.display_name : trimmedEmail.split('@')[0]);
        const username = isUserAdmin ? 'guhan' : (existing ? existing.username : trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''));

        const localUser: AuthUser = {
          uid,
          email: trimmedEmail,
          displayName,
        };

        const localProfile: Profile = {
          id: uid,
          email: trimmedEmail,
          display_name: displayName,
          username,
          role: isUserAdmin ? 'admin' : (existing?.role || 'student'),
          department: existing?.department || (isUserAdmin ? 'Computer Science & Engineering' : 'Engineering'),
          year: existing?.year || (isUserAdmin ? '4th Year' : 'Student'),
          bio: existing?.bio || (isUserAdmin ? 'Full-stack developer, IoT builder & Founder of CampusCart.' : null),
          skills: existing?.skills || (isUserAdmin ? ['Next.js', 'React', 'Python', 'IoT', 'Platform Admin'] : []),
          avatar_url: existing?.avatar_url || (isUserAdmin ? 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300' : null),
          is_seller: existing?.is_seller ?? true,
          is_verified: true,
        };

        setUser(localUser);
        setProfile(localProfile);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(localUser));
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(localProfile));
        return { success: true };
      }

      let errorMsg = err.message || 'Invalid email or password.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMsg = 'Invalid email or password. Please try again.';
      }
      return { success: false, error: errorMsg };
    }
  }

  async function signUp({ email, password, displayName, department, year }: SignUpParams) {
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    const isUserAdmin = isAdminEmail(trimmedEmail);
    const username = isUserAdmin ? 'guhan' : trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await updateFirebaseProfile(cred.user, { displayName: trimmedName });

      const newProfile: Profile = {
        id: cred.user.uid,
        email: trimmedEmail,
        display_name: trimmedName,
        username,
        role: isUserAdmin ? 'admin' : 'student',
        department: department?.trim() || 'Computer Science & Engineering',
        year: year?.trim() || '2nd Year',
        bio: null,
        skills: [],
        avatar_url: null,
        is_seller: true,
        is_verified: isUserAdmin ? true : false,
      };

      try {
        await setDoc(doc(db, 'profiles', cred.user.uid), newProfile);
      } catch (e) {
        console.warn('Profile Firestore save notice:', e);
      }

      saveStoredAccount(newProfile);
      await fetchProfile(cred.user.uid, trimmedEmail);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signUp notice:', err);

      const isConfigIssue =
        err.code === 'auth/api-key-not-valid' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/internal-error' ||
        err.message?.includes('api-key-not-valid') ||
        err.message?.includes('API key');

      if (isConfigIssue) {
        const uid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const localUser: AuthUser = {
          uid,
          email: trimmedEmail,
          displayName: trimmedName,
        };

        const localProfile: Profile = {
          id: uid,
          email: trimmedEmail,
          display_name: trimmedName,
          username,
          role: isUserAdmin ? 'admin' : 'student',
          department: department?.trim() || 'Computer Science & Engineering',
          year: year?.trim() || '2nd Year',
          bio: isUserAdmin ? 'Full-stack developer, IoT builder & Founder of CampusCart.' : null,
          skills: isUserAdmin ? ['Next.js', 'React', 'Python', 'IoT', 'Platform Admin'] : [],
          avatar_url: isUserAdmin ? 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300' : null,
          is_seller: true,
          is_verified: true,
        };

        saveStoredAccount(localProfile);
        setUser(localUser);
        setProfile(localProfile);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(localUser));
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(localProfile));
        return { success: true };
      }

      let msg = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in.';
      }
      return { success: false, error: msg };
    }
  }

  async function updateUserProfile(data: Partial<Profile>) {
    if (!profile) return;
    const isUserAdmin = isAdminEmail(profile.email) || profile.role === 'admin';
    const updated: Profile = {
      ...profile,
      ...data,
      role: isUserAdmin ? 'admin' : (data.role || profile.role),
    };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    saveStoredAccount(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campuscart_seller_updated'));
    }

    try {
      await setDoc(doc(db, 'profiles', profile.id), updated, { merge: true });
    } catch (err) {
      console.warn('Firestore profile sync notice:', err);
    }
  }

  async function handleSignOut() {
    try {
      await firebaseSignOut(auth);
    } catch {}
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signIn,
        signUp,
        updateUserProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
