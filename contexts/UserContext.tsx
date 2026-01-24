import React, { createContext, useContext, useState, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';

type Role = 'labour' | 'site_supervisor' | 'junior_engineer' | 'senior_engineer' | 'site_manager' | 'site_owner';

interface UserData {
  id?: string; // MongoDB ObjectId
  role: Role;
  name: string;
  email?: string; // Email address
  phoneNumber: string;
  profilePhoto?: string | null; // Profile photo URL
  location: string;
  currentSiteId?: string;
  currentSiteName?: string;
  enrollmentStatus?: 'active' | 'inactive' | 'pending';
  profileCompleted?: boolean;
  ownerDetails?: {
    companyName: string;
    ownerName: string;
    email: string;
    gstNumber: string;
    panNumber: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  isRegistered?: boolean;
}

interface UserContextType {
  user: UserData | null;
  token: string | null; // JWT token for labour API authentication
  setUser: (user: UserData) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  refreshUser?: () => Promise<void>; // Function to refresh user data
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    // Refresh user data from backend if needed
    // For now, just keep existing user data
    console.log('refreshUser called');
  };

  return (
    <UserContext.Provider value={{ user, token, setUser, setToken, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
