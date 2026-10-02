import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import "../styles/admin-talent-link.css";

export default function AdminTalentLink({ prefix, mobile = false }) {
  return (
    <Link
      className={mobile ? "admin-talent-shortcut" : `${prefix}-nav__item`}
      to="/admin/banco-de-talentos"
    >
      <span className={`${prefix}-nav__icon`}>
        <Users size={18} aria-hidden="true" />
      </span>
      <span className={`${prefix}-nav__text`}>Banco de Talentos</span>
    </Link>
  );
}
