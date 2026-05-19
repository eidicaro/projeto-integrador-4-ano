import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";


// Páginas
import Home from "./page/Home";
import Login from "./page/Login";
import Cadastro from "./page/Cadastro";
import HomeUser from "./page/HomeUser";
import CreateResume from "./page/CreateResume.jsx";

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Autenticação */}
        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/homeUser" element={<HomeUser />} />

        <Route path="/createResume" element={<CreateResume />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;