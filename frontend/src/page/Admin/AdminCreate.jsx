import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminCreate() {
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // futuramente: enviar dados para API
    navigate("/admin/home");
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Criar nova vaga</h2>

      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Título da vaga"
          required
          style={styles.input}
        />

        <input
          type="text"
          placeholder="Local (ex: São Paulo - SP)"
          required
          style={styles.input}
        />

        <input
          type="text"
          placeholder="Tipo (CLT, Estágio, PJ)"
          required
          style={styles.input}
        />

        <textarea
          placeholder="Descrição da vaga"
          required
          rows={5}
          style={styles.textarea}
        />

        <button type="submit" style={styles.button}>
          Criar vaga
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#000",
    padding: 24,
    color: "#fff",
  },
  title: {
    marginBottom: 24,
  },
  form: {
    maxWidth: 420,
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
  textarea: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    outline: "none",
    fontSize: 14,
    resize: "none",
  },
  button: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#3d7bff",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};