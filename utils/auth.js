export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
  // Sync to cookie for middleware
  document.cookie = `ssh_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

export const removeToken = () => {
  localStorage.removeItem('token');
  document.cookie = 'ssh_token=; path=/; max-age=0';
};

export const isAuthenticated = () => !!getToken();

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
};
