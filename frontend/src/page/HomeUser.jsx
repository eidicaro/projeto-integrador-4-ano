import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import CandidateHeader from "../components/CandidateHeader";
import Footer from "../components/Footer";
import JobModal from "../components/CandidateJobDetailsModal";
import api, { getApiErrorMessage } from "../lib/api";
import {
  extractAuthenticatedUser,
  getApplicationJobId,
  normalizeJob,
  unwrapApiData,
} from "../lib/candidate";
import {
  collectPaginatedItems,
  mergeUniqueById,
  readPaginatedResponse,
} from "../lib/pagination";
import "../styles/candidate-pages.css";

/**
 * HOMEUSER 2.0 — POINT MEDIA
 *
 * Substitui o componente HomeUser existente, sem exigir novas dependências.
 * Mantém os componentes CandidateHeader, Footer, CandidateJobDetailsModal,
 * as funções de normalização e os endpoints Laravel do código original.
 * Estilos isolados sob .point-user-dashboard, no final deste arquivo.
 */
const PAGE_SIZE = 50;
const ALL = "Todas as áreas";
const WORK_MODES = ["Todos", "Remoto", "Híbrido", "Presencial"];
const LEVELS = ["Todos", "Estágio", "Júnior", "Pleno", "Sênior"];
const ORDERS = [
  { value: "recent", label: "Mais recentes" },
  { value: "title", label: "Título (A–Z)" },
  { value: "company", label: "Empresa (A–Z)" },
  { value: "oldest", label: "Mais antigas" },
];

const ICONS = {
  search: <><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  arrow: <><path d="M4.5 12h15" /><path d="m13.5 6 6 6-6 6" /></>,
  arrowUp: <><path d="M6 18 18 6" /><path d="M8 6h10v10" /></>,
  bookmark: <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17l-6-4.5L6 21V4Z" />,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>,
  file: <><path d="M7 2.5h7l5 5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2Z" /><path d="M14 2.5V8h5M8 13h8M8 17h7" /></>,
  user: <><circle cx="12" cy="7.5" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  refresh: <><path d="M20 5v5h-5M4 19v-5h5" /><path d="M19 10a7 7 0 0 0-12-4L4 9M5 14a7 7 0 0 0 12 4l3-3" /></>,
  close: <path d="M5 5 19 19M19 5 5 19" />,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.4" /></>,
  sliders: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="17" r="2" fill="currentColor" stroke="none" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12" /><path d="M4 6h.02M4 12h.02M4 18h.02" strokeWidth="3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  phone: <path d="M8.2 3.2 5.1 4.5a2 2 0 0 0-1.2 2.2c1.4 6.5 6.8 11.9 13.3 13.3a2 2 0 0 0 2.2-1.2l1.3-3.1a1.6 1.6 0 0 0-.7-1.9l-3-1.7a1.6 1.6 0 0 0-1.9.3l-1.5 1.5a14 14 0 0 1-5.5-5.5l1.5-1.5a1.6 1.6 0 0 0 .3-1.9l-1.7-3a1.6 1.6 0 0 0-2-.8Z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5h.01" /></>,
  spark: <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z" />,
};

function Icon({ name, size = 19, solid = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name] || ICONS.spark}
    </svg>
  );
}

function safeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function searchable(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function initials(name) {
  const parts = safeText(name, "Candidato").split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0)).join("").toLocaleUpperCase("pt-BR");
}

function safeList(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\n•]/g)
      : [];
  return [...new Set(list.map((item) => safeText(item)).filter(Boolean))];
}

function getJobTags(job) {
  return safeList(job?.tags ?? job?.skills ?? []);
}

function getMode(job) {
  const raw = safeText(job?.workMode ?? job?.work_mode ?? job?.mode ?? job?.modalidade);
  if (raw) return raw;
  const source = searchable([job?.type, ...getJobTags(job)].join(" "));
  if (source.includes("hibrid")) return "Híbrido";
  if (source.includes("remot")) return "Remoto";
  if (source.includes("presencial")) return "Presencial";
  return "";
}

function getLevel(job) {
  const raw = safeText(job?.seniority ?? job?.level ?? job?.nivel);
  if (raw) return raw;
  const source = searchable(getJobTags(job).join(" "));
  if (source.includes("estagio")) return "Estágio";
  if (source.includes("junior")) return "Júnior";
  if (source.includes("pleno")) return "Pleno";
  if (source.includes("senior")) return "Sênior";
  return "";
}

function getDateValue(job) {
  const value = job?.publishedAt ?? job?.published_at ?? job?.createdAt ?? job?.created_at;
  if (!value) return 0;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T12:00:00` : value;
  const stamp = new Date(normalized).getTime();
  return Number.isFinite(stamp) ? stamp : 0;
}

function getDateLabel(job) {
  const stamp = getDateValue(job);
  if (!stamp) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(stamp);
}

function getSalary(job) {
  if (job?.salaryVisible === false || job?.salary_visible === false) return "";
  if (typeof job?.salary === "string" && job.salary.trim()) return job.salary.trim();
  const minimum = Number(job?.salaryMin ?? job?.salary_min);
  const maximum = Number(job?.salaryMax ?? job?.salary_max);
  const hasMin = job?.salaryMin != null || job?.salary_min != null;
  const hasMax = job?.salaryMax != null || job?.salary_max != null;
  const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  if (hasMin && hasMax && Number.isFinite(minimum) && Number.isFinite(maximum)) {
    return minimum === maximum ? formatter.format(minimum) : `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
  }
  if (hasMin && Number.isFinite(minimum)) return `A partir de ${formatter.format(minimum)}`;
  if (hasMax && Number.isFinite(maximum)) return `Até ${formatter.format(maximum)}`;
  return "";
}

function isCancelled(error, signal) {
  return signal?.aborted || error?.code === "ERR_CANCELED" || error?.name === "AbortError";
}

function getSavedId(item) {
  return item?.vaga?.id ?? item?.vagaId ?? item?.jobId ?? item?.vaga_id ?? item?.job_id ?? item?.id;
}

function safeFetchError(error, defaultMessage) {
  return getApiErrorMessage(error, defaultMessage);
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`pud-badge pud-badge--${tone}`}>{children}</span>;
}

function UserAvatar({ name, image }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [image]);
  return (
    <div className="pud-avatar" aria-hidden="true">
      {image && !broken
        ? <img src={image} alt="" onError={() => setBroken(true)} referrerPolicy="no-referrer" />
        : <span>{initials(name)}</span>}
    </div>
  );
}

function JobCard({ job, saved, applied, saving, onSave, onOpen, index }) {
  const title = safeText(job?.title, "Oportunidade sem título");
  const company = safeText(job?.company, "Point Media");
  const category = safeText(job?.category, "Outras oportunidades");
  const tags = getJobTags(job);
  const mode = getMode(job);
  const level = getLevel(job);
  const location = safeText(job?.location);
  const salary = getSalary(job);
  const description = safeText(job?.description);
  const isNew = getDateValue(job) > Date.now() - 3 * 86400000 && getDateValue(job) <= Date.now();
  const color = ["blue", "pink", "yellow", "violet", "green"][index % 5];

  return (
    <article className={`pud-job-card pud-job-card--${color}`}>
      <div className="pud-job-top">
        <div className="pud-company-symbol" aria-hidden="true">{initials(company)}</div>
        <span className="pud-job-category" title={category}>{category}</span>
        <button
          className={`pud-save-icon ${saved ? "is-saved" : ""}`}
          type="button"
          onClick={() => onSave(job)}
          disabled={saving}
          aria-busy={saving}
          aria-pressed={saved}
          aria-label={saved ? `Remover ${title} das vagas salvas` : `Salvar ${title}`}
          title={saved ? "Remover dos salvos" : "Salvar vaga"}
        >
          <Icon name="bookmark" size={19} solid={saved} />
        </button>
      </div>

      <div className="pud-job-meta">
        {isNew && <Badge tone="new">Nova</Badge>}
        {mode && <span>{mode}</span>}
        {level && <span>{level}</span>}
      </div>
      <h3 className="pud-job-title">{title}</h3>
      <p className="pud-job-company">{company}</p>
      {location && <p className="pud-job-location"><Icon name="pin" size={15} />{location}</p>}
      {description && <p className="pud-job-description">{description}</p>}
      <div className="pud-job-skills">
        {tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
        {tags.length > 3 && <span>+{tags.length - 3}</span>}
      </div>
      <div className="pud-job-bottom">
        <div className="pud-job-bottom-copy">
          {applied
            ? <Badge tone="applied"><Icon name="check" size={13} /> Candidatura enviada</Badge>
            : salary
              ? <><span>Faixa salarial</span><strong>{salary}</strong></>
              : <span className="pud-job-date"><Icon name="clock" size={14} />{getDateLabel(job)}</span>}
        </div>
        <button type="button" className="pud-job-open" onClick={() => onOpen(job)} aria-label={`Ver detalhes da vaga ${title}`}>
          Detalhes <Icon name="arrowUp" size={17} />
        </button>
      </div>
    </article>
  );
}

function LoadingCard() {
  return <div className="pud-job-card pud-skeleton" aria-hidden="true"><div className="pud-skeleton-square" /><div className="pud-skeleton-line" /><div className="pud-skeleton-line short" /><div className="pud-skeleton-line" /><div className="pud-skeleton-line" /></div>;
}

function EmptyState({ icon = "search", title, message, action, onAction }) {
  return (
    <section className="pud-empty" role="status">
      <span className="pud-empty-icon"><Icon name={icon} size={27} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && onAction && <button className="pud-btn pud-btn-outline" type="button" onClick={onAction}>{action} <Icon name="arrow" size={16} /></button>}
    </section>
  );
}

