import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Get user info
      API.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await API.post("/auth/register", { name, email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const googleLogin = async (credential) => {
    const res = await API.post("/auth/google", { credential });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  const deleteAccount = async () => {
    try {
      const response = await API.delete("/auth/delete-account");
      // Only logout if deletion was successful
      logout();
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to delete account";
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (data) => {
    const res = await API.patch("/auth/profile", data);
    setUser(res.data);
    return res.data;
  };

  const value = {
    user,
    login,
    register,
    googleLogin,
    logout,
    deleteAccount,
    updateProfile,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
