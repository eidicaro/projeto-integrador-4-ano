import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion as Motion,
  useReducedMotion,
} from "framer-motion";

import { useNavigate } from "react-router-dom";

import bgVideo from "../assets/bg.mp4";
import { useAuth } from "../context/AuthContext";
import useBackgroundVideoEnabled from "../hooks/useBackgroundVideoEnabled";
import useDialogFocus from "../hooks/useDialogFocus";
import api, { getApiErrorMessage } from "../lib/api";
import {
  collectPaginatedItems,
  mergeUniqueById,
  readPaginatedResponse,
} from "../lib/pagination";

const ALL_CATEGORIES = "Todas";
const FALLBACK_CATEGORY = "Outras oportunidades";
const EMPTY_SAVED_JOBS = new Set();

const JOB_PALETTES = [
  { accent: "#ff4f8b", softAccent: "#ffd5e4" },
  { accent: "#9183ff", softAccent: "#ddd8ff" },
  { accent: "#64c7ee", softAccent: "#d5f3ff" },
  { accent: "#baf26d", softAccent: "#e6ffc4" },
  { accent: "#ffd447", softAccent: "#fff2b3" },
  { accent: "#ff9466", softAccent: "#ffe0d2" },
];

const MAP_NODE_SLOTS = [
  {
    className: "map-node--development",
    accent: "#ff4f8b",
    icon: "briefcase",
  },
  {
    className: "map-node--design",
    accent: "#9183ff",
    icon: "sparkles",
  },
  {
    className: "map-node--data",
    accent: "#64c7ee",
    icon: "search",
  },
  {
    className: "map-node--product",
    accent: "#baf26d",
    icon: "target",
  },
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function cleanText(value, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeList(value) {
  const entries = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n|[;•]/)
      : [];

  return [
    ...new Set(
      entries
        .map((entry) =>
          (typeof entry === "string" ||
          typeof entry === "number"
            ? cleanText(String(entry))
            : ""
          ).replace(/^[-–—*•]\s*/, ""),
        )
        .filter(Boolean),
    ),
  ];
}

function normalizeSearchValue(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function getCompanyInitials(company) {
  const initials = company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toLocaleUpperCase("pt-BR");

  return initials || "?";
}

function getPalette(key) {
  const hash = String(key)
    .split("")
    .reduce(
      (total, character) =>
        (total * 31 + character.charCodeAt(0)) | 0,
      0,
    );

  return JOB_PALETTES[Math.abs(hash) % JOB_PALETTES.length];
}

function formatSalary(rawJob) {
  if (!rawJob.salaryVisible) {
    return {
      label: "Faixa não divulgada",
      value: -1,
    };
  }

  const minimum = toOptionalNumber(rawJob.salaryMin);
  const maximum = toOptionalNumber(rawJob.salaryMax);

  if (minimum !== null && maximum !== null) {
    return {
      label:
        minimum === maximum
          ? currencyFormatter.format(minimum)
          : `${currencyFormatter.format(minimum)} — ${currencyFormatter.format(maximum)}`,
      value: maximum,
    };
  }

  if (minimum !== null) {
    return {
      label: `A partir de ${currencyFormatter.format(minimum)}`,
      value: minimum,
    };
  }

  if (maximum !== null) {
    return {
      label: `Até ${currencyFormatter.format(maximum)}`,
      value: maximum,
    };
  }

  return {
    label: "Faixa não divulgada",
    value: -1,
  };
}

function getPublicationDetails(value) {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return {
      label: "Data não informada",
      timestamp: 0,
      isNew: false,
    };
  }

  const elapsed = Math.max(0, Date.now() - timestamp);
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / 86_400_000);
  let label;

  if (hours < 1) {
    label = "Agora";
  } else if (hours < 24) {
    label = `Há ${hours} ${hours === 1 ? "hora" : "horas"}`;
  } else if (days < 7) {
    label = `Há ${days} ${days === 1 ? "dia" : "dias"}`;
  } else {
    label = dateFormatter.format(timestamp);
  }

  return {
    label,
    timestamp,
    isNew: elapsed <= 72 * 3_600_000,
  };
}

function formatDeadline(value) {
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(
    String(value || ""),
  )
    ? `${value}T12:00:00`
    : value;
  const timestamp = Date.parse(normalizedValue);
  return Number.isFinite(timestamp)
    ? dateFormatter.format(timestamp)
    : "Não informada";
}

function normalizeJob(rawJob) {
  if (
    !rawJob ||
    (rawJob.id === null || rawJob.id === undefined)
  ) {
    return null;
  }

  const company = cleanText(
    rawJob.company,
    "Empresa não informada",
  );
  const category = cleanText(
    rawJob.department,
    FALLBACK_CATEGORY,
  );
  const employmentType = cleanText(rawJob.employmentType);
  const workMode = cleanText(rawJob.workMode);
  const seniority = cleanText(rawJob.seniority);
  const salary = formatSalary(rawJob);
  const publication = getPublicationDetails(
    rawJob.publishedAt || rawJob.createdAt,
  );
  const palette = getPalette(`${rawJob.id}:${category}`);
  const applicants = toOptionalNumber(rawJob.applicantsCount);
  const openings = toOptionalNumber(rawJob.openings);

  return {
    id: rawJob.id,
    slug: cleanText(rawJob.slug),
    title: cleanText(
      rawJob.title,
      "Oportunidade sem título",
    ),
    company,
    companyInitials: getCompanyInitials(company),
    location: cleanText(
      rawJob.location,
      "Localização não informada",
    ),
    employmentType,
    workMode,
    type:
      workMode || employmentType || "Formato não informado",
    level: seniority || "Nível não informado",
    category,
    salary: salary.label,
    salaryValue: salary.value,
    postedAt: publication.label,
    publishedTimestamp: publication.timestamp,
    applicants:
      applicants === null
        ? 0
        : Math.max(0, Math.trunc(applicants)),
    openings:
      openings === null
        ? null
        : Math.max(0, Math.trunc(openings)),
    accent: palette.accent,
    softAccent: palette.softAccent,
    symbol: getCompanyInitials(category),
    isNew: publication.isNew,
    description: cleanText(
      rawJob.description,
      "Descrição não informada.",
    ),
    responsibilities: normalizeList(rawJob.responsibilities),
    requirements: normalizeList(rawJob.requirements),
    skills: normalizeList(rawJob.tags),
    benefits: normalizeList(rawJob.benefits),
    applicationDeadline: formatDeadline(
      rawJob.applicationDeadline,
    ),
  };
}

function loadSavedJobs() {
  if (typeof window === "undefined") return new Set();

  try {
    const stored = window.localStorage.getItem(
      "point:saved-jobs",
    );
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed)
      ? new Set(parsed.map(String))
      : new Set();
  } catch (error) {
    console.error(
      "Não foi possível recuperar as vagas salvas:",
      error,
    );
    return new Set();
  }
}

function storeGuestSavedJobs(savedJobIds) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    "point:saved-jobs",
    JSON.stringify(Array.from(savedJobIds)),
  );
}



const SHORTCUTS = [
  {
    title: "Explorar vagas",
    description:
      "Descubra oportunidades filtradas por área, nível e modelo de trabalho.",
    tag: "Começar busca",
    accent: "#ff4f8b",
    className: "shortcut-card--jobs",
    icon: "search",
    action: "jobs",
  },
  {
    title: "Criar meu perfil",
    description:
      "Monte uma apresentação profissional que realmente mostra quem você é.",
    tag: "Novo talento",
    accent: "#64c7ee",
    className: "shortcut-card--profile",
    icon: "user",
    action: "profile",
  },
  {
    title: "Meu portfólio",
    description:
      "Organize projetos, experiências e conquistas em um único espaço.",
    tag: "Mostrar trabalho",
    accent: "#ffd447",
    className: "shortcut-card--portfolio",
    icon: "folder",
    action: "portfolio",
  },
  {
    title: "Candidaturas",
    description:
      "Acompanhe cada processo seletivo sem perder nenhuma atualização.",
    tag: "Ver progresso",
    accent: "#baf26d",
    className: "shortcut-card--applications",
    icon: "route",
    action: "applications",
  },
];

