import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  Compass,
  FileText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import CandidateHeader from "../components/CandidateHeader";
import { useAuth } from "../context/AuthContext";
import TalentDialog from "../features/talent-pool/TalentDialog";
import TalentInterestForm from "../features/talent-pool/TalentInterestForm";
import TalentProfileSummary from "../features/talent-pool/TalentProfileSummary";
import useTalentProfile from "../features/talent-pool/useTalentProfile";
import {
  getDemoRepository,
  notifyMembershipChange,
} from "../features/talent-pool/demoRepository";
import {
  formatTalentDate,
  interestOptions,
} from "../features/talent-pool/talentPool";
import "../styles/candidate-pages.css";
import "../styles/talent-pool.css";

function CandidateParticipation({ user }) {
  const {
    loading,
    resume,
    jobs,
    membership,
    profileError,
    jobsError,
    storageError,
    retry,
  } = useTalentProfile(user.id);
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  async function save(interests) {
    getDemoRepository().save(user.id, interests);
    notifyMembershipChange();
    setEditing(false);
    setFeedback(
      membership
        ? "Seus interesses locais foram atualizados."
        : "Interesse registrado nesta demonstração. Nenhum dado foi enviado à empresa.",
    );
  }
  function leave() {
    try {
      getDemoRepository().leave(user.id);
      notifyMembershipChange();
      setLeaving(false);
      setEditing(false);
      setFeedback(
        "Participação local removida. Seu perfil e suas candidaturas continuam disponíveis.",
      );
    } catch {
      setError(
        "Não foi possível remover a participação local. Tente novamente.",
      );
    }
  }
  if (loading)
    return (
      <section
        id="participar"
        className="talent-skeleton"
        role="status"
        aria-label="Carregando perfil e interesses"
      >
        <span />
        <span />
        <span />
        <p>Buscando seu perfil…</p>
      </section>
    );
  return (
    <section
      id="participar"
      className="talent-participation"
      aria-labelledby="talent-participation-title"
    >
      {feedback && (
        <div role="status" className="candidate-alert candidate-alert--success">
          {feedback}
        </div>
      )}
      {(profileError || storageError) && (
        <div className="candidate-alert" role="alert">
          {profileError || storageError}{" "}
          <button type="button" onClick={retry}>
            Tentar novamente
          </button>
          {storageError && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setLeaving(true);
              }}
            >
              Limpar preferências locais
            </button>
          )}
        </div>
      )}
      {jobsError && (
        <p className="talent-notice">
          {jobsError}{" "}
          <button type="button" onClick={retry}>
            Atualizar sugestões
          </button>
        </p>
      )}
      <div className="talent-participation-grid">
        <div className="candidate-panel">
          <span className="candidate-eyebrow">
            {membership
              ? "Seu interesse está registrado"
              : "Um próximo passo, sem escolher uma vaga"}
          </span>
          <h2 id="talent-participation-title">
            {membership
              ? "Você faz parte da demonstração do Banco de Talentos."
              : "Deixe seus interesses com a gente."}
          </h2>
          {membership && !editing ? (
            <div className="talent-member-state">
              <span className="talent-status">
                <Check size={16} aria-hidden="true" /> Participação local ativa
              </span>
              <dl className="talent-facts">
                <div>
                  <dt>Entrada na demonstração</dt>
                  <dd>{formatTalentDate(membership.joinedAt)}</dd>
                </div>
                <div>
                  <dt>Última atualização de interesses</dt>
                  <dd>{formatTalentDate(membership.updatedAt)}</dd>
                </div>
              </dl>
              <h3>Suas áreas de interesse</h3>
              <div className="talent-tags">
                {membership.interests.map((area) => (
                  <span key={area}>{area}</span>
                ))}
              </div>
              <p>
                Seu interesse está salvo neste navegador. A participação oficial
                e a consulta pela equipe estarão disponíveis quando o serviço
                for conectado.
              </p>
              <div className="talent-actions">
                <button
                  type="button"
                  className="candidate-button"
                  onClick={() => {
                    setFeedback("");
                    setEditing(true);
                  }}
                >
                  Atualizar interesses
                </button>
                <button
                  type="button"
                  className="candidate-danger-button"
                  onClick={() => {
                    setError("");
                    setLeaving(true);
                  }}
                >
                  Sair da demonstração
                </button>
              </div>
            </div>
          ) : profileError || storageError ? (
            <p className="talent-muted">
              Carregue seu perfil e suas preferências para continuar com
              segurança.
            </p>
          ) : (
            <>
              <p className="talent-muted">
                Seus dados pessoais já estão no perfil. Aqui, basta dizer quais
                áreas fazem sentido para você.
              </p>
              <TalentInterestForm
                options={interestOptions(jobs, resume, membership)}
                initialInterests={
                  membership?.interests ||
                  (resume?.area_atuacao ? [resume.area_atuacao] : [])
                }
                editing={editing}
                onSave={save}
                onCancel={() => setEditing(false)}
              />
            </>
          )}
        </div>
        <aside className="candidate-panel talent-profile-panel">
          <div className="talent-section-title">
            <FileText size={20} aria-hidden="true" />
            <h2>Seu perfil, sem preencher tudo de novo</h2>
          </div>
          <TalentProfileSummary resume={resume} user={user} />
          {!resume && !profileError && (
            <p className="talent-notice">
              Você ainda não criou um currículo. Adicione suas experiências para
              apresentar melhor seu trabalho.
            </p>
          )}
          {resume?.updatedAt && (
            <p className="talent-muted">
              Currículo atualizado em {formatTalentDate(resume.updatedAt)}
            </p>
          )}
          <div className="talent-actions">
            <Link className="candidate-button-secondary" to="/createResume">
              {resume ? "Atualizar currículo" : "Criar currículo"}{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/perfil" className="talent-text-link">
              Editar contato ↗
            </Link>
          </div>
        </aside>
      </div>
      {leaving && (
        <TalentDialog
          title="Sair da demonstração?"
          onClose={() => setLeaving(false)}
        >
          <p>
            Apenas os interesses salvos neste navegador serão removidos. Você
            poderá participar novamente quando quiser.
          </p>
          {error && (
            <p role="alert" className="candidate-alert">
              {error}
            </p>
          )}
          <div className="talent-actions">
            <button
              className="candidate-button-secondary"
              type="button"
              onClick={() => setLeaving(false)}
            >
              Continuar participando
            </button>
            <button
              className="candidate-danger-button"
              type="button"
              onClick={leave}
            >
              Remover participação local
            </button>
          </div>
        </TalentDialog>
      )}
    </section>
  );
}

