'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser.email ?? '');
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function fetchProfile(userId: string, userEmail: string) {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
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
          is_seller: data.is_seller ?? false,
          is_verified: data.is_verified ?? false,
        });
      } else {
        // Create basic profile fallback if document does not exist yet
        setProfile({
          id: userId,
          email: userEmail,
          display_name: userEmail.split('@')[0],
          username: userEmail.split('@')[0],
          role: 'student',
          department: null,
          year: null,
          bio: null,
          skills: [],
          avatar_url: null,
          is_seller: false,
          is_verified: false,
        });
      }
    } catch (err) {
      console.error('Error fetching profile from Firestore:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setProfile(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
