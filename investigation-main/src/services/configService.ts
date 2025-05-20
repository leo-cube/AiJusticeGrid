/* eslint-disable */
import api from './api';
import defaultSettings from '@/config/defaultSettings.json';

// API endpoints
const SETTINGS_ENDPOINT = defaultSettings.api.endpoints.settings;

// Configuration service
export const configService = {
  // Get all settings
  getSettings: async () => {
    try {
      return await api.get(SETTINGS_ENDPOINT);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Fall back to default settings
      return defaultSettings;
    }
  },
  
  // Update settings
  updateSettings: async (settings: any) => {
    try {
      return await api.put(SETTINGS_ENDPOINT, settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },
  
  // Get specific setting by path (e.g., 'ui.theme.primary')
  getSetting: async (path: string) => {
    try {
      const settings = await api.get(SETTINGS_ENDPOINT);
      return getNestedValue(settings, path);
    } catch (error) {
      console.error(`Failed to fetch setting ${path}:`, error);
      // Fall back to default setting
      return getNestedValue(defaultSettings, path);
    }
  },
  
  // Update specific setting by path
  updateSetting: async (path: string, value: any) => {
    try {
      const settings = await api.get(SETTINGS_ENDPOINT);
      const updatedSettings = setNestedValue(settings, path, value);
      return await api.put(SETTINGS_ENDPOINT, updatedSettings);
    } catch (error) {
      console.error(`Failed to update setting ${path}:`, error);
      throw error;
    }
  },
  
  // Reset settings to default
  resetSettings: async () => {
    try {
      return await api.put(SETTINGS_ENDPOINT, defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  },
  
  // Get default settings
  getDefaultSettings: () => {
    return defaultSettings;
  }
};

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  return keys.reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
}

// Helper function to set nested value in object using dot notation
function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
}

export default configService;
