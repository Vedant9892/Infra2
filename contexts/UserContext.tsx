import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'labour' | 'supervisor' | 'engineer' | 'owner';

interface UserData {
  role: Role;
  name: string;
  phoneNumber: string;
  location: string;
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
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
