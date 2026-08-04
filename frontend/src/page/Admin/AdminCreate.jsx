import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminCreate() {
  const navigate = useNavigate();

  const [buttonStyle, setButtonStyle] = useState(styles.button);

  function handleSubmit(e) {
    e.preventDefault();
    navigate("/admin/home");
  }

  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow}></div>

      <div style={styles.card}>
        <div style={styles.icon}>💼</div>

        <h2 style={styles.title}>Criar Nova Vaga</h2>

        <p style={styles.subtitle}>
          Preencha as informações abaixo para cadastrar uma nova oportunidade.
        </p>

        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Título da vaga"
            required
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Local (Ex: São Paulo - SP)"
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
            rows={5}
            placeholder="Descrição da vaga"
            required
            style={styles.textarea}
          />

          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={() =>
              setButtonStyle({
                ...styles.button,
                transform: "translateY(-3px) scale(1.02)",
                boxShadow: "0 15px 40px rgba(61,123,255,.45)",
              })
            }
            onMouseLeave={() => setButtonStyle(styles.button)}
          >
            Criar vaga →
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top,#162447 0%, #0b0b0b 45%, #000 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    overflow: "hidden",
    position: "relative",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    animation: "fade .7s ease",
  },

  backgroundGlow: {
    position: "absolute",
    width: 450,
    height: 450,
    borderRadius: "50%",
    background: "#3d7bff",
    filter: "blur(180px)",
    opacity: .22,
    top: -120,
    right: -100,
  },

  card: {
    width: "100%",
    maxWidth: 500,
    padding: 35,
    borderRadius: 24,
    background: "rgba(255,255,255,.05)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow:
      "0 20px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.05)",
    position: "relative",
    zIndex: 2,
  },

  icon: {
    width: 70,
    height: 70,
    margin: "0 auto 20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    background:
      "linear-gradient(135deg,#3d7bff,#5f95ff)",
    boxShadow: "0 10px 35px rgba(61,123,255,.45)",
  },

  title: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: .3,
  },

  subtitle: {
    textAlign: "center",
    color: "#bdbdbd",
    marginBottom: 30,
    fontSize: 14,
    lineHeight: 1.6,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  input: {
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,.08)",
    padding: "15px 18px",
    borderRadius: 14,
    outline: "none",
    fontSize: 15,
    transition: ".3s",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.02)",
  },

  textarea: {
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,.08)",
    padding: "15px 18px",
    borderRadius: 14,
    outline: "none",
    fontSize: 15,
    resize: "none",
    transition: ".3s",
  },

  button: {
    marginTop: 8,
    padding: "16px",
    borderRadius: 16,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
    background:
      "linear-gradient(135deg,#3d7bff,#2563eb)",
    transition: ".3s",
    boxShadow: "0 10px 30px rgba(61,123,255,.35)",
    letterSpacing: .5,
  },
};