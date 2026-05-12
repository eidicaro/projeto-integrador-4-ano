import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas
import Home from "./page/Home";
import Login from "./page/Login";
import Cadastro from "./page/Cadastro";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;