const COMMANDS = [
  {
    id: "home",
    label: "Ir para o início",
    description: "Voltar para o topo da Home",
    keywords: "home início topo principal",
    icon: "home",
  },
  {
    id: "jobs",
    label: "Explorar vagas",
    description: "Abrir a busca de oportunidades",
    keywords: "vagas emprego trabalho oportunidade",
    icon: "search",
  },
  {
    id: "profile",
    label: "Criar perfil",
    description: "Montar seu perfil profissional",
    keywords: "perfil conta cadastro talento",
    icon: "user",
  },
  {
    id: "portfolio",
    label: "Abrir portfólio",
    description: "Organizar projetos e experiências",
    keywords: "portfolio projetos trabalho",
    icon: "folder",
  },
  {
    id: "saved",
    label: "Ver vagas salvas",
    description: "Consultar oportunidades favoritas",
    keywords: "salvos favoritos vagas",
    icon: "bookmark",
  },
  {
    id: "login",
    label: "Fazer login",
    description: "Entrar na sua conta",
    keywords: "login entrar acesso conta",
    icon: "arrow",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { loading: authLoading, user } = useAuth();
  const reduceMotion = useReducedMotion();
  const backgroundVideoEnabled = useBackgroundVideoEnabled();
  const isCandidate =
    String(user?.role || "").toLocaleLowerCase("pt-BR") ===
    "candidato";

  const pageRef = useRef(null);
  const jobsRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    ALL_CATEGORIES,
  );
  const [sortBy, setSortBy] = useState("recent");
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsReloadKey, setJobsReloadKey] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsHasMore, setJobsHasMore] = useState(false);
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
  const [jobsMoreError, setJobsMoreError] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [guestSavedJobs, setGuestSavedJobs] = useState(loadSavedJobs);
  const [candidateSavedJobs, setCandidateSavedJobs] = useState(
    () => new Set(),
  );
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [savingJobIds, setSavingJobIds] = useState(
    () => new Set(),
  );

  const [toast, setToast] = useState("");
  const [activityIndex, setActivityIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headerCompact, setHeaderCompact] = useState(false);
  const savedJobs = isCandidate
    ? candidateSavedJobs
    : user
      ? EMPTY_SAVED_JOBS
      : guestSavedJobs;

  const showToast = useCallback((message) => {
    setToast(message);

    window.clearTimeout(toastTimerRef.current);

    toastTimerRef.current = window.setTimeout(() => {
      setToast("");
    }, 2600);
  }, []);

  useEffect(
    () => () => window.clearTimeout(toastTimerRef.current),
    [],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map();

    jobs.forEach((job) => {
      counts.set(
        job.category,
        (counts.get(job.category) || 0) + 1,
      );
    });

    return counts;
  }, [jobs]);

  const categories = useMemo(
    () => [
      ALL_CATEGORIES,
      ...Array.from(categoryCounts.keys()).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    ],
    [categoryCounts],
  );

  const categoryHighlights = useMemo(
    () =>
      Array.from(categoryCounts, ([category, count]) => ({
        category,
        count,
      }))
        .sort(
          (a, b) =>
            b.count - a.count ||
            a.category.localeCompare(b.category, "pt-BR"),
        )
        .slice(0, MAP_NODE_SLOTS.length),
    [categoryCounts],
  );

  const activities = useMemo(() => {
    if (jobs.length > 0) {
      return jobs.slice(0, 4).map((job) => ({
        id: job.id,
        title: "Vaga publicada",
        detail: `${job.title} · ${job.company}`,
        time: job.postedAt,
        icon: "briefcase",
      }));
    }

    if (jobsLoading) {
      return [
        {
          id: "loading",
          title: "Atualizando oportunidades",
          detail: "Consultando as vagas publicadas",
          time: "Agora",
          icon: "search",
        },
      ];
    }

    if (jobsError) {
      return [
        {
          id: "error",
          title: "Atualização indisponível",
          detail: "Tente novamente no radar de vagas",
          time: "",
          icon: "shield",
        },
      ];
    }

    return [
      {
        id: "empty",
        title: "Radar atualizado",
        detail: "Aguardando novas vagas publicadas",
        time: "Agora",
        icon: "briefcase",
      },
    ];
  }, [jobs, jobsError, jobsLoading]);

  const currentActivityIndex =
    activityIndex % activities.length;
  const currentActivity = activities[currentActivityIndex];

  const selectedCategory = categories.includes(activeCategory)
    ? activeCategory
    : ALL_CATEGORIES;

  const filteredJobs = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(search.trim());

    const result = jobs.filter((job) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES ||
        job.category === selectedCategory;

      const searchableContent = normalizeSearchValue(
        [
          job.title,
          job.company,
          job.location,
          job.type,
          job.level,
          job.employmentType,
          job.workMode,
          job.category,
          job.description,
          ...job.requirements,
          ...job.skills,
        ].join(" "),
      );

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "salary") {
        return (
          b.salaryValue - a.salaryValue ||
          b.publishedTimestamp - a.publishedTimestamp
        );
      }

      if (sortBy === "popular") {
        return (
          b.applicants - a.applicants ||
          b.publishedTimestamp - a.publishedTimestamp
        );
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title, "pt-BR");
      }

      return b.publishedTimestamp - a.publishedTimestamp;
    });
  }, [jobs, search, selectedCategory, sortBy]);

  const filteredCommands = useMemo(() => {
    const normalized = commandQuery.trim().toLowerCase();

    if (!normalized) return COMMANDS;

    return COMMANDS.filter((command) =>
      [
        command.label,
        command.description,
        command.keywords,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [commandQuery]);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/vagas", {
        params: { page: 1, per_page: 50 },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;

        const page = readPaginatedResponse(response);

        if (!Array.isArray(response?.data?.data)) {
          throw new Error(
            "A API retornou uma lista de vagas inválida.",
          );
        }

        const normalizedJobs = page.items
          .map(normalizeJob)
          .filter(Boolean);

        setJobs(normalizedJobs);
        setJobsPage(page.currentPage);
        setJobsHasMore(page.hasMore);
        setJobsTotal(Math.max(normalizedJobs.length, page.total));
        setJobsError("");
        setJobsLoading(false);
      })
      .catch((error) => {
        if (
          controller.signal.aborted ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        setJobs([]);
        setJobsTotal(0);
        setJobsPage(1);
        setJobsHasMore(false);
        setJobsError(
          error?.response
            ? getApiErrorMessage(
                error,
                "Não foi possível carregar as vagas.",
              )
            : "Não foi possível conectar à API de vagas.",
        );
        setJobsLoading(false);
      });

    return () => controller.abort();
  }, [jobsReloadKey]);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!isCandidate) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    async function syncCandidateFavorites() {
      setFavoritesLoading(true);

      const storedJobIds = Array.from(loadSavedJobs()).filter((jobId) =>
        /^\d+$/.test(jobId),
      );
      const localJobIds = storedJobIds.slice(0, 500);
      const remainingLocalIds = new Set(storedJobIds);
      let migratedCount = 0;
      let pendingMigrationCount = Math.max(
        0,
        storedJobIds.length - localJobIds.length,
      );

      try {
        const migrations = [];

        for (let start = 0; start < localJobIds.length; start += 10) {
          const batch = localJobIds.slice(start, start + 10);
          const batchResults = await Promise.all(
            batch.map(async (jobId) => {
              try {
                await api.put(
                  `/vagas/${encodeURIComponent(jobId)}/salvar`,
                  undefined,
                  { signal: controller.signal },
                );

                return { jobId, migrated: true, discard: true };
              } catch (error) {
                if (
                  controller.signal.aborted ||
                  error?.code === "ERR_CANCELED"
                ) {
                  throw error;
                }

                return {
                  jobId,
                  migrated: false,
                  discard: [404, 409, 422].includes(
                    error?.response?.status,
                  ),
                };
              }
            }),
          );

          migrations.push(...batchResults);
        }

        migrations.forEach(({ jobId, migrated, discard }) => {
          if (migrated) migratedCount += 1;
          if (!migrated && !discard) pendingMigrationCount += 1;
          if (discard) remainingLocalIds.delete(jobId);
        });

        try {
          storeGuestSavedJobs(remainingLocalIds);
        } catch (storageError) {
          console.error(
            "Não foi possível concluir a migração dos favoritos:",
            storageError,
          );
        }

        if (active) {
          setGuestSavedJobs(new Set(remainingLocalIds));
        }

        const apiSavedJobs = await collectPaginatedItems((page) =>
          api.get("/vagas-salvas", {
            params: { page, per_page: 50 },
            signal: controller.signal,
          }),
        );

        if (!active) return;

        setCandidateSavedJobs(
          new Set(
            apiSavedJobs
              .map((job) => job?.id)
              .filter(
                (jobId) => jobId !== null && jobId !== undefined,
              )
              .map(String),
          ),
        );

        if (pendingMigrationCount > 0) {
          showToast(
            "Algumas vagas salvas continuam neste dispositivo e serão sincronizadas novamente.",
          );
        } else if (migratedCount > 0) {
          showToast(
            migratedCount === 1
              ? "Uma vaga salva neste dispositivo foi vinculada à sua conta."
              : `${migratedCount} vagas salvas neste dispositivo foram vinculadas à sua conta.`,
          );
        }
      } catch (error) {
        if (
          !active ||
          controller.signal.aborted ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        showToast(
          getApiErrorMessage(
            error,
            "Não foi possível sincronizar suas vagas salvas.",
          ),
        );
      } finally {
        if (active) setFavoritesLoading(false);
      }
    }

    syncCandidateFavorites();

    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, isCandidate, showToast, user?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActivityIndex(
        (current) => (current + 1) % activities.length,
      );
    }, 3600);

    return () => window.clearInterval(interval);
  }, [activities.length]);

  useEffect(() => {
    function handleScroll() {
      const documentHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      const nextProgress =
        documentHeight > 0
          ? (window.scrollY / documentHeight) * 100
          : 0;

      setScrollProgress(Math.min(nextProgress, 100));
      setHeaderCompact(window.scrollY > 40);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleKeyboard(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }

      if (
        event.key === "/" &&
        !isTyping &&
        !commandOpen
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
        setMenuOpen(false);
        setSelectedJob(null);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () =>
      window.removeEventListener("keydown", handleKeyboard);
  }, [commandOpen]);

  useEffect(() => {
    const shouldLock =
      menuOpen || commandOpen || Boolean(selectedJob);

    document.body.style.overflow = shouldLock ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [commandOpen, menuOpen, selectedJob]);

  function handlePointerMove(event) {
    if (reduceMotion) return;

    const page = pageRef.current;

    if (!page || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const rect = page.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const normalizedX = x / rect.width - 0.5;
    const normalizedY = y / window.innerHeight - 0.5;

    page.style.setProperty("--mouse-x", `${x}px`);
    page.style.setProperty(
      "--mouse-y",
      `${event.clientY + window.scrollY}px`,
    );

    page.style.setProperty(
      "--parallax-x",
      `${normalizedX * 18}px`,
    );

    page.style.setProperty(
      "--parallax-y",
      `${normalizedY * 14}px`,
    );

    page.style.setProperty(
      "--parallax-x-reverse",
      `${normalizedX * -14}px`,
    );

    page.style.setProperty(
      "--parallax-y-reverse",
      `${normalizedY * -11}px`,
    );
  }

  function scrollToJobs() {
    jobsRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleHeroSearch(event) {
    event.preventDefault();
    scrollToJobs();
  }

  function handleShortcut(action) {
    switch (action) {
      case "jobs":
        scrollToJobs();
        break;

      case "profile":
        navigate("/cadastro");
        break;

      case "portfolio":
        navigate("/portfolio");
        break;

      case "applications":
        navigate("/candidaturas");
        break;

      default:
        break;
    }
  }

  async function toggleSaved(jobId) {
    const normalizedJobId = String(jobId);

    if (
      authLoading ||
      (isCandidate && favoritesLoading) ||
      savingJobIds.has(normalizedJobId)
    ) {
      return;
    }

    const isCurrentlySaved = savedJobs.has(normalizedJobId);

    if (user && !isCandidate) {
      showToast("Apenas candidatos podem salvar oportunidades.");
      return;
    }

    if (!user) {
      const next = new Set(savedJobs);

      if (next.has(normalizedJobId)) {
        next.delete(normalizedJobId);
      } else {
        next.add(normalizedJobId);
      }

      setGuestSavedJobs(next);
      let storageFailed = false;

      try {
        storeGuestSavedJobs(next);
      } catch (error) {
        storageFailed = true;
        console.error(
          "Não foi possível salvar os favoritos:",
          error,
        );
      }

      showToast(
        storageFailed
          ? "Favorito atualizado nesta sessão, mas o navegador bloqueou o armazenamento."
          : isCurrentlySaved
            ? "Vaga removida dos seus favoritos."
            : "Vaga salva no seu radar!",
      );
      return;
    }

    setSavingJobIds((current) => {
      const next = new Set(current);
      next.add(normalizedJobId);
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await api.delete(
          `/vagas/${encodeURIComponent(jobId)}/salvar`,
        );
      } else {
        await api.put(
          `/vagas/${encodeURIComponent(jobId)}/salvar`,
        );
      }

      setCandidateSavedJobs((current) => {
        const next = new Set(current);

        if (isCurrentlySaved) next.delete(normalizedJobId);
        else next.add(normalizedJobId);

        return next;
      });
      showToast(
        isCurrentlySaved
          ? "Vaga removida dos seus favoritos."
          : "Vaga salva no seu radar!",
      );
    } catch (error) {
      showToast(
        getApiErrorMessage(
          error,
          "Não foi possível atualizar suas vagas salvas.",
        ),
      );
    } finally {
      setSavingJobIds((current) => {
        const next = new Set(current);
        next.delete(normalizedJobId);
        return next;
      });
    }
  }

  function executeCommand(commandId) {
    setCommandOpen(false);
    setCommandQuery("");

    switch (commandId) {
      case "home":
        window.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth",
        });
        break;

      case "jobs":
        window.setTimeout(scrollToJobs, 100);
        break;

      case "profile":
        navigate("/cadastro");
        break;

      case "portfolio":
        navigate("/portfolio");
        break;

      case "saved":
        navigate("/vagas-salvas");
        break;

      case "login":
        navigate("/login");
        break;

      default:
        break;
    }
  }

  function openJob(job) {
    setSelectedJob(job);
  }

  function retryJobs() {
    setJobsLoading(true);
    setJobsError("");
    setJobsMoreError("");
    setJobsReloadKey((current) => current + 1);
  }

  async function loadMoreJobs() {
    if (jobsLoadingMore || !jobsHasMore) return;

    setJobsLoadingMore(true);
    setJobsMoreError("");

    try {
      const response = await api.get("/vagas", {
        params: { page: jobsPage + 1, per_page: 50 },
      });
      const page = readPaginatedResponse(response);

      if (!Array.isArray(response?.data?.data)) {
        throw new Error("A API retornou uma lista de vagas inválida.");
      }

      const normalizedJobs = page.items
        .map(normalizeJob)
        .filter(Boolean);

      setJobs((current) =>
        mergeUniqueById(current, normalizedJobs),
      );
      setJobsPage(page.currentPage);
      setJobsHasMore(page.hasMore);
      setJobsTotal((currentTotal) =>
        Math.max(currentTotal, page.total),
      );
    } catch (error) {
      setJobsMoreError(
        getApiErrorMessage(
          error,
          "Não foi possível carregar mais oportunidades.",
        ),
      );
    } finally {
      setJobsLoadingMore(false);
    }
  }

  return (
    <>
      <style>{homeStyles}</style>

      <main
        ref={pageRef}
        className="point-home"
        onPointerMove={handlePointerMove}
      >
        <div
          className="page-scroll-progress"
          aria-hidden="true"
        >
          <div
            className="page-scroll-progress-fill"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div
          className="home-blob home-blob--pink"
          aria-hidden="true"
        />

        <div
          className="home-blob home-blob--blue"
          aria-hidden="true"
        />

        <div
          className="home-blob home-blob--yellow"
          aria-hidden="true"
        />

        <StarShape className="home-star home-star--one" />
        <StarShape className="home-star home-star--two" />

        <header
          className={`home-header ${
            headerCompact ? "home-header--compact" : ""
          }`}
        >
          <button
            type="button"
            className="home-logo"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: reduceMotion ? "auto" : "smooth",
              })
            }
            aria-label="Voltar ao início"
          >
            <span className="home-logo-p">p</span>
            <span className="home-logo-o">o</span>
            <span>int</span>

            <span className="home-logo-dot" />
          </button>

          <nav
            className="desktop-navigation"
            aria-label="Navegação principal"
          >
            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: reduceMotion ? "auto" : "smooth",
                })
              }
            >
              Início
            </button>

            <button type="button" onClick={scrollToJobs}>
              Vagas
            </button>

            <button
              type="button"
              onClick={() => navigate("/empresas")}
            >
              Empresas
            </button>

            <button
              type="button"
              onClick={() => navigate("/portfolio")}
            >
              Portfólio
            </button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="command-trigger"
              onClick={() => setCommandOpen(true)}
              aria-label="Abrir busca rápida"
            >
              <SearchIcon />

              <span className="command-trigger-label">
                Buscar
              </span>

              <span className="command-shortcut">
                Ctrl K
              </span>
            </button>

            <button
              type="button"
              className="saved-trigger"
              onClick={() => navigate("/vagas-salvas")}
              aria-label={`${savedJobs.size} vagas salvas`}
            >
              <BookmarkIcon />

              {savedJobs.size > 0 && (
                <span className="saved-trigger-count">
                  {savedJobs.size}
                </span>
              )}
            </button>

            <button
              type="button"
              className="header-login-button"
              onClick={() => navigate("/login")}
            >
              Entrar
            </button>

            <button
              type="button"
              className="header-register-button"
              onClick={() => navigate("/cadastro")}
            >
              Criar perfil
              <ArrowUpRightIcon />
            </button>

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <MenuIcon />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {menuOpen && (
            <MobileMenu
              savedCount={savedJobs.size}
              onClose={() => setMenuOpen(false)}
              onNavigate={(destination) => {
                setMenuOpen(false);

                if (destination === "jobs") {
                  window.setTimeout(scrollToJobs, 100);
                  return;
                }

                navigate(destination);
              }}
            />
          )}
        </AnimatePresence>

        <section className="home-hero">
          <Motion.div
            className="hero-copy"
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.75,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-icon">
                <SparklesIcon />
              </span>

              Oportunidades com mais personalidade
            </div>

            <h1 className="hero-title">
              Seu futuro
              <span className="hero-title-row">
                não precisa ser
              </span>

              <span className="hero-title-highlight">
                previsível.
              </span>
            </h1>

            <p className="hero-description">
              Encontre empresas, projetos e oportunidades que
              combinam com suas habilidades, objetivos e com a
              pessoa que você quer se tornar.
            </p>

            <form
              className="hero-search"
              onSubmit={handleHeroSearch}
            >
              <span
                className="hero-search-icon"
                aria-hidden="true"
              >
                <SearchIcon />
              </span>

              <input
                type="search"
                placeholder="Cargo, tecnologia, empresa ou cidade..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                aria-label="Buscar oportunidades"
              />

              <button type="submit">
                Explorar
                <ArrowRightIcon />
              </button>
            </form>

            <div className="hero-trends">
              <span className="hero-trends-label">
                Em alta:
              </span>

              {["React", "Design", "Remoto", "Dados"].map(
                (trend) => (
                  <button
                    key={trend}
                    type="button"
                    onClick={() => {
                      setSearch(trend);
                      window.setTimeout(scrollToJobs, 50);
                    }}
                  >
                    {trend}
                  </button>
                ),
              )}
            </div>

            <div className="hero-proof">
              <div
                className="hero-proof-avatars"
                aria-hidden="true"
              >
                <span className="proof-avatar proof-avatar--one">
                  AN
                </span>
                <span className="proof-avatar proof-avatar--two">
                  LC
                </span>
                <span className="proof-avatar proof-avatar--three">
                  GM
                </span>
                <span className="proof-avatar proof-avatar--more">
                  +1k
                </span>
              </div>

              <div className="hero-proof-copy">
                <strong>Mais de 1.200 talentos</strong>
                <span>já estão construindo novos caminhos.</span>
              </div>
            </div>
          </Motion.div>

          <Motion.div
            className="opportunity-map"
            initial={{ opacity: 0, x: 42, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            <div
              className="map-paper-back"
              aria-hidden="true"
            />

            <div className="map-paper">
              <div className="map-paper-header">
                <span className="map-paper-label">
                  Mapa de oportunidades
                </span>

                <span className="map-paper-code">
                  LIVE · 2026
                </span>
              </div>

              <svg
                className="map-route-lines"
                viewBox="0 0 620 560"
                fill="none"
                aria-hidden="true"
              >
                <Motion.path
                  d="M74 106C196 55 213 195 311 176C413 155 373 68 526 98"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="10 13"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1.8,
                    delay: 0.7,
                  }}
                />

                <Motion.path
                  d="M94 431C190 388 178 288 309 300C449 313 426 437 542 410"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="10 13"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1.8,
                    delay: 0.95,
                  }}
                />

                <Motion.path
                  d="M306 176C264 224 273 264 309 300"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="8 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1.1,
                    delay: 1.35,
                  }}
                />
              </svg>

              <div className="map-video-card">
                {backgroundVideoEnabled && (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                  >
                    <source src={bgVideo} type="video/mp4" />
                  </video>
                )}

                <div className="map-video-overlay" />

                <div className="map-video-live">
                  <span />
                  Explorando agora
                </div>

                <div className="map-video-copy">
                  <span>Seu próximo destino</span>
                  <strong>Pode estar mais perto.</strong>
                </div>
              </div>

              {categoryHighlights.map((highlight, index) => {
                const slot = MAP_NODE_SLOTS[index];

                return (
                  <MapNode
                    key={highlight.category}
                    className={slot.className}
                    label={highlight.category}
                    detail={`${highlight.count} ${
                      highlight.count === 1 ? "vaga" : "vagas"
                    }`}
                    accent={slot.accent}
                    icon={<DynamicIcon name={slot.icon} />}
                  />
                );
              })}

              <div
                className="map-match-card"
                aria-hidden="true"
              >
                <div className="match-card-top">
                  <span className="match-card-icon">
                    <SparklesIcon />
                  </span>

                  <span>Oportunidades abertas</span>
                </div>

                <strong>
                  {jobsLoading ? "…" : jobsError ? "—" : jobsTotal}
                </strong>

                <div className="match-progress">
                  <span
                    style={{
                      width: jobsLoading
                        ? "42%"
                        : jobsError
                          ? "0%"
                          : "100%",
                    }}
                  />
                </div>

                <small>
                  {jobsLoading
                    ? "Atualizando o radar com dados da plataforma."
                    : jobsError
                      ? "A atualização será retomada ao tentar novamente."
                      : jobsTotal === 1
                        ? "Uma vaga publicada disponível agora."
                        : "Vagas publicadas disponíveis agora."}
                </small>
              </div>

              <div
                className="map-orbit-badge"
                aria-hidden="true"
              >
                <svg viewBox="0 0 120 120">
                  <defs>
                    <path
                      id="circlePath"
                      d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0"
                    />
                  </defs>

                  <text>
                    <textPath href="#circlePath">
                      EXPLORE • DESCUBRA • CONECTE •
                    </textPath>
                  </text>
                </svg>

                <ArrowUpRightIcon />
              </div>
            </div>
          </Motion.div>
        </section>

        <section
          className="home-marquee"
          aria-hidden="true"
        >
          <div className="home-marquee-track">
            <MarqueeContent />
            <MarqueeContent />
          </div>
        </section>

        <section className="shortcut-section">
          <SectionHeading
            eyebrow="Navegação inteligente"
            title="Tudo o que você precisa, sem se perder."
            description="Escolha um caminho e a plataforma organiza o restante da jornada."
            actionLabel="Abrir comandos"
            onAction={() => setCommandOpen(true)}
          />

          <div className="shortcut-grid">
            {SHORTCUTS.map((shortcut, index) => (
              <Motion.button
                key={shortcut.title}
                type="button"
                className={`shortcut-card ${shortcut.className}`}
                style={{
                  "--shortcut-accent": shortcut.accent,
                }}
                onClick={() =>
                  handleShortcut(shortcut.action)
                }
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
              >
                <span className="shortcut-number">
                  0{index + 1}
                </span>

                <span className="shortcut-icon">
                  <DynamicIcon name={shortcut.icon} />
                </span>

                <span className="shortcut-content">
                  <strong>{shortcut.title}</strong>
                  <span>{shortcut.description}</span>
                </span>

                <span className="shortcut-footer">
                  <span>{shortcut.tag}</span>
                  <ArrowUpRightIcon />
                </span>
              </Motion.button>
            ))}
          </div>
        </section>

        <section
          ref={jobsRef}
          id="vagas"
          className="jobs-section"
        >
          <SectionHeading
            eyebrow="Radar de oportunidades"
            title="Vagas que merecem sua atenção."
            description="Busque, filtre, salve e abra os detalhes sem sair da Home."
            actionLabel={`${savedJobs.size} salvas`}
            onAction={() => navigate("/vagas-salvas")}
          />

          <div className="jobs-toolbar">
            <div className="jobs-search-box">
              <SearchIcon />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar vaga, empresa ou tecnologia..."
                aria-label="Filtrar vagas"
                disabled={jobsLoading}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            <label className="jobs-sort">
              <span>Ordenar</span>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                disabled={jobsLoading}
              >
                <option value="recent">Mais recentes</option>
                <option value="salary">Maior salário</option>
                <option value="popular">Mais candidaturas</option>
                <option value="title">Título (A–Z)</option>
              </select>

              <ChevronDownIcon />
            </label>
          </div>

          <div
            className="category-filters"
            aria-label="Filtrar por categoria"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "category-filter category-filter--active"
                    : "category-filter"
                }
                onClick={() => setActiveCategory(category)}
                disabled={jobsLoading}
              >
                {category}

                {category !== ALL_CATEGORIES && (
                  <span>
                    {categoryCounts.get(category) || 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="jobs-result-header">
            <span>
              {jobsLoading ? (
                "Carregando oportunidades..."
              ) : jobsError ? (
                "Não foi possível atualizar o radar"
              ) : (
                <>
                  <strong>{filteredJobs.length}</strong>{" "}
                  {filteredJobs.length === 1
                    ? "oportunidade encontrada"
                    : "oportunidades encontradas"}
                  {jobsTotal > jobs.length &&
                    selectedCategory === ALL_CATEGORIES &&
                    !search && (
                      <small> de {jobsTotal} publicadas</small>
                    )}
                </>
              )}
            </span>

            {(search ||
              selectedCategory !== ALL_CATEGORIES) &&
              !jobsLoading && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory(ALL_CATEGORIES);
                }}
              >
                Limpar todos os filtros
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {jobsLoading ? (
              <JobsFeedback key="loading" type="loading" />
            ) : jobsError ? (
              <JobsFeedback
                key="error"
                type="error"
                message={jobsError}
                onAction={retryJobs}
              />
            ) : filteredJobs.length > 0 ? (
              <Motion.div
                layout
                className="jobs-grid"
              >
                {filteredJobs.map((job, index) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    index={index}
                    saved={savedJobs.has(String(job.id))}
                    saving={
                      authLoading ||
                      (isCandidate && favoritesLoading) ||
                      savingJobIds.has(String(job.id))
                    }
                    onSave={() => toggleSaved(job.id)}
                    onOpen={() => openJob(job)}
                  />
                ))}
              </Motion.div>
            ) : jobs.length === 0 ? (
              <JobsFeedback
                key="empty"
                type="empty"
                onAction={retryJobs}
              />
            ) : (
              <JobsFeedback
                key="filtered-empty"
                type="filtered"
                onAction={() => {
                  setSearch("");
                  setActiveCategory(ALL_CATEGORIES);
                }}
              />
            )}
          </AnimatePresence>

          {jobsMoreError && (
            <p className="jobs-more-error" role="alert">
              {jobsMoreError}
            </p>
          )}

          {!jobsLoading && !jobsError && jobsHasMore && (
            <div className="jobs-more-wrapper">
              <button
                type="button"
                className="jobs-more-button"
                onClick={loadMoreJobs}
                disabled={jobsLoadingMore}
                aria-busy={jobsLoadingMore}
              >
                {jobsLoadingMore
                  ? "Carregando oportunidades..."
                  : `Carregar mais oportunidades (${jobs.length} de ${jobsTotal})`}
                <ArrowRightIcon />
              </button>
            </div>
          )}
        </section>

        <section className="experience-section">
          <SectionHeading
            eyebrow="Uma experiência completa"
            title="Mais do que procurar emprego."
            description="A plataforma acompanha cada parte da sua evolução profissional."
          />

          <div className="experience-bento">
            <Motion.article
              className="bento-card bento-card--profile"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="bento-card-header">
                <span className="bento-card-kicker">
                  Perfil inteligente
                </span>

                <UserIcon />
              </div>

              <h3>
                Um perfil que conta sua história.
              </h3>

              <p>
                Apresente experiências, habilidades, projetos e
                objetivos sem parecer apenas mais um currículo.
              </p>

              <div className="profile-completion">
                <div className="profile-avatar">JP</div>

                <div className="profile-completion-copy">
                  <span>
                    Perfil completo
                    <strong>72%</strong>
                  </span>

                  <div>
                    <i />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/perfil")}
              >
                Completar meu perfil
                <ArrowUpRightIcon />
              </button>
            </Motion.article>

            <Motion.article
              className="bento-card bento-card--tracking"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.08 }}
            >
              <div className="bento-card-header">
                <span className="bento-card-kicker">
                  Candidaturas
                </span>

                <RouteIcon />
              </div>

              <h3>
                Acompanhe cada etapa.
              </h3>

              <div className="application-route">
                <ApplicationStep
                  label="Enviada"
                  detail="Hoje, 10:42"
                  status="complete"
                />

                <ApplicationStep
                  label="Em análise"
                  detail="Processo atual"
                  status="active"
                />

                <ApplicationStep
                  label="Entrevista"
                  detail="Próxima etapa"
                  status="waiting"
                />
              </div>
            </Motion.article>

            <Motion.article
              className="bento-card bento-card--match"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.16 }}
            >
              <div className="bento-card-header">
                <span className="bento-card-kicker">
                  Compatibilidade
                </span>

                <TargetIcon />
              </div>

              <div className="match-ring">
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    className="match-ring-background"
                  />

                  <Motion.circle
                    cx="60"
                    cy="60"
                    r="48"
                    className="match-ring-progress"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 0.92 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1.2,
                      delay: 0.35,
                    }}
                  />
                </svg>

                <span>
                  <strong>92%</strong>
                  match
                </span>
              </div>

              <h3>
                Menos ruído. Mais precisão.
              </h3>

              <p>
                Entenda por que uma oportunidade combina com o seu
                perfil antes mesmo de se candidatar.
              </p>
            </Motion.article>

            <Motion.article
              className="bento-card bento-card--activity"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.24 }}
            >
              <div className="bento-card-header">
                <span className="bento-card-kicker">
                  Acontecendo agora
                </span>

                <span className="activity-live-indicator">
                  <i />
                  Live
                </span>
              </div>

              <AnimatePresence mode="wait">
                <Motion.div
                  key={currentActivity.id}
                  className="activity-current"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="activity-current-icon">
                    <DynamicIcon
                      name={currentActivity.icon}
                    />
                  </span>

                  <span>
                    <strong>{currentActivity.title}</strong>

                    <small>{currentActivity.detail}</small>
                  </span>

                  <time>{currentActivity.time}</time>
                </Motion.div>
              </AnimatePresence>

              <div className="activity-dots">
                {activities.map((activity, index) => (
                  <button
                    key={activity.id}
                    type="button"
                    className={
                      index === currentActivityIndex
                        ? "activity-dot activity-dot--active"
                        : "activity-dot"
                    }
                    onClick={() => setActivityIndex(index)}
                    aria-label={`Ver atividade ${index + 1}`}
                  />
                ))}
              </div>
            </Motion.article>
          </div>
        </section>

        <section className="home-cta">
          <div className="home-cta-back" aria-hidden="true" />

          <Motion.div
            className="home-cta-card"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65 }}
          >
            <div className="cta-decoration cta-decoration--one">
              <SparklesIcon />
            </div>

            <div className="cta-decoration cta-decoration--two">
              <StarShape />
            </div>

            <span className="home-cta-eyebrow">
              Seu próximo capítulo
            </span>

            <h2>
              Pronto para encontrar um lugar que combine com você?
            </h2>

            <p>
              Crie seu perfil gratuitamente e transforme talento em
              possibilidades reais.
            </p>

            <div className="home-cta-actions">
              <button
                type="button"
                className="cta-primary"
                onClick={() => navigate("/cadastro")}
              >
                Criar meu perfil
                <ArrowRightIcon />
              </button>

              <button
                type="button"
                className="cta-secondary"
                onClick={scrollToJobs}
              >
                Explorar primeiro
              </button>
            </div>

            <div className="cta-trust">
              <span>
                <CheckIcon />
                Cadastro gratuito
              </span>

              <span>
                <CheckIcon />
                Perfil personalizado
              </span>

              <span>
                <CheckIcon />
                Novas vagas diariamente
              </span>
            </div>
          </Motion.div>
        </section>

        <footer className="home-footer">
          <div className="footer-main">
            <div className="footer-brand">
              <button
                type="button"
                className="footer-logo"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: reduceMotion
                      ? "auto"
                      : "smooth",
                  })
                }
              >
                <span className="home-logo-p">p</span>
                <span className="home-logo-o">o</span>
                <span>int</span>
              </button>

              <p>
                Talentos, empresas e oportunidades conectados por
                experiências mais humanas.
              </p>
            </div>

            <div className="footer-column">
              <strong>Plataforma</strong>

              <button type="button" onClick={scrollToJobs}>
                Vagas
              </button>

              <button
                type="button"
                onClick={() => navigate("/empresas")}
              >
                Empresas
              </button>

              <button
                type="button"
                onClick={() => navigate("/portfolio")}
              >
                Portfólio
              </button>
            </div>

            <div className="footer-column">
              <strong>Minha conta</strong>

              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                Entrar
              </button>

              <button
                type="button"
                onClick={() => navigate("/cadastro")}
              >
                Criar perfil
              </button>

              <button
                type="button"
                onClick={() => navigate("/vagas-salvas")}
              >
                Vagas salvas
              </button>
            </div>

            <div className="footer-column">
              <strong>Institucional</strong>

              <button
                type="button"
                onClick={() => navigate("/sobre")}
              >
                Sobre a Point
              </button>

              <button
                type="button"
                onClick={() => navigate("/contato")}
              >
                Contato
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/login")}
              >
                Área administrativa
              </button>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              © 2026 Point. Todos os direitos reservados.
            </span>

            <div>
              <button
                type="button"
                onClick={() => navigate("/privacidade")}
              >
                Privacidade
              </button>

              <button
                type="button"
                onClick={() => navigate("/termos")}
              >
                Termos
              </button>
            </div>
          </div>
        </footer>

        <nav
          className="mobile-bottom-navigation"
          aria-label="Navegação mobile"
        >
          <button
            type="button"
            className="mobile-nav-item mobile-nav-item--active"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: reduceMotion ? "auto" : "smooth",
              })
            }
          >
            <HomeIcon />
            <span>Início</span>
          </button>

          <button
            type="button"
            className="mobile-nav-item"
            onClick={scrollToJobs}
          >
            <SearchIcon />
            <span>Vagas</span>
          </button>

          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => navigate("/vagas-salvas")}
          >
            <span className="mobile-nav-icon-wrapper">
              <BookmarkIcon />

              {savedJobs.size > 0 && (
                <i>{savedJobs.size}</i>
              )}
            </span>

            <span>Salvas</span>
          </button>

          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => navigate("/perfil")}
          >
            <UserIcon />
            <span>Perfil</span>
          </button>
        </nav>

        <AnimatePresence>
          {selectedJob && (
            <JobModal
              job={selectedJob}
              saved={savedJobs.has(String(selectedJob.id))}
              saving={
                authLoading ||
                (isCandidate && favoritesLoading) ||
                savingJobIds.has(String(selectedJob.id))
              }
              onClose={() => setSelectedJob(null)}
              onSave={() => toggleSaved(selectedJob.id)}
              onApply={() => {
                const destination = `/vagas/${selectedJob.id}`;

                if (authLoading || isCandidate || user) {
                  navigate(destination);
                  return;
                }

                navigate("/login", {
                  state: { redirectTo: destination },
                });
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {commandOpen && (
            <CommandPalette
              query={commandQuery}
              commands={filteredCommands}
              onQueryChange={setCommandQuery}
              onExecute={executeCommand}
              onClose={() => {
                setCommandOpen(false);
                setCommandQuery("");
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <Motion.div
              className="home-toast"
              role="status"
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
            >
              <span className="home-toast-icon">
                <CheckIcon />
              </span>

              {toast}
            </Motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

function JobCard({
  job,
  index,
  saved,
  saving,
  onSave,
  onOpen,
}) {
  return (
    <Motion.article
      layout
      className="job-card"
      style={{
        "--job-accent": job.accent,
        "--job-soft-accent": job.softAccent,
      }}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.96 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.06, 0.3),
      }}
      onClick={onOpen}
    >
      <div className="job-card-visual">
        <div className="job-card-pattern" />

        <span className="job-card-symbol">
          {job.symbol}
        </span>

        <span className="job-card-company-logo">
          {job.companyInitials}
        </span>

        <div className="job-card-badges">
          {job.isNew && (
            <span className="job-new-badge">
              Nova
            </span>
          )}
        </div>

        <button
          type="button"
          className={
            saved
              ? "job-save-button job-save-button--saved"
              : "job-save-button"
          }
          disabled={saving}
          aria-busy={saving}
          aria-pressed={saved}
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
          aria-label={
            saving
              ? `Atualizando favoritos para ${job.title}`
              : saved
                ? `Remover ${job.title} dos favoritos`
                : `Salvar ${job.title}`
          }
        >
          <BookmarkIcon filled={saved} />
        </button>

        <div className="job-match-pill">
          <span>{job.applicants}</span>
          {job.applicants === 1
            ? " candidatura"
            : " candidaturas"}
        </div>
      </div>

      <div className="job-card-body">
        <div className="job-card-meta">
          <span>{job.type}</span>
          <i />
          <span>{job.level}</span>
          <i />
          <span>{job.postedAt}</span>
        </div>

        <h3>{job.title}</h3>

        <p className="job-company">
          <span>{job.company}</span>
          <span>{job.location}</span>
        </p>

        {job.skills.length > 0 && (
          <div className="job-skills">
            {job.skills.slice(0, 3).map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        )}

        <div className="job-card-footer">
          <div>
            <small>Faixa salarial</small>
            <strong>{job.salary}</strong>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            aria-label={`Ver detalhes de ${job.title}`}
          >
            <ArrowUpRightIcon />
          </button>
        </div>
      </div>
    </Motion.article>
  );
}

function JobModal({
  job,
  saved,
  saving,
  onClose,
  onSave,
  onApply,
}) {
  const dialogRootRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useDialogFocus({
    active: true,
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
    onClose,
    rootRef: dialogRootRef,
  });

  return (
    <Motion.div
      ref={dialogRootRef}
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-modal-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Motion.article
        ref={modalRef}
        className="job-modal"
        tabIndex={-1}
        style={{
          "--job-accent": job.accent,
          "--job-soft-accent": job.softAccent,
        }}
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.95,
          rotate: 1.5,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          rotate: 0,
        }}
        exit={{
          opacity: 0,
          y: 28,
          scale: 0.96,
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 26,
        }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="modal-close-button"
          onClick={onClose}
          aria-label="Fechar detalhes da vaga"
        >
          <CloseIcon />
        </button>

        <header className="job-modal-header">
          <div className="job-modal-company-logo">
            {job.companyInitials}
          </div>

          <div>
            <span className="job-modal-kicker">
              {job.category} · {job.type}
            </span>

            <h2 id="job-modal-title">
              {job.title}
            </h2>

            <p>
              {job.company} · {job.location}
            </p>
          </div>

          <button
            type="button"
            className={
              saved
                ? "modal-save-button modal-save-button--saved"
                : "modal-save-button"
            }
            onClick={onSave}
            disabled={saving}
            aria-busy={saving}
            aria-pressed={saved}
            aria-label={
              saving
                ? `Atualizando favoritos para ${job.title}`
                : saved
                  ? `Remover ${job.title} dos favoritos`
                  : `Salvar ${job.title}`
            }
          >
            <BookmarkIcon filled={saved} />
            {saving ? "Salvando..." : saved ? "Salva" : "Salvar"}
          </button>
        </header>

        <div className="job-modal-highlight-grid">
          <div>
            <span>Salário</span>
            <strong>{job.salary}</strong>
          </div>

          <div>
            <span>Nível</span>
            <strong>{job.level}</strong>
          </div>

          <div>
            <span>Vagas abertas</span>
            <strong>
              {job.openings === null
                ? "Não informado"
                : job.openings}
            </strong>
          </div>

          <div>
            <span>Candidaturas</span>
            <strong>{job.applicants}</strong>
          </div>
        </div>

        <div className="job-modal-content">
          <section>
            <h3>Sobre a oportunidade</h3>
            <p>{job.description}</p>
          </section>

          {job.responsibilities.length > 0 && (
            <section>
              <h3>Responsabilidades</h3>

              <ul>
                {job.responsibilities.map((responsibility) => (
                  <li key={responsibility}>
                    <CheckIcon />
                    {responsibility}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.requirements.length > 0 && (
            <section>
              <h3>O que esperamos de você</h3>

              <ul>
                {job.requirements.map((requirement) => (
                  <li key={requirement}>
                    <CheckIcon />
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.skills.length > 0 && (
            <section>
              <h3>Tecnologias e habilidades</h3>

              <div className="job-modal-skills">
                {job.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>
          )}

          {job.benefits.length > 0 && (
            <section>
              <h3>Benefícios</h3>

              <div className="job-modal-skills">
                {job.benefits.map((benefit) => (
                  <span key={benefit}>{benefit}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="job-modal-footer">
          <span>
            Publicada: {job.postedAt}
            {job.applicationDeadline !== "Não informada" &&
              ` · Inscrições até ${job.applicationDeadline}`}
          </span>

          <button
            type="button"
            onClick={onApply}
            aria-label={`Candidatar-se à vaga ${job.title}`}
          >
            Candidatar agora
            <ArrowRightIcon />
          </button>
        </footer>
      </Motion.article>
    </Motion.div>
  );
}

function CommandPalette({
  query,
  commands,
  onQueryChange,
  onExecute,
  onClose,
}) {
  const dialogRootRef = useRef(null);
  const paletteRef = useRef(null);
  const inputRef = useRef(null);

  useDialogFocus({
    active: true,
    containerRef: paletteRef,
    initialFocusRef: inputRef,
    onClose,
    rootRef: dialogRootRef,
  });

  return (
    <Motion.div
      ref={dialogRootRef}
      className="command-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Busca rápida"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Motion.div
        ref={paletteRef}
        className="command-palette"
        tabIndex={-1}
        initial={{
          opacity: 0,
          y: -24,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -14,
          scale: 0.97,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 28,
        }}
      >
        <div className="command-search">
          <SearchIcon />

          <input
            ref={inputRef}
            autoFocus
            type="search"
            aria-label="Buscar uma ação rápida"
            value={query}
            onChange={(event) =>
              onQueryChange(event.target.value)
            }
            placeholder="Para onde você quer ir?"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar busca rápida"
          >
            ESC
          </button>
        </div>

        <div className="command-results">
          <span className="command-results-label">
            Ações rápidas
          </span>

          {commands.length > 0 ? (
            commands.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={() => onExecute(command.id)}
              >
                <span className="command-result-icon">
                  <DynamicIcon name={command.icon} />
                </span>

                <span className="command-result-copy">
                  <strong>{command.label}</strong>
                  <small>{command.description}</small>
                </span>

                <ArrowUpRightIcon />
              </button>
            ))
          ) : (
            <div className="command-empty">
              <SearchIcon />
              Nenhuma ação encontrada.
            </div>
          )}
        </div>

        <div className="command-footer">
          <span>
            <i>↵</i>
            Selecionar
          </span>

          <span>
            <i>ESC</i>
            Fechar
          </span>
        </div>
      </Motion.div>
    </Motion.div>
  );
}

function MobileMenu({
  savedCount,
  onClose,
  onNavigate,
}) {
  const dialogRootRef = useRef(null);
  const menuRef = useRef(null);
  const closeButtonRef = useRef(null);

  useDialogFocus({
    active: true,
    containerRef: menuRef,
    initialFocusRef: closeButtonRef,
    onClose,
    rootRef: dialogRootRef,
  });

  return (
    <Motion.div
      ref={dialogRootRef}
      className="mobile-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Motion.aside
        ref={menuRef}
        className="mobile-menu"
        tabIndex={-1}
        initial={{ x: "105%" }}
        animate={{ x: 0 }}
        exit={{ x: "105%" }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
        }}
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-logo">
            <i>p</i>
            <b>o</b>
            int
          </span>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mobile-menu-sticker">
          Explore seu próximo capítulo
          <SparklesIcon />
        </div>

        <nav>
          <button
            type="button"
            onClick={() => onNavigate("/")}
          >
            <span>01</span>
            Início
            <ArrowUpRightIcon />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("jobs")}
          >
            <span>02</span>
            Vagas
            <ArrowUpRightIcon />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/empresas")}
          >
            <span>03</span>
            Empresas
            <ArrowUpRightIcon />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/portfolio")}
          >
            <span>04</span>
            Portfólio
            <ArrowUpRightIcon />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/vagas-salvas")}
          >
            <span>05</span>
            Vagas salvas
            <i className="mobile-saved-count">
              {savedCount}
            </i>
          </button>
        </nav>

        <div className="mobile-menu-actions">
          <button
            type="button"
            onClick={() => onNavigate("/login")}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/cadastro")}
          >
            Criar perfil
            <ArrowRightIcon />
          </button>
        </div>

        <div className="mobile-menu-footer">
          Point · Plataforma de talentos
        </div>
      </Motion.aside>
    </Motion.div>
  );
}

function JobsFeedback({ type, message, onAction }) {
  const content = {
    loading: {
      title: "Buscando vagas publicadas...",
      description:
        "Estamos atualizando o radar com as oportunidades mais recentes.",
      actionLabel: "",
    },
    error: {
      title: "O radar ficou indisponível.",
      description:
        message || "Tente carregar as oportunidades novamente.",
      actionLabel: "Tentar novamente",
    },
    empty: {
      title: "Ainda não há vagas publicadas.",
      description:
        "Novas oportunidades aparecerão aqui assim que forem publicadas.",
      actionLabel: "Atualizar vagas",
    },
    filtered: {
      title: "Nenhuma vaga passou por esse filtro.",
      description:
        "Tente buscar por outro termo ou visualizar todas as categorias.",
      actionLabel: "Limpar filtros",
    },
  }[type];

  return (
    <Motion.div
      className={`empty-jobs empty-jobs--${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="empty-jobs-icon">
        {type === "loading" ? (
          <BriefcaseIcon />
        ) : type === "filtered" ? (
          <SearchIcon />
        ) : (
          <RefreshIcon />
        )}
      </div>

      <h3>{content.title}</h3>

      <p>{content.description}</p>

      {content.actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {content.actionLabel}
          <RefreshIcon />
        </button>
      )}
    </Motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-eyebrow">
          <span />
          {eyebrow}
        </span>

        <h2>{title}</h2>

        <p>{description}</p>
      </div>

      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
          <ArrowUpRightIcon />
        </button>
      )}
    </div>
  );
}

function MapNode({
  className,
  label,
  detail,
  accent,
  icon,
}) {
  return (
    <Motion.div
      className={`map-node ${className}`}
      style={{ "--node-accent": accent }}
      title={`${label} · ${detail}`}
      whileHover={{
        y: -4,
        rotate: 0,
        scale: 1.03,
      }}
    >
      <span>{icon}</span>

      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
    </Motion.div>
  );
}

function ApplicationStep({
  label,
  detail,
  status,
}) {
  return (
    <div
      className={`application-step application-step--${status}`}
    >
      <span className="application-step-marker">
        {status === "complete" ? (
          <CheckIcon />
        ) : (
          <i />
        )}
      </span>

      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function MarqueeContent() {
  return (
    <>
      <span>
        Descubra oportunidades
        <SparklesIcon />
      </span>

      <span>
        Mostre seu talento
        <StarSmallIcon />
      </span>

      <span>
        Construa novos caminhos
        <RouteIcon />
      </span>

      <span>
        Encontre seu próximo lugar
        <TargetIcon />
      </span>

      <span>
        Faça acontecer
        <ArrowUpRightIcon />
      </span>
    </>
  );
}

function DynamicIcon({ name }) {
  switch (name) {
    case "search":
      return <SearchIcon />;

    case "user":
      return <UserIcon />;

    case "folder":
      return <FolderIcon />;

    case "route":
      return <RouteIcon />;

    case "briefcase":
      return <BriefcaseIcon />;

    case "sparkles":
      return <SparklesIcon />;

    case "shield":
      return <ShieldIcon />;

    case "target":
      return <TargetIcon />;

    case "home":
      return <HomeIcon />;

    case "bookmark":
      return <BookmarkIcon />;

    case "arrow":
      return <ArrowRightIcon />;

    default:
      return <SparklesIcon />;
  }
}

const homeStyles = `
  :root {
    color-scheme: light;
  }

  html {
    scroll-behavior: smooth;
  }

  html,
  body,
  #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    background: #f5f1e9;
  }

  button,
  input,
  select {
    font: inherit;
  }

  button {
    -webkit-tap-highlight-color: transparent;
  }

  .point-home,
  .point-home * {
    box-sizing: border-box;
  }

  .point-home {
    --paper: #f5f1e9;
    --paper-light: #fffdf8;
    --ink: #17171a;
    --pink: #ff4f8b;
    --pink-dark: #dc3670;
    --blue: #64c7ee;
    --yellow: #ffd447;
    --lime: #baf26d;
    --violet: #9183ff;
    --orange: #ff9466;
    --muted: #6e6862;

    --mouse-x: 50%;
    --mouse-y: 50%;
    --parallax-x: 0px;
    --parallax-y: 0px;
    --parallax-x-reverse: 0px;
    --parallax-y-reverse: 0px;

    position: relative;
    min-height: 100vh;
    overflow: hidden;
    isolation: isolate;
    color: var(--ink);
    background:
      radial-gradient(
        circle at var(--mouse-x) var(--mouse-y),
        rgba(255, 79, 139, 0.09),
        transparent 22rem
      ),
      linear-gradient(
        135deg,
        rgba(100, 199, 238, 0.09),
        transparent 24rem
      ),
      var(--paper);
    font-family:
      Inter,
      "SF Pro Display",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .point-home::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -30;
    pointer-events: none;
    background-image:
      linear-gradient(
        rgba(23, 23, 26, 0.042) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(23, 23, 26, 0.042) 1px,
        transparent 1px
      );
    background-size: 54px 54px;
    mask-image:
      linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.85),
        transparent 58rem
      );
  }

  .point-home::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1000;
    opacity: 0.048;
    pointer-events: none;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.9'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 180px;
  }

  .page-scroll-progress {
    position: fixed;
    z-index: 1500;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: transparent;
    pointer-events: none;
  }

  .page-scroll-progress-fill {
    height: 100%;
    background:
      linear-gradient(
        90deg,
        var(--pink),
        var(--violet),
        var(--blue),
        var(--lime)
      );
    border-right: 2px solid var(--ink);
    transition: width 80ms linear;
  }

  .home-blob {
    position: absolute;
    z-index: -15;
    border: 3px solid var(--ink);
    pointer-events: none;
  }

  .home-blob--pink {
    top: -14rem;
    right: 12%;
    width: 29rem;
    height: 29rem;
    border-radius:
      42% 58% 63% 37% /
      38% 47% 53% 62%;
    background: var(--pink);
    transform:
      translate(
        var(--parallax-x-reverse),
        var(--parallax-y-reverse)
      )
      rotate(14deg);
    animation: homeBlobMorph 13s ease-in-out infinite;
  }

  .home-blob--blue {
    top: 45rem;
    left: -13rem;
    width: 28rem;
    height: 28rem;
    border-radius:
      57% 43% 35% 65% /
      51% 63% 37% 49%;
    background: var(--blue);
    transform:
      translate(
        var(--parallax-x),
        var(--parallax-y)
      )
      rotate(-11deg);
    animation:
      homeBlobMorph 16s ease-in-out infinite reverse;
  }

  .home-blob--yellow {
    right: -16rem;
    top: 118rem;
    width: 31rem;
    height: 31rem;
    border-radius:
      38% 62% 54% 46% /
      65% 43% 57% 35%;
    background: var(--yellow);
    animation: homeBlobMorph 18s ease-in-out infinite;
  }

  .home-star {
    position: absolute;
    z-index: -10;
    pointer-events: none;
  }

  .home-star--one {
    top: 40rem;
    right: 5%;
    width: 4rem;
    color: var(--pink);
    animation: starRotation 15s linear infinite;
  }

  .home-star--two {
    top: 92rem;
    left: 4%;
    width: 3rem;
    color: var(--violet);
    animation: starRotation 12s linear infinite reverse;
  }

  .home-header {
    position: sticky;
    z-index: 500;
    top: 0;
    display: grid;
    grid-template-columns:
      minmax(9rem, 1fr)
      auto
      minmax(9rem, 1fr);
    align-items: center;
    gap: 2rem;
    width: 100%;
    min-height: 6rem;
    padding:
      1rem
      clamp(1rem, 4vw, 4.75rem);
    border-bottom: 1px solid transparent;
    transition:
      min-height 250ms ease,
      padding 250ms ease,
      background 250ms ease,
      border-color 250ms ease,
      box-shadow 250ms ease;
  }

  .home-header--compact {
    min-height: 4.8rem;
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
    border-bottom-color: rgba(23, 23, 26, 0.1);
    background: rgba(245, 241, 233, 0.88);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow: 0 10px 35px rgba(23, 23, 26, 0.06);
  }

  .home-logo {
    position: relative;
    justify-self: start;
    display: inline-flex;
    align-items: baseline;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font-size: clamp(1.8rem, 3vw, 2.35rem);
    font-weight: 950;
    letter-spacing: -0.08em;
    cursor: pointer;
  }

  .home-logo-p {
    color: var(--pink);
  }

  .home-logo-o {
    color: #358edc;
  }

  .home-logo-dot {
    position: absolute;
    top: 0.25rem;
    right: -0.65rem;
    width: 0.48rem;
    height: 0.48rem;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
    background: var(--lime);
    animation: logoDotPulse 2.2s ease-in-out infinite;
  }

  .desktop-navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.35rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
    box-shadow: 4px 4px 0 var(--ink);
  }

  .desktop-navigation button {
    min-height: 2.45rem;
    padding: 0.55rem 0.95rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font-size: 0.7rem;
    font-weight: 850;
    cursor: pointer;
    transition:
      background 200ms ease,
      transform 200ms ease;
  }

  .desktop-navigation button:first-child {
    background: var(--yellow);
  }

  .desktop-navigation button:hover {
    background: var(--blue);
    transform: translateY(-1px);
  }

  .header-actions {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .command-trigger {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 2.65rem;
    padding: 0.55rem 0.65rem 0.55rem 0.85rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 3px 3px 0 rgba(23, 23, 26, 0.18);
    transition:
      transform 200ms ease,
      box-shadow 200ms ease,
      background 200ms ease;
  }

  .command-trigger:hover {
    background: #ffffff;
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0 var(--ink);
  }

  .command-trigger svg {
    width: 1rem;
    height: 1rem;
  }

  .command-trigger-label {
    font-size: 0.68rem;
    font-weight: 850;
  }

  .command-shortcut {
    padding: 0.25rem 0.4rem;
    border: 1.5px solid var(--ink);
    border-radius: 0.4rem;
    background: #ece6dc;
    font-family: "Courier New", monospace;
    font-size: 0.54rem;
    font-weight: 900;
    box-shadow: 1px 1px 0 var(--ink);
  }

  .saved-trigger {
    position: relative;
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--paper-light);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--ink);
    transition:
      transform 200ms ease,
      background 200ms ease,
      box-shadow 200ms ease;
  }

  .saved-trigger:hover {
    background: var(--pink);
    transform: translate(-2px, -2px) rotate(-5deg);
    box-shadow: 6px 6px 0 var(--ink);
  }

  .saved-trigger svg {
    width: 1rem;
    height: 1rem;
  }

  .saved-trigger-count {
    position: absolute;
    top: -0.45rem;
    right: -0.45rem;
    display: grid;
    place-items: center;
    min-width: 1.35rem;
    height: 1.35rem;
    padding: 0 0.2rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--yellow);
    color: var(--ink);
    font-size: 0.55rem;
    font-weight: 950;
  }

  .header-login-button {
    min-height: 2.7rem;
    padding: 0.6rem 0.9rem;
    border: 0;
    background: transparent;
    color: var(--ink);
    font-size: 0.7rem;
    font-weight: 900;
    cursor: pointer;
  }

  .header-register-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.75rem;
    padding: 0.65rem 0.9rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--pink);
    color: #ffffff;
    font-size: 0.7rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 4px 4px 0 var(--ink);
    transition:
      transform 200ms ease,
      box-shadow 200ms ease,
      background 200ms ease,
      color 200ms ease;
  }

  .header-register-button:hover {
    background: var(--yellow);
    color: var(--ink);
    transform: translate(-2px, -2px);
    box-shadow: 7px 7px 0 var(--ink);
  }

  .header-register-button svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .mobile-menu-button {
    display: none;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: 2px solid var(--ink);
    border-radius: 0.8rem;
    background: var(--yellow);
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
    cursor: pointer;
  }

  .mobile-menu-button svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .home-hero {
    position: relative;
    z-index: 5;
    display: grid;
    grid-template-columns:
      minmax(0, 0.92fr)
      minmax(500px, 1.08fr);
    align-items: center;
    gap: clamp(3rem, 6vw, 7rem);
    width: min(100%, 1600px);
    min-height: calc(100vh - 6rem);
    min-height: calc(100dvh - 6rem);
    margin: 0 auto;
    padding:
      clamp(2rem, 5vh, 4rem)
      clamp(1.25rem, 4vw, 4.75rem)
      clamp(5rem, 9vh, 8rem);
  }

  .hero-copy {
    position: relative;
    z-index: 5;
    min-width: 0;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 1.25rem;
    padding: 0.5rem 0.7rem;
    border: 2px solid var(--ink);
    border-radius: 0.65rem;
    background: var(--blue);
    color: var(--ink);
    font-size: 0.62rem;
    font-weight: 950;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    box-shadow: 4px 4px 0 var(--ink);
    transform: rotate(-1.5deg);
  }

  .hero-eyebrow-icon {
    display: grid;
    place-items: center;
    width: 1.35rem;
    height: 1.35rem;
    border: 1.5px solid var(--ink);
    border-radius: 0.4rem;
    background: var(--paper-light);
  }

  .hero-eyebrow-icon svg {
    width: 0.75rem;
    height: 0.75rem;
  }

  .hero-title {
    max-width: 9ch;
    margin: 0;
    color: var(--ink);
    font-size: clamp(4rem, 7.6vw, 8.4rem);
    font-weight: 950;
    line-height: 0.78;
    letter-spacing: -0.09em;
    text-transform: uppercase;
  }

  .hero-title-row {
    display: block;
  }

  .hero-title-highlight {
    position: relative;
    display: inline-block;
    margin-top: 0.07em;
    color: var(--paper-light);
    text-shadow:
      -3px -3px 0 var(--ink),
      3px -3px 0 var(--ink),
      -3px 3px 0 var(--ink),
      3px 3px 0 var(--ink),
      8px 8px 0 var(--pink);
    transform: rotate(-2deg);
  }

  .hero-title-highlight::after {
    content: "";
    position: absolute;
    z-index: -1;
    left: -0.06em;
    right: -0.05em;
    bottom: -0.08em;
    height: 0.2em;
    border: 2px solid var(--ink);
    background: var(--yellow);
    transform: rotate(1.5deg);
  }

  .hero-description {
    max-width: 37rem;
    margin: 2rem 0 0;
    color: #514b46;
    font-size: clamp(0.98rem, 1.2vw, 1.12rem);
    font-weight: 640;
    line-height: 1.72;
    letter-spacing: -0.015em;
  }

  .hero-search {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    width: min(100%, 41rem);
    min-height: 4.5rem;
    margin-top: 2rem;
    padding: 0.45rem;
    border: 3px solid var(--ink);
    border-radius: 1.2rem;
    background: var(--paper-light);
    box-shadow:
      7px 7px 0 var(--blue),
      10px 10px 0 var(--ink);
    transition:
      transform 220ms ease,
      box-shadow 220ms ease;
  }

  .hero-search:focus-within {
    transform: translate(-2px, -2px);
    box-shadow:
      10px 10px 0 var(--pink),
      13px 13px 0 var(--ink);
  }

  .hero-search-icon {
    display: grid;
    place-items: center;
    width: 3rem;
    color: var(--ink);
  }

  .hero-search-icon svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .hero-search input {
    width: 100%;
    min-width: 0;
    height: 3.4rem;
    padding: 0 0.7rem 0 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font-size: 0.85rem;
    font-weight: 750;
  }

  .hero-search input::placeholder {
    color: #98918b;
    font-weight: 650;
  }

  .hero-search button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-height: 3.45rem;
    padding: 0.7rem 1rem;
    border: 2px solid var(--ink);
    border-radius: 0.9rem;
    background: var(--ink);
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      transform 200ms ease,
      background 200ms ease,
      color 200ms ease;
  }

  .hero-search button:hover {
    background: var(--yellow);
    color: var(--ink);
    transform: rotate(-1deg);
  }

  .hero-search button svg {
    width: 1rem;
    height: 1rem;
  }

  .hero-trends {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 1.15rem;
  }

  .hero-trends-label {
    color: #716a64;
    font-size: 0.67rem;
    font-weight: 850;
  }

  .hero-trends button {
    padding: 0.36rem 0.55rem;
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font-size: 0.61rem;
    font-weight: 820;
    cursor: pointer;
    transition:
      background 180ms ease,
      transform 180ms ease;
  }

  .hero-trends button:hover {
    background: var(--lime);
    transform: translateY(-2px) rotate(-1deg);
  }

  .hero-proof {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-top: 2rem;
  }

  .hero-proof-avatars {
    display: flex;
    align-items: center;
  }

  .proof-avatar {
    display: grid;
    place-items: center;
    width: 2.45rem;
    height: 2.45rem;
    margin-left: -0.45rem;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.58rem;
    font-weight: 950;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .proof-avatar:first-child {
    margin-left: 0;
  }

  .proof-avatar--one {
    background: var(--pink);
  }

  .proof-avatar--two {
    background: var(--blue);
  }

  .proof-avatar--three {
    background: var(--violet);
    color: #ffffff;
  }

  .proof-avatar--more {
    background: var(--yellow);
  }

  .hero-proof-copy {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .hero-proof-copy strong {
    font-size: 0.7rem;
    font-weight: 950;
  }

  .hero-proof-copy span {
    color: var(--muted);
    font-size: 0.64rem;
    font-weight: 650;
  }

  .opportunity-map {
    position: relative;
    min-width: 0;
    min-height: 41rem;
  }

  .map-paper-back {
    position: absolute;
    inset: 2rem 0.7rem 1rem 1.8rem;
    border: 3px solid var(--ink);
    border-radius: 2.3rem;
    background: var(--pink);
    transform: rotate(3deg);
  }

  .map-paper {
    position: absolute;
    inset: 0 1rem 2rem 0;
    overflow: hidden;
    border: 3px solid var(--ink);
    border-radius: 2.3rem;
    background:
      radial-gradient(
        circle at 30% 24%,
        rgba(100, 199, 238, 0.2),
        transparent 14rem
      ),
      linear-gradient(
        rgba(23, 23, 26, 0.045) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(23, 23, 26, 0.045) 1px,
        transparent 1px
      ),
      var(--paper-light);
    background-size:
      auto,
      34px 34px,
      34px 34px,
      auto;
    box-shadow: 0 35px 80px rgba(23, 23, 26, 0.16);
    transform:
      translate(
        var(--parallax-x),
        var(--parallax-y)
      )
      rotate(-1deg);
    transition: transform 180ms ease-out;
  }

  .map-paper-header {
    position: absolute;
    z-index: 15;
    top: 1.25rem;
    left: 1.35rem;
    right: 1.35rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .map-paper-label {
    padding: 0.5rem 0.65rem;
    border: 2px solid var(--ink);
    border-radius: 0.55rem;
    background: var(--yellow);
    font-size: 0.57rem;
    font-weight: 950;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    box-shadow: 3px 3px 0 var(--ink);
    transform: rotate(-2deg);
  }

  .map-paper-code {
    color: #756e68;
    font-family: "Courier New", monospace;
    font-size: 0.57rem;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .map-route-lines {
    position: absolute;
    inset: 3rem 1rem 1rem;
    width: calc(100% - 2rem);
    height: calc(100% - 4rem);
    color: rgba(23, 23, 26, 0.34);
    pointer-events: none;
  }

  .map-video-card {
    position: absolute;
    z-index: 5;
    top: 19%;
    left: 24%;
    width: 51%;
    height: 53%;
    overflow: hidden;
    border: 3px solid var(--ink);
    border-radius:
      42% 58% 53% 47% /
      49% 38% 62% 51%;
    background: var(--ink);
    box-shadow:
      8px 8px 0 var(--violet),
      11px 11px 0 var(--ink);
    transform: rotate(-3deg);
  }

  .map-video-card video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(1.08) contrast(1.04);
    transform: scale(1.05);
  }

  .map-video-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        to top,
        rgba(23, 23, 26, 0.7),
        transparent 65%
      ),
      linear-gradient(
        135deg,
        rgba(255, 79, 139, 0.13),
        transparent 50%
      );
  }

  .map-video-live {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.55rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.53rem;
    font-weight: 950;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .map-video-live span {
    width: 0.45rem;
    height: 0.45rem;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
    background: var(--lime);
    animation: liveBlink 1.6s ease-in-out infinite;
  }

  .map-video-copy {
    position: absolute;
    left: 1.2rem;
    right: 1.2rem;
    bottom: 1.15rem;
    display: flex;
    flex-direction: column;
    color: #ffffff;
  }

  .map-video-copy span {
    margin-bottom: 0.25rem;
    font-size: 0.59rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .map-video-copy strong {
    font-size: clamp(1rem, 2vw, 1.55rem);
    font-weight: 950;
    line-height: 1;
    letter-spacing: -0.045em;
  }

  .map-node {
    position: absolute;
    z-index: 8;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 9.5rem;
    max-width: 12.5rem;
    padding: 0.65rem;
    border: 2px solid var(--ink);
    border-radius: 0.9rem;
    background: var(--paper-light);
    box-shadow:
      4px 4px 0 var(--node-accent),
      6px 6px 0 var(--ink);
  }

  .map-node > span {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2rem;
    height: 2rem;
    border: 2px solid var(--ink);
    border-radius: 0.6rem;
    background: var(--node-accent);
  }

  .map-node > span svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .map-node > div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .map-node strong {
    overflow: hidden;
    font-size: 0.61rem;
    font-weight: 950;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-node small {
    margin-top: 0.1rem;
    color: var(--muted);
    font-size: 0.53rem;
    font-weight: 700;
  }

  .map-node--development {
    top: 12%;
    left: 3%;
    transform: rotate(-5deg);
  }

  .map-node--design {
    top: 9%;
    right: 3%;
    transform: rotate(4deg);
  }

  .map-node--data {
    left: 3%;
    bottom: 13%;
    transform: rotate(3deg);
  }

  .map-node--product {
    right: 4%;
    bottom: 11%;
    transform: rotate(-4deg);
  }

  .map-match-card {
    position: absolute;
    z-index: 11;
    right: 1.3rem;
    top: 37%;
    width: 10.5rem;
    padding: 0.85rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--lime);
    box-shadow: 5px 5px 0 var(--ink);
    transform: rotate(5deg);
    animation: matchCardFloat 4.5s ease-in-out infinite;
  }

  .match-card-top {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.54rem;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .match-card-icon {
    display: grid;
    place-items: center;
    width: 1.45rem;
    height: 1.45rem;
    border: 1.5px solid var(--ink);
    border-radius: 0.45rem;
    background: var(--paper-light);
  }

  .match-card-icon svg {
    width: 0.72rem;
    height: 0.72rem;
  }

  .map-match-card > strong {
    display: block;
    margin-top: 0.7rem;
    font-size: 2.2rem;
    font-weight: 950;
    line-height: 0.85;
    letter-spacing: -0.07em;
  }

  .match-progress {
    height: 0.45rem;
    margin-top: 0.65rem;
    overflow: hidden;
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
  }

  .match-progress span {
    display: block;
    width: 96%;
    height: 100%;
    border-right: 1.5px solid var(--ink);
    background: var(--pink);
  }

  .map-match-card small {
    display: block;
    margin-top: 0.6rem;
    color: rgba(23, 23, 26, 0.67);
    font-size: 0.53rem;
    font-weight: 750;
    line-height: 1.4;
  }

  .map-orbit-badge {
    position: absolute;
    z-index: 10;
    left: 42%;
    bottom: 2.5%;
    display: grid;
    place-items: center;
    width: 6.4rem;
    height: 6.4rem;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--yellow);
    box-shadow: 5px 5px 0 var(--ink);
    transform: rotate(-8deg);
  }

  .map-orbit-badge > svg:first-child {
    position: absolute;
    inset: 0.25rem;
    width: calc(100% - 0.5rem);
    height: calc(100% - 0.5rem);
    animation: orbitText 14s linear infinite;
  }

  .map-orbit-badge text {
    fill: var(--ink);
    font-size: 9px;
    font-weight: 950;
    letter-spacing: 1.2px;
  }

  .map-orbit-badge > svg:last-child {
    width: 1.6rem;
    height: 1.6rem;
  }

  .home-marquee {
    position: relative;
    z-index: 20;
    display: flex;
    min-height: 3rem;
    overflow: hidden;
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    background: var(--yellow);
    transform: rotate(-0.55deg) scaleX(1.01);
  }

  .home-marquee-track {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    min-width: max-content;
    animation: marqueeMovement 26s linear infinite;
  }

  .home-marquee-track span {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1.25rem;
    font-size: 0.66rem;
    font-weight: 950;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .home-marquee-track svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .shortcut-section,
  .jobs-section,
  .experience-section {
    position: relative;
    z-index: 10;
    width: min(100%, 1600px);
    margin: 0 auto;
    padding:
      clamp(6rem, 11vw, 10rem)
      clamp(1.25rem, 4vw, 4.75rem)
      0;
  }

  .section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 3rem;
    margin-bottom: clamp(2.5rem, 5vw, 4rem);
  }

  .section-heading > div {
    max-width: 55rem;
  }

  .section-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
    color: var(--pink-dark);
    font-family: "Courier New", monospace;
    font-size: 0.62rem;
    font-weight: 950;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }

  .section-eyebrow > span {
    width: 1.8rem;
    height: 2px;
    background: var(--pink);
  }

  .section-heading h2 {
    max-width: 15ch;
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.7rem, 5.6vw, 5.8rem);
    font-weight: 950;
    line-height: 0.87;
    letter-spacing: -0.075em;
    text-transform: uppercase;
  }

  .section-heading p {
    max-width: 42rem;
    margin: 1rem 0 0;
    color: var(--muted);
    font-size: 0.88rem;
    font-weight: 650;
    line-height: 1.65;
  }

  .section-heading > button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    gap: 0.5rem;
    min-height: 3rem;
    padding: 0.65rem 0.9rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.66rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 4px 4px 0 var(--ink);
    transition:
      transform 200ms ease,
      box-shadow 200ms ease,
      background 200ms ease;
  }

  .section-heading > button:hover {
    background: var(--blue);
    transform: translate(-2px, -2px);
    box-shadow: 7px 7px 0 var(--ink);
  }

  .section-heading > button svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .shortcut-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1.15fr)
      minmax(0, 0.85fr)
      minmax(0, 0.85fr);
    grid-template-rows: repeat(2, minmax(14rem, auto));
    gap: 1.25rem;
  }

  .shortcut-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 1.35rem;
    border: 3px solid var(--ink);
    border-radius: 1.5rem;
    overflow: hidden;
    background: var(--paper-light);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    box-shadow: 7px 7px 0 var(--ink);
    transition:
      transform 230ms cubic-bezier(.2,.8,.2,1),
      box-shadow 230ms ease;
  }

  .shortcut-card::before {
    content: "";
    position: absolute;
    right: -3rem;
    bottom: -3rem;
    width: 10rem;
    height: 10rem;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--shortcut-accent);
    transition:
      transform 380ms cubic-bezier(.2,.8,.2,1);
  }

  .shortcut-card:hover {
    transform: translate(-4px, -4px) rotate(-0.5deg);
    box-shadow:
      11px 11px 0 var(--shortcut-accent),
      14px 14px 0 var(--ink);
  }

  .shortcut-card:hover::before {
    transform: scale(1.22) rotate(15deg);
  }

  .shortcut-card--jobs {
    grid-row: 1 / 3;
    background:
      linear-gradient(
        145deg,
        rgba(255, 79, 139, 0.13),
        transparent 52%
      ),
      var(--paper-light);
  }

  .shortcut-card--profile {
    grid-column: 2;
    grid-row: 1;
  }

  .shortcut-card--portfolio {
    grid-column: 3;
    grid-row: 1;
  }

  .shortcut-card--applications {
    grid-column: 2 / 4;
    grid-row: 2;
  }

  .shortcut-number {
    position: absolute;
    top: 1rem;
    right: 1rem;
    color: rgba(23, 23, 26, 0.25);
    font-family: "Courier New", monospace;
    font-size: 0.62rem;
    font-weight: 950;
  }

  .shortcut-icon {
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 3.4rem;
    height: 3.4rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--shortcut-accent);
    box-shadow: 4px 4px 0 var(--ink);
    transform: rotate(-4deg);
    transition: transform 250ms ease;
  }

  .shortcut-card:hover .shortcut-icon {
    transform: rotate(5deg) scale(1.05);
  }

  .shortcut-icon svg {
    width: 1.4rem;
    height: 1.4rem;
  }

  .shortcut-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    max-width: 30rem;
    margin-top: auto;
    padding-top: 2rem;
  }

  .shortcut-content strong {
    font-size: clamp(1.4rem, 2.4vw, 2.4rem);
    font-weight: 950;
    line-height: 0.95;
    letter-spacing: -0.055em;
    text-transform: uppercase;
  }

  .shortcut-content > span {
    max-width: 28rem;
    margin-top: 0.7rem;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 650;
    line-height: 1.55;
  }

  .shortcut-footer {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 0.9rem;
    border-top: 2px dashed rgba(23, 23, 26, 0.24);
  }

  .shortcut-footer > span {
    font-size: 0.6rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .shortcut-footer svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .jobs-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .jobs-search-box {
    display: flex;
    align-items: center;
    min-height: 3.7rem;
    padding: 0 0.45rem 0 1rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--paper-light);
    box-shadow: 4px 4px 0 rgba(23, 23, 26, 0.15);
    transition:
      transform 200ms ease,
      box-shadow 200ms ease;
  }

  .jobs-search-box:focus-within {
    transform: translate(-2px, -2px);
    box-shadow:
      7px 7px 0 var(--blue),
      9px 9px 0 var(--ink);
  }

  .jobs-search-box > svg {
    flex: 0 0 auto;
    width: 1.1rem;
    height: 1.1rem;
  }

  .jobs-search-box input {
    width: 100%;
    min-width: 0;
    height: 3.5rem;
    padding: 0 0.85rem;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font-size: 0.82rem;
    font-weight: 740;
  }

  .jobs-search-box input::placeholder {
    color: #a19a94;
  }

  .jobs-search-box input:disabled,
  .jobs-sort select:disabled,
  .category-filter:disabled {
    cursor: wait;
    opacity: 0.62;
  }

  .jobs-search-box button {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.7rem;
    height: 2.7rem;
    border: 0;
    border-radius: 0.75rem;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }

  .jobs-search-box button:hover {
    background: var(--pink);
  }

  .jobs-search-box button svg {
    width: 1rem;
    height: 1rem;
  }

  .jobs-sort {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 14rem;
    min-height: 3.7rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--yellow);
    box-shadow: 4px 4px 0 var(--ink);
  }

  .jobs-sort > span {
    padding-left: 1rem;
    color: rgba(23, 23, 26, 0.55);
    font-size: 0.56rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .jobs-sort select {
    flex: 1;
    height: 100%;
    padding:
      0
      2.7rem
      0
      0.55rem;
    border: 0;
    outline: 0;
    appearance: none;
    background: transparent;
    color: var(--ink);
    font-size: 0.66rem;
    font-weight: 900;
    cursor: pointer;
  }

  .jobs-sort > svg {
    position: absolute;
    right: 0.9rem;
    width: 0.9rem;
    height: 0.9rem;
    pointer-events: none;
  }

  .category-filters {
    display: flex;
    gap: 0.6rem;
    overflow-x: auto;
    padding:
      0.25rem
      0.25rem
      0.65rem;
    scrollbar-width: thin;
  }

  .category-filter {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex: 0 0 auto;
    min-height: 2.55rem;
    padding: 0.55rem 0.8rem;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.64rem;
    font-weight: 850;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--ink);
    transition:
      transform 180ms ease,
      background 180ms ease,
      box-shadow 180ms ease;
  }

  .category-filter:hover {
    transform: translateY(-2px);
    box-shadow: 4px 4px 0 var(--ink);
  }

  .category-filter--active {
    background: var(--pink);
    color: #ffffff;
    transform: rotate(-1deg);
  }

  .category-filter span {
    display: grid;
    place-items: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.2rem;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    font-size: 0.5rem;
  }

  .jobs-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 1rem 0 1.5rem;
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 700;
  }

  .jobs-result-header strong {
    color: var(--ink);
    font-size: 0.85rem;
    font-weight: 950;
  }

  .jobs-result-header small {
    font-size: inherit;
    font-weight: inherit;
  }

  .jobs-result-header button {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--pink-dark);
    font-size: 0.64rem;
    font-weight: 900;
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .jobs-grid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .job-card {
    position: relative;
    min-width: 0;
    overflow: hidden;
    border: 3px solid var(--ink);
    border-radius: 1.55rem;
    background: var(--paper-light);
    cursor: pointer;
    box-shadow: 6px 6px 0 var(--ink);
    transition:
      transform 240ms cubic-bezier(.2,.8,.2,1),
      box-shadow 240ms ease;
  }

  .job-card:hover {
    transform: translate(-4px, -5px) rotate(-0.5deg);
    box-shadow:
      10px 10px 0 var(--job-accent),
      13px 13px 0 var(--ink);
  }

  .job-card--featured {
    grid-column: span 1;
  }

  .job-card-visual {
    position: relative;
    min-height: 12rem;
    overflow: hidden;
    border-bottom: 3px solid var(--ink);
    background: var(--job-soft-accent);
  }

  .job-card-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.28;
    background-image:
      linear-gradient(
        rgba(23, 23, 26, 0.18) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(23, 23, 26, 0.18) 1px,
        transparent 1px
      );
    background-size: 24px 24px;
    mask-image:
      radial-gradient(
        circle at center,
        black,
        transparent 88%
      );
  }

  .job-card-symbol {
    position: absolute;
    right: -0.5rem;
    bottom: -1.7rem;
    color: var(--job-accent);
    font-family: "Courier New", monospace;
    font-size: 7rem;
    font-weight: 950;
    line-height: 1;
    letter-spacing: -0.12em;
    transform: rotate(-8deg);
    text-shadow:
      -2px -2px 0 var(--ink),
      2px -2px 0 var(--ink),
      -2px 2px 0 var(--ink),
      2px 2px 0 var(--ink);
    opacity: 0.92;
    transition: transform 350ms ease;
  }

  .job-card:hover .job-card-symbol {
    transform: rotate(2deg) scale(1.05);
  }

  .job-card-company-logo {
    position: absolute;
    left: 1rem;
    bottom: 1rem;
    display: grid;
    place-items: center;
    width: 3.4rem;
    height: 3.4rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.75rem;
    font-weight: 950;
    box-shadow: 4px 4px 0 var(--ink);
    transform: rotate(-5deg);
  }

  .job-card-badges {
    position: absolute;
    top: 0.9rem;
    left: 0.9rem;
    display: flex;
    gap: 0.45rem;
  }

  .job-featured-badge,
  .job-new-badge {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 1.75rem;
    padding: 0.35rem 0.5rem;
    border: 1.7px solid var(--ink);
    border-radius: 999px;
    color: var(--ink);
    font-size: 0.5rem;
    font-weight: 950;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .job-featured-badge {
    background: var(--yellow);
  }

  .job-new-badge {
    background: var(--lime);
  }

  .job-featured-badge svg {
    width: 0.7rem;
    height: 0.7rem;
  }

  .job-save-button {
    position: absolute;
    top: 0.85rem;
    right: 0.85rem;
    display: grid;
    place-items: center;
    width: 2.65rem;
    height: 2.65rem;
    padding: 0;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--paper-light);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--ink);
    transition:
      transform 190ms ease,
      background 190ms ease,
      box-shadow 190ms ease;
  }

  .job-save-button:not(:disabled):hover {
    transform: translate(-2px, -2px) rotate(-8deg);
    box-shadow: 5px 5px 0 var(--ink);
  }

  .job-save-button:disabled,
  .modal-save-button:disabled {
    cursor: wait;
    opacity: 0.68;
  }

  .job-save-button--saved {
    background: var(--pink);
  }

  .job-save-button svg {
    width: 1rem;
    height: 1rem;
  }

  .job-match-pill {
    position: absolute;
    right: 0.9rem;
    bottom: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.38rem 0.52rem;
    border: 1.7px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.5rem;
    font-weight: 780;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .job-match-pill span {
    font-weight: 950;
  }

  .job-card-body {
    padding: 1.2rem;
  }

  .job-card-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.42rem;
    color: var(--muted);
    font-size: 0.54rem;
    font-weight: 780;
    text-transform: uppercase;
  }

  .job-card-meta i {
    width: 0.27rem;
    height: 0.27rem;
    border-radius: 50%;
    background: var(--job-accent);
  }

  .job-card h3 {
    margin: 0.8rem 0 0;
    font-size: clamp(1.35rem, 2vw, 1.85rem);
    font-weight: 950;
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .job-company {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin: 0.65rem 0 0;
  }

  .job-company span:first-child {
    color: var(--ink);
    font-size: 0.72rem;
    font-weight: 850;
  }

  .job-company span:last-child {
    color: var(--muted);
    font-size: 0.62rem;
    font-weight: 650;
  }

  .job-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 1rem;
  }

  .job-skills span {
    padding: 0.35rem 0.48rem;
    border: 1.5px solid var(--ink);
    border-radius: 0.45rem;
    background: var(--job-soft-accent);
    color: var(--ink);
    font-size: 0.52rem;
    font-weight: 820;
  }

  .job-card-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.15rem;
    padding-top: 1rem;
    border-top: 2px dashed rgba(23, 23, 26, 0.2);
  }

  .job-card-footer > div {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .job-card-footer small {
    color: var(--muted);
    font-size: 0.51rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .job-card-footer strong {
    font-size: 0.68rem;
    font-weight: 950;
  }

  .job-card-footer button {
    display: grid;
    place-items: center;
    width: 2.8rem;
    height: 2.8rem;
    padding: 0;
    border: 2px solid var(--ink);
    border-radius: 0.8rem;
    background: var(--job-accent);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--ink);
    transition:
      transform 190ms ease,
      box-shadow 190ms ease;
  }

  .job-card-footer button:hover {
    transform: translate(-2px, -2px) rotate(5deg);
    box-shadow: 5px 5px 0 var(--ink);
  }

  .job-card-footer button svg {
    width: 1rem;
    height: 1rem;
  }

  .jobs-more-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 2.5rem;
  }

  .jobs-more-error {
    margin: 2rem auto 0;
    color: #9f1239;
    font-size: 0.72rem;
    font-weight: 850;
    text-align: center;
  }

  .jobs-more-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    min-height: 3.6rem;
    padding: 0.75rem 1.2rem;
    border: 3px solid var(--ink);
    border-radius: 1rem;
    background: var(--ink);
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 6px 6px 0 var(--pink);
    transition:
      transform 220ms ease,
      background 220ms ease,
      color 220ms ease,
      box-shadow 220ms ease;
  }

  .jobs-more-button:hover {
    background: var(--yellow);
    color: var(--ink);
    transform: translate(-3px, -3px);
    box-shadow:
      9px 9px 0 var(--pink),
      12px 12px 0 var(--ink);
  }

  .jobs-more-button svg {
    width: 1rem;
    height: 1rem;
  }

  .empty-jobs {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 23rem;
    padding: 3rem 1.5rem;
    border: 3px dashed var(--ink);
    border-radius: 1.5rem;
    background: rgba(255, 253, 248, 0.72);
    text-align: center;
  }

  .empty-jobs-icon {
    display: grid;
    place-items: center;
    width: 5rem;
    height: 5rem;
    border: 3px solid var(--ink);
    border-radius: 1.3rem;
    background: var(--yellow);
    box-shadow: 5px 5px 0 var(--ink);
    transform: rotate(-6deg);
  }

  .empty-jobs-icon svg {
    width: 2rem;
    height: 2rem;
  }

  .empty-jobs h3 {
    margin: 1.6rem 0 0;
    font-size: 1.8rem;
    font-weight: 950;
    letter-spacing: -0.055em;
  }

  .empty-jobs p {
    max-width: 29rem;
    margin: 0.65rem 0 0;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 650;
    line-height: 1.55;
  }

  .empty-jobs button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.4rem;
    padding: 0.65rem 0.85rem;
    border: 2px solid var(--ink);
    border-radius: 0.8rem;
    background: var(--blue);
    color: var(--ink);
    font-size: 0.63rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--ink);
  }

  .empty-jobs button svg {
    width: 0.9rem;
    height: 0.9rem;
  }

  .jobs-more-button:disabled {
    cursor: wait;
    opacity: 0.72;
    transform: none;
    box-shadow: 4px 4px 0 var(--pink);
  }

  .empty-jobs--loading .empty-jobs-icon {
    background: var(--blue);
    animation: jobsLoadingPulse 1.15s ease-in-out infinite;
  }

  .empty-jobs--error {
    background: rgba(255, 213, 228, 0.58);
  }

  .empty-jobs--error .empty-jobs-icon {
    background: var(--pink);
  }

  .empty-jobs--empty .empty-jobs-icon {
    background: var(--lime);
  }

  @keyframes jobsLoadingPulse {
    0%,
    100% {
      transform: rotate(-6deg) scale(1);
    }

    50% {
      transform: rotate(2deg) scale(1.06);
    }
  }

  .experience-bento {
    display: grid;
    grid-template-columns:
      minmax(0, 1.15fr)
      minmax(0, 0.85fr)
      minmax(0, 0.85fr);
    grid-template-rows: auto auto;
    gap: 1.25rem;
  }

  .bento-card {
    position: relative;
    min-width: 0;
    padding: 1.45rem;
    border: 3px solid var(--ink);
    border-radius: 1.55rem;
    overflow: hidden;
    background: var(--paper-light);
    box-shadow: 6px 6px 0 var(--ink);
  }

  .bento-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .bento-card-header > svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .bento-card-kicker {
    font-family: "Courier New", monospace;
    font-size: 0.59rem;
    font-weight: 950;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .bento-card h3 {
    margin: 1.4rem 0 0;
    font-size: clamp(1.6rem, 2.8vw, 2.7rem);
    font-weight: 950;
    line-height: 0.93;
    letter-spacing: -0.065em;
    text-transform: uppercase;
  }

  .bento-card p {
    margin: 0.8rem 0 0;
    color: var(--muted);
    font-size: 0.74rem;
    font-weight: 650;
    line-height: 1.6;
  }

  .bento-card--profile {
    grid-row: 1 / 3;
    min-height: 31rem;
    background:
      radial-gradient(
        circle at 90% 10%,
        rgba(255, 79, 139, 0.2),
        transparent 13rem
      ),
      var(--paper-light);
  }

  .profile-completion {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-top: 2rem;
    padding: 1rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: #ffffff;
    box-shadow: 4px 4px 0 var(--pink);
  }

  .profile-avatar {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 3.8rem;
    height: 3.8rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--yellow);
    font-size: 1rem;
    font-weight: 950;
    box-shadow: 3px 3px 0 var(--ink);
    transform: rotate(-4deg);
  }

  .profile-completion-copy {
    flex: 1;
    min-width: 0;
  }

  .profile-completion-copy > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.63rem;
    font-weight: 850;
  }

  .profile-completion-copy strong {
    font-size: 0.75rem;
    font-weight: 950;
  }

  .profile-completion-copy > div {
    height: 0.55rem;
    margin-top: 0.6rem;
    overflow: hidden;
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    background: #ece6dd;
  }

  .profile-completion-copy i {
    display: block;
    width: 72%;
    height: 100%;
    border-right: 1.5px solid var(--ink);
    background: var(--pink);
  }

  .bento-card--profile > button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 3.4rem;
    margin-top: 1.4rem;
    padding: 0.7rem 0.9rem;
    border: 2px solid var(--ink);
    border-radius: 0.9rem;
    background: var(--ink);
    color: #ffffff;
    font-size: 0.64rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 4px 4px 0 var(--pink);
    transition:
      transform 200ms ease,
      background 200ms ease,
      color 200ms ease;
  }

  .bento-card--profile > button:hover {
    background: var(--yellow);
    color: var(--ink);
    transform: translate(-2px, -2px);
  }

  .bento-card--profile > button svg {
    width: 1rem;
    height: 1rem;
  }

  .bento-card--tracking {
    background: var(--blue);
  }

  .application-route {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    margin-top: 1.8rem;
  }

  .application-route::before {
    content: "";
    position: absolute;
    top: 1rem;
    bottom: 1rem;
    left: 0.85rem;
    width: 2px;
    background: var(--ink);
  }

  .application-step {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .application-step-marker {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 1.8rem;
    height: 1.8rem;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--paper-light);
  }

  .application-step-marker svg {
    width: 0.85rem;
    height: 0.85rem;
  }

  .application-step-marker i {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: #b7afa7;
  }

  .application-step--complete .application-step-marker {
    background: var(--lime);
  }

  .application-step--active .application-step-marker {
    background: var(--pink);
    box-shadow: 0 0 0 5px rgba(255, 79, 139, 0.2);
  }

  .application-step--active .application-step-marker i {
    background: var(--paper-light);
  }

  .application-step > div {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
  }

  .application-step strong {
    font-size: 0.67rem;
    font-weight: 950;
  }

  .application-step small {
    color: rgba(23, 23, 26, 0.6);
    font-size: 0.55rem;
    font-weight: 700;
  }

  .bento-card--match {
    background: var(--yellow);
  }

  .match-ring {
    position: relative;
    display: grid;
    place-items: center;
    width: 9rem;
    height: 9rem;
    margin: 1rem auto 0;
  }

  .match-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .match-ring circle {
    fill: none;
    stroke-width: 11;
    stroke-linecap: round;
  }

  .match-ring-background {
    stroke: rgba(23, 23, 26, 0.13);
  }

  .match-ring-progress {
    stroke: var(--pink);
    stroke-dasharray: 302;
    stroke-dashoffset: 0;
  }

  .match-ring > span {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.55rem;
    font-weight: 850;
    text-transform: uppercase;
  }

  .match-ring strong {
    font-size: 1.65rem;
    font-weight: 950;
    letter-spacing: -0.07em;
  }

  .bento-card--match h3 {
    margin-top: 0.7rem;
    font-size: 1.7rem;
  }

  .bento-card--activity {
    grid-column: 2 / 4;
    background: var(--violet);
    color: #ffffff;
  }

  .activity-live-indicator {
    display: flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.35rem 0.5rem;
    border: 1.7px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.5rem;
    font-weight: 950;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .activity-live-indicator i {
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 50%;
    background: var(--pink);
    animation: liveBlink 1.6s ease-in-out infinite;
  }

  .activity-current {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    margin-top: 1.5rem;
    padding: 1rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--paper-light);
    color: var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
  }

  .activity-current-icon {
    display: grid;
    place-items: center;
    width: 2.8rem;
    height: 2.8rem;
    border: 2px solid var(--ink);
    border-radius: 0.8rem;
    background: var(--lime);
    box-shadow: 2px 2px 0 var(--ink);
    transform: rotate(-4deg);
  }

  .activity-current-icon svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .activity-current > span:nth-child(2) {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .activity-current strong {
    font-size: 0.7rem;
    font-weight: 950;
  }

  .activity-current small {
    margin-top: 0.2rem;
    overflow: hidden;
    color: var(--muted);
    font-size: 0.57rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .activity-current time {
    color: var(--pink-dark);
    font-family: "Courier New", monospace;
    font-size: 0.55rem;
    font-weight: 950;
  }

  .activity-dots {
    display: flex;
    justify-content: center;
    gap: 0.35rem;
    margin-top: 1rem;
  }

  .activity-dot {
    width: 0.55rem;
    height: 0.55rem;
    padding: 0;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
    background: var(--paper-light);
    cursor: pointer;
    transition:
      width 200ms ease,
      border-radius 200ms ease,
      background 200ms ease;
  }

  .activity-dot--active {
    width: 1.65rem;
    border-radius: 999px;
    background: var(--yellow);
  }

  .home-cta {
    position: relative;
    z-index: 10;
    width: min(100%, 1500px);
    margin: clamp(7rem, 12vw, 11rem) auto 0;
    padding:
      0
      clamp(1.25rem, 4vw, 4.75rem);
  }

  .home-cta-back {
    position: absolute;
    inset: 1rem calc(clamp(1.25rem, 4vw, 4.75rem) - 0.8rem) -0.8rem calc(clamp(1.25rem, 4vw, 4.75rem) + 0.8rem);
    border: 3px solid var(--ink);
    border-radius: 2.2rem;
    background: var(--pink);
    transform: rotate(1.2deg);
  }

  .home-cta-card {
    position: relative;
    z-index: 2;
    overflow: hidden;
    padding:
      clamp(3rem, 7vw, 6rem)
      clamp(1.5rem, 7vw, 7rem);
    border: 3px solid var(--ink);
    border-radius: 2.2rem;
    background:
      linear-gradient(
        rgba(23, 23, 26, 0.06) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(23, 23, 26, 0.06) 1px,
        transparent 1px
      ),
      var(--yellow);
    background-size: 34px 34px;
    text-align: center;
    box-shadow: 0 35px 80px rgba(23, 23, 26, 0.14);
  }

  .home-cta-eyebrow {
    display: inline-flex;
    padding: 0.5rem 0.65rem;
    border: 2px solid var(--ink);
    border-radius: 0.6rem;
    background: var(--blue);
    font-size: 0.58rem;
    font-weight: 950;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    box-shadow: 3px 3px 0 var(--ink);
    transform: rotate(-2deg);
  }

  .home-cta-card h2 {
    max-width: 13ch;
    margin: 1.4rem auto 0;
    font-size: clamp(2.7rem, 6.5vw, 6.5rem);
    font-weight: 950;
    line-height: 0.84;
    letter-spacing: -0.08em;
    text-transform: uppercase;
  }

  .home-cta-card p {
    max-width: 38rem;
    margin: 1.3rem auto 0;
    color: rgba(23, 23, 26, 0.66);
    font-size: 0.86rem;
    font-weight: 680;
    line-height: 1.6;
  }

  .home-cta-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.85rem;
    margin-top: 2rem;
  }

  .cta-primary,
  .cta-secondary {
    min-height: 3.55rem;
    padding: 0.75rem 1.15rem;
    border: 3px solid var(--ink);
    border-radius: 1rem;
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      transform 210ms ease,
      box-shadow 210ms ease,
      background 210ms ease,
      color 210ms ease;
  }

  .cta-primary {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: var(--ink);
    color: #ffffff;
    box-shadow: 6px 6px 0 var(--pink);
  }

  .cta-primary:hover {
    background: var(--pink);
    transform: translate(-3px, -3px);
    box-shadow:
      9px 9px 0 var(--blue),
      12px 12px 0 var(--ink);
  }

  .cta-primary svg {
    width: 1rem;
    height: 1rem;
  }

  .cta-secondary {
    background: var(--paper-light);
    color: var(--ink);
    box-shadow: 5px 5px 0 var(--ink);
  }

  .cta-secondary:hover {
    background: var(--lime);
    transform: translate(-2px, -2px);
    box-shadow: 7px 7px 0 var(--ink);
  }

  .cta-trust {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1.1rem;
    margin-top: 2rem;
  }

  .cta-trust span {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.6rem;
    font-weight: 850;
  }

  .cta-trust svg {
    width: 0.8rem;
    height: 0.8rem;
  }

  .cta-decoration {
    position: absolute;
    display: grid;
    place-items: center;
    border: 3px solid var(--ink);
    background: var(--paper-light);
    box-shadow: 5px 5px 0 var(--ink);
  }

  .cta-decoration--one {
    top: 2rem;
    left: 4%;
    width: 4.3rem;
    height: 4.3rem;
    border-radius: 1rem;
    background: var(--violet);
    color: #ffffff;
    transform: rotate(-12deg);
    animation: decorationFloat 4s ease-in-out infinite;
  }

  .cta-decoration--one svg {
    width: 1.8rem;
    height: 1.8rem;
  }

  .cta-decoration--two {
    right: 5%;
    bottom: 2rem;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: var(--lime);
    transform: rotate(9deg);
    animation: decorationFloat 4.8s ease-in-out infinite reverse;
  }

  .cta-decoration--two svg {
    width: 1.7rem;
    height: 1.7rem;
  }

  .home-footer {
    position: relative;
    z-index: 10;
    margin-top: clamp(7rem, 11vw, 10rem);
    padding:
      clamp(3rem, 6vw, 5rem)
      clamp(1.25rem, 4vw, 4.75rem)
      2rem;
    border-top: 3px solid var(--ink);
    background: var(--ink);
    color: #ffffff;
  }

  .footer-main {
    display: grid;
    grid-template-columns: minmax(15rem, 1.5fr) repeat(3, 1fr);
    gap: clamp(2rem, 5vw, 5rem);
    width: min(100%, 1500px);
    margin: 0 auto;
  }

  .footer-brand {
    max-width: 22rem;
  }

  .footer-logo {
    display: inline-flex;
    align-items: baseline;
    padding: 0;
    border: 0;
    background: transparent;
    color: #ffffff;
    font-size: 2.4rem;
    font-weight: 950;
    letter-spacing: -0.08em;
    cursor: pointer;
  }

  .footer-brand p {
    margin: 1rem 0 0;
    color: rgba(255, 255, 255, 0.54);
    font-size: 0.73rem;
    font-weight: 620;
    line-height: 1.65;
  }

  .footer-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .footer-column strong {
    margin-bottom: 0.3rem;
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 950;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .footer-column button {
    padding: 0;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.58);
    font-size: 0.66rem;
    font-weight: 650;
    cursor: pointer;
    transition:
      color 180ms ease,
      transform 180ms ease;
  }

  .footer-column button:hover {
    color: var(--yellow);
    transform: translateX(3px);
  }

  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    width: min(100%, 1500px);
    margin: 3rem auto 0;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.13);
    color: rgba(255, 255, 255, 0.38);
    font-size: 0.59rem;
    font-weight: 650;
  }

  .footer-bottom > div {
    display: flex;
    gap: 1rem;
  }

  .footer-bottom button {
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: inherit;
    cursor: pointer;
  }

  .footer-bottom button:hover {
    color: #ffffff;
  }

  .mobile-bottom-navigation {
    display: none;
  }

  .modal-overlay,
  .command-overlay,
  .mobile-menu-overlay {
    position: fixed;
    z-index: 2000;
    inset: 0;
    background: rgba(23, 23, 26, 0.58);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .modal-overlay {
    display: grid;
    place-items: center;
    padding: 1.2rem;
    overflow-y: auto;
  }

  .job-modal {
    position: relative;
    width: min(100%, 48rem);
    max-height: calc(100vh - 2.4rem);
    overflow-y: auto;
    border: 3px solid var(--ink);
    border-radius: 1.8rem;
    background: var(--paper-light);
    box-shadow:
      12px 12px 0 var(--job-accent),
      16px 16px 0 var(--ink);
  }

  .modal-close-button {
    position: sticky;
    z-index: 30;
    top: 1rem;
    float: right;
    display: grid;
    place-items: center;
    width: 2.8rem;
    height: 2.8rem;
    margin: 1rem 1rem 0 0;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--paper-light);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--ink);
  }

  .modal-close-button:hover {
    background: var(--pink);
    transform: rotate(7deg);
  }

  .modal-close-button svg {
    width: 1rem;
    height: 1rem;
  }

  .job-modal-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    border-bottom: 3px dashed var(--ink);
    background: var(--job-soft-accent);
  }

  .job-modal-company-logo {
    display: grid;
    place-items: center;
    width: 4.3rem;
    height: 4.3rem;
    border: 3px solid var(--ink);
    border-radius: 1.2rem;
    background: var(--job-accent);
    font-size: 1rem;
    font-weight: 950;
    box-shadow: 5px 5px 0 var(--ink);
    transform: rotate(-5deg);
  }

  .job-modal-kicker {
    color: var(--muted);
    font-family: "Courier New", monospace;
    font-size: 0.59rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .job-modal-header h2 {
    margin: 0.5rem 0 0;
    font-size: clamp(2rem, 4vw, 3.4rem);
    font-weight: 950;
    line-height: 0.9;
    letter-spacing: -0.07em;
    text-transform: uppercase;
  }

  .job-modal-header p {
    margin: 0.6rem 0 0;
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 700;
  }

  .modal-save-button {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.8rem;
    padding: 0.55rem 0.7rem;
    border: 2px solid var(--ink);
    border-radius: 0.8rem;
    background: var(--paper-light);
    color: var(--ink);
    font-size: 0.61rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--ink);
  }

  .modal-save-button--saved {
    background: var(--pink);
    color: #ffffff;
  }

  .modal-save-button svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .job-modal-highlight-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;
    padding: 1.5rem 2rem;
    border-bottom: 2px solid rgba(23, 23, 26, 0.12);
  }

  .job-modal-highlight-grid > div {
    padding: 0.8rem;
    border: 2px solid var(--ink);
    border-radius: 0.85rem;
    background: #ffffff;
    box-shadow: 3px 3px 0 rgba(23, 23, 26, 0.13);
  }

  .job-modal-highlight-grid span {
    display: block;
    color: var(--muted);
    font-size: 0.52rem;
    font-weight: 850;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .job-modal-highlight-grid strong {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.68rem;
    font-weight: 950;
  }

  .job-modal-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.7rem 2rem;
  }

  .job-modal-content section {
    padding-bottom: 1.5rem;
    border-bottom: 2px dashed rgba(23, 23, 26, 0.18);
  }

  .job-modal-content section:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .job-modal-content h3 {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .job-modal-content p {
    margin: 0.65rem 0 0;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 620;
    line-height: 1.65;
  }

  .job-modal-content ul {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
    margin: 0.8rem 0 0;
    padding: 0;
    list-style: none;
  }

  .job-modal-content li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #514b46;
    font-size: 0.67rem;
    font-weight: 700;
  }

  .job-modal-content li svg {
    flex: 0 0 auto;
    width: 0.85rem;
    height: 0.85rem;
    color: #27823b;
  }

  .job-modal-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.8rem;
  }

  .job-modal-skills span {
    padding: 0.4rem 0.58rem;
    border: 1.7px solid var(--ink);
    border-radius: 0.5rem;
    background: var(--job-soft-accent);
    font-size: 0.57rem;
    font-weight: 850;
  }

  .job-modal-footer {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.2rem 2rem;
    border-top: 3px solid var(--ink);
    background: var(--paper-light);
  }

  .job-modal-footer > span {
    color: var(--muted);
    font-size: 0.6rem;
    font-weight: 700;
  }

  .job-modal-footer button {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 3.2rem;
    padding: 0.65rem 1rem;
    border: 2px solid var(--ink);
    border-radius: 0.85rem;
    background: var(--ink);
    color: #ffffff;
    font-size: 0.65rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 4px 4px 0 var(--job-accent);
    transition:
      transform 200ms ease,
      background 200ms ease,
      color 200ms ease;
  }

  .job-modal-footer button:hover {
    background: var(--yellow);
    color: var(--ink);
    transform: translate(-2px, -2px);
  }

  .job-modal-footer button svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .command-overlay {
    display: flex;
    justify-content: center;
    padding: 8vh 1.2rem 1.2rem;
  }

  .command-palette {
    width: min(100%, 38rem);
    height: fit-content;
    overflow: hidden;
    border: 3px solid var(--ink);
    border-radius: 1.35rem;
    background: var(--paper-light);
    box-shadow:
      10px 10px 0 var(--yellow),
      14px 14px 0 var(--ink);
  }

  .command-search {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.7rem;
    min-height: 4.2rem;
    padding: 0 1rem;
    border-bottom: 3px solid var(--ink);
    background: #ffffff;
  }

  .command-search > svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .command-search input {
    width: 100%;
    min-width: 0;
    height: 4rem;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font-size: 0.88rem;
    font-weight: 750;
  }

  .command-search button {
    padding: 0.35rem 0.45rem;
    border: 1.5px solid var(--ink);
    border-radius: 0.4rem;
    background: #ece6dd;
    color: var(--ink);
    font-family: "Courier New", monospace;
    font-size: 0.54rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 1px 1px 0 var(--ink);
  }

  .command-results {
    max-height: 23rem;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .command-results-label {
    display: block;
    padding: 0.45rem 0.5rem;
    color: var(--muted);
    font-size: 0.54rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .command-results > button {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.65rem;
    border: 2px solid transparent;
    border-radius: 0.9rem;
    background: transparent;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    transition:
      border-color 180ms ease,
      background 180ms ease,
      transform 180ms ease;
  }

  .command-results > button:hover {
    border-color: var(--ink);
    background: var(--blue);
    transform: translateX(3px);
  }

  .command-result-icon {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 2px solid var(--ink);
    border-radius: 0.75rem;
    background: var(--yellow);
    box-shadow: 2px 2px 0 var(--ink);
  }

  .command-result-icon svg {
    width: 1rem;
    height: 1rem;
  }

  .command-result-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .command-result-copy strong {
    font-size: 0.68rem;
    font-weight: 950;
  }

  .command-result-copy small {
    margin-top: 0.15rem;
    overflow: hidden;
    color: var(--muted);
    font-size: 0.56rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-results > button > svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .command-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
    padding: 3rem 1rem;
    color: var(--muted);
    font-size: 0.68rem;
    font-weight: 750;
  }

  .command-empty svg {
    width: 1.6rem;
    height: 1.6rem;
  }

  .command-footer {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 2.7rem;
    padding: 0 1rem;
    border-top: 2px solid rgba(23, 23, 26, 0.12);
    background: #f1ece4;
    color: var(--muted);
    font-size: 0.53rem;
    font-weight: 750;
  }

  .command-footer span {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .command-footer i {
    padding: 0.2rem 0.3rem;
    border: 1px solid var(--ink);
    border-radius: 0.3rem;
    background: #ffffff;
    color: var(--ink);
    font-family: "Courier New", monospace;
    font-style: normal;
    font-weight: 950;
  }

  .mobile-menu-overlay {
    display: flex;
    justify-content: flex-end;
  }

  .mobile-menu {
    position: relative;
    display: flex;
    flex-direction: column;
    width: min(92%, 25rem);
    min-height: 100%;
    padding: 1.2rem;
    border-left: 3px solid var(--ink);
    background:
      linear-gradient(
        rgba(23, 23, 26, 0.05) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(23, 23, 26, 0.05) 1px,
        transparent 1px
      ),
      var(--paper);
    background-size: 32px 32px;
  }

  .mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mobile-menu-logo {
    font-size: 2rem;
    font-weight: 950;
    letter-spacing: -0.08em;
  }

  .mobile-menu-logo i {
    color: var(--pink);
    font-style: normal;
  }

  .mobile-menu-logo b {
    color: #358edc;
  }

  .mobile-menu-header button {
    display: grid;
    place-items: center;
    width: 2.8rem;
    height: 2.8rem;
    border: 2px solid var(--ink);
    border-radius: 0.8rem;
    background: var(--yellow);
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
    cursor: pointer;
  }

  .mobile-menu-header svg {
    width: 1rem;
    height: 1rem;
  }

  .mobile-menu-sticker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
    padding: 0.85rem;
    border: 2px solid var(--ink);
    border-radius: 0.9rem;
    background: var(--pink);
    color: #ffffff;
    font-size: 0.62rem;
    font-weight: 950;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 4px 4px 0 var(--ink);
    transform: rotate(-1deg);
  }

  .mobile-menu-sticker svg {
    width: 1rem;
    height: 1rem;
  }

  .mobile-menu nav {
    display: flex;
    flex-direction: column;
    margin-top: 2rem;
  }

  .mobile-menu nav > button {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    min-height: 3.9rem;
    padding: 0 0.3rem;
    border: 0;
    border-bottom: 2px solid var(--ink);
    background: transparent;
    color: var(--ink);
    text-align: left;
    font-size: 1.1rem;
    font-weight: 950;
    letter-spacing: -0.04em;
    cursor: pointer;
  }

  .mobile-menu nav > button:hover {
    background: var(--blue);
  }

  .mobile-menu nav > button > span:first-child {
    color: var(--pink-dark);
    font-family: "Courier New", monospace;
    font-size: 0.55rem;
    letter-spacing: 0.08em;
  }

  .mobile-menu nav svg {
    width: 1rem;
    height: 1rem;
  }

  .mobile-saved-count {
    display: grid;
    place-items: center;
    min-width: 1.6rem;
    height: 1.6rem;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: var(--yellow);
    font-size: 0.55rem;
    font-style: normal;
    box-shadow: 2px 2px 0 var(--ink);
  }

  .mobile-menu-actions {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 0.7rem;
    margin-top: 2rem;
  }

  .mobile-menu-actions button {
    min-height: 3.3rem;
    border: 2px solid var(--ink);
    border-radius: 0.9rem;
    font-size: 0.65rem;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 4px 4px 0 var(--ink);
  }

  .mobile-menu-actions button:first-child {
    background: var(--paper-light);
    color: var(--ink);
  }

  .mobile-menu-actions button:last-child {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--ink);
    color: #ffffff;
  }

  .mobile-menu-actions svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .mobile-menu-footer {
    margin-top: auto;
    padding-top: 2rem;
    color: var(--muted);
    font-size: 0.56rem;
    font-weight: 750;
    text-align: center;
  }

  .home-toast {
    position: fixed;
    z-index: 2500;
    right: 1.2rem;
    bottom: 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 3.5rem;
    padding: 0.7rem 1rem;
    border: 2px solid var(--ink);
    border-radius: 1rem;
    background: var(--lime);
    color: var(--ink);
    font-size: 0.67rem;
    font-weight: 900;
    box-shadow:
      6px 6px 0 var(--pink),
      9px 9px 0 var(--ink);
  }

  .home-toast-icon {
    display: grid;
    place-items: center;
    width: 1.8rem;
    height: 1.8rem;
    border: 1.5px solid var(--ink);
    border-radius: 0.55rem;
    background: var(--paper-light);
  }

  .home-toast-icon svg {
    width: 0.85rem;
    height: 0.85rem;
  }

  .point-home button:focus-visible,
  .point-home input:focus-visible,
  .point-home select:focus-visible {
    outline: 3px solid var(--violet);
    outline-offset: 4px;
  }

  @keyframes homeBlobMorph {
    0%,
    100% {
      border-radius:
        42% 58% 63% 37% /
        38% 47% 53% 62%;
    }

    33% {
      border-radius:
        63% 37% 42% 58% /
        54% 65% 35% 46%;
    }

    66% {
      border-radius:
        35% 65% 57% 43% /
        63% 40% 60% 37%;
    }
  }

  @keyframes starRotation {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes logoDotPulse {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(0.65);
    }
  }

  @keyframes liveBlink {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(0.55);
    }
  }

  @keyframes matchCardFloat {
    0%,
    100% {
      translate: 0 0;
    }

    50% {
      translate: 0 -0.55rem;
    }
  }

  @keyframes orbitText {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes marqueeMovement {
    from {
      transform: translateX(0);
    }

    to {
      transform: translateX(-50%);
    }
  }

  @keyframes decorationFloat {
    0%,
    100% {
      translate: 0 0;
    }

    50% {
      translate: 0 -0.65rem;
    }
  }

  @media (max-width: 1280px) {
    .home-header {
      grid-template-columns: auto 1fr auto;
    }

    .desktop-navigation {
      justify-self: center;
    }

    .command-trigger-label,
    .command-shortcut {
      display: none;
    }

    .command-trigger {
      display: grid;
      place-items: center;
      width: 2.75rem;
      padding: 0;
    }

    .home-hero {
      grid-template-columns:
        minmax(0, 0.88fr)
        minmax(470px, 1.12fr);
      gap: 3.5rem;
    }

    .hero-title {
      font-size: clamp(4rem, 7vw, 6.7rem);
    }

    .jobs-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 1050px) {
    .desktop-navigation,
    .header-login-button,
    .header-register-button {
      display: none;
    }

    .home-header {
      grid-template-columns: 1fr auto;
    }

    .mobile-menu-button {
      display: grid;
    }

    .home-hero {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      min-height: auto;
      padding-top: 4rem;
    }

    .hero-copy {
      width: min(100%, 48rem);
    }

    .hero-title {
      font-size: clamp(4.5rem, 12vw, 7.8rem);
    }

    .opportunity-map {
      width: min(100%, 48rem);
      min-height: 40rem;
      margin: 0 auto;
    }

    .shortcut-grid {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto;
    }

    .shortcut-card--jobs,
    .shortcut-card--profile,
    .shortcut-card--portfolio,
    .shortcut-card--applications {
      grid-column: auto;
      grid-row: auto;
      min-height: 17rem;
    }

    .experience-bento {
      grid-template-columns: 1fr 1fr;
    }

    .bento-card--profile {
      grid-row: span 2;
    }

    .bento-card--activity {
      grid-column: 1 / 3;
    }

    .footer-main {
      grid-template-columns: 1.5fr 1fr 1fr;
    }

    .footer-column:last-child {
      grid-column: 2 / 4;
    }
  }

  @media (max-width: 760px) {
    .point-home {
      padding-bottom: 4.8rem;
    }

    .home-header {
      min-height: 5.1rem;
      padding: 0.8rem 1rem;
    }

    .home-header--compact {
      min-height: 4.5rem;
    }

    .home-logo {
      font-size: 2rem;
    }

    .saved-trigger,
    .command-trigger {
      display: none;
    }

    .home-hero {
      gap: 3rem;
      padding:
        2.5rem
        1rem
        5rem;
    }

    .hero-eyebrow {
      font-size: 0.54rem;
    }

    .hero-title {
      font-size: clamp(3.7rem, 17vw, 6rem);
    }

    .hero-title-highlight {
      text-shadow:
        -2px -2px 0 var(--ink),
        2px -2px 0 var(--ink),
        -2px 2px 0 var(--ink),
        2px 2px 0 var(--ink),
        5px 5px 0 var(--pink);
    }

    .hero-description {
      margin-top: 1.5rem;
      font-size: 0.9rem;
    }

    .hero-search {
      grid-template-columns: auto minmax(0, 1fr);
      min-height: 4rem;
      padding: 0.3rem;
      box-shadow:
        5px 5px 0 var(--blue),
        8px 8px 0 var(--ink);
    }

    .hero-search button {
      grid-column: 1 / 3;
      width: 100%;
      min-height: 3.2rem;
      margin-top: 0.25rem;
    }

    .hero-proof {
      align-items: flex-start;
    }

    .opportunity-map {
      min-height: 35rem;
    }

    .map-paper {
      inset-right: 0.5rem;
      border-radius: 1.6rem;
    }

    .map-paper-back {
      border-radius: 1.6rem;
    }

    .map-video-card {
      top: 21%;
      left: 14%;
      width: 70%;
      height: 46%;
    }

    .map-node {
      min-width: 8.3rem;
      padding: 0.5rem;
    }

    .map-node > span {
      width: 1.7rem;
      height: 1.7rem;
    }

    .map-node--development {
      top: 14%;
      left: 2%;
    }

    .map-node--design {
      top: 10%;
      right: 2%;
    }

    .map-node--data {
      bottom: 13%;
      left: 2%;
    }

    .map-node--product {
      right: 2%;
      bottom: 10%;
    }

    .map-match-card {
      right: 0.8rem;
      top: 43%;
      width: 9rem;
    }

    .map-orbit-badge {
      left: 37%;
      width: 5.4rem;
      height: 5.4rem;
    }

    .shortcut-section,
    .jobs-section,
    .experience-section {
      padding:
        6rem
        1rem
        0;
    }

    .section-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 1.3rem;
    }

    .section-heading h2 {
      font-size: clamp(2.8rem, 13vw, 4.5rem);
    }

    .shortcut-grid {
      grid-template-columns: 1fr;
    }

    .shortcut-card {
      min-height: 17rem;
    }

    .jobs-toolbar {
      grid-template-columns: 1fr;
    }

    .jobs-sort {
      min-width: 0;
    }

    .jobs-result-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .jobs-grid {
      grid-template-columns: 1fr;
    }

    .experience-bento {
      grid-template-columns: 1fr;
    }

    .bento-card--profile,
    .bento-card--activity {
      grid-column: auto;
      grid-row: auto;
    }

    .bento-card--profile {
      min-height: auto;
    }

    .home-cta {
      margin-top: 6rem;
      padding: 0 1rem;
    }

    .home-cta-back {
      inset:
        0.8rem
        0.3rem
        -0.6rem
        1.7rem;
    }

    .home-cta-card {
      padding: 3.5rem 1.2rem;
      border-radius: 1.5rem;
    }

    .home-cta-card h2 {
      font-size: clamp(2.8rem, 13vw, 4.8rem);
    }

    .cta-decoration {
      display: none;
    }

    .cta-trust {
      align-items: flex-start;
      flex-direction: column;
      width: fit-content;
      margin-left: auto;
      margin-right: auto;
    }

    .home-footer {
      margin-top: 6rem;
      padding:
        3rem
        1rem
        6rem;
    }

    .footer-main {
      grid-template-columns: 1fr 1fr;
    }

    .footer-brand {
      grid-column: 1 / 3;
    }

    .footer-column:last-child {
      grid-column: auto;
    }

    .footer-bottom {
      align-items: flex-start;
      flex-direction: column;
    }

    .mobile-bottom-navigation {
      position: fixed;
      z-index: 1200;
      left: 0.75rem;
      right: 0.75rem;
      bottom: max(0.75rem, env(safe-area-inset-bottom));
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      min-height: 4rem;
      padding: 0.35rem;
      border: 2px solid var(--ink);
      border-radius: 1.2rem;
      background: rgba(255, 253, 248, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow:
        5px 5px 0 var(--pink),
        8px 8px 0 var(--ink);
    }

    .mobile-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      min-width: 0;
      border: 0;
      border-radius: 0.85rem;
      background: transparent;
      color: var(--muted);
      font-size: 0.5rem;
      font-weight: 850;
      cursor: pointer;
    }

    .mobile-nav-item--active {
      background: var(--yellow);
      color: var(--ink);
    }

    .mobile-nav-item svg {
      width: 1rem;
      height: 1rem;
    }

    .mobile-nav-icon-wrapper {
      position: relative;
      display: grid;
      place-items: center;
    }

    .mobile-nav-icon-wrapper i {
      position: absolute;
      top: -0.7rem;
      right: -0.85rem;
      display: grid;
      place-items: center;
      min-width: 1.15rem;
      height: 1.15rem;
      padding: 0 0.15rem;
      border: 1.5px solid var(--ink);
      border-radius: 999px;
      background: var(--pink);
      color: #ffffff;
      font-size: 0.45rem;
      font-style: normal;
      font-weight: 950;
    }

    .job-modal-header {
      grid-template-columns: auto minmax(0, 1fr);
      padding: 1.4rem 1rem;
    }

    .modal-save-button {
      grid-column: 1 / 3;
      width: 100%;
      justify-content: center;
    }

    .job-modal-highlight-grid {
      grid-template-columns: 1fr 1fr;
      padding: 1.2rem 1rem;
    }

    .job-modal-content {
      padding: 1.4rem 1rem;
    }

    .job-modal-content ul {
      grid-template-columns: 1fr;
    }

    .job-modal-footer {
      align-items: stretch;
      flex-direction: column;
      padding: 1rem;
    }

    .job-modal-footer button {
      justify-content: center;
      width: 100%;
    }

    .home-toast {
      right: 1rem;
      bottom: 5.8rem;
      left: 1rem;
      justify-content: center;
    }
  }

  @media (max-width: 440px) {
    .hero-title {
      font-size: 3.55rem;
    }

    .opportunity-map {
      min-height: 32rem;
    }

    .map-paper-label {
      max-width: 8rem;
    }

    .map-paper-code {
      display: none;
    }

    .map-node {
      min-width: 7.5rem;
    }

    .map-node strong {
      font-size: 0.54rem;
    }

    .map-node small {
      font-size: 0.48rem;
    }

    .map-match-card {
      width: 8rem;
    }

    .map-orbit-badge {
      left: 32%;
    }

    .section-heading h2 {
      font-size: 2.8rem;
    }

    .footer-main {
      grid-template-columns: 1fr;
    }

    .footer-brand,
    .footer-column:last-child {
      grid-column: auto;
    }

    .command-overlay {
      padding: 1rem;
      align-items: flex-start;
    }

    .command-palette {
      margin-top: 2rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }

    .point-home *,
    .point-home *::before,
    .point-home *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }

    .map-paper,
    .home-blob {
      transform: none !important;
    }
  }
