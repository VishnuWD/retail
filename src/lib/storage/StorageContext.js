'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { kiranaStorage, INITIAL_SEED_DATA } from './kiranaStorage';

const StorageContext = createContext(null);

export function StorageProvider({ children }) {
  const [storageMode, setStorageModeState] = useState('local');
  const [session, setSessionState] = useState(null);
  const [business, setBusinessState] = useState(null);
  const [stats, setStats] = useState({ totalSizeKB: '0', counts: {}, mode: 'local' });
  const [isReady, setIsReady] = useState(false);

  // Initialize storage and load state on mount
  useEffect(() => {
    kiranaStorage.init();
    const currentMode = kiranaStorage.getMode();
    const currentSession = kiranaStorage.getSession();
    const currentBusiness = kiranaStorage.getBusiness();

    setStorageModeState(currentMode);
    setSessionState(currentSession);
    setBusinessState(currentBusiness);
    setStats(kiranaStorage.getStorageStats());
    setIsReady(true);

    const handleStorageUpdate = () => {
      setStats(kiranaStorage.getStorageStats());
      setSessionState(kiranaStorage.getSession());
      setBusinessState(kiranaStorage.getBusiness());
    };

    window.addEventListener('kirana_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('kirana_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Switch storage mode
  const setStorageMode = useCallback((mode) => {
    kiranaStorage.setMode(mode);
    setStorageModeState(mode);
    setStats(kiranaStorage.getStorageStats());
  }, []);

  // Set active user session
  const setSession = useCallback((newSession) => {
    kiranaStorage.setSession(newSession);
    setSessionState(newSession);
  }, []);

  // Update business profile
  const updateBusiness = useCallback((updates) => {
    const updated = kiranaStorage.updateBusiness(updates);
    setBusinessState(updated);
    return updated;
  }, []);

  // Reset to default sample Kirana dataset
  const resetToDefault = useCallback(() => {
    kiranaStorage.resetToDefault();
    setSessionState(INITIAL_SEED_DATA.session);
    setBusinessState(INITIAL_SEED_DATA.business);
    setStats(kiranaStorage.getStorageStats());
  }, []);

  // Export JSON backup file
  const exportBackup = useCallback(() => {
    const data = kiranaStorage.exportData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GreenMart_Kirana_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import JSON backup file
  const importBackup = useCallback((jsonData) => {
    kiranaStorage.importData(jsonData);
    setSessionState(kiranaStorage.getSession());
    setBusinessState(kiranaStorage.getBusiness());
    setStats(kiranaStorage.getStorageStats());
  }, []);

  const value = {
    isReady,
    storageMode,
    setStorageMode,
    session,
    setSession,
    business,
    updateBusiness,
    stats,
    resetToDefault,
    exportBackup,
    importBackup,
    storageEngine: kiranaStorage
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
