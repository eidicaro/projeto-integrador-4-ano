import { useState } from "react";
import logo from "../assets/login.png";
import dotsLeft from "../assets/dots-left.png";   // horizontal
import dotsRight from "../assets/dots-right.png"; // vertical

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    alert("Login clicado");
  }

  return (
    <div style={styles.container}>
    
          {/* 🔵 ESQUERDA (imagem deitada Superio) */}
          <img src={dotsLeft} alt="dots" style={styles.dotsLeftTop} />
          <img src={dotsLeft} alt="dots" style={styles.dotsLeftRightTop} />
    
    
          
          {/* 🔵 ESQUERDA (imagem deitada Inferior) */}
          <img src={dotsLeft} alt="dots" style={styles.dotsLeftBottom} />
          <img src={dotsLeft} alt="dots" style={styles.dotsLeftRightBottom} />
    
    
          {/* 🔵 DIREITA (duas colunas separadas) */}
          <img src={dotsRight} alt="dots" style={styles.dotsRightTop} />
          <img src={dotsRight} alt="dots" style={styles.dotsRightBottom} />

      {/* LOGO */}
      <img src={logo} alt="logo" style={styles.logo} />

      {/* FORM */}
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

        {/* BOTÃO COM BORDA DUPLA */}
       <div style={styles.buttonContainer}>
  <div style={styles.buttonBack}></div>

  <button type="submit" style={styles.buttonFront}>
    Entrar
  </button>
</div>
      </form>
    </div>
  );
}

const styles = {


  container: {
    height: "100vh",
    backgroundColor: "#eaeaea",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: "240px",
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
    marginBottom: "20px",
    borderRadius: "9px",
    border: "none",
    backgroundColor: "#d9d9d9",
    boxShadow: "2px 2px 0 #999",
    outline: "none",
  },

 buttonContainer: {
  position: "relative",
  width: "280px",
  height: "50px",
  marginTop: "10px",
},

// 🔵 FUNDO AZUL (DESLOCADO)
buttonBack: {
  position: "absolute",
  width: "100%",
  height: "100%",
  borderRadius: "30px",
  border: "2px solid #5dade2",
  top: "6px",   // deslocamento vertical
  left: "-18px", // deslocamento horizontal
},

// 🔴 BOTÃO PRINCIPAL
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

 // 🔵 IMAGENS

  // DOTS ESQUERDO PRIMEIRO SUPERIO (horizontal)
  dotsLeftTop: {
    position: "absolute",
    left: "-3px",
    top: "36%",
    transform: "translateY(-50%)",
    width: "400px",
    opacity: 0.9,
  },
  // DOTS ESQUERDO SEGUNDO SUPERIO
   dotsLeftRightTop: {
    position: "absolute",
    left: "215px",
    top: "36%",
    transform: "translateY(-50%)",
    width: "400px",
    opacity: 0.9,
  },

  


    // DOTS ESQUERDO PRIMEIRO INFERIOR (horizontal)
    dotsLeftBottom: {
    position: "absolute",
    left: "-3px",
    top: "70%",
    transform: "translateY(-50%)",
    width: "400px",
    opacity: 0.9,
  },
  //DOTS ESQUERDO SEGUNDO INFERIOR
    dotsLeftRightBottom: {
    position: "absolute",
    left: "215px",
    top: "70%",
    transform: "translateY(-50%)",
    width: "400px",
    opacity: 0.9,
  },

  //PRIMEIRA COLUNA 
  dotsRightTop: {
    position: "absolute",
    right: "109px",
    top: "20%",
    width: "130px",
    opacity: 0.9,
  },

  // SEGUNDA COLUNA
  dotsRightBottom: {
    position: "absolute",
    right: "0px",
    top: "20%",
    width: "130px",
    opacity: 0.9,
  },


};
