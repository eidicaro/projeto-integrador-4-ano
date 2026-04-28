import { useState } from "react";
import logo from "../assets/login.png";
import bgVideo from "../assets/bg.mp4";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    alert("Login clicado");
  }

  return (
    <div style={styles.container}>

      {/* 🎥 VIDEO DE FUNDO */}
      <video autoPlay loop muted playsInline style={styles.video}>
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* 🧊 OVERLAY */}
      <div style={styles.overlay}></div>

      {/* CONTEÚDO */}
      <div style={styles.content}>
        <img src={logo} alt="logo" style={styles.logo} />

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={styles.input}
          />

          {/* BOTÃO */}
          <div style={styles.buttonContainer}>
            <div style={styles.buttonBack}></div>
              <button
              type="submit"
              style={styles.buttonFront}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(3px)";
                e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
              onMouseDown={(e) => {
                e.target.style.transform = "translateX(2px)";
              }}
              onMouseUp={(e) => {
                e.target.style.transform = "translateY(-2px)";
              }}
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000", // evita fundo branco
  },

  // 🎥 CORREÇÃO AQUI
  video: {
    position: "fixed",   
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover", 
    filter: "blur(20px)",
    zIndex: 0,
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 1,
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
    width: "220px",
    marginBottom: "20px",
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
    borderRadius: "9px",
    border: "none",
    backgroundColor: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(4px)",
    boxShadow: "2px 2px 0 #999",
    outline: "none",
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
  transition: "all 0.2s ease", // 🔥 anima junto
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
    transition: "all 0.2s ease", // 🔥 ESSENCIAL
  },

};