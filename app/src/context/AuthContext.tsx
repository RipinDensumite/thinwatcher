/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/AuthContext.tsx
import { APP_CONFIG } from "@/utils/appconfig";
import { createContext, useState, useEffect, ReactNode } from "react";

// Define types for our context data
interface User {
  username: string;
  email: string;
  role: string;
  [key: string]: any; // For any additional user properties
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  canRegister: boolean;
  register: (username: string, email: string, password: string) => Promise<{
    isFirstUser?: boolean;
  }>;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  authFetch: (endpoint: string, options?: RequestInit) => Promise<Response>;
  checkRegistrationStatus: () => Promise<void>;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  error: null,
  canRegister: false,
  register: async () => ({}),
  login: async () => ({}),
  logout: async () => {},
  authFetch: async () => new Response(),
  checkRegistrationStatus: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [canRegister, setCanRegister] = useState<boolean>(false);

  const API_URL = APP_CONFIG.BACKEND_API_URL;

  // Check registration status
  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/can-register`);
      const data = await response.json();
      setCanRegister(data.canRegister);
      return data.canRegister;
    } catch (err) {
      console.error("Error checking registration status:", err);
      setCanRegister(false);
      return false;
    }
  };

  // Check if user is logged in on page load
  useEffect(() => {
    const loadUser = async () => {
      // Check registration status first
      await checkRegistrationStatus();

      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
            setIsAdmin(userData.role === "admin");
          } else {
            // Token is invalid or expired
            localStorage.removeItem("token");
            setToken(null);
          }
        } catch (err) {
          console.error("Error loading user:", err);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, API_URL]);

  // Register user
  const register = async (username: string, email: string, password: string) => {
    // Check if registration is allowed
    if (!canRegister) {
      throw new Error("Registration is not currently allowed");
    }

    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Set token in localStorage
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      setIsAdmin(data.user.role === "admin");
      
      // Update registration status
      setCanRegister(false);

      return {
        isFirstUser: data.isFirstUser || false
      };
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw err;
    }
  };

  // Login user (unchanged from previous version)
  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Set token in localStorage
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      setIsAdmin(data.user.role === "admin");
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw err;
    }
  };

  // Logout user (mostly unchanged)
  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);

      // Recheck registration status after logout
      await checkRegistrationStatus();
    }
  };

  // API request with authentication (unchanged)
  const authFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    if (!token) {
      throw new Error("Authentication required");
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle token expiration
    if (response.status === 401) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      throw new Error("Session expired, please login again");
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        error,
        canRegister,
        register,
        login,
        logout,
        authFetch,
        checkRegistrationStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};