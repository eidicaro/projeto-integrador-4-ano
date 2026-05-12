import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./page/Login";
import Cadastro from "./page/Cadastro";
import HomeUser from "./page/HomeUser";

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<Cadastro />} />

        <Route path="/homeUser" element={<HomeUser />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;