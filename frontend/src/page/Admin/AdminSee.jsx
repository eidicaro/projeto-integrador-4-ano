import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api, { getApiErrorMessage } from "../../lib/api";
import {
  getApplicationJobId,
  getLaravelValidationErrors,
  unwrapApiCollection,
  unwrapApiData,
} from "../../lib/candidate";

const JOBS_STORAGE_KEY = "admin-created-jobs-v2";
const CANDIDATES_STORAGE_KEY = "admin-job-candidates-v1";

const JOB_STATUS = {
  rascunho: { label: "Rascunho", tone: "muted" },
  publicada: { label: "Publicada", tone: "green" },
  pausada: { label: "Pausada", tone: "orange" },
  arquivada: { label: "Arquivada", tone: "muted" },
  encerrada: { label: "Encerrada", tone: "muted" },
};

const CANDIDATE_STAGES = [
  { id: "novo", label: "Novos", tone: "blue" },
  { id: "triagem", label: "Triagem", tone: "purple" },
  { id: "entrevista", label: "Entrevista", tone: "orange" },
  { id: "oferta", label: "Oferta", tone: "pink" },
  { id: "contratado", label: "Contratados", tone: "green" },
  { id: "reprovado", label: "Reprovados", tone: "muted" },
  { id: "retirado", label: "Retirados", tone: "muted", readonly: true },
];

const BENEFIT_LABELS = {
  "vale-refeicao": "Vale-refeição",
  "vale-alimentacao": "Vale-alimentação",
  "vale-transporte": "Vale-transporte",
  "plano-saude": "Plano de saúde",
  "plano-odontologico": "Plano odontológico",
  gympass: "Gympass",
  "home-office": "Auxílio home office",
  "horario-flexivel": "Horário flexível",
  "participacao-lucros": "Participação nos lucros",
  "day-off": "Day off",
  "bolsa-estudos": "Bolsa de estudos",
  "seguro-vida": "Seguro de vida",
};

const emptyCandidateForm = {
  name: "",
  email: "",
  phone: "",
  location: "",
  experience: "",
  skills: "",
  stage: "novo",
  notes: "",
};

function normalizeStatus(status) {
  return JOB_STATUS[status] ? status : "rascunho";
}

function normalizeJob(job) {
  return {
    ...job,
    id: job.id,
    title: job.title || "Vaga sem título",
    company: job.company || "Empresa não informada",
    location: job.location || "Local não informado",
    employmentType: job.employmentType || "Não informado",
    workMode: job.workMode || "Não informado",
    seniority: job.seniority || "Não informado",
    openings: Number(job.openings) || 1,
    tags: Array.isArray(job.tags) ? job.tags : [],
    benefits: Array.isArray(job.benefits) ? job.benefits : [],
    status: normalizeStatus(job.status),
    createdAt: job.createdAt || new Date().toISOString(),
    updatedAt: job.updatedAt || job.createdAt || new Date().toISOString(),
  };
}

function normalizeCandidate(candidate) {
  const resume = candidate.resumeSnapshot || candidate.resume || null;
  const resumeSkills = Array.isArray(resume?.habilidades)
    ? resume.habilidades.map((skill) => typeof skill === "string" ? skill : skill?.nome).filter(Boolean)
    : [];

  return {
    ...candidate,
    id: candidate.id,
    jobId: getApplicationJobId(candidate),
    name: resume?.nome_completo || candidate.name || "Candidato sem nome",
    email: resume?.email || candidate.email || "",
    phone: resume?.telefone || candidate.phone || "",
    location: resume?.cidade_estado || candidate.location || "",
    experience: resume?.area_atuacao || candidate.experience || "",
    skills: resumeSkills.length
      ? resumeSkills
      : (Array.isArray(candidate.skills) ? candidate.skills : []),
    resumeData: resume,
    stage: CANDIDATE_STAGES.some((stage) => stage.id === candidate.stage)
      ? candidate.stage
      : "novo",
    rating: Number(candidate.rating) || 0,
    notes: candidate.notes || "",
    appliedAt: candidate.appliedAt || candidate.createdAt || null,
  };
}

function groupCandidatesByJob(candidates, jobs) {
  const grouped = Object.fromEntries(jobs.map((job) => [job.id, []]));

  candidates.forEach((candidateData) => {
    const candidate = normalizeCandidate(candidateData);
    if (candidate.jobId === null || candidate.jobId === undefined) return;

    const jobKey = String(candidate.jobId);
    grouped[jobKey] = [candidate, ...(grouped[jobKey] || [])];
  });

  return grouped;
}

function formatDate(value, options = {}) {
  if (!value) return "Não definido";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não definido";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: options.short ? "short" : "long",
    year: "numeric",
  }).format(date);
}

function formatRelativeDate(value) {
  if (!value) return "Agora";

  const date = new Date(value);
  const difference = Date.now() - date.getTime();
  const days = Math.floor(difference / 86400000);

  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  return formatDate(value, { short: true });
}

