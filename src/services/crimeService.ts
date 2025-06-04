import api from './api';
import defaultSettings from '@/config/defaultSettings.json';
import { Crime } from '@/app/types';

// API endpoints
const CRIMES_ENDPOINT = defaultSettings.api.endpoints.crimes;
const CRIME_TYPES_ENDPOINT = defaultSettings.api.endpoints.crimeTypes;

// Crime service
export const crimeService = {
  // Get all crimes
  getAllCrimes: () => api.get<Crime[]>(CRIMES_ENDPOINT),
  
  // Get crime by ID
  getCrimeById: (id: string) => api.get<Crime>(`${CRIMES_ENDPOINT}/${id}`),
  
  // Get crimes by type
  getCrimesByType: (type: string) => api.get<Crime[]>(`${CRIMES_ENDPOINT}?type=${type}`),
  
  // Get crimes by status
  getCrimesByStatus: (status: string) => api.get<Crime[]>(`${CRIMES_ENDPOINT}?status=${status}`),
  
  // Create new crime
  createCrime: (crime: Partial<Crime>) => api.post<Crime>(CRIMES_ENDPOINT, crime),
  
  // Update crime
  updateCrime: (crime: Crime) => api.put<Crime>(`${CRIMES_ENDPOINT}/${crime.id}`, crime),
  
  // Delete crime
  deleteCrime: (id: string) => api.delete(`${CRIMES_ENDPOINT}/${id}`),
  
  // Get all crime types
  getCrimeTypes: () => api.get(CRIME_TYPES_ENDPOINT),
};

export default crimeService;