export default function TalentPool() {
  const { user, loading } = useAuth();
  const reduced = useReducedMotion();
  const candidate = user?.role === "candidato";
  return (
    <div className="candidate-page talent-page">
      {candidate ? (
        <CandidateHeader />
      ) : (
        <header className="talent-public-header">
          <Link className="candidate-brand" to="/">
            p<span>o</span>int
          </Link>
          <nav aria-label="Navegação principal">
            <Link to="/">Início</Link>
            <Link to="/#vagas">Vagas</Link>
            <Link to="/createResume">Currículo</Link>
            <Link to="/vagas-salvas">Salvas</Link>
            <Link to="/banco-de-talentos" aria-current="page">
              Banco de Talentos
            </Link>
          </nav>
          <Link
            className="candidate-button"
            to={user ? "/admin/home" : "/login"}
            state={{ redirectTo: "/banco-de-talentos" }}
          >
            {user ? "Painel Admin" : "Entrar"}
          </Link>
        </header>
      )}
      <main className="candidate-main">
        <Motion.section
          className="talent-hero"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <span className="candidate-eyebrow">Banco de Talentos</span>
            <h1>
              A vaga certa pode
              <br />
              vir <span>depois.</span>
              <br />
              Seu próximo passo é agora.
            </h1>
            <p>
              Não encontrou uma oportunidade para você? Registre suas áreas de
              interesse e prepare seu perfil para futuras vagas na Point.
            </p>
            <a className="candidate-button" href="#participar">
              Conhecer e participar{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <div className="talent-hero-proof">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>
                Você escolhe seus interesses e pode sair quando quiser.
              </span>
            </div>
          </div>
          <aside
            className="talent-hero-note"
            aria-label="Como o Banco de Talentos conecta seu perfil às oportunidades"
          >
            <span className="talent-note-number">
              05 / Seu próximo capítulo
            </span>
            <Users size={44} strokeWidth={1.5} aria-hidden="true" />
            <h2>
              Um perfil.
              <br />
              Mais possibilidades.
            </h2>
            <div>
              <span>
                <FileText size={17} aria-hidden="true" /> Seu currículo
              </span>
              <span>
                <Compass size={17} aria-hidden="true" /> Seus interesses
              </span>
              <span>
                <ArrowUpRight size={17} aria-hidden="true" /> Futuras
                oportunidades
              </span>
            </div>
            <p>
              Participar não exige escolher uma vaga e não substitui uma
              candidatura.
            </p>
          </aside>
        </Motion.section>
        <div className="talent-notice talent-demo-notice">
          <strong>Demonstração local</strong>
          <p>
            O Banco de Talentos ainda não recebe inscrições oficiais. Seus
            interesses ficam somente neste navegador; a empresa não recebe seu
            perfil por esta página.
          </p>
        </div>
        <ol className="talent-steps">
          <li>
            <span>01</span>
            <h2>Use seu perfil</h2>
            <p>Reutilize o currículo e os dados de contato que já cadastrou.</p>
          </li>
          <li>
            <span>02</span>
            <h2>Conte seus interesses</h2>
            <p>
              Escolha as áreas em que gostaria de trabalhar, sem se vincular a
              uma vaga.
            </p>
          </li>
          <li>
            <span>03</span>
            <h2>Mantenha tudo atualizado</h2>
            <p>
              Quando a participação oficial estiver disponível, seu perfil
              poderá ser considerado em oportunidades compatíveis. Isso não
              garante uma contratação.
            </p>
          </li>
        </ol>
        {loading ? (
          <section className="talent-skeleton" role="status">
            <p>Carregando sua sessão…</p>
            <span />
            <span />
          </section>
        ) : candidate ? (
          <CandidateParticipation key={user.id} user={user} />
        ) : (
          <section
            id="participar"
            className="candidate-panel talent-public-join"
          >
            <h2>
              {user
                ? "Consulte os talentos na área administrativa."
                : "Seu perfil é o ponto de partida."}
            </h2>
            <p>
              {user
                ? "A gestão do Banco de Talentos fica no seu painel de recrutamento."
                : "Entre na sua conta de candidato para reutilizar seu currículo e experimentar o registro de interesses."}
            </p>
            <div className="talent-actions">
              <Link
                className="candidate-button"
                to={user ? "/admin/banco-de-talentos" : "/login"}
                state={{ redirectTo: "/banco-de-talentos" }}
              >
                {user
                  ? "Abrir Banco de Talentos no Admin"
                  : "Entrar e continuar"}
              </Link>
              {!user && (
                <Link className="candidate-button-secondary" to="/cadastro">
                  Criar meu perfil
                </Link>
              )}
            </div>
          </section>
        )}
      </main>
      <footer className="talent-footer">
        <Link to="/">Point · Plataforma de talentos</Link>
        <Link to="/privacidade">Privacidade ↗</Link>
      </footer>
    </div>
  );
}
