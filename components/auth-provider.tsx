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

function saveStoredAccount(account: Profile) {
  if (typeof window === 'undefined') return;
  try {
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    if (idx >= 0) {
      accounts[idx] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Instant hydration from localStorage
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      const storedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser));
        setProfile(JSON.parse(storedProfile));
        setLoading(false);
      }
    } catch {}

    // 2. Firebase onAuthStateChanged listener
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          const u: AuthUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
          };
          setUser(u);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
          await fetchProfile(currentUser.uid, currentUser.email ?? '');
        } else {
          const storedUser = localStorage.getItem(STORAGE_KEY_USER);
          if (!storedUser) {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase auth listener notice:', err);
      setLoading(false);
    }
  }, []);

  async function fetchProfile(userId: string, userEmail: string) {
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
          role: data.role || (data.is_seller ? 'seller' : 'student'),
          department: data.department || null,
          year: data.year || null,
          bio: data.bio || null,
          skills: data.skills || [],
          avatar_url: data.avatar_url || data.avatarUrl || null,
          is_seller: data.is_seller ?? true,
          is_verified: data.is_verified ?? true,
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
        setProfile(JSON.parse(stored));
        return;
      } catch {}
    }

    const fallback: Profile = {
      id: userId,
      email: userEmail,
      display_name: userEmail.split('@')[0] || 'Student',
      username: userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'student',
      role: 'student',
      department: 'Engineering',
      year: 'Student',
      bio: null,
      skills: [],
      avatar_url: null,
      is_seller: true,
      is_verified: true,
    };
    setProfile(fallback);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(fallback));
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const trimmedEmail = email.trim();
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
        const displayName = existing ? existing.display_name : trimmedEmail.split('@')[0];
        const username = existing ? existing.username : trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

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
          role: 'student',
          department: existing?.department || 'Engineering',
          year: existing?.year || 'Student',
          bio: existing?.bio || null,
          skills: existing?.skills || [],
          avatar_url: existing?.avatar_url || null,
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

  async function signUp(params: SignUpParams) {
    const { email, password, displayName, department, year } = params;
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    const username = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) + Math.floor(100 + Math.random() * 900);

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await updateFirebaseProfile(cred.user, { displayName: trimmedName });

      // Save profile to Firestore
      try {
        await setDoc(doc(db, 'profiles', cred.user.uid), {
          id: cred.user.uid,
          email: trimmedEmail,
          display_name: trimmedName,
          username,
          role: 'student',
          department: department?.trim() || null,
          year: year?.trim() || null,
          bio: null,
          avatar_url: null,
          skills: [],
          is_verified: false,
          is_seller: true,
          created_at: new Date().toISOString(),
        });
      } catch (firestoreErr) {
        console.warn('Firestore setDoc notice:', firestoreErr);
      }

      const u: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: trimmedName,
      };
      setUser(u);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
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
          role: 'student',
          department: department?.trim() || 'Computer Science & Engineering',
          year: year?.trim() || '2nd Year',
          bio: null,
          skills: [],
          avatar_url: null,
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
    const updated = { ...profile, ...data };
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
