import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const t = await AsyncStorage.getItem("proxi_token");
      const u = await AsyncStorage.getItem("proxi_user");
      if (t && u) setUser(JSON.parse(u));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function login(phone_number) {
    const res = await authAPI.login({ phone_number });
    await AsyncStorage.setItem("proxi_token", res.data.token);
    await AsyncStorage.setItem("proxi_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(data) {
    const res = await authAPI.register(data);
    await AsyncStorage.setItem("proxi_token", res.data.token);
    await AsyncStorage.setItem("proxi_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    await AsyncStorage.removeItem("proxi_token");
    await AsyncStorage.removeItem("proxi_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