function formatCurrency(value) {
  const number = Number(value);
  if (!value || Number.isNaN(number)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(number);
}

function salaryLabel(job) {
  if (job.salaryVisible === false) return "Salário confidencial";
  if (job.salaryMin && job.salaryMax) {
    return `${formatCurrency(job.salaryMin)} a ${formatCurrency(job.salaryMax)}`;
  }
  if (job.salaryMin) return `A partir de ${formatCurrency(job.salaryMin)}`;
  if (job.salaryMax) return `Até ${formatCurrency(job.salaryMax)}`;
  return "Salário a combinar";
}

function getJobQuality(job) {
  const checks = [
    Boolean(job.title),
    Boolean(job.company),
    Boolean(job.location),
    Boolean(job.employmentType),
    Boolean(job.workMode),
    String(job.description || "").length >= 80,
    String(job.requirements || "").length >= 30,
    Array.isArray(job.tags) && job.tags.length >= 3,
    Array.isArray(job.benefits) && job.benefits.length >= 2,
    Boolean(job.salaryMin || job.salaryMax),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function escapeCsv(value) {
  let text = String(value ?? "");

  if (/^[\t\r]|^\s*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  text = text.replace(/"/g, '""');
  return `"${text}"`;
}

const MAX_PAGE_REQUESTS = 1000;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function syncDialogAccessibility() {
  const dialogs = Array.from(
    document.querySelectorAll("[data-admin-dialog]")
  );

  dialogs.forEach((dialog, index) => {
    if (index === dialogs.length - 1) {
      dialog.removeAttribute("aria-hidden");
    } else {
      dialog.setAttribute("aria-hidden", "true");
    }
  });
}

async function fetchAllPages(path, { perPage, signal }) {
  const records = [];
  let page = 1;

  while (page <= MAX_PAGE_REQUESTS) {
    const response = await api.get(path, {
      params: { page, per_page: perPage },
      signal,
    });
    const pageRecords = unwrapApiCollection(response);
    const meta = response?.data?.meta;

    records.push(...pageRecords);

    if (!meta) {
      if (pageRecords.length < perPage) return records;
      throw new Error(`A API não informou a paginação completa de ${path}.`);
    }

    const currentPage = Number(meta.current_page);
    const lastPage = Number(meta.last_page);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(lastPage) ||
      currentPage < 1 ||
      lastPage < currentPage
    ) {
      throw new Error(`A API retornou paginação inválida para ${path}.`);
    }

    if (currentPage >= lastPage) return records;

    const nextPage = currentPage + 1;
    if (nextPage <= page) {
      throw new Error(`A paginação de ${path} não avançou.`);
    }
    page = nextPage;
  }

  throw new Error(`O limite seguro de páginas foi excedido para ${path}.`);
}

function AccessibleDialog({
  children,
  className = "see-modal",
  ariaLabel,
  ariaLabelledBy,
  onClose,
  overlayStyle,
  canClose = true,
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);

  useEffect(() => {
    onCloseRef.current = onClose;
    canCloseRef.current = canClose;
  }, [canClose, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!dialog) return undefined;

    syncDialogAccessibility();

    const isTopmost = () => {
      const dialogs = document.querySelectorAll("[data-admin-dialog]");
      return dialogs[dialogs.length - 1] === dialog;
    };
    const getFocusable = () =>
      Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getAttribute("aria-hidden") !== "true"
      );
    const focusFrame = window.requestAnimationFrame(() => {
      const initialFocus =
        dialog.querySelector("[data-dialog-initial-focus]") ||
        getFocusable()[0] ||
        dialog;
      initialFocus.focus({ preventScroll: true });
    });

    function handleKeyDown(event) {
      if (!isTopmost()) return;

      if (event.key === "Escape" && canCloseRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
      syncDialogAccessibility();
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div
      className="see-overlay"
      style={overlayStyle}
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          canCloseRef.current
        ) {
          onCloseRef.current?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        data-admin-dialog
      >
        {children}
      </div>
    </div>
  );
}

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    logo: <><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" /><path d="m8.5 8.2 3.5-2 3.5 2v4L12 14.3l-3.5-2.1v-4Z" /><path d="M12 14.3V20" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    filter: <><path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19V2" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    map: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></>,
    money: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M7 10h.01" /><path d="M17 14h.01" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    pause: <><path d="M9 5v14" /><path d="M15 5v14" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    archive: <><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v12h14V8" /><path d="M10 12h4" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m6 6 1 15h10l1-15" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    arrowLeft: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
    arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    sparkles: <><path d="m12 3-1.1 3.2a2.8 2.8 0 0 1-1.7 1.7L6 9l3.2 1.1a2.8 2.8 0 0 1 1.7 1.7L12 15l1.1-3.2a2.8 2.8 0 0 1 1.7-1.7L18 9l-3.2-1.1a2.8 2.8 0 0 1-1.7-1.7L12 3Z" /><path d="m5 16-.5 1.5a1.7 1.7 0 0 1-1 1L2 19l1.5.5a1.7 1.7 0 0 1 1 1L5 22l.5-1.5a1.7 1.7 0 0 1 1-1L8 19l-1.5-.5a1.7 1.7 0 0 1-1-1L5 16Z" /></>,
    shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.7 7.5 9.5 4.4-1.8 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5" /><path d="M12 18h.01" /></>,
    command: <><path d="M9 6V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V5" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" /></>,
    userPlus: <><path d="M15 19a6 6 0 0 0-12 0" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M16 11h6" /></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" /></>,
    external: <><path d="M14 3h7v7" /><path d="m10 14 11-11" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
  };

  return <svg {...props}>{icons[name] || null}</svg>;
}

function CandidateResume({ candidate, loading, onOpenFile }) {
  const resume = candidate.resumeData;

  if (candidate.resumeSource === "arquivo" && candidate.resumeFileUrl) {
    return (
      <section className="see-profile__panel see-resume">
        <h4>Currículo enviado</h4>
        <p>O candidato anexou o currículo em PDF nesta candidatura.</p>
        <button type="button" className="see-action-btn see-action-btn--primary" onClick={onOpenFile} disabled={loading}>
          <Icon name="external" size={14} />
          {loading ? "Abrindo..." : "Abrir currículo em PDF"}
        </button>
      </section>
    );
  }

  if (!resume) {
    return (
      <section className="see-profile__panel see-resume">
        <h4>Currículo</h4>
        <p>Esta candidatura não possui um currículo vinculado.</p>
      </section>
    );
  }

  const sections = [
    ["Experiência profissional", resume.experiencias, (item) => item.cargo, (item) => [item.empresa, item.periodo].filter(Boolean).join(" · ")],
    ["Formação", resume.formacoes, (item) => item.curso, (item) => [item.instituicao, item.periodo].filter(Boolean).join(" · ")],
    ["Cursos", resume.cursos, (item) => item.nome, (item) => [item.instituicao, item.periodo].filter(Boolean).join(" · ")],
    ["Idiomas", resume.idiomas, (item) => item.idioma, (item) => item.nivel],
  ];

  return (
    <section className="see-profile__panel see-resume">
      <div className="see-resume__heading">
        <div><h4>Currículo da candidatura</h4><span>Versão enviada pelo candidato</span></div>
        <Icon name="briefcase" size={17} />
      </div>
      {resume.resumo && <div className="see-resume__section"><h5>Resumo profissional</h5><p>{resume.resumo}</p></div>}
      {sections.map(([title, items, getTitle, getMeta]) => Array.isArray(items) && items.length > 0 && (
        <div className="see-resume__section" key={title}>
          <h5>{title}</h5>
          <div className="see-resume__items">
            {items.map((item, index) => (
              <article key={item.id || `${title}-${index}`}>
                <strong>{getTitle(item)}</strong>
                {getMeta(item) && <span>{getMeta(item)}</span>}
                {item.descricao && <p>{item.descricao}</p>}
              </article>
            ))}
          </div>
        </div>
      ))}
      {Array.isArray(resume.links) && resume.links.length > 0 && (
        <div className="see-resume__section"><h5>Links</h5><div className="see-resume__links">{resume.links.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer"><Icon name="external" size={11} />{link}</a>)}</div></div>
      )}
    </section>
  );
}

export default function AdminSee() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [candidatesByJob, setCandidatesByJob] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingAction, setPendingAction] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [workModeFilter, setWorkModeFilter] = useState("todos");
  const [employmentFilter, setEmploymentFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("recentes");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobDetailTab, setJobDetailTab] = useState("visao");
  const [modal, setModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(() =>
    location.state?.showCreatedMessage || location.state?.showUpdatedMessage
      ? {
          type: "success",
          title: location.state?.showUpdatedMessage
            ? "Vaga atualizada com sucesso"
            : "Vaga publicada com sucesso",
          description: location.state?.createdJob?.title
            ? `${location.state.createdJob.title} já está sincronizada no painel.`
            : "A oportunidade já está sincronizada no painel.",
        }
      : null
  );
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStageFilter, setCandidateStageFilter] = useState("todos");
  const [candidateView, setCandidateView] = useState("kanban");
  const [candidateForm, setCandidateForm] = useState(emptyCandidateForm);
  const [candidateFormErrors, setCandidateFormErrors] = useState({});
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateNotesDraft, setCandidateNotesDraft] = useState("");
  const [draggedCandidate, setDraggedCandidate] = useState(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const selectedCandidate = useMemo(() => {
    if (!selectedJobId || !selectedCandidateId) return null;
    return (candidatesByJob[selectedJobId] || []).find(
      (candidate) => candidate.id === selectedCandidateId
    ) || null;
  }, [candidatesByJob, selectedCandidateId, selectedJobId]);

  const allCandidates = useMemo(
    () => Object.values(candidatesByJob).flatMap((list) =>
      Array.isArray(list) ? list : []
    ),
    [candidatesByJob]
  );

  const stats = useMemo(() => {
    const active = jobs.filter((job) => job.status === "publicada").length;
    const interviews = allCandidates.filter(
      (candidate) => candidate.stage === "entrevista"
    ).length;
    const hired = allCandidates.filter(
      (candidate) => candidate.stage === "contratado"
    ).length;
    const quality = jobs.length
      ? Math.round(jobs.reduce((sum, job) => sum + getJobQuality(job), 0) / jobs.length)
      : 0;

    return {
      active,
      candidates: allCandidates.length,
      interviews,
      hired,
      quality,
    };
  }, [allCandidates, jobs]);

  const insight = useMemo(() => {
    if (!jobs.length) return "Crie sua primeira vaga para iniciar o acompanhamento inteligente.";
    if (!allCandidates.length) return "Suas vagas ainda não receberam candidatos. Compartilhe os links de candidatura para acelerar o funil.";
    if (stats.interviews > 0) return `${stats.interviews} candidato${stats.interviews === 1 ? " está" : "s estão"} em entrevista. Priorize feedbacks rápidos para reduzir o tempo de contratação.`;
    if (stats.quality < 80) return "Algumas vagas podem ganhar desempenho com salário, benefícios e requisitos mais detalhados.";
    return "Seu painel está saudável: vagas completas, pipeline organizado e boa cadência de seleção.";
  }, [allCandidates.length, jobs.length, stats.interviews, stats.quality]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = jobs.filter((job) => {
      const searchable = [
        job.title,
        job.company,
        job.location,
        job.department,
        job.employmentType,
        job.workMode,
        ...(job.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesStatus = statusFilter === "todas" || job.status === statusFilter;
      const matchesWorkMode = workModeFilter === "todos" || job.workMode === workModeFilter;
      const matchesEmployment = employmentFilter === "todos" || job.employmentType === employmentFilter;

      return matchesSearch && matchesStatus && matchesWorkMode && matchesEmployment;
    });

    return result.sort((a, b) => {
      if (sortBy === "antigas") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "titulo") {
        return a.title.localeCompare(b.title, "pt-BR");
      }
      if (sortBy === "candidatos") {
        return (candidatesByJob[b.id]?.length || 0) - (candidatesByJob[a.id]?.length || 0);
      }
      if (sortBy === "qualidade") {
        return getJobQuality(b) - getJobQuality(a);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [candidatesByJob, employmentFilter, jobs, search, sortBy, statusFilter, workModeFilter]);

  const selectedJobCandidates = useMemo(() => {
    if (!selectedJobId) return [];
    const list = candidatesByJob[selectedJobId] || [];
    const normalizedSearch = candidateSearch.trim().toLowerCase();

    return list.filter((candidate) => {
      const searchable = [
        candidate.name,
        candidate.email,
        candidate.location,
        candidate.experience,
        ...(candidate.skills || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesStage = candidateStageFilter === "todos" || candidate.stage === candidateStageFilter;
      return matchesSearch && matchesStage;
    });
  }, [candidateSearch, candidateStageFilter, candidatesByJob, selectedJobId]);

  const exportJobsCsv = useCallback(() => {
    const header = [
      "Título",
      "Empresa",
      "Local",
      "Contratação",
      "Modelo",
      "Status",
      "Candidatos",
      "Entrevistas",
      "Qualidade",
      "Criada em",
    ];

    const rows = jobs.map((job) => {
      const candidates = candidatesByJob[job.id] || [];
      return [
        job.title,
        job.company,
        job.location,
        job.employmentType,
        job.workMode,
        JOB_STATUS[job.status]?.label || job.status,
        candidates.length,
        candidates.filter((candidate) => candidate.stage === "entrevista").length,
        `${getJobQuality(job)}%`,
        formatDate(job.createdAt),
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-vagas-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setToast({
      type: "success",
      title: "Relatório exportado",
      description: "O arquivo CSV foi gerado com sucesso.",
    });
  }, [candidatesByJob, jobs]);

  const commandActions = useMemo(
    () => [
      {
        id: "new-job",
        title: "Criar nova vaga",
        description: "Abrir o editor de oportunidades",
        icon: "plus",
      },
      {
        id: "search",
        title: "Pesquisar vagas",
        description: "Focar o campo de busca principal",
        icon: "search",
      },
      {
        id: "export",
        title: "Exportar relatório CSV",
        description: "Baixar vagas e indicadores",
        icon: "download",
      },
      {
        id: "toggle-view",
        title: viewMode === "grid" ? "Usar visualização em lista" : "Usar visualização em grade",
        description: "Alternar o modo de exibição",
        icon: viewMode === "grid" ? "list" : "grid",
      },
    ],
    [viewMode]
  );

  const filteredCommandActions = useMemo(() => {
    const query = commandSearch.trim().toLowerCase();
    if (!query) return commandActions;
    return commandActions.filter((action) =>
      `${action.title} ${action.description}`.toLowerCase().includes(query)
    );
  }, [commandActions, commandSearch]);

  useEffect(() => {
    try {
      window.localStorage.removeItem(JOBS_STORAGE_KEY);
      window.localStorage.removeItem(CANDIDATES_STORAGE_KEY);
    } catch {
      // A aplicação não depende mais do armazenamento local.
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    Promise.all([
      fetchAllPages("/admin/vagas", {
        perPage: 100,
        signal: controller.signal,
      }),
      fetchAllPages("/admin/candidaturas", {
        perPage: 500,
        signal: controller.signal,
      }),
    ])
      .then(([jobsRecords, candidateRecords]) => {
        if (!active) return;

        const loadedJobs = jobsRecords
          .filter((job) => job?.id !== null && job?.id !== undefined)
          .map(normalizeJob);

        setJobs(loadedJobs);
        setCandidatesByJob(
          groupCandidatesByJob(candidateRecords, loadedJobs)
        );
        setSelectedJobs([]);
        setLoadError("");
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;

        setLoadError(
          getApiErrorMessage(
            error,
            "Não foi possível carregar as vagas e candidaturas."
          )
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!location.state?.showCreatedMessage && !location.state?.showUpdatedMessage) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleKeyboard(event) {
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }

      if (modifier && event.key.toLowerCase() === "n") {
        event.preventDefault();
        navigate("/admin/criar-vaga");
      }

      if (modifier && event.key.toLowerCase() === "e") {
        event.preventDefault();
        exportJobsCsv();
      }

      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setModal((current) => current === "filters" ? null : current);
      }
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [exportJobsCsv, navigate]);

  function notify(type, title, description) {
    setToast({ type, title, description });
  }

  function handleReload() {
    setLoading(true);
    setLoadError("");
    setReloadKey((current) => current + 1);
  }

  function openJob(jobId) {
    setSelectedJobId(jobId);
    setJobDetailTab("visao");
    setModal("job");
  }

  function openCandidates(jobId) {
    setSelectedJobId(jobId);
    setCandidateSearch("");
    setCandidateStageFilter("todos");
    setCandidateView("kanban");
    setModal("candidates");
  }

  function openCandidateProfile(candidate) {
    setSelectedCandidateId(candidate.id);
    setCandidateNotesDraft(candidate.notes || "");
  }

  async function openCandidateResumeFile(candidate) {
    if (!candidate.resumeFileUrl || pendingAction) return;

    setPendingAction(`candidate-resume-${candidate.id}`);

    try {
      const response = await api.get(candidate.resumeFileUrl, { responseType: "blob" });
      const fileUrl = window.URL.createObjectURL(response.data);
      const openedWindow = window.open(fileUrl, "_blank", "noopener,noreferrer");

      if (!openedWindow) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `curriculo-${candidate.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
        link.click();
      }

      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60000);
    } catch (error) {
      notify("error", "Não foi possível abrir o currículo", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  function updateJob(jobId, updates) {
    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === jobId
          ? { ...job, ...updates, updatedAt: new Date().toISOString() }
          : job
      )
    );
  }

  async function toggleJobStatus(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || pendingAction) return;

    const nextStatus = job.status === "publicada" ? "pausada" : "publicada";
    setPendingAction(`status-${jobId}`);

    try {
      const response = await api.patch(`/admin/vagas/${encodeURIComponent(jobId)}/status`, {
        status: nextStatus,
      });
      const updatedJob = unwrapApiData(response);
      updateJob(jobId, updatedJob ? normalizeJob(updatedJob) : { status: nextStatus });
      notify(
        "success",
        nextStatus === "publicada" ? "Vaga reativada" : "Vaga pausada",
        `${job.title} agora está ${JOB_STATUS[nextStatus].label.toLowerCase()}.`
      );
    } catch (error) {
      notify("error", "Não foi possível alterar a vaga", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  async function duplicateJob(jobId) {
    const source = jobs.find((job) => job.id === jobId);
    if (!source || pendingAction) return;
    setPendingAction(`duplicate-${jobId}`);

    try {
      const response = await api.post(`/admin/vagas/${encodeURIComponent(jobId)}/duplicate`);
      const duplicated = unwrapApiData(response);
      if (!duplicated?.id) throw new Error("A API não retornou a vaga duplicada.");

      const clone = normalizeJob(duplicated);
      setJobs((current) => [clone, ...current]);
      setCandidatesByJob((current) => ({ ...current, [clone.id]: [] }));
      notify("success", "Vaga duplicada", "Uma cópia pausada foi criada para edição futura.");
    } catch (error) {
      notify("error", "Não foi possível duplicar", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  function requestDelete(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return;

    setConfirmAction({
      type: "delete-job",
      title: "Excluir esta vaga?",
      description: `${job.title} será removida do painel. O histórico das candidaturas continuará preservado no banco.`,
      jobId,
    });
  }

  function requestCandidateDelete(jobId, candidateId) {
    const candidate = (candidatesByJob[jobId] || []).find(
      (item) => item.id === candidateId
    );
    if (!candidate) return;

    setConfirmAction({
      type: "delete-candidate",
      title: "Remover este candidato?",
      description: `${candidate.name} será removido deste processo seletivo. O histórico já registrado continuará preservado.`,
      confirmLabel: "Remover candidato",
      jobId,
      candidateId,
      candidateName: candidate.name,
    });
  }

  async function archiveJob(jobId) {
    const job = jobs.find((item) => item.id === jobId);
    if (!job || pendingAction) return;
    setPendingAction(`archive-${jobId}`);

    try {
      const response = await api.patch(`/admin/vagas/${encodeURIComponent(jobId)}/status`, {
        status: "arquivada",
      });
      const updatedJob = unwrapApiData(response);
      updateJob(jobId, updatedJob ? normalizeJob(updatedJob) : { status: "arquivada" });
      notify("success", "Vaga arquivada", `${job.title} foi movida para o arquivo.`);
    } catch (error) {
      notify("error", "Não foi possível arquivar", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  function toggleJobSelection(jobId) {
    setSelectedJobs((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId]
    );
  }

  async function bulkArchive() {
    if (!selectedJobs.length || pendingAction) return;
    const ids = [...selectedJobs];
    setPendingAction("bulk-archive");

    try {
      await api.post("/admin/vagas/bulk", { ids, action: "arquivar" });
      setJobs((current) =>
        current.map((job) =>
          ids.includes(job.id)
            ? { ...job, status: "arquivada", updatedAt: new Date().toISOString() }
            : job
        )
      );
      notify("success", "Vagas arquivadas", `${ids.length} item(ns) foram arquivados.`);
      setSelectedJobs([]);
    } catch (error) {
      notify("error", "Não foi possível arquivar as vagas", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  function requestBulkDelete() {
    setConfirmAction({
      type: "bulk-delete",
      title: "Excluir vagas selecionadas?",
      description: `${selectedJobs.length} vaga(s) serão removidas do painel; os históricos permanecerão preservados.`,
    });
  }

  async function executeConfirmAction() {
    if (!confirmAction || pendingAction) return;
    const action = confirmAction;
    setPendingAction("delete");

    try {
      if (action.type === "delete-job") {
        const jobId = action.jobId;
        await api.delete(`/admin/vagas/${encodeURIComponent(jobId)}`);
        setJobs((current) => current.filter((job) => job.id !== jobId));
        setCandidatesByJob((current) => {
          const next = { ...current };
          delete next[jobId];
          return next;
        });
        setSelectedJobs((current) => current.filter((id) => id !== jobId));
        setModal(null);
        notify("success", "Vaga excluída", "A oportunidade foi removida do painel.");
      }

      if (action.type === "bulk-delete") {
        const selectedIds = [...selectedJobs];
        await api.post("/admin/vagas/bulk", { ids: selectedIds, action: "excluir" });
        const ids = new Set(selectedIds);
        setJobs((current) => current.filter((job) => !ids.has(job.id)));
        setCandidatesByJob((current) => {
          const next = { ...current };
          ids.forEach((id) => delete next[id]);
          return next;
        });
        notify("success", "Itens excluídos", `${selectedIds.length} vaga(s) foram removidas.`);
        setSelectedJobs([]);
      }

      if (action.type === "delete-candidate") {
        await api.delete(
          `/admin/candidaturas/${encodeURIComponent(action.candidateId)}`
        );
        setCandidatesByJob((current) => ({
          ...current,
          [action.jobId]: (current[action.jobId] || []).filter(
            (candidate) => candidate.id !== action.candidateId
          ),
        }));
        setSelectedCandidateId(null);
        notify(
          "success",
          "Candidato removido",
          `${action.candidateName} foi removido do processo.`
        );
      }

      setConfirmAction(null);
    } catch (error) {
      notify("error", "Não foi possível concluir a exclusão", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("todas");
    setWorkModeFilter("todos");
    setEmploymentFilter("todos");
    setSortBy("recentes");
  }

  async function copyJob(job) {
    const text = `${job.title}\n${job.company}\n${job.location} • ${job.workMode} • ${job.employmentType}\n${salaryLabel(job)}\n\n${job.description || ""}`;

    try {
      await navigator.clipboard.writeText(text);
      notify("success", "Vaga copiada", "O conteúdo foi enviado para a área de transferência.");
    } catch {
      notify("error", "Não foi possível copiar", "Seu navegador bloqueou a área de transferência.");
    }
  }

  function validateCandidateForm() {
    const errors = {};
    if (!candidateForm.name.trim()) errors.name = "Informe o nome do candidato.";
    if (!candidateForm.email.trim()) errors.email = "Informe o e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateForm.email.trim())) {
      errors.email = "Informe um e-mail válido.";
    }
    return errors;
  }

  async function submitCandidate(event) {
    event.preventDefault();
    if (!selectedJobId || pendingAction) return;

    const errors = validateCandidateForm();
    setCandidateFormErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      name: candidateForm.name.trim(),
      email: candidateForm.email.trim(),
      phone: candidateForm.phone.trim(),
      location: candidateForm.location.trim(),
      experience: candidateForm.experience.trim(),
      skills: candidateForm.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      stage: candidateForm.stage,
      notes: candidateForm.notes.trim(),
    };
    setPendingAction("candidate-create");

    try {
      const response = await api.post(
        `/admin/vagas/${encodeURIComponent(selectedJobId)}/candidaturas/manual`,
        payload
      );
      const candidate = normalizeCandidate(unwrapApiData(response));
      setCandidatesByJob((current) => ({
        ...current,
        [selectedJobId]: [candidate, ...(current[selectedJobId] || [])],
      }));
      setCandidateForm(emptyCandidateForm);
      setCandidateFormErrors({});
      setModal("candidates");
      const initialStage = CANDIDATE_STAGES.find((stage) => stage.id === candidate.stage)?.label || candidate.stage;
      notify("success", "Candidato adicionado", `${candidate.name} entrou na etapa ${initialStage}.`);
    } catch (error) {
      const apiValidation = getLaravelValidationErrors(error);
      setCandidateFormErrors({
        name: apiValidation.name || apiValidation.nome,
        email: apiValidation.email,
        phone: apiValidation.phone || apiValidation.telefone,
        location: apiValidation.location || apiValidation.localizacao,
        experience: apiValidation.experience || apiValidation.experiencia,
        skills: apiValidation.skills || apiValidation.habilidades,
        stage: apiValidation.stage || apiValidation.status,
        notes: apiValidation.notes || apiValidation.observacoes,
      });
      notify("error", "Não foi possível adicionar", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  async function moveCandidate(jobId, candidateId, stage) {
    if (stage === "retirado") return;

    if (pendingAction) return;
    setPendingAction(`candidate-stage-${candidateId}`);

    try {
      const response = await api.patch(
        `/admin/candidaturas/${encodeURIComponent(candidateId)}`,
        { stage }
      );
      const updatedCandidate = unwrapApiData(response);
      setCandidatesByJob((current) => ({
        ...current,
        [jobId]: (current[jobId] || []).map((candidate) =>
          candidate.id === candidateId
            ? normalizeCandidate(updatedCandidate || { ...candidate, stage })
            : candidate
        ),
      }));
      const stageLabel = CANDIDATE_STAGES.find((item) => item.id === stage)?.label || stage;
      notify("success", "Etapa atualizada", `O candidato foi movido para ${stageLabel}.`);
    } catch (error) {
      notify("error", "Não foi possível mover o candidato", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  async function updateCandidateRating(jobId, candidateId, rating) {
    if (pendingAction) return;
    setPendingAction(`candidate-rating-${candidateId}`);

    try {
      const response = await api.patch(
        `/admin/candidaturas/${encodeURIComponent(candidateId)}`,
        { rating }
      );
      const updatedCandidate = unwrapApiData(response);
      setCandidatesByJob((current) => ({
        ...current,
        [jobId]: (current[jobId] || []).map((candidate) =>
          candidate.id === candidateId
            ? normalizeCandidate(updatedCandidate || { ...candidate, rating })
            : candidate
        ),
      }));
    } catch (error) {
      notify("error", "Não foi possível avaliar", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  async function updateCandidateNotes(jobId, candidateId) {
    if (pendingAction) return;
    setPendingAction(`candidate-notes-${candidateId}`);

    try {
      const notes = candidateNotesDraft.trim() || null;
      const response = await api.patch(
        `/admin/candidaturas/${encodeURIComponent(candidateId)}`,
        { notes }
      );
      const updatedCandidate = unwrapApiData(response);
      setCandidatesByJob((current) => ({
        ...current,
        [jobId]: (current[jobId] || []).map((candidate) =>
          candidate.id === candidateId
            ? normalizeCandidate(updatedCandidate || { ...candidate, notes })
            : candidate
        ),
      }));
      setCandidateNotesDraft(updatedCandidate?.notes || notes || "");
      notify("success", "Anotações salvas", "As observações do processo foram atualizadas.");
    } catch (error) {
      notify("error", "Não foi possível salvar as anotações", getApiErrorMessage(error));
    } finally {
      setPendingAction("");
    }
  }

  function handleCandidateDrop(stage) {
    if (!draggedCandidate || !selectedJobId) return;
    void moveCandidate(selectedJobId, draggedCandidate.candidateId, stage);
    setDraggedCandidate(null);
  }

  function runCommand(action) {
    setCommandOpen(false);
    setCommandSearch("");

    if (action.id === "new-job") navigate("/admin/criar-vaga");
    if (action.id === "search") {
      window.setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (action.id === "export") exportJobsCsv();
    if (action.id === "toggle-view") {
      setViewMode((current) => (current === "grid" ? "list" : "grid"));
    }
  }

  function renderJobCard(job) {
    const candidates = candidatesByJob[job.id] || [];
    const interviews = candidates.filter((candidate) => candidate.stage === "entrevista").length;
    const quality = getJobQuality(job);
    const status = JOB_STATUS[job.status] || JOB_STATUS.publicada;
    const isSelected = selectedJobs.includes(job.id);

    return (
      <article
        key={job.id}
        className={`see-job-card see-job-card--${viewMode} ${isSelected ? "see-job-card--selected" : ""}`}
      >
        <div className="see-job-card__selection">
          <button
            type="button"
            className={`see-checkbox ${isSelected ? "see-checkbox--active" : ""}`}
            onClick={() => toggleJobSelection(job.id)}
            aria-label={isSelected ? "Desmarcar vaga" : "Selecionar vaga"}
            aria-pressed={isSelected}
          >
            <Icon name="check" size={12} />
          </button>
        </div>

        <div className="see-job-card__accent" />

        <div className="see-job-card__header">
          <div className="see-job-card__logo">
            {job.company.slice(0, 2).toUpperCase()}
          </div>

          <div className="see-job-card__header-content">
            <span className="see-job-card__company">{job.company}</span>
            <h3 className="see-job-card__title">{job.title}</h3>
          </div>

          <span className={`see-status see-status--${status.tone}`}>
            <span className="see-status__dot" />
            {status.label}
          </span>
        </div>

        <div className="see-job-card__meta">
          <span><Icon name="map" size={13} />{job.location}</span>
          <span><Icon name="monitor" size={13} />{job.workMode}</span>
          <span><Icon name="briefcase" size={13} />{job.employmentType}</span>
        </div>

        <p className="see-job-card__description">
          {job.description || "Nenhuma descrição foi adicionada a esta oportunidade."}
        </p>

        <div className="see-job-card__tags">
          {(job.tags || []).slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          {(job.tags || []).length > 4 && <span>+{job.tags.length - 4}</span>}
        </div>

        <div className="see-job-card__metrics">
          <div>
            <span className="see-job-card__metric-label">Candidatos</span>
            <strong>{candidates.length}</strong>
          </div>
          <div>
            <span className="see-job-card__metric-label">Entrevistas</span>
            <strong>{interviews}</strong>
          </div>
          <div>
            <span className="see-job-card__metric-label">Qualidade</span>
            <strong>{quality}%</strong>
          </div>
        </div>

        <div className="see-job-card__quality">
          <div className="see-job-card__quality-head">
            <span>Completude da publicação</span>
            <span>{quality}%</span>
          </div>
          <div className="see-job-card__quality-track">
            <div style={{ width: `${quality}%` }} />
          </div>
        </div>

        <div className="see-job-card__footer">
          <span className="see-job-card__date">
            <Icon name="clock" size={13} />
            {formatRelativeDate(job.createdAt)}
          </span>

          <div className="see-job-card__actions">
            <button type="button" onClick={() => openCandidates(job.id)} title="Ver candidatos">
              <Icon name="users" size={16} />
            </button>
            <button type="button" onClick={() => duplicateJob(job.id)} title="Duplicar vaga">
              <Icon name="copy" size={16} />
            </button>
            <button type="button" className="see-job-card__primary" onClick={() => openJob(job.id)}>
              Ver detalhes <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  function renderCandidateCard(candidate) {
    const stage = CANDIDATE_STAGES.find((item) => item.id === candidate.stage) || CANDIDATE_STAGES[0];

    return (
      <article
        key={candidate.id}
        className="see-candidate-card"
        draggable
        tabIndex={0}
        role="button"
        aria-label={`Abrir perfil de ${candidate.name}`}
        onDragStart={() => setDraggedCandidate({ candidateId: candidate.id })}
        onDragEnd={() => setDraggedCandidate(null)}
        onMouseDown={(event) => event.currentTarget.focus()}
        onClick={() => openCandidateProfile(candidate)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openCandidateProfile(candidate);
          }
        }}
      >
        <div className="see-candidate-card__top">
          <div className="see-avatar">
            {candidate.name
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </div>

          <div className="see-candidate-card__identity">
            <strong>{candidate.name}</strong>
            <span>{candidate.experience || "Experiência não informada"}</span>
          </div>

          <span className={`see-candidate-stage see-candidate-stage--${stage.tone}`}>
            {stage.label}
          </span>
        </div>

        <div className="see-candidate-card__details">
          <span><Icon name="map" size={12} />{candidate.location || "Local não informado"}</span>
          <span><Icon name="calendar" size={12} />{formatRelativeDate(candidate.appliedAt)}</span>
        </div>

        <div className="see-candidate-card__skills">
          {(candidate.skills || []).slice(0, 3).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>

        <div className="see-rating" aria-label={`Avaliação ${candidate.rating || 0} de 5`}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              className={rating <= (candidate.rating || 0) ? "see-rating__star see-rating__star--active" : "see-rating__star"}
              onClick={(event) => {
                event.stopPropagation();
                updateCandidateRating(selectedJobId, candidate.id, rating);
              }}
              aria-label={`Avaliar com ${rating} estrelas`}
            >
              <Icon name="star" size={13} />
            </button>
          ))}
        </div>
      </article>
    );
  }

  const activeFiltersCount = [
    statusFilter !== "todas",
    workModeFilter !== "todos",
    employmentFilter !== "todos",
  ].filter(Boolean).length;

  return (
    <>
      <style>{`
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        html, body, #root { min-width: 320px; min-height: 100%; margin: 0; }
        body { background: #050609; }
        button, input, select, textarea { font: inherit; }
        button { border: 0; }

        .see-app {
          --bg: #050609;
          --surface: rgba(18, 20, 29, .76);
          --surface-strong: rgba(22, 24, 35, .96);
          --border: rgba(255,255,255,.085);
          --border-hover: rgba(255,255,255,.17);
          --text: #f7f7fb;
          --secondary: #9b9daa;
          --muted: #686a77;
          --blue: #527dff;
          --blue-light: #8ba9ff;
          --purple: #8b5cf6;
          --pink: #ff4d8d;
          --green: #4ade80;
          --orange: #fbbf24;
          --red: #fb7185;
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          color: var(--text);
          background:
            radial-gradient(circle at 10% 5%, rgba(255,77,141,.1), transparent 29%),
            radial-gradient(circle at 90% 8%, rgba(82,125,255,.13), transparent 28%),
            radial-gradient(circle at 65% 100%, rgba(139,92,246,.08), transparent 32%),
            var(--bg);
          font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          isolation: isolate;
        }

        .see-app::before {
          position: fixed; z-index: -3; inset: 0; content: ""; pointer-events: none;
          opacity: .38;
          background-image:
            linear-gradient(rgba(255,255,255,.016) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.016) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, #000, transparent 92%);
        }

        .see-app::after {
          position: fixed; z-index: -2; inset: 0; content: ""; pointer-events: none;
          opacity: .055;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
        }

        .see-orb { position: fixed; z-index: -1; width: 430px; height: 430px; border-radius: 50%; filter: blur(100px); opacity: .12; pointer-events: none; animation: seeOrb 15s ease-in-out infinite; }
        .see-orb--pink { top: -220px; left: 17%; background: var(--pink); }
        .see-orb--blue { right: -220px; bottom: -180px; background: var(--blue); animation-delay: -7s; }

        .see-shell { display: grid; grid-template-columns: 268px minmax(0,1fr); min-height: 100vh; }
        .see-sidebar { position: relative; z-index: 20; display: flex; min-height: 100vh; flex-direction: column; padding: 24px 18px; border-right: 1px solid var(--border); background: rgba(7,8,13,.72); box-shadow: 20px 0 70px rgba(0,0,0,.18); backdrop-filter: blur(24px); }
        .see-brand { display: flex; min-height: 58px; align-items: center; gap: 12px; padding: 8px 10px; }
        .see-brand__symbol { position: relative; display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; overflow: hidden; color: #fff; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; background: linear-gradient(145deg,var(--pink),var(--blue)); box-shadow: 0 13px 30px rgba(255,77,141,.18), inset 0 1px rgba(255,255,255,.28); }
        .see-brand__symbol::before { position: absolute; width: 31px; height: 31px; content: ""; border: 1px solid rgba(255,255,255,.17); border-radius: 10px; transform: rotate(45deg); }
        .see-brand__symbol svg { position: relative; z-index: 1; }
        .see-brand__name { margin: 0; color: #f6f6f9; font-size: 15px; font-weight: 800; letter-spacing: -.02em; }
        .see-brand__caption { display: block; margin-top: 3px; color: var(--muted); font-size: 14px; font-weight: 700; letter-spacing: .11em; text-transform: uppercase; }
        .see-sidebar__section { margin-top: 34px; }
        .see-sidebar__label { display: block; margin: 0 12px 10px; color: #5e606c; font-size: 14px; font-weight: 850; letter-spacing: .15em; text-transform: uppercase; }
        .see-nav { display: flex; flex-direction: column; gap: 7px; }
        .see-nav__item { position: relative; display: flex; width: 100%; min-height: 48px; align-items: center; gap: 12px; padding: 0 13px; color: var(--secondary); border: 1px solid transparent; border-radius: 14px; background: transparent; cursor: pointer; text-align: left; transition: .18s ease; }
        .see-nav__item:hover { color: #fff; border-color: rgba(255,255,255,.07); background: rgba(255,255,255,.035); transform: translateX(2px); }
        .see-nav__item--active { color: #fff; border-color: rgba(255,255,255,.1); background: linear-gradient(90deg,rgba(255,77,141,.13),rgba(82,125,255,.07)); box-shadow: inset 0 1px rgba(255,255,255,.04); }
        .see-nav__item--active::before { position: absolute; top: 11px; bottom: 11px; left: 0; width: 3px; content: ""; border-radius: 0 10px 10px 0; background: linear-gradient(to bottom,#ff91b9,var(--blue)); box-shadow: 0 0 16px rgba(255,77,141,.55); }
        .see-nav__icon { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; }
        .see-nav__text { flex: 1; font-size: 14px; font-weight: 650; }

        .see-sidebar__insight { position: relative; margin-top: auto; padding: 18px; overflow: hidden; border: 1px solid rgba(139,92,246,.16); border-radius: 19px; background: linear-gradient(145deg,rgba(139,92,246,.09),rgba(82,125,255,.035)); }
        .see-sidebar__insight::before { position: absolute; top: -35px; right: -35px; width: 100px; height: 100px; content: ""; border-radius: 50%; background: var(--purple); opacity: .09; filter: blur(15px); }
        .see-sidebar__insight-icon { display: grid; width: 35px; height: 35px; place-items: center; color: #d8ccff; border: 1px solid rgba(139,92,246,.18); border-radius: 11px; background: rgba(139,92,246,.09); }
        .see-sidebar__insight strong { display: block; margin-top: 13px; color: #eae4ff; font-size: 14px; }
        .see-sidebar__insight p { margin: 7px 0 0; color: #878391; font-size: 14px; line-height: 1.6; }

        .see-main { min-width: 0; padding: 25px clamp(22px,3.8vw,52px) 56px; }
        .see-topbar { display: flex; min-height: 48px; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
        .see-breadcrumb { display: flex; align-items: center; gap: 9px; color: #666875; font-size: 14px; font-weight: 700; }
        .see-breadcrumb span:last-child { color: #a5a7b2; }
        .see-topbar__actions { display: flex; align-items: center; gap: 9px; }
        .see-top-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; gap: 8px; padding: 0 13px; color: #b4b6c0; border: 1px solid var(--border); border-radius: 13px; background: rgba(255,255,255,.035); box-shadow: inset 0 1px rgba(255,255,255,.03), 0 10px 30px rgba(0,0,0,.13); cursor: pointer; transition: .18s ease; backdrop-filter: blur(12px); }
        .see-top-button:hover { color: #fff; border-color: var(--border-hover); background: rgba(255,255,255,.06); transform: translateY(-2px); }
        .see-top-button--primary { color: #fff; border-color: rgba(255,255,255,.12); background: linear-gradient(135deg,var(--blue),var(--purple)); box-shadow: 0 14px 35px rgba(82,125,255,.2), inset 0 1px rgba(255,255,255,.18); }
        .see-top-button__text { font-size: 14px; font-weight: 780; }
        .see-key { display: inline-grid; min-width: 24px; height: 23px; place-items: center; padding: 0 5px; color: #787a87; border: 1px solid rgba(255,255,255,.07); border-radius: 7px; background: rgba(0,0,0,.18); font-size: 14px; font-weight: 850; }

        .see-hero { position: relative; display: grid; grid-template-columns: minmax(0,1fr) 280px; align-items: center; gap: 28px; padding: clamp(26px,3.7vw,39px); overflow: hidden; border: 1px solid var(--border); border-radius: 28px; background: radial-gradient(circle at 88% 5%,rgba(82,125,255,.16),transparent 31%), radial-gradient(circle at 4% 100%,rgba(255,77,141,.1),transparent 34%), linear-gradient(145deg,rgba(255,255,255,.052),rgba(255,255,255,.017)); box-shadow: 0 30px 90px rgba(0,0,0,.35), inset 0 1px rgba(255,255,255,.035); animation: seeReveal .65s cubic-bezier(.16,1,.3,1) both; backdrop-filter: blur(24px); }
        .see-hero::before { position: absolute; top: -100px; right: -60px; width: 285px; height: 285px; content: ""; border: 1px solid rgba(255,255,255,.05); border-radius: 50%; box-shadow: 0 0 0 30px rgba(255,255,255,.012), 0 0 0 65px rgba(255,255,255,.009); }
        .see-hero__content { position: relative; z-index: 1; }
        .see-eyebrow { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 15px; color: #c6c7d0; font-size: 14px; font-weight: 850; letter-spacing: .17em; text-transform: uppercase; }
        .see-eyebrow__icon { display: grid; width: 27px; height: 27px; place-items: center; color: #fff; border: 1px solid rgba(255,255,255,.09); border-radius: 9px; background: linear-gradient(145deg,rgba(255,77,141,.15),rgba(82,125,255,.13)); }
        .see-hero__title { max-width: 720px; margin: 0; color: #fff; font-size: clamp(34px,4.6vw,56px); font-weight: 850; letter-spacing: -.055em; line-height: 1; }
        .see-hero__gradient { color: transparent; background: linear-gradient(100deg,#ff91b9,#9bb3ff 48%,#d9caff 85%,#ff91b9); background-size: 220% auto; background-clip: text; -webkit-background-clip: text; animation: seeGradient 8s linear infinite; }
        .see-hero__description { max-width: 680px; margin: 16px 0 0; color: var(--secondary); font-size: 14px; line-height: 1.7; }
        .see-health { position: relative; z-index: 1; display: flex; align-items: center; gap: 15px; padding: 17px; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; background: rgba(6,7,11,.35); box-shadow: inset 0 1px rgba(255,255,255,.03); backdrop-filter: blur(18px); }
        .see-health__ring { position: relative; display: grid; width: 72px; height: 72px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: conic-gradient(var(--green) 0 var(--health),rgba(255,255,255,.055) var(--health) 100%); }
        .see-health__ring::after { position: absolute; inset: 7px; content: ""; border-radius: 50%; background: #0c0d14; }
        .see-health__ring strong { position: relative; z-index: 1; font-size: 19px; letter-spacing: -.04em; }
        .see-health__copy span { display: block; color: #777986; font-size: 14px; font-weight: 850; letter-spacing: .11em; text-transform: uppercase; }
        .see-health__copy strong { display: block; margin-top: 6px; color: #d7f6e0; font-size: 14px; }
        .see-health__copy small { display: block; margin-top: 5px; color: #666a72; font-size: 14px; line-height: 1.45; }

        .see-stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 14px; margin-top: 18px; animation: seeReveal .65s .08s cubic-bezier(.16,1,.3,1) both; }
        .see-stat { position: relative; min-height: 132px; padding: 18px; overflow: hidden; border: 1px solid var(--border); border-radius: 20px; background: linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015)); box-shadow: inset 0 1px rgba(255,255,255,.03),0 18px 45px rgba(0,0,0,.15); transition: .2s ease; backdrop-filter: blur(18px); }
        .see-stat:hover { border-color: var(--border-hover); transform: translateY(-3px); }
        .see-stat__top { display: flex; align-items: center; justify-content: space-between; }
        .see-stat__icon { display: grid; width: 36px; height: 36px; place-items: center; color: #cbd5ff; border: 1px solid rgba(82,125,255,.13); border-radius: 11px; background: rgba(82,125,255,.06); }
        .see-stat__trend { display: inline-flex; align-items: center; gap: 4px; color: #91e7ad; font-size: 14px; font-weight: 800; }
        .see-stat__value { display: block; margin-top: 18px; color: #fff; font-size: 27px; font-weight: 850; letter-spacing: -.045em; }
        .see-stat__label { display: block; margin-top: 5px; color: #737581; font-size: 14px; font-weight: 750; }

        .see-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 30px; padding: 14px; border: 1px solid var(--border); border-radius: 20px; background: linear-gradient(145deg,rgba(255,255,255,.042),rgba(255,255,255,.014)); box-shadow: inset 0 1px rgba(255,255,255,.03),0 20px 50px rgba(0,0,0,.16); animation: seeReveal .65s .14s cubic-bezier(.16,1,.3,1) both; backdrop-filter: blur(20px); }
        .see-search { position: relative; min-width: 260px; flex: 1; }
        .see-search__icon { position: absolute; top: 50%; left: 14px; display: grid; color: #656875; transform: translateY(-50%); pointer-events: none; }
        .see-search input { width: 100%; min-height: 46px; padding: 0 78px 0 43px; color: #fff; border: 1px solid rgba(255,255,255,.07); outline: 0; border-radius: 14px; background: rgba(5,6,10,.34); font-size: 14px; transition: .18s ease; }
        .see-search input::placeholder { color: #565865; }
        .see-search input:focus { border-color: rgba(82,125,255,.62); box-shadow: 0 0 0 4px rgba(82,125,255,.075); background: rgba(82,125,255,.035); }
        .see-search__shortcut { position: absolute; top: 50%; right: 11px; display: inline-flex; height: 25px; align-items: center; padding: 0 7px; color: #656875; border: 1px solid rgba(255,255,255,.06); border-radius: 7px; background: rgba(0,0,0,.17); font-size: 14px; font-weight: 800; transform: translateY(-50%); }
        .see-toolbar__controls { display: flex; align-items: center; gap: 8px; }
        .see-select { min-height: 42px; padding: 0 32px 0 11px; color: #a8aab5; border: 1px solid rgba(255,255,255,.07); outline: none; border-radius: 12px; background-color: rgba(5,6,10,.3); background-image: linear-gradient(45deg,transparent 50%,#666976 50%),linear-gradient(135deg,#666976 50%,transparent 50%); background-position: calc(100% - 16px) 18px,calc(100% - 11px) 18px; background-repeat: no-repeat; background-size: 5px 5px; appearance: none; cursor: pointer; font-size: 14px; font-weight: 700; }
        .see-select option { color: #fff; background: #151720; }
        .see-filter-wrap { position: relative; }
        .see-filter-badge { position: absolute; top: -5px; right: -5px; display: grid; width: 17px; height: 17px; place-items: center; color: #fff; border: 2px solid #0b0c12; border-radius: 50%; background: var(--pink); font-size: 14px; font-weight: 900; }
        .see-view-toggle { display: flex; padding: 4px; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; background: rgba(5,6,10,.3); }
        .see-view-toggle button { display: grid; width: 34px; height: 34px; place-items: center; color: #626572; border-radius: 9px; background: transparent; cursor: pointer; transition: .16s ease; }
        .see-view-toggle button:hover { color: #fff; }
        .see-view-toggle button.active { color: #fff; background: linear-gradient(145deg,rgba(82,125,255,.18),rgba(139,92,246,.09)); box-shadow: inset 0 1px rgba(255,255,255,.05); }

        .see-filter-panel { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)) auto; gap: 10px; margin-top: 10px; padding: 14px; border: 1px solid var(--border); border-radius: 18px; background: rgba(13,14,21,.82); animation: seeFilter .2s ease both; backdrop-filter: blur(20px); }
        .see-filter-panel label { display: flex; flex-direction: column; gap: 7px; color: #666975; font-size: 14px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .see-filter-panel .see-select { width: 100%; }
        .see-filter-clear { align-self: end; min-height: 42px; padding: 0 13px; color: #9a9ca7; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; background: rgba(255,255,255,.025); cursor: pointer; font-size: 14px; font-weight: 750; }
        .see-filter-clear:hover { color: #fff; background: rgba(255,255,255,.05); }

        .see-section-head { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin: 28px 2px 15px; }
        .see-section-head h2 { margin: 0; color: #f4f4f7; font-size: 19px; font-weight: 800; letter-spacing: -.025em; }
        .see-section-head p { margin: 6px 0 0; color: #686a76; font-size: 14px; }
        .see-section-head__count { color: #686a76; font-size: 14px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }

        .see-bulk { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 13px; padding: 12px 14px; border: 1px solid rgba(82,125,255,.18); border-radius: 16px; background: linear-gradient(145deg,rgba(82,125,255,.09),rgba(139,92,246,.04)); animation: seeFilter .2s ease both; }
        .see-bulk__label { display: flex; align-items: center; gap: 9px; color: #c7d3ff; font-size: 14px; font-weight: 750; }
        .see-bulk__actions { display: flex; gap: 8px; }
        .see-bulk button { display: inline-flex; min-height: 34px; align-items: center; gap: 6px; padding: 0 10px; color: #aeb6d0; border: 1px solid rgba(255,255,255,.07); border-radius: 10px; background: rgba(255,255,255,.03); cursor: pointer; font-size: 14px; font-weight: 750; }
        .see-bulk button:hover { color: #fff; background: rgba(255,255,255,.06); }
        .see-bulk button.danger:hover { color: #ffc0ca; border-color: rgba(251,113,133,.18); background: rgba(251,113,133,.06); }

        .see-jobs { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 17px; animation: seeReveal .65s .2s cubic-bezier(.16,1,.3,1) both; }
        .see-jobs--list { grid-template-columns: 1fr; }
        .see-job-card { position: relative; min-width: 0; padding: 23px; overflow: hidden; border: 1px solid var(--border); border-radius: 23px; background: linear-gradient(145deg,rgba(255,255,255,.047),rgba(255,255,255,.015)); box-shadow: inset 0 1px rgba(255,255,255,.035),0 24px 65px rgba(0,0,0,.2); transition: border-color .22s ease, transform .28s cubic-bezier(.16,1,.3,1), box-shadow .22s ease; backdrop-filter: blur(21px); }
        .see-job-card:hover { border-color: rgba(82,125,255,.22); box-shadow: inset 0 1px rgba(255,255,255,.045),0 32px 85px rgba(0,0,0,.3),0 0 50px rgba(82,125,255,.055); transform: translateY(-5px); }
        .see-job-card--selected { border-color: rgba(82,125,255,.42); box-shadow: 0 0 0 3px rgba(82,125,255,.07),0 28px 70px rgba(0,0,0,.26); }
        .see-job-card__accent { position: absolute; top: 0; left: 18%; width: 150px; height: 1px; background: linear-gradient(90deg,transparent,rgba(139,168,255,.8),transparent); opacity: .6; }
        .see-job-card__selection { position: absolute; z-index: 4; top: 15px; right: 15px; opacity: 0; transform: scale(.8); transition: .18s ease; }
        .see-job-card:hover .see-job-card__selection, .see-job-card--selected .see-job-card__selection { opacity: 1; transform: scale(1); }
        .see-checkbox { display: grid; width: 28px; height: 28px; place-items: center; color: transparent; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; background: rgba(8,9,14,.76); cursor: pointer; backdrop-filter: blur(10px); }
        .see-checkbox--active { color: #fff; border-color: transparent; background: linear-gradient(135deg,var(--blue),var(--purple)); }
        .see-job-card__header { display: flex; align-items: flex-start; gap: 12px; padding-right: 34px; }
        .see-job-card__logo { display: grid; width: 48px; height: 48px; flex: 0 0 auto; place-items: center; color: #fff; border: 1px solid rgba(255,255,255,.1); border-radius: 15px; background: linear-gradient(145deg,rgba(82,125,255,.65),rgba(139,92,246,.55),rgba(255,77,141,.55)); box-shadow: 0 13px 30px rgba(82,125,255,.13),inset 0 1px rgba(255,255,255,.16); font-size: 14px; font-weight: 900; }
        .see-job-card__header-content { min-width: 0; flex: 1; }
        .see-job-card__company { display: block; overflow: hidden; color: #727481; font-size: 14px; font-weight: 850; letter-spacing: .11em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
        .see-job-card__title { margin: 6px 0 0; overflow: hidden; color: #f5f5f8; font-size: 19px; font-weight: 810; letter-spacing: -.035em; text-overflow: ellipsis; white-space: nowrap; }
        .see-status { display: inline-flex; min-height: 27px; align-items: center; gap: 6px; padding: 0 9px; border: 1px solid currentColor; border-radius: 999px; font-size: 14px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; opacity: .85; }
        .see-status__dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }
        .see-status--green { color: #7ef0a2; background: rgba(74,222,128,.055); }
        .see-status--orange { color: #fbd36d; background: rgba(251,191,36,.055); }
        .see-status--muted { color: #8b8e9a; background: rgba(255,255,255,.025); }
        .see-job-card__meta { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; }
        .see-job-card__meta span { display: inline-flex; min-height: 28px; align-items: center; gap: 6px; padding: 0 9px; color: #8c8e9a; border: 1px solid rgba(255,255,255,.055); border-radius: 9px; background: rgba(255,255,255,.022); font-size: 14px; font-weight: 650; }
        .see-job-card__description { display: -webkit-box; min-height: 48px; margin: 17px 0 0; overflow: hidden; color: #858793; font-size: 14px; line-height: 1.7; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
        .see-job-card__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 15px; }
        .see-job-card__tags span { display: inline-flex; min-height: 26px; align-items: center; padding: 0 8px; color: #b7c5f4; border: 1px solid rgba(82,125,255,.11); border-radius: 8px; background: rgba(82,125,255,.045); font-size: 14px; font-weight: 750; }
        .see-job-card__metrics { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; margin-top: 19px; }
        .see-job-card__metrics > div { padding: 11px; border: 1px solid rgba(255,255,255,.055); border-radius: 12px; background: rgba(255,255,255,.021); }
        .see-job-card__metric-label { display: block; color: #5f616d; font-size: 14px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .see-job-card__metrics strong { display: block; margin-top: 6px; color: #e5e6eb; font-size: 14px; font-weight: 820; }
        .see-job-card__quality { margin-top: 16px; }
        .see-job-card__quality-head { display: flex; justify-content: space-between; color: #626470; font-size: 14px; font-weight: 750; }
        .see-job-card__quality-track { height: 6px; margin-top: 7px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.05); }
        .see-job-card__quality-track div { height: 100%; border-radius: inherit; background: linear-gradient(90deg,var(--blue),var(--purple),var(--pink)); box-shadow: 0 0 12px rgba(82,125,255,.3); transition: width .45s cubic-bezier(.16,1,.3,1); }
        .see-job-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 19px; padding-top: 17px; border-top: 1px solid rgba(255,255,255,.05); }
        .see-job-card__date { display: inline-flex; align-items: center; gap: 6px; color: #626470; font-size: 14px; font-weight: 700; }
        .see-job-card__actions { display: flex; align-items: center; gap: 6px; }
        .see-job-card__actions button { display: grid; min-width: 34px; height: 34px; place-items: center; color: #777a87; border: 1px solid rgba(255,255,255,.065); border-radius: 10px; background: rgba(255,255,255,.025); cursor: pointer; transition: .17s ease; }
        .see-job-card__actions button:hover { color: #fff; border-color: rgba(255,255,255,.13); background: rgba(255,255,255,.055); transform: translateY(-2px); }
        .see-job-card__actions .see-job-card__primary { display: inline-flex; min-width: auto; padding: 0 11px; gap: 7px; color: #d8e1ff; border-color: rgba(82,125,255,.15); background: rgba(82,125,255,.065); font-size: 14px; font-weight: 800; }

        .see-job-card--list { display: grid; grid-template-columns: minmax(260px,1.1fr) minmax(210px,.8fr) minmax(180px,.7fr); align-items: center; gap: 20px; }
        .see-job-card--list .see-job-card__meta, .see-job-card--list .see-job-card__description, .see-job-card--list .see-job-card__tags { grid-column: 1; }
        .see-job-card--list .see-job-card__metrics { grid-column: 2; grid-row: 1 / span 4; margin: 0; }
        .see-job-card--list .see-job-card__quality { grid-column: 3; grid-row: 1; margin: 0; }
        .see-job-card--list .see-job-card__footer { grid-column: 3; grid-row: 2 / span 3; align-self: end; margin: 0; padding: 0; border: 0; }

        .see-empty { display: grid; min-height: 350px; place-items: center; padding: 35px; border: 1px dashed rgba(255,255,255,.1); border-radius: 24px; background: rgba(255,255,255,.015); text-align: center; }
        .see-empty__icon { display: grid; width: 72px; height: 72px; margin: 0 auto; place-items: center; color: #8b97bc; border: 1px solid rgba(82,125,255,.14); border-radius: 22px; background: linear-gradient(145deg,rgba(82,125,255,.09),rgba(139,92,246,.04)); }
        .see-empty h3 { margin: 18px 0 0; font-size: 20px; }
        .see-empty p { max-width: 430px; margin: 9px auto 0; color: #6e707c; font-size: 14px; line-height: 1.7; }
        .see-empty button { display: inline-flex; min-height: 42px; align-items: center; gap: 8px; margin-top: 19px; padding: 0 14px; color: #fff; border-radius: 13px; background: linear-gradient(135deg,var(--blue),var(--purple)); box-shadow: 0 14px 35px rgba(82,125,255,.2); cursor: pointer; font-size: 14px; font-weight: 800; }

        .see-overlay { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 22px; background: rgba(2,3,6,.78); animation: seeOverlay .18s ease both; backdrop-filter: blur(17px); }
        .see-modal { width: min(100%,850px); max-height: calc(100vh - 44px); overflow: auto; border: 1px solid rgba(255,255,255,.11); border-radius: 25px; background: linear-gradient(145deg,rgba(24,26,37,.99),rgba(10,11,17,.99)); box-shadow: 0 50px 150px rgba(0,0,0,.7),inset 0 1px rgba(255,255,255,.05); animation: seeDialog .28s cubic-bezier(.16,1,.3,1) both; }
        .see-modal--wide { width: min(100%,1240px); }
        .see-modal--small { width: min(100%,470px); }
        .see-modal__accent { height: 5px; background: linear-gradient(90deg,var(--blue),var(--purple),var(--pink)); }
        .see-modal__header { position: sticky; z-index: 5; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 21px; border-bottom: 1px solid rgba(255,255,255,.06); background: rgba(16,17,25,.9); backdrop-filter: blur(20px); }
        .see-modal__title-wrap { display: flex; min-width: 0; align-items: center; gap: 12px; }
        .see-modal__icon { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; color: #dce4ff; border: 1px solid rgba(82,125,255,.16); border-radius: 13px; background: rgba(82,125,255,.07); }
        .see-modal__title { margin: 0; overflow: hidden; color: #f4f4f7; font-size: 16px; font-weight: 800; letter-spacing: -.02em; text-overflow: ellipsis; white-space: nowrap; }
        .see-modal__subtitle { display: block; margin-top: 4px; color: #70727e; font-size: 14px; }
        .see-modal__close { display: grid; width: 37px; height: 37px; flex: 0 0 auto; place-items: center; color: #737582; border: 1px solid rgba(255,255,255,.07); border-radius: 11px; background: rgba(255,255,255,.025); cursor: pointer; }
        .see-modal__close:hover { color: #fff; background: rgba(255,255,255,.055); }
        .see-modal__body { padding: 24px; }

        .see-detail-cover { position: relative; min-height: 150px; padding: 25px; overflow: hidden; border-radius: 20px; background: radial-gradient(circle at 10% 20%,rgba(255,255,255,.13),transparent 25%),linear-gradient(135deg,#3159d9,#7650d8 55%,#bd437e); }
        .see-detail-cover::after { position: absolute; right: -80px; bottom: -100px; width: 270px; height: 270px; content: ""; border: 1px solid rgba(255,255,255,.15); border-radius: 50%; box-shadow: 0 0 0 35px rgba(255,255,255,.045),0 0 0 70px rgba(255,255,255,.025); }
        .see-detail-cover__content { position: relative; z-index: 1; }
        .see-detail-cover__company { color: rgba(255,255,255,.72); font-size: 14px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
        .see-detail-cover h2 { max-width: 680px; margin: 10px 0 0; color: #fff; font-size: clamp(25px,4vw,38px); font-weight: 850; letter-spacing: -.045em; line-height: 1.05; }
        .see-detail-cover__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .see-detail-cover__meta span { display: inline-flex; min-height: 30px; align-items: center; gap: 6px; padding: 0 10px; color: rgba(255,255,255,.83); border: 1px solid rgba(255,255,255,.15); border-radius: 9px; background: rgba(5,6,10,.17); font-size: 14px; font-weight: 700; backdrop-filter: blur(10px); }
        .see-detail-tabs { display: flex; gap: 6px; margin-top: 18px; padding: 5px; overflow-x: auto; border: 1px solid rgba(255,255,255,.06); border-radius: 14px; background: rgba(5,6,10,.25); }
        .see-detail-tabs button { min-height: 36px; padding: 0 12px; color: #777985; border-radius: 10px; background: transparent; cursor: pointer; font-size: 14px; font-weight: 780; white-space: nowrap; }
        .see-detail-tabs button.active { color: #fff; background: linear-gradient(145deg,rgba(82,125,255,.18),rgba(139,92,246,.08)); }
        .see-detail-grid { display: grid; grid-template-columns: minmax(0,1fr) 280px; gap: 17px; margin-top: 18px; }
        .see-detail-panel { padding: 19px; border: 1px solid rgba(255,255,255,.06); border-radius: 17px; background: rgba(255,255,255,.022); }
        .see-detail-panel h3 { margin: 0; color: #e8e9ed; font-size: 14px; }
        .see-detail-copy { margin: 12px 0 0; color: #9294a0; font-size: 14px; line-height: 1.75; white-space: pre-line; }
        .see-detail-side { display: flex; flex-direction: column; gap: 10px; }
        .see-detail-info { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid rgba(255,255,255,.055); border-radius: 13px; background: rgba(255,255,255,.02); }
        .see-detail-info__icon { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; color: #aebcff; border: 1px solid rgba(82,125,255,.11); border-radius: 10px; background: rgba(82,125,255,.05); }
        .see-detail-info span { display: block; color: #5f616d; font-size: 14px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .see-detail-info strong { display: block; margin-top: 4px; overflow: hidden; color: #c7c8cf; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
        .see-detail-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
        .see-detail-tags span { display: inline-flex; min-height: 28px; align-items: center; padding: 0 9px; color: #bdcafa; border: 1px solid rgba(82,125,255,.12); border-radius: 8px; background: rgba(82,125,255,.05); font-size: 14px; font-weight: 700; }
        .see-detail-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 19px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.055); }
        .see-action-btn { display: inline-flex; min-height: 40px; align-items: center; gap: 7px; padding: 0 12px; color: #a9abb5; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; background: rgba(255,255,255,.025); cursor: pointer; font-size: 14px; font-weight: 780; transition: .17s ease; }
        .see-action-btn:hover { color: #fff; border-color: rgba(255,255,255,.13); background: rgba(255,255,255,.05); transform: translateY(-2px); }
        .see-action-btn--primary { color: #fff; border-color: rgba(255,255,255,.1); background: linear-gradient(135deg,var(--blue),var(--purple)); box-shadow: 0 13px 30px rgba(82,125,255,.18); }
        .see-action-btn--danger:hover { color: #ffc0ca; border-color: rgba(251,113,133,.18); background: rgba(251,113,133,.055); }

        .see-candidate-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .see-candidate-toolbar__left, .see-candidate-toolbar__right { display: flex; align-items: center; gap: 8px; }
        .see-candidate-search { position: relative; width: min(330px,45vw); }
        .see-candidate-search svg { position: absolute; top: 50%; left: 12px; color: #646673; transform: translateY(-50%); }
        .see-candidate-search input { width: 100%; min-height: 41px; padding: 0 12px 0 37px; color: #fff; border: 1px solid rgba(255,255,255,.07); outline: none; border-radius: 12px; background: rgba(5,6,10,.3); font-size: 14px; }
        .see-candidate-search input:focus { border-color: rgba(82,125,255,.55); box-shadow: 0 0 0 3px rgba(82,125,255,.07); }
        .see-candidate-board { display: grid; grid-template-columns: repeat(6,minmax(230px,1fr)); gap: 12px; padding-bottom: 7px; overflow-x: auto; }
        .see-stage-column { min-height: 420px; padding: 11px; border: 1px solid rgba(255,255,255,.055); border-radius: 16px; background: rgba(5,6,10,.25); transition: .18s ease; }
        .see-stage-column--drop { border-color: rgba(82,125,255,.35); background: rgba(82,125,255,.05); }
        .see-stage-column__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 3px 11px; }
        .see-stage-column__title { display: flex; align-items: center; gap: 7px; color: #aeb0ba; font-size: 14px; font-weight: 800; }
        .see-stage-column__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 10px currentColor; }
        .see-stage-column__dot--purple { background: var(--purple); }
        .see-stage-column__dot--orange { background: var(--orange); }
        .see-stage-column__dot--pink { background: var(--pink); }
        .see-stage-column__dot--green { background: var(--green); }
        .see-stage-column__dot--muted { background: #777985; }
        .see-stage-column__count { display: grid; min-width: 23px; height: 23px; place-items: center; color: #737581; border: 1px solid rgba(255,255,255,.055); border-radius: 7px; background: rgba(255,255,255,.022); font-size: 14px; font-weight: 800; }
        .see-stage-column__cards { display: flex; flex-direction: column; gap: 9px; }
        .see-candidate-card { padding: 12px; border: 1px solid rgba(255,255,255,.06); border-radius: 13px; background: linear-gradient(145deg,rgba(255,255,255,.038),rgba(255,255,255,.015)); box-shadow: 0 12px 30px rgba(0,0,0,.12); cursor: grab; transition: .18s ease; }
        .see-candidate-card:hover { border-color: rgba(82,125,255,.17); background: rgba(82,125,255,.035); transform: translateY(-2px); }
        .see-candidate-card:active { cursor: grabbing; }
        .see-candidate-card__top { display: flex; align-items: center; gap: 9px; }
        .see-avatar { display: grid; width: 36px; height: 36px; flex: 0 0 auto; place-items: center; color: #fff; border: 1px solid rgba(255,255,255,.09); border-radius: 11px; background: linear-gradient(145deg,rgba(82,125,255,.7),rgba(139,92,246,.6)); font-size: 14px; font-weight: 900; }
        .see-candidate-card__identity { min-width: 0; flex: 1; }
        .see-candidate-card__identity strong { display: block; overflow: hidden; color: #e8e9ed; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
        .see-candidate-card__identity span { display: block; margin-top: 4px; overflow: hidden; color: #676976; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
        .see-candidate-stage { display: none; }
        .see-candidate-card__details { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }
        .see-candidate-card__details span { display: flex; align-items: center; gap: 5px; color: #6e707c; font-size: 14px; }
        .see-candidate-card__skills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
        .see-candidate-card__skills span { display: inline-flex; min-height: 22px; align-items: center; padding: 0 6px; color: #aeb9df; border: 1px solid rgba(82,125,255,.09); border-radius: 6px; background: rgba(82,125,255,.04); font-size: 14px; font-weight: 700; }
        .see-rating { display: flex; gap: 1px; margin-top: 9px; }
        .see-rating__star { display: grid; width: 18px; height: 18px; place-items: center; color: #444651; background: transparent; cursor: pointer; }
        .see-rating__star--active { color: #f8ca52; }
        .see-rating__star svg { fill: currentColor; }

        .see-candidate-list { display: flex; flex-direction: column; gap: 9px; }
        .see-candidate-list .see-candidate-card { display: grid; grid-template-columns: minmax(210px,1fr) minmax(170px,.75fr) minmax(180px,.8fr) auto; align-items: center; gap: 15px; cursor: pointer; }
        .see-candidate-list .see-candidate-card__details, .see-candidate-list .see-candidate-card__skills, .see-candidate-list .see-rating { margin: 0; }
        .see-candidate-list .see-candidate-stage { display: inline-flex; min-height: 26px; align-items: center; padding: 0 8px; border: 1px solid currentColor; border-radius: 999px; font-size: 14px; font-weight: 800; opacity: .82; }
        .see-candidate-stage--blue { color: #9bb4ff; background: rgba(82,125,255,.055); }
        .see-candidate-stage--purple { color: #c4afff; background: rgba(139,92,246,.055); }
        .see-candidate-stage--orange { color: #f8d36d; background: rgba(251,191,36,.055); }
        .see-candidate-stage--pink { color: #ff9abd; background: rgba(255,77,141,.055); }
        .see-candidate-stage--green { color: #8bf0a9; background: rgba(74,222,128,.055); }
        .see-candidate-stage--muted { color: #8d8f9b; background: rgba(255,255,255,.025); }

        .see-form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 15px; }
        .see-field { min-width: 0; }
        .see-field--full { grid-column: 1 / -1; }
        .see-field label { display: block; margin-bottom: 7px; color: #b7b9c2; font-size: 14px; font-weight: 750; }
        .see-field input, .see-field textarea { width: 100%; color: #fff; border: 1px solid rgba(255,255,255,.07); outline: none; border-radius: 13px; background: rgba(5,6,10,.32); font-size: 14px; transition: .18s ease; }
        .see-field input { min-height: 45px; padding: 0 13px; }
        .see-field textarea { min-height: 105px; padding: 13px; resize: vertical; line-height: 1.6; }
        .see-field input:focus, .see-field textarea:focus { border-color: rgba(82,125,255,.58); box-shadow: 0 0 0 3px rgba(82,125,255,.07); }
        .see-field__error { display: block; margin-top: 6px; color: #ff9aac; font-size: 14px; }

        .see-profile { display: grid; grid-template-columns: 230px minmax(0,1fr); gap: 18px; }
        .see-profile__sidebar { padding: 18px; border: 1px solid rgba(255,255,255,.06); border-radius: 17px; background: rgba(255,255,255,.02); text-align: center; }
        .see-profile__avatar { display: grid; width: 78px; height: 78px; margin: 0 auto; place-items: center; color: #fff; border: 1px solid rgba(255,255,255,.11); border-radius: 24px; background: linear-gradient(145deg,var(--blue),var(--purple),var(--pink)); box-shadow: 0 18px 45px rgba(82,125,255,.17); font-size: 17px; font-weight: 900; }
        .see-profile__sidebar h3 { margin: 15px 0 0; font-size: 15px; }
        .see-profile__sidebar p { margin: 6px 0 0; color: #70727e; font-size: 14px; }
        .see-profile__contact { display: flex; flex-direction: column; gap: 8px; margin-top: 17px; text-align: left; }
        .see-profile__contact span { display: flex; align-items: center; gap: 7px; color: #8b8d98; font-size: 14px; overflow-wrap: anywhere; }
        .see-profile__main { display: flex; flex-direction: column; gap: 12px; }
        .see-profile__panel { padding: 16px; border: 1px solid rgba(255,255,255,.06); border-radius: 15px; background: rgba(255,255,255,.02); }
        .see-profile__panel h4 { margin: 0; color: #d9dae0; font-size: 14px; }
        .see-profile__panel p { margin: 9px 0 0; color: #858793; font-size: 14px; line-height: 1.7; white-space: pre-line; }
        .see-profile__skills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .see-profile__skills span { padding: 7px 9px; color: #bdc9f6; border: 1px solid rgba(82,125,255,.11); border-radius: 8px; background: rgba(82,125,255,.05); font-size: 14px; font-weight: 700; }
        .see-profile__stage { display: flex; align-items: center; gap: 9px; }
        .see-profile__stage .see-select { flex: 1; }
        .see-resume > .see-action-btn { margin-top: 12px; }
        .see-resume__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #9bb4ff; }
        .see-resume__heading span { display: block; margin-top: 4px; color: #696b78; font-size: 14px; }
        .see-resume__section { margin-top: 15px; padding-top: 13px; border-top: 1px solid rgba(255,255,255,.06); }
        .see-resume__section h5 { margin: 0 0 9px; color: #aeb9df; font-size: 14px; text-transform: uppercase; letter-spacing: .06em; }
        .see-resume__items { display: grid; gap: 8px; }
        .see-resume__items article { padding-left: 10px; border-left: 2px solid rgba(82,125,255,.25); }
        .see-resume__items strong, .see-resume__items span { display: block; }
        .see-resume__items strong { color: #d9dae0; font-size: 14px; }
        .see-resume__items span { margin-top: 3px; color: #737581; font-size: 14px; }
        .see-resume__items article p { margin-top: 5px; }
        .see-resume__links { display: flex; flex-direction: column; gap: 7px; }
        .see-resume__links a { display: flex; align-items: center; gap: 6px; color: #9bb4ff; font-size: 14px; overflow-wrap: anywhere; }

        .see-confirm__icon { display: grid; width: 53px; height: 53px; place-items: center; color: #ffc0ca; border: 1px solid rgba(251,113,133,.16); border-radius: 17px; background: rgba(251,113,133,.065); }
        .see-confirm h2 { margin: 18px 0 0; font-size: 22px; letter-spacing: -.035em; }
        .see-confirm p { margin: 10px 0 0; color: #858793; font-size: 14px; line-height: 1.7; }
        .see-confirm__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 22px; }

        .see-command { width: min(100%,590px); overflow: hidden; border: 1px solid rgba(255,255,255,.12); border-radius: 23px; background: linear-gradient(145deg,rgba(25,27,37,.98),rgba(11,12,18,.99)); box-shadow: 0 50px 150px rgba(0,0,0,.7),inset 0 1px rgba(255,255,255,.05); animation: seeDialog .26s cubic-bezier(.16,1,.3,1) both; }
        .see-command__search { display: flex; min-height: 66px; align-items: center; gap: 12px; padding: 0 18px; border-bottom: 1px solid rgba(255,255,255,.07); }
        .see-command__search svg { color: #70727e; }
        .see-command__search input { flex: 1; height: 64px; color: #fff; border: 0; outline: 0; background: transparent; font-size: 14px; }
        .see-command__search input::placeholder { color: #5b5d69; }
        .see-command__body { padding: 10px; }
        .see-command__label { display: block; padding: 7px 9px; color: #5f616d; font-size: 14px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
        .see-command__item { display: flex; width: 100%; align-items: center; gap: 12px; padding: 11px; color: inherit; border: 1px solid transparent; border-radius: 13px; background: transparent; cursor: pointer; text-align: left; }
        .see-command__item:hover { border-color: rgba(255,255,255,.07); background: rgba(255,255,255,.04); }
        .see-command__item-icon { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; color: #d7d8de; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; background: rgba(255,255,255,.03); }
        .see-command__item-copy { min-width: 0; flex: 1; }
        .see-command__item-copy strong { display: block; color: #e9e9ed; font-size: 14px; }
        .see-command__item-copy span { display: block; margin-top: 4px; color: #6e707c; font-size: 14px; }

        .see-toast { position: fixed; z-index: 140; right: 24px; bottom: 24px; display: flex; width: min(calc(100% - 36px),360px); align-items: flex-start; gap: 12px; padding: 15px; border: 1px solid rgba(255,255,255,.09); border-radius: 17px; background: linear-gradient(145deg,rgba(22,24,34,.98),rgba(10,11,17,.98)); box-shadow: 0 30px 90px rgba(0,0,0,.58),inset 0 1px rgba(255,255,255,.045); animation: seeToast .36s cubic-bezier(.16,1,.3,1) both; backdrop-filter: blur(20px); }
        .see-toast--success { border-color: rgba(74,222,128,.15); }
        .see-toast--error { border-color: rgba(251,113,133,.17); }
        .see-toast--info { border-color: rgba(82,125,255,.17); }
        .see-toast__icon { display: grid; width: 35px; height: 35px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(255,255,255,.08); border-radius: 11px; background: rgba(255,255,255,.035); }
        .see-toast--success .see-toast__icon { color: #bdf7d0; border-color: rgba(74,222,128,.12); background: rgba(74,222,128,.06); }
        .see-toast--error .see-toast__icon { color: #ffc0ca; border-color: rgba(251,113,133,.12); background: rgba(251,113,133,.06); }
        .see-toast--info .see-toast__icon { color: #c5d3ff; border-color: rgba(82,125,255,.12); background: rgba(82,125,255,.06); }
        .see-toast__title { display: block; color: #f0f1f4; font-size: 14px; font-weight: 800; }
        .see-toast__description { display: block; margin-top: 5px; color: #797b87; font-size: 14px; line-height: 1.55; }

        .see-mobile-nav { display: none; }
        .see-app button:focus-visible, .see-app input:focus-visible, .see-app select:focus-visible, .see-app textarea:focus-visible { outline: 2px solid rgba(139,169,255,.76); outline-offset: 3px; }

        @keyframes seeReveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes seeOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes seeDialog { from { opacity: 0; transform: translateY(18px) scale(.965); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes seeToast { from { opacity: 0; transform: translateY(20px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes seeFilter { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes seeGradient { to { background-position: 220% center; } }
        @keyframes seeOrb { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(28px,-24px,0) scale(1.08); } }

        /* Legibilidade: controles e dados operacionais com piso de 12px. */
        .see-app :is(button, input, select, textarea) { font-size: 14px !important; }
        .see-app :is(p, small, label) { font-size: 14px !important; }
        .see-app span { font-size: 14px; }
        .see-candidate-card__identity strong,
        .see-resume__items strong,
        .see-detail-info strong { font-size: 14px; }
        .see-modal__subtitle,
        .see-profile__contact span,
        .see-resume__items span,
        .see-resume__links a { font-size: 14px; }

        @media (max-width: 1260px) {
          .see-jobs { grid-template-columns: 1fr; }
          .see-job-card--list { grid-template-columns: minmax(240px,1fr) minmax(180px,.7fr); }
          .see-job-card--list .see-job-card__quality, .see-job-card--list .see-job-card__footer { grid-column: 2; }
          .see-filter-panel { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .see-filter-clear { align-self: auto; }
        }

        @media (max-width: 1080px) {
          .see-hero { grid-template-columns: 1fr; }
          .see-health { max-width: 330px; }
          .see-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .see-toolbar { align-items: stretch; flex-direction: column; }
          .see-toolbar__controls { flex-wrap: wrap; }
          .see-select { flex: 1; }
          .see-detail-grid { grid-template-columns: 1fr; }
          .see-profile { grid-template-columns: 1fr; }
        }

        @media (max-width: 920px) {
          .see-shell { display: block; }
          .see-sidebar { min-height: auto; padding: 14px 20px; border-right: 0; border-bottom: 1px solid var(--border); }
          .see-brand { min-height: 50px; padding: 0; }
          .see-sidebar__section, .see-sidebar__insight { display: none; }
          .see-main { padding-top: 21px; padding-bottom: 108px; }
          .see-mobile-nav { position: fixed; z-index: 60; right: 16px; bottom: 16px; left: 16px; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; padding: 8px; border: 1px solid rgba(255,255,255,.1); border-radius: 20px; background: rgba(12,13,19,.87); box-shadow: 0 25px 70px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.04); backdrop-filter: blur(24px); }
          .see-mobile-nav button { display: flex; min-height: 55px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: #757783; border: 1px solid transparent; border-radius: 14px; background: transparent; cursor: pointer; }
          .see-mobile-nav button.active { color: #fff; border-color: rgba(255,255,255,.07); background: linear-gradient(145deg,rgba(255,77,141,.12),rgba(82,125,255,.08)); }
          .see-mobile-nav span { font-size: 14px; font-weight: 750; }
          .see-toast { bottom: 92px; }
        }

        @media (max-width: 720px) {
          .see-breadcrumb { display: none; }
          .see-top-button__text, .see-key { display: none; }
          .see-top-button { width: 42px; padding: 0; }
          .see-hero { padding: 24px 20px; border-radius: 23px; }
          .see-stats { grid-template-columns: 1fr 1fr; }
          .see-stat { min-height: 118px; }
          .see-search { min-width: 100%; }
          .see-filter-panel { grid-template-columns: 1fr; }
          .see-job-card { padding: 20px 17px; }
          .see-job-card__header { padding-right: 0; flex-wrap: wrap; }
          .see-status { margin-left: 60px; }
          .see-job-card__metrics { grid-template-columns: repeat(3,minmax(0,1fr)); }
          .see-job-card__footer { align-items: flex-start; flex-direction: column; }
          .see-job-card__actions { width: 100%; }
          .see-job-card__actions .see-job-card__primary { flex: 1; }
          .see-job-card--list { display: block; }
          .see-job-card--list .see-job-card__metrics, .see-job-card--list .see-job-card__quality, .see-job-card--list .see-job-card__footer { margin-top: 16px; }
          .see-candidate-toolbar { align-items: stretch; flex-direction: column; }
          .see-candidate-toolbar__left, .see-candidate-toolbar__right { flex-wrap: wrap; }
          .see-candidate-search { width: 100%; }
          .see-form-grid { grid-template-columns: 1fr; }
          .see-field--full { grid-column: auto; }
          .see-candidate-list .see-candidate-card { display: block; }
          .see-candidate-list .see-candidate-card__details, .see-candidate-list .see-candidate-card__skills, .see-candidate-list .see-rating, .see-candidate-list .see-candidate-stage { margin-top: 10px; }
        }

        @media (max-width: 520px) {
          .see-sidebar { padding-right: 16px; padding-left: 16px; }
          .see-main { padding-right: 16px; padding-left: 16px; }
          .see-hero__title { font-size: clamp(33px,12vw,46px); }
          .see-stats { grid-template-columns: 1fr; }
          .see-toolbar__controls .see-select { width: 100%; flex-basis: 100%; }
          .see-view-toggle { flex: 1; }
          .see-view-toggle button { flex: 1; }
          .see-bulk { align-items: stretch; flex-direction: column; }
          .see-bulk__actions { display: grid; grid-template-columns: repeat(3,1fr); }
          .see-job-card__metrics { grid-template-columns: 1fr; }
          .see-modal__body { padding: 18px; }
          .see-detail-cover { padding: 21px 18px; }
          .see-detail-actions, .see-confirm__actions { flex-direction: column; }
          .see-action-btn { justify-content: center; width: 100%; }
          .see-toast { right: 18px; left: 18px; width: auto; }
        }

        @media (prefers-reduced-motion: reduce) {
          *,*::before,*::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>

      <div className="see-app">
        <div className="see-orb see-orb--pink" />
        <div className="see-orb see-orb--blue" />

        <div className="see-shell">
          <aside className="see-sidebar">
            <div className="see-brand">
              <div className="see-brand__symbol"><Icon name="logo" size={21} /></div>
              <div>
                <p className="see-brand__name">Painel Admin</p>
                <span className="see-brand__caption">Área de controle</span>
              </div>
            </div>

            <div className="see-sidebar__section">
              <span className="see-sidebar__label">Navegação</span>
              <nav className="see-nav" aria-label="Navegação administrativa">
                <button type="button" className="see-nav__item" onClick={() => navigate("/admin/home")}>
                  <span className="see-nav__icon"><Icon name="home" size={18} /></span>
                  <span className="see-nav__text">Visão geral</span>
                </button>
                <button type="button" className="see-nav__item" onClick={() => navigate("/admin/criar-vaga")}>
                  <span className="see-nav__icon"><Icon name="plus" size={18} /></span>
                  <span className="see-nav__text">Criar vaga</span>
                </button>
                <button type="button" className="see-nav__item see-nav__item--active" aria-current="page">
                  <span className="see-nav__icon"><Icon name="briefcase" size={18} /></span>
                  <span className="see-nav__text">Ver vagas</span>
                </button>
              </nav>
            </div>

            <div className="see-sidebar__insight">
              <span className="see-sidebar__insight-icon"><Icon name="sparkles" size={17} /></span>
              <strong>Insight inteligente</strong>
              <p>{insight}</p>
            </div>
          </aside>

          <main className="see-main">
            <header className="see-topbar">
              <div className="see-breadcrumb">
                <span>Área administrativa</span><span>/</span><span>Gestão de vagas</span>
              </div>

              <div className="see-topbar__actions">
                <button type="button" className="see-top-button" onClick={() => setCommandOpen(true)}>
                  <Icon name="command" size={16} /><span className="see-top-button__text">Comandos</span><span className="see-key">Ctrl K</span>
                </button>
                <button type="button" className="see-top-button" onClick={exportJobsCsv}>
                  <Icon name="download" size={16} /><span className="see-top-button__text">Exportar</span>
                </button>
                <button type="button" className="see-top-button see-top-button--primary" onClick={() => navigate("/admin/criar-vaga")}>
                  <Icon name="plus" size={16} /><span className="see-top-button__text">Nova vaga</span>
                </button>
              </div>
            </header>

            <section className="see-hero">
              <div className="see-hero__content">
                <div className="see-eyebrow"><span className="see-eyebrow__icon"><Icon name="sparkles" size={15} /></span>Recruitment intelligence</div>
                <h1 className="see-hero__title">Seu processo seletivo, <span className="see-hero__gradient">sob controle absoluto.</span></h1>
                <p className="see-hero__description">Monitore oportunidades, acompanhe candidatos, identifique gargalos e tome decisões rápidas em um painel construído para operações de recrutamento de alto nível.</p>
              </div>

              <div className="see-health">
                <div className="see-health__ring" style={{ "--health": `${Math.max(stats.quality, 8)}%` }}><strong>{stats.quality}</strong></div>
                <div className="see-health__copy">
                  <span>Saúde do portfólio</span>
                  <strong>{stats.quality >= 80 ? "Excelente" : stats.quality >= 60 ? "Boa" : "Pode melhorar"}</strong>
                  <small>Média de completude das vagas publicadas.</small>
                </div>
              </div>
            </section>

            <section className="see-stats" aria-label="Indicadores do recrutamento">
              <article className="see-stat">
                <div className="see-stat__top"><span className="see-stat__icon"><Icon name="briefcase" size={17} /></span><span className="see-stat__trend"><Icon name="trend" size={12} />Ativas</span></div>
                <strong className="see-stat__value">{stats.active}</strong><span className="see-stat__label">Vagas publicadas</span>
              </article>
              <article className="see-stat">
                <div className="see-stat__top"><span className="see-stat__icon"><Icon name="users" size={17} /></span><span className="see-stat__trend"><Icon name="trend" size={12} />Pipeline</span></div>
                <strong className="see-stat__value">{stats.candidates}</strong><span className="see-stat__label">Candidatos totais</span>
              </article>
              <article className="see-stat">
                <div className="see-stat__top"><span className="see-stat__icon"><Icon name="calendar" size={17} /></span><span className="see-stat__trend"><Icon name="trend" size={12} />Agenda</span></div>
                <strong className="see-stat__value">{stats.interviews}</strong><span className="see-stat__label">Em entrevistas</span>
              </article>
              <article className="see-stat">
                <div className="see-stat__top"><span className="see-stat__icon"><Icon name="shield" size={17} /></span><span className="see-stat__trend"><Icon name="check" size={12} />Conversão</span></div>
                <strong className="see-stat__value">{stats.hired}</strong><span className="see-stat__label">Contratações</span>
              </article>
            </section>

            <section className="see-toolbar">
              <div className="see-search">
                <span className="see-search__icon"><Icon name="search" size={17} /></span>
                <input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por vaga, empresa, local ou tecnologia..." aria-label="Buscar vagas" />
                <span className="see-search__shortcut">/ buscar</span>
              </div>

              <div className="see-toolbar__controls">
                <select className="see-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Ordenar vagas">
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="candidatos">Mais candidatos</option>
                  <option value="qualidade">Maior qualidade</option>
                  <option value="titulo">Título A-Z</option>
                </select>

                <div className="see-filter-wrap">
                  <button type="button" className="see-top-button" onClick={() => setModal(modal === "filters" ? null : "filters")}>
                    <Icon name="filter" size={16} /><span className="see-top-button__text">Filtros</span>
                  </button>
                  {activeFiltersCount > 0 && <span className="see-filter-badge">{activeFiltersCount}</span>}
                </div>

                <div className="see-view-toggle" aria-label="Modo de visualização">
                  <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Visualizar em grade"><Icon name="grid" size={15} /></button>
                  <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="Visualizar em lista"><Icon name="list" size={15} /></button>
                </div>
              </div>
            </section>

            {modal === "filters" && (
              <div className="see-filter-panel">
                <label>Status<select className="see-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="todas">Todas</option><option value="rascunho">Rascunhos</option><option value="publicada">Publicadas</option><option value="pausada">Pausadas</option><option value="arquivada">Arquivadas</option><option value="encerrada">Encerradas</option></select></label>
                <label>Modelo<select className="see-select" value={workModeFilter} onChange={(event) => setWorkModeFilter(event.target.value)}><option value="todos">Todos</option><option value="Presencial">Presencial</option><option value="Híbrido">Híbrido</option><option value="Remoto">Remoto</option></select></label>
                <label>Contratação<select className="see-select" value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)}><option value="todos">Todos</option><option value="CLT">CLT</option><option value="Estágio">Estágio</option><option value="Jovem Aprendiz">Jovem Aprendiz</option><option value="PJ">PJ</option><option value="Freelancer">Freelancer</option></select></label>
                <label>Ordenação<select className="see-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="recentes">Mais recentes</option><option value="antigas">Mais antigas</option><option value="candidatos">Mais candidatos</option><option value="qualidade">Maior qualidade</option><option value="titulo">Título A-Z</option></select></label>
                <button type="button" className="see-filter-clear" onClick={clearFilters}>Limpar filtros</button>
              </div>
            )}

            <div className="see-section-head">
              <div><h2>Vagas publicadas</h2><p>Gerencie todo o ciclo de vida das suas oportunidades.</p></div>
              <span className="see-section-head__count">{filteredJobs.length} de {jobs.length} oportunidades</span>
            </div>

            {selectedJobs.length > 0 && (
              <div className="see-bulk">
                <span className="see-bulk__label"><Icon name="check" size={15} />{selectedJobs.length} vaga(s) selecionada(s)</span>
                <div className="see-bulk__actions">
                  <button type="button" onClick={bulkArchive}><Icon name="archive" size={14} />Arquivar</button>
                  <button type="button" onClick={() => setSelectedJobs([])}><Icon name="close" size={14} />Limpar</button>
                  <button type="button" className="danger" onClick={requestBulkDelete}><Icon name="trash" size={14} />Excluir</button>
                </div>
              </div>
            )}

            {loading ? (
              <section className="see-empty" role="status" aria-live="polite">
                <div>
                  <span className="see-empty__icon"><Icon name="refresh" size={28} /></span>
                  <h3>Carregando vagas</h3>
                  <p>Estamos sincronizando oportunidades e candidaturas com o servidor.</p>
                </div>
              </section>
            ) : loadError ? (
              <section className="see-empty" role="alert">
                <div>
                  <span className="see-empty__icon"><Icon name="shield" size={28} /></span>
                  <h3>Não foi possível carregar o painel</h3>
                  <p>{loadError}</p>
                  <button type="button" onClick={handleReload}><Icon name="refresh" size={15} />Tentar novamente</button>
                </div>
              </section>
            ) : filteredJobs.length > 0 ? (
              <section className={`see-jobs ${viewMode === "list" ? "see-jobs--list" : ""}`}>
                {filteredJobs.map(renderJobCard)}
              </section>
            ) : (
              <section className="see-empty">
                <div>
                  <span className="see-empty__icon"><Icon name="search" size={28} /></span>
                  <h3>Nenhuma vaga encontrada</h3>
                  <p>Os filtros atuais não retornaram resultados. Ajuste a pesquisa ou crie uma nova oportunidade.</p>
                  <button type="button" onClick={jobs.length ? clearFilters : () => navigate("/admin/criar-vaga")}><Icon name={jobs.length ? "refresh" : "plus"} size={15} />{jobs.length ? "Restaurar resultados" : "Criar primeira vaga"}</button>
                </div>
              </section>
            )}
          </main>
        </div>

        <nav className="see-mobile-nav" aria-label="Navegação móvel">
          <button type="button" onClick={() => navigate("/admin/home")}><Icon name="home" size={18} /><span>Início</span></button>
          <button type="button" onClick={() => navigate("/admin/criar-vaga")}><Icon name="plus" size={18} /><span>Criar</span></button>
          <button type="button" className="active"><Icon name="briefcase" size={18} /><span>Vagas</span></button>
        </nav>

        {modal === "job" && selectedJob && (
          <AccessibleDialog
            className="see-modal"
            ariaLabel="Detalhes da vaga"
            onClose={() => setModal(null)}
          >
              <div className="see-modal__accent" />
              <header className="see-modal__header">
                <div className="see-modal__title-wrap"><span className="see-modal__icon"><Icon name="briefcase" size={18} /></span><div><h2 className="see-modal__title">Detalhes da oportunidade</h2><span className="see-modal__subtitle">Atualizada {formatRelativeDate(selectedJob.updatedAt)}</span></div></div>
                <button type="button" className="see-modal__close" onClick={() => setModal(null)} aria-label="Fechar"><Icon name="close" size={16} /></button>
              </header>

              <div className="see-modal__body">
                <div className="see-detail-cover">
                  <div className="see-detail-cover__content">
                    <span className="see-detail-cover__company">{selectedJob.company}</span>
                    <h2>{selectedJob.title}</h2>
                    <div className="see-detail-cover__meta"><span><Icon name="map" size={13} />{selectedJob.location}</span><span><Icon name="monitor" size={13} />{selectedJob.workMode}</span><span><Icon name="briefcase" size={13} />{selectedJob.employmentType}</span></div>
                  </div>
                </div>

                <div className="see-detail-tabs">
                  {[{ id: "visao", label: "Visão geral" }, { id: "descricao", label: "Descrição" }, { id: "responsabilidades", label: "Responsabilidades" }, { id: "requisitos", label: "Requisitos" }].map((tab) => (
                    <button key={tab.id} type="button" className={jobDetailTab === tab.id ? "active" : ""} onClick={() => setJobDetailTab(tab.id)}>{tab.label}</button>
                  ))}
                </div>

                <div className="see-detail-grid">
                  <div className="see-detail-panel">
                    {jobDetailTab === "visao" && <><h3>Resumo da oportunidade</h3><p className="see-detail-copy">{selectedJob.description || "Descrição não informada."}</p><div className="see-detail-tags">{(selectedJob.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div></>}
                    {jobDetailTab === "descricao" && <><h3>Descrição completa</h3><p className="see-detail-copy">{selectedJob.description || "Descrição não informada."}</p></>}
                    {jobDetailTab === "responsabilidades" && <><h3>Responsabilidades</h3><p className="see-detail-copy">{selectedJob.responsibilities || "Responsabilidades não informadas."}</p></>}
                    {jobDetailTab === "requisitos" && <><h3>Requisitos</h3><p className="see-detail-copy">{selectedJob.requirements || "Requisitos não informados."}</p></>}
                  </div>

                  <aside className="see-detail-side">
                    <div className="see-detail-info"><span className="see-detail-info__icon"><Icon name="money" size={16} /></span><div><span>Remuneração</span><strong>{salaryLabel(selectedJob)}</strong></div></div>
                    <div className="see-detail-info"><span className="see-detail-info__icon"><Icon name="users" size={16} /></span><div><span>Candidatos</span><strong>{(candidatesByJob[selectedJob.id] || []).length} inscrições</strong></div></div>
                    <div className="see-detail-info"><span className="see-detail-info__icon"><Icon name="calendar" size={16} /></span><div><span>Prazo</span><strong>{formatDate(selectedJob.applicationDeadline)}</strong></div></div>
                    <div className="see-detail-info"><span className="see-detail-info__icon"><Icon name="chart" size={16} /></span><div><span>Qualidade</span><strong>{getJobQuality(selectedJob)}% completa</strong></div></div>
                    <div className="see-detail-info"><span className="see-detail-info__icon"><Icon name="mail" size={16} /></span><div><span>Candidaturas</span><strong>{selectedJob.applicationEmail || "Não informado"}</strong></div></div>
                  </aside>
                </div>

                <div className="see-detail-panel" style={{ marginTop: 17 }}>
                  <h3>Benefícios oferecidos</h3>
                  <div className="see-detail-tags">
                    {(selectedJob.benefits || []).length
                      ? selectedJob.benefits.map((benefit) => <span key={benefit}>{BENEFIT_LABELS[benefit] || benefit}</span>)
                      : <span>Nenhum benefício informado</span>}
                  </div>
                </div>

                <div className="see-detail-actions">
                  <button type="button" className="see-action-btn see-action-btn--danger" onClick={() => requestDelete(selectedJob.id)}><Icon name="trash" size={14} />Excluir</button>
                  <button type="button" className="see-action-btn" onClick={() => navigate("/admin/criar-vaga", { state: { editJob: selectedJob } })}><Icon name="briefcase" size={14} />Editar</button>
                  <button type="button" className="see-action-btn" onClick={() => archiveJob(selectedJob.id)}><Icon name="archive" size={14} />Arquivar</button>
                  <button type="button" className="see-action-btn" onClick={() => duplicateJob(selectedJob.id)}><Icon name="copy" size={14} />Duplicar</button>
                  <button type="button" className="see-action-btn" onClick={() => copyJob(selectedJob)}><Icon name="external" size={14} />Copiar anúncio</button>
                  <button type="button" className="see-action-btn" onClick={() => toggleJobStatus(selectedJob.id)}><Icon name={selectedJob.status === "publicada" ? "pause" : "play"} size={14} />{selectedJob.status === "publicada" ? "Pausar" : "Publicar"}</button>
                  <button type="button" className="see-action-btn see-action-btn--primary" onClick={() => openCandidates(selectedJob.id)}><Icon name="users" size={15} />Gerenciar candidatos</button>
                </div>
              </div>
          </AccessibleDialog>
        )}

        {modal === "candidates" && selectedJob && (
          <AccessibleDialog
            className="see-modal see-modal--wide"
            ariaLabel="Gestão de candidatos"
            onClose={() => setModal(null)}
          >
              <div className="see-modal__accent" />
              <header className="see-modal__header">
                <div className="see-modal__title-wrap"><span className="see-modal__icon"><Icon name="users" size={18} /></span><div><h2 className="see-modal__title">Pipeline — {selectedJob.title}</h2><span className="see-modal__subtitle">{(candidatesByJob[selectedJob.id] || []).length} candidatos no processo</span></div></div>
                <button type="button" className="see-modal__close" onClick={() => setModal(null)} aria-label="Fechar"><Icon name="close" size={16} /></button>
              </header>

              <div className="see-modal__body">
                <div className="see-candidate-toolbar">
                  <div className="see-candidate-toolbar__left">
                    <div className="see-candidate-search"><Icon name="search" size={15} /><input value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} placeholder="Buscar candidatos..." aria-label="Buscar candidatos" data-dialog-initial-focus /></div>
                    <select className="see-select" value={candidateStageFilter} onChange={(event) => setCandidateStageFilter(event.target.value)} aria-label="Filtrar candidatos por etapa"><option value="todos">Todas as etapas</option>{CANDIDATE_STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select>
                  </div>
                  <div className="see-candidate-toolbar__right">
                    <div className="see-view-toggle"><button type="button" className={candidateView === "kanban" ? "active" : ""} onClick={() => setCandidateView("kanban")} aria-label="Kanban"><Icon name="grid" size={14} /></button><button type="button" className={candidateView === "list" ? "active" : ""} onClick={() => setCandidateView("list")} aria-label="Lista"><Icon name="list" size={14} /></button></div>
                    <button type="button" className="see-action-btn see-action-btn--primary" onClick={() => { setCandidateForm(emptyCandidateForm); setCandidateFormErrors({}); setModal("add-candidate"); }}><Icon name="userPlus" size={14} />Adicionar candidato</button>
                  </div>
                </div>

                {candidateView === "kanban" ? (
                  <div className="see-candidate-board">
                    {CANDIDATE_STAGES.filter((stage) => candidateStageFilter === "todos" || stage.id === candidateStageFilter).map((stage) => {
                      const stageCandidates = selectedJobCandidates.filter((candidate) => candidate.stage === stage.id);
                      return (
                        <section
                          key={stage.id}
                          className={`see-stage-column ${draggedCandidate ? "see-stage-column--drop" : ""}`}
                          onDragOver={(event) => {
                            if (!stage.readonly) event.preventDefault();
                          }}
                          onDrop={() => {
                            if (!stage.readonly) handleCandidateDrop(stage.id);
                          }}
                        >
                          <header className="see-stage-column__head"><span className="see-stage-column__title"><span className={`see-stage-column__dot see-stage-column__dot--${stage.tone}`} />{stage.label}</span><span className="see-stage-column__count">{stageCandidates.length}</span></header>
                          <div className="see-stage-column__cards">{stageCandidates.map(renderCandidateCard)}</div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="see-candidate-list">
                    {selectedJobCandidates.map(renderCandidateCard)}
                    {!selectedJobCandidates.length && <div className="see-empty" style={{ minHeight: 250 }}><div><span className="see-empty__icon"><Icon name="users" size={26} /></span><h3>Nenhum candidato</h3><p>Não há candidatos correspondentes aos filtros atuais.</p></div></div>}
                  </div>
                )}
              </div>
          </AccessibleDialog>
        )}

        {modal === "add-candidate" && selectedJob && (
          <AccessibleDialog
            className="see-modal"
            ariaLabel="Adicionar candidato"
            onClose={() => setModal("candidates")}
          >
              <div className="see-modal__accent" />
              <header className="see-modal__header">
                <div className="see-modal__title-wrap"><span className="see-modal__icon"><Icon name="userPlus" size={18} /></span><div><h2 className="see-modal__title">Adicionar candidato</h2><span className="see-modal__subtitle">{selectedJob.title}</span></div></div>
                <button type="button" className="see-modal__close" onClick={() => setModal("candidates")} aria-label="Fechar"><Icon name="close" size={16} /></button>
              </header>
              <form className="see-modal__body" onSubmit={submitCandidate} noValidate>
                <div className="see-form-grid">
                  <div className="see-field"><label htmlFor="candidateName">Nome completo *</label><input id="candidateName" value={candidateForm.name} onChange={(event) => setCandidateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do candidato" data-dialog-initial-focus />{candidateFormErrors.name && <span className="see-field__error">{candidateFormErrors.name}</span>}</div>
                  <div className="see-field"><label htmlFor="candidateEmail">E-mail *</label><input id="candidateEmail" type="email" value={candidateForm.email} onChange={(event) => setCandidateForm((current) => ({ ...current, email: event.target.value }))} placeholder="candidato@email.com" />{candidateFormErrors.email && <span className="see-field__error">{candidateFormErrors.email}</span>}</div>
                  <div className="see-field"><label htmlFor="candidatePhone">Telefone</label><input id="candidatePhone" value={candidateForm.phone} onChange={(event) => setCandidateForm((current) => ({ ...current, phone: event.target.value }))} placeholder="(00) 00000-0000" />{candidateFormErrors.phone && <span className="see-field__error">{candidateFormErrors.phone}</span>}</div>
                  <div className="see-field"><label htmlFor="candidateLocation">Localização</label><input id="candidateLocation" value={candidateForm.location} onChange={(event) => setCandidateForm((current) => ({ ...current, location: event.target.value }))} placeholder="Cidade - UF" />{candidateFormErrors.location && <span className="see-field__error">{candidateFormErrors.location}</span>}</div>
                  <div className="see-field"><label htmlFor="candidateExperience">Experiência</label><input id="candidateExperience" value={candidateForm.experience} onChange={(event) => setCandidateForm((current) => ({ ...current, experience: event.target.value }))} placeholder="Ex: 2 anos" />{candidateFormErrors.experience && <span className="see-field__error">{candidateFormErrors.experience}</span>}</div>
                  <div className="see-field"><label htmlFor="candidateStage">Etapa inicial *</label><select id="candidateStage" className="see-select" value={candidateForm.stage} onChange={(event) => setCandidateForm((current) => ({ ...current, stage: event.target.value }))}>{CANDIDATE_STAGES.filter((stage) => !stage.readonly).map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select>{candidateFormErrors.stage && <span className="see-field__error">{candidateFormErrors.stage}</span>}</div>
                  <div className="see-field"><label htmlFor="candidateSkills">Habilidades</label><input id="candidateSkills" value={candidateForm.skills} onChange={(event) => setCandidateForm((current) => ({ ...current, skills: event.target.value }))} placeholder="React, JavaScript, Git" />{candidateFormErrors.skills && <span className="see-field__error">{candidateFormErrors.skills}</span>}</div>
                  <div className="see-field see-field--full"><label htmlFor="candidateNotes">Observações</label><textarea id="candidateNotes" value={candidateForm.notes} onChange={(event) => setCandidateForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Registre informações importantes sobre o perfil..." />{candidateFormErrors.notes && <span className="see-field__error">{candidateFormErrors.notes}</span>}</div>
                </div>
                <div className="see-detail-actions">
                  <button type="button" className="see-action-btn" onClick={() => setModal("candidates")}>Cancelar</button>
                  <button type="submit" className="see-action-btn see-action-btn--primary" disabled={pendingAction === "candidate-create"}><Icon name="userPlus" size={14} />{pendingAction === "candidate-create" ? "Adicionando..." : "Adicionar ao pipeline"}</button>
                </div>
              </form>
          </AccessibleDialog>
        )}

        {selectedCandidate && selectedJob && (
          <AccessibleDialog
            className="see-modal"
            ariaLabel="Perfil do candidato"
            onClose={() => setSelectedCandidateId(null)}
          >
              <div className="see-modal__accent" />
              <header className="see-modal__header">
                <div className="see-modal__title-wrap"><span className="see-modal__icon"><Icon name="users" size={18} /></span><div><h2 className="see-modal__title">Perfil do candidato</h2><span className="see-modal__subtitle">Inscrição em {selectedJob.title}</span></div></div>
                <button type="button" className="see-modal__close" onClick={() => setSelectedCandidateId(null)} aria-label="Fechar"><Icon name="close" size={16} /></button>
              </header>
              <div className="see-modal__body">
                <div className="see-profile">
                  <aside className="see-profile__sidebar">
                    <div className="see-profile__avatar">{selectedCandidate.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
                    <h3>{selectedCandidate.name}</h3><p>{selectedCandidate.experience || "Experiência não informada"}</p>
                    <div className="see-profile__contact"><span><Icon name="mail" size={13} />{selectedCandidate.email}</span><span><Icon name="phone" size={13} />{selectedCandidate.phone || "Não informado"}</span><span><Icon name="map" size={13} />{selectedCandidate.location || "Não informado"}</span></div>
                  </aside>
                  <div className="see-profile__main">
                    <section className="see-profile__panel"><h4>Etapa do processo</h4><div className="see-profile__stage" style={{ marginTop: 10 }}><select className="see-select" value={selectedCandidate.stage} onChange={(event) => moveCandidate(selectedJob.id, selectedCandidate.id, event.target.value)} aria-label={`Etapa de ${selectedCandidate.name}`}>{CANDIDATE_STAGES.map((stage) => <option key={stage.id} value={stage.id} disabled={stage.readonly}>{stage.label}</option>)}</select></div></section>
                    <section className="see-profile__panel"><h4>Habilidades</h4><div className="see-profile__skills">{(selectedCandidate.skills || []).length ? selectedCandidate.skills.map((skill) => <span key={skill}>{skill}</span>) : <span>Não informado</span>}</div></section>
                    <CandidateResume candidate={selectedCandidate} loading={pendingAction === `candidate-resume-${selectedCandidate.id}`} onOpenFile={() => openCandidateResumeFile(selectedCandidate)} />
                    <section className="see-profile__panel"><h4>Anotações</h4><div className="see-field" style={{ marginTop: 10 }}><textarea value={candidateNotesDraft} maxLength={5000} onChange={(event) => setCandidateNotesDraft(event.target.value)} placeholder="Registre informações relevantes para o processo." aria-label={`Anotações sobre ${selectedCandidate.name}`} /><button type="button" className="see-action-btn" style={{ marginTop: 9 }} disabled={pendingAction === `candidate-notes-${selectedCandidate.id}`} onClick={() => updateCandidateNotes(selectedJob.id, selectedCandidate.id)}>{pendingAction === `candidate-notes-${selectedCandidate.id}` ? "Salvando..." : "Salvar anotações"}</button></div></section>
                    <section className="see-profile__panel"><h4>Avaliação</h4><div className="see-rating" style={{ marginTop: 9 }} aria-label={`Avaliação ${selectedCandidate.rating || 0} de 5`}>{[1,2,3,4,5].map((rating) => <button key={rating} type="button" className={rating <= (selectedCandidate.rating || 0) ? "see-rating__star see-rating__star--active" : "see-rating__star"} onClick={() => updateCandidateRating(selectedJob.id, selectedCandidate.id, rating)} aria-label={`Avaliar ${selectedCandidate.name} com ${rating} estrelas`} aria-pressed={rating === selectedCandidate.rating}><Icon name="star" size={16} /></button>)}</div></section>
                  </div>
                </div>
                <div className="see-detail-actions"><button type="button" className="see-action-btn see-action-btn--danger" onClick={() => requestCandidateDelete(selectedJob.id, selectedCandidate.id)}><Icon name="trash" size={14} />Remover candidato</button><button type="button" className="see-action-btn" onClick={() => window.location.href = `mailto:${selectedCandidate.email}`}><Icon name="mail" size={14} />Enviar e-mail</button></div>
              </div>
          </AccessibleDialog>
        )}

        {confirmAction && (
          <AccessibleDialog
            className="see-modal see-modal--small"
            ariaLabel="Confirmar exclusão"
            onClose={() => setConfirmAction(null)}
            canClose={pendingAction !== "delete"}
          >
              <div className="see-modal__accent" />
              <div className="see-modal__body see-confirm">
                <span className="see-confirm__icon"><Icon name="trash" size={22} /></span>
                <h2>{confirmAction.title}</h2><p>{confirmAction.description}</p>
                <div className="see-confirm__actions"><button type="button" className="see-action-btn" onClick={() => setConfirmAction(null)} disabled={pendingAction === "delete"} data-dialog-initial-focus>Cancelar</button><button type="button" className="see-action-btn see-action-btn--danger" onClick={executeConfirmAction} disabled={pendingAction === "delete"}><Icon name="trash" size={14} />{pendingAction === "delete" ? (confirmAction.type === "delete-candidate" ? "Removendo..." : "Excluindo...") : (confirmAction.confirmLabel || "Excluir")}</button></div>
              </div>
          </AccessibleDialog>
        )}

        {commandOpen && (
          <AccessibleDialog
            className="see-command"
            ariaLabel="Paleta de comandos"
            overlayStyle={{ placeItems: "start center", paddingTop: "12vh" }}
            onClose={() => setCommandOpen(false)}
          >
              <div className="see-command__search"><Icon name="search" size={19} /><input value={commandSearch} onChange={(event) => setCommandSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && filteredCommandActions[0] && runCommand(filteredCommandActions[0])} placeholder="Digite uma ação..." aria-label="Buscar ação na paleta de comandos" data-dialog-initial-focus /><button type="button" className="see-modal__close" onClick={() => setCommandOpen(false)} aria-label="Fechar paleta de comandos"><Icon name="close" size={15} /></button></div>
              <div className="see-command__body"><span className="see-command__label">Ações disponíveis</span>{filteredCommandActions.map((action) => <button key={action.id} type="button" className="see-command__item" onClick={() => runCommand(action)}><span className="see-command__item-icon"><Icon name={action.icon} size={17} /></span><span className="see-command__item-copy"><strong>{action.title}</strong><span>{action.description}</span></span><Icon name="chevron" size={14} /></button>)}</div>
          </AccessibleDialog>
        )}

        {toast && (
          <div className={`see-toast see-toast--${toast.type}`} role="status" aria-live="polite">
            <span className="see-toast__icon"><Icon name={toast.type === "success" ? "check" : toast.type === "error" ? "alert" : "sparkles"} size={17} /></span>
            <div><strong className="see-toast__title">{toast.title}</strong><span className="see-toast__description">{toast.description}</span></div>
          </div>
        )}
      </div>
    </>
  );
}
