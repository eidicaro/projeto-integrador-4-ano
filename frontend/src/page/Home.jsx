import { useState } from "react";
import logo from "../assets/logo.svg";
import dotsLeft from "../assets/dots-left.png";
import dotsRight from "../assets/dots-right.png";
import play from "../assets/playzao.svg";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={styles.page}>
      {/* ================= HEADER ================= */}
      <header style={styles.header}>
        <img src={logo} alt="Point Midia" style={styles.logo} />

        <div
          style={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
        </div>

        {menuOpen && (
          <nav style={styles.menu}>
            <a style={styles.menuItem}>Home</a>
            <a style={styles.menuItem}>Vagas</a>
            <a style={styles.menuItem}>Perfil</a>
            <a style={styles.menuItem}>Login</a>
          </nav>
        )}
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

          <div style={styles.quemSomos}>
            <div style={styles.bar}></div>
            <p style={styles.text}>
              Um banco de talentos é um espaço criado para reunir e organizar
              informações de profissionais interessados em fazer parte de uma
              empresa, mesmo quando não há uma vaga específica aberta no momento.
            </p>
          </div>
        </div>

        <div style={styles.heroVisual}>
          <img src={play} alt="Play" style={styles.play} />

          <img
            src={dotsLeft}
            alt=""
            style={{ ...styles.dots, left: "-40px", bottom: "40px" }}
          />
          <img
            src={dotsRight}
            alt=""
            style={{ ...styles.dots, right: "-30px", top: "120px" }}
          />
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

        <div style={styles.buttonWrapper}>
          <div style={styles.buttonContainer}>
            <div style={styles.buttonBack}></div>
            <button style={styles.buttonFront}>Todas as Vagas</button>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <div style={styles.footerPlay}>▶</div>
        </div>

        <div style={styles.footerCenter}>
          <strong>Páginas</strong>
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
  },

  /* HEADER */
  header: {
    height: 70,
    padding: "0 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    borderBottom: "1px solid #ddd",
  },

  logo: {
    height: 28,
  },

  hamburger: {
    width: 30,
    height: 22,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    cursor: "pointer",
  },

  hamburgerLine: {
    height: 3,
    backgroundColor: "#000",
    borderRadius: 2,
  },

  menu: {
    position: "absolute",
    top: 70,
    right: 40,
    backgroundColor: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    borderRadius: 10,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    zIndex: 10,
  },

  menuItem: {
    cursor: "pointer",
    fontSize: 14,
  },

  /* HERO */
  hero: {
    display: "flex",
    padding: "60px 40px",
    alignItems: "flex-start",
    gap: 40,
  },

  heroText: {
    width: "45%",
  },

  title: {
    fontSize: 32,
    marginBottom: 20,
  },

  subtitle: {
    marginTop: 30,
    marginBottom: 10,
    fontSize: 20,
  },

  text: {
    fontSize: 14,
    lineHeight: 1.6,
  },

  quemSomos: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  bar: {
    width: 3,
    height: 60,
    backgroundColor: "#000",
    marginTop: 5,
  },

  heroVisual: {
    width: "55%",
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },

  play: {
    width: 220,
    zIndex: 2,
  },

  dots: {
    position: "absolute",
    width: 110,
    pointerEvents: "none",
  },

  /* VAGAS */
  vagas: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "60px 40px",
    textAlign: "center",
  },

  vagasTitle: {
    fontSize: 22,
    marginBottom: 40,
  },

  cards: {
    display: "flex",
    justifyContent: "center",
    gap: 30,
  },

  card: {
    width: 200,
    backgroundColor: "#111",
    borderRadius: 20,
    overflow: "hidden",
  },

  cardImage: {
    height: 180,
    backgroundColor: "#333",
  },

  cardText: {
    padding: 15,
    fontSize: 12,
  },

  /* BOTÃO */
  buttonWrapper: {
    marginTop: 40,
    display: "flex",
    justifyContent: "center",
  },

  buttonContainer: {
    position: "relative",
    width: 200,
    height: 50,
  },

  buttonBack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 30,
    border: "2px solid #5dade2",
    top: 6,
    left: -18,
  },

  buttonFront: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: 30,
    border: "none",
    backgroundColor: "#e85c8b",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  /* FOOTER */
  footer: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 40,
    display: "flex",
    justifyContent: "space-between",
  },

  footerLeft: {
    display: "flex",
    alignItems: "center",
  },

  footerPlay: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "#e85c8b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  footerCenter: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
  },

  footerRight: {
    display: "flex",
    gap: 10,
  },

  social: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    backgroundColor: "#444",
  },
};