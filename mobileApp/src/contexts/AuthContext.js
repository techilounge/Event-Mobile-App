import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { firebaseConfig } from '../../firebase.config';
import { authAPI, usersAPI } from '../services/api';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from storage
  useEffect(() => {
    checkAuthState();
  }, []);

  // Monitor Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken();

          // Verify token with backend and get user data
          const response = await authAPI.verifyFirebaseToken(idToken);

          // Save tokens
          await AsyncStorage.setItem('accessToken', idToken);
          await AsyncStorage.setItem('user', JSON.stringify(response.user));

          setUser(response.user);
        } catch (error) {
          console.error('Error verifying Firebase token:', error);
          setError(error.message);
        }
      } else {
        setUser(null);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, role = 'attendee') => {
    try {
      setLoading(true);
      setError(null);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Register with backend
      const response = await authAPI.register({
        email,
        password,
        name,
        role,
      });

      // Save user data
      await AsyncStorage.setItem('accessToken', idToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Verify with backend
      const response = await authAPI.verifyFirebaseToken(idToken);

      // Save user data
      await AsyncStorage.setItem('accessToken', idToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Sign out from Firebase
      await signOut(auth);

      // Clear local storage
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      await sendPasswordResetEmail(auth, email);

      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (userData) => {
    try {
      setLoading(true);

      // Update Firebase profile if name changed
      const currentUser = auth.currentUser;
      if (userData.name && currentUser) {
        await updateProfile(currentUser, {
          displayName: userData.name,
        });
      }

      // Update backend
      const response = await usersAPI.update(user.id, userData);

      // Update local state
      const updatedUser = { ...user, ...response };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    resetPassword,
    updateProfile: updateUserProfile,
    isAuthenticated: !!user,
    isOrganizer: user?.role === 'organizer',
    isSponsor: user?.role === 'sponsor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