export default function HomeUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedJobId = location.state?.openJobId;
  const jobsSectionRef = useRef(null);
  const searchInputRef = useRef(null);
  const savingRef = useRef(new Set());
  const applyingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const lastOpenedJobRef = useRef(null);
  const [usuario, setUsuario] = useState(null);
  const [vagas, setVagas] = useState([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [curriculo, setCurriculo] = useState(null);
  const [candidaturas, setCandidaturas] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(() => new Set());
  const [vagaSelecionada, setVagaSelecionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [jobsError, setJobsError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");
  const [favoritesError, setFavoritesError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [jobsMoreError, setJobsMoreError] = useState("");
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [savingJobIds, setSavingJobIds] = useState(() => new Set());
  const [applyError, setApplyError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [feedback, setFeedback] = useState(() => {
    const message = location.state?.feedback;
    return typeof message === "string" ? { type: "success", message } : null;
  });

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [workMode, setWorkMode] = useState("Todos");
  const [level, setLevel] = useState("Todos");
  const [sortBy, setSortBy] = useState("recent");
  const [view, setView] = useState("todas");
  const [layout, setLayout] = useState("grid");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 160);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), feedback.type === "error" ? 9000 : 5800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const displayName = safeText(curriculo?.nome_completo ?? usuario?.name ?? usuario?.nome, "Candidato");
  const displayFirstName = displayName.split(/\s+/)[0];
  const email = safeText(curriculo?.email) || safeText(usuario?.email);
  const phone = safeText(curriculo?.telefone) || safeText(usuario?.telefone);
  const photo = safeText(curriculo?.foto) || safeText(usuario?.foto);
  const resumeExists = Boolean(curriculo?.id);

  const appliedJobIds = useMemo(() => new Set(
    candidaturas.map(getApplicationJobId)
      .filter((id) => id !== null && id !== undefined)
      .map(String),
  ), [candidaturas]);

  const categories = useMemo(() => {
    const count = new Map();
    vagas.forEach((job) => {
      const name = safeText(job?.category, "Outras oportunidades");
      count.set(name, (count.get(name) || 0) + 1);
    });
    return [{ name: ALL, count: vagas.length }, ...[...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")).map(([name, countValue]) => ({ name, count: countValue }))];
  }, [vagas]);

  const visibleJobs = useMemo(() => {
    const term = searchable(debouncedQuery);
    const result = vagas.filter((job) => {
      if (category !== ALL && safeText(job?.category, "Outras oportunidades") !== category) return false;
      if (workMode !== "Todos" && !searchable(getMode(job)).includes(searchable(workMode))) return false;
      if (level !== "Todos" && !searchable(getLevel(job)).includes(searchable(level))) return false;
      const id = String(job.id);
      if (view === "salvas" && !savedJobIds.has(id)) return false;
      if (view === "candidatadas" && !appliedJobIds.has(id)) return false;
      const searchableText = [
        job.title, job.company, job.category, job.location, job.description,
        getMode(job), getLevel(job), ...getJobTags(job),
      ].join(" ");
      return !term || searchable(searchableText).includes(term);
    });
    return result.sort((a, b) => {
      if (sortBy === "title") return safeText(a.title).localeCompare(safeText(b.title), "pt-BR");
      if (sortBy === "company") return safeText(a.company).localeCompare(safeText(b.company), "pt-BR");
      if (sortBy === "oldest") return getDateValue(a) - getDateValue(b);
      return getDateValue(b) - getDateValue(a);
    });
  }, [vagas, category, workMode, level, debouncedQuery, sortBy, view, savedJobIds, appliedJobIds]);

  const activeFilterCount = [query.trim() !== "", category !== ALL, workMode !== "Todos", level !== "Todos"].filter(Boolean).length;
  const loadErrorCount = [jobsError, applicationsError, favoritesError, resumeError].filter(Boolean).length;

  const scrollToJobs = useCallback((focusSearch = false) => {
    jobsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (focusSearch) window.setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 320);
  }, []);

  const goToResume = useCallback((vagaId = null) => {
    navigate("/createResume", { state: { redirectTo: "/homeUser", vagaId } });
  }, [navigate]);

  const closeJob = useCallback(() => {
    setVagaSelecionada(null);
    setApplyError("");
    setSaveError("");
  }, []);

  function refreshData() {
    setLoading(true);
    setFatalError("");
    setJobsMoreError("");
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const options = { signal: controller.signal };
    setLoading(true);
    setFatalError("");
    setJobsError("");
    setApplicationsError("");
    setFavoritesError("");
    setResumeError("");
    setJobsMoreError("");

    async function loadDashboard() {
      const calls = [
        api.get("/me", options),
        api.get("/vagas", { ...options, params: { page: 1, per_page: PAGE_SIZE } }),
        api.get("/curriculos/me", options),
        collectPaginatedItems((page) => api.get("/minhas-candidaturas", { ...options, params: { page, per_page: 100 } })),
        collectPaginatedItems((page) => api.get("/vagas-salvas", { ...options, params: { page, per_page: 50 } })),
      ];

      const [meResult, jobsResult, resumeResult, applicationsResult, favoritesResult] = await Promise.allSettled(calls);
      if (!active) return;

      if (meResult.status === "rejected") {
        if (!isCancelled(meResult.reason, controller.signal)) {
          setFatalError(safeFetchError(meResult.reason, "Não foi possível verificar sua sessão."));
        }
        setLoading(false);
        return;
      }

      const authenticatedUser = extractAuthenticatedUser(meResult.value);
      if (!authenticatedUser) {
        setFatalError("Sua sessão não retornou os dados do candidato. Entre novamente na plataforma.");
        setLoading(false);
        return;
      }
      setUsuario(authenticatedUser);

      if (jobsResult.status === "fulfilled") {
        try {
          const response = readPaginatedResponse(jobsResult.value);
          const loadedJobs = response.items
            .filter((item) => item?.id !== undefined && item?.id !== null)
            .map(normalizeJob)
            .filter(Boolean);
          setVagas(loadedJobs);
          setJobsPage(response.currentPage || 1);
          setJobsHasMore(Boolean(response.hasMore));
          setJobsTotal(Math.max(Number(response.total) || 0, loadedJobs.length));
          setJobsError("");
        } catch (error) {
          setVagas([]);
          setJobsError(safeFetchError(error, "Não foi possível interpretar as vagas recebidas."));
        }
      } else if (!isCancelled(jobsResult.reason, controller.signal)) {
        setVagas([]);
        setJobsError(safeFetchError(jobsResult.reason, "Não foi possível consultar as vagas disponíveis."));
      }

      if (resumeResult.status === "fulfilled") {
        const raw = unwrapApiData(resumeResult.value);
        setCurriculo(raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null);
      } else {
        setCurriculo(null);
        if (resumeResult.reason?.response?.status !== 404 && !isCancelled(resumeResult.reason, controller.signal)) {
          setResumeError(safeFetchError(resumeResult.reason, "O currículo não pôde ser consultado."));
        }
      }

      if (applicationsResult.status === "fulfilled" && Array.isArray(applicationsResult.value)) {
        setCandidaturas(applicationsResult.value);
      } else if (!isCancelled(applicationsResult.reason, controller.signal)) {
        setCandidaturas([]);
        setApplicationsError(safeFetchError(applicationsResult.reason, "Não foi possível consultar suas candidaturas."));
      }

      if (favoritesResult.status === "fulfilled" && Array.isArray(favoritesResult.value)) {
        setSavedJobIds(new Set(favoritesResult.value
          .map(getSavedId)
          .filter((id) => id !== null && id !== undefined)
          .map(String)));
      } else if (!isCancelled(favoritesResult.reason, controller.signal)) {
        setSavedJobIds(new Set());
        setFavoritesError(safeFetchError(favoritesResult.reason, "Não foi possível consultar as vagas salvas."));
      }

      setLastUpdated(new Date());
      setLoading(false);
    }
    loadDashboard().catch((error) => {
      if (!active || isCancelled(error, controller.signal)) return;
      setFatalError(safeFetchError(error, "Ocorreu um erro inesperado ao atualizar seu painel."));
      setLoading(false);
    });

    return () => { active = false; controller.abort(); };
  }, [reloadKey]);

  useEffect(() => {
    if (loading || requestedJobId === null || requestedJobId === undefined) return;
    const marker = String(requestedJobId);
    if (lastOpenedJobRef.current === marker) return;
    const requested = vagas.find((job) => String(job.id) === marker);
    if (requested) {
      lastOpenedJobRef.current = marker;
      setVagaSelecionada(requested);
    }
  }, [requestedJobId, loading, vagas]);

  async function loadMoreJobs() {
    if (loadingMoreRef.current || !jobsHasMore || loading) return;
    loadingMoreRef.current = true;
    setJobsLoadingMore(true);
    setJobsMoreError("");
    try {
      const response = await api.get("/vagas", { params: { page: jobsPage + 1, per_page: PAGE_SIZE } });
      const data = readPaginatedResponse(response);
      const loadedJobs = data.items
        .filter((item) => item?.id !== null && item?.id !== undefined)
        .map(normalizeJob)
        .filter(Boolean);
      setVagas((current) => mergeUniqueById(current, loadedJobs));
      setJobsPage(data.currentPage || jobsPage + 1);
      setJobsHasMore(Boolean(data.hasMore));
      setJobsTotal((current) => Math.max(current, Number(data.total) || 0));
    } catch (error) {
      setJobsMoreError(safeFetchError(error, "Não foi possível carregar mais vagas."));
    } finally {
      loadingMoreRef.current = false;
      setJobsLoadingMore(false);
    }
  }

  async function handleToggleSaved(job) {
    if (!job?.id || favoritesError) return;
    const id = String(job.id);
    if (savingRef.current.has(id)) return;
    savingRef.current.add(id);
    setSavingJobIds((current) => new Set(current).add(id));
    setSaveError("");
    const saved = savedJobIds.has(id);
    try {
      const endpoint = `/vagas/${encodeURIComponent(id)}/salvar`;
      if (saved) await api.delete(endpoint);
      else await api.put(endpoint);
      setSavedJobIds((current) => {
        const next = new Set(current);
        if (saved) next.delete(id); else next.add(id);
        return next;
      });
      setFeedback({ type: "success", message: saved ? "Vaga removida da sua lista de salvas." : "Vaga adicionada à sua lista de salvas." });
    } catch (error) {
      const message = safeFetchError(error, "Não foi possível atualizar as vagas salvas.");
      setSaveError(message);
      setFeedback({ type: "error", message });
    } finally {
      savingRef.current.delete(id);
      setSavingJobIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleApply(job, resumeChoice = { source: "online" }) {
    if (!job?.id || applyingRef.current || appliedJobIds.has(String(job.id))) return;
    const source = resumeChoice?.source || "online";
    if (source === "online" && !curriculo?.id) {
      closeJob();
      goToResume(job.id);
      return;
    }
    if (source !== "online" && !resumeChoice?.file) {
      setApplyError("Selecione o arquivo de currículo antes de enviar sua candidatura.");
      return;
    }

    applyingRef.current = true;
    setApplyingJobId(job.id);
    setApplyError("");
    try {
      const formData = new FormData();
      formData.append("curriculo_origem", source);
      if (source === "online") formData.append("curriculo_id", String(curriculo.id));
      else formData.append("curriculo_arquivo", resumeChoice.file);
      const response = await api.post(`/vagas/${encodeURIComponent(job.id)}/candidaturas`, formData);
      const data = unwrapApiData(response);
      const application = data && typeof data === "object" && !Array.isArray(data) ? data : {};
      setCandidaturas((current) => [...current, { ...application, jobId: job.id }]);
      setFeedback({ type: "success", message: `Sua candidatura para ${job.title} foi enviada com sucesso.` });
      closeJob();
    } catch (error) {
      setApplyError(safeFetchError(error, "Não foi possível enviar sua candidatura."));
    } finally {
      applyingRef.current = false;
      setApplyingJobId(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setCategory(ALL);
    setWorkMode("Todos");
    setLevel("Todos");
  }

  function selectView(next) {
    setView(next);
    setCategory(ALL);
    setQuery("");
    setWorkMode("Todos");
    setLevel("Todos");
    scrollToJobs();
  }

  const currentJob = vagaSelecionada;
  const selectedJobSaved = currentJob ? savedJobIds.has(String(currentJob.id)) : false;
  const selectedJobApplied = currentJob ? appliedJobIds.has(String(currentJob.id)) : false;
  const selectedJobSaving = currentJob ? savingJobIds.has(String(currentJob.id)) : false;
  const selectedJobApplying = currentJob ? String(applyingJobId) === String(currentJob.id) : false;

  return (
    <div className="candidate-page point-user-dashboard">
      <style>{dashboardStyles}</style>
      <CandidateHeader />

      {loading ? (
        <main className="pud-container pud-loading-main" role="status" aria-live="polite">
          <div className="pud-loading-panel"><span className="pud-loader" /><h1>Preparando seu painel</h1><p>Estamos consultando suas oportunidades e os dados da sua conta.</p></div>
        </main>
      ) : fatalError ? (
        <main className="pud-container pud-loading-main">
          <div className="pud-loading-panel" role="alert"><div className="pud-state-icon"><Icon name="info" size={26} /></div><h1>Não foi possível abrir seu painel</h1><p>{fatalError}</p><button type="button" className="pud-btn pud-btn-primary" onClick={refreshData}>Tentar novamente <Icon name="refresh" size={17} /></button></div>
        </main>
      ) : (
        <main className="pud-container">
          {feedback && (
            <div className={`pud-alert pud-alert--${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
              <Icon name={feedback.type === "error" ? "info" : "check"} size={18} />
              <span>{feedback.message}</span>
              <button type="button" onClick={() => setFeedback(null)} aria-label="Fechar aviso"><Icon name="close" size={17} /></button>
            </div>
          )}

          <section className="pud-hero" aria-labelledby="pud-welcome-title">
            <div className="pud-hero-intro">
              <span className="pud-eyebrow pud-eyebrow-light"><span className="pud-eyebrow-dot" /> SEU ESPAÇO PROFISSIONAL</span>
              <p className="pud-greeting">Olá, {displayFirstName} <span aria-hidden="true">✳</span></p>
              <h1 id="pud-welcome-title">O próximo passo da sua carreira começa aqui.</h1>
              <p className="pud-hero-description">Explore oportunidades, organize suas candidaturas e mantenha seu perfil sempre pronto para novas conexões.</p>
              <div className="pud-hero-actions">
                <button type="button" className="pud-btn pud-btn-primary" onClick={() => scrollToJobs(true)}>Explorar vagas <Icon name="arrow" size={17} /></button>
                <button type="button" className="pud-btn pud-btn-dark" onClick={() => goToResume()}>{resumeExists ? "Editar currículo" : "Criar currículo"} <Icon name="arrowUp" size={17} /></button>
              </div>
              <span className="pud-hero-stamp">POINT MEDIA <span>◆</span> CONECTANDO TALENTOS</span>
            </div>

            <div className="pud-profile-card">
              <div className="pud-profile-heading"><span>SEU PERFIL</span><Badge tone={resumeExists ? "applied" : "soft"}>{resumeExists ? "Currículo criado" : "Comece seu currículo"}</Badge></div>
              <div className="pud-profile-identity">
                <UserAvatar name={displayName} image={photo} />
                <div><strong title={displayName}>{displayName}</strong><span>Candidato Point Media</span></div>
              </div>
              <div className="pud-profile-divider" />
              <div className="pud-profile-details">
                {email && <div><Icon name="mail" size={17} /><span title={email}>{email}</span></div>}
                {phone && <div><Icon name="phone" size={17} /><span>{phone}</span></div>}
              </div>
              <div className="pud-profile-next"><span>{resumeExists ? "Seu currículo está disponível para candidaturas." : resumeError ? "Não foi possível consultar seu currículo." : "Cadastre seu currículo para agilizar candidaturas."}</span><button type="button" onClick={() => goToResume()} aria-label="Abrir meu currículo"><Icon name="arrowUp" size={20} /></button></div>
            </div>
          </section>

          <section className="pud-overview" aria-label="Resumo da sua jornada">
            <Link className="pud-stat pud-stat--yellow" to="/createResume">
              <span className="pud-stat-top"><span>01 / CURRÍCULO</span><Icon name="file" size={20} /></span>
              <strong>{resumeError ? "Indisponível" : resumeExists ? "Tudo pronto" : "Comece por aqui"}</strong>
              <small>{resumeExists ? "Revise suas experiências e competências." : "Apresente suas experiências e habilidades."}</small>
              <span className="pud-stat-link">{resumeExists ? "Editar currículo" : "Criar currículo"} <Icon name="arrow" size={16} /></span>
            </Link>
            <Link className="pud-stat pud-stat--blue" to="/candidaturas">
              <span className="pud-stat-top"><span>02 / PROCESSOS</span><Icon name="briefcase" size={20} /></span>
              <strong>{applicationsError ? "—" : candidaturas.length} <span>{applicationsError ? "Indisponível" : candidaturas.length === 1 ? "candidatura" : "candidaturas"}</span></strong>
              <small>Acompanhe suas inscrições e próximas etapas.</small>
              <span className="pud-stat-link">Ver candidaturas <Icon name="arrow" size={16} /></span>
            </Link>
            <Link className="pud-stat pud-stat--pink" to="/vagas-salvas">
              <span className="pud-stat-top"><span>03 / SALVAS</span><Icon name="bookmark" size={20} /></span>
              <strong>{favoritesError ? "—" : savedJobIds.size} <span>{favoritesError ? "Indisponível" : savedJobIds.size === 1 ? "vaga salva" : "vagas salvas"}</span></strong>
              <small>Continue de onde parou, sem perder oportunidades.</small>
              <span className="pud-stat-link">Abrir favoritas <Icon name="arrow" size={16} /></span>
            </Link>
            <Link className="pud-stat pud-stat--mint" to="/perfil">
              <span className="pud-stat-top"><span>04 / CONTA</span><Icon name="user" size={20} /></span>
              <strong>Seu perfil</strong>
              <small>Dados pessoais, acesso e preferências da conta.</small>
              <span className="pud-stat-link">Gerenciar conta <Icon name="arrow" size={16} /></span>
            </Link>
          </section>

          {loadErrorCount > 0 && (
            <div className="pud-notice" role="status"><Icon name="info" size={19} /><div><strong>Algumas informações não puderam ser atualizadas.</strong><span>{[jobsError && "Vagas", applicationsError && "Candidaturas", favoritesError && "Salvas", resumeError && "Currículo"].filter(Boolean).join(" · ")}. Você pode tentar novamente sem sair da página.</span></div><button type="button" onClick={refreshData}>Atualizar <Icon name="refresh" size={16} /></button></div>
          )}

          <section className="pud-radar" id="radar-vagas" ref={jobsSectionRef} aria-labelledby="pud-radar-title">
            <div className="pud-section-header">
              <div><span className="pud-eyebrow"><span className="pud-eyebrow-dot" /> OPORTUNIDADES ABERTAS</span><h2 id="pud-radar-title">Seu radar de vagas<span className="pud-period">.</span></h2><p>Encontre oportunidades que façam sentido para sua trajetória.</p></div>
              <div className="pud-section-counter"><strong>{jobsError ? "—" : jobsTotal}</strong><span>{jobsTotal === 1 ? "vaga publicada" : "vagas publicadas"}</span></div>
            </div>

            <div className="pud-search-panel">
              <div className="pud-search-field"><Icon name="search" size={22} /><input ref={searchInputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por cargo, tecnologia, empresa ou cidade" aria-label="Buscar vagas" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca"><Icon name="close" size={17} /></button>}</div>
              <div className="pud-select-controls">
                <label>Modalidade<select value={workMode} onChange={(event) => setWorkMode(event.target.value)}>{WORK_MODES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label>Experiência<select value={level} onChange={(event) => setLevel(event.target.value)}>{LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              </div>
            </div>

            <div className="pud-radar-tabs" role="group" aria-label="Visualizar oportunidades">
              <button type="button" className={view === "todas" ? "is-active" : ""} aria-pressed={view === "todas"} onClick={() => selectView("todas")}>Todas as vagas</button>
              <button type="button" className={view === "salvas" ? "is-active" : ""} aria-pressed={view === "salvas"} onClick={() => selectView("salvas")}><Icon name="bookmark" size={17} /> Salvas {!favoritesError && <span>{savedJobIds.size}</span>}</button>
              <button type="button" className={view === "candidatadas" ? "is-active" : ""} aria-pressed={view === "candidatadas"} onClick={() => selectView("candidatadas")}><Icon name="check" size={17} /> Candidatadas {!applicationsError && <span>{appliedJobIds.size}</span>}</button>
            </div>

            <div className="pud-category-list" role="group" aria-label="Filtrar vagas por área">
              {categories.map((item) => <button type="button" key={item.name} className={category === item.name ? "is-active" : ""} aria-pressed={category === item.name} onClick={() => setCategory(item.name)}>{item.name}<span>{item.count}</span></button>)}
            </div>

            <div className="pud-results-bar">
              <div className="pud-result-info"><strong>{visibleJobs.length}</strong> {visibleJobs.length === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}{jobsHasMore && <span className="pud-results-loaded"> · {vagas.length} de {jobsTotal} carregadas</span>}</div>
              <div className="pud-results-actions">
                {activeFilterCount > 0 && <button type="button" className="pud-clear" onClick={resetFilters}>Limpar filtros ({activeFilterCount})</button>}
                <label className="pud-sort"><span>Ordenar:</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>{ORDERS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
                <div className="pud-layout-switch" role="group" aria-label="Layout das vagas"><button type="button" title="Visualização em grade" aria-pressed={layout === "grid"} className={layout === "grid" ? "is-active" : ""} onClick={() => setLayout("grid")}><Icon name="grid" size={18} /></button><button type="button" title="Visualização em lista" aria-pressed={layout === "list"} className={layout === "list" ? "is-active" : ""} onClick={() => setLayout("list")}><Icon name="list" size={18} /></button></div>
                <button type="button" className="pud-update" onClick={refreshData} aria-label="Atualizar o painel" title="Atualizar oportunidades"><Icon name="refresh" size={17} /></button>
              </div>
            </div>

            {view === "salvas" && favoritesError ? (
              <EmptyState icon="info" title="Não foi possível consultar suas vagas salvas" message={favoritesError} action="Tentar novamente" onAction={refreshData} />
            ) : view === "candidatadas" && applicationsError ? (
              <EmptyState icon="info" title="Não foi possível consultar suas candidaturas" message={applicationsError} action="Tentar novamente" onAction={refreshData} />
            ) : jobsError ? (
              <EmptyState icon="refresh" title="O radar está temporariamente indisponível" message={jobsError} action="Atualizar radar" onAction={refreshData} />
            ) : visibleJobs.length > 0 ? (
              <div className={`pud-jobs-grid ${layout === "list" ? "pud-jobs-grid--list" : ""}`}>
                {visibleJobs.map((job, index) => <JobCard key={job.id} job={job} index={index} applied={appliedJobIds.has(String(job.id))} saved={savedJobIds.has(String(job.id))} saving={Boolean(favoritesError) || savingJobIds.has(String(job.id))} onSave={handleToggleSaved} onOpen={(value) => { setApplyError(""); setSaveError(""); setVagaSelecionada(value); }} />)}
              </div>
            ) : vagas.length === 0 ? (
              <EmptyState icon="briefcase" title="Ainda não há vagas publicadas" message="Assim que novas oportunidades forem disponibilizadas, elas aparecerão neste espaço." action="Atualizar radar" onAction={refreshData} />
            ) : view === "salvas" && activeFilterCount === 0 ? (
              savedJobIds.size === 0
                ? <EmptyState icon="bookmark" title="Sua coleção de vagas está vazia" message="Salve oportunidades interessantes para consultá-las quando quiser." action="Explorar oportunidades" onAction={() => selectView("todas")} />
                : <EmptyState icon="bookmark" title="Suas vagas salvas estão em outra página" message={`Você tem ${savedJobIds.size} vaga(s) salva(s). Esta visualização mostra apenas as vagas já carregadas no radar.`} action="Abrir todas as salvas" onAction={() => navigate("/vagas-salvas")} />
            ) : view === "candidatadas" && activeFilterCount === 0 ? (
              <EmptyState icon="check" title="Nenhuma candidatura entre as vagas carregadas" message="Quando você se candidatar a uma vaga, ela aparecerá aqui se estiver entre as oportunidades carregadas." action="Ver todas as vagas" onAction={() => selectView("todas")} />
            ) : (
              <EmptyState icon="sliders" title="Nenhuma oportunidade com esses filtros" message="Tente outra palavra-chave, área ou modalidade. Os filtros consideram as vagas já carregadas." action="Limpar filtros" onAction={resetFilters} />
            )}

            {jobsMoreError && <p className="pud-more-error" role="alert">{jobsMoreError}</p>}
            {!jobsError && jobsHasMore && <div className="pud-more-area"><button type="button" className="pud-btn pud-btn-outline" onClick={loadMoreJobs} disabled={jobsLoadingMore} aria-busy={jobsLoadingMore}>{jobsLoadingMore ? "Carregando..." : `Carregar mais vagas (${vagas.length} de ${jobsTotal})`} <Icon name={jobsLoadingMore ? "refresh" : "arrow"} size={17} /></button><small>Busca e filtros são aplicados às vagas já carregadas.</small></div>}
          </section>

          <section className="pud-next-section" aria-label="Continue sua jornada">
            <div className="pud-next-main"><span className="pud-eyebrow"><span className="pud-eyebrow-dot" /> CONTINUE DE ONDE PAROU</span><h2>Sua trajetória está em movimento.</h2><p>{resumeExists ? "Mantenha suas informações atualizadas e acompanhe cada processo seletivo." : "Um currículo bem estruturado ajuda você a apresentar seu potencial aos recrutadores."}</p><button type="button" className="pud-btn pud-btn-primary" onClick={() => goToResume()}>{resumeExists ? "Revisar meu currículo" : "Montar meu currículo"} <Icon name="arrow" size={17} /></button></div>
            <div className="pud-next-links"><Link to="/candidaturas"><span><Icon name="briefcase" size={20} /> Minhas candidaturas</span><Icon name="arrowUp" size={19} /></Link><Link to="/vagas-salvas"><span><Icon name="bookmark" size={20} /> Vagas salvas</span><Icon name="arrowUp" size={19} /></Link><Link to="/banco-de-talentos"><span><Icon name="spark" size={20} /> Banco de Talentos</span><Icon name="arrowUp" size={19} /></Link><Link to="/perfil"><span><Icon name="user" size={20} /> Meu perfil</span><Icon name="arrowUp" size={19} /></Link></div>
          </section>
          {lastUpdated && <p className="pud-last-updated">Painel atualizado às {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(lastUpdated)}.</p>}
        </main>
      )}

      <JobModal
        key={`${vagaSelecionada?.id ?? "sem-vaga"}-${Boolean(vagaSelecionada)}-${curriculo?.id ?? "sem-curriculo"}`}
        vaga={vagaSelecionada}
        aberto={Boolean(vagaSelecionada)}
        fechar={closeJob}
        onApply={handleApply}
        applying={selectedJobApplying}
        applied={selectedJobApplied}
        applyError={applyError}
        onSave={handleToggleSaved}
        saving={selectedJobSaving || Boolean(favoritesError)}
        saved={selectedJobSaved}
        saveError={saveError || (favoritesError && vagaSelecionada ? favoritesError : "")}
        hasOnlineResume={resumeExists}
      />
      <Footer />
    </div>
  );
}

const dashboardStyles = `
/* POINT MEDIA — HOMEUSER 2.0 | Isolado para não afetar as outras páginas */
.point-user-dashboard {
  --pud-ink: #151b2b;
  --pud-muted: #6b7386;
  --pud-border: #d9deeb;
  --pud-pink: #ea3484;
  --pud-blue: #6bc8f2;
  --pud-yellow: #ffdb62;
  --pud-lime: #d7f5a1;
  --pud-white: #fffefa;
  min-height: 100vh;
  background: #f4f6fa;
  color: var(--pud-ink);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.point-user-dashboard, .point-user-dashboard * { box-sizing: border-box; }
.point-user-dashboard button, .point-user-dashboard select, .point-user-dashboard input { font: inherit; }
.point-user-dashboard button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.point-user-dashboard button:disabled { cursor: not-allowed; opacity: .6; }
.point-user-dashboard :is(button, input, select, a):focus-visible { outline: 3px solid #7c83ff; outline-offset: 3px; }
.point-user-dashboard .pud-container { width: min(100% - 48px, 1280px); margin: 0 auto; padding: 36px 0 70px; }
.point-user-dashboard .pud-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 47px; padding: 12px 19px; border: 1.5px solid var(--pud-ink); border-radius: 11px; font-size: 13px; font-weight: 800; text-decoration: none; transition: background .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease; }
.point-user-dashboard .pud-btn:not(:disabled):hover { transform: translateY(-2px); }
.point-user-dashboard .pud-btn-primary { color: #fff; background: var(--pud-pink); border-color: var(--pud-pink); box-shadow: 0 5px 18px rgba(234,52,132,.22); }
.point-user-dashboard .pud-btn-primary:hover { background: #d72473; }
.point-user-dashboard .pud-btn-dark { color: #fff; background: transparent; border-color: rgba(255,255,255,.35); }
.point-user-dashboard .pud-btn-dark:hover { background: rgba(255,255,255,.09); }
.point-user-dashboard .pud-btn-outline { background: #fff; color: var(--pud-ink); }
.point-user-dashboard .pud-btn-outline:hover { background: #fff0f7; }
.point-user-dashboard .pud-eyebrow { display: inline-flex; align-items: center; gap: 9px; color: #df2f79; font-size: 11px; font-weight: 900; letter-spacing: .145em; }
.point-user-dashboard .pud-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: #f04a91; box-shadow: 0 0 0 4px #ffe2ef; }
.point-user-dashboard .pud-eyebrow-light { color: #f6bed9; }
.point-user-dashboard .pud-eyebrow-light .pud-eyebrow-dot { box-shadow: 0 0 0 4px rgba(239,91,161,.18); }
.point-user-dashboard .pud-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0,1fr) minmax(300px,410px); gap: 36px; align-items: center; padding: clamp(26px,5vw,57px); min-height: 344px; border: 1.5px solid #171827; border-radius: 25px; background: #141725; box-shadow: 8px 8px 0 #9180ff; isolation: isolate; }
.point-user-dashboard .pud-hero:before { content: ""; position: absolute; z-index: -1; right: 17%; top: -160px; width: 410px; height: 410px; border: 1px solid rgba(255,255,255,.05); border-radius: 50%; background: radial-gradient(circle, rgba(135,104,241,.12), transparent 67%); pointer-events: none; }
.point-user-dashboard .pud-hero:after { content: ""; position: absolute; width: 115px; height: 115px; border: 19px solid rgba(233,57,135,.16); border-radius: 50%; left: 48%; bottom: -90px; pointer-events: none; }
.point-user-dashboard .pud-hero-intro { min-width: 0; position: relative; z-index: 1; }
.point-user-dashboard .pud-greeting { margin: 21px 0 10px; color: #e6e7f3; font-weight: 700; font-size: 16px; }
.point-user-dashboard .pud-greeting span { margin-left: 3px; color: #ffd561; }
.point-user-dashboard .pud-hero h1 { max-width: 700px; margin: 0; color: #fff; font-size: clamp(30px,3.3vw,47px); line-height: 1.09; letter-spacing: -.052em; font-weight: 850; }
.point-user-dashboard .pud-hero-description { max-width: 540px; margin: 16px 0 22px; color: #b8becd; font-size: 14px; line-height: 1.74; }
.point-user-dashboard .pud-hero-actions { display: flex; gap: 11px; flex-wrap: wrap; }
.point-user-dashboard .pud-hero-stamp { display: inline-flex; gap: 8px; margin-top: 31px; color: #81869b; font-size: 10px; letter-spacing: .155em; font-weight: 800; }
.point-user-dashboard .pud-hero-stamp span { color: #ea3484; }
.point-user-dashboard .pud-profile-card { position: relative; z-index: 1; display: flex; flex-direction: column; min-width: 0; padding: 23px; background: #fafbff; border: 1px solid rgba(255,255,255,.36); border-radius: 19px; box-shadow: 0 20px 55px rgba(0,0,0,.2); }
.point-user-dashboard .pud-profile-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.point-user-dashboard .pud-profile-heading > span { color: #798092; font-size: 11px; letter-spacing: .12em; font-weight: 900; }
.point-user-dashboard .pud-badge { display: inline-flex; align-items: center; gap: 4px; padding: 6px 9px; border-radius: 999px; background: #eff1f6; color: #596379; font-size: 10px; font-weight: 800; white-space: nowrap; }
.point-user-dashboard .pud-badge--applied { background: #e7f7e7; color: #247443; }
.point-user-dashboard .pud-badge--soft { background: #ffe5f0; color: #b32361; }
.point-user-dashboard .pud-badge--new { background: #fff0bb; color: #715313; }
.point-user-dashboard .pud-profile-identity { display: flex; align-items: center; gap: 14px; min-width: 0; margin-top: 25px; }
.point-user-dashboard .pud-avatar { display: grid; place-items: center; flex: 0 0 66px; width: 66px; height: 66px; border: 3px solid #1c2130; border-radius: 19px; background: linear-gradient(135deg, #81c7f3, #ee79a7); color: #fff; font-size: 26px; font-weight: 900; box-shadow: 3px 4px 0 #eadbf6; overflow: hidden; }
.point-user-dashboard .pud-avatar img { display: block; width: 100%; height: 100%; object-fit: cover; }
.point-user-dashboard .pud-profile-identity > div:last-child { min-width: 0; }
.point-user-dashboard .pud-profile-identity strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 19px; letter-spacing: -.025em; }
.point-user-dashboard .pud-profile-identity > div:last-child > span { display: block; margin-top: 4px; color: #798092; font-size: 12px; }
.point-user-dashboard .pud-profile-divider { height: 1px; margin: 23px 0 18px; background: #e4e7f0; }
.point-user-dashboard .pud-profile-details { display: flex; flex-direction: column; gap: 11px; }
.point-user-dashboard .pud-profile-details > div { display: flex; align-items: center; gap: 10px; min-width: 0; color: #576073; font-size: 12px; }
.point-user-dashboard .pud-profile-details > div svg { flex: 0 0 auto; color: #b74982; }
.point-user-dashboard .pud-profile-details > div span { min-width: 0; overflow-wrap: anywhere; }
.point-user-dashboard .pud-profile-next { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 20px; padding: 13px; background: #edf5ff; border-radius: 12px; }
.point-user-dashboard .pud-profile-next span { color: #56627b; font-size: 11px; font-weight: 700; line-height: 1.45; }
.point-user-dashboard .pud-profile-next button { display: grid; place-items: center; flex: 0 0 34px; height: 34px; width: 34px; padding: 0; color: #fff; background: #171b2a; border: 0; border-radius: 10px; }
.point-user-dashboard .pud-overview { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; margin: 40px 0 82px; }
.point-user-dashboard .pud-stat { display: flex; flex-direction: column; min-width: 0; min-height: 190px; padding: 22px; border: 1.5px solid #181d2b; border-radius: 17px; color: var(--pud-ink); box-shadow: 4px 5px 0 #1a1d2a; text-decoration: none; transition: transform .2s ease, box-shadow .2s ease; }
.point-user-dashboard .pud-stat:hover { transform: translate(-2px,-3px); box-shadow: 6px 8px 0 #1a1d2a; }
.point-user-dashboard .pud-stat--yellow { background: #ffdf76; }
.point-user-dashboard .pud-stat--blue { background: #d4efff; }
.point-user-dashboard .pud-stat--pink { background: #fbd7e5; }
.point-user-dashboard .pud-stat--mint { background: #e2f7c7; }
.point-user-dashboard .pud-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 10px; font-weight: 900; letter-spacing: .1em; }
.point-user-dashboard .pud-stat > strong { margin-top: 23px; font-size: clamp(20px,2.05vw,26px); line-height: 1.15; font-weight: 850; letter-spacing: -.04em; }
.point-user-dashboard .pud-stat > strong span { font-size: .78em; letter-spacing: -.02em; }
.point-user-dashboard .pud-stat > small { display: block; min-height: 38px; margin: 7px 0 16px; font-size: 12px; line-height: 1.5; color: #4d5363; }
.point-user-dashboard .pud-stat-link { display: flex; align-items: center; gap: 9px; margin-top: auto; font-size: 12px; font-weight: 900; }
.point-user-dashboard .pud-stat-link svg { transition: transform .2s ease; }
.point-user-dashboard .pud-stat:hover .pud-stat-link svg { transform: translateX(3px); }
.point-user-dashboard .pud-notice { display: flex; align-items: flex-start; gap: 13px; padding: 16px 18px; margin: -42px 0 50px; background: #fff; border: 1px solid #e1d5b4; border-left: 4px solid #e4a936; border-radius: 11px; }
.point-user-dashboard .pud-notice > svg { flex: 0 0 auto; color: #ae8024; }
.point-user-dashboard .pud-notice > div { flex: 1; min-width: 0; }
.point-user-dashboard .pud-notice strong, .point-user-dashboard .pud-notice span { display: block; font-size: 12px; line-height: 1.5; }
.point-user-dashboard .pud-notice span { color: var(--pud-muted); margin-top: 3px; }
.point-user-dashboard .pud-notice button { flex: 0 0 auto; display: flex; align-items: center; gap: 7px; padding: 5px; background: transparent; border: 0; color: #654b12; font-size: 12px; font-weight: 900; }
.point-user-dashboard .pud-radar { scroll-margin-top: 100px; }
.point-user-dashboard .pud-section-header { display: flex; align-items: end; justify-content: space-between; gap: 22px; padding-bottom: 25px; border-bottom: 1.5px solid #252b3b; }
.point-user-dashboard .pud-section-header h2 { margin: 13px 0 7px; color: #161b2b; font-size: clamp(32px,4.3vw,54px); letter-spacing: -.06em; font-weight: 850; line-height: 1.06; }
.point-user-dashboard .pud-period { color: var(--pud-pink); }
.point-user-dashboard .pud-section-header p { margin: 0; font-size: 14px; color: #737b8c; line-height: 1.6; }
.point-user-dashboard .pud-section-counter { display: flex; flex-direction: column; align-items: end; flex: 0 0 auto; padding-bottom: 4px; }
.point-user-dashboard .pud-section-counter strong { font-size: 30px; font-weight: 900; letter-spacing: -.06em; }
.point-user-dashboard .pud-section-counter span { color: #778092; font-size: 11px; font-weight: 750; }
.point-user-dashboard .pud-search-panel { display: flex; align-items: stretch; gap: 12px; margin-top: 24px; }
.point-user-dashboard .pud-search-field { display: flex; align-items: center; gap: 10px; flex: 1 1 340px; min-width: 0; min-height: 56px; padding: 0 16px; border: 1.5px solid #c8cedc; border-radius: 11px; background: #fff; transition: border-color .2s ease, box-shadow .2s ease; }
.point-user-dashboard .pud-search-field:focus-within { border-color: #e53683; box-shadow: 0 0 0 3px #f9dce8; }
.point-user-dashboard .pud-search-field > svg { flex: 0 0 auto; color: #6b768c; }
.point-user-dashboard .pud-search-field input { flex: 1; min-width: 0; padding: 15px 0; outline: none; border: 0; background: transparent; color: #141b2a; font-size: 13px; }
.point-user-dashboard .pud-search-field input::placeholder { color: #9aa3b3; }
.point-user-dashboard .pud-search-field button { display: grid; place-items: center; background: #eef1f7; border: 0; border-radius: 8px; padding: 6px; }
.point-user-dashboard .pud-select-controls { display: flex; align-items: stretch; gap: 12px; flex: 0 0 auto; }
.point-user-dashboard .pud-select-controls label { display: flex; flex-direction: column; justify-content: center; gap: 4px; min-width: 155px; padding: 8px 13px; background: #fff; border: 1.5px solid #c8cedc; border-radius: 11px; color: #7c8495; font-size: 10px; font-weight: 800; }
.point-user-dashboard .pud-select-controls select { display: block; max-width: 100%; border: 0; outline: none; color: #172034; background: transparent; font-size: 13px; font-weight: 800; }
.point-user-dashboard .pud-radar-tabs { display: flex; gap: 22px; margin-top: 24px; border-bottom: 1px solid #dadee7; }
.point-user-dashboard .pud-radar-tabs button { display: inline-flex; align-items: center; gap: 7px; position: relative; padding: 0 0 14px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: #758096; font-size: 13px; font-weight: 800; white-space: nowrap; }
.point-user-dashboard .pud-radar-tabs button.is-active { border-bottom-color: var(--pud-pink); color: #151b2b; }
.point-user-dashboard .pud-radar-tabs button span { display: inline-grid; place-items: center; height: 20px; min-width: 20px; padding: 0 5px; border-radius: 999px; background: #e9edf5; color: #69738a; font-size: 11px; }
.point-user-dashboard .pud-category-list { display: flex; flex-wrap: nowrap; gap: 8px; overflow-x: auto; margin: 20px 0 16px; padding: 4px 1px 9px; scrollbar-width: thin; }
.point-user-dashboard .pud-category-list button { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; padding: 9px 13px; border: 1px solid #d9deea; border-radius: 999px; background: #fff; color: #505a6d; font-size: 12px; font-weight: 750; white-space: nowrap; transition: border-color .2s ease, background .2s ease, color .2s ease; }
.point-user-dashboard .pud-category-list button span { color: inherit; opacity: .6; font-size: 10px; }
.point-user-dashboard .pud-category-list button.is-active { border-color: #1b2031; color: #fff; background: #171b2a; }
.point-user-dashboard .pud-results-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding: 12px 0 20px; }
.point-user-dashboard .pud-result-info { color: #657086; font-size: 12px; }
.point-user-dashboard .pud-result-info strong { color: #111827; font-size: 15px; }
.point-user-dashboard .pud-results-loaded { color: #8790a2; }
.point-user-dashboard .pud-results-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 12px; }
.point-user-dashboard .pud-clear { padding: 6px; background: transparent; border: 0; color: #c32b6c; font-size: 12px; font-weight: 800; }
.point-user-dashboard .pud-sort { display: flex; align-items: center; gap: 5px; color: #788294; font-size: 12px; }
.point-user-dashboard .pud-sort select { max-width: 142px; color: #262e41; font-size: 12px; font-weight: 800; background: transparent; border: 0; }
.point-user-dashboard .pud-layout-switch { display: flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid #dce0e9; border-radius: 9px; background: #fff; }
.point-user-dashboard .pud-layout-switch button { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 6px; color: #7c879b; background: transparent; }
.point-user-dashboard .pud-layout-switch button.is-active { background: #172039; color: #fff; }
.point-user-dashboard .pud-update { display: grid; place-items: center; width: 37px; height: 37px; padding: 0; border: 1px solid #dce0e9; border-radius: 9px; color: #4f596e; background: #fff; }
.point-user-dashboard .pud-jobs-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 19px; }
.point-user-dashboard .pud-job-card { display: flex; flex-direction: column; min-width: 0; min-height: 328px; padding: 19px; border: 1.5px solid #d4d9e4; border-radius: 16px; background: #fff; box-shadow: 0 4px 0 rgba(24,29,45,.08); transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease; animation: pud-card-in .3s both; }
.point-user-dashboard .pud-job-card:hover { border-color: #1e2535; transform: translateY(-4px); box-shadow: 0 9px 0 rgba(24,29,45,.11); }
.point-user-dashboard .pud-job-top { display: flex; align-items: center; gap: 10px; min-width: 0; }
.point-user-dashboard .pud-company-symbol { display: grid; place-items: center; flex: 0 0 46px; width: 46px; height: 46px; background: #daf0ff; color: #153950; border: 1px solid #adcbe2; border-radius: 12px; font-size: 15px; font-weight: 900; letter-spacing: -.06em; }
.point-user-dashboard .pud-job-card--pink .pud-company-symbol { background: #ffe2ee; border-color: #f1b9d2; color: #8a2552; }
.point-user-dashboard .pud-job-card--yellow .pud-company-symbol { background: #fff3c9; border-color: #eaddac; color: #82651b; }
.point-user-dashboard .pud-job-card--violet .pud-company-symbol { background: #eae5ff; border-color: #cdc5f1; color: #6752a6; }
.point-user-dashboard .pud-job-card--green .pud-company-symbol { background: #e5f5d4; border-color: #ccdda9; color: #3b6942; }
.point-user-dashboard .pud-job-category { min-width: 0; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #777f91; font-size: 11px; font-weight: 800; }
.point-user-dashboard .pud-save-icon { display: grid; place-items: center; flex: 0 0 34px; width: 34px; height: 34px; margin-left: auto; padding: 0; border: 1px solid #e0e3eb; border-radius: 10px; background: #fff; color: #7b8598; transition: background .2s, color .2s; }
.point-user-dashboard .pud-save-icon:hover, .point-user-dashboard .pud-save-icon.is-saved { color: #cd2b73; background: #ffe9f1; border-color: #f4bdd4; }
.point-user-dashboard .pud-job-meta { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; min-height: 26px; margin-top: 20px; color: #7c8492; font-size: 11px; font-weight: 750; }
.point-user-dashboard .pud-job-meta > span:not(.pud-badge) { border-left: 1px solid #d7dce6; padding-left: 7px; }
.point-user-dashboard .pud-job-meta > span:not(.pud-badge):first-child { border: 0; padding-left: 0; }
.point-user-dashboard .pud-job-title { margin: 8px 0 5px; color: #182032; font-size: 20px; line-height: 1.18; letter-spacing: -.035em; font-weight: 850; overflow-wrap: anywhere; }
.point-user-dashboard .pud-job-company { margin: 0; color: #627087; font-size: 13px; font-weight: 750; }
.point-user-dashboard .pud-job-location { display: flex; align-items: center; gap: 6px; margin: 10px 0 0; color: #858ea1; font-size: 11px; line-height: 1.4; }
.point-user-dashboard .pud-job-location svg { flex: 0 0 auto; }
.point-user-dashboard .pud-job-description { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; min-height: 53px; margin: 15px 0 0; color: #6c778b; font-size: 12px; line-height: 1.52; overflow-wrap: anywhere; }
.point-user-dashboard .pud-job-skills { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-height: 25px; margin: 14px 0 20px; }
.point-user-dashboard .pud-job-skills span { max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding: 5px 8px; border-radius: 6px; background: #eff4fa; color: #3d6382; font-size: 10px; font-weight: 800; }
.point-user-dashboard .pud-job-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 16px; border-top: 1px solid #edf0f4; }
.point-user-dashboard .pud-job-bottom-copy { display: flex; flex-direction: column; min-width: 0; gap: 5px; }
.point-user-dashboard .pud-job-bottom-copy > span:not(.pud-badge) { color: #8a94a4; font-size: 10px; font-weight: 700; }
.point-user-dashboard .pud-job-bottom-copy strong { font-size: 13px; letter-spacing: -.025em; overflow-wrap: anywhere; }
.point-user-dashboard .pud-job-date { display: inline-flex; align-items: center; gap: 5px; }
.point-user-dashboard .pud-job-open { display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex: 0 0 auto; min-height: 36px; padding: 8px 11px; color: #fff; background: #e93580; border: 1px solid #e93580; border-radius: 9px; font-size: 11px; font-weight: 850; transition: transform .18s ease, background .18s ease; }
.point-user-dashboard .pud-job-open:hover { transform: translateY(-2px); background: #cf246a; }
.point-user-dashboard .pud-jobs-grid--list { grid-template-columns: 1fr; }
.point-user-dashboard .pud-jobs-grid--list .pud-job-card { min-height: 220px; }
.point-user-dashboard .pud-jobs-grid--list .pud-job-description { min-height: auto; -webkit-line-clamp: 2; }
.point-user-dashboard .pud-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 70px 20px; border: 1px dashed #cdd3e0; border-radius: 16px; background: #fff; text-align: center; }
.point-user-dashboard .pud-empty-icon, .point-user-dashboard .pud-state-icon { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 18px; background: #ffebf3; color: #c52b6e; }
.point-user-dashboard .pud-empty h3 { margin: 17px 0 6px; font-size: 23px; letter-spacing: -.035em; }
.point-user-dashboard .pud-empty p { max-width: 520px; margin: 0 0 18px; color: #798396; line-height: 1.6; font-size: 13px; }
.point-user-dashboard .pud-more-area { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 35px; }
.point-user-dashboard .pud-more-area small { color: #8d96a8; font-size: 11px; }
.point-user-dashboard .pud-more-error { color: #ab245d; text-align: center; font-size: 12px; }
.point-user-dashboard .pud-next-section { display: grid; grid-template-columns: minmax(0,1fr) minmax(290px,.75fr); gap: 45px; align-items: center; margin-top: 100px; padding: 34px clamp(25px,4.4vw,56px); border: 1.5px solid #171a28; border-radius: 22px; background: #eff0fb; }
.point-user-dashboard .pud-next-main h2 { max-width: 550px; margin: 13px 0 10px; font-size: clamp(27px,3vw,39px); line-height: 1.1; font-weight: 850; letter-spacing: -.055em; }
.point-user-dashboard .pud-next-main p { max-width: 490px; margin: 0 0 18px; font-size: 13px; line-height: 1.65; color: #70788b; }
.point-user-dashboard .pud-next-links { display: flex; flex-direction: column; gap: 9px; }
.point-user-dashboard .pud-next-links a { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 52px; padding: 12px 15px; border: 1px solid #d5d9e5; border-radius: 11px; background: #fff; color: #242b3e; text-decoration: none; font-size: 13px; font-weight: 800; transition: transform .2s ease, border-color .2s ease; }
.point-user-dashboard .pud-next-links a:hover { transform: translateX(4px); border-color: #9ba1b2; }
.point-user-dashboard .pud-next-links a span { display: flex; align-items: center; gap: 12px; }
.point-user-dashboard .pud-next-links a span svg { color: #e83880; }
.point-user-dashboard .pud-last-updated { text-align: right; font-size: 11px; color: #99a0ae; padding: 12px 3px 0; }
.point-user-dashboard .pud-alert { position: fixed; z-index: 950; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; width: min(470px,calc(100vw - 40px)); padding: 15px 16px; border: 1px solid #addab9; border-left: 4px solid #3e9960; border-radius: 12px; background: #eaf8ee; color: #286645; box-shadow: 0 14px 40px rgba(22,30,46,.2); font-size: 12px; font-weight: 750; animation: pud-card-in .25s ease both; }
.point-user-dashboard .pud-alert--error { background: #fff0f2; color: #a42d4c; border-color: #efbbcb; border-left-color: #d74f74; }
.point-user-dashboard .pud-alert > span { flex: 1; }
.point-user-dashboard .pud-alert button { display: grid; place-items: center; padding: 5px; border: 0; background: transparent; color: inherit; }
.point-user-dashboard .pud-loading-main { display: grid; place-items: center; min-height: min(72vh,690px); }
.point-user-dashboard .pud-loading-panel { display: flex; flex-direction: column; align-items: center; width: min(100%,570px); padding: 52px 32px; text-align: center; border: 1px solid #dce1eb; border-radius: 20px; background: #fff; }
.point-user-dashboard .pud-loading-panel h1 { margin: 21px 0 9px; font-size: clamp(24px,3vw,32px); letter-spacing: -.045em; }
.point-user-dashboard .pud-loading-panel p { max-width: 450px; font-size: 13px; line-height: 1.55; color: #757f91; margin: 0 0 19px; }
.point-user-dashboard .pud-loader { display: block; width: 36px; height: 36px; border: 3px solid #f9d6e6; border-top-color: #e83880; border-radius: 50%; animation: pud-spin .8s linear infinite; }
.point-user-dashboard .pud-skeleton { gap: 17px; pointer-events: none; }
.point-user-dashboard .pud-skeleton-square { width: 45px; height: 45px; border-radius: 10px; background: #e9edf3; }
.point-user-dashboard .pud-skeleton-line { height: 15px; border-radius: 5px; background: #e9edf3; }
.point-user-dashboard .pud-skeleton-line.short { width: 65%; }
@keyframes pud-spin { to { transform: rotate(360deg); } }
@keyframes pud-card-in { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 1100px) {
  .point-user-dashboard .pud-hero { grid-template-columns: minmax(0,1fr) minmax(260px,.7fr); gap: 25px; }
  .point-user-dashboard .pud-overview { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .point-user-dashboard .pud-jobs-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .point-user-dashboard .pud-jobs-grid--list { grid-template-columns: 1fr; }
}
@media (max-width: 770px) {
  .point-user-dashboard .pud-container { width: min(100% - 32px,1280px); padding-top: 25px; }
  .point-user-dashboard .pud-hero { grid-template-columns: 1fr; padding: 25px; box-shadow: 5px 6px 0 #9180ff; }
  .point-user-dashboard .pud-profile-card { max-width: 100%; }
  .point-user-dashboard .pud-overview { margin: 33px 0 65px; gap: 13px; }
  .point-user-dashboard .pud-search-panel { flex-direction: column; }
  .point-user-dashboard .pud-select-controls { flex: auto; }
  .point-user-dashboard .pud-select-controls label { flex: 1; min-width: 0; }
  .point-user-dashboard .pud-next-section { grid-template-columns: 1fr; gap: 25px; margin-top: 65px; }
}
@media (max-width: 560px) {
  .point-user-dashboard .pud-alert { right: 13px; bottom: 82px; width: calc(100vw - 26px); }
  .point-user-dashboard .pud-container { width: min(100% - 26px,1280px); }
  .point-user-dashboard .pud-hero { padding: 24px 19px; border-radius: 18px; }
  .point-user-dashboard .pud-hero h1 { font-size: clamp(30px,8.5vw,40px); }
  .point-user-dashboard .pud-hero-description { font-size: 13px; }
  .point-user-dashboard .pud-hero-actions > button { flex: 1; }
  .point-user-dashboard .pud-hero-stamp { font-size: 9px; }
  .point-user-dashboard .pud-profile-card { padding: 18px; }
  .point-user-dashboard .pud-overview { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
  .point-user-dashboard .pud-stat { padding: 14px; min-height: 168px; border-radius: 14px; box-shadow: 3px 3px 0 #171d2a; }
  .point-user-dashboard .pud-stat-top { font-size: 9px; }
  .point-user-dashboard .pud-stat-top svg { display: none; }
  .point-user-dashboard .pud-stat > strong { margin-top: 18px; font-size: 18px; }
  .point-user-dashboard .pud-stat > small { margin-top: 5px; font-size: 10px; }
  .point-user-dashboard .pud-stat-link { font-size: 10px; }
  .point-user-dashboard .pud-section-header { align-items: flex-start; }
  .point-user-dashboard .pud-section-counter { display: none; }
  .point-user-dashboard .pud-section-header h2 { font-size: 37px; }
  .point-user-dashboard .pud-select-controls { flex-wrap: wrap; }
  .point-user-dashboard .pud-select-controls label { min-width: calc(50% - 6px); }
  .point-user-dashboard .pud-radar-tabs { gap: 14px; overflow-x: auto; }
  .point-user-dashboard .pud-radar-tabs button { font-size: 12px; }
  .point-user-dashboard .pud-results-bar { align-items: flex-start; }
  .point-user-dashboard .pud-results-actions { width: 100%; justify-content: space-between; }
  .point-user-dashboard .pud-jobs-grid, .point-user-dashboard .pud-jobs-grid--list { grid-template-columns: 1fr; }
  .point-user-dashboard .pud-job-card { min-height: 322px; }
  .point-user-dashboard .pud-next-section { padding: 24px 19px; }
}
@media (prefers-reduced-motion: reduce) {
  .point-user-dashboard *, .point-user-dashboard *:before, .point-user-dashboard *:after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`;