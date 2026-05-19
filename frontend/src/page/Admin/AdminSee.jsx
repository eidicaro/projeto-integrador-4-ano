import React, { useState } from "react";

export default function AdminSee() {
  const [vagaModal, setVagaModal] = useState(false);
  const [candidatoModal, setCandidatoModal] = useState(false);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Vagas publicadas</h2>

      <div style={styles.card} onClick={() => setVagaModal(true)}>
        <strong>Desenvolvedor Front-end</strong>
        <p style={styles.sub}>São Paulo - SP</p>
      </div>

      {/* MODAL VAGA */}
      {vagaModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Detalhes da vaga</h3>

            <button
              style={styles.primaryButton}
              onClick={() => {
                setVagaModal(false);
                setCandidatoModal(true);
              }}
            >
              Ver candidatos
            </button>

            <button style={styles.closeButton} onClick={() => setVagaModal(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CANDIDATOS */}
      {candidatoModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>Candidatos</h3>

            <div style={styles.candidate}>João Silva</div>
            <div style={styles.candidate}>Maria Oliveira</div>

            <button style={styles.closeButton} onClick={() => setCandidatoModal(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 18,
    borderRadius: 12,
    cursor: "pointer",
    maxWidth: 400,
  },
  sub: {
    color: "#aaa",
    marginTop: 6,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 12,
    width: 320,
  },
  primaryButton: {
    backgroundColor: "#ff3d81",
    color: "#fff",
    border: "none",
    padding: 12,
    width: "100%",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 16,
  },
  closeButton: {
    backgroundColor: "transparent",
    color: "#aaa",
    border: "none",
    marginTop: 12,
    cursor: "pointer",
    width: "100%",
  },
  candidate: {
    backgroundColor: "#1c1c1c",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
};