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

  return (
    <div style={styles.container}>

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

        <button type="submit" style={styles.button}>
          Cadastrar
        </button>
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

  button: {
    width: "280px",
    padding: "13px",
    borderRadius: "25px",
    border: "none",
    backgroundColor: "#e85c8b",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 0 0 2px #5dade2",
  },


};