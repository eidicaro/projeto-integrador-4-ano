import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Users,
  ArrowUpRight,
  RefreshCw,
  Check,
} from "lucide-react";
import AdminTalentLayout from "../../features/talent-pool/AdminTalentLayout";
import TalentDialog from "../../features/talent-pool/TalentDialog";
import TalentFilters from "../../features/talent-pool/TalentFilters";
import TalentProfileSummary from "../../features/talent-pool/TalentProfileSummary";
import TalentReferral from "../../features/talent-pool/TalentReferral";
import { getDemoTalents } from "../../features/talent-pool/demoTalents";
import {
  filterTalents,
  formatTalentDate,
  initials,
  uniqueInterests,
} from "../../features/talent-pool/talentPool";
import "../../styles/talent-pool.css";

const EMPTY_FILTERS = { area: "", location: "", period: "", sort: "recent" };
const PAGE_SIZE = 12;

export default function AdminTalentPool() {
  const [talents, setTalents] = useState([]);
  const [referenceTime, setReferenceTime] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referrals, setReferrals] = useState({});
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    let active = true;
    // Demo adapter is intentionally isolated from real candidate APIs.
    Promise.resolve().then(() => {
      if (active) {
        const now = Date.now();
        setReferenceTime(now);
        setTalents(getDemoTalents(now));
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [reload]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(query), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);
  const areas = useMemo(
    () =>
      uniqueInterests(talents.flatMap((talent) => talent.interests)).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [talents],
  );
  const locations = useMemo(
    () =>
      [
        ...new Set(talents.map((talent) => talent.location).filter(Boolean)),
      ].sort(),
    [talents],
  );
  const results = useMemo(
    () => filterTalents(talents, { ...filters, query: search }, referenceTime),
    [talents, filters, search, referenceTime],
  );
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const recent = talents.filter(
    (talent) =>
      referenceTime - new Date(talent.joinedAt).getTime() <= 30 * 86400000,
  ).length;
  const hasFilters = Boolean(
    query || filters.area || filters.location || filters.period,
  );
  function changeFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }
  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setQuery("");
    setSearch("");
    setPage(1);
  }
  function closeDetail() {
    setSelected(null);
    setReferralOpen(false);
  }
  return (
    <AdminTalentLayout>
      <header className="talent-admin-heading">
        <div>
          <span className="talent-admin-eyebrow">
            Relacionamento com candidatos
          </span>
          <h1>Banco de Talentos</h1>
          <p>
            Encontre perfis por área, habilidades e trajetória profissional.
          </p>
        </div>
        <button
          type="button"
          className="talent-admin-button talent-admin-button--secondary"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setReload((value) => value + 1);
          }}
        >
          <RefreshCw size={16} aria-hidden="true" /> Atualizar
        </button>
      </header>
      <div className="talent-notice talent-admin-demo">
        <strong>Ambiente de demonstração</strong>
        <p>
          Todos os perfis abaixo são fictícios. A consulta a participantes reais
          depende da futura API de adesão. Interesses locais de candidatos não
          aparecem nesta lista.
        </p>
      </div>
      <section
        className="talent-admin-stats"
        aria-label="Indicadores da demonstração"
      >
        <div>
          <Users size={20} aria-hidden="true" />
          <span>Perfis de exemplo</span>
          <strong>{loading ? "—" : talents.length}</strong>
        </div>
        <div>
          <span>Entradas nos últimos 30 dias</span>
          <strong>{loading ? "—" : recent}</strong>
        </div>
        <div>
          <span>Áreas representadas</span>
          <strong>{loading ? "—" : areas.length}</strong>
        </div>
      </section>
      {feedback && (
        <div
          className="talent-admin-alert talent-admin-alert--success"
          role="status"
        >
          <Check size={18} aria-hidden="true" />
          {feedback}
        </div>
      )}
      <section className="talent-admin-panel" aria-label="Consulta de talentos">
        <div className="talent-admin-toolbar">
          <label className="talent-search">
            <Search size={19} aria-hidden="true" />
            <span className="talent-sr-only">Buscar talentos</span>
            <input
              type="search"
              placeholder="Nome, habilidade, cargo ou área…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="talent-sort">
            Ordenar por
            <select
              value={filters.sort}
              onChange={(event) => changeFilter("sort", event.target.value)}
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="name">Nome A–Z</option>
              <option value="complete">Perfil mais completo</option>
            </select>
          </label>
          <button
            className="talent-admin-button talent-admin-button--secondary talent-mobile-filter"
            type="button"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" /> Filtros
            {hasFilters ? " ativos" : ""}
          </button>
        </div>
        <div className="talent-desktop-filters">
          <TalentFilters
            filters={filters}
            areas={areas}
            locations={locations}
            onChange={changeFilter}
            onClear={clearFilters}
          />
        </div>
        <div className="talent-results-heading">
          <h2>Talentos disponíveis na demonstração</h2>
          <span role="status" aria-live="polite">
            {loading
              ? "Carregando…"
              : `${results.length} resultado${results.length === 1 ? "" : "s"}`}
          </span>
        </div>
        {loading ? (
          <div
            className="talent-skeleton"
            role="status"
            aria-label="Carregando talentos"
          >
            <span />
            <span />
            <span />
          </div>
        ) : !results.length ? (
          <div className="talent-admin-empty">
            <Search size={32} aria-hidden="true" />
            <h3>
              {hasFilters
                ? "Nenhum talento corresponde à busca"
                : "Ainda não há talentos nesta lista"}
            </h3>
            <p>
              {hasFilters
                ? "Experimente outra habilidade ou amplie os filtros."
                : "Os perfis aparecerão aqui quando estiverem disponíveis."}
            </p>
            {hasFilters && (
              <button
                type="button"
                className="talent-admin-button"
                onClick={clearFilters}
              >
                Limpar busca e filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="talent-list-heading" aria-hidden="true">
              <span>Candidato</span>
              <span>Área e habilidades</span>
              <span>Entrada</span>
              <span>Perfil</span>
            </div>
            <ul className="talent-admin-list">
              {visible.map((talent) => (
                <li key={talent.id}>
                  <div className="talent-list-identity">
                    <span className="talent-avatar" aria-hidden="true">
                      {initials(talent.name)}
                    </span>
                    <div>
                      <h3>{talent.name}</h3>
                      <p>{talent.location || "Localização não informada"}</p>
                      <small>Perfil fictício</small>
                    </div>
                  </div>
                  <div className="talent-list-skills">
                    <strong>{talent.interests.join(" · ")}</strong>
                    <div className="talent-tags">
                      {talent.skills.slice(0, 3).map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  <time dateTime={talent.joinedAt}>
                    <span className="talent-mobile-label">Entrada: </span>
                    {formatTalentDate(talent.joinedAt)}
                  </time>
                  <button
                    type="button"
                    className="talent-admin-button talent-admin-button--secondary"
                    onClick={() => {
                      setSelected(talent);
                      setReferralOpen(false);
                    }}
                    aria-label={`Ver perfil de ${talent.name}`}
                  >
                    Ver perfil <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav
                className="talent-pagination"
                aria-label="Páginas de talentos"
              >
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
      </section>
      {filterOpen && (
        <TalentDialog
          title="Filtrar talentos"
          variant="talent-admin-dialog"
          onClose={() => setFilterOpen(false)}
        >
          <TalentFilters
            filters={filters}
            areas={areas}
            locations={locations}
            onChange={changeFilter}
            onClear={clearFilters}
          />
          <button
            className="talent-admin-button"
            type="button"
            onClick={() => setFilterOpen(false)}
          >
            Ver {results.length} resultados
          </button>
        </TalentDialog>
      )}
      {selected && (
        <TalentDialog
          title="Perfil do talento"
          variant="talent-admin-dialog talent-drawer"
          onClose={closeDetail}
        >
          <span className="talent-status">Perfil fictício · demonstração</span>
          <TalentProfileSummary resume={selected.resume} detailed />
          <section className="talent-detail-section">
            <h3>Interesses profissionais</h3>
            <div className="talent-tags">
              {selected.interests.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>
            <dl className="talent-facts">
              <div>
                <dt>Entrada na demonstração</dt>
                <dd>{formatTalentDate(selected.joinedAt)}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>{formatTalentDate(selected.updatedAt)}</dd>
              </div>
            </dl>
          </section>
          {referrals[selected.id] && (
            <p
              className="talent-admin-alert talent-admin-alert--success"
              role="status"
            >
              Indicação simulada para {referrals[selected.id]}. Nenhuma
              candidatura foi criada.
            </p>
          )}
          {referralOpen ? (
            <TalentReferral
              talent={selected}
              onComplete={(job) => {
                setReferrals((current) => ({
                  ...current,
                  [selected.id]: job.title,
                }));
                setReferralOpen(false);
                setFeedback(
                  `Indicação de ${selected.name} para ${job.title} simulada. Nenhuma candidatura foi criada.`,
                );
              }}
            />
          ) : (
            <button
              type="button"
              className="talent-admin-button"
              onClick={() => setReferralOpen(true)}
            >
              Indicar para vaga · simulação{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          )}
        </TalentDialog>
      )}
    </AdminTalentLayout>
  );
}
