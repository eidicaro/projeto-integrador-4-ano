import React from "react";
import dotsleft from "../assets/dots-left.png";
import dotsright from "../assets/dots-right.png";
import play from "../assets/playzao.svg";

export default function Home() {
  return (
    <div style={styles.page}>
      {/* ================= HEADER ================= */}
      <header style={styles.header}>
        <div style={styles.logo}>point</div>

        <div style={styles.hamburger}>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.title}>Banco de Talentos</h1>

          <p style={styles.text}>
            Um banco de talentos é um espaço criado para reunir e organizar
            informações de profissionais interessados em fazer parte de uma
            empresa, mesmo quando não há uma vaga específica aberta no momento.
          </p>

          <h2 style={styles.subtitle}>Quem Somos?</h2>

          <p style={styles.text}>
            Um banco de talentos é um espaço criado para reunir e organizar
            informações de profissionais interessados em fazer parte de uma
            empresa, mesmo quando não há uma vaga específica aberta no momento.
          </p>
        </div>

        <div style={styles.heroVisual}>
          <img src={play} alt="Play" style={styles.play} />
          <img src={dotsleft} alt="Bolinhas" style={styles.dots-left} />
          <img src={dotsright} alt="Bolinhas" style={styles.dots-right} />
        </div>
      </section>

      {/* ================= VAGAS ================= */}
      <section style={styles.vagas}>
        <h2 style={styles.vagasTitle}>Vagas Disponíveis</h2>

        <div style={styles.cards}>
          {[1, 2, 3].map((item) => (
            <div key={item} style={styles.card}>
              <div style={styles.cardImage}></div>
              <span style={styles.cardText}>DESENVOLVEDOR DEV</span>
            </div>
          ))}
        </div>

        {/* BOTÃO COM BORDA DUPLA */}
        <div style={styles.buttonWrapper}>
          <div style={styles.buttonContainer}>
            <div style={styles.buttonBack}></div>

            <button style={styles.buttonFront}>
              Todas as Vagas
            </button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <div style={styles.footerPlay}>▶</div>
        </div>

        <div style={styles.footerCenter}>
          <p>Páginas</p>
          <span>Meu Perfil</span>
          <span>Vagas</span>
          <span>Meu Portfólio</span>
        </div>

        <div style={styles.footerRight}>
          <div style={styles.social}></div>
          <div style={styles.social}></div>
          <div style={styles.social}></div>
        </div>
      </footer>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
    color: "#000",
  },

  header: {
    height: "70px",
    padding: "0 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #ddd",
  },

  logo: {
    fontWeight: "bold",
    fontSize: "20px",
    color: "#000",
  },

  hamburger: {
    width: "30px",
    height: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    cursor: "pointer",
  },

  hamburgerLine: {
    height: "3px",
    backgroundColor: "#000",
    borderRadius: "2px",
  },

  hero: {
    display: "flex",
    padding: "60px 40px",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroText: {
    width: "50%",
  },

  title: {
    fontSize: "32px",
    marginBottom: "20px",
  },

  subtitle: {
    fontSize: "22px",
    marginTop: "30px",
    marginBottom: "10px",
  },

  text: {
    fontSize: "14px",
    lineHeight: "1.6",
  },

  heroVisual: {
    position: "relative",
    width: "40%",
    display: "flex",
    justifyContent: "center",
  },

  play: {
    width: "200px",
    zIndex: 2,
  },

  bolinhas: {
    position: "absolute",
    right: "-40px",
    bottom: "-40px",
    width: "120px",
  },

  vagas: {
    backgroundColor: "#000",
    padding: "60px 40px",
    color: "#fff",
    textAlign: "center",
  },

  vagasTitle: {
    fontSize: "24px",
    marginBottom: "40px",
  },

  cards: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
  },

  card: {
    width: "200px",
    backgroundColor: "#111",
    borderRadius: "20px",
    overflow: "hidden",
  },

  cardImage: {
    height: "180px",
    backgroundColor: "#333",
  },

  cardText: {
    display: "block",
    padding: "15px",
    fontSize: "13px",
  },

  buttonWrapper: {
    marginTop: "40px",
    display: "flex",
    justifyContent: "center",
  },

  buttonContainer: {
    position: "relative",
    width: "200px",
    height: "50px",
  },

  buttonBack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "30px",
    border: "2px solid #5dade2",
    top: "6px",
    left: "-18px",
  },

  buttonFront: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "30px",
    border: "none",
    backgroundColor: "#e85c8b",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },

  footer: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "40px",
    display: "flex",
    justifyContent: "space-between",
  },

  footerLeft: {
    display: "flex",
    alignItems: "center",
  },

  footerPlay: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#e85c8b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  footerCenter: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
  },

  footerRight: {
    display: "flex",
    gap: "10px",
  },

  social: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#444",
  },
};