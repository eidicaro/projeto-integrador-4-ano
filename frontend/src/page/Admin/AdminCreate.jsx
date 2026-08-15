import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api, { getApiErrorMessage } from "../../lib/api";
import {
  getLaravelValidationErrors,
  unwrapApiData,
} from "../../lib/candidate";

const DRAFT_STORAGE_KEY = "admin-create-job-draft-v2";

const employmentTypes = [
  "CLT",
  "Estágio",
  "Jovem Aprendiz",
  "PJ",
  "Temporário",
  "Freelancer",
];

const workModes = [
  "Presencial",
  "Híbrido",
  "Remoto",
];

const seniorityLevels = [
  "Não informado",
  "Trainee",
  "Júnior",
  "Pleno",
  "Sênior",
  "Especialista",
];

const benefitsOptions = [
  {
    id: "vale-refeicao",
    label: "Vale-refeição",
    emoji: "🍽️",
  },
  {
    id: "vale-alimentacao",
    label: "Vale-alimentação",
    emoji: "🛒",
  },
  {
    id: "vale-transporte",
    label: "Vale-transporte",
    emoji: "🚌",
  },
  {
    id: "plano-saude",
    label: "Plano de saúde",
    emoji: "💙",
  },
  {
    id: "plano-odontologico",
    label: "Plano odontológico",
    emoji: "😁",
  },
  {
    id: "gympass",
    label: "Gympass",
    emoji: "🏋️",
  },
  {
    id: "home-office",
    label: "Auxílio home office",
    emoji: "🏠",
  },
  {
    id: "horario-flexivel",
    label: "Horário flexível",
    emoji: "⏰",
  },
  {
    id: "participacao-lucros",
    label: "Participação nos lucros",
    emoji: "📈",
  },
  {
    id: "day-off",
    label: "Day off",
    emoji: "🎉",
  },
  {
    id: "bolsa-estudos",
    label: "Bolsa de estudos",
    emoji: "🎓",
  },
  {
    id: "seguro-vida",
    label: "Seguro de vida",
    emoji: "🛡️",
  },
];

const textTemplates = {
  description: `Estamos buscando uma pessoa comprometida, curiosa e preparada para fazer parte do nosso time.

Você trabalhará em um ambiente colaborativo, com espaço para aprendizado, desenvolvimento profissional e participação ativa em projetos relevantes para a empresa.`,

  responsibilities: `• Participar das atividades e projetos da área;
• Colaborar com os demais membros da equipe;
• Organizar e acompanhar as tarefas sob sua responsabilidade;
• Propor melhorias para processos internos;
• Manter uma comunicação clara com a equipe e liderança.`,

  requirements: `• Boa comunicação e organização;
• Facilidade para trabalhar em equipe;
• Proatividade e vontade de aprender;
• Comprometimento com prazos e resultados;
• Conhecimentos relacionados à área da vaga.`,
};

const emptyForm = {
  title: "",
  company: "",
  department: "",
  location: "",
  employmentType: "",
  workMode: "",
  seniority: "Não informado",
  openings: "1",
  applicationEmail: "",
  applicationDeadline: "",
  salaryMin: "",
  salaryMax: "",
  salaryVisible: true,
  description: "",
  responsibilities: "",
  requirements: "",
  tags: [],
  benefits: [],
};

function loadStoredDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedDraft = window.localStorage.getItem(
      DRAFT_STORAGE_KEY
    );

    if (!storedDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(storedDraft);

    if (!parsedDraft?.form) {
      return null;
    }

    return {
      form: {
        ...emptyForm,
        ...parsedDraft.form,
        applicationEmail: "",
        tags: Array.isArray(parsedDraft.form.tags)
          ? parsedDraft.form.tags
          : [],
        benefits: Array.isArray(parsedDraft.form.benefits)
          ? parsedDraft.form.benefits
          : [],
      },
      savedAt: parsedDraft.savedAt || null,
    };
  } catch {
    return null;
  }
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!value || Number.isNaN(numericValue)) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-");

  return `${day}/${month}/${year}`;
}

function validateForm(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = "Informe o título da vaga.";
  } else if (form.title.trim().length < 4) {
    errors.title = "O título deve possuir pelo menos 4 caracteres.";
  }

  if (!form.company.trim()) {
    errors.company = "Informe o nome da empresa.";
  }

  if (!form.location.trim()) {
    errors.location = "Informe a localização da vaga.";
  }

  if (!form.employmentType) {
    errors.employmentType = "Selecione o tipo de contratação.";
  }

  if (!form.workMode) {
    errors.workMode = "Selecione o modelo de trabalho.";
  }

  if (!form.applicationEmail.trim()) {
    errors.applicationEmail =
      "Informe o e-mail para recebimento das candidaturas.";
  } else {
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(form.applicationEmail.trim())) {
      errors.applicationEmail =
        "Informe um endereço de e-mail válido.";
    }
  }

  if (!form.description.trim()) {
    errors.description = "Escreva uma descrição para a vaga.";
  } else if (form.description.trim().length < 80) {
    errors.description =
      "Utilize pelo menos 80 caracteres na descrição.";
  }

  if (!form.requirements.trim()) {
    errors.requirements =
      "Informe os principais requisitos da vaga.";
  } else if (form.requirements.trim().length < 30) {
    errors.requirements =
      "Descreva os requisitos com um pouco mais de detalhes.";
  }

  const salaryMin = Number(form.salaryMin);
  const salaryMax = Number(form.salaryMax);

  if (
    form.salaryMin &&
    form.salaryMax &&
    salaryMin > salaryMax
  ) {
    errors.salaryMax =
      "O salário máximo deve ser maior que o salário mínimo.";
  }

  if (
    form.openings &&
    Number(form.openings) < 1
  ) {
    errors.openings =
      "A vaga deve possuir pelo menos uma oportunidade.";
  }

  return errors;
}

const API_JOB_FIELDS = {
  titulo: "title",
  empresa: "company",
  departamento: "department",
  localizacao: "location",
  tipo_contratacao: "employmentType",
  modalidade: "workMode",
  senioridade: "seniority",
  quantidade_vagas: "openings",
  email_candidatura: "applicationEmail",
  data_limite: "applicationDeadline",
  salario_min: "salaryMin",
  salario_max: "salaryMax",
  salario_visivel: "salaryVisible",
  descricao: "description",
  responsabilidades: "responsibilities",
  requisitos: "requirements",
  beneficios: "benefits",
  imagem: "image",
};

function mapJobApiErrors(error) {
  const validationErrors = getLaravelValidationErrors(error);

  return Object.fromEntries(
    Object.entries(validationErrors).map(([field, message]) => [
      API_JOB_FIELDS[field] || field,
      message,
    ])
  );
}

function createJobPayload(form) {
  return {
    title: form.title.trim(),
    company: form.company.trim(),
    department: form.department.trim(),
    location: form.location.trim(),
    employmentType: form.employmentType,
    workMode: form.workMode,
    seniority: form.seniority,
    openings: Number(form.openings) || 1,
    applicationEmail: form.applicationEmail.trim().toLowerCase(),
    applicationDeadline: form.applicationDeadline || null,
    salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
    salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
    salaryVisible: Boolean(form.salaryVisible),
    description: form.description.trim(),
    responsibilities: form.responsibilities.trim(),
    requirements: form.requirements.trim(),
    tags: form.tags,
    benefits: form.benefits,
    status: "publicada",
  };
}

function createSafeDraft(form) {
  return {
    ...form,
    applicationEmail: "",
  };
}

function createFormFromJob(job) {
  return {
    ...emptyForm,
    title: job?.title || "",
    company: job?.company || "",
    department: job?.department || "",
    location: job?.location || "",
    employmentType: job?.employmentType || "",
    workMode: job?.workMode || "",
    seniority: job?.seniority || "Não informado",
    openings: String(job?.openings || 1),
    applicationEmail: job?.applicationEmail || "",
    applicationDeadline: job?.applicationDeadline
      ? String(job.applicationDeadline).slice(0, 10)
      : "",
    salaryMin: job?.salaryMin ?? "",
    salaryMax: job?.salaryMax ?? "",
    salaryVisible: job?.salaryVisible !== false,
    description: job?.description || "",
    responsibilities: job?.responsibilities || "",
    requirements: job?.requirements || "",
    tags: Array.isArray(job?.tags) ? job.tags : [],
    benefits: Array.isArray(job?.benefits) ? job.benefits : [],
  };
}

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}) {
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

  switch (name) {
    case "logo":
      return (
        <svg {...props}>
          <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
          <path d="m8.5 8.2 3.5-2 3.5 2v4L12 14.3l-3.5-2.1v-4Z" />
          <path d="M12 14.3V20" />
        </svg>
      );

    case "home":
      return (
        <svg {...props}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "briefcase":
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
          <path d="M10 12v2h4v-2" />
        </svg>
      );

    case "arrowLeft":
      return (
        <svg {...props}>
          <path d="M19 12H5" />
          <path d="m11 18-6-6 6-6" />
        </svg>
      );

    case "arrowRight":
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "save":
      return (
        <svg {...props}>
          <path d="M4 4h13l3 3v13H4V4Z" />
          <path d="M8 4v6h8V4" />
          <path d="M8 20v-6h8v6" />
        </svg>
      );

    case "sparkles":
      return (
        <svg {...props}>
          <path d="m12 3-1.1 3.2a2.8 2.8 0 0 1-1.7 1.7L6 9l3.2 1.1a2.8 2.8 0 0 1 1.7 1.7L12 15l1.1-3.2a2.8 2.8 0 0 1 1.7-1.7L18 9l-3.2-1.1a2.8 2.8 0 0 1-1.7-1.7L12 3Z" />
          <path d="m5 16-.5 1.5a1.7 1.7 0 0 1-1 1L2 19l1.5.5a1.7 1.7 0 0 1 1 1L5 22l.5-1.5a1.7 1.7 0 0 1 1-1L8 19l-1.5-.5a1.7 1.7 0 0 1-1-1L5 16Z" />
        </svg>
      );

    case "building":
      return (
        <svg {...props}>
          <path d="M4 21V5l8-3v19" />
          <path d="M12 9h8v12" />
          <path d="M8 8h.01" />
          <path d="M8 12h.01" />
          <path d="M8 16h.01" />
          <path d="M16 13h.01" />
          <path d="M16 17h.01" />
          <path d="M2 21h20" />
        </svg>
      );

    case "mapPin":
      return (
        <svg {...props}>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "layers":
      return (
        <svg {...props}>
          <path d="m12 2 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 17 9 5 9-5" />
        </svg>
      );

    case "monitor":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );

    case "chart":
      return (
        <svg {...props}>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19V2" />
        </svg>
      );

    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M3 10h18" />
        </svg>
      );

    case "mail":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );

    case "money":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 10h.01" />
          <path d="M17 14h.01" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );

    case "eye":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case "eyeOff":
      return (
        <svg {...props}>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2 3.1" />
          <path d="M6.6 6.6C3.6 8.4 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4.3-1" />
        </svg>
      );

    case "fileText":
      return (
        <svg {...props}>
          <path d="M6 2h9l5 5v15H6V2Z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      );

    case "list":
      return (
        <svg {...props}>
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      );

    case "target":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );

    case "tag":
      return (
        <svg {...props}>
          <path d="M20 13 13 20 4 11V4h7l9 9Z" />
          <circle cx="8.5" cy="8.5" r="1" />
        </svg>
      );

    case "gift":
      return (
        <svg {...props}>
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M12 8v13" />
          <path d="M3 12h18" />
          <path d="M7.5 8C5.5 8 4 7 4 5.5S5 3 6.5 3C9 3 12 8 12 8" />
          <path d="M16.5 8C18.5 8 20 7 20 5.5S19 3 17.5 3C15 3 12 8 12 8" />
        </svg>
      );

    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "close":
      return (
        <svg {...props}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );

    case "trash":
      return (
        <svg {...props}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m6 6 1 15h10l1-15" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      );

    case "send":
      return (
        <svg {...props}>
          <path d="m22 2-7 20-4-9-9-4 20-7Z" />
          <path d="M22 2 11 13" />
        </svg>
      );

    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "shield":
      return (
        <svg {...props}>
          <path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.7 7.5 9.5 4.4-1.8 7.5-4.9 7.5-9.5V6L12 3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "alert":
      return (
        <svg {...props}>
          <path d="M12 3 2 21h20L12 3Z" />
          <path d="M12 9v5" />
          <path d="M12 18h.01" />
        </svg>
      );

    case "copy":
      return (
        <svg {...props}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      );

    case "magic":
      return (
        <svg {...props}>
          <path d="m15 4 5 5L8 21H3v-5L15 4Z" />
          <path d="m13 6 5 5" />
          <path d="M6 3v3" />
          <path d="M4.5 4.5h3" />
          <path d="M19 16v4" />
          <path d="M17 18h4" />
        </svg>
      );

    case "preview":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    default:
      return null;
  }
}

