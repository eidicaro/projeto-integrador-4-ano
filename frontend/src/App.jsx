import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas públicas
import Home from "./page/Home";
import Login from "./page/Login";
import Cadastro from "./page/Cadastro";

// Usuário
import HomeUser from "./page/HomeUser";
// Admin
import AdminLogin from "../src/page/admin/AdminLogin";
import AdminHome from "../src/page/Admin/AdminHome";
import AdminCreate from "../src/page/Admin/AdminCreate";
import AdminSee from "../src/page/Admin/AdminSee";
import CreateResume from "./page/CreateResume.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Público */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Usuário */}
        <Route path="/homeUser" element={<HomeUser />} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/home" element={<AdminHome />} />
        <Route path="/admin/criar-vaga" element={<AdminCreate />} />
        <Route path="/admin/ver-vagas" element={<AdminSee />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/createResume" element={<CreateResume />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;