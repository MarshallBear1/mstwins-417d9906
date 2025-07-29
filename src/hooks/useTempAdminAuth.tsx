import { useState, useEffect } from 'react';

export const useTempAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated with temporary password
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem('temp_admin_authenticated') === 'true';
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (in case user logs out in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    sessionStorage.removeItem('temp_admin_authenticated');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    logout
  };
};