import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    navigate("/admin/home");
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="E-mail"
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Senha"
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#111",
    padding: 32,
    borderRadius: 16,
    width: 320,
  },
  title: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    outline: "none",
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    border: "none",
    backgroundColor: "#ff3d81",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};