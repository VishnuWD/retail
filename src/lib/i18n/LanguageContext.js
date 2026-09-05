'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';
import { ta } from './ta';
import { te } from './te';
import { kn } from './kn';

const DICTIONARIES = { en, hi, mr, ta, te, kn };

const PACK_TYPE_TRANSLATIONS = {
  en: 'Pack Type',
  hi: 'पैक टाइप',
  mr: 'पॅक टाईप',
  ta: 'பேக் வகை',
  te: 'ప్యాక్ రకం',
  kn: 'ಪ್ಯಾಕ್ ಪ್ರಕಾರ'
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Read persisted locale on mount
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && DICTIONARIES[savedLocale]) {
      setLocale(savedLocale);
    }
  }, []);

  const changeLocale = (newLocale) => {
    if (DICTIONARIES[newLocale]) {
      setLocale(newLocale);
      localStorage.setItem('locale', newLocale);
    }
  };

  /**
   * Translates a category name
   */
  const tc = (categoryName) => {
    if (!categoryName) return '';
    const currentDict = DICTIONARIES[locale] || DICTIONARIES['en'];
    return currentDict.categories?.[categoryName] || DICTIONARIES['en'].categories?.[categoryName] || categoryName;
  };

  /**
   * Translates a unit of measurement
   */
  const tu = (unitName) => {
    if (!unitName) return '';
    const currentDict = DICTIONARIES[locale] || DICTIONARIES['en'];
    return currentDict.units?.[unitName] || DICTIONARIES['en'].units?.[unitName] || unitName;
  };

  /**
   * Translates a brand name
   */
  const tb = (brandName) => {
    if (!brandName) return '';
    const currentDict = DICTIONARIES[locale] || DICTIONARIES['en'];
    return currentDict.brands?.[brandName] || DICTIONARIES['en'].brands?.[brandName] || brandName;
  };

  /**
   * Translates a status code
   */
  const ts = (statusName) => {
    if (!statusName) return '';
    const currentDict = DICTIONARIES[locale] || DICTIONARIES['en'];
    return currentDict.statuses?.[statusName] || DICTIONARIES['en'].statuses?.[statusName] || statusName;
  };

  /**
   * Translates a product name (with exact catalog match or algorithmic pattern match)
   */
  const tp = (productName) => {
    if (!productName) return '';
    const currentDict = DICTIONARIES[locale] || DICTIONARIES['en'];

    // 1. Direct dictionary match
    if (currentDict.products_dict?.[productName]) {
      return currentDict.products_dict[productName];
    }

    // 2. Algorithmic Pattern Match: e.g. "Nestle Dairy Pack Type-40"
    const packPattern = /^(.*?)\s+(Dairy|Beverages|Snacks|Staples|Household|Personal Care|Stationery|Toys|General)\s+Pack Type-(\d+)$/i;
    const match = productName.match(packPattern);
    if (match) {
      const rawBrand = match[1];
      const rawCat = match[2];
      const num = match[3];

      const translatedBrand = tb(rawBrand);
      const translatedCat = tc(rawCat);
      const packWord = PACK_TYPE_TRANSLATIONS[locale] || 'Pack Type';

      return `${translatedBrand} ${translatedCat} ${packWord}-${num}`;
    }

    // 3. Fallback to English dictionary or raw product name
    return DICTIONARIES['en'].products_dict?.[productName] || productName;
  };

  /**
   * Translates a key path. E.g. t('nav.dashboard') or t('common.save')
   * If not a dot-path, searches in common, categories, units, brands, statuses, or products.
   */
  const t = (keyPath, fallback) => {
    if (!keyPath) return fallback || '';

    const currentDict = DICTIONARIES[locale] || DICTIONARIES['en'];
    const fallbackDict = DICTIONARIES['en'];

    // If key has dots (e.g. 'nav.dashboard')
    if (keyPath.includes('.')) {
      const keys = keyPath.split('.');
      let result = findKey(currentDict, keys);
      if (result !== undefined) return result;

      result = findKey(fallbackDict, keys);
      if (result !== undefined) return result;
    }

    // Direct lookup in common or other domains
    if (currentDict.common?.[keyPath]) return currentDict.common[keyPath];
    if (currentDict.products_dict?.[keyPath]) return currentDict.products_dict[keyPath];
    if (currentDict.categories?.[keyPath]) return currentDict.categories[keyPath];
    if (currentDict.units?.[keyPath]) return currentDict.units[keyPath];
    if (currentDict.brands?.[keyPath]) return currentDict.brands[keyPath];
    if (currentDict.statuses?.[keyPath]) return currentDict.statuses[keyPath];

    if (fallbackDict.common?.[keyPath]) return fallbackDict.common[keyPath];

    // Return the fallback or raw key path
    return fallback !== undefined ? fallback : keyPath;
  };

  function findKey(obj, keys) {
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return current;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale: changeLocale, t, tp, tc, tu, tb, ts }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
