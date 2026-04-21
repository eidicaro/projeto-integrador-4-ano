import { useState } from "react";
import logo from "../assets/cadastro.png";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  function handleCadastro(e) {
    e.preventDefault();
    alert("Cadastro realizado!");
  }

  // bolinha correta (figma)
  const Dot = () => (
    <div style={styles.dot}>
      <div style={styles.dotInner}></div>
    </div>
  );

  return (
    <div style={styles.container}>

      {/* LADO ESQUERDO */}
      <div style={styles.dotGridLeft}>
        {[...Array(35)].map((_, i) => (
          <Dot key={"l" + i} />
        ))}
      </div>

      {/* LADO DIREITO */}
      <div style={styles.dotGridRight}>
        {[...Array(35)].map((_, i) => (
          <Dot key={"r" + i} />
        ))}
      </div>

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

        {/* BOTÃO*/}
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
    zIndex: 1,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 1,
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
    left: "-8px",
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

  // 🔵 bolinha estilo figma
  dot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "conic-gradient(#5dade2 0deg 180deg, #e85c8b 180deg 360deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  dotInner: {
    width: "6px",
    height: "6px",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
  },

  // 🔵 esquerda
  dotGridLeft: {
    position: "absolute",
    left: "-40px",
    top: "10%",
    display: "grid",
    gridTemplateColumns: "repeat(4, 20px)",
    gap: "14px",
    opacity: 0.8,
  },

  // 🔵 direita
  dotGridRight: {
    position: "absolute",
    right: "-40px",
    bottom: "10%",
    display: "grid",
    gridTemplateColumns: "repeat(4, 20px)",
    gap: "14px",
    opacity: 0.8,
  },
};