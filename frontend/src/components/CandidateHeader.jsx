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
      <div className="candidate-header__identity">
        <Link className="candidate-brand" to="/homeUser" aria-label="Point Talentos">
          p<span>o</span>int
        </Link>
        <span className="candidate-header__context">Área do candidato</span>
      </div>

      <nav aria-label="Área do candidato">
        <NavLink to="/homeUser" end><i>01</i> Radar</NavLink>
        <NavLink to="/createResume"><i>02</i> Currículo</NavLink>
        <NavLink to="/candidaturas"><i>03</i> Candidaturas</NavLink>
        <NavLink to="/vagas-salvas"><i>04</i> Salvas</NavLink>
        <NavLink to="/perfil"><i>05</i> Perfil</NavLink>
      </nav>

      <div className="candidate-account">
        <span className="candidate-account__avatar" aria-hidden="true">
          {String(user?.name || "C").trim().charAt(0).toUpperCase()}
        </span>
        <span className="candidate-account__name">{user?.name}</span>
        <button type="button" onClick={handleLogout}>Sair ↗</button>
      </div>
    </header>
  );
}
