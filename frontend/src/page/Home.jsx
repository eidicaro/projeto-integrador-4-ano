import React, { useState } from "react";
import { motion } from "framer-motion";

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

  const fadeUp = {
    hidden: {
      opacity: 0,
      y: 60,
    },

    visible: {
      opacity: 1,
      y: 0,

      transition: {
        duration: 0.8,
      },
    },
  };

  const fadeLeft = {
    hidden: {
      opacity: 0,
      x: -80,
    },

    visible: {
      opacity: 1,
      x: 0,

      transition: {
        duration: 0.8,
      },
    },
  };

  const fadeRight = {
    hidden: {
      opacity: 0,
      x: 80,
    },

    visible: {
      opacity: 1,
      x: 0,

      transition: {
        duration: 0.8,
      },
    },
  };

  return (
    <div style={styles.page}>
      <style>{hoverStyles}</style>

      {/* BLURS */}
      <div style={styles.blurPink}></div>
      <div style={styles.blurBlue}></div>

      {/* GRID */}
      <div style={styles.grid}></div>

     {/* SIDEBAR */}
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

  <div style={styles.sidebarProfile}>
    <div style={styles.profileAvatar}>
      P
    </div>

    <h3 style={styles.profileName}>
      Point Talentos
    </h3>

    <p style={styles.profileText}>
      Plataforma de recrutamento
    </p>
  </div>

  <div style={styles.sidebarLinks}>
  <a
  href="#"
  className="sidebar-link"
  style={styles.sidebarLink}
  >🏠 Home</a>

    <a
  href="#"
  className="sidebar-link"
  style={styles.sidebarLink}
  >💼 Vagas </a>

    <a
  href="#"
  className="sidebar-link"
  style={styles.sidebarLink}
  >👤 Perfil</a>

    <a
  href="#"
  className="sidebar-link"
  style={styles.sidebarLink}
  >📁 Portfólio</a>
  </div>

  <div style={styles.sidebarDivider}></div>

  <button
  className="admin-btn"
  style={styles.adminButton}>
    ⚙ Painel Admin</button>

  <div style={styles.sidebarFooter}>
    © Point 2026
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
          className="menu-btn"
          style={styles.menuButton}
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
      </header>

      {/* HERO */}
      <section style={styles.hero}>
        <motion.div
          style={styles.heroLeft}
          variants={fadeLeft}
          initial="hidden"
          animate="visible"
        >
          <h1 style={styles.heroTitle}>
            Conectando
            <span style={styles.gradient}>
              {" "}
              talentos
            </span>
            <br />
            às melhores oportunidades
          </h1>

          <p style={styles.heroText}>
            Descubra vagas incríveis, conecte-se
            com empresas e mostre seu potencial em
            uma plataforma moderna feita para o
            futuro.
          </p>

          <div style={styles.heroButtons}>
            <button
              className="primary-btn"
              style={styles.primaryButton}
            >
              Explorar Vagas
            </button>

            <button
              className="secondary-btn"
              style={styles.secondaryButton}
            >
              Criar Perfil
            </button>
          </div>
        </motion.div>

        <motion.div
          style={styles.heroRight}
          variants={fadeRight}
          initial="hidden"
          animate="visible"
        >
          <div
            className="hero-image-card"
            style={styles.heroImageCard}
          >
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop"
              alt="team"
              style={styles.heroImage}
            />
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <motion.section
        style={styles.stats}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div style={styles.statsGrid}>
          <div
            className="stat-card"
            style={styles.statCard}
          >
            <h2 style={styles.statNumber}>+1200</h2>
            <p style={styles.statText}>Talentos</p>
          </div>

          <div
            className="stat-card"
            style={styles.statCard}
          >
            <h2 style={styles.statNumber}>+300</h2>
            <p style={styles.statText}>Empresas</p>
          </div>

          <div
            className="stat-card"
            style={styles.statCard}
          >
            <h2 style={styles.statNumber}>+850</h2>
            <p style={styles.statText}>Vagas</p>
          </div>
        </div>
      </motion.section>

      {/* JOBS */}
      <motion.section
        style={styles.jobsSection}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Vagas em destaque
          </h2>

          <p style={styles.sectionText}>
            Encontre oportunidades alinhadas ao seu
            perfil.
          </p>
        </div>

        <div style={styles.jobsGrid}>
          {jobs.map((job, index) => (
            <motion.div
              key={index}
              className="job-card"
              style={styles.jobCard}
              initial={{
                opacity: 0,
                y: 50,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
              }}
              viewport={{ once: true }}
            >
              <div style={styles.imageWrapper}>
                <img
                  src={job.image}
                  alt={job.title}
                  className="job-image"
                  style={styles.jobImage}
                />

                <div
                  style={styles.jobOverlay}
                  className="job-overlay"
                ></div>
              </div>

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
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        style={styles.ctaSection}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>
            Pronto para sua próxima oportunidade?
          </h2>

          <p style={styles.ctaText}>
            Crie seu perfil e comece agora mesmo.
          </p>

          <button
            className="primary-btn"
            style={styles.primaryButton}
          >
            Começar agora
          </button>
        </div>
      </motion.section>

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

        <p style={styles.footerCopy}>
          © 2026 Point. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

const hoverStyles = `
  .job-card:hover {
    transform: translateY(-14px) scale(1.02);
    border: 1px solid rgba(255,255,255,.18);

    box-shadow:
      0 25px 60px rgba(0,0,0,.45),
      0 0 30px rgba(77,166,255,.15);
  }

  .job-card:hover .job-image {
    transform: scale(1.12);
  }

  .job-card:hover .job-overlay {
    opacity: 1;
  }

  .primary-btn:hover {
    transform: translateY(-5px) scale(1.03);

    box-shadow:
      0 15px 40px rgba(255,79,163,.45),
      0 0 25px rgba(255,79,163,.35);
  }

  .secondary-btn:hover {
    background: rgba(255,255,255,.12);
    transform: translateY(-4px);
    border: 1px solid rgba(255,255,255,.18);
  }

  .stat-card:hover {
    transform: translateY(-10px);

    border: 1px solid rgba(255,255,255,.18);

    box-shadow:
      0 20px 40px rgba(0,0,0,.3),
      0 0 25px rgba(77,166,255,.12);
  }

  .menu-btn:hover {
    transform: rotate(90deg) scale(1.05);
    background: rgba(255,255,255,.12);
  }

  .hero-image-card {
    animation: floating 5s ease-in-out infinite;
  }

  @keyframes floating {
    0% {
      transform: translateY(0px);
    }

    50% {
      transform: translateY(-15px);
    }

    100% {
      transform: translateY(0px);
    }
  }
 .sidebar-link:hover {
  background: rgba(255,255,255,.1);
}

.admin-btn:hover {
  transform: translateY(-3px);

  box-shadow:
    0 15px 40px rgba(255,79,163,.5);
}
`;

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#050816,#0f172a)",
    fontFamily: "Arial",
    color: "#fff",
    overflowX: "hidden",
    position: "relative",
  },

  grid: {
    position: "absolute",
    inset: 0,

    backgroundImage:
      "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",

    backgroundSize: "50px 50px",

    maskImage:
      "radial-gradient(circle at center, black, transparent 80%)",

    pointerEvents: "none",
  },

  blurPink: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "#ff4fa3",
    filter: "blur(160px)",
    opacity: 0.25,
    top: "-100px",
    left: "-100px",
  },

  blurBlue: {
    position: "absolute",
    width: "350px",
    height: "350px",
    background: "#4da6ff",
    filter: "blur(160px)",
    opacity: 0.25,
    bottom: "0",
    right: "-100px",
  },

  header: {
    width: "100%",
    height: "90px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 clamp(20px,6vw,100px)",
    position: "sticky",
    top: 0,
    zIndex: 99,
    backdropFilter: "blur(12px)",
  },

  logo: {
    fontSize: "clamp(1.8rem,4vw,2.4rem)",
    fontWeight: "bold",
  },

  menuButton: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.05)",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    transition: ".4s",
  },

  hero: {
    minHeight: "90vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "80px",
    padding:
      "40px clamp(20px,6vw,100px) 100px",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 2,
  },

  heroLeft: {
    flex: 1,
    minWidth: "300px",
    zIndex: 2,
  },

  heroTitle: {
    fontSize: "clamp(3rem,8vw,6rem)",
    lineHeight: 1.05,
    marginBottom: "30px",
    fontWeight: "bold",
  },

  gradient: {
    background:
      "linear-gradient(90deg,#ff4fa3,#4da6ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  heroText: {
    fontSize: "clamp(1rem,2vw,1.25rem)",
    lineHeight: 1.9,
    color: "#cbd5e1",
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
    padding: "1rem 2rem",
    borderRadius: "18px",
    background:
      "linear-gradient(90deg,#ff4fa3,#ff6ab3)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    transition: ".3s",

    boxShadow:
      "0 10px 30px rgba(255,79,163,.35)",
  },

  secondaryButton: {
    border: "1px solid rgba(255,255,255,.12)",
    padding: "1rem 2rem",
    borderRadius: "18px",
    background: "rgba(255,255,255,.05)",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    transition: ".3s",
  },

  heroRight: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    minWidth: "300px",
  },

  heroImageCard: {
    width: "100%",
    maxWidth: "550px",
    height: "clamp(320px,45vw,520px)",
    borderRadius: "32px",
    overflow: "hidden",
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.08)",
    backdropFilter: "blur(20px)",

    boxShadow:
      "0 20px 60px rgba(0,0,0,.5)",

    position: "relative",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  stats: {
    padding:
      "0 clamp(20px,6vw,100px) 120px",
    position: "relative",
    zIndex: 2,
  },

  statsGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",

    gap: "24px",
  },

  statCard: {
    padding: "40px",
    borderRadius: "28px",

    background: "rgba(255,255,255,.05)",

    border: "1px solid rgba(255,255,255,.08)",

    textAlign: "center",

    backdropFilter: "blur(12px)",

    transition: ".3s",
  },

  statNumber: {
    fontSize: "clamp(2.5rem,6vw,4rem)",
    marginBottom: "10px",
  },

  statText: {
    color: "#cbd5e1",
    fontSize: "1.1rem",
  },

  jobsSection: {
    padding:
      "0 clamp(20px,6vw,100px) 120px",

    position: "relative",
    zIndex: 2,
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "70px",
  },

  sectionTitle: {
    fontSize: "clamp(2.5rem,6vw,4.5rem)",
    marginBottom: "20px",
  },

  sectionText: {
    color: "#cbd5e1",
    fontSize: "1.1rem",
  },

  jobsGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",

    gap: "30px",
  },

  jobCard: {
    background: "rgba(255,255,255,.05)",

    border: "1px solid rgba(255,255,255,.08)",

    borderRadius: "28px",

    overflow: "hidden",

    backdropFilter: "blur(10px)",

    transition: ".35s",

    cursor: "pointer",
  },

  imageWrapper: {
    overflow: "hidden",
    position: "relative",
  },

  jobImage: {
    width: "100%",
    height: "240px",
    objectFit: "cover",
    transition: ".5s",
  },

  jobOverlay: {
    position: "absolute",
    inset: 0,

    background:
      "linear-gradient(to top, rgba(5,8,22,.95), transparent)",

    opacity: 0,
    transition: ".4s",
  },

  jobContent: {
    padding: "30px",
  },

  jobTag: {
    width: "fit-content",

    padding: "8px 16px",

    borderRadius: "999px",

    background: "rgba(77,166,255,.12)",

    color: "#4da6ff",

    marginBottom: "20px",

    fontSize: "14px",
  },

  jobTitle: {
    fontSize: "1.8rem",
    marginBottom: "10px",
  },

  jobCompany: {
    color: "#cbd5e1",
    marginBottom: "30px",
  },

  jobButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "none",

    background:
      "linear-gradient(90deg,#ff4fa3,#ff6ab3)",

    color: "#fff",

    fontWeight: "bold",

    cursor: "pointer",

    transition: ".3s",
  },

  ctaSection: {
    padding:
      "0 clamp(20px,6vw,100px) 120px",

    position: "relative",
    zIndex: 2,
  },

  ctaCard: {
    padding: "clamp(40px,8vw,90px)",

    borderRadius: "40px",

    background: "rgba(255,255,255,.05)",

    border: "1px solid rgba(255,255,255,.08)",

    backdropFilter: "blur(14px)",

    textAlign: "center",
  },

  ctaTitle: {
    fontSize: "clamp(2.5rem,6vw,4.5rem)",
    marginBottom: "20px",
  },

  ctaText: {
    color: "#cbd5e1",
    fontSize: "1.1rem",
    marginBottom: "40px",
  },

  footer: {
    borderTop:
      "1px solid rgba(255,255,255,.08)",

    padding:
      "40px clamp(20px,6vw,100px)",

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    flexWrap: "wrap",

    gap: "30px",

    position: "relative",
    zIndex: 2,
  },

  footerLogo: {
    fontSize: "2rem",
    fontWeight: "bold",
  },

  footerLinks: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },

  footerLink: {
    color: "#cbd5e1",
    textDecoration: "none",
  },

  footerCopy: {
    color: "#64748b",
  },

  sidebar: {
    position: "fixed",
    top: 0,
    right: 0,
    

    width: "360px",
    height: "100vh",

    background: "rgba(2,6,23,.95)",

    borderLeft:
      "1px solid rgba(255,255,255,.08)",

    backdropFilter: "blur(20px)",

    zIndex: 999,

    transition: ".4s",

    padding: "30px",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "32px",
    cursor: "pointer",
    marginBottom: "70px",
  },

  sidebarLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  sidebarLink: {
    color: "#fff",
  
    textDecoration: "none",
  
    fontSize: "1rem",
  
    fontWeight: "600",
  
    padding: "14px 18px",
  
    borderRadius: "14px",
  
    background: "rgba(255,255,255,.04)",
  
    transition: ".3s",
  },
  sidebarProfile: {
    textAlign: "center",
    marginBottom: "40px",
  },
  
  profileAvatar: {
    width: "90px",
    height: "90px",
  
    margin: "0 auto 16px",
  
    borderRadius: "50%",
  
    background:
      "linear-gradient(135deg,#ff4fa3,#4da6ff)",
  
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  
    fontSize: "2rem",
    fontWeight: "bold",
  
    boxShadow:
      "0 0 30px rgba(255,79,163,.4)",
  },
  
  profileName: {
    fontSize: "1.3rem",
    marginBottom: "6px",
  },
  
  profileText: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  
  sidebarDivider: {
    height: "1px",
  
    background:
      "rgba(255,255,255,.08)",
  
    margin: "30px 0",
  },
  
  adminButton: {
    width: "100%",
  
    padding: "16px",
  
    borderRadius: "16px",
  
    border: "none",
  
    cursor: "pointer",
  
    fontWeight: "bold",
  
    color: "#fff",
  
    background:
      "linear-gradient(90deg,#ff4fa3,#ff6ab3)",
  
    transition: ".3s",
  
    boxShadow:
      "0 10px 30px rgba(255,79,163,.35)",
  },
  
  sidebarFooter: {
    position: "absolute",
  
    bottom: "30px",
  
    left: 0,
    right: 0,
  
    textAlign: "center",
  
    color: "#64748b",
  
    fontSize: "13px",
  },
};