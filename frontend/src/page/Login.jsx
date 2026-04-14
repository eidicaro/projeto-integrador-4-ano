import { useState } from "react";
import logo from "../assets/login.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    alert("Login clicado");
  }

  return (
    <div style={styles.container}>
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
        <div style={styles.buttonWrapper}>
       <button type="submit" style={styles.button}>Entrar</button>
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

  button: {
    width: "280px",
    padding: "13px",
    borderRadius: "25px",
    border: "none",
    backgroundColor: "#e85c8b",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  

  },


  buttonWrapper: {
    
    borderRadius: "25px",
    padding: "2px",
    background: "linear-gradient(90deg, #5dade2, #85c1e9)", 
  },


};
