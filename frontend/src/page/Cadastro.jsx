import { useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/cadastro.png";
import bgVideo from "../assets/bg.mp4";

export default function Cadastro() {

  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  function handleCadastro(e) {
    e.preventDefault();

    alert("Cadastro realizado!");
  }

  return (
    <>
      {/* ANIMAÇÕES + RESPONSIVIDADE */}
      <style>
        {`
          @keyframes float {
            0% {
              transform: translateY(0px);
            }

            50% {
              transform: translateY(-8px);
            }

            100% {
              transform: translateY(0px);
            }
          }

          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          /* 📱 RESPONSIVIDADE */
          @media (max-width: 768px) {

            .register-box {
              width: 90% !important;
              padding: 28px !important;
            }

            .register-input {
              width: 100% !important;
              font-size: 14px !important;
              padding: 16px !important;
            }

            .register-logo {
              width: 170px !important;
            }

            .register-button-container {
              width: 100% !important;
            }

            .login-button-top {
              top: 18px !important;
              right: 18px !important;

              padding: 10px 18px !important;

              font-size: 13px !important;
            }
          }

          @media (max-width: 480px) {

            .register-box {
              padding: 22px !important;
              border-radius: 24px !important;
            }

            .register-logo {
              width: 145px !important;
              margin-bottom: 18px !important;
            }

            .register-input {
              padding: 15px !important;
              border-radius: 10px !important;
            }

            .register-button-front {
              font-size: 14px !important;
            }
          }
        `}
      </style>

      <div style={styles.container}>

        {/* 🎥 VIDEO */}
        <video autoPlay loop muted playsInline style={styles.video}>
          <source src={bgVideo} type="video/mp4" />
        </video>

        {/* OVERLAY */}
        <div style={styles.overlay}></div>

        {/* BOTÃO LOGIN */}
        <button
          style={styles.loginTopButton}
          className="login-button-top"

          onClick={() => navigate("/login")}

          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.background = "rgba(255,255,255,0.14)";
          }}

          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.background = "rgba(255,255,255,0.08)";
          }}
        >
          Já tenho conta
        </button>

        {/* CONTEÚDO */}
        <div style={styles.content}>

          {/* LOGO */}
          <img src={logo} alt="logo" style={styles.logo} className="register-logo" />

          {/* BOX */}
          <div style={styles.registerBox} className="register-box"
          >

            {/* TÍTULO */}
            <h2 style={styles.title}>Criar conta</h2>

            <p style={styles.subtitle}>Entre para o banco de talentos</p>

            {/* FORM */}
            <form onSubmit={handleCadastro} style={styles.form}>

              {/* NOME */}
              <input
                type="text"
                placeholder="Nome completo"

                value={nome}
                onChange={(e) => setNome(e.target.value)}

                style={styles.input}
                className="register-input"

                onFocus={(e) => {
                  e.target.style.border = "1px solid #e85c8b";
                  e.target.style.boxShadow =
                    "0 0 15px rgba(232,92,139,0.4)";
                }}

                onBlur={(e) => {
                  e.target.style.border =
                    "1px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />

              {/* EMAIL */}
              <input
                type="email"
                placeholder="E-mail"

                value={email}
                onChange={(e) => setEmail(e.target.value)}

                style={styles.input}
                className="register-input"

                onFocus={(e) => {
                  e.target.style.border = "1px solid #e85c8b";
                  e.target.style.boxShadow =
                    "0 0 15px rgba(232,92,139,0.4)";
                }}

                onBlur={(e) => {
                  e.target.style.border =
                    "1px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />

              {/* TELEFONE */}
              <input
                type="text"
                placeholder="Telefone"

                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}

                style={styles.input}
                className="register-input"

                onFocus={(e) => {
                  e.target.style.border = "1px solid #e85c8b";
                  e.target.style.boxShadow =
                    "0 0 15px rgba(232,92,139,0.4)";
                }}

                onBlur={(e) => {
                  e.target.style.border =
                    "1px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />

              {/* SENHA */}
              <input
                type="password"
                placeholder="Senha"

                value={senha}
                onChange={(e) => setSenha(e.target.value)}

                style={styles.input}
                className="register-input"

                onFocus={(e) => {
                  e.target.style.border = "1px solid #e85c8b";
                  e.target.style.boxShadow =
                    "0 0 15px rgba(232,92,139,0.4)";
                }}

                onBlur={(e) => {
                  e.target.style.border =
                    "1px solid rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />

              {/* BOTÃO */}
              <div style={styles.buttonContainer} className="register-button-container">

                {/* BORDA AZUL */}
                <div style={styles.buttonBack}></div>

                {/* BOTÃO */}
                <button
                  type="submit"

                  style={styles.buttonFront}
                  className="register-button-front"
                  onClick={() => window.location.href = "/login"}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow =
                      "0 10px 25px rgba(232,92,139,0.45)";
                  }}

                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}

                  onMouseDown={(e) => {
                    e.target.style.transform = "translateY(2px)";
                  }}

                  onMouseUp={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                  }}
                >
                  Criar conta
                </button>

              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {

  container: {
    height: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000",
  },

  video: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "blur(12px)",
    zIndex: 0,
    transform: "scale(1.1)",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55))",
    zIndex: 1,
  },

  loginTopButton: {
    position: "absolute",
    top: "30px",
    right: "35px",
    padding: "12px 22px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.4px",
    cursor: "pointer",
    transition: "all 0.25s ease",
    zIndex: 5,
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    animation: "fade 1s ease",
  },

  content: {
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  logo: {
    width: "200px",
    marginBottom: "20px",
    animation:"float 4s ease-in-out infinite, fadeUp 1s ease",
    filter:"drop-shadow(0 0 12px rgba(232,92,139,0.35))",
  },

  registerBox: {
    padding: "40px",
    borderRadius: "30px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: `
      0 8px 32px rgba(0,0,0,0.35),
      inset 0 1px 1px rgba(255,255,255,0.05)
    `,
    animation: "fadeUp 1.2s ease",
  },

  title: {
    color: "#fff",
    textAlign: "center",
    fontSize: "28px",
    marginBottom: "8px",
  },

  subtitle: {
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  input: {
    width: "350px",
    padding: "18px",
    marginBottom: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(5px)",
    color: "#fff",
    fontSize: "15px",
    letterSpacing: "0.5px",
    outline: "none",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },

  buttonContainer: {
    position: "relative",
    width: "280px",
    height: "50px",
    marginTop: "10px",
  },

  buttonBack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "30px",
    border: "2px solid #5dade2",
    top: "6px",
    left: "-9px",
    transition: "all 0.25s ease",
    opacity: 0.9,
  },

  buttonFront: {
    position: "relative",
    width: "100%",
    height: "100%",
    borderRadius: "30px",
    border: "none",
    background:"linear-gradient(135deg, #e85c8b 0%, #d94f82 100%)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    transition: "all 0.25s ease",
    boxShadow:"0 4px 15px rgba(232,92,139,0.25)",
  },
};