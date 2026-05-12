import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


// Páginas
import Home from "./page/Home";
import Login from "./page/Login";
import Cadastro from "./page/Cadastro";
import HomeUser from "./page/HomeUser";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/teste")
      .then((res) => res.json())
      .then((data) => setMsg(data.msg))
      .catch((err) => console.error("Erro API:", err));
  }, []);

  return (
    <BrowserRouter>

      {/* Mensagem de teste da API (opcional – pode remover depois) */}
      {msg && (
        <div style={{ textAlign: "center", padding: "10px", fontSize: "12px" }}>
          API: {msg}
        </div>
      )}

      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Autenticação */}

        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/homeUser" element={<HomeUser />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;