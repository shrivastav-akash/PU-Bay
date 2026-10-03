import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);
export const DataContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export const useData = () => useContext(DataContext);
