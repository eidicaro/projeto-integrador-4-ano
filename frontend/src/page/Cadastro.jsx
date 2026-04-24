import { useState } from "react";
import logo from "../assets/cadastro.png";
import dotsLeft from "../assets/dots-left.png";   // horizontal
import dotsRight from "../assets/dots-right.png"; // vertical

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  function handleCadastro(e) {
    e.preventDefault();
    alert("Cadastro realizado!");
  }

  return (
    <div style={styles.container}>

      {/* 🔵 ESQUERDA (imagem deitada Superio) */}
      <img src={dotsLeft} alt="dots" style={styles.dotsLeftTop} />
      <img src={dotsLeft} alt="dots" style={styles.dotsLeftRightTop} />

         {/* 🔵 ESQUERDA (imagem deitada Meio) */}
       <img src={dotsLeft} alt="dots" style={styles.dotsLeftQuite} />

      
      {/* 🔵 ESQUERDA (imagem deitada Inferior) */}
      <img src={dotsLeft} alt="dots" style={styles.dotsLeftBottom} />
      <img src={dotsLeft} alt="dots" style={styles.dotsLeftRightBottom} />


      {/* 🔵 DIREITA (duas colunas separadas) */}
      <img src={dotsRight} alt="dots" style={styles.dotsRightTop} />
      <img src={dotsRight} alt="dots" style={styles.dotsRightBottom} />

      {/* LOGO */}
      <img src={logo} alt="logo" style={styles.logo} />

      {/* FORM */}
      <form onSubmit={handleCadastro} style={styles.form}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={styles.input}
        />

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="tel"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => {
            let value = e.target.value;
            value = value
              .replace(/\D/g, "")
              .replace(/^(\d{2})(\d)/g, "($1) $2")
              .replace(/(\d{5})(\d)/, "$1-$2")
              .slice(0, 15);
            setTelefone(value);
          }}
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
          <button type="submit" style={styles.buttonFront}>
            Cadastrar
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
    position: "relative",
    overflow: "hidden",
  },

  logo: {
    width: "200px",
    marginBottom: "20px",
    zIndex: 2,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 2,
  },

  input: {
    width: "350px",
    padding: "18px",
    marginBottom: "15px",
    borderRadius: "9px",
    border: "none",
    backgroundColor: "#d9d9d9",
    boxShadow: "2px 2px 0 #999",
    outline: "none",
  },

  // BOTÃO
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
    left: "-6px",
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
  },

  // 🔵 IMAGENS

  // DOTS ESQUERDO PRIMEIRO SUPERIO (horizontal)
  dotsLeftTop: {
    position: "absolute",
    left: "-60px",
    top: "20%",
    transform: "translateY(-50%)",
    width: "380px",
    opacity: 0.9,
  },
  // DOTS ESQUERDO SEGUNDO SUPERIO
   dotsLeftRightTop: {
    position: "absolute",
    left: "215px",
    top: "20%",
    transform: "translateY(-50%)",
    width: "380px",
    opacity: 0.9,
  },

  //DOTS ESQUERDO MEIO
   dotsLeftQuite: {
    position: "absolute",
    left: "-60px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "380px",
    opacity: 0.9,
  },


    // DOTS ESQUERDO PRIMEIRO INFERIOR (horizontal)
    dotsLeftBottom: {
    position: "absolute",
    left: "-60px",
    top: "80%",
    transform: "translateY(-50%)",
    width: "380px",
    opacity: 0.9,
  },
  //DOTS ESQUERDO SEGUNDO INFERIOR
    dotsLeftRightBottom: {
    position: "absolute",
    left: "215px",
    top: "80%",
    transform: "translateY(-50%)",
    width: "380px",
    opacity: 0.9,
  },

  //PRIMEIRA COLUNA 
  dotsRightTop: {
    position: "absolute",
    right: "98px",
    top: "20%",
    width: "120px",
    opacity: 0.9,
  },

  // SEGUNDA COLUNA
  dotsRightBottom: {
    position: "absolute",
    right: "0px",
    top: "20%",
    width: "120px",
    opacity: 0.9,
  },
};