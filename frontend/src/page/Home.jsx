import React from "react";

export default function Home() {
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logo}>point</div>
        <div style={styles.menu}>☰</div>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.title}>Banco de Talentos</h1>
        <p style={styles.text}>
          Um banco de talentos é um espaço criado para reunir e organizar
          informações de profissionais interessados em fazer parte de uma
          empresa, mesmo quando não há uma vaga específica aberta no momento.
        </p>
      </section>

      {/* QUEM SOMOS */}
      <section style={styles.about}>
        <h2 style={styles.subtitle}>Quem Somos?</h2>

        <div style={styles.aboutGrid}>
          <p style={styles.text}>
            Um banco de talentos é um espaço criado para reunir e organizar
            informações de profissionais interessados em fazer parte de uma
            empresa.
          </p>
          <p style={styles.text}>
            Um banco de talentos é um espaço criado para reunir e organizar
            informações de profissionais interessados em fazer parte de uma
            empresa.
          </p>
        </div>
      </section>

      {/* VAGAS */}
      <section style={styles.jobs}>
        <h2 style={styles.jobsTitle}>Vagas Disponíveis</h2>

        <div style={styles.cards}>
          {[1, 2, 3].map((_, i) => (
            <div key={i} style={styles.card}>
              <img
                src="https://images.unsplash.com/photo-1607746882042-944635dfe10e"
                alt="Dev"
                style={styles.cardImage}
              />
              <span style={styles.cardLabel}>DESENVOLVEDOR DEV</span>
            </div>
          ))}
        </div>
      </section>

      {/* BOTÃO */}
      <div style={styles.buttonArea}>
        <button style={styles.button}>Todas as Vagas</button>
      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <div style={{ ...styles.circle, background: "#ec4899" }} />
          <div style={{ ...styles.circle, background: "#3b82f6" }} />
        </div>

        <div style={styles.footerCenter}>
          <p>Páginas</p>
          <p>Meu Perfil</p>
          <p>Vagas</p>
          <p>Meu Portfólio</p>
        </div>

        <div style={styles.footerRight}>
          <p>Vila Madalena - São Paulo - SP</p>
          <p>© pointmidia 2024</p>
        </div>
      </footer>
    </div>
  );
}

/* =======================
   STYLE SHEET
======================= */

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderBottom: "1px solid #ddd",
    alignItems: "center",
  },

  logo: {
    fontWeight: "bold",
    fontSize: 18,
  },

  menu: {
    fontSize: 22,
    cursor: "pointer",
  },

  hero: {
    padding: 40,
    maxWidth: 900,
  },

  title: {
    borderLeft: "4px solid #3b82f6",
    paddingLeft: 12,
    marginBottom: 16,
  },

  subtitle: {
    borderLeft: "4px solid #ec4899",
    paddingLeft: 12,
    marginBottom: 20,
  },

  text: {
    lineHeight: 1.6,
    color: "#333",
  },

  about: {
    padding: 40,
    maxWidth: 900,
  },

  aboutGrid: {
    display: "flex",
    gap: 30,
  },

  jobs: {
    backgroundColor: "#000",
    padding: 40,
    textAlign: "center",
  },

  jobsTitle: {
    color: "#fff",
    marginBottom: 30,
  },

  cards: {
    display: "flex",
    justifyContent: "center",
    gap: 30,
  },

  card: {
    width: 220,
    border: "2px solid #3b82f6",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#000",
    textAlign: "center",
  },

  cardImage: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    borderRadius: "50%",
  },

  cardLabel: {
    display: "inline-block",
    marginTop: 10,
    backgroundColor: "#fff",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
  },

  buttonArea: {
    padding: 40,
    textAlign: "center",
  },

  button: {
    backgroundColor: "#ec4899",
    border: "none",
    padding: "12px 32px",
    color: "#fff",
    borderRadius: 30,
    cursor: "pointer",
  },

  footer: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "30px 40px",
    display: "flex",
    justifyContent: "space-between",
  },

  footerLeft: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  circle: {
    width: 36,
    height: 36,
    borderRadius: "50%",
  },

  footerCenter: {
    fontSize: 12,
  },

  footerRight: {
    fontSize: 12,
    textAlign: "right",
  },
};