`;

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a3 3 0 0 1 3-3h4l2 3h6a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h3a3 3 0 0 0 3-3V8a3 3 0 0 1 3-3h-1" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12.5c5.5 2 12.5 2 18 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.7-4" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m8 9-4 3 4 3" />
      <path d="m16 9 4 3-4 3" />
      <path d="m14 5-4 14" />
    </svg>
  );
}

function PenToolIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 7 7-8 8-6 1 1-6 6-10Z" />
      <path d="m9 6 7 7" />
      <path d="M5 19 3 21" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19H2" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 1 3.2L16 7.5l-3 1.3L12 12l-1-3.2-3-1.3 3-1.3L12 3Z" />
      <path d="m18.5 13 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
      <path d="m6 14 .6 1.8 1.8.6-1.8.6L6 18.8 5.4 17l-1.8-.6 1.8-.6L6 14Z" />
    </svg>
  );
}

function BookmarkIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17l-6-4-6 4V4Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 1 0-2 5.3" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

function StarSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 1.5 2.6 7.9 7.9 2.6-7.9 2.6-2.6 7.9-2.6-7.9L1.5 12l7.9-2.6L12 1.5Z" />
    </svg>
  );
}

function StarShape({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M50 0c2.7 28.7 21.3 47.3 50 50-28.7 2.7-47.3 21.3-50 50C47.3 71.3 28.7 52.7 0 50 28.7 47.3 47.3 28.7 50 0Z" />
    </svg>
  );
}
