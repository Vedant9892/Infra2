import React, { createContext, useContext, useState, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';

type Role = 'labour' | 'supervisor' | 'engineer' | 'owner';

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
  setUser: (user: UserData) => void;
  logout: () => void;
  refreshUser?: () => Promise<void>; // Function to refresh user data
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);

  const logout = () => {
    setUser(null);
  };

  const refreshUser = async () => {
    // Refresh user data from backend if needed
    // For now, just keep existing user data
    console.log('refreshUser called');
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, refreshUser }}>
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