export default function AdminCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const editJob = location.state?.editJob || null;
  const isEditing = editJob?.id !== null && editJob?.id !== undefined;

  const [initialDraft] = useState(() => isEditing ? null : loadStoredDraft());
  const titleInputRef = useRef(null);

  const [form, setForm] = useState(
    () => isEditing ? createFormFromJob(editJob) : initialDraft?.form || emptyForm
  );

  const [tagInput, setTagInput] = useState("");
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [apiErrors, setApiErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(
    initialDraft?.savedAt
      ? new Date(initialDraft.savedAt)
      : null
  );

  const [toast, setToast] = useState(() =>
    initialDraft
      ? {
          type: "info",
          title: "Rascunho recuperado",
          description: "Continuamos exatamente de onde você parou.",
        }
      : null
  );
  const [modalMode, setModalMode] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] =
    useState(false);

  const errors = useMemo(
    () => ({ ...validateForm(form), ...apiErrors }),
    [apiErrors, form]
  );

  const completion = useMemo(() => {
    const checks = [
      form.title.trim().length >= 4,
      Boolean(form.company.trim()),
      Boolean(form.location.trim()),
      Boolean(form.employmentType),
      Boolean(form.workMode),
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.applicationEmail.trim()
      ),
      form.description.trim().length >= 80,
      form.requirements.trim().length >= 30,
    ];

    const completedFields = checks.filter(Boolean).length;

    return Math.round(
      (completedFields / checks.length) * 100
    );
  }, [form]);

  const qualityScore = useMemo(() => {
    let score = Math.round(completion * 0.65);

    if (form.tags.length >= 3) {
      score += 10;
    } else {
      score += form.tags.length * 3;
    }

    if (form.benefits.length >= 4) {
      score += 10;
    } else {
      score += form.benefits.length * 2;
    }

    if (form.responsibilities.trim().length >= 80) {
      score += 10;
    }

    if (form.salaryMin || form.salaryMax) {
      score += 5;
    }

    return Math.min(100, score);
  }, [completion, form]);

  const selectedBenefits = useMemo(
    () =>
      benefitsOptions.filter((benefit) =>
        form.benefits.includes(benefit.id)
      ),
    [form.benefits]
  );

  const salaryText = useMemo(() => {
    if (!form.salaryVisible) {
      return "Salário confidencial";
    }

    if (form.salaryMin && form.salaryMax) {
      return `${formatCurrency(
        form.salaryMin
      )} a ${formatCurrency(form.salaryMax)}`;
    }

    if (form.salaryMin) {
      return `A partir de ${formatCurrency(
        form.salaryMin
      )}`;
    }

    if (form.salaryMax) {
      return `Até ${formatCurrency(form.salaryMax)}`;
    }

    return "Salário a combinar";
  }, [
    form.salaryMin,
    form.salaryMax,
    form.salaryVisible,
  ]);

  const saveDraft = useCallback((showFeedback = true) => {
    if (typeof window === "undefined") return;

    const savedAt = new Date();

    try {
      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          form: createSafeDraft(form),
          savedAt: savedAt.toISOString(),
        })
      );

      setLastSaved(savedAt);

      if (showFeedback) {
        setToast({
          type: "success",
          title: "Rascunho salvo",
          description:
            "Os dados não sensíveis foram armazenados neste navegador. Por segurança, o e-mail não é salvo localmente.",
        });
      }
    } catch {
      if (showFeedback) {
        setToast({
          type: "error",
          title: "Não foi possível salvar",
          description:
            "Verifique o armazenamento disponível do navegador.",
        });
      }
    }
  }, [form]);

  const focusFirstInvalidField = useCallback(() => {
    const firstInvalidField = Object.keys(errors)[0];
    if (!firstInvalidField) return;

    const fieldElement = document.querySelector(
      `[data-field="${firstInvalidField}"]`
    );

    fieldElement?.focus();
    fieldElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [errors]);

  const openPublishModal = useCallback(() => {
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      setToast({
        type: "error",
        title: "Revise algumas informações",
        description:
          "Existem campos obrigatórios que precisam de atenção.",
      });

      window.setTimeout(focusFirstInvalidField, 80);
      return;
    }

    setModalMode("publish");
  }, [errors, focusFirstInvalidField]);

  useEffect(() => {
    const autoSaveTimer = window.setTimeout(() => {
      saveDraft(false);
    }, 600);

    return () => {
      window.clearTimeout(autoSaveTimer);
    };
  }, [saveDraft]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const toastTimer = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => {
      window.clearTimeout(toastTimer);
    };
  }, [toast]);

  useEffect(() => {
    function handleKeyboardShortcut(event) {
      const modifierPressed =
        event.ctrlKey || event.metaKey;

      if (
        modifierPressed &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        saveDraft(true);
      }

      if (
        modifierPressed &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        openPublishModal();
      }

      if (event.key === "Escape") {
        if (!isPublishing) {
          setModalMode(null);
          setMobilePreviewOpen(false);
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboardShortcut
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboardShortcut
      );
    };
  }, [isPublishing, openPublishModal, saveDraft]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      const hasContent = Object.entries(form).some(
        ([key, value]) => {
          if (key === "salaryVisible") {
            return false;
          }

          if (Array.isArray(value)) {
            return value.length > 0;
          }

          return String(value || "").trim() !== "";
        }
      );

      if (!hasContent) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [form]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setApiErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function handleFieldChange(event) {
    const { name, value, type, checked } =
      event.target;

    updateField(
      name,
      type === "checkbox" ? checked : value
    );
  }

  function markFieldAsTouched(field) {
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
  }

  function shouldShowError(field) {
    return Boolean(
      errors[field] &&
        (submitted || touched[field])
    );
  }

  function addTag(rawTag) {
    const normalizedTag = rawTag
      .trim()
      .replace(/^#/, "");

    if (!normalizedTag) {
      return;
    }

    if (form.tags.length >= 8) {
      setToast({
        type: "error",
        title: "Limite de habilidades",
        description:
          "Você pode adicionar até 8 habilidades.",
      });

      return;
    }

    const alreadyExists = form.tags.some(
      (tag) =>
        tag.toLowerCase() ===
        normalizedTag.toLowerCase()
    );

    if (alreadyExists) {
      setTagInput("");
      return;
    }

    updateField("tags", [
      ...form.tags,
      normalizedTag,
    ]);

    setTagInput("");
  }

  function handleTagKeyDown(event) {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addTag(tagInput);
    }

    if (
      event.key === "Backspace" &&
      !tagInput &&
      form.tags.length > 0
    ) {
      updateField(
        "tags",
        form.tags.slice(0, -1)
      );
    }
  }

  function removeTag(tagToRemove) {
    updateField(
      "tags",
      form.tags.filter(
        (tag) => tag !== tagToRemove
      )
    );
  }

  function toggleBenefit(benefitId) {
    const benefitIsSelected =
      form.benefits.includes(benefitId);

    updateField(
      "benefits",
      benefitIsSelected
        ? form.benefits.filter(
            (id) => id !== benefitId
          )
        : [...form.benefits, benefitId]
    );
  }

  function applyTextTemplate(field) {
    const template = textTemplates[field];

    updateField(
      field,
      form[field].trim()
        ? `${form[field].trim()}\n\n${template}`
        : template
    );

    setToast({
      type: "info",
      title: "Modelo adicionado",
      description:
        "Você pode editar o conteúdo livremente.",
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    openPublishModal();
  }

  function confirmReset() {
    setForm(emptyForm);
    setTagInput("");
    setTouched({});
    setSubmitted(false);
    setApiErrors({});
    setModalMode(null);
    setLastSaved(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        DRAFT_STORAGE_KEY
      );
    }

    setToast({
      type: "info",
      title: "Formulário limpo",
      description:
        "Uma nova vaga pode ser criada do zero.",
    });

    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 80);
  }

  async function confirmPublish() {
    if (isPublishing) {
      return;
    }

    setIsPublishing(true);
    setApiErrors({});

    try {
      const payload = {
        ...createJobPayload(form),
        status: isEditing ? editJob.status || "publicada" : "publicada",
      };
      const response = isEditing
        ? await api.patch(
            `/admin/vagas/${encodeURIComponent(editJob.id)}`,
            payload
          )
        : await api.post("/admin/vagas", payload);
      const newJob = unwrapApiData(response);

      window.localStorage.removeItem(
        DRAFT_STORAGE_KEY
      );

      setModalMode(null);
      navigate("/admin/ver-vagas", {
        state: {
          createdJob: newJob,
          showCreatedMessage: !isEditing,
          showUpdatedMessage: isEditing,
        },
      });
    } catch (error) {
      const validationErrors = mapJobApiErrors(error);
      setApiErrors(validationErrors);
      setModalMode(null);
      setSubmitted(true);

      setToast({
        type: "error",
        title: isEditing ? "Erro ao atualizar" : "Erro ao publicar",
        description:
          Object.keys(validationErrors).length > 0
            ? "Revise os campos destacados e tente novamente."
            : getApiErrorMessage(
                error,
                isEditing
                  ? "Não foi possível atualizar a vaga."
                  : "Não foi possível publicar a vaga."
              ),
      });

      const firstApiField = Object.keys(validationErrors)[0];
      if (firstApiField) {
        window.setTimeout(() => {
          const fieldElement = document.querySelector(
            `[data-field="${firstApiField}"]`
          );
          fieldElement?.focus();
          fieldElement?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 80);
      }
    } finally {
      setIsPublishing(false);
    }
  }

  async function copyJobPreview() {
    const benefitsText =
      selectedBenefits.length > 0
        ? selectedBenefits
            .map(
              (benefit) =>
                `• ${benefit.label}`
            )
            .join("\n")
        : "Não informado";

    const tagsText =
      form.tags.length > 0
        ? form.tags.join(", ")
        : "Não informado";

    const formattedJob = `${form.title || "Título da vaga"}
${form.company || "Nome da empresa"}

Local: ${form.location || "Não informado"}
Modelo: ${form.workMode || "Não informado"}
Contratação: ${
      form.employmentType || "Não informado"
    }
Nível: ${form.seniority || "Não informado"}
Salário: ${salaryText}

DESCRIÇÃO
${
  form.description ||
  "Descrição ainda não informada."
}

RESPONSABILIDADES
${
  form.responsibilities ||
  "Responsabilidades ainda não informadas."
}

REQUISITOS
${
  form.requirements ||
  "Requisitos ainda não informados."
}

HABILIDADES
${tagsText}

BENEFÍCIOS
${benefitsText}

Candidaturas: ${
      form.applicationEmail ||
      "E-mail não informado"
    }`;

    try {
      await navigator.clipboard.writeText(
        formattedJob
      );

      setToast({
        type: "success",
        title: "Vaga copiada",
        description:
          "O conteúdo formatado foi enviado para sua área de transferência.",
      });
    } catch {
      setToast({
        type: "error",
        title: "Não foi possível copiar",
        description:
          "Seu navegador bloqueou o acesso à área de transferência.",
      });
    }
  }

  function renderPreviewContent() {
    return (
      <>
        <div className="create-preview__cover">
          <div className="create-preview__cover-pattern" />

          <div className="create-preview__company-logo">
            {form.company
              ? form.company
                  .slice(0, 2)
                  .toUpperCase()
              : "EMP"}
          </div>

          <span className="create-preview__live-badge">
            <span className="create-preview__live-dot" />
            Preview ao vivo
          </span>
        </div>

        <div className="create-preview__body">
          <div className="create-preview__top">
            <div>
              <span className="create-preview__company">
                {form.company ||
                  "Nome da empresa"}
              </span>

              <h2 className="create-preview__title">
                {form.title ||
                  "Título da oportunidade"}
              </h2>
            </div>

            <button
              type="button"
              className="create-preview__copy"
              onClick={copyJobPreview}
              aria-label="Copiar vaga formatada"
              title="Copiar vaga"
            >
              <Icon name="copy" size={17} />
            </button>
          </div>

          <div className="create-preview__metadata">
            <span className="create-preview__meta">
              <Icon
                name="mapPin"
                size={14}
              />
              {form.location ||
                "Local não informado"}
            </span>

            <span className="create-preview__meta">
              <Icon
                name="monitor"
                size={14}
              />
              {form.workMode ||
                "Modelo de trabalho"}
            </span>

            <span className="create-preview__meta">
              <Icon
                name="briefcase"
                size={14}
              />
              {form.employmentType ||
                "Contratação"}
            </span>

            {form.seniority !==
              "Não informado" && (
              <span className="create-preview__meta">
                <Icon
                  name="chart"
                  size={14}
                />
                {form.seniority}
              </span>
            )}
          </div>

          <div className="create-preview__salary">
            <span className="create-preview__salary-icon">
              <Icon
                name="money"
                size={18}
              />
            </span>

            <div>
              <span className="create-preview__salary-label">
                Faixa salarial
              </span>

              <strong className="create-preview__salary-value">
                {salaryText}
              </strong>
            </div>
          </div>

          <div className="create-preview__section">
            <span className="create-preview__section-label">
              Sobre a oportunidade
            </span>

            <p className="create-preview__description">
              {form.description ||
                "A descrição da vaga aparecerá aqui conforme você preencher o formulário."}
            </p>
          </div>

          {form.tags.length > 0 && (
            <div className="create-preview__section">
              <span className="create-preview__section-label">
                Habilidades
              </span>

              <div className="create-preview__tags">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="create-preview__tag"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedBenefits.length > 0 && (
            <div className="create-preview__section">
              <span className="create-preview__section-label">
                Benefícios
              </span>

              <div className="create-preview__benefits">
                {selectedBenefits
                  .slice(0, 5)
                  .map((benefit) => (
                    <span
                      key={benefit.id}
                      className="create-preview__benefit"
                    >
                      <span>
                        {benefit.emoji}
                      </span>

                      {benefit.label}
                    </span>
                  ))}

                {selectedBenefits.length >
                  5 && (
                  <span className="create-preview__benefit create-preview__benefit--more">
                    +
                    {selectedBenefits.length -
                      5}{" "}
                    benefícios
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="create-preview__footer">
            <div className="create-preview__deadline">
              <Icon
                name="calendar"
                size={15}
              />

              {form.applicationDeadline
                ? `Até ${formatDate(
                    form.applicationDeadline
                  )}`
                : "Sem prazo definido"}
            </div>

            <div className="create-preview__openings">
              {form.openings || "1"}{" "}
              {Number(form.openings) === 1
                ? "vaga"
                : "vagas"}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>
        {`
          :root {
            color-scheme: dark;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body,
          #root {
            min-width: 320px;
            min-height: 100%;
            margin: 0;
          }

          body {
            background: #050609;
          }

          button,
          input,
          textarea,
          select {
            font: inherit;
          }

          button {
            border: 0;
          }

          .create-app {
            --background: #050609;
            --surface: rgba(17, 19, 28, 0.76);
            --surface-strong: rgba(20, 22, 32, 0.94);
            --surface-soft: rgba(255, 255, 255, 0.035);
            --border: rgba(255, 255, 255, 0.085);
            --border-hover: rgba(255, 255, 255, 0.17);
            --text-primary: #f7f7fa;
            --text-secondary: #a0a2ad;
            --text-muted: #70727e;
            --blue: #527dff;
            --blue-light: #88a7ff;
            --purple: #8c5cff;
            --pink: #ff4d8d;
            --pink-light: #ff91b9;
            --green: #4ade80;
            --red: #fb7185;
            --orange: #fbbf24;
            --shadow:
              0 30px 90px rgba(0, 0, 0, 0.38),
              0 10px 35px rgba(0, 0, 0, 0.2);

            position: relative;
            min-height: 100vh;
            overflow: hidden;
            color: var(--text-primary);
            background:
              radial-gradient(
                circle at 10% 5%,
                rgba(255, 77, 141, 0.1),
                transparent 29%
              ),
              radial-gradient(
                circle at 88% 8%,
                rgba(82, 125, 255, 0.12),
                transparent 28%
              ),
              radial-gradient(
                circle at 70% 95%,
                rgba(140, 92, 255, 0.08),
                transparent 30%
              ),
              var(--background);
            font-family:
              Inter,
              ui-sans-serif,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
            isolation: isolate;
          }

          .create-app::before {
            position: fixed;
            z-index: -4;
            inset: 0;
            content: "";
            pointer-events: none;
            opacity: 0.4;
            background-image:
              linear-gradient(
                rgba(255, 255, 255, 0.016) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.016) 1px,
                transparent 1px
              );
            background-size: 42px 42px;
            mask-image: linear-gradient(
              to bottom,
              #000,
              transparent 88%
            );
          }

          .create-app::after {
            position: fixed;
            z-index: -3;
            inset: 0;
            content: "";
            pointer-events: none;
            opacity: 0.06;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.52'/%3E%3C/svg%3E");
          }

          .create-background-orb {
            position: fixed;
            z-index: -2;
            width: 430px;
            height: 430px;
            border-radius: 50%;
            pointer-events: none;
            filter: blur(100px);
            opacity: 0.12;
            animation: createOrbFloat 15s ease-in-out infinite;
          }

          .create-background-orb--pink {
            top: -220px;
            left: 18%;
            background: var(--pink);
          }

          .create-background-orb--blue {
            right: -210px;
            bottom: -180px;
            background: var(--blue);
            animation-delay: -7s;
          }

          .create-floating-shape {
            position: fixed;
            z-index: -1;
            pointer-events: none;
            border: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(255, 255, 255, 0.012);
            animation: createShapeFloat 12s ease-in-out infinite;
          }

          .create-floating-shape--one {
            top: 14%;
            right: 7%;
            width: 70px;
            height: 70px;
            border-radius: 23px;
            transform: rotate(18deg);
          }

          .create-floating-shape--two {
            bottom: 13%;
            left: 8%;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            animation-delay: -5s;
          }

          .create-shell {
            display: grid;
            grid-template-columns: 268px minmax(0, 1fr);
            min-height: 100vh;
          }

          .create-sidebar {
            position: relative;
            z-index: 20;
            display: flex;
            min-height: 100vh;
            flex-direction: column;
            padding: 24px 18px;
            border-right: 1px solid var(--border);
            background: rgba(7, 8, 13, 0.72);
            box-shadow: 20px 0 70px rgba(0, 0, 0, 0.18);
            backdrop-filter: blur(24px);
          }

          .create-brand {
            display: flex;
            min-height: 58px;
            align-items: center;
            gap: 12px;
            padding: 8px 10px;
          }

          .create-brand__symbol {
            position: relative;
            display: grid;
            flex: 0 0 auto;
            width: 42px;
            height: 42px;
            place-items: center;
            overflow: hidden;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 14px;
            background:
              linear-gradient(
                145deg,
                var(--pink),
                var(--blue)
              );
            box-shadow:
              0 13px 30px rgba(255, 77, 141, 0.18),
              inset 0 1px rgba(255, 255, 255, 0.28);
          }

          .create-brand__symbol::before {
            position: absolute;
            width: 31px;
            height: 31px;
            content: "";
            border: 1px solid rgba(255, 255, 255, 0.17);
            border-radius: 10px;
            transform: rotate(45deg);
          }

          .create-brand__symbol svg {
            position: relative;
            z-index: 1;
          }

          .create-brand__name {
            margin: 0;
            color: #f6f6f9;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .create-brand__caption {
            display: block;
            margin-top: 3px;
            color: var(--text-muted);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.11em;
            text-transform: uppercase;
          }

          .create-sidebar__section {
            margin-top: 34px;
          }

          .create-sidebar__label {
            display: block;
            margin: 0 12px 10px;
            color: #5e606c;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .create-nav {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .create-nav__item {
            position: relative;
            display: flex;
            width: 100%;
            min-height: 48px;
            align-items: center;
            gap: 12px;
            padding: 0 13px;
            color: var(--text-secondary);
            border: 1px solid transparent;
            border-radius: 14px;
            background: transparent;
            cursor: pointer;
            text-align: left;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
          }

          .create-nav__item:hover {
            color: #fff;
            border-color: rgba(255, 255, 255, 0.07);
            background: rgba(255, 255, 255, 0.035);
            transform: translateX(2px);
          }

          .create-nav__item--active {
            color: #fff;
            border-color: rgba(255, 255, 255, 0.1);
            background:
              linear-gradient(
                90deg,
                rgba(255, 77, 141, 0.13),
                rgba(82, 125, 255, 0.07)
              );
            box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
          }

          .create-nav__item--active::before {
            position: absolute;
            top: 11px;
            bottom: 11px;
            left: 0;
            width: 3px;
            content: "";
            border-radius: 0 10px 10px 0;
            background:
              linear-gradient(
                to bottom,
                var(--pink-light),
                var(--blue)
              );
            box-shadow: 0 0 16px rgba(255, 77, 141, 0.55);
          }

          .create-nav__icon {
            display: grid;
            flex: 0 0 auto;
            width: 28px;
            height: 28px;
            place-items: center;
          }

          .create-nav__text {
            flex: 1;
            font-size: 13px;
            font-weight: 650;
          }

          .create-sidebar__tip {
            position: relative;
            margin-top: auto;
            padding: 17px;
            overflow: hidden;
            border: 1px solid rgba(140, 92, 255, 0.16);
            border-radius: 18px;
            background:
              linear-gradient(
                145deg,
                rgba(140, 92, 255, 0.09),
                rgba(82, 125, 255, 0.035)
              );
          }

          .create-sidebar__tip::before {
            position: absolute;
            top: -30px;
            right: -30px;
            width: 90px;
            height: 90px;
            content: "";
            border-radius: 50%;
            background: var(--purple);
            opacity: 0.09;
            filter: blur(15px);
          }

          .create-sidebar__tip-icon {
            display: grid;
            width: 34px;
            height: 34px;
            place-items: center;
            color: #d6c8ff;
            border: 1px solid rgba(140, 92, 255, 0.19);
            border-radius: 11px;
            background: rgba(140, 92, 255, 0.1);
          }

          .create-sidebar__tip-title {
            display: block;
            margin-top: 14px;
            color: #e9e2ff;
            font-size: 11px;
            font-weight: 800;
          }

          .create-sidebar__tip-text {
            display: block;
            margin-top: 7px;
            color: #85818f;
            font-size: 9px;
            line-height: 1.6;
          }

          .create-sidebar__shortcut {
            display: inline-flex;
            min-height: 25px;
            align-items: center;
            gap: 5px;
            margin-top: 12px;
            padding: 0 8px;
            color: #aaa2ba;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 7px;
            background: rgba(0, 0, 0, 0.15);
            font-size: 8px;
            font-weight: 800;
          }

          .create-main {
            min-width: 0;
            padding: 25px clamp(22px, 3.8vw, 52px) 55px;
          }

          .create-topbar {
            display: flex;
            min-height: 48px;
            align-items: center;
            justify-content: space-between;
            gap: 22px;
            margin-bottom: 29px;
          }

          .create-back-button {
            display: inline-flex;
            min-height: 42px;
            align-items: center;
            gap: 9px;
            padding: 0 13px;
            color: var(--text-secondary);
            border: 1px solid var(--border);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.035);
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.03),
              0 10px 30px rgba(0, 0, 0, 0.14);
            cursor: pointer;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
            backdrop-filter: blur(12px);
          }

          .create-back-button:hover {
            color: #fff;
            border-color: var(--border-hover);
            background: rgba(255, 255, 255, 0.06);
            transform: translateX(-3px);
          }

          .create-back-button__text {
            font-size: 11px;
            font-weight: 750;
          }

          .create-topbar__actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .create-save-status {
            display: inline-flex;
            min-height: 38px;
            align-items: center;
            gap: 8px;
            padding: 0 11px;
            color: #7f8290;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 11px;
            background: rgba(255, 255, 255, 0.025);
            font-size: 9px;
            font-weight: 700;
          }

          .create-save-status__dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--green);
            box-shadow: 0 0 11px rgba(74, 222, 128, 0.7);
          }

          .create-topbar-button {
            display: inline-flex;
            min-height: 42px;
            align-items: center;
            gap: 8px;
            padding: 0 13px;
            color: #c7c8d0;
            border: 1px solid var(--border);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.035);
            cursor: pointer;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
          }

          .create-topbar-button:hover {
            color: #fff;
            border-color: var(--border-hover);
            background: rgba(255, 255, 255, 0.06);
            transform: translateY(-2px);
          }

          .create-topbar-button__text {
            font-size: 10px;
            font-weight: 750;
          }

          .create-hero {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 30px;
            margin-bottom: 26px;
            padding: clamp(24px, 3.5vw, 37px);
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 27px;
            background:
              radial-gradient(
                circle at 83% 10%,
                rgba(82, 125, 255, 0.15),
                transparent 29%
              ),
              radial-gradient(
                circle at 3% 100%,
                rgba(255, 77, 141, 0.1),
                transparent 32%
              ),
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.052),
                rgba(255, 255, 255, 0.017)
              );
            box-shadow: var(--shadow);
            animation: createReveal 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
            backdrop-filter: blur(24px);
          }

          .create-hero::before {
            position: absolute;
            top: -100px;
            right: -50px;
            width: 280px;
            height: 280px;
            content: "";
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 50%;
            box-shadow:
              0 0 0 30px rgba(255, 255, 255, 0.012),
              0 0 0 66px rgba(255, 255, 255, 0.009);
          }

          .create-hero__content {
            position: relative;
            z-index: 1;
          }

          .create-hero__eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
            color: #c6c7d0;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: 0.17em;
            text-transform: uppercase;
          }

          .create-hero__eyebrow-icon {
            display: grid;
            width: 27px;
            height: 27px;
            place-items: center;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 9px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 77, 141, 0.15),
                rgba(82, 125, 255, 0.13)
              );
          }

          .create-hero__title {
            max-width: 760px;
            margin: 0;
            color: #fff;
            font-size: clamp(32px, 4.5vw, 53px);
            font-weight: 850;
            letter-spacing: -0.052em;
            line-height: 1.02;
          }

          .create-hero__gradient {
            color: transparent;
            background:
              linear-gradient(
                100deg,
                #ff91b9,
                #9bb3ff 48%,
                #d9caff 85%,
                #ff91b9
              );
            background-size: 220% auto;
            background-clip: text;
            -webkit-background-clip: text;
            animation: createGradientMove 8s linear infinite;
          }

          .create-hero__description {
            max-width: 690px;
            margin: 15px 0 0;
            color: var(--text-secondary);
            font-size: 12px;
            line-height: 1.7;
          }

          .create-progress {
            position: relative;
            z-index: 1;
            display: grid;
            width: 124px;
            height: 124px;
            flex: 0 0 auto;
            place-items: center;
          }

          .create-progress__ring {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background:
              conic-gradient(
                var(--blue) 0 var(--progress),
                rgba(255, 255, 255, 0.055) var(--progress) 100%
              );
            box-shadow:
              0 0 40px rgba(82, 125, 255, 0.09),
              inset 0 0 20px rgba(82, 125, 255, 0.05);
          }

          .create-progress__ring::after {
            position: absolute;
            inset: 8px;
            content: "";
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 50%;
            background: #0c0d14;
          }

          .create-progress__content {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            flex-direction: column;
          }

          .create-progress__value {
            color: #fff;
            font-size: 28px;
            font-weight: 850;
            letter-spacing: -0.05em;
          }

          .create-progress__label {
            margin-top: 3px;
            color: var(--text-muted);
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .create-layout {
            display: grid;
            grid-template-columns:
              minmax(0, 1.4fr)
              minmax(330px, 0.72fr);
            align-items: start;
            gap: 20px;
          }

          .create-form {
            display: flex;
            min-width: 0;
            flex-direction: column;
            gap: 18px;
          }

          .create-form-card {
            position: relative;
            padding: clamp(21px, 3vw, 29px);
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 24px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.047),
                rgba(255, 255, 255, 0.015)
              );
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.035),
              0 22px 65px rgba(0, 0, 0, 0.2);
            animation: createReveal 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
            backdrop-filter: blur(22px);
          }

          .create-form-card:nth-child(2) {
            animation-delay: 80ms;
          }

          .create-form-card:nth-child(3) {
            animation-delay: 140ms;
          }

          .create-form-card:nth-child(4) {
            animation-delay: 200ms;
          }

          .create-form-card__header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 25px;
          }

          .create-form-card__title-wrapper {
            display: flex;
            align-items: flex-start;
            gap: 13px;
          }

          .create-form-card__icon {
            display: grid;
            flex: 0 0 auto;
            width: 41px;
            height: 41px;
            place-items: center;
            color: #dce4ff;
            border: 1px solid rgba(82, 125, 255, 0.18);
            border-radius: 13px;
            background:
              linear-gradient(
                145deg,
                rgba(82, 125, 255, 0.14),
                rgba(140, 92, 255, 0.06)
              );
          }

          .create-form-card__title {
            margin: 2px 0 0;
            color: #f3f3f6;
            font-size: 16px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .create-form-card__description {
            margin: 6px 0 0;
            color: var(--text-muted);
            font-size: 10px;
            line-height: 1.55;
          }

          .create-form-card__step {
            display: inline-flex;
            min-height: 27px;
            align-items: center;
            padding: 0 9px;
            color: #858795;
            border: 1px solid rgba(255, 255, 255, 0.065);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.025);
            font-size: 8px;
            font-weight: 850;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .create-fields-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .create-field {
            min-width: 0;
          }

          .create-field--full {
            grid-column: 1 / -1;
          }

          .create-field__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 8px;
          }

          .create-field__label {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #c9cad2;
            font-size: 10px;
            font-weight: 750;
          }

          .create-field__required {
            color: var(--pink-light);
          }

          .create-field__optional {
            color: #5e606d;
            font-size: 8px;
            font-weight: 700;
          }

          .create-field__counter {
            color: #5f616d;
            font-size: 8px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
          }

          .create-field__control {
            position: relative;
          }

          .create-field__icon {
            position: absolute;
            z-index: 2;
            top: 50%;
            left: 14px;
            display: grid;
            color: #676a77;
            pointer-events: none;
            transform: translateY(-50%);
            transition: color 180ms ease;
          }

          .create-input,
          .create-select,
          .create-textarea {
            width: 100%;
            color: #f3f3f6;
            border: 1px solid rgba(255, 255, 255, 0.075);
            outline: none;
            background: rgba(5, 6, 10, 0.34);
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.022),
              0 9px 25px rgba(0, 0, 0, 0.08);
            transition:
              border-color 180ms ease,
              background 180ms ease,
              box-shadow 180ms ease,
              transform 180ms ease;
          }

          .create-input,
          .create-select {
            min-height: 50px;
            padding: 0 14px 0 43px;
            border-radius: 14px;
            font-size: 11px;
          }

          .create-input--no-icon,
          .create-select--no-icon {
            padding-left: 14px;
          }

          .create-textarea {
            min-height: 145px;
            padding: 15px 16px;
            border-radius: 16px;
            font-size: 11px;
            line-height: 1.7;
            resize: vertical;
          }

          .create-textarea--large {
            min-height: 190px;
          }

          .create-input::placeholder,
          .create-textarea::placeholder {
            color: #545662;
          }

          .create-select {
            cursor: pointer;
            appearance: none;
            background-image:
              linear-gradient(
                45deg,
                transparent 50%,
                #676a77 50%
              ),
              linear-gradient(
                135deg,
                #676a77 50%,
                transparent 50%
              );
            background-position:
              calc(100% - 18px) 22px,
              calc(100% - 13px) 22px;
            background-repeat: no-repeat;
            background-size: 5px 5px, 5px 5px;
          }

          .create-select option {
            color: #fff;
            background: #151720;
          }

          .create-input:hover,
          .create-select:hover,
          .create-textarea:hover {
            border-color: rgba(255, 255, 255, 0.13);
            background-color: rgba(255, 255, 255, 0.035);
          }

          .create-input:focus,
          .create-select:focus,
          .create-textarea:focus {
            border-color: rgba(82, 125, 255, 0.62);
            background-color: rgba(82, 125, 255, 0.035);
            box-shadow:
              0 0 0 4px rgba(82, 125, 255, 0.075),
              inset 0 1px rgba(255, 255, 255, 0.035);
          }

          .create-field__control:focus-within
            .create-field__icon {
            color: var(--blue-light);
          }

          .create-input--error,
          .create-select--error,
          .create-textarea--error {
            border-color: rgba(251, 113, 133, 0.55);
            background-color: rgba(251, 113, 133, 0.035);
          }

          .create-input--error:focus,
          .create-select--error:focus,
          .create-textarea--error:focus {
            border-color: rgba(251, 113, 133, 0.72);
            box-shadow: 0 0 0 4px rgba(251, 113, 133, 0.07);
          }

          .create-field__message {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 7px 2px 0;
            color: var(--red);
            font-size: 8px;
            font-weight: 650;
            animation: createErrorReveal 180ms ease both;
          }

          .create-field__hint {
            margin: 7px 2px 0;
            color: #5f616d;
            font-size: 8px;
            line-height: 1.5;
          }

          .create-money-grid {
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              minmax(0, 1fr);
            gap: 12px;
          }

          .create-salary-visibility {
            display: flex;
            min-height: 50px;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 0 14px;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 14px;
            background: rgba(5, 6, 10, 0.3);
          }

          .create-salary-visibility__content {
            display: flex;
            min-width: 0;
            align-items: center;
            gap: 9px;
          }

          .create-salary-visibility__icon {
            display: grid;
            color: #737682;
          }

          .create-salary-visibility__label {
            color: #b8bac3;
            font-size: 9px;
            font-weight: 700;
          }

          .create-switch {
            position: relative;
            display: inline-flex;
            flex: 0 0 auto;
            width: 41px;
            height: 23px;
            padding: 2px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition:
              background 180ms ease,
              box-shadow 180ms ease;
          }

          .create-switch--active {
            background:
              linear-gradient(
                135deg,
                var(--blue),
                var(--purple)
              );
            box-shadow: 0 0 18px rgba(82, 125, 255, 0.22);
          }

          .create-switch__thumb {
            width: 19px;
            height: 19px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.24);
            transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .create-switch--active
            .create-switch__thumb {
            transform: translateX(18px);
          }

          .create-template-button {
            display: inline-flex;
            min-height: 28px;
            align-items: center;
            gap: 6px;
            padding: 0 9px;
            color: #b9a9ed;
            border: 1px solid rgba(140, 92, 255, 0.14);
            border-radius: 9px;
            background: rgba(140, 92, 255, 0.055);
            cursor: pointer;
            font-size: 8px;
            font-weight: 750;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
          }

          .create-template-button:hover {
            color: #e0d6ff;
            border-color: rgba(140, 92, 255, 0.26);
            background: rgba(140, 92, 255, 0.11);
            transform: translateY(-1px);
          }

          .create-textarea-wrapper {
            position: relative;
          }

          .create-textarea-decoration {
            position: absolute;
            right: 12px;
            bottom: 12px;
            display: inline-flex;
            min-height: 24px;
            align-items: center;
            padding: 0 7px;
            color: #5b5d68;
            border: 1px solid rgba(255, 255, 255, 0.055);
            border-radius: 7px;
            background: rgba(7, 8, 12, 0.75);
            font-size: 7px;
            font-weight: 700;
            pointer-events: none;
            backdrop-filter: blur(8px);
          }

          .create-tags-box {
            min-height: 55px;
            padding: 9px;
            border: 1px solid rgba(255, 255, 255, 0.075);
            border-radius: 15px;
            background: rgba(5, 6, 10, 0.34);
            transition:
              border-color 180ms ease,
              box-shadow 180ms ease,
              background 180ms ease;
          }

          .create-tags-box:focus-within {
            border-color: rgba(82, 125, 255, 0.62);
            background: rgba(82, 125, 255, 0.035);
            box-shadow: 0 0 0 4px rgba(82, 125, 255, 0.075);
          }

          .create-tags-list {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 7px;
          }

          .create-tag {
            display: inline-flex;
            min-height: 31px;
            align-items: center;
            gap: 7px;
            padding: 0 8px 0 10px;
            color: #d8e1ff;
            border: 1px solid rgba(82, 125, 255, 0.16);
            border-radius: 9px;
            background:
              linear-gradient(
                135deg,
                rgba(82, 125, 255, 0.1),
                rgba(140, 92, 255, 0.06)
              );
            font-size: 9px;
            font-weight: 700;
            animation: createTagReveal 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .create-tag__remove {
            display: grid;
            width: 19px;
            height: 19px;
            place-items: center;
            color: #7e88a7;
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            transition:
              color 160ms ease,
              background 160ms ease;
          }

          .create-tag__remove:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.08);
          }

          .create-tags-input {
            min-width: 150px;
            flex: 1;
            height: 31px;
            padding: 0 6px;
            color: #fff;
            border: 0;
            outline: 0;
            background: transparent;
            font-size: 10px;
          }

          .create-tags-input::placeholder {
            color: #545662;
          }

          .create-benefits-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .create-benefit {
            position: relative;
            display: flex;
            min-height: 68px;
            align-items: center;
            gap: 10px;
            padding: 11px;
            overflow: hidden;
            color: #9294a0;
            border: 1px solid rgba(255, 255, 255, 0.065);
            border-radius: 14px;
            background: rgba(5, 6, 10, 0.28);
            cursor: pointer;
            text-align: left;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease,
              box-shadow 180ms ease;
          }

          .create-benefit:hover {
            color: #d7d8de;
            border-color: rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.035);
            transform: translateY(-2px);
          }

          .create-benefit--active {
            color: #eef2ff;
            border-color: rgba(82, 125, 255, 0.3);
            background:
              linear-gradient(
                145deg,
                rgba(82, 125, 255, 0.12),
                rgba(140, 92, 255, 0.055)
              );
            box-shadow: 0 13px 30px rgba(82, 125, 255, 0.08);
          }

          .create-benefit__emoji {
            display: grid;
            flex: 0 0 auto;
            width: 34px;
            height: 34px;
            place-items: center;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.035);
            font-size: 15px;
          }

          .create-benefit__label {
            font-size: 9px;
            font-weight: 700;
            line-height: 1.35;
          }

          .create-benefit__check {
            position: absolute;
            top: 7px;
            right: 7px;
            display: grid;
            width: 18px;
            height: 18px;
            place-items: center;
            color: transparent;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.14);
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease;
          }

          .create-benefit--active
            .create-benefit__check {
            color: #fff;
            border-color: transparent;
            background:
              linear-gradient(
                135deg,
                var(--blue),
                var(--purple)
              );
          }

          .create-form-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 19px;
            border: 1px solid var(--border);
            border-radius: 21px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.045),
                rgba(255, 255, 255, 0.015)
              );
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.03),
              0 20px 50px rgba(0, 0, 0, 0.17);
            animation: createReveal 650ms 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
            backdrop-filter: blur(20px);
          }

          .create-form-actions__secondary {
            display: flex;
            align-items: center;
            gap: 9px;
          }

          .create-secondary-button {
            display: inline-flex;
            min-height: 43px;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 13px;
            color: #9c9eaa;
            border: 1px solid rgba(255, 255, 255, 0.075);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.027);
            cursor: pointer;
            font-size: 9px;
            font-weight: 750;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
          }

          .create-secondary-button:hover {
            color: #fff;
            border-color: rgba(255, 255, 255, 0.14);
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
          }

          .create-secondary-button--danger:hover {
            color: #ffb3c0;
            border-color: rgba(251, 113, 133, 0.2);
            background: rgba(251, 113, 133, 0.055);
          }

          .create-submit-button {
            position: relative;
            display: inline-flex;
            min-width: 190px;
            min-height: 48px;
            align-items: center;
            justify-content: center;
            gap: 10px;
            overflow: hidden;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 15px;
            background:
              linear-gradient(
                135deg,
                var(--blue),
                var(--purple) 60%,
                var(--pink)
              );
            background-size: 180% auto;
            box-shadow:
              0 16px 40px rgba(82, 125, 255, 0.24),
              inset 0 1px rgba(255, 255, 255, 0.22);
            cursor: pointer;
            font-size: 11px;
            font-weight: 800;
            transition:
              box-shadow 220ms ease,
              transform 220ms ease,
              background-position 300ms ease;
          }

          .create-submit-button::before {
            position: absolute;
            top: -150%;
            left: -35%;
            width: 28%;
            height: 400%;
            content: "";
            background: rgba(255, 255, 255, 0.28);
            transform: rotate(22deg);
            transition: left 550ms ease;
          }

          .create-submit-button:hover {
            background-position: 100% center;
            box-shadow:
              0 22px 55px rgba(82, 125, 255, 0.32),
              0 0 35px rgba(140, 92, 255, 0.13),
              inset 0 1px rgba(255, 255, 255, 0.25);
            transform: translateY(-3px) scale(1.01);
          }

          .create-submit-button:hover::before {
            left: 115%;
          }

          .create-submit-button:active {
            transform: translateY(0) scale(0.98);
          }

          .create-preview-column {
            position: sticky;
            top: 22px;
            display: flex;
            min-width: 0;
            flex-direction: column;
            gap: 14px;
            animation: createPreviewReveal 720ms 120ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .create-quality-card {
            padding: 18px;
            border: 1px solid var(--border);
            border-radius: 20px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.045),
                rgba(255, 255, 255, 0.015)
              );
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.03),
              0 20px 50px rgba(0, 0, 0, 0.17);
            backdrop-filter: blur(18px);
          }

          .create-quality-card__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .create-quality-card__title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #d4d5dc;
            font-size: 10px;
            font-weight: 750;
          }

          .create-quality-card__score {
            color: #fff;
            font-size: 18px;
            font-weight: 850;
            letter-spacing: -0.04em;
          }

          .create-quality-card__score small {
            color: #656773;
            font-size: 8px;
            font-weight: 700;
          }

          .create-quality-card__track {
            height: 7px;
            margin-top: 14px;
            overflow: hidden;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.055);
          }

          .create-quality-card__fill {
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(
                90deg,
                var(--blue),
                var(--purple),
                var(--pink)
              );
            box-shadow: 0 0 14px rgba(82, 125, 255, 0.35);
            transition: width 450ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .create-quality-card__text {
            margin: 10px 0 0;
            color: #6c6e79;
            font-size: 8px;
            line-height: 1.55;
          }

          .create-preview {
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 24px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.05),
                rgba(255, 255, 255, 0.016)
              );
            box-shadow:
              0 30px 85px rgba(0, 0, 0, 0.31),
              inset 0 1px rgba(255, 255, 255, 0.035);
            backdrop-filter: blur(22px);
          }

          .create-preview__cover {
            position: relative;
            height: 116px;
            overflow: hidden;
            background:
              radial-gradient(
                circle at 15% 30%,
                rgba(255, 255, 255, 0.14),
                transparent 28%
              ),
              linear-gradient(
                135deg,
                #3458d4,
                #7550d7 55%,
                #bc427b
              );
          }

          .create-preview__cover::after {
            position: absolute;
            right: -60px;
            bottom: -75px;
            width: 210px;
            height: 210px;
            content: "";
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 50%;
            box-shadow:
              0 0 0 25px rgba(255, 255, 255, 0.045),
              0 0 0 50px rgba(255, 255, 255, 0.025);
          }

          .create-preview__cover-pattern {
            position: absolute;
            inset: 0;
            opacity: 0.2;
            background-image:
              linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.12) 1px,
                transparent 1px
              ),
              linear-gradient(
                -45deg,
                rgba(255, 255, 255, 0.08) 1px,
                transparent 1px
              );
            background-size: 20px 20px;
          }

          .create-preview__company-logo {
            position: absolute;
            z-index: 2;
            bottom: -28px;
            left: 22px;
            display: grid;
            width: 64px;
            height: 64px;
            place-items: center;
            color: #fff;
            border: 5px solid #11131b;
            border-radius: 18px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.24),
                rgba(255, 255, 255, 0.09)
              );
            box-shadow:
              0 14px 35px rgba(0, 0, 0, 0.32),
              inset 0 1px rgba(255, 255, 255, 0.2);
            font-size: 14px;
            font-weight: 900;
            letter-spacing: -0.02em;
            backdrop-filter: blur(12px);
          }

          .create-preview__live-badge {
            position: absolute;
            z-index: 2;
            top: 15px;
            right: 15px;
            display: inline-flex;
            min-height: 28px;
            align-items: center;
            gap: 7px;
            padding: 0 10px;
            color: rgba(255, 255, 255, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 999px;
            background: rgba(6, 7, 13, 0.24);
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            backdrop-filter: blur(12px);
          }

          .create-preview__live-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #7cffaa;
            box-shadow: 0 0 12px rgba(124, 255, 170, 0.9);
            animation: createStatusPulse 1.8s ease-in-out infinite;
          }

          .create-preview__body {
            padding: 42px 22px 23px;
          }

          .create-preview__top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
          }

          .create-preview__company {
            display: block;
            color: #7d8090;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.11em;
            text-transform: uppercase;
          }

          .create-preview__title {
            margin: 7px 0 0;
            color: #f7f7fa;
            font-size: clamp(19px, 2.2vw, 24px);
            font-weight: 820;
            letter-spacing: -0.035em;
            line-height: 1.15;
            overflow-wrap: anywhere;
          }

          .create-preview__copy {
            display: grid;
            flex: 0 0 auto;
            width: 37px;
            height: 37px;
            place-items: center;
            color: #777a87;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 11px;
            background: rgba(255, 255, 255, 0.028);
            cursor: pointer;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
          }

          .create-preview__copy:hover {
            color: #fff;
            border-color: rgba(255, 255, 255, 0.14);
            background: rgba(255, 255, 255, 0.055);
            transform: translateY(-2px);
          }

          .create-preview__metadata {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 16px;
          }

          .create-preview__meta {
            display: inline-flex;
            min-height: 28px;
            align-items: center;
            gap: 6px;
            padding: 0 9px;
            color: #9294a0;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 9px;
            background: rgba(255, 255, 255, 0.023);
            font-size: 8px;
            font-weight: 700;
          }

          .create-preview__salary {
            display: flex;
            align-items: center;
            gap: 11px;
            margin-top: 17px;
            padding: 13px;
            border: 1px solid rgba(74, 222, 128, 0.1);
            border-radius: 14px;
            background:
              linear-gradient(
                145deg,
                rgba(74, 222, 128, 0.055),
                rgba(74, 222, 128, 0.018)
              );
          }

          .create-preview__salary-icon {
            display: grid;
            flex: 0 0 auto;
            width: 36px;
            height: 36px;
            place-items: center;
            color: #9ef3ba;
            border: 1px solid rgba(74, 222, 128, 0.11);
            border-radius: 11px;
            background: rgba(74, 222, 128, 0.055);
          }

          .create-preview__salary-label {
            display: block;
            color: #66836f;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .create-preview__salary-value {
            display: block;
            margin-top: 4px;
            color: #c8f7d7;
            font-size: 11px;
            font-weight: 780;
          }

          .create-preview__section {
            margin-top: 20px;
          }

          .create-preview__section-label {
            display: block;
            margin-bottom: 8px;
            color: #777986;
            font-size: 8px;
            font-weight: 850;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .create-preview__description {
            display: -webkit-box;
            max-height: 112px;
            margin: 0;
            overflow: hidden;
            color: #a3a5af;
            font-size: 9px;
            line-height: 1.7;
            white-space: pre-line;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 7;
          }

          .create-preview__tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .create-preview__tag {
            display: inline-flex;
            min-height: 27px;
            align-items: center;
            padding: 0 9px;
            color: #cbd7ff;
            border: 1px solid rgba(82, 125, 255, 0.14);
            border-radius: 8px;
            background: rgba(82, 125, 255, 0.065);
            font-size: 8px;
            font-weight: 700;
          }

          .create-preview__benefits {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .create-preview__benefit {
            display: flex;
            min-height: 31px;
            align-items: center;
            gap: 8px;
            padding: 0 9px;
            color: #9799a4;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 9px;
            background: rgba(255, 255, 255, 0.02);
            font-size: 8px;
            font-weight: 650;
          }

          .create-preview__benefit--more {
            color: #837c97;
            justify-content: center;
          }

          .create-preview__footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 22px;
            padding-top: 17px;
            border-top: 1px solid rgba(255, 255, 255, 0.055);
          }

          .create-preview__deadline {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #727480;
            font-size: 8px;
            font-weight: 700;
          }

          .create-preview__openings {
            display: inline-flex;
            min-height: 26px;
            align-items: center;
            padding: 0 9px;
            color: #b4b6bf;
            border: 1px solid rgba(255, 255, 255, 0.065);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.025);
            font-size: 8px;
            font-weight: 750;
          }

          .create-mobile-preview-button {
            position: fixed;
            z-index: 65;
            right: 17px;
            bottom: 91px;
            display: none;
            width: 52px;
            height: 52px;
            place-items: center;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 17px;
            background:
              linear-gradient(
                145deg,
                var(--blue),
                var(--purple)
              );
            box-shadow:
              0 18px 45px rgba(82, 125, 255, 0.3),
              inset 0 1px rgba(255, 255, 255, 0.2);
            cursor: pointer;
          }

          .create-mobile-nav {
            display: none;
          }

          .create-mobile-preview-overlay,
          .create-modal-overlay {
            position: fixed;
            z-index: 100;
            inset: 0;
            display: grid;
            place-items: center;
            padding: 20px;
            background: rgba(2, 3, 6, 0.76);
            animation: createOverlayReveal 180ms ease both;
            backdrop-filter: blur(16px);
          }

          .create-mobile-preview-dialog {
            position: relative;
            width: min(100%, 420px);
            max-height: calc(100vh - 40px);
            overflow: auto;
            animation: createDialogReveal 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .create-mobile-preview-dialog
            .create-preview {
            background: #11131b;
          }

          .create-mobile-preview-close {
            position: absolute;
            z-index: 5;
            top: 12px;
            left: 12px;
            display: grid;
            width: 34px;
            height: 34px;
            place-items: center;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 11px;
            background: rgba(5, 6, 10, 0.36);
            cursor: pointer;
            backdrop-filter: blur(12px);
          }

          .create-modal {
            width: min(100%, 470px);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.11);
            border-radius: 23px;
            background:
              linear-gradient(
                145deg,
                rgba(24, 26, 37, 0.98),
                rgba(11, 12, 18, 0.99)
              );
            box-shadow:
              0 50px 150px rgba(0, 0, 0, 0.68),
              inset 0 1px rgba(255, 255, 255, 0.05);
            animation: createDialogReveal 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .create-modal__decoration {
            height: 5px;
            background:
              linear-gradient(
                90deg,
                var(--blue),
                var(--purple),
                var(--pink)
              );
          }

          .create-modal__body {
            padding: 27px;
          }

          .create-modal__icon {
            display: grid;
            width: 52px;
            height: 52px;
            place-items: center;
            color: #dce4ff;
            border: 1px solid rgba(82, 125, 255, 0.18);
            border-radius: 16px;
            background:
              linear-gradient(
                145deg,
                rgba(82, 125, 255, 0.14),
                rgba(140, 92, 255, 0.07)
              );
            box-shadow: 0 15px 35px rgba(82, 125, 255, 0.1);
          }

          .create-modal__icon--danger {
            color: #ffc0ca;
            border-color: rgba(251, 113, 133, 0.17);
            background: rgba(251, 113, 133, 0.07);
          }

          .create-modal__title {
            margin: 19px 0 0;
            color: #f5f5f8;
            font-size: 22px;
            font-weight: 820;
            letter-spacing: -0.035em;
          }

          .create-modal__description {
            margin: 10px 0 0;
            color: #858794;
            font-size: 10px;
            line-height: 1.65;
          }

          .create-modal__summary {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-top: 20px;
          }

          .create-modal__summary-item {
            padding: 11px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.025);
          }

          .create-modal__summary-label {
            display: block;
            color: #5f616d;
            font-size: 7px;
            font-weight: 850;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .create-modal__summary-value {
            display: block;
            margin-top: 5px;
            overflow: hidden;
            color: #c5c6ce;
            font-size: 9px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .create-modal__actions {
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            margin-top: 24px;
          }

          .create-modal__button {
            display: inline-flex;
            min-height: 43px;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 15px;
            border-radius: 13px;
            cursor: pointer;
            font-size: 9px;
            font-weight: 800;
            transition:
              transform 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              box-shadow 180ms ease;
          }

          .create-modal__button--secondary {
            color: #a5a7b1;
            border: 1px solid rgba(255, 255, 255, 0.075);
            background: rgba(255, 255, 255, 0.03);
          }

          .create-modal__button--secondary:hover {
            color: #fff;
            border-color: rgba(255, 255, 255, 0.14);
            background: rgba(255, 255, 255, 0.055);
          }

          .create-modal__button--primary {
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background:
              linear-gradient(
                135deg,
                var(--blue),
                var(--purple)
              );
            box-shadow: 0 13px 30px rgba(82, 125, 255, 0.2);
          }

          .create-modal__button--danger {
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.09);
            background:
              linear-gradient(
                135deg,
                #dc3151,
                #f05472
              );
            box-shadow: 0 13px 30px rgba(220, 49, 81, 0.18);
          }

          .create-modal__button:hover {
            transform: translateY(-2px);
          }

          .create-modal__button:disabled {
            cursor: wait;
            opacity: 0.7;
            transform: none;
          }

          .create-loading-spinner {
            width: 15px;
            height: 15px;
            border: 2px solid rgba(255, 255, 255, 0.25);
            border-top-color: #fff;
            border-radius: 50%;
            animation: createSpinner 700ms linear infinite;
          }

          .create-toast {
            position: fixed;
            z-index: 130;
            right: 24px;
            bottom: 24px;
            display: flex;
            width: min(calc(100% - 36px), 350px);
            align-items: flex-start;
            gap: 12px;
            padding: 15px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 17px;
            background:
              linear-gradient(
                145deg,
                rgba(22, 24, 34, 0.98),
                rgba(10, 11, 17, 0.98)
              );
            box-shadow:
              0 30px 90px rgba(0, 0, 0, 0.58),
              inset 0 1px rgba(255, 255, 255, 0.045);
            animation: createToastReveal 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
            backdrop-filter: blur(20px);
          }

          .create-toast--success {
            border-color: rgba(74, 222, 128, 0.15);
          }

          .create-toast--error {
            border-color: rgba(251, 113, 133, 0.17);
          }

          .create-toast--info {
            border-color: rgba(82, 125, 255, 0.17);
          }

          .create-toast__icon {
            display: grid;
            flex: 0 0 auto;
            width: 35px;
            height: 35px;
            place-items: center;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 11px;
            background: rgba(255, 255, 255, 0.035);
          }

          .create-toast--success
            .create-toast__icon {
            color: #bdf7d0;
            border-color: rgba(74, 222, 128, 0.12);
            background: rgba(74, 222, 128, 0.06);
          }

          .create-toast--error
            .create-toast__icon {
            color: #ffc0ca;
            border-color: rgba(251, 113, 133, 0.12);
            background: rgba(251, 113, 133, 0.06);
          }

          .create-toast--info
            .create-toast__icon {
            color: #c5d3ff;
            border-color: rgba(82, 125, 255, 0.12);
            background: rgba(82, 125, 255, 0.06);
          }

          .create-toast__title {
            display: block;
            color: #f0f1f4;
            font-size: 10px;
            font-weight: 800;
          }

          .create-toast__description {
            display: block;
            margin-top: 5px;
            color: #797b87;
            font-size: 8px;
            line-height: 1.55;
          }

          .create-app button:focus-visible,
          .create-app input:focus-visible,
          .create-app select:focus-visible,
          .create-app textarea:focus-visible {
            outline: 2px solid rgba(136, 167, 255, 0.76);
            outline-offset: 3px;
          }

          @keyframes createReveal {
            from {
              opacity: 0;
              transform: translateY(20px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes createPreviewReveal {
            from {
              opacity: 0;
              transform: translateX(20px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes createOverlayReveal {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes createDialogReveal {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.96);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes createToastReveal {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.96);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes createErrorReveal {
            from {
              opacity: 0;
              transform: translateY(-3px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes createTagReveal {
            from {
              opacity: 0;
              transform: scale(0.85);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes createGradientMove {
            to {
              background-position: 220% center;
            }
          }

          @keyframes createOrbFloat {
            0%,
            100% {
              transform: translate3d(0, 0, 0) scale(1);
            }

            50% {
              transform: translate3d(28px, -24px, 0) scale(1.08);
            }
          }

          @keyframes createShapeFloat {
            0%,
            100% {
              transform: translateY(0) rotate(18deg);
            }

            50% {
              transform: translateY(-20px) rotate(27deg);
            }
          }

          @keyframes createStatusPulse {
            0%,
            100% {
              opacity: 1;
              transform: scale(1);
            }

            50% {
              opacity: 0.55;
              transform: scale(0.75);
            }
          }

          @keyframes createSpinner {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1240px) {
            .create-layout {
              grid-template-columns: minmax(0, 1fr) 330px;
            }

            .create-benefits-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 1050px) {
            .create-layout {
              grid-template-columns: 1fr;
            }

            .create-preview-column {
              position: static;
              display: none;
            }

            .create-mobile-preview-button {
              display: grid;
            }
          }

          @media (max-width: 920px) {
            .create-shell {
              display: block;
            }

            .create-sidebar {
              min-height: auto;
              padding: 14px 20px;
              border-right: 0;
              border-bottom: 1px solid var(--border);
            }

            .create-brand {
              min-height: 50px;
              padding: 0;
            }

            .create-sidebar__section,
            .create-sidebar__tip {
              display: none;
            }

            .create-main {
              padding-top: 21px;
              padding-bottom: 110px;
            }

            .create-mobile-nav {
              position: fixed;
              z-index: 60;
              right: 16px;
              bottom: 16px;
              left: 16px;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 7px;
              padding: 8px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              background: rgba(12, 13, 19, 0.87);
              box-shadow:
                0 25px 70px rgba(0, 0, 0, 0.55),
                inset 0 1px rgba(255, 255, 255, 0.04);
              backdrop-filter: blur(24px);
            }

            .create-mobile-nav__item {
              display: flex;
              min-height: 55px;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
              color: #757783;
              border: 1px solid transparent;
              border-radius: 14px;
              background: transparent;
              cursor: pointer;
            }

            .create-mobile-nav__item--active {
              color: #fff;
              border-color: rgba(255, 255, 255, 0.07);
              background:
                linear-gradient(
                  145deg,
                  rgba(255, 77, 141, 0.12),
                  rgba(82, 125, 255, 0.08)
                );
            }

            .create-mobile-nav__label {
              font-size: 9px;
              font-weight: 750;
            }

            .create-toast {
              bottom: 92px;
            }
          }

          @media (max-width: 720px) {
            .create-save-status {
              display: none;
            }

            .create-hero {
              grid-template-columns: 1fr;
              align-items: start;
            }

            .create-progress {
              width: 104px;
              height: 104px;
            }

            .create-progress__value {
              font-size: 24px;
            }

            .create-fields-grid {
              grid-template-columns: 1fr;
            }

            .create-field--full {
              grid-column: auto;
            }

            .create-benefits-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .create-form-actions {
              align-items: stretch;
              flex-direction: column;
            }

            .create-form-actions__secondary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .create-submit-button {
              width: 100%;
            }
          }

          @media (max-width: 520px) {
            .create-sidebar {
              padding-right: 16px;
              padding-left: 16px;
            }

            .create-main {
              padding-right: 16px;
              padding-left: 16px;
            }

            .create-back-button__text,
            .create-topbar-button__text {
              display: none;
            }

            .create-back-button,
            .create-topbar-button {
              width: 42px;
              padding: 0;
              justify-content: center;
            }

            .create-hero {
              padding: 23px 20px;
              border-radius: 22px;
            }

            .create-hero__title {
              font-size: clamp(33px, 12vw, 46px);
            }

            .create-form-card {
              padding: 20px 17px;
              border-radius: 21px;
            }

            .create-form-card__step {
              display: none;
            }

            .create-form-card__title-wrapper {
              gap: 10px;
            }

            .create-money-grid {
              grid-template-columns: 1fr;
            }

            .create-benefits-grid {
              grid-template-columns: 1fr;
            }

            .create-benefit {
              min-height: 60px;
            }

            .create-form-actions {
              padding: 14px;
            }

            .create-modal__body {
              padding: 22px 18px;
            }

            .create-modal__summary {
              grid-template-columns: 1fr;
            }

            .create-modal__actions {
              flex-direction: column-reverse;
            }

            .create-modal__button {
              width: 100%;
            }

            .create-toast {
              right: 18px;
              left: 18px;
              width: auto;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              scroll-behavior: auto !important;
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>

      <div className="create-app">
        <div className="create-background-orb create-background-orb--pink" />
        <div className="create-background-orb create-background-orb--blue" />
        <div className="create-floating-shape create-floating-shape--one" />
        <div className="create-floating-shape create-floating-shape--two" />

        <div className="create-shell">
          <aside className="create-sidebar">
            <div className="create-brand">
              <div className="create-brand__symbol">
                <Icon name="logo" size={21} />
              </div>

              <div>
                <p className="create-brand__name">
                  Painel Admin
                </p>

                <span className="create-brand__caption">
                  Área de controle
                </span>
              </div>
            </div>

            <div className="create-sidebar__section">
              <span className="create-sidebar__label">
                Navegação
              </span>

              <nav
                className="create-nav"
                aria-label="Navegação administrativa"
              >
                <button
                  type="button"
                  className="create-nav__item"
                  onClick={() =>
                    navigate("/admin/home")
                  }
                >
                  <span className="create-nav__icon">
                    <Icon
                      name="home"
                      size={18}
                    />
                  </span>

                  <span className="create-nav__text">
                    Visão geral
                  </span>
                </button>

                <button
                  type="button"
                  className="create-nav__item create-nav__item--active"
                  aria-current="page"
                >
                  <span className="create-nav__icon">
                    <Icon
                      name="plus"
                      size={18}
                    />
                  </span>

                  <span className="create-nav__text">
                    {isEditing ? "Editar vaga" : "Criar vaga"}
                  </span>
                </button>

                <button
                  type="button"
                  className="create-nav__item"
                  onClick={() =>
                    navigate("/admin/ver-vagas")
                  }
                >
                  <span className="create-nav__icon">
                    <Icon
                      name="briefcase"
                      size={18}
                    />
                  </span>

                  <span className="create-nav__text">
                    Ver vagas
                  </span>
                </button>
              </nav>
            </div>

            <div className="create-sidebar__tip">
              <span className="create-sidebar__tip-icon">
                <Icon
                  name="magic"
                  size={17}
                />
              </span>

              <strong className="create-sidebar__tip-title">
                Dica inteligente
              </strong>

              <span className="create-sidebar__tip-text">
                Utilize os modelos de texto para criar
                descrições completas e depois personalize
                os detalhes.
              </span>

              <span className="create-sidebar__shortcut">
                Ctrl + Enter
                <span>Publicar</span>
              </span>
            </div>
          </aside>

          <main className="create-main">
            <header className="create-topbar">
              <button
                type="button"
                className="create-back-button"
                onClick={() =>
                  navigate("/admin/home")
                }
              >
                <Icon
                  name="arrowLeft"
                  size={17}
                />

                <span className="create-back-button__text">
                  Voltar ao painel
                </span>
              </button>

              <div className="create-topbar__actions">
                <div className="create-save-status">
                  <span className="create-save-status__dot" />

                  {lastSaved
                    ? `Salvo às ${lastSaved.toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}`
                    : "Salvamento automático"}
                </div>

                <button
                  type="button"
                  className="create-topbar-button"
                  onClick={() =>
                    saveDraft(true)
                  }
                >
                  <Icon
                    name="save"
                    size={16}
                  />

                  <span className="create-topbar-button__text">
                    Salvar rascunho
                  </span>
                </button>
              </div>
            </header>

            <section className="create-hero">
              <div className="create-hero__content">
                <div className="create-hero__eyebrow">
                  <span className="create-hero__eyebrow-icon">
                    <Icon
                      name="sparkles"
                      size={15}
                    />
                  </span>

                  Nova oportunidade
                </div>

                <h1 className="create-hero__title">
                  Crie uma vaga{" "}
                  <span className="create-hero__gradient">
                    impossível de ignorar.
                  </span>
                </h1>

                <p className="create-hero__description">
                  Preencha os detalhes da oportunidade,
                  acompanhe o resultado em tempo real e
                  publique uma vaga clara, atrativa e
                  profissional.
                </p>
              </div>

              <div
                className="create-progress"
                style={{
                  "--progress": `${completion}%`,
                }}
                aria-label={`${completion}% do formulário preenchido`}
              >
                <div className="create-progress__ring" />

                <div className="create-progress__content">
                  <strong className="create-progress__value">
                    {completion}%
                  </strong>

                  <span className="create-progress__label">
                    Concluído
                  </span>
                </div>
              </div>
            </section>

            <div className="create-layout">
              <form
                className="create-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <section className="create-form-card">
                  <header className="create-form-card__header">
                    <div className="create-form-card__title-wrapper">
                      <span className="create-form-card__icon">
                        <Icon
                          name="briefcase"
                          size={19}
                        />
                      </span>

                      <div>
                        <h2 className="create-form-card__title">
                          Informações principais
                        </h2>

                        <p className="create-form-card__description">
                          Apresente a oportunidade e a
                          empresa de forma clara.
                        </p>
                      </div>
                    </div>

                    <span className="create-form-card__step">
                      Etapa 01
                    </span>
                  </header>

                  <div className="create-fields-grid">
                    <div className="create-field create-field--full">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="title"
                        >
                          Título da vaga
                          <span className="create-field__required">
                            *
                          </span>
                        </label>

                        <span className="create-field__counter">
                          {form.title.length}/80
                        </span>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="briefcase"
                            size={17}
                          />
                        </span>

                        <input
                          ref={titleInputRef}
                          id="title"
                          name="title"
                          data-field="title"
                          type="text"
                          value={form.title}
                          maxLength={80}
                          placeholder="Ex: Desenvolvedor Front-end Júnior"
                          className={`create-input ${
                            shouldShowError("title")
                              ? "create-input--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "title"
                            )
                          }
                        />
                      </div>

                      {shouldShowError("title") && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.title}
                        </span>
                      )}
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="company"
                        >
                          Empresa
                          <span className="create-field__required">
                            *
                          </span>
                        </label>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="building"
                            size={17}
                          />
                        </span>

                        <input
                          id="company"
                          name="company"
                          data-field="company"
                          type="text"
                          value={form.company}
                          placeholder="Nome da empresa"
                          className={`create-input ${
                            shouldShowError("company")
                              ? "create-input--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "company"
                            )
                          }
                        />
                      </div>

                      {shouldShowError("company") && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.company}
                        </span>
                      )}
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="department"
                        >
                          Departamento
                        </label>

                        <span className="create-field__optional">
                          Opcional
                        </span>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="layers"
                            size={17}
                          />
                        </span>

                        <input
                          id="department"
                          name="department"
                          type="text"
                          value={form.department}
                          placeholder="Ex: Tecnologia"
                          className="create-input"
                          onChange={handleFieldChange}
                        />
                      </div>
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="location"
                        >
                          Localização
                          <span className="create-field__required">
                            *
                          </span>
                        </label>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="mapPin"
                            size={17}
                          />
                        </span>

                        <input
                          id="location"
                          name="location"
                          data-field="location"
                          type="text"
                          value={form.location}
                          placeholder="Ex: Tatuí - SP"
                          className={`create-input ${
                            shouldShowError("location")
                              ? "create-input--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "location"
                            )
                          }
                        />
                      </div>

                      {shouldShowError("location") && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.location}
                        </span>
                      )}
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="employmentType"
                        >
                          Tipo de contratação
                          <span className="create-field__required">
                            *
                          </span>
                        </label>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="briefcase"
                            size={17}
                          />
                        </span>

                        <select
                          id="employmentType"
                          name="employmentType"
                          data-field="employmentType"
                          value={
                            form.employmentType
                          }
                          className={`create-select ${
                            shouldShowError(
                              "employmentType"
                            )
                              ? "create-select--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "employmentType"
                            )
                          }
                        >
                          <option value="">
                            Selecione uma opção
                          </option>

                          {employmentTypes.map(
                            (type) => (
                              <option
                                key={type}
                                value={type}
                              >
                                {type}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {shouldShowError(
                        "employmentType"
                      ) && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.employmentType}
                        </span>
                      )}
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="workMode"
                        >
                          Modelo de trabalho
                          <span className="create-field__required">
                            *
                          </span>
                        </label>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="monitor"
                            size={17}
                          />
                        </span>

                        <select
                          id="workMode"
                          name="workMode"
                          data-field="workMode"
                          value={form.workMode}
                          className={`create-select ${
                            shouldShowError(
                              "workMode"
                            )
                              ? "create-select--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "workMode"
                            )
                          }
                        >
                          <option value="">
                            Selecione uma opção
                          </option>

                          {workModes.map((mode) => (
                            <option
                              key={mode}
                              value={mode}
                            >
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>

                      {shouldShowError("workMode") && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.workMode}
                        </span>
                      )}
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="seniority"
                        >
                          Nível profissional
                        </label>

                        <span className="create-field__optional">
                          Opcional
                        </span>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="chart"
                            size={17}
                          />
                        </span>

                        <select
                          id="seniority"
                          name="seniority"
                          value={form.seniority}
                          className="create-select"
                          onChange={handleFieldChange}
                        >
                          {seniorityLevels.map(
                            (level) => (
                              <option
                                key={level}
                                value={level}
                              >
                                {level}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="openings"
                        >
                          Quantidade de vagas
                        </label>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="users"
                            size={17}
                          />
                        </span>

                        <input
                          id="openings"
                          name="openings"
                          data-field="openings"
                          type="number"
                          min="1"
                          max="999"
                          value={form.openings}
                          className={`create-input ${
                            shouldShowError("openings")
                              ? "create-input--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "openings"
                            )
                          }
                        />
                      </div>

                      {shouldShowError("openings") && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.openings}
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                <section className="create-form-card">
                  <header className="create-form-card__header">
                    <div className="create-form-card__title-wrapper">
                      <span className="create-form-card__icon">
                        <Icon
                          name="money"
                          size={19}
                        />
                      </span>

                      <div>
                        <h2 className="create-form-card__title">
                          Candidatura e remuneração
                        </h2>

                        <p className="create-form-card__description">
                          Defina como os candidatos entrarão
                          em contato e informe a faixa
                          salarial.
                        </p>
                      </div>
                    </div>

                    <span className="create-form-card__step">
                      Etapa 02
                    </span>
                  </header>

                  <div className="create-fields-grid">
                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="applicationEmail"
                        >
                          E-mail para candidatura
                          <span className="create-field__required">
                            *
                          </span>
                        </label>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="mail"
                            size={17}
                          />
                        </span>

                        <input
                          id="applicationEmail"
                          name="applicationEmail"
                          data-field="applicationEmail"
                          type="email"
                          value={
                            form.applicationEmail
                          }
                          placeholder="rh@empresa.com"
                          className={`create-input ${
                            shouldShowError(
                              "applicationEmail"
                            )
                              ? "create-input--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "applicationEmail"
                            )
                          }
                        />
                      </div>

                      {shouldShowError(
                        "applicationEmail"
                      ) && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.applicationEmail}
                        </span>
                      )}
                    </div>

                    <div className="create-field">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="applicationDeadline"
                        >
                          Prazo para candidatura
                        </label>

                        <span className="create-field__optional">
                          Opcional
                        </span>
                      </div>

                      <div className="create-field__control">
                        <span className="create-field__icon">
                          <Icon
                            name="calendar"
                            size={17}
                          />
                        </span>

                        <input
                          id="applicationDeadline"
                          name="applicationDeadline"
                          type="date"
                          value={
                            form.applicationDeadline
                          }
                          className="create-input"
                          onChange={handleFieldChange}
                        />
                      </div>
                    </div>

                    <div className="create-field create-field--full">
                      <div className="create-field__header">
                        <span className="create-field__label">
                          Faixa salarial
                        </span>

                        <span className="create-field__optional">
                          Opcional
                        </span>
                      </div>

                      <div className="create-money-grid">
                        <div className="create-field">
                          <div className="create-field__control">
                            <span className="create-field__icon">
                              <Icon
                                name="money"
                                size={17}
                              />
                            </span>

                            <input
                              name="salaryMin"
                              type="number"
                              min="0"
                              step="100"
                              value={form.salaryMin}
                              placeholder="Salário mínimo"
                              className="create-input"
                              onChange={
                                handleFieldChange
                              }
                            />
                          </div>
                        </div>

                        <div className="create-field">
                          <div className="create-field__control">
                            <span className="create-field__icon">
                              <Icon
                                name="money"
                                size={17}
                              />
                            </span>

                            <input
                              name="salaryMax"
                              data-field="salaryMax"
                              type="number"
                              min="0"
                              step="100"
                              value={form.salaryMax}
                              placeholder="Salário máximo"
                              className={`create-input ${
                                shouldShowError(
                                  "salaryMax"
                                )
                                  ? "create-input--error"
                                  : ""
                              }`}
                              onChange={
                                handleFieldChange
                              }
                              onBlur={() =>
                                markFieldAsTouched(
                                  "salaryMax"
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {shouldShowError("salaryMax") && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.salaryMax}
                        </span>
                      )}
                    </div>

                    <div className="create-field create-field--full">
                      <div className="create-salary-visibility">
                        <div className="create-salary-visibility__content">
                          <span className="create-salary-visibility__icon">
                            <Icon
                              name={
                                form.salaryVisible
                                  ? "eye"
                                  : "eyeOff"
                              }
                              size={17}
                            />
                          </span>

                          <span className="create-salary-visibility__label">
                            Exibir faixa salarial
                            publicamente
                          </span>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            form.salaryVisible
                          }
                          className={`create-switch ${
                            form.salaryVisible
                              ? "create-switch--active"
                              : ""
                          }`}
                          onClick={() =>
                            updateField(
                              "salaryVisible",
                              !form.salaryVisible
                            )
                          }
                        >
                          <span className="create-switch__thumb" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="create-form-card">
                  <header className="create-form-card__header">
                    <div className="create-form-card__title-wrapper">
                      <span className="create-form-card__icon">
                        <Icon
                          name="fileText"
                          size={19}
                        />
                      </span>

                      <div>
                        <h2 className="create-form-card__title">
                          Conteúdo da vaga
                        </h2>

                        <p className="create-form-card__description">
                          Descreva a oportunidade, as
                          atividades e o perfil desejado.
                        </p>
                      </div>
                    </div>

                    <span className="create-form-card__step">
                      Etapa 03
                    </span>
                  </header>

                  <div className="create-fields-grid">
                    <div className="create-field create-field--full">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="description"
                        >
                          Descrição da vaga
                          <span className="create-field__required">
                            *
                          </span>
                        </label>

                        <button
                          type="button"
                          className="create-template-button"
                          onClick={() =>
                            applyTextTemplate(
                              "description"
                            )
                          }
                        >
                          <Icon
                            name="magic"
                            size={12}
                          />
                          Usar modelo
                        </button>
                      </div>

                      <div className="create-textarea-wrapper">
                        <textarea
                          id="description"
                          name="description"
                          data-field="description"
                          value={form.description}
                          maxLength={1800}
                          placeholder="Conte um pouco sobre a oportunidade, o ambiente da empresa e o que torna esta vaga especial..."
                          className={`create-textarea create-textarea--large ${
                            shouldShowError(
                              "description"
                            )
                              ? "create-textarea--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "description"
                            )
                          }
                        />

                        <span className="create-textarea-decoration">
                          {form.description.length}
                          /1800
                        </span>
                      </div>

                      {shouldShowError(
                        "description"
                      ) && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.description}
                        </span>
                      )}
                    </div>

                    <div className="create-field create-field--full">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="responsibilities"
                        >
                          Responsabilidades
                        </label>

                        <button
                          type="button"
                          className="create-template-button"
                          onClick={() =>
                            applyTextTemplate(
                              "responsibilities"
                            )
                          }
                        >
                          <Icon
                            name="magic"
                            size={12}
                          />
                          Usar modelo
                        </button>
                      </div>

                      <div className="create-textarea-wrapper">
                        <textarea
                          id="responsibilities"
                          name="responsibilities"
                          value={
                            form.responsibilities
                          }
                          maxLength={1500}
                          placeholder="Liste as principais atividades e responsabilidades do cargo..."
                          className="create-textarea"
                          onChange={handleFieldChange}
                        />

                        <span className="create-textarea-decoration">
                          {
                            form.responsibilities
                              .length
                          }
                          /1500
                        </span>
                      </div>
                    </div>

                    <div className="create-field create-field--full">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="requirements"
                        >
                          Requisitos
                          <span className="create-field__required">
                            *
                          </span>
                        </label>

                        <button
                          type="button"
                          className="create-template-button"
                          onClick={() =>
                            applyTextTemplate(
                              "requirements"
                            )
                          }
                        >
                          <Icon
                            name="magic"
                            size={12}
                          />
                          Usar modelo
                        </button>
                      </div>

                      <div className="create-textarea-wrapper">
                        <textarea
                          id="requirements"
                          name="requirements"
                          data-field="requirements"
                          value={form.requirements}
                          maxLength={1500}
                          placeholder="Informe conhecimentos, experiências e características importantes..."
                          className={`create-textarea ${
                            shouldShowError(
                              "requirements"
                            )
                              ? "create-textarea--error"
                              : ""
                          }`}
                          onChange={handleFieldChange}
                          onBlur={() =>
                            markFieldAsTouched(
                              "requirements"
                            )
                          }
                        />

                        <span className="create-textarea-decoration">
                          {form.requirements.length}
                          /1500
                        </span>
                      </div>

                      {shouldShowError(
                        "requirements"
                      ) && (
                        <span className="create-field__message">
                          <Icon
                            name="alert"
                            size={12}
                          />
                          {errors.requirements}
                        </span>
                      )}
                    </div>

                    <div className="create-field create-field--full">
                      <div className="create-field__header">
                        <label
                          className="create-field__label"
                          htmlFor="tagInput"
                        >
                          Habilidades e tecnologias
                        </label>

                        <span className="create-field__counter">
                          {form.tags.length}/8
                        </span>
                      </div>

                      <div className="create-tags-box">
                        <div className="create-tags-list">
                          {form.tags.map((tag) => (
                            <span
                              key={tag}
                              className="create-tag"
                            >
                              {tag}

                              <button
                                type="button"
                                className="create-tag__remove"
                                onClick={() =>
                                  removeTag(tag)
                                }
                                aria-label={`Remover ${tag}`}
                              >
                                <Icon
                                  name="close"
                                  size={11}
                                />
                              </button>
                            </span>
                          ))}

                          <input
                            id="tagInput"
                            type="text"
                            value={tagInput}
                            className="create-tags-input"
                            placeholder={
                              form.tags.length === 0
                                ? "Digite e pressione Enter..."
                                : "Adicionar..."
                            }
                            onChange={(event) =>
                              setTagInput(
                                event.target.value
                              )
                            }
                            onKeyDown={
                              handleTagKeyDown
                            }
                            onBlur={() => {
                              if (tagInput.trim()) {
                                addTag(tagInput);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <p className="create-field__hint">
                        Exemplos: React, Atendimento,
                        Excel, Comunicação, Laravel ou
                        Inglês.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="create-form-card">
                  <header className="create-form-card__header">
                    <div className="create-form-card__title-wrapper">
                      <span className="create-form-card__icon">
                        <Icon
                          name="gift"
                          size={19}
                        />
                      </span>

                      <div>
                        <h2 className="create-form-card__title">
                          Benefícios
                        </h2>

                        <p className="create-form-card__description">
                          Selecione tudo o que a empresa
                          oferece aos colaboradores.
                        </p>
                      </div>
                    </div>

                    <span className="create-form-card__step">
                      Etapa 04
                    </span>
                  </header>

                  <div className="create-benefits-grid">
                    {benefitsOptions.map(
                      (benefit) => {
                        const isSelected =
                          form.benefits.includes(
                            benefit.id
                          );

                        return (
                          <button
                            key={benefit.id}
                            type="button"
                            className={`create-benefit ${
                              isSelected
                                ? "create-benefit--active"
                                : ""
                            }`}
                            aria-pressed={
                              isSelected
                            }
                            onClick={() =>
                              toggleBenefit(
                                benefit.id
                              )
                            }
                          >
                            <span className="create-benefit__emoji">
                              {benefit.emoji}
                            </span>

                            <span className="create-benefit__label">
                              {benefit.label}
                            </span>

                            <span className="create-benefit__check">
                              <Icon
                                name="check"
                                size={11}
                              />
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </section>

                <div className="create-form-actions">
                  <div className="create-form-actions__secondary">
                    <button
                      type="button"
                      className="create-secondary-button"
                      onClick={() =>
                        saveDraft(true)
                      }
                    >
                      <Icon
                        name="save"
                        size={15}
                      />
                      Salvar
                    </button>

                    <button
                      type="button"
                      className="create-secondary-button create-secondary-button--danger"
                      onClick={() =>
                        setModalMode("reset")
                      }
                    >
                      <Icon
                        name="trash"
                        size={15}
                      />
                      Limpar
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="create-submit-button"
                  >
                    <Icon
                      name="send"
                      size={17}
                    />
                    {isEditing ? "Revisar e atualizar" : "Revisar e publicar"}
                    <Icon
                      name="arrowRight"
                      size={16}
                    />
                  </button>
                </div>
              </form>

              <aside className="create-preview-column">
                <div className="create-quality-card">
                  <div className="create-quality-card__header">
                    <span className="create-quality-card__title">
                      <Icon
                        name="sparkles"
                        size={15}
                      />
                      Qualidade da vaga
                    </span>

                    <strong className="create-quality-card__score">
                      {qualityScore}
                      <small>/100</small>
                    </strong>
                  </div>

                  <div className="create-quality-card__track">
                    <div
                      className="create-quality-card__fill"
                      style={{
                        width: `${qualityScore}%`,
                      }}
                    />
                  </div>

                  <p className="create-quality-card__text">
                    Adicione habilidades, benefícios,
                    salário e responsabilidades para
                    aumentar a qualidade da publicação.
                  </p>
                </div>

                <div className="create-preview">
                  {renderPreviewContent()}
                </div>
              </aside>
            </div>
          </main>
        </div>

        <nav
          className="create-mobile-nav"
          aria-label="Navegação móvel"
        >
          <button
            type="button"
            className="create-mobile-nav__item"
            onClick={() =>
              navigate("/admin/home")
            }
          >
            <Icon
              name="home"
              size={18}
            />

            <span className="create-mobile-nav__label">
              Início
            </span>
          </button>

          <button
            type="button"
            className="create-mobile-nav__item create-mobile-nav__item--active"
          >
            <Icon
              name="plus"
              size={18}
            />

            <span className="create-mobile-nav__label">
              Criar
            </span>
          </button>

          <button
            type="button"
            className="create-mobile-nav__item"
            onClick={() =>
              navigate("/admin/ver-vagas")
            }
          >
            <Icon
              name="briefcase"
              size={18}
            />

            <span className="create-mobile-nav__label">
              Vagas
            </span>
          </button>
        </nav>

        <button
          type="button"
          className="create-mobile-preview-button"
          onClick={() =>
            setMobilePreviewOpen(true)
          }
          aria-label="Abrir visualização da vaga"
        >
          <Icon
            name="preview"
            size={21}
          />
        </button>

        {mobilePreviewOpen && (
          <div
            className="create-mobile-preview-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setMobilePreviewOpen(false);
              }
            }}
          >
            <div className="create-mobile-preview-dialog">
              <button
                type="button"
                className="create-mobile-preview-close"
                onClick={() =>
                  setMobilePreviewOpen(false)
                }
                aria-label="Fechar visualização"
              >
                <Icon
                  name="close"
                  size={16}
                />
              </button>

              <div className="create-preview">
                {renderPreviewContent()}
              </div>
            </div>
          </div>
        )}

        {modalMode && (
          <div
            className="create-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !isPublishing
              ) {
                setModalMode(null);
              }
            }}
          >
            <div
              className="create-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-modal-title"
            >
              <div className="create-modal__decoration" />

              <div className="create-modal__body">
                <span
                  className={`create-modal__icon ${
                    modalMode === "reset"
                      ? "create-modal__icon--danger"
                      : ""
                  }`}
                >
                  <Icon
                    name={
                      modalMode === "reset"
                        ? "trash"
                        : "send"
                    }
                    size={22}
                  />
                </span>

                <h2
                  id="create-modal-title"
                  className="create-modal__title"
                >
                  {modalMode === "reset"
                    ? "Limpar todo o formulário?"
                    : isEditing
                      ? "Atualizar esta oportunidade?"
                      : "Publicar esta oportunidade?"}
                </h2>

                <p className="create-modal__description">
                  {modalMode === "reset"
                    ? "Todas as informações preenchidas e o rascunho salvo neste navegador serão removidos. Esta ação não poderá ser desfeita."
                    : isEditing
                      ? "Revise o resumo abaixo. Após a confirmação, as alterações serão salvas no servidor."
                      : "Revise o resumo abaixo. Após a confirmação, a vaga será adicionada à sua lista de oportunidades publicadas."}
                </p>

                {modalMode === "publish" && (
                  <div className="create-modal__summary">
                    <div className="create-modal__summary-item">
                      <span className="create-modal__summary-label">
                        Vaga
                      </span>

                      <strong className="create-modal__summary-value">
                        {form.title}
                      </strong>
                    </div>

                    <div className="create-modal__summary-item">
                      <span className="create-modal__summary-label">
                        Empresa
                      </span>

                      <strong className="create-modal__summary-value">
                        {form.company}
                      </strong>
                    </div>

                    <div className="create-modal__summary-item">
                      <span className="create-modal__summary-label">
                        Contratação
                      </span>

                      <strong className="create-modal__summary-value">
                        {form.employmentType}
                      </strong>
                    </div>

                    <div className="create-modal__summary-item">
                      <span className="create-modal__summary-label">
                        Qualidade
                      </span>

                      <strong className="create-modal__summary-value">
                        {qualityScore}/100
                      </strong>
                    </div>
                  </div>
                )}

                <div className="create-modal__actions">
                  <button
                    type="button"
                    className="create-modal__button create-modal__button--secondary"
                    disabled={isPublishing}
                    onClick={() =>
                      setModalMode(null)
                    }
                  >
                    Cancelar
                  </button>

                  {modalMode === "reset" ? (
                    <button
                      type="button"
                      className="create-modal__button create-modal__button--danger"
                      onClick={confirmReset}
                    >
                      <Icon
                        name="trash"
                        size={15}
                      />
                      Limpar formulário
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="create-modal__button create-modal__button--primary"
                      disabled={isPublishing}
                      onClick={confirmPublish}
                    >
                      {isPublishing ? (
                        <>
                          <span className="create-loading-spinner" />
                          {isEditing ? "Atualizando..." : "Publicando..."}
                        </>
                      ) : (
                        <>
                          <Icon
                            name="send"
                            size={15}
                          />
                          {isEditing ? "Atualizar vaga" : "Publicar vaga"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            className={`create-toast create-toast--${toast.type}`}
            role="status"
            aria-live="polite"
          >
            <span className="create-toast__icon">
              <Icon
                name={
                  toast.type === "success"
                    ? "check"
                    : toast.type === "error"
                      ? "alert"
                      : "sparkles"
                }
                size={17}
              />
            </span>

            <div>
              <strong className="create-toast__title">
                {toast.title}
              </strong>

              <span className="create-toast__description">
                {toast.description}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
