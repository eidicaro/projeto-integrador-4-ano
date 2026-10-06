import { useEffect, useState } from "react";
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
import talentPoolApi from "../../features/talent-pool/talentPoolApi";
import { getApiErrorMessage } from "../../lib/api";
import {
  formatTalentDate,
  initials,
} from "../../features/talent-pool/talentPool";
import "../../styles/talent-pool.css";

const EMPTY_FILTERS = { area: "", location: "", period: "", sort: "recent" };
const PAGE_SIZE = 12;

export default function AdminTalentPool() {
  const [talents, setTalents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, newLast30Days: 0, areas: 0 });
  const [facets, setFacets] = useState({ areas: [], locations: [] });
  const [pagination, setPagination] = useState({ total: 0, currentPage: 1, lastPage: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ talent: null, error: "" });
  const [detailReload, setDetailReload] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const response = await talentPoolApi.list({
          q: search || undefined,
          area: filters.area || undefined,
          location: filters.location || undefined,
          period: filters.period || undefined,
          sort: filters.sort,
          page,
          per_page: PAGE_SIZE,
        }, controller.signal);
        if (!active) return;
        setTalents(response.items);
        setSummary(response.summary);
        setFacets(response.facets);
        setPagination(response);
      } catch (requestError) {
        if (active && requestError.code !== "ERR_CANCELED") {
          setTalents([]);
          setError(getApiErrorMessage(requestError, "Não foi possível carregar os talentos. Tente novamente."));
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; controller.abort(); };
  }, [reload, search, filters, page]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [query]);
  useEffect(() => {
    if (!selected) return undefined;
    const controller = new AbortController();
    let active = true;
    talentPoolApi.detail(selected.id, controller.signal)
      .then((talent) => {
        if (active) setDetail({ talent, error: "" });
      })
      .catch((requestError) => {
        if (active && requestError.code !== "ERR_CANCELED") {
          setDetail({ talent: null, error: getApiErrorMessage(requestError, "Não foi possível carregar o perfil.") });
        }
      });
    return () => { active = false; controller.abort(); };
  }, [selected, detailReload]);
  const areas = facets.areas;
  const locations = facets.locations;
  const totalPages = pagination.lastPage;
  const currentPage = pagination.currentPage;
  const visible = talents;
  const resultCount = pagination.total;
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

      <section
        className="talent-admin-stats"
        aria-label="Indicadores do Banco de Talentos"
      >
        <div>
          <Users size={20} aria-hidden="true" />
          <span>Participantes ativos</span>
          <strong>{loading || error ? "—" : summary.total}</strong>
        </div>
        <div>
          <span>Entradas nos últimos 30 dias</span>
          <strong>{loading || error ? "—" : summary.newLast30Days}</strong>
        </div>
        <div>
          <span>Áreas representadas</span>
          <strong>{loading || error ? "—" : summary.areas}</strong>
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
          <h2>Talentos disponíveis</h2>
          <span role="status" aria-live="polite">
            {loading
              ? "Carregando…"
              : `${resultCount} resultado${resultCount === 1 ? "" : "s"}`}
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
        ) : error ? (
          <div role="alert" className="talent-admin-alert">
            {error}
            <button type="button" onClick={() => setReload((value) => value + 1)}>Tentar novamente</button>
          </div>
        ) : !resultCount ? (
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
                      setDetail({ talent: null, error: "" });
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
            Ver {resultCount} resultados
          </button>
        </TalentDialog>
      )}
      {selected && (
        <TalentDialog
          title="Perfil do talento"
          variant="talent-admin-dialog talent-drawer"
          onClose={closeDetail}
        >
          {!detail.talent && !detail.error ? (
            <div className="talent-skeleton" role="status">
              <p>Carregando perfil…</p><span /><span />
            </div>
          ) : detail.error ? (
            <div className="talent-admin-alert" role="alert">
              {detail.error}
              <button type="button" onClick={() => {
                setDetail({ talent: null, error: "" });
                setDetailReload((value) => value + 1);
              }}>Tentar novamente</button>
            </div>
          ) : (
            <>
              <TalentProfileSummary
                resume={detail.talent.resume}
                user={{ name: detail.talent.name, email: detail.talent.email, telefone: detail.talent.phone }}
                detailed
              />
              <section className="talent-detail-section">
                <h3>Interesses profissionais</h3>
                <div className="talent-tags">
                  {detail.talent.interests.map((area) => <span key={area}>{area}</span>)}
                </div>
                <dl className="talent-facts">
                  <div><dt>Entrada no banco</dt><dd>{formatTalentDate(detail.talent.joinedAt)}</dd></div>
                  <div><dt>Última atualização dos interesses</dt><dd>{formatTalentDate(detail.talent.updatedAt)}</dd></div>
                </dl>
              </section>
              {!detail.talent.resume && (
                <p className="talent-notice">O participante ainda não criou um currículo. Ele precisa de um currículo para ser indicado a uma vaga.</p>
              )}
              {referralOpen ? (
                <TalentReferral
                  key={detail.talent.id}
                  talent={detail.talent}
                  onComplete={(job) => {
                    setReferralOpen(false);
                    setFeedback("Indicação de " + detail.talent.name + " para " + job.title + " confirmada. O participante pode acompanhar o processo em suas candidaturas.");
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="talent-admin-button"
                  disabled={!detail.talent.resume}
                  onClick={() => setReferralOpen(true)}
                >
                  Indicar para vaga <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </TalentDialog>
      )}
    </AdminTalentLayout>
  );
}
