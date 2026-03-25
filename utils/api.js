import { API_BASE_URL } from './constants';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Handle JSON and FormData bodies correctly
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    // Remove Content-Type for FormData to let browser set boundary
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(err.error || err.message || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: userData,
  }),
  getProfile: () => apiRequest('/auth/profile'),
};

// Student API
export const studentAPI = {
  getProfile: () => apiRequest('/students/profile'),

  updateProfile: (data) => {
    let body;
    if (data instanceof FormData) {
      body = data;
    } else {
      body = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          if (data[key] instanceof File) {
            body.append(key, data[key]);
          } else {
            body.append(key, String(data[key]));
          }
        }
      });
    }
    return apiRequest('/students/profile', {
      method: 'PUT',
      body: body,
    });
  },

  getStats: () => apiRequest('/students/activities/stats'),

  getActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/students/activities${query ? `?${query}` : ''}`);
  },

  submitActivity: (formData) => apiRequest('/students/activities', {
    method: 'POST',
    body: formData,
  }),

  updateActivity: (activityId, formData) => apiRequest(`/students/activities/${activityId}`, {
    method: 'PUT',
    body: formData,
  }),

  deleteActivity: (activityId) => apiRequest(`/students/activities/${activityId}`, {
    method: 'DELETE',
  }),

  getAllStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/students/browse${query ? `?${query}` : ''}`);
  },

  uploadAvatar: (formData) => apiRequest('/students/upload-avatar', {
    method: 'POST',
    body: formData,
  }),
};

// Faculty API
export const facultyAPI = {
  getStats: () => apiRequest('/faculty/stats'),
  getPendingActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/faculty/activities/pending${query ? `?${query}` : ''}`);
  },
  getAllActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/faculty/activities${query ? `?${query}` : ''}`);
  },
  reviewActivity: (activityId, data) => apiRequest(`/faculty/activities/${activityId}`, {
    method: 'PUT',
    body: data,
  }),
  getAllStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/faculty/students${query ? `?${query}` : ''}`);
  },
};

// Admin API
export const adminAPI = {
  getStats: () => apiRequest('/admin/stats'),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },
  createUser: (data) => apiRequest('/admin/users', {
    method: 'POST',
    body: data,
  }),
  updateUser: (userId, data) => apiRequest(`/admin/users/${userId}`, {
    method: 'PUT',
    body: data,
  }),
  deleteUser: (userId) => apiRequest(`/admin/users/${userId}`, {
    method: 'DELETE',
  }),
  toggleUserStatus: (userId) => apiRequest(`/admin/users/${userId}/toggle-status`, {
    method: 'POST',
  }),
  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/reports${query ? `?${query}` : ''}`);
  },
};
