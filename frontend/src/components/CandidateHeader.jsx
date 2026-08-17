import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function CandidateHeader() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
    }
  }

  return (
    <header className="candidate-header">
      <Link className="candidate-brand" to="/homeUser" aria-label="Point Talentos">
        p<span>o</span>int
      </Link>

      <nav aria-label="Área do candidato">
        <NavLink to="/homeUser">Vagas</NavLink>
        <NavLink to="/candidaturas">Candidaturas</NavLink>
        <NavLink to="/vagas-salvas">Salvas</NavLink>
        <NavLink to="/perfil">Perfil</NavLink>
      </nav>

      <div className="candidate-account">
        <span>{user?.name}</span>
        <button type="button" onClick={handleLogout}>Sair</button>
      </div>
    </header>
  );
}
