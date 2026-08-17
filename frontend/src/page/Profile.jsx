import { useState } from "react";
import { Link } from "react-router-dom";

import CandidateHeader from "../components/CandidateHeader";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../lib/api";
import "../styles/candidate-pages.css";

export default function Profile() {
  const { updateProfile, user } = useAuth();
  const [form, setForm] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    telefone: user?.telefone || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.replace(/\D+/g, ""),
      });
      setForm({
        name: updated.name || "",
        email: updated.email || "",
        telefone: updated.telefone || "",
      });
      setSuccess("Perfil atualizado com sucesso.");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível atualizar seu perfil."),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="candidate-page">
      <CandidateHeader />
      <main className="candidate-main">
        <div className="candidate-heading">
          <div>
            <span className="candidate-eyebrow">Sua conta</span>
            <h1>Perfil</h1>
            <p>Mantenha seus dados de acesso e contato sempre atualizados.</p>
          </div>
        </div>

        {error && <div className="candidate-alert" role="alert">{error}</div>}
        {success && (
          <div className="candidate-alert candidate-alert--success" role="status">
            {success}
          </div>
        )}

        <div className="profile-grid">
          <section className="candidate-panel">
            <form className="candidate-form" onSubmit={handleSubmit}>
              <label>
                Nome completo
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  autoComplete="name"
                  minLength={3}
                  maxLength={120}
                  required
                />
              </label>

              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </label>

              <label>
                Telefone
                <input
                  name="telefone"
                  type="tel"
                  value={form.telefone}
                  onChange={updateField}
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={20}
                  required
                />
              </label>

              <button className="candidate-button" type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar alterações"}
              </button>
            </form>
          </section>

          <aside className="candidate-panel profile-aside">
            <h2>Currículo profissional</h2>
            <p>Atualize experiências, formação, habilidades, idiomas, links e foto.</p>
            <Link className="candidate-button" to="/createResume">
              Abrir meu currículo
            </Link>

            <h2>Segurança</h2>
            <p>Se precisar trocar sua senha, solicite um link seguro pelo e-mail cadastrado.</p>
            <Link className="candidate-button-secondary" to="/recuperar-senha">
              Redefinir senha
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
