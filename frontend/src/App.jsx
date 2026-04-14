import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./page/Login";
import Cadastro from "./page/Cadastro";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/teste")
      .then(res => res.json())
      .then(data => setMsg(data.msg));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;