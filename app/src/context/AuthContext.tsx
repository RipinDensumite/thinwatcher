/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/AuthContext.tsx
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
  register: (username: string, email: string, password: string) => Promise<any>;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  authFetch: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  error: null,
  register: async () => ({}),
  login: async () => ({}),
  logout: async () => {},
  authFetch: async () => new Response(),
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

  const API_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3001";

  // Check if user is logged in on page load
  useEffect(() => {
    const loadUser = async () => {
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
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw err;
    }
  };

  // Login user
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

  // Logout user
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
    }
  };

  // API request with authentication
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
        register,
        login,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};