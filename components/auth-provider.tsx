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
import { secureApiRequest } from '@/lib/api-client';

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
  trustScore?: number;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Role-Based Access Control (RBAC): Admin status is strictly determined by database role
  const isAdmin = Boolean(profile?.role?.toLowerCase() === 'admin');

  useEffect(() => {
    // 1. Check secure cookie-backed session via backend /api/auth/me
    async function initSession() {
      try {
        const sessionRes = await secureApiRequest('/auth/me');
        if (sessionRes.success && sessionRes.user) {
          const apiUser = sessionRes.user;
          const authUser: AuthUser = {
            uid: apiUser._id || apiUser.id,
            email: apiUser.email,
            displayName: apiUser.displayName,
          };
          const userProfile: Profile = {
            id: apiUser._id || apiUser.id,
            email: apiUser.email,
            display_name: apiUser.displayName,
            username: apiUser.username || 'student',
            role: (apiUser.role?.toLowerCase() === 'admin' ? 'admin' : (apiUser.role || 'student')) as Profile['role'],
            department: apiUser.department || null,
            year: apiUser.year || null,
            bio: apiUser.bio || null,
            skills: apiUser.skills || [],
            avatar_url: apiUser.avatarUrl || null,
            is_seller: true,
            is_verified: apiUser.isVerified ?? false,
            trustScore: apiUser.trustScore ?? 50.0,
          };
          setUser(authUser);
          setProfile(userProfile);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Fall through to Firebase auth listener
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
            await fetchProfile(firebaseUser.uid, firebaseUser.email ?? '');
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.warn('Auth initialization notice:', err);
      }

      // 3. Fallback stored session check
      if (typeof window !== 'undefined') {
        try {
          const storedFallback = localStorage.getItem('campuscart_fallback_user');
          if (storedFallback) {
            const parsed = JSON.parse(storedFallback);
            if (parsed?.user && parsed?.profile) {
              setUser(parsed.user);
              setProfile(parsed.profile);
            }
          }
        } catch {}
      }

      setLoading(false);
    }

    initSession();
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
          username: data.username || userEmail.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student',
          role: data.role === 'admin' ? 'admin' : (data.role || (data.is_seller ? 'seller' : 'student')),
          department: data.department || null,
          year: data.year || null,
          bio: data.bio || null,
          skills: data.skills || [],
          avatar_url: data.avatar_url || data.avatarUrl || null,
          is_seller: data.is_seller ?? true,
          is_verified: data.is_verified ?? false,
          trustScore: data.trustScore ?? 50.0,
        };
        setProfile(p);
        return;
      }
    } catch (err) {
      console.warn('Firestore profile fetch notice:', err);
    }

    const fallback: Profile = {
      id: userId,
      email: userEmail,
      display_name: userEmail.split('@')[0] || 'Student',
      username: userEmail.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student',
      role: 'student',
      department: 'Engineering',
      year: 'Student',
      bio: null,
      skills: [],
      avatar_url: null,
      is_seller: true,
      is_verified: false,
      trustScore: 50.0,
    };
    setProfile(fallback);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Attempt secure backend API login
    try {
      const backendRes = await secureApiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (backendRes.success && backendRes.user) {
        const u: AuthUser = {
          uid: backendRes.user.id || backendRes.user._id,
          email: backendRes.user.email,
          displayName: backendRes.user.displayName,
        };
        setUser(u);
        await fetchProfile(u.uid, trimmedEmail);
        return { success: true };
      }
    } catch (err) {
      // Fall through to Firebase auth
    }

    // 2. Firebase sign-in
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const u: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || trimmedEmail.split('@')[0],
      };
      setUser(u);
      await fetchProfile(cred.user.uid, trimmedEmail);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signIn notice:', err);
      let errorMsg = 'Invalid email or password. Please check your credentials or create an account.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password. Please try again.';
      }
      return { success: false, error: errorMsg };
    }
  }

  async function signUp({ email, password, displayName, department, year }: SignUpParams) {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    // 1. Attempt secure backend API registration
    try {
      const backendRes = await secureApiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          displayName: trimmedName,
          department,
          year,
        }),
      });

      if (backendRes.success && backendRes.user) {
        const u: AuthUser = {
          uid: backendRes.user.id || backendRes.user._id,
          email: backendRes.user.email,
          displayName: backendRes.user.displayName,
        };
        setUser(u);
        await fetchProfile(u.uid, trimmedEmail);
        return { success: true };
      }
    } catch (e) {
      // Fall through to Firebase auth
    }

    // 2. Firebase sign-up
    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await updateFirebaseProfile(cred.user, { displayName: trimmedName });

      const newProfile: Profile = {
        id: cred.user.uid,
        email: trimmedEmail,
        display_name: trimmedName,
        username: trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'student',
        role: 'student',
        department: department?.trim() || 'Engineering',
        year: year?.trim() || '1st Year',
        bio: null,
        skills: [],
        avatar_url: null,
        is_seller: true,
        is_verified: false,
        trustScore: 50.0,
      };

      try {
        await setDoc(doc(db, 'profiles', cred.user.uid), newProfile);
      } catch (e) {
        console.warn('Profile Firestore save notice:', e);
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('campuscart_fallback_user', JSON.stringify({
            user: { uid: cred.user.uid, email: trimmedEmail, displayName: trimmedName },
            profile: newProfile,
          }));
        } catch {}
      }

      setUser({ uid: cred.user.uid, email: trimmedEmail, displayName: trimmedName });
      setProfile(newProfile);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase signUp notice:', err);

      if (err.code === 'auth/email-already-in-use') {
        try {
          const loginCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
          const u: AuthUser = {
            uid: loginCred.user.uid,
            email: loginCred.user.email,
            displayName: loginCred.user.displayName || trimmedName,
          };
          setUser(u);
          await fetchProfile(loginCred.user.uid, trimmedEmail);
          return { success: true };
        } catch {
          return { success: false, error: 'An account with this email already exists. Please sign in.' };
        }
      }

      // Fallback local registration
      const uid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const localUser: AuthUser = { uid, email: trimmedEmail, displayName: trimmedName };
      const localProfile: Profile = {
        id: uid,
        email: trimmedEmail,
        display_name: trimmedName,
        username: trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'student',
        role: 'student',
        department: department?.trim() || 'Engineering',
        year: year?.trim() || '1st Year',
        bio: null,
        skills: [],
        avatar_url: null,
        is_seller: true,
        is_verified: false,
        trustScore: 50.0,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('campuscart_fallback_user', JSON.stringify({ user: localUser, profile: localProfile }));
        } catch {}
      }

      setUser(localUser);
      setProfile(localProfile);
      return { success: true };
    }
  }

  async function updateUserProfile(data: Partial<Profile>) {
    if (!profile) return;
    const updated: Profile = {
      ...profile,
      ...data,
      role: profile.role, // RBAC preservation: prevent role elevation on client profile update
    };
    setProfile(updated);

    if (typeof window !== 'undefined') {
      try {
        if (user) {
          localStorage.setItem('campuscart_fallback_user', JSON.stringify({ user, profile: updated }));
        }
      } catch {}
    }

    try {
      if (user) {
        await setDoc(doc(db, 'profiles', user.uid), updated, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore profile update notice:', e);
    }
  }

  async function signOut() {
    try {
      await secureApiRequest('/auth/logout', { method: 'POST' });
    } catch {}

    try {
      await firebaseSignOut(auth);
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('campuscart_fallback_user');
    }

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
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
