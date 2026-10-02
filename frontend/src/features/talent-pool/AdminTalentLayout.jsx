import { Link, NavLink, useNavigate } from "react-router-dom";
import { Home, Layers, Plus, Briefcase, Users, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useActiveNavScroll from "../../hooks/useActiveNavScroll";
import { initials } from "./talentPool";

const items = [
  ["/admin/home", "Visão geral", Home],
  ["/admin/criar-vaga", "Criar vaga", Plus],
  ["/admin/ver-vagas", "Ver vagas", Briefcase],
  ["/admin/banco-de-talentos", "Banco de Talentos", Users],
];

export default function AdminTalentLayout({ children }) {
  const { user, logout } = useAuth();
  const navRef = useActiveNavScroll();
  const navigate = useNavigate();
  async function exit() {
    try {
      await logout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }
  return (
    <div className="talent-admin">
      <aside className="talent-admin-sidebar">
        <Link to="/admin/home" className="talent-admin-brand">
          <span>
            <Layers size={21} aria-hidden="true" />
          </span>
          <div>
            <strong>Painel Admin</strong>
            <small>Área de controle</small>
          </div>
        </Link>
        <span className="talent-nav-label">Navegação</span>
        <nav ref={navRef} aria-label="Navegação administrativa">
          {items.map((item) => {
            const [path, label, Icon] = item;
            return (
              <NavLink key={path} to={path}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            );
          })}
        </nav>
        <div className="talent-admin-account">
          <span className="talent-avatar">{initials(user?.name)}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>Recrutador</small>
          </div>
          <button
            type="button"
            className="talent-icon-button"
            onClick={exit}
            aria-label="Sair do painel"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>
      <main className="talent-admin-main">
        <div className="talent-admin-breadcrumb">
          <Link to="/admin/home">Área administrativa</Link>
          <span>/</span>
          <span>Banco de Talentos</span>
        </div>
        {children}
      </main>
    </div>
  );
}
