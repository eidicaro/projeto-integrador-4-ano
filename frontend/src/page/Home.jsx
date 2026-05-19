import React, { useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const jobs = [
    {
      title: "Frontend Developer",
      company: "Point Tech",
      type: "Remoto",
      image:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: "UI/UX Designer",
      company: "Creative Studio",
      type: "Híbrido",
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: "Backend Developer",
      company: "Cloud System",
      type: "Presencial",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <div style={styles.page}>
      {/* BACKGROUND GLOW */}
      <div style={styles.blurOne}></div>
      <div style={styles.blurTwo}></div>

      {/* MENU */}
      <div
        style={{
          ...styles.sidebar,
          transform: menuOpen
            ? "translateX(0)"
            : "translateX(100%)",
        }}
      >
        <button
          style={styles.closeButton}
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>

        <div style={styles.sidebarLinks}>
          <a href="#" style={styles.sidebarLink}>
            Home
          </a>

          <a href="#" style={styles.sidebarLink}>
            Vagas
          </a>

          <a href="#" style={styles.sidebarLink}>
            Meu Perfil
          </a>

          <a href="#" style={styles.sidebarLink}>
            Portfólio
          </a>
        </div>
      </div>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ color: "#ff4fa3" }}>p</span>
          <span style={{ color: "#4da6ff" }}>o</span>
          int
        </div>

        <button
          style={styles.menuButton}
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.badge}>
            Plataforma de Talentos
          </span>

          <h1 style={styles.heroTitle}>
            Conectando
            <span style={styles.gradientText}>
              {" "}
              talentos
            </span>
            <br />
            às melhores oportunidades
          </h1>

          <p style={styles.heroText}>
            Descubra vagas incríveis, conecte-se com
            empresas e mostre seu potencial em uma
            plataforma moderna feita para o futuro.
          </p>

          <div style={styles.heroButtons}>
            <button style={styles.primaryButton}>
              Explorar Vagas
            </button>

            <button style={styles.secondaryButton}>
              Criar Perfil
            </button>
          </div>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.heroCard}>
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop"
              alt="team"
              style={styles.heroImage}
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h2 style={styles.statNumber}>+1200</h2>
            <p style={styles.statText}>Talentos</p>
          </div>

          <div style={styles.statCard}>
            <h2 style={styles.statNumber}>+300</h2>
            <p style={styles.statText}>Empresas</p>
          </div>

          <div style={styles.statCard}>
            <h2 style={styles.statNumber}>+850</h2>
            <p style={styles.statText}>Vagas</p>
          </div>
        </div>
      </section>

      {/* VAGAS */}
      <section style={styles.jobsSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Vagas em destaque
          </h2>

          <p style={styles.sectionSubtitle}>
            Encontre oportunidades alinhadas ao seu perfil
          </p>
        </div>

        <div style={styles.jobsGrid}>
          {jobs.map((job, index) => (
            <div key={index} style={styles.jobCard}>
              <img
                src={job.image}
                alt={job.title}
                style={styles.jobImage}
              />

              <div style={styles.jobContent}>
                <div style={styles.jobTag}>
                  {job.type}
                </div>

                <h3 style={styles.jobTitle}>
                  {job.title}
                </h3>

                <p style={styles.jobCompany}>
                  {job.company}
                </p>

                <button style={styles.jobButton}>
                  Ver vaga
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>
            Pronto para sua próxima oportunidade?
          </h2>

          <p style={styles.ctaText}>
            Crie seu perfil e comece agora mesmo.
          </p>

          <button style={styles.primaryButton}>
            Começar Agora
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>
          <span style={{ color: "#ff4fa3" }}>p</span>
          <span style={{ color: "#4da6ff" }}>o</span>
          int
        </div>

        <div style={styles.footerLinks}>
          <a href="#" style={styles.footerLink}>
            Home
          </a>

          <a href="#" style={styles.footerLink}>
            Vagas
          </a>

          <a href="#" style={styles.footerLink}>
            Contato
          </a>
        </div>

        <p style={styles.copy}>
          © 2026 Point. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    background:
      "linear-gradient(135deg,#050816,#0f172a)",
    minHeight: "100vh",
    fontFamily: "Arial",
    color: "#fff",
    overflowX: "hidden",
    position: "relative",
  },

  blurOne: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "#ff4fa3",
    filter: "blur(180px)",
    opacity: 0.2,
    top: "-100px",
    left: "-100px",
  },

  blurTwo: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "#4da6ff",
    filter: "blur(180px)",
    opacity: 0.2,
    bottom: "0",
    right: "-100px",
  },

  /* HEADER */

  header: {
    width: "100%",
    height: "90px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 7%",
    backdropFilter: "blur(10px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },

  logo: {
    fontSize: "32px",
    fontWeight: "bold",
    zIndex: 5,
  },

  menuButton: {
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "24px",
    backdropFilter: "blur(10px)",
  },

  /* HERO */

  hero: {
    minHeight: "90vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 7%",
    gap: "60px",
    flexWrap: "wrap",
  },

  heroLeft: {
    flex: 1,
    minWidth: "320px",
    zIndex: 2,
  },

  badge: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    padding: "10px 18px",
    borderRadius: "30px",
    fontSize: "14px",
    display: "inline-block",
    marginBottom: "30px",
    backdropFilter: "blur(10px)",
  },

  heroTitle: {
    fontSize: "72px",
    lineHeight: 1.1,
    marginBottom: "30px",
    fontWeight: "bold",
  },

  gradientText: {
    background:
      "linear-gradient(90deg,#ff4fa3,#4da6ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  heroText: {
    fontSize: "20px",
    color: "#cbd5e1",
    lineHeight: 1.8,
    maxWidth: "650px",
    marginBottom: "40px",
  },

  heroButtons: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },

  primaryButton: {
    border: "none",
    background:
      "linear-gradient(90deg,#ff4fa3,#ff6ab3)",
    color: "#fff",
    padding: "18px 34px",
    borderRadius: "18px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(255,79,163,.4)",
  },

  secondaryButton: {
    border: "1px solid rgba(255,255,255,.2)",
    background: "rgba(255,255,255,.05)",
    color: "#fff",
    padding: "18px 34px",
    borderRadius: "18px",
    fontSize: "16px",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
  },

  heroRight: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    minWidth: "320px",
  },

  heroCard: {
    width: "100%",
    maxWidth: "550px",
    height: "500px",
    borderRadius: "30px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.05)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 60px rgba(0,0,0,.5)",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  /* STATS */

  statsSection: {
    padding: "40px 7% 120px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "30px",
  },

  statCard: {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    padding: "40px",
    borderRadius: "28px",
    textAlign: "center",
    backdropFilter: "blur(12px)",
  },

  statNumber: {
    fontSize: "48px",
    marginBottom: "10px",
  },

  statText: {
    color: "#cbd5e1",
    fontSize: "18px",
  },

  /* JOBS */

  jobsSection: {
    padding: "0 7% 120px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "70px",
  },

  sectionTitle: {
    fontSize: "52px",
    marginBottom: "20px",
  },

  sectionSubtitle: {
    color: "#cbd5e1",
    fontSize: "18px",
  },

  jobsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
    gap: "30px",
  },

  jobCard: {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: "28px",
    overflow: "hidden",
    backdropFilter: "blur(10px)",
    transition: ".3s",
  },

  jobImage: {
    width: "100%",
    height: "240px",
    objectFit: "cover",
  },

  jobContent: {
    padding: "30px",
  },

  jobTag: {
    background: "rgba(77,166,255,.15)",
    color: "#4da6ff",
    width: "fit-content",
    padding: "8px 16px",
    borderRadius: "20px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  jobTitle: {
    fontSize: "28px",
    marginBottom: "10px",
  },

  jobCompany: {
    color: "#cbd5e1",
    marginBottom: "30px",
  },

  jobButton: {
    width: "100%",
    border: "none",
    background:
      "linear-gradient(90deg,#ff4fa3,#ff6ab3)",
    color: "#fff",
    padding: "16px",
    borderRadius: "16px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  /* CTA */

  ctaSection: {
    padding: "0 7% 120px",
  },

  ctaCard: {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: "40px",
    padding: "80px 40px",
    textAlign: "center",
    backdropFilter: "blur(14px)",
  },

  ctaTitle: {
    fontSize: "54px",
    marginBottom: "20px",
  },

  ctaText: {
    color: "#cbd5e1",
    fontSize: "20px",
    marginBottom: "40px",
  },

  /* FOOTER */

  footer: {
    borderTop: "1px solid rgba(255,255,255,.08)",
    padding: "40px 7%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "30px",
  },

  footerLogo: {
    fontSize: "28px",
    fontWeight: "bold",
  },

  footerLinks: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap",
  },

  footerLink: {
    color: "#cbd5e1",
    textDecoration: "none",
  },

  copy: {
    color: "#64748b",
  },

  /* SIDEBAR */

  sidebar: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "300px",
    height: "100vh",
    background: "#020617",
    borderLeft: "1px solid rgba(255,255,255,.08)",
    zIndex: 999,
    transition: ".4s",
    padding: "30px",
    backdropFilter: "blur(20px)",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "32px",
    cursor: "pointer",
    marginBottom: "60px",
  },

  sidebarLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  sidebarLink: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "20px",
    fontWeight: "bold",
  },
};