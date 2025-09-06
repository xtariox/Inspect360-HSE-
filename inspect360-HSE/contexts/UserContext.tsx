import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { UserProfile } from '../types/auth';
import { roleService, RolePermissions } from '../services/roleService';
import { authService } from '../services/authService';
import { supabase } from '../config/supabase';

interface UserContextType {
  user: UserProfile | null;
  permissions: RolePermissions;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isAdmin: () => boolean;
  canManageOthers: () => boolean;
  canManageUsers: () => boolean;
  isInspectorOnly: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastSessionUserRef = useRef<string | null>(null);

  const permissions = roleService.getPermissions(user);

  const refreshUser = async () => {
    try {
      console.log('UserContext - refreshUser() called');
      
      // Don't set loading if we already have a user (prevents white screen on tab switches)
      if (!user) {
        setIsLoading(true);
      }
      
      const currentUser = await authService.getCurrentUser();
      console.log('UserContext - Current user loaded:', {
        id: currentUser?.id,
        email: currentUser?.email,
        role: currentUser?.role,
        full_name: currentUser?.full_name
      }); // Enhanced debug log
      setUser(currentUser);
      
      // Update the ref with the current session user ID
      if (currentUser) {
        lastSessionUserRef.current = currentUser.id;
      } else {
        lastSessionUserRef.current = null;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      lastSessionUserRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('UserContext - logout() called');
    try {
      console.log('UserContext - calling authService.logout()');
      await authService.logout();
      console.log('UserContext - authService.logout() completed, setting user to null');
      
      // Immediately clear user state
      setUser(null);
      setIsLoading(false);
      console.log('UserContext - user set to null, logout complete');
      
      // No need for page reload - React Navigation will handle the state change
      // The DesktopDrawer will automatically switch to AuthScreen when user becomes null
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if logout fails, clear the local state
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    // Initial user load
    refreshUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('UserContext - Auth state change:', event, session?.user?.email);
        console.log('UserContext - Current loading state:', isLoading);
        console.log('UserContext - Current user state:', user?.email);
        
        if (event === 'SIGNED_OUT') {
          console.log('UserContext - User signed out, clearing user state');
          setUser(null);
          setIsLoading(false);
          lastSessionUserRef.current = null;
          
          // For web, ensure we're really signed out
          if (Platform.OS === 'web') {
            console.log('UserContext - Confirming logout on web platform');
            // Clear any cached auth data
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                console.log('UserContext - Redirecting to root after logout');
                window.location.href = window.location.origin;
              }
            }, 100);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('UserContext - User signed in, checking if refresh needed');
          console.log('UserContext - Session user:', session.user.id, 'Last session user:', lastSessionUserRef.current);
          
          // Only refresh if the session user ID is different from the last one we processed
          const userChanged = lastSessionUserRef.current !== session.user.id;
          
          if (userChanged) {
            console.log('UserContext - User changed, refreshing profile');
            await refreshUser();
          } else {
            console.log('UserContext - Same user detected, skipping refresh to prevent white screen');
            // Ensure loading is false without triggering a refresh
            setIsLoading(false);
          }
        } else if (event === 'INITIAL_SESSION') {
          console.log('UserContext - Initial session detected');
          if (session?.user) {
            console.log('UserContext - Initial session has user, refreshing profile');
            await refreshUser();
          } else {
            console.log('UserContext - Initial session has no user, setting loading to false');
            setIsLoading(false);
          }
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return roleService.hasPermission(user, permission);
  };

  const isAdmin = (): boolean => {
    return roleService.isAdmin(user);
  };

  const canManageOthers = (): boolean => {
    return roleService.canManageOthers(user);
  };

  const canManageUsers = (): boolean => {
    return roleService.hasPermission(user, 'canManageUsers');
  };

  const isInspectorOnly = (): boolean => {
    return roleService.isInspectorOnly(user);
  };

  const value: UserContextType = {
    user,
    permissions,
    isLoading,
    refreshUser,
    logout,
    hasPermission,
    isAdmin,
    canManageOthers,
    canManageUsers,
    isInspectorOnly,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
