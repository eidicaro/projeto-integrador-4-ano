import { useState } from "react";
import logo from "../assets/logo.svg";
import dotsLeft from "../assets/dots-left.png";
import dotsRight from "../assets/dots-right.png";
import play from "../assets/playzao.svg";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <img src={logo} alt="Point Midia" style={styles.logo} />

        <div style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
          <span style={styles.hLine} />
          <span style={styles.hLine} />
          <span style={styles.hLine} />
        </div>

        {menuOpen && (
          <nav style={styles.menu}>
            {["Home", "Vagas", "Perfil", "Login"].map((item) => (
              <span key={item} style={styles.menuItem}>{item}</span>
            ))}
          </nav>
        )}
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroText}>
          <h1 style={styles.title}>Banco de Talentos</h1>

          <p style={styles.text}>
            Um banco de talentos é um espaço criado para reunir e organizar
            informações de profissionais interessados em fazer parte de uma
            empresa.
          </p>

          <h2 style={styles.subtitle}>Quem Somos?</h2>

          <div style={styles.quemSomos}>
            <div style={styles.bar} />
            <p style={styles.text}>
              Um banco de talentos reúne profissionais mesmo quando não há uma
              vaga específica aberta.
            </p>
          </div>
        </div>

        <div style={styles.heroVisual}>
          <img src={play} alt="Play" style={styles.play} />
          <img src={dotsLeft} alt="" style={{ ...styles.dots, left: 0, bottom: 20 }} />
          <img src={dotsRight} alt="" style={{ ...styles.dots, right: 0, top: 80 }} />
        </div>
      </section>

      {/* VAGAS */}
      <section style={styles.vagas}>
        <h2 style={styles.vagasTitle}>Vagas Disponíveis</h2>

        <div style={styles.cards}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={styles.card}>
              <div style={styles.cardImg} />
              <span style={styles.cardText}>DESENVOLVEDOR DEV</span>
            </div>
          ))}
        </div>

        <button style={styles.cta}>Todas as Vagas</button>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerPlay}>▶</div>

        <div style={styles.footerCenter}>
          <strong>Páginas</strong>
          <span>Meu Perfil</span>
          <span>Vagas</span>
          <span>Meu Portfólio</span>
        </div>

        <div style={styles.footerRight}>
          <div style={styles.social} />
          <div style={styles.social} />
          <div style={styles.social} />
        </div>
      </footer>
    </div>
  );
}

/* ===================== STYLES ===================== */

const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
  },

  header: {
    height: 70,
    padding: "0 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    borderBottom: "1px solid #ddd",
  },

  logo: { height: 28 },

  hamburger: {
    width: 30,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    cursor: "pointer",
  },

  hLine: {
    height: 3,
    backgroundColor: "#000",
    borderRadius: 2,
  },

  menu: {
    position: "absolute",
    top: 70,
    right: 40,
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxShadow: "0 10px 30px rgba(0,0,0,.15)",
    zIndex: 10,
  },

  menuItem: {
    cursor: "pointer",
    fontSize: 14,
  },

  hero: {
    display: "flex",
    alignItems: "center",
    padding: "80px 40px",
  },

  heroText: { width: "45%" },

  heroVisual: {
    width: "55%",
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },

  title: { fontSize: 32, marginBottom: 20 },

  subtitle: { marginTop: 30, fontSize: 20 },

  text: { fontSize: 14, lineHeight: 1.6 },

  quemSomos: {
    display: "flex",
    gap: 12,
    marginTop: 10,
  },

  bar: {
    width: 3,
    backgroundColor: "#000",
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

  cardImg: {
    height: 180,
    backgroundColor: "#333",
  },

  cardText: {
    padding: 15,
    fontSize: 12,
  },

  cta: {
    marginTop: 40,
    padding: "14px 40px",
    borderRadius: 30,
    border: "none",
    backgroundColor: "#e85c8b",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  footer: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 40,
    display: "flex",
    justifyContent: "space-between",
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