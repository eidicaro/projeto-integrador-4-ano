import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, { initializeCsrf } from "../lib/api";

const AuthContext = createContext(null);

function extractUser(responseData) {
  return responseData?.data?.user || responseData?.user || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function bootstrapSession() {
      try {
        const response = await api.get("/me", {
          signal: controller.signal,
        });

        if (active) {
          setUser(extractUser(response.data));
        }
      } catch (error) {
        if (
          active &&
          error?.code !== "ERR_CANCELED" &&
          ![401, 419].includes(error?.response?.status)
        ) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener("point:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("point:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    await initializeCsrf();

    const response = await api.post("/login", credentials);
    let authenticatedUser = extractUser(response.data);

    if (!authenticatedUser) {
      const meResponse = await api.get("/me");
      authenticatedUser = extractUser(meResponse.data);
    }

    if (!authenticatedUser) {
      throw new Error("A API não retornou os dados do usuário autenticado.");
    }

    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const register = useCallback(async (registrationData) => {
    await initializeCsrf();

    const response = await api.post("/register", registrationData);
    return response.data;
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const response = await api.patch("/me", profileData);
    const updatedUser = extractUser(response.data);

    if (!updatedUser) {
      throw new Error("A API não retornou o perfil atualizado.");
    }

    setUser(updatedUser);
    return updatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      updateProfile,
      logout,
    }),
    [loading, login, logout, register, updateProfile, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// O hook acompanha o provider no mesmo módulo para manter a API pública coesa.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
  }

  return context;
}
