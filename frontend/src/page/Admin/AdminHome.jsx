import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminHome() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Painel do Administrador</h2>

      <div style={styles.cards}>
        <div
          style={styles.cardPink}
          onClick={() => navigate("/admin/criar-vaga")}
        >
          <h3>Criar vaga</h3>
          <p>Cadastrar novas oportunidades</p>
        </div>

        <div
          style={styles.cardBlue}
          onClick={() => navigate("/admin/ver-vagas")}
        >
          <h3>Ver vagas</h3>
          <p>Visualizar vagas publicadas</p>
        </div>
      </div>
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
    marginBottom: 32,
  },
  cards: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
  },
  cardPink: {
    backgroundColor: "#ff3d81",
    padding: 24,
    borderRadius: 16,
    width: 240,
    cursor: "pointer",
  },
  cardBlue: {
    backgroundColor: "#3d7bff",
    padding: 24,
    borderRadius: 16,
    width: 240,
    cursor: "pointer",
  },
};