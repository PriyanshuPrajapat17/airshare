// API helper for AirShare backend requests
const API_BASE = '/api';

// Helper to get stored auth token
const getToken = () => localStorage.getItem('airshare_token');

// Generic request helper with automatic JSON handling and Auth headers
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  // Auth endpoints
  signup: (userData) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request('/auth/me'),

  // Trip endpoints
  getTrips: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.airport) params.append('airport', filters.airport);
    if (filters.destination) params.append('destination', filters.destination);
    if (filters.date) params.append('date', filters.date);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/trips${queryString}`);
  },

  createTrip: (tripData) =>
    request('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    }),

  joinTrip: (tripId) =>
    request(`/trips/${tripId}/join`, {
      method: 'POST',
    }),

  leaveTrip: (tripId) =>
    request(`/trips/${tripId}/leave`, {
      method: 'POST',
    }),

  markBooked: (tripId) =>
    request(`/trips/${tripId}/booked`, {
      method: 'PATCH',
    }),

  deleteTrip: (tripId) =>
    request(`/trips/${tripId}`, {
      method: 'DELETE',
    }),
};
