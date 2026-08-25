import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];
  const requiresRecruiter = normalizedRoles.includes("recrutador");

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: requiresRecruiter ? "#f4f6fb" : "#050816",
          color: requiresRecruiter ? "#172033" : "#fff",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        Carregando sessão...
      </div>
    );
  }

  if (!user) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;

    return (
      <Navigate
        to={requiresRecruiter ? "/admin/login" : "/login"}
        replace
        state={{ redirectTo }}
      />
    );
  }

  const userRole = String(user.role || "").toLowerCase();

  if (
    normalizedRoles.length > 0 &&
    !normalizedRoles.includes(userRole)
  ) {
    const roleHome =
      userRole === "recrutador"
        ? "/admin/home"
        : userRole === "candidato"
          ? "/homeUser"
          : "/";

    return (
      <Navigate to={roleHome} replace />
    );
  }

  return children;
}
