/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion, // eslint-disable-line no-unused-vars -- usado como namespace JSX
  useReducedMotion,
} from "framer-motion";

import { useNavigate } from "react-router-dom";

import Logo from "./../assets/logo-invertida.png";
import CandidateHeader from "../components/CandidateHeader";
import api, { getApiErrorMessage } from "../lib/api";
import { unwrapApiData } from "../lib/candidate";
import "../styles/candidate-pages.css";

const STORAGE_KEY = "point:curriculo:rascunho";

function onlyComplete(items, fields) {
  return items
    .filter((item) => fields.every((field) => String(item[field] || "").trim()))
    .map((item) => {
      const sanitized = { ...item };
      delete sanitized.id;
      return sanitized;
    });
}

function toApiPayload(data) {
  const periodo = (item) => [item.inicio, item.fim || (item.atual ? "Atual" : "")]
    .filter(Boolean)
    .join(" — ");

  return {
    nome_completo: data.pessoal.nome.trim(),
    area_atuacao: data.pessoal.area.trim() || null,
    telefone: data.pessoal.telefone.trim() || null,
    email: data.pessoal.email.trim() || null,
    cidade_estado: data.pessoal.cidade.trim() || null,
    links: [data.pessoal.linkedin, data.pessoal.github, data.pessoal.portfolio]
      .map((value) => value.trim())
      .filter(Boolean),
    resumo: data.resumo.trim() || null,
    experiencias: onlyComplete(data.experiencias, ["cargo", "empresa", "inicio"])
      .map((item) => ({ cargo: item.cargo, empresa: item.empresa, periodo: periodo(item), descricao: item.descricao || null })),
    formacoes: onlyComplete(data.formacoes, ["curso", "instituicao", "inicio"])
      .map((item) => ({ curso: item.curso, instituicao: item.instituicao, periodo: periodo(item) })),
    cursos: onlyComplete(data.cursos, ["nome", "instituicao", "ano"])
      .map((item) => ({ nome: item.nome, instituicao: item.instituicao, periodo: [item.ano, item.carga].filter(Boolean).join(" · ") })),
    habilidades: data.habilidades.map((nome) => ({ nome })),
    idiomas: onlyComplete(data.idiomas, ["idioma", "nivel"])
      .map((item) => ({ idioma: item.idioma, nivel: item.nivel })),
  };
}

function fromApiResume(resume) {
  const links = Array.isArray(resume.links) ? resume.links : [];
  const experiencias = (resume.experiencias || []).map((item) => ({ ...item, id: criarId(), inicio: item.periodo || "", fim: "", atual: false }));
  const formacoes = (resume.formacoes || []).map((item) => ({ ...item, id: criarId(), inicio: item.periodo || "", fim: "" }));
  const cursos = (resume.cursos || []).map((item) => ({ ...item, id: criarId(), ano: item.periodo || "", carga: "" }));
  const idiomas = (resume.idiomas || []).map((item) => ({ ...item, id: criarId() }));

  return {
    pessoal: {
      nome: resume.nome_completo || "",
      telefone: resume.telefone || "",
      cidade: resume.cidade_estado || "",
      area: resume.area_atuacao || "",
      email: resume.email || "",
      linkedin: links.find((link) => link.includes("linkedin")) || "",
      github: links.find((link) => link.includes("github")) || "",
      portfolio: links.find((link) => !link.includes("linkedin") && !link.includes("github")) || "",
    },
    resumo: resume.resumo || "",
    experiencias: experiencias.length ? experiencias : INITIAL_DATA.experiencias,
    formacoes: formacoes.length ? formacoes : INITIAL_DATA.formacoes,
    cursos: cursos.length ? cursos : INITIAL_DATA.cursos,
    habilidades: (resume.habilidades || []).map((item) => item.nome).filter(Boolean),
    idiomas: idiomas.length ? idiomas : INITIAL_DATA.idiomas,
  };
}

const NIVEL_IDIOMA = [
  "Básico",
  "Intermediário",
  "Avançado",
  "Fluente",
  "Nativo",
];

function criarId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

const INITIAL_DATA = {
  pessoal: {
    nome: "Usuário Aleatório",
    telefone: "(15) 99773-1901",
    cidade: "Tatuí, SP",
    area: "Desenvolvimento de Software",
    email: "usuarioaleatorio@gmail.com",
    linkedin: "",
    github: "",
    portfolio: "",
  },

  resumo: "",

  experiencias: [
    {
      id: criarId(),
      cargo: "",
      empresa: "",
      inicio: "",
      fim: "",
      atual: false,
      descricao: "",
    },
  ],

  formacoes: [
    {
      id: criarId(),
      curso: "",
      instituicao: "",
      inicio: "",
      fim: "",
    },
  ],

  cursos: [
    {
      id: criarId(),
      nome: "",
      instituicao: "",
      ano: "",
      carga: "",
    },
  ],

  habilidades: [],

  idiomas: [
    {
      id: criarId(),
      idioma: "",
      nivel: "Intermediário",
    },
  ],
};

const SECTIONS = [
  {
    id: "dados",
    label: "Dados pessoais",
    icon: "user",
  },
  {
    id: "resumo",
    label: "Resumo",
    icon: "file",
  },
  {
    id: "experiencias",
    label: "Experiências",
    icon: "briefcase",
  },
  {
    id: "formacao",
    label: "Formação",
    icon: "education",
  },
  {
    id: "cursos",
    label: "Cursos",
    icon: "certificate",
  },
  {
    id: "habilidades",
    label: "Habilidades",
    icon: "sparkles",
  },
  {
    id: "idiomas",
    label: "Idiomas",
    icon: "language",
  },
];

export default function CreateResume() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const pageRef = useRef(null);
  const toastTimerRef = useRef(null);
  const navigationRef = useRef(null);

  const [data, setData] = useState(INITIAL_DATA);
  const [onlineResumeId, setOnlineResumeId] = useState(null);

  const [foto, setFoto] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const [activeSection, setActiveSection] =
    useState("dados");

  const [savedState, setSavedState] =
    useState("saved");

  const [toast, setToast] = useState("");

  const [previewMobile, setPreviewMobile] =
    useState(false);

  const [erros, setErros] = useState({});

  const completion = useMemo(
    () => calcularProgresso(data),
    [data],
  );

  const initials = useMemo(() => {
    const partes = data.pessoal.nome
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!partes.length) return "EU";

    return partes
      .map((parte) =>
        parte[0]?.toUpperCase(),
      )
      .join("");
  }, [data.pessoal.nome]);

  /* =====================================
     RECUPERAR RASCUNHO
  ===================================== */

  useEffect(() => {
    let active = true;

    api.get("/curriculos/me")
      .then((response) => {
        if (!active) return;
        const resume = unwrapApiData(response);

        if (resume?.id) {
          setOnlineResumeId(resume.id);
          setData(fromApiResume(resume));
          setFoto(resume.foto || "");
          showToast("Seu currículo online foi carregado.");
          return;
        }

        const draft = localStorage.getItem(STORAGE_KEY);
        if (!draft) return;
        const parsed = JSON.parse(draft);
        if (parsed?.data) setData(parsed.data);
        if (parsed?.foto) setFoto(parsed.foto);
        showToast("Seu último rascunho local foi recuperado.");
      })
      .catch((error) => {
        console.error("Erro ao recuperar currículo:", error);
        try {
          const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
          if (active && parsed?.data) setData(parsed.data);
          if (active && parsed?.foto) setFoto(parsed.foto);
        } catch (parseError) {
          console.error("Erro ao recuperar rascunho local:", parseError);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  /* =====================================
     AUTOSAVE
  ===================================== */

  useEffect(() => {
    setSavedState("saving");

    const timer = window.setTimeout(() => {
      salvarRascunhoSilencioso();
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [data, foto]);

  /* =====================================
     ATALHOS
  ===================================== */

  useEffect(() => {
    function handleKeyboard(event) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        salvarRascunho();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        finalizarCurriculo();
      }

      if (
        event.key === "Escape" &&
        previewMobile
      ) {
        setPreviewMobile(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );
    };
  }, [data, foto, previewMobile]);

  /* =====================================
     BLOQUEAR BODY NO PREVIEW MOBILE
  ===================================== */

  useEffect(() => {
    if (previewMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [previewMobile]);

  /* =====================================
     MANTER ETAPA ATIVA VISÍVEL MOBILE
  ===================================== */

  useEffect(() => {
    const container =
      navigationRef.current;

    if (!container) return;

    const activeButton =
      container.querySelector(
        `[data-section="${activeSection}"]`,
      );

    if (!activeButton) return;

    activeButton.scrollIntoView({
      behavior: reduceMotion
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSection, reduceMotion]);

  /* =====================================
     DADOS PESSOAIS
  ===================================== */

  function updatePersonal(field, value) {
    setData((current) => ({
      ...current,

      pessoal: {
        ...current.pessoal,
        [field]: value,
      },
    }));

    clearError(`pessoal.${field}`);
  }

  function updateResumo(value) {
    setData((current) => ({
      ...current,
      resumo: value.slice(0, 600),
    }));

    clearError("resumo");
  }

  /* =====================================
     ARRAYS DINÂMICOS
  ===================================== */

  function updateArrayItem(
    section,
    id,
    field,
    value,
  ) {
    setData((current) => ({
      ...current,

      [section]: current[section].map(
        (item) =>
          item.id === id
            ? {
                ...item,
                [field]: value,
              }
            : item,
      ),
    }));
  }

  function addArrayItem(
    section,
    template,
  ) {
    setData((current) => ({
      ...current,

      [section]: [
        ...current[section],
        {
          ...template,
          id: criarId(),
        },
      ],
    }));

    showToast("Novo item adicionado.");
  }

  function removeArrayItem(
    section,
    id,
  ) {
    setData((current) => {
      const items = current[section];

      if (items.length === 1) {
        showToast(
          "Mantenha pelo menos um campo nesta seção.",
        );

        return current;
      }

      return {
        ...current,

        [section]: items.filter(
          (item) => item.id !== id,
        ),
      };
    });
  }

  function duplicateArrayItem(
    section,
    id,
  ) {
    setData((current) => {
      const index =
        current[section].findIndex(
          (item) => item.id === id,
        );

      if (index === -1) {
        return current;
      }

      const cloned = {
        ...current[section][index],
        id: criarId(),
      };

      const next = [...current[section]];

      next.splice(
        index + 1,
        0,
        cloned,
      );

      return {
        ...current,
        [section]: next,
      };
    });

    showToast("Item duplicado.");
  }

  function moveArrayItem(
    section,
    index,
    direction,
  ) {
    setData((current) => {
      const next = [
        ...current[section],
      ];

      const destination =
        index + direction;

      if (
        destination < 0 ||
        destination >= next.length
      ) {
        return current;
      }

      [
        next[index],
        next[destination],
      ] = [
        next[destination],
        next[index],
      ];

      return {
        ...current,
        [section]: next,
      };
    });
  }

  /* =====================================
     FOTO
  ===================================== */

  function handlePhoto(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      showToast(
        "Escolha um arquivo de imagem.",
      );

      return;
    }

    if (
      file.size >
      3 * 1024 * 1024
    ) {
      showToast(
        "A foto deve possuir no máximo 3 MB.",
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setFoto(
        String(reader.result),
      );

      showToast(
        "Foto atualizada.",
      );
    };

    reader.readAsDataURL(file);
  }

  function removerFoto() {
    setFoto("");

    showToast(
      "Foto removida.",
    );
  }

  /* =====================================
     HABILIDADES
  ===================================== */

  function addSkill() {
    const skill =
      skillInput.trim();

    if (!skill) return;

    const alreadyExists =
      data.habilidades.some(
        (item) =>
          item.toLowerCase() ===
          skill.toLowerCase(),
      );

    if (alreadyExists) {
      showToast(
        "Essa habilidade já está na sua lista.",
      );

      return;
    }

    if (
      data.habilidades.length >= 15
    ) {
      showToast(
        "Você pode adicionar até 15 habilidades.",
      );

      return;
    }

    setData((current) => ({
      ...current,

      habilidades: [
        ...current.habilidades,
        skill,
      ],
    }));

    clearError("habilidades");

    setSkillInput("");
  }

  function removeSkill(skill) {
    setData((current) => ({
      ...current,

      habilidades:
        current.habilidades.filter(
          (item) =>
            item !== skill,
        ),
    }));
  }

  function handleSkillKeyDown(
    event,
  ) {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addSkill();
    }
  }

  /* =====================================
     SALVAR
  ===================================== */

  function salvarRascunhoSilencioso() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          data,
          foto,
          updatedAt:
            new Date().toISOString(),
        }),
      );

      setSavedState("saved");
    } catch (error) {
      console.error(
        "Erro ao salvar currículo:",
        error,
      );

      setSavedState("error");
    }
  }

  async function salvarRascunho() {
    salvarRascunhoSilencioso();
    setSavedState("saving");

    try {
      const payload = toApiPayload(data);
      const response = onlineResumeId
        ? await api.put(`/curriculos/${onlineResumeId}`, payload)
        : await api.post("/curriculos", payload);
      const savedResume = unwrapApiData(response);
      setOnlineResumeId(savedResume?.id || onlineResumeId);
      setSavedState("saved");
      showToast("Currículo salvo na sua conta.");
      return savedResume;
    } catch (error) {
      setSavedState("error");
      showToast(getApiErrorMessage(error, "Não foi possível salvar o currículo online."));
      return null;
    }
  }

  /* =====================================
     LIMPAR
  ===================================== */

  function limparCurriculo() {
    const confirmar =
      window.confirm(
        "Tem certeza que deseja limpar todo o currículo?",
      );

    if (!confirmar) return;

    setData({
      ...INITIAL_DATA,

      experiencias: [
        {
          ...INITIAL_DATA
            .experiencias[0],

          id: criarId(),
        },
      ],

      formacoes: [
        {
          ...INITIAL_DATA
            .formacoes[0],

          id: criarId(),
        },
      ],

      cursos: [
        {
          ...INITIAL_DATA
            .cursos[0],

          id: criarId(),
        },
      ],

      idiomas: [
        {
          ...INITIAL_DATA
            .idiomas[0],

          id: criarId(),
        },
      ],
    });

    setFoto("");
    setSkillInput("");
    setErros({});

    localStorage.removeItem(
      STORAGE_KEY,
    );

    showToast(
      "Currículo reiniciado.",
    );
  }

  /* =====================================
     VALIDAÇÃO
  ===================================== */

  function validarCurriculo() {
    const nextErrors = {};

    if (
      !data.pessoal.nome.trim()
    ) {
      nextErrors[
        "pessoal.nome"
      ] = "Digite seu nome.";
    }

    if (
      !data.pessoal.email.trim()
    ) {
      nextErrors[
        "pessoal.email"
      ] = "Digite seu e-mail.";
    }

    if (
      !data.pessoal.area.trim()
    ) {
      nextErrors[
        "pessoal.area"
      ] =
        "Informe sua área profissional.";
    }

    if (
      !data.resumo.trim()
    ) {
      nextErrors.resumo =
        "Adicione um pequeno resumo profissional.";
    }

    if (
      data.habilidades.length === 0
    ) {
      nextErrors.habilidades =
        "Adicione pelo menos uma habilidade.";
    }

    setErros(nextErrors);

    if (
      Object.keys(nextErrors)
        .length > 0
    ) {
      const firstError =
        Object.keys(
          nextErrors,
        )[0];

      if (
        firstError.startsWith(
          "pessoal",
        )
      ) {
        scrollToSection(
          "dados",
        );
      } else if (
        firstError ===
        "resumo"
      ) {
        scrollToSection(
          "resumo",
        );
      } else if (
        firstError ===
        "habilidades"
      ) {
        scrollToSection(
          "habilidades",
        );
      }

      showToast(
        "Há algumas informações importantes faltando.",
      );

      return false;
    }

    return true;
  }

  async function finalizarCurriculo() {
    if (!validarCurriculo()) {
      return;
    }

    try {
      await salvarRascunho();
      showToast("Currículo online pronto para candidaturas.");
    } catch {
      // A mensagem de erro já foi apresentada por salvarRascunho.
    }
  }

  async function imprimirCurriculo() {
    if (!validarCurriculo()) {
      return;
    }

    try {
      await salvarRascunho();
    } catch {
      return;
    }

    window.setTimeout(() => {
      window.print();
    }, 150);
  }

  async function copiarCurriculo() {
    const text =
      gerarCurriculoTexto(data);

    try {
      await navigator.clipboard.writeText(
        text,
      );

      showToast(
        "Currículo copiado para a área de transferência.",
      );
    } catch {
      showToast(
        "Não foi possível copiar automaticamente.",
      );
    }
  }

  /* =====================================
     HELPERS
  ===================================== */

  function clearError(key) {
    if (!erros[key]) return;

    setErros(
      (current) => ({
        ...current,
        [key]: "",
      }),
    );
  }

  function showToast(message) {
    setToast(message);

    window.clearTimeout(
      toastTimerRef.current,
    );

    toastTimerRef.current =
      window.setTimeout(() => {
        setToast("");
      }, 2600);
  }

  function scrollToSection(id) {
    setActiveSection(id);

    document
      .getElementById(
        `resume-${id}`,
      )
      ?.scrollIntoView({
        behavior: reduceMotion
          ? "auto"
          : "smooth",

        block: "start",
      });
  }

  function handlePointerMove(
    event,
  ) {
    if (
      reduceMotion ||
      !window.matchMedia(
        "(pointer: fine)",
      ).matches
    ) {
      return;
    }

    const page =
      pageRef.current;

    if (!page) return;

    const x =
      event.clientX /
        window.innerWidth -
      0.5;

    const y =
      event.clientY /
        window.innerHeight -
      0.5;

    page.style.setProperty(
      "--move-x",
      `${x * 14}px`,
    );

    page.style.setProperty(
      "--move-y",
      `${y * 10}px`,
    );
  }

  /* =====================================
     JSX
  ===================================== */

  return (
    <>
      <style>
        {resumeStyles}
      </style>

      <CandidateHeader />

      <main
        ref={pageRef}
        className="resume-page"
        onPointerMove={
          handlePointerMove
        }
      >
        <div
          className="resume-shape resume-shape--pink"
          aria-hidden="true"
        />

        <div
          className="resume-shape resume-shape--blue"
          aria-hidden="true"
        />

        {/* HEADER */}

        <header className="resume-header">
          <button
            type="button"
            className="resume-back"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeftIcon />

            <span>
              Voltar
            </span>
          </button>

          <button
            type="button"
            className="resume-logo"
            onClick={() =>
              navigate("/")
            }
          >
            <img
              src={Logo}
              alt="Point"
            />
          </button>

          <div className="resume-header-actions">
            <div
              className={`save-status save-status--${savedState}`}
            >
              {savedState ===
              "saving" ? (
                <>
                  <span className="saving-dot" />
                  Salvando...
                </>
              ) : savedState ===
                "error" ? (
                <>
                  <AlertIcon />
                  Erro ao salvar
                </>
              ) : (
                <>
                  <CheckIcon />
                  Salvo automaticamente
                </>
              )}
            </div>

            <button
              type="button"
              className="header-preview-button"
              onClick={() =>
                setPreviewMobile(
                  true,
                )
              }
            >
              <EyeIcon />

              <span>
                Visualizar
              </span>
            </button>

            <button
              type="button"
              className="header-save-button"
              onClick={
                salvarRascunho
              }
            >
              <SaveIcon />

              Salvar
            </button>
          </div>
        </header>

        {/* LAYOUT */}

        <div className="resume-layout">
          {/* ==========================
              NAVEGAÇÃO ESQUERDA
          ========================== */}

          <aside className="resume-navigation">
            <div className="navigation-progress">
              <div className="progress-circle">
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    className="progress-circle-bg"
                  />

                  <motion.circle
                    cx="60"
                    cy="60"
                    r="48"
                    className="progress-circle-value"
                    animate={{
                      pathLength:
                        completion /
                        100,
                    }}
                    transition={{
                      duration: 0.5,
                    }}
                  />
                </svg>

                <span>
                  <strong>
                    {completion}%
                  </strong>

                  pronto
                </span>
              </div>

              <div className="navigation-progress-copy">
                <strong>
                  Seu currículo
                </strong>

                <span>
                  {completion >= 85
                    ? "Está ficando excelente!"
                    : completion >= 55
                      ? "Você está no caminho certo."
                      : "Vamos construir seu perfil."}
                </span>
              </div>
            </div>

            <nav
              ref={
                navigationRef
              }
              className="section-navigation"
            >
              {SECTIONS.map(
                (
                  section,
                  index,
                ) => (
                  <button
                    key={
                      section.id
                    }
                    data-section={
                      section.id
                    }
                    type="button"
                    className={
                      activeSection ===
                      section.id
                        ? "section-nav-item section-nav-item--active"
                        : "section-nav-item"
                    }
                    onClick={() =>
                      scrollToSection(
                        section.id,
                      )
                    }
                  >
                    <span className="section-nav-number">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <span className="section-nav-icon">
                      <DynamicIcon
                        name={
                          section.icon
                        }
                      />
                    </span>

                    <span className="section-nav-label">
                      {
                        section.label
                      }
                    </span>
                  </button>
                ),
              )}
            </nav>

            <div className="keyboard-tip">
              <KeyboardIcon />

              <div>
                <strong>
                  Atalho rápido
                </strong>

                <span>
                  Use{" "}
                  <kbd>
                    Ctrl
                  </kbd>{" "}
                  +{" "}
                  <kbd>
                    S
                  </kbd>{" "}
                  para salvar.
                </span>
              </div>
            </div>

            <button
              type="button"
              className="clear-resume-button"
              onClick={
                limparCurriculo
              }
            >
              <TrashIcon />

              Limpar currículo
            </button>
          </aside>

          {/* ==========================
              EDITOR CENTRAL
          ========================== */}

          <div className="resume-editor">
            <section className="editor-intro">
              <span className="editor-kicker">
                <SparklesIcon />

                Construtor de currículo
              </span>

              <h1>
                Conte sua
                <br />

                <strong>
                  história profissional.
                </strong>
              </h1>

              <p>
                Preencha apenas o
                necessário. Nós
                organizamos tudo para
                deixar seu currículo
                claro, profissional e
                pronto para apresentar.
              </p>
            </section>

            {/* DADOS PESSOAIS */}

            <ResumeSection
              id="dados"
              number="01"
              title="Informações pessoais"
              description="Os dados essenciais para empresas reconhecerem e entrarem em contato com você."
              icon={
                <UserIcon />
              }
              onVisible={
                setActiveSection
              }
            >
              <div className="personal-section-grid">
                <div className="personal-fields">
                  <div className="two-column-grid">
                    <Field
                      label="Nome completo"
                      error={
                        erros[
                          "pessoal.nome"
                        ]
                      }
                    >
                      <TextInput
                        icon={
                          <UserIcon />
                        }
                        value={
                          data
                            .pessoal
                            .nome
                        }
                        placeholder="Seu nome completo"
                        onChange={(
                          event,
                        ) =>
                          updatePersonal(
                            "nome",
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </Field>

                    <Field
                      label="Área profissional"
                      error={
                        erros[
                          "pessoal.area"
                        ]
                      }
                    >
                      <TextInput
                        icon={
                          <BriefcaseIcon />
                        }
                        value={
                          data
                            .pessoal
                            .area
                        }
                        placeholder="Ex: Desenvolvimento Front-end"
                        onChange={(
                          event,
                        ) =>
                          updatePersonal(
                            "area",
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </Field>
                  </div>

                  <div className="two-column-grid">
                    <Field
                      label="E-mail"
                      error={
                        erros[
                          "pessoal.email"
                        ]
                      }
                    >
                      <TextInput
                        icon={
                          <MailIcon />
                        }
                        type="email"
                        value={
                          data
                            .pessoal
                            .email
                        }
                        placeholder="seunome@email.com"
                        onChange={(
                          event,
                        ) =>
                          updatePersonal(
                            "email",
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </Field>

                    <Field label="Telefone">
                      <TextInput
                        icon={
                          <PhoneIcon />
                        }
                        value={
                          data
                            .pessoal
                            .telefone
                        }
                        placeholder="(00) 00000-0000"
                        onChange={(
                          event,
                        ) =>
                          updatePersonal(
                            "telefone",
                            formatPhone(
                              event
                                .target
                                .value,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Cidade / Estado">
                    <TextInput
                      icon={
                        <MapPinIcon />
                      }
                      value={
                        data
                          .pessoal
                          .cidade
                      }
                      placeholder="Ex: Tatuí, SP"
                      onChange={(
                        event,
                      ) =>
                        updatePersonal(
                          "cidade",
                          event
                            .target
                            .value,
                        )
                      }
                    />
                  </Field>

                  <div className="links-box">
                    <div className="links-box-title">
                      <LinkIcon />

                      <div>
                        <strong>
                          Links profissionais
                        </strong>

                        <span>
                          Todos são
                          opcionais.
                        </span>
                      </div>
                    </div>

                    <div className="three-column-grid">
                      <TextInput
                        value={
                          data
                            .pessoal
                            .linkedin
                        }
                        placeholder="LinkedIn"
                        onChange={(
                          event,
                        ) =>
                          updatePersonal(
                            "linkedin",
                            event
                              .target
                              .value,
                          )
                        }
                      />

                      <TextInput
                        value={
                          data
                            .pessoal
                            .github
                        }
                        placeholder="GitHub"
                        onChange={(
                          event,
                        ) =>
                          updatePersonal(
                            "github",
                            event
                              .target
                              .value,
                          )
                        }
                      />

                      <TextInput
                        value={
                          data
                            .pessoal
                            .portfolio
                        }
                        placeholder="Portfólio"
                        onChange={(
                          event,
                        ) =>
                          updatePersonal(
                            "portfolio",
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <PhotoUpload
                  foto={foto}
                  initials={
                    initials
                  }
                  onChange={
                    handlePhoto
                  }
                  onRemove={
                    removerFoto
                  }
                />
              </div>
            </ResumeSection>

            {/* RESUMO */}

            <ResumeSection
              id="resumo"
              number="02"
              title="Resumo profissional"
              description="Em poucos segundos, mostre quem você é profissionalmente e o que busca."
              icon={
                <FileIcon />
              }
              onVisible={
                setActiveSection
              }
            >
              <Field
                label="Apresentação"
                error={
                  erros.resumo
                }
              >
                <div className="summary-wrapper">
                  <textarea
                    className="resume-textarea resume-textarea--summary"
                    value={
                      data.resumo
                    }
                    onChange={(
                      event,
                    ) =>
                      updateResumo(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Ex: Desenvolvedor em formação com experiência em React e Laravel, interessado em criar produtos digitais claros, rápidos e intuitivos..."
                  />

                  <span className="character-counter">
                    {
                      data.resumo
                        .length
                    }
                    /600
                  </span>
                </div>
              </Field>

              <div className="resume-tip">
                <span>
                  <LightbulbIcon />
                </span>

                <div>
                  <strong>
                    Uma boa fórmula
                  </strong>

                  <p>
                    Diga sua área,
                    experiência,
                    principais
                    habilidades e o
                    tipo de desafio
                    que procura.
                  </p>
                </div>
              </div>
            </ResumeSection>

            {/* EXPERIÊNCIAS */}

            <ResumeSection
              id="experiencias"
              number="03"
              title="Experiência profissional"
              description="Mostre onde trabalhou e, principalmente, o impacto que gerou."
              icon={
                <BriefcaseIcon />
              }
              onVisible={
                setActiveSection
              }
            >
              <div className="dynamic-list">
                <AnimatePresence>
                  {data.experiencias.map(
                    (
                      experiencia,
                      index,
                    ) => (
                      <DynamicCard
                        key={
                          experiencia.id
                        }
                        title={`Experiência ${
                          index +
                          1
                        }`}
                        index={
                          index
                        }
                        total={
                          data
                            .experiencias
                            .length
                        }
                        accent="#64c7ee"
                        onRemove={() =>
                          removeArrayItem(
                            "experiencias",
                            experiencia.id,
                          )
                        }
                        onDuplicate={() =>
                          duplicateArrayItem(
                            "experiencias",
                            experiencia.id,
                          )
                        }
                        onUp={() =>
                          moveArrayItem(
                            "experiencias",
                            index,
                            -1,
                          )
                        }
                        onDown={() =>
                          moveArrayItem(
                            "experiencias",
                            index,
                            1,
                          )
                        }
                      >
                        <div className="two-column-grid">
                          <Field label="Cargo">
                            <TextInput
                              value={
                                experiencia.cargo
                              }
                              placeholder="Ex: Desenvolvedor Front-end"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "experiencias",
                                  experiencia.id,
                                  "cargo",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <Field label="Empresa">
                            <TextInput
                              value={
                                experiencia.empresa
                              }
                              placeholder="Nome da empresa"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "experiencias",
                                  experiencia.id,
                                  "empresa",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>
                        </div>

                        <div className="experience-date-grid">
                          <Field label="Início">
                            <TextInput
                              type="month"
                              value={
                                experiencia.inicio
                              }
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "experiencias",
                                  experiencia.id,
                                  "inicio",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <Field label="Fim">
                            <TextInput
                              type="month"
                              value={
                                experiencia.atual
                                  ? ""
                                  : experiencia.fim
                              }
                              disabled={
                                experiencia.atual
                              }
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "experiencias",
                                  experiencia.id,
                                  "fim",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <label className="current-job-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                experiencia.atual
                              }
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "experiencias",
                                  experiencia.id,
                                  "atual",
                                  event
                                    .target
                                    .checked,
                                )
                              }
                            />

                            <span>
                              <CheckIcon />
                            </span>

                            Trabalho
                            atualmente
                            aqui
                          </label>
                        </div>

                        <Field label="Principais responsabilidades e resultados">
                          <textarea
                            className="resume-textarea"
                            value={
                              experiencia.descricao
                            }
                            onChange={(
                              event,
                            ) =>
                              updateArrayItem(
                                "experiencias",
                                experiencia.id,
                                "descricao",
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Ex: Desenvolvi novas interfaces em React, reduzi o tempo de carregamento em 30% e participei da criação de componentes reutilizáveis..."
                          />
                        </Field>
                      </DynamicCard>
                    ),
                  )}
                </AnimatePresence>
              </div>

              <AddButton
                label="Adicionar experiência"
                onClick={() =>
                  addArrayItem(
                    "experiencias",
                    {
                      cargo: "",
                      empresa: "",
                      inicio: "",
                      fim: "",
                      atual:
                        false,
                      descricao:
                        "",
                    },
                  )
                }
              />
            </ResumeSection>

            {/* FORMAÇÃO */}

            <ResumeSection
              id="formacao"
              number="04"
              title="Formação acadêmica"
              description="Inclua graduação, curso técnico, ensino médio ou outras formações relevantes."
              icon={
                <EducationIcon />
              }
              onVisible={
                setActiveSection
              }
            >
              <div className="dynamic-list">
                <AnimatePresence>
                  {data.formacoes.map(
                    (
                      formacao,
                      index,
                    ) => (
                      <DynamicCard
                        key={
                          formacao.id
                        }
                        title={`Formação ${
                          index +
                          1
                        }`}
                        index={
                          index
                        }
                        total={
                          data
                            .formacoes
                            .length
                        }
                        accent="#ffd447"
                        onRemove={() =>
                          removeArrayItem(
                            "formacoes",
                            formacao.id,
                          )
                        }
                        onDuplicate={() =>
                          duplicateArrayItem(
                            "formacoes",
                            formacao.id,
                          )
                        }
                        onUp={() =>
                          moveArrayItem(
                            "formacoes",
                            index,
                            -1,
                          )
                        }
                        onDown={() =>
                          moveArrayItem(
                            "formacoes",
                            index,
                            1,
                          )
                        }
                      >
                        <div className="two-column-grid">
                          <Field label="Curso">
                            <TextInput
                              value={
                                formacao.curso
                              }
                              placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "formacoes",
                                  formacao.id,
                                  "curso",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <Field label="Instituição">
                            <TextInput
                              value={
                                formacao.instituicao
                              }
                              placeholder="Ex: Fatec"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "formacoes",
                                  formacao.id,
                                  "instituicao",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>
                        </div>

                        <div className="two-column-grid">
                          <Field label="Início">
                            <TextInput
                              type="month"
                              value={
                                formacao.inicio
                              }
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "formacoes",
                                  formacao.id,
                                  "inicio",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <Field label="Conclusão / previsão">
                            <TextInput
                              type="month"
                              value={
                                formacao.fim
                              }
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "formacoes",
                                  formacao.id,
                                  "fim",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>
                        </div>
                      </DynamicCard>
                    ),
                  )}
                </AnimatePresence>
              </div>

              <AddButton
                label="Adicionar formação"
                onClick={() =>
                  addArrayItem(
                    "formacoes",
                    {
                      curso: "",
                      instituicao:
                        "",
                      inicio: "",
                      fim: "",
                    },
                  )
                }
              />
            </ResumeSection>

            {/* CURSOS */}

            <ResumeSection
              id="cursos"
              number="05"
              title="Cursos complementares"
              description="Destaque certificações e conhecimentos que fortalecem seu perfil."
              icon={
                <CertificateIcon />
              }
              onVisible={
                setActiveSection
              }
            >
              <div className="dynamic-list">
                <AnimatePresence>
                  {data.cursos.map(
                    (
                      curso,
                      index,
                    ) => (
                      <DynamicCard
                        key={
                          curso.id
                        }
                        title={`Curso ${
                          index +
                          1
                        }`}
                        index={
                          index
                        }
                        total={
                          data
                            .cursos
                            .length
                        }
                        accent="#baf26d"
                        compact
                        onRemove={() =>
                          removeArrayItem(
                            "cursos",
                            curso.id,
                          )
                        }
                        onDuplicate={() =>
                          duplicateArrayItem(
                            "cursos",
                            curso.id,
                          )
                        }
                        onUp={() =>
                          moveArrayItem(
                            "cursos",
                            index,
                            -1,
                          )
                        }
                        onDown={() =>
                          moveArrayItem(
                            "cursos",
                            index,
                            1,
                          )
                        }
                      >
                        <div className="two-column-grid">
                          <Field label="Curso">
                            <TextInput
                              value={
                                curso.nome
                              }
                              placeholder="Nome do curso"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "cursos",
                                  curso.id,
                                  "nome",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <Field label="Instituição">
                            <TextInput
                              value={
                                curso.instituicao
                              }
                              placeholder="Instituição"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "cursos",
                                  curso.id,
                                  "instituicao",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>
                        </div>

                        <div className="two-column-grid">
                          <Field label="Ano">
                            <TextInput
                              value={
                                curso.ano
                              }
                              placeholder="2026"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "cursos",
                                  curso.id,
                                  "ano",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <Field label="Carga horária">
                            <TextInput
                              value={
                                curso.carga
                              }
                              placeholder="Ex: 40 horas"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "cursos",
                                  curso.id,
                                  "carga",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>
                        </div>
                      </DynamicCard>
                    ),
                  )}
                </AnimatePresence>
              </div>

              <AddButton
                label="Adicionar curso"
                onClick={() =>
                  addArrayItem(
                    "cursos",
                    {
                      nome: "",
                      instituicao:
                        "",
                      ano: "",
                      carga: "",
                    },
                  )
                }
              />
            </ResumeSection>

            {/* HABILIDADES */}

            <ResumeSection
              id="habilidades"
              number="06"
              title="Habilidades"
              description="Adicione tecnologias, ferramentas e competências que realmente representam você."
              icon={
                <SparklesIcon />
              }
              onVisible={
                setActiveSection
              }
            >
              <Field
                label="Adicionar habilidade"
                error={
                  erros.habilidades
                }
              >
                <div className="skill-input-wrapper">
                  <SparklesIcon />

                  <input
                    value={
                      skillInput
                    }
                    onChange={(
                      event,
                    ) =>
                      setSkillInput(
                        event
                          .target
                          .value,
                      )
                    }
                    onKeyDown={
                      handleSkillKeyDown
                    }
                    placeholder="Ex: React, Laravel, Figma..."
                  />

                  <button
                    type="button"
                    onClick={
                      addSkill
                    }
                  >
                    <PlusIcon />

                    Adicionar
                  </button>
                </div>
              </Field>

              <div className="skills-help">
                Pressione{" "}
                <kbd>
                  Enter
                </kbd>{" "}
                depois de cada
                habilidade.
              </div>

              {data.habilidades
                .length > 0 ? (
                <div className="skills-list">
                  <AnimatePresence>
                    {data.habilidades.map(
                      (
                        skill,
                        index,
                      ) => (
                        <motion.button
                          layout
                          key={
                            skill
                          }
                          type="button"
                          className="skill-chip"
                          initial={{
                            opacity:
                              0,
                            scale:
                              0.8,
                          }}
                          animate={{
                            opacity:
                              1,
                            scale:
                              1,
                          }}
                          exit={{
                            opacity:
                              0,
                            scale:
                              0.8,
                          }}
                          onClick={() =>
                            removeSkill(
                              skill,
                            )
                          }
                          title="Clique para remover"
                        >
                          <span>
                            {String(
                              index +
                                1,
                            ).padStart(
                              2,
                              "0",
                            )}
                          </span>

                          {skill}

                          <CloseIcon />
                        </motion.button>
                      ),
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="skills-empty">
                  Suas habilidades
                  aparecerão aqui.
                </div>
              )}
            </ResumeSection>

            {/* IDIOMAS */}

            <ResumeSection
              id="idiomas"
              number="07"
              title="Idiomas"
              description="Informe os idiomas que conhece e seu nível atual de domínio."
              icon={
                <LanguageIcon />
              }
              onVisible={
                setActiveSection
              }
            >
              <div className="dynamic-list">
                <AnimatePresence>
                  {data.idiomas.map(
                    (
                      idioma,
                      index,
                    ) => (
                      <DynamicCard
                        key={
                          idioma.id
                        }
                        title={`Idioma ${
                          index +
                          1
                        }`}
                        index={
                          index
                        }
                        total={
                          data
                            .idiomas
                            .length
                        }
                        accent="#9183ff"
                        compact
                        onRemove={() =>
                          removeArrayItem(
                            "idiomas",
                            idioma.id,
                          )
                        }
                        onDuplicate={() =>
                          duplicateArrayItem(
                            "idiomas",
                            idioma.id,
                          )
                        }
                        onUp={() =>
                          moveArrayItem(
                            "idiomas",
                            index,
                            -1,
                          )
                        }
                        onDown={() =>
                          moveArrayItem(
                            "idiomas",
                            index,
                            1,
                          )
                        }
                      >
                        <div className="two-column-grid">
                          <Field label="Idioma">
                            <TextInput
                              value={
                                idioma.idioma
                              }
                              placeholder="Ex: Inglês"
                              onChange={(
                                event,
                              ) =>
                                updateArrayItem(
                                  "idiomas",
                                  idioma.id,
                                  "idioma",
                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </Field>

                          <Field label="Nível">
                            <div className="select-shell">
                              <select
                                value={
                                  idioma.nivel
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateArrayItem(
                                    "idiomas",
                                    idioma.id,
                                    "nivel",
                                    event
                                      .target
                                      .value,
                                  )
                                }
                              >
                                {NIVEL_IDIOMA.map(
                                  (
                                    nivel,
                                  ) => (
                                    <option
                                      key={
                                        nivel
                                      }
                                      value={
                                        nivel
                                      }
                                    >
                                      {
                                        nivel
                                      }
                                    </option>
                                  ),
                                )}
                              </select>

                              <ChevronDownIcon />
                            </div>
                          </Field>
                        </div>
                      </DynamicCard>
                    ),
                  )}
                </AnimatePresence>
              </div>

              <AddButton
                label="Adicionar idioma"
                onClick={() =>
                  addArrayItem(
                    "idiomas",
                    {
                      idioma: "",
                      nivel:
                        "Intermediário",
                    },
                  )
                }
              />
            </ResumeSection>

            {/* FINAL */}

            <section className="finish-section">
              <div className="finish-decoration">
                <SparklesIcon />
              </div>

              <span className="finish-kicker">
                Última etapa
              </span>

              <h2>
                Seu currículo está
                <br />
                tomando forma.
              </h2>

              <p>
                Você pode continuar
                editando, salvar o
                rascunho ou gerar a
                versão pronta para
                impressão.
              </p>

              <div className="finish-progress">
                <div>
                  <span>
                    Progresso
                  </span>

                  <strong>
                    {completion}%
                  </strong>
                </div>

                <div className="finish-progress-bar">
                  <span
                    style={{
                      width: `${completion}%`,
                    }}
                  />
                </div>
              </div>

              <div className="finish-actions">
                <button
                  type="button"
                  className="finish-secondary"
                  onClick={
                    salvarRascunho
                  }
                >
                  <SaveIcon />
                  Salvar rascunho
                </button>

                <button
                  type="button"
                  className="finish-primary"
                  onClick={
                    imprimirCurriculo
                  }
                >
                  <PrinterIcon />
                  Gerar currículo
                </button>
              </div>
            </section>
          </div>

          {/* ==========================
              PREVIEW STICKY
          ========================== */}

          <aside className="resume-preview-column">
            <div className="preview-sticky">
              <div className="preview-toolbar">
                <div>
                  <span>
                    Preview ao vivo
                  </span>

                  <strong>
                    Seu currículo
                  </strong>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={
                      copiarCurriculo
                    }
                    title="Copiar currículo como texto"
                  >
                    <CopyIcon />
                  </button>

                  <button
                    type="button"
                    onClick={
                      imprimirCurriculo
                    }
                    title="Imprimir ou salvar como PDF"
                  >
                    <PrinterIcon />
                  </button>
                </div>
              </div>

              <ResumePreview
                data={data}
                foto={foto}
                initials={
                  initials
                }
              />

              <div className="preview-hint">
                <EyeIcon />

                <span>
                  Tudo que você
                  preencher aparece
                  aqui automaticamente.
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* PREVIEW MOBILE */}

        <AnimatePresence>
          {previewMobile && (
            <motion.div
              className="mobile-preview-overlay"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onMouseDown={(
                event,
              ) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setPreviewMobile(
                    false,
                  );
                }
              }}
            >
              <motion.div
                className="mobile-preview"
                initial={{
                  y: "100%",
                }}
                animate={{
                  y: 0,
                }}
                exit={{
                  y: "100%",
                }}
                transition={{
                  type:
                    "spring",
                  stiffness:
                    260,
                  damping: 28,
                }}
              >
                <div className="mobile-preview-header">
                  <div>
                    <span>
                      Preview
                    </span>

                    <strong>
                      Seu currículo
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewMobile(
                        false,
                      )
                    }
                  >
                    <CloseIcon />
                  </button>
                </div>

                <ResumePreview
                  data={data}
                  foto={foto}
                  initials={
                    initials
                  }
                />

                <div className="mobile-preview-actions">
                  <button
                    type="button"
                    onClick={
                      copiarCurriculo
                    }
                  >
                    <CopyIcon />
                    Copiar
                  </button>

                  <button
                    type="button"
                    onClick={
                      imprimirCurriculo
                    }
                  >
                    <PrinterIcon />
                    Gerar PDF
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOAST */}

        <AnimatePresence>
          {toast && (
            <motion.div
              className="resume-toast"
              role="status"
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 14,
              }}
            >
              <span>
                <CheckIcon />
              </span>

              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function ResumeSection({
  id,
  number,
  title,
  description,
  icon,
  children,
  onVisible,
}) {
  return (
    <motion.section
      id={`resume-${id}`}
      className="resume-section"
      onViewportEnter={() =>
        onVisible(id)
      }
      viewport={{
        amount: 0.28,
      }}
      initial={{
        opacity: 0,
        y: 25,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
    >
      <header className="resume-section-header">
        <div className="section-title-icon">
          {icon}
        </div>

        <div>
          <span className="section-number">
            Etapa {number}
          </span>

          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>
        </div>
      </header>

      <div className="resume-section-content">
        {children}
      </div>
    </motion.section>
  );
}

function DynamicCard({
  title,
  index,
  total,
  accent,
  onRemove,
  onDuplicate,
  onUp,
  onDown,
  children,
  compact = false,
}) {
  return (
    <motion.article
      layout
      className={
        compact
          ? "dynamic-card dynamic-card--compact"
          : "dynamic-card"
      }
      style={{
        "--dynamic-accent":
          accent,
      }}
      initial={{
        opacity: 0,
        scale: 0.97,
        y: 12,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.96,
        y: -10,
      }}
    >
      <div className="dynamic-card-header">
        <div>
          <span className="dynamic-card-index">
            {String(
              index + 1,
            ).padStart(
              2,
              "0",
            )}
          </span>

          <strong>
            {title}
          </strong>
        </div>

        <div className="dynamic-actions">
          <button
            type="button"
            onClick={onUp}
            disabled={
              index === 0
            }
            title="Mover para cima"
          >
            <ArrowUpIcon />
          </button>

          <button
            type="button"
            onClick={onDown}
            disabled={
              index ===
              total - 1
            }
            title="Mover para baixo"
          >
            <ArrowDownIcon />
          </button>

          <button
            type="button"
            onClick={
              onDuplicate
            }
            title="Duplicar"
          >
            <CopyIcon />
          </button>

          <button
            type="button"
            onClick={
              onRemove
            }
            className="danger-action"
            title="Remover"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="dynamic-card-body">
        {children}
      </div>
    </motion.article>
  );
}

function Field({
  label,
  children,
  error,
}) {
  return (
    <label className="field-group">
      <span className="field-label">
        {label}
      </span>

      {children}

      {error && (
        <span className="field-error">
          <AlertIcon />

          {error}
        </span>
      )}
    </label>
  );
}

function TextInput({
  icon,
  ...props
}) {
  return (
    <div className="input-shell">
      {icon && (
        <span className="input-icon">
          {icon}
        </span>
      )}

      <input
        {...props}
        className={
          icon
            ? "resume-input resume-input--with-icon"
            : "resume-input"
        }
      />
    </div>
  );
}

function PhotoUpload({
  foto,
  initials,
  onChange,
  onRemove,
}) {
  return (
    <div className="photo-upload-card">
      <span className="photo-upload-label">
        Foto profissional
      </span>

      <div className="photo-preview">
        {foto ? (
          <img
            src={foto}
            alt="Preview"
          />
        ) : (
          <span>
            {initials}
          </span>
        )}
      </div>

      <p>
        Uma foto é opcional,
        mas pode ajudar a deixar
        seu perfil mais pessoal.
      </p>

      <label className="photo-select-button">
        <UploadIcon />

        {foto
          ? "Trocar foto"
          : "Enviar foto"}

        <input
          type="file"
          accept="image/*"
          onChange={
            onChange
          }
        />
      </label>

      {foto && (
        <button
          type="button"
          className="photo-remove-button"
          onClick={
            onRemove
          }
        >
          Remover foto
        </button>
      )}

      <small>
        JPG ou PNG · máximo 3 MB
      </small>
    </div>
  );
}

function AddButton({
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      className="add-item-button"
      onClick={onClick}
    >
      <span>
        <PlusIcon />
      </span>

      {label}
    </button>
  );
}

/* =========================================================
   PREVIEW
========================================================= */

function ResumePreview({
  data,
  foto,
  initials,
}) {
  const experiences =
    data.experiencias.filter(
      (item) =>
        item.cargo ||
        item.empresa ||
        item.descricao,
    );

  const formations =
    data.formacoes.filter(
      (item) =>
        item.curso ||
        item.instituicao,
    );

  const courses =
    data.cursos.filter(
      (item) =>
        item.nome ||
        item.instituicao,
    );

  const languages =
    data.idiomas.filter(
      (item) =>
        item.idioma,
    );

  return (
    <article
      id="resume-print-area"
      className="resume-paper"
    >
      <header className="paper-header">
        <div className="paper-photo">
          {foto ? (
            <img
              src={foto}
              alt=""
            />
          ) : (
            <span>
              {initials}
            </span>
          )}
        </div>

        <div className="paper-identity">
          <h2>
            {data.pessoal.nome ||
              "Seu nome"}
          </h2>

          <strong>
            {data.pessoal.area ||
              "Área profissional"}
          </strong>

          <div className="paper-contact">
            {data.pessoal.email && (
              <span>
                {
                  data.pessoal
                    .email
                }
              </span>
            )}

            {data.pessoal.telefone && (
              <span>
                {
                  data.pessoal
                    .telefone
                }
              </span>
            )}

            {data.pessoal.cidade && (
              <span>
                {
                  data.pessoal
                    .cidade
                }
              </span>
            )}
          </div>
        </div>
      </header>

      {(data.pessoal.linkedin ||
        data.pessoal.github ||
        data.pessoal.portfolio) && (
        <div className="paper-links">
          {data.pessoal.linkedin && (
            <span>
              LinkedIn:{" "}
              {
                data.pessoal
                  .linkedin
              }
            </span>
          )}

          {data.pessoal.github && (
            <span>
              GitHub:{" "}
              {
                data.pessoal
                  .github
              }
            </span>
          )}

          {data.pessoal.portfolio && (
            <span>
              Portfólio:{" "}
              {
                data.pessoal
                  .portfolio
              }
            </span>
          )}
        </div>
      )}

      {data.resumo && (
        <PaperSection title="Resumo profissional">
          <p className="paper-paragraph">
            {data.resumo}
          </p>
        </PaperSection>
      )}

      {experiences.length > 0 && (
        <PaperSection title="Experiência profissional">
          <div className="paper-list">
            {experiences.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="paper-list-item"
                >
                  <div className="paper-list-heading">
                    <div>
                      <strong>
                        {item.cargo ||
                          "Cargo"}
                      </strong>

                      <span>
                        {
                          item.empresa
                        }
                      </span>
                    </div>

                    <small>
                      {formatPeriod(
                        item.inicio,
                        item.fim,
                        item.atual,
                      )}
                    </small>
                  </div>

                  {item.descricao && (
                    <p>
                      {
                        item.descricao
                      }
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </PaperSection>
      )}

      {formations.length > 0 && (
        <PaperSection title="Formação acadêmica">
          <div className="paper-list">
            {formations.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="paper-list-item"
                >
                  <div className="paper-list-heading">
                    <div>
                      <strong>
                        {item.curso ||
                          "Curso"}
                      </strong>

                      <span>
                        {
                          item.instituicao
                        }
                      </span>
                    </div>

                    <small>
                      {formatPeriod(
                        item.inicio,
                        item.fim,
                      )}
                    </small>
                  </div>
                </div>
              ),
            )}
          </div>
        </PaperSection>
      )}

      {data.habilidades
        .length > 0 && (
        <PaperSection title="Habilidades">
          <div className="paper-skills">
            {data.habilidades.map(
              (skill) => (
                <span
                  key={
                    skill
                  }
                >
                  {skill}
                </span>
              ),
            )}
          </div>
        </PaperSection>
      )}

      {(courses.length > 0 ||
        languages.length > 0) && (
        <div className="paper-two-columns">
          {courses.length > 0 && (
            <PaperSection title="Cursos">
              <div className="paper-mini-list">
                {courses.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                    >
                      <strong>
                        {
                          item.nome
                        }
                      </strong>

                      <span>
                        {
                          item.instituicao
                        }

                        {item.ano
                          ? ` · ${item.ano}`
                          : ""}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </PaperSection>
          )}

          {languages.length > 0 && (
            <PaperSection title="Idiomas">
              <div className="paper-mini-list">
                {languages.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                    >
                      <strong>
                        {
                          item.idioma
                        }
                      </strong>

                      <span>
                        {
                          item.nivel
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            </PaperSection>
          )}
        </div>
      )}
    </article>
  );
}

function PaperSection({
  title,
  children,
}) {
  return (
    <section className="paper-section">
      <h3>
        {title}
      </h3>

      {children}
    </section>
  );
}

function DynamicIcon({
  name,
}) {
  switch (name) {
    case "user":
      return <UserIcon />;

    case "file":
      return <FileIcon />;

    case "briefcase":
      return <BriefcaseIcon />;

    case "education":
      return <EducationIcon />;

    case "certificate":
      return <CertificateIcon />;

    case "sparkles":
      return <SparklesIcon />;

    case "language":
      return <LanguageIcon />;

    default:
      return <FileIcon />;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function calcularProgresso(data) {
  let total = 0;

  if (
    data.pessoal.nome.trim()
  ) {
    total += 10;
  }

  if (
    data.pessoal.email.trim()
  ) {
    total += 7;
  }

  if (
    data.pessoal.telefone.trim()
  ) {
    total += 5;
  }

  if (
    data.pessoal.cidade.trim()
  ) {
    total += 5;
  }

  if (
    data.pessoal.area.trim()
  ) {
    total += 8;
  }

  if (
    data.resumo.trim().length >
    50
  ) {
    total += 15;
  } else if (
    data.resumo.trim()
  ) {
    total += 7;
  }

  if (
    data.experiencias.some(
      (item) =>
        item.cargo &&
        item.empresa,
    )
  ) {
    total += 15;
  }

  if (
    data.formacoes.some(
      (item) =>
        item.curso &&
        item.instituicao,
    )
  ) {
    total += 13;
  }

  if (
    data.cursos.some(
      (item) =>
        item.nome,
    )
  ) {
    total += 5;
  }

  if (
    data.habilidades.length >=
    3
  ) {
    total += 10;
  } else if (
    data.habilidades.length > 0
  ) {
    total += 5;
  }

  if (
    data.idiomas.some(
      (item) =>
        item.idioma,
    )
  ) {
    total += 7;
  }

  return Math.min(
    total,
    100,
  );
}

function formatPhone(value) {
  const numbers = value
    .replace(/\D/g, "")
    .slice(0, 11);

  if (!numbers) {
    return "";
  }

  if (numbers.length <= 2) {
    return `(${numbers}`;
  }

  if (numbers.length <= 6) {
    return `(${numbers.slice(
      0,
      2,
    )}) ${numbers.slice(2)}`;
  }

  if (numbers.length <= 10) {
    return `(${numbers.slice(
      0,
      2,
    )}) ${numbers.slice(
      2,
      6,
    )}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(
    0,
    2,
  )}) ${numbers.slice(
    2,
    7,
  )}-${numbers.slice(7)}`;
}

function formatPeriod(
  start,
  end,
  current = false,
) {
  const initial =
    formatMonth(start);

  const final = current
    ? "Atual"
    : formatMonth(end);

  if (
    !initial &&
    !final
  ) {
    return "";
  }

  return `${initial || "—"} — ${
    final || "—"
  }`;
}

function formatMonth(value) {
  if (!value) return "";

  const [year, month] =
    value.split("-");

  const names = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];

  return `${
    names[
      Number(month) - 1
    ] || ""
  }/${year}`;
}

function gerarCurriculoTexto(
  data,
) {
  const lines = [];

  lines.push(
    data.pessoal.nome,
  );

  lines.push(
    data.pessoal.area,
  );

  lines.push(
    [
      data.pessoal.email,
      data.pessoal.telefone,
      data.pessoal.cidade,
    ]
      .filter(Boolean)
      .join(" | "),
  );

  if (data.pessoal.linkedin) {
    lines.push(
      data.pessoal.linkedin,
    );
  }

  if (data.pessoal.github) {
    lines.push(
      data.pessoal.github,
    );
  }

  if (data.pessoal.portfolio) {
    lines.push(
      data.pessoal.portfolio,
    );
  }

  if (data.resumo) {
    lines.push(
      "",
      "RESUMO PROFISSIONAL",
      data.resumo,
    );
  }

  const experiencias =
    data.experiencias.filter(
      (item) =>
        item.cargo ||
        item.empresa,
    );

  if (experiencias.length) {
    lines.push(
      "",
      "EXPERIÊNCIA PROFISSIONAL",
    );

    experiencias.forEach(
      (item) => {
        lines.push(
          `${item.cargo} - ${item.empresa}`,
          formatPeriod(
            item.inicio,
            item.fim,
            item.atual,
          ),
          item.descricao,
          "",
        );
      },
    );
  }

  const formacoes =
    data.formacoes.filter(
      (item) =>
        item.curso ||
        item.instituicao,
    );

  if (formacoes.length) {
    lines.push(
      "",
      "FORMAÇÃO ACADÊMICA",
    );

    formacoes.forEach(
      (item) => {
        lines.push(
          `${item.curso} - ${item.instituicao}`,
          formatPeriod(
            item.inicio,
            item.fim,
          ),
          "",
        );
      },
    );
  }

  if (
    data.habilidades.length
  ) {
    lines.push(
      "",
      "HABILIDADES",
      data.habilidades.join(
        ", ",
      ),
    );
  }

  return lines
    .filter(
      (line) =>
        line !== undefined,
    )
    .join("\n");
}

/* =========================================================
   CSS
========================================================= */

const resumeStyles = `
:root {
  color-scheme: light;
}

html,
body,
#root {
  min-height: 100%;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: #f5f1e9;
}

button,
input,
textarea,
select {
  font: inherit;
}

.resume-page,
.resume-page * {
  box-sizing: border-box;
}

.resume-page {
  --paper: #f5f1e9;
  --paper-light: #fffdf8;
  --ink: #17171a;
  --pink: #ff4f8b;
  --blue: #64c7ee;
  --yellow: #ffd447;
  --lime: #baf26d;
  --violet: #9183ff;
  --orange: #ff9466;
  --muted: #716a64;

  --move-x: 0px;
  --move-y: 0px;

  position: relative;

  min-height: 100vh;

  /*
    IMPORTANTE:
    overflow:hidden quebrava o position:sticky.

    overflow-x:clip corta as decorações
    sem criar um novo scroll container.
  */
  overflow-x: clip;
  overflow-y: visible;

  color: var(--ink);

  background:
    linear-gradient(
      rgba(23,23,26,.032) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(23,23,26,.032) 1px,
      transparent 1px
    ),
    var(--paper);

  background-size:
    58px 58px,
    58px 58px,
    auto;

  font-family:
    Inter,
    "SF Pro Display",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.resume-page::after {
  content: "";

  position: absolute;

  inset: 0;

  z-index: 9999;

  opacity: .04;

  pointer-events: none;

  mix-blend-mode: multiply;

  background-image:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.9'/%3E%3C/svg%3E");
}

/* DECORAÇÕES */

.resume-shape {
  position: absolute;

  z-index: 0;

  border: 3px solid var(--ink);

  pointer-events: none;
}

.resume-shape--pink {
  top: 10rem;
  right: -10rem;

  width: 24rem;
  height: 24rem;

  border-radius:
    55% 45% 38% 62% /
    42% 59% 41% 58%;

  background: var(--pink);

  opacity: .07;

  transform:
    translate(
      var(--move-x),
      var(--move-y)
    );
}

.resume-shape--blue {
  top: 80rem;
  left: -11rem;

  width: 26rem;
  height: 26rem;

  border-radius:
    44% 56% 62% 38% /
    59% 41% 59% 41%;

  background: var(--blue);

  opacity: .08;
}

/* HEADER */

.resume-header {
  position: sticky;

  z-index: 1000;

  top: 0;

  display: grid;

  grid-template-columns:
    1fr auto 1fr;

  align-items: center;

  gap: 1rem;

  min-height: 5rem;

  padding:
    .7rem
    clamp(1rem,3vw,3.5rem);

  border-bottom:
    1px solid rgba(23,23,26,.1);

  background:
    rgba(245,241,233,.9);

  backdrop-filter:
    blur(18px);

  -webkit-backdrop-filter:
    blur(18px);

  box-shadow:
    0 10px 30px
    rgba(23,23,26,.035);
}

.resume-back {
  justify-self: start;

  display: flex;

  align-items: center;

  gap: .5rem;

  min-height: 2.6rem;

  padding:
    .55rem .8rem;

  border: 2px solid var(--ink);

  border-radius: .75rem;

  background: var(--paper-light);

  color: var(--ink);

  font-size: .58rem;

  font-weight: 950;

  cursor: pointer;

  box-shadow:
    3px 3px 0 var(--ink);

  transition:
    transform .2s ease,
    background .2s ease;
}

.resume-back:hover {
  background: var(--blue);

  transform:
    translate(-1px,-1px);
}

.resume-back svg {
  width: .9rem;
  height: .9rem;
}

.resume-logo {
  justify-self: center;

  padding: 0;

  border: 0;

  background: transparent;

  cursor: pointer;
}

.resume-logo img {
  display: block;

  width: 7.2rem;

  height: 2.7rem;

  object-fit: contain;

  filter:
    invert(1)
    brightness(.13);
}

.resume-header-actions {
  justify-self: end;

  display: flex;

  align-items: center;

  gap: .6rem;
}

.save-status {
  display: flex;

  align-items: center;

  gap: .4rem;

  color: var(--muted);

  font-size: .52rem;

  font-weight: 800;
}

.save-status svg {
  width: .7rem;
  height: .7rem;
}

.save-status--saved {
  color: #3f7138;
}

.save-status--error {
  color: #bc3555;
}

.saving-dot {
  width: .45rem;
  height: .45rem;

  border: 1.5px solid var(--ink);

  border-radius: 50%;

  background: var(--yellow);

  animation:
    savingPulse
    1s ease-in-out
    infinite;
}

.header-preview-button,
.header-save-button {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: .45rem;

  min-height: 2.65rem;

  padding:
    .55rem .75rem;

  border: 2px solid var(--ink);

  border-radius: .75rem;

  font-size: .56rem;

  font-weight: 950;

  cursor: pointer;

  box-shadow:
    3px 3px 0 var(--ink);

  transition:
    transform .2s ease,
    background .2s ease;
}

.header-preview-button {
  display: none;

  background: var(--paper-light);

  color: var(--ink);
}

.header-save-button {
  background: var(--yellow);

  color: var(--ink);
}

.header-save-button:hover {
  background: var(--lime);

  transform:
    translate(-1px,-1px);
}

.header-preview-button svg,
.header-save-button svg {
  width: .85rem;
  height: .85rem;
}

/* LAYOUT */

.resume-layout {
  position: relative;

  z-index: 10;

  display: grid;

  grid-template-columns:
    15rem
    minmax(0,1fr)
    minmax(300px,25rem);

  align-items: start;

  gap:
    clamp(1.5rem,3vw,3rem);

  width:
    min(100%,1700px);

  margin: 0 auto;

  padding:
    3rem
    clamp(1rem,3vw,3.5rem)
    8rem;
}

/* =========================================
   COLUNA ESQUERDA STICKY
========================================= */

.resume-navigation {
  position: sticky;

  top: 6.35rem;

  align-self: start;

  max-height:
    calc(100vh - 7.4rem);

  max-height:
    calc(100dvh - 7.4rem);

  overflow-y: auto;
  overflow-x: hidden;

  padding:
    .2rem .45rem
    1rem .2rem;

  z-index: 30;

  overscroll-behavior:
    contain;

  scrollbar-width: thin;

  scrollbar-color:
    rgba(23,23,26,.22)
    transparent;
}

.resume-navigation::-webkit-scrollbar {
  width: 5px;
}

.resume-navigation::-webkit-scrollbar-track {
  background: transparent;
}

.resume-navigation::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background:
    rgba(23,23,26,.2);
}

.resume-navigation::-webkit-scrollbar-thumb:hover {
  background:
    rgba(23,23,26,.35);
}

.navigation-progress {
  display: flex;

  align-items: center;

  gap: .8rem;

  padding: .9rem;

  border: 2px solid var(--ink);

  border-radius: 1rem;

  background: var(--paper-light);

  box-shadow:
    4px 4px 0 var(--ink);
}

.progress-circle {
  position: relative;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

  width: 4.3rem;
  height: 4.3rem;
}

.progress-circle svg {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  transform:
    rotate(-90deg);
}

.progress-circle circle {
  fill: none;

  stroke-width: 10;

  stroke-linecap: round;
}

.progress-circle-bg {
  stroke:
    rgba(23,23,26,.1);
}

.progress-circle-value {
  stroke: var(--pink);

  stroke-dasharray: 302;
}

.progress-circle > span {
  display: flex;

  flex-direction: column;

  align-items: center;

  font-size: .42rem;

  font-weight: 850;

  text-transform: uppercase;
}

.progress-circle strong {
  font-size: .9rem;

  font-weight: 950;
}

.navigation-progress-copy {
  display: flex;

  flex-direction: column;

  min-width: 0;
}

.navigation-progress-copy strong {
  font-size: .63rem;

  font-weight: 950;
}

.navigation-progress-copy span {
  margin-top: .2rem;

  color: var(--muted);

  font-size: .5rem;

  line-height: 1.4;
}

/* NAVEGAÇÃO */

.section-navigation {
  display: flex;

  flex-direction: column;

  gap: .4rem;

  margin-top: 1rem;
}

.section-nav-item {
  position: relative;

  display: grid;

  grid-template-columns:
    auto auto 1fr;

  align-items: center;

  gap: .55rem;

  min-height: 3.2rem;

  padding:
    .4rem .55rem;

  border: 2px solid transparent;

  border-radius: .8rem;

  background: transparent;

  color: var(--muted);

  text-align: left;

  cursor: pointer;

  transition:
    background .18s ease,
    color .18s ease,
    border-color .18s ease,
    transform .18s ease,
    box-shadow .18s ease;
}

.section-nav-item:hover {
  background:
    rgba(255,255,255,.55);

  color: var(--ink);

  transform:
    translateX(2px);
}

.section-nav-item--active {
  border-color:
    var(--ink);

  background:
    var(--paper-light);

  color: var(--ink);

  box-shadow:
    3px 3px 0 var(--ink);
}

/* MARCADOR DA ETAPA ATUAL */

.section-nav-item--active::before {
  content: "";

  position: absolute;

  left: -.45rem;

  top: 50%;

  width: .28rem;
  height: 1.45rem;

  border: 1.5px solid
    var(--ink);

  border-radius: 999px;

  background: var(--pink);

  transform:
    translateY(-50%);

  animation:
    activeSectionPulse
    1.9s ease-in-out
    infinite;
}

.section-nav-number {
  color: var(--pink);

  font-family:
    "Courier New",
    monospace;

  font-size: .48rem;

  font-weight: 950;
}

.section-nav-icon {
  display: grid;

  place-items: center;

  width: 1.8rem;
  height: 1.8rem;

  border: 1.5px solid var(--ink);

  border-radius: .5rem;

  background:
    var(--paper-light);

  transition:
    background .2s ease,
    transform .2s ease;
}

.section-nav-item--active
.section-nav-icon {
  background: var(--yellow);

  transform:
    rotate(-4deg);
}

.section-nav-icon svg {
  width: .75rem;
  height: .75rem;
}

.section-nav-label {
  font-size: .56rem;

  font-weight: 850;
}

.keyboard-tip {
  display: flex;

  gap: .55rem;

  margin-top: 1rem;

  padding: .75rem;

  border: 2px dashed
    rgba(23,23,26,.24);

  border-radius: .8rem;

  color: var(--muted);
}

.keyboard-tip > svg {
  flex: 0 0 auto;

  width: 1rem;
  height: 1rem;

  color: var(--ink);
}

.keyboard-tip strong {
  display: block;

  color: var(--ink);

  font-size: .52rem;

  font-weight: 950;
}

.keyboard-tip span {
  display: block;

  margin-top: .15rem;

  font-size: .46rem;

  line-height: 1.45;
}

kbd {
  padding:
    .1rem .2rem;

  border: 1px solid
    var(--ink);

  border-radius: .25rem;

  background: #fff;

  color: var(--ink);

  font-family:
    "Courier New",
    monospace;

  font-size: .44rem;

  font-weight: 950;
}

.clear-resume-button {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: .45rem;

  width: 100%;

  min-height: 2.8rem;

  margin-top: 1rem;

  border: 1.8px solid
    rgba(187,45,80,.35);

  border-radius: .7rem;

  background:
    rgba(255,79,139,.05);

  color: #bc3555;

  font-size: .51rem;

  font-weight: 900;

  cursor: pointer;

  transition:
    background .2s ease,
    border .2s ease;
}

.clear-resume-button:hover {
  border-color: #bc3555;

  background:
    rgba(255,79,139,.11);
}

.clear-resume-button svg {
  width: .75rem;
  height: .75rem;
}

/* EDITOR */

.resume-editor {
  min-width: 0;
}

.editor-intro {
  margin-bottom: 3rem;
}

.editor-kicker {
  display: inline-flex;

  align-items: center;

  gap: .45rem;

  padding:
    .4rem .55rem;

  border: 2px solid var(--ink);

  border-radius: .55rem;

  background: var(--blue);

  font-size: .53rem;

  font-weight: 950;

  letter-spacing: .09em;

  text-transform: uppercase;

  box-shadow:
    3px 3px 0 var(--ink);

  transform:
    rotate(-1deg);
}

.editor-kicker svg {
  width: .75rem;
  height: .75rem;
}

.editor-intro h1 {
  margin:
    1.1rem 0 0;

  font-size:
    clamp(3.2rem,6vw,6rem);

  font-weight: 950;

  line-height: .83;

  letter-spacing: -.08em;

  text-transform: uppercase;
}

.editor-intro h1 strong {
  color: var(--paper-light);

  text-shadow:
    -2px -2px 0 var(--ink),
    2px -2px 0 var(--ink),
    -2px 2px 0 var(--ink),
    2px 2px 0 var(--ink),
    6px 6px 0 var(--pink);

  font-weight: inherit;
}

.editor-intro p {
  max-width: 36rem;

  margin:
    1.4rem 0 0;

  color: var(--muted);

  font-size: .78rem;

  font-weight: 650;

  line-height: 1.65;
}

/* SEÇÕES */

.resume-section {
  scroll-margin-top: 6.5rem;

  margin-bottom: 1.5rem;

  border: 2.5px solid
    var(--ink);

  border-radius: 1.35rem;

  background:
    var(--paper-light);

  box-shadow:
    5px 5px 0
    rgba(23,23,26,.14);

  overflow: hidden;
}

.resume-section-header {
  display: grid;

  grid-template-columns:
    auto 1fr;

  gap: .85rem;

  padding:
    1.2rem 1.3rem;

  border-bottom:
    2px solid
    rgba(23,23,26,.12);

  background:
    rgba(255,255,255,.5);
}

.section-title-icon {
  display: grid;

  place-items: center;

  width: 3rem;
  height: 3rem;

  border: 2px solid var(--ink);

  border-radius: .85rem;

  background: var(--yellow);

  box-shadow:
    3px 3px 0 var(--ink);

  transform:
    rotate(-4deg);
}

.section-title-icon svg {
  width: 1.15rem;
  height: 1.15rem;
}

.section-number {
  display: block;

  color: var(--pink);

  font-family:
    "Courier New",
    monospace;

  font-size: .5rem;

  font-weight: 950;

  letter-spacing: .08em;

  text-transform: uppercase;
}

.resume-section-header h2 {
  margin:
    .25rem 0 0;

  font-size: 1.35rem;

  font-weight: 950;

  letter-spacing: -.045em;
}

.resume-section-header p {
  margin:
    .35rem 0 0;

  color: var(--muted);

  font-size: .58rem;

  font-weight: 630;

  line-height: 1.5;
}

.resume-section-content {
  padding: 1.3rem;
}

/* CAMPOS */

.personal-section-grid {
  display: grid;

  grid-template-columns:
    minmax(0,1fr)
    13rem;

  gap: 1rem;
}

.personal-fields {
  min-width: 0;
}

.two-column-grid {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: .8rem;
}

.three-column-grid {
  display: grid;

  grid-template-columns:
    repeat(3,1fr);

  gap: .65rem;
}

.field-group {
  display: flex;

  flex-direction: column;

  gap: .35rem;

  min-width: 0;

  margin-bottom: .8rem;
}

.field-label {
  padding-left: .08rem;

  color: var(--ink);

  font-size: .52rem;

  font-weight: 950;

  letter-spacing: .05em;

  text-transform: uppercase;
}

.input-shell {
  position: relative;

  display: flex;

  align-items: center;

  min-height: 3rem;

  border: 1.8px solid
    var(--ink);

  border-radius: .75rem;

  background: #fff;

  box-shadow:
    2px 2px 0
    rgba(23,23,26,.12);

  transition:
    transform .18s ease,
    box-shadow .18s ease;
}

.input-shell:focus-within {
  transform:
    translate(-1px,-1px);

  box-shadow:
    4px 4px 0 var(--blue),
    6px 6px 0 var(--ink);
}

.input-icon {
  display: grid;

  place-items: center;

  flex: 0 0 auto;

  width: 2.7rem;

  color: var(--ink);
}

.input-icon svg {
  width: .9rem;
  height: .9rem;
}

.resume-input {
  width: 100%;

  min-width: 0;

  height: 2.9rem;

  padding:
    0 .8rem;

  border: 0;

  outline: 0;

  background: transparent;

  color: var(--ink);

  font-size: .67rem;

  font-weight: 700;
}

.resume-input--with-icon {
  padding-left: 0;
}

.resume-input::placeholder {
  color: #aaa29a;

  font-weight: 600;
}

.resume-input:disabled {
  color: #aaa29a;

  cursor: not-allowed;

  opacity: .6;
}

.resume-textarea {
  width: 100%;

  min-height: 8rem;

  padding: .85rem;

  border: 1.8px solid
    var(--ink);

  border-radius: .8rem;

  outline: 0;

  resize: vertical;

  background: #fff;

  color: var(--ink);

  font-size: .66rem;

  font-weight: 650;

  line-height: 1.6;

  box-shadow:
    2px 2px 0
    rgba(23,23,26,.12);

  transition:
    transform .18s ease,
    box-shadow .18s ease;
}

.resume-textarea:focus {
  transform:
    translate(-1px,-1px);

  box-shadow:
    4px 4px 0 var(--blue),
    6px 6px 0 var(--ink);
}

.resume-textarea--summary {
  min-height: 10rem;

  padding-bottom: 2rem;
}

.field-error {
  display: flex;

  align-items: center;

  gap: .35rem;

  color: #c53456;

  font-size: .5rem;

  font-weight: 800;
}

.field-error svg {
  width: .7rem;
  height: .7rem;
}

/* LINKS */

.links-box {
  margin-top: .3rem;

  padding: .85rem;

  border: 2px dashed
    rgba(23,23,26,.22);

  border-radius: .85rem;

  background:
    rgba(100,199,238,.07);
}

.links-box-title {
  display: flex;

  align-items: center;

  gap: .55rem;

  margin-bottom: .75rem;
}

.links-box-title > svg {
  width: 1rem;
  height: 1rem;
}

.links-box-title div {
  display: flex;

  flex-direction: column;
}

.links-box-title strong {
  font-size: .56rem;

  font-weight: 950;
}

.links-box-title span {
  color: var(--muted);

  font-size: .48rem;
}

/* FOTO */

.photo-upload-card {
  display: flex;

  flex-direction: column;

  align-items: center;

  align-self: start;

  padding: 1rem;

  border: 2px solid var(--ink);

  border-radius: 1rem;

  background:
    #fff9cc;

  text-align: center;

  box-shadow:
    3px 3px 0 var(--ink);
}

.photo-upload-label {
  align-self: stretch;

  margin-bottom: .75rem;

  padding-bottom: .55rem;

  border-bottom:
    1.5px dashed
    rgba(23,23,26,.2);

  font-size: .5rem;

  font-weight: 950;

  text-transform: uppercase;
}

.photo-preview {
  display: grid;

  place-items: center;

  width: 6rem;
  height: 6rem;

  overflow: hidden;

  border: 2px solid var(--ink);

  border-radius: 1.2rem;

  background: var(--blue);

  box-shadow:
    4px 4px 0 var(--pink);

  transform:
    rotate(-3deg);
}

.photo-preview img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.photo-preview > span {
  font-size: 1.5rem;

  font-weight: 950;
}

.photo-upload-card p {
  margin:
    .85rem 0 0;

  color: var(--muted);

  font-size: .5rem;

  font-weight: 650;

  line-height: 1.45;
}

.photo-select-button {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: .4rem;

  width: 100%;

  min-height: 2.6rem;

  margin-top: .8rem;

  border: 2px solid var(--ink);

  border-radius: .7rem;

  background: var(--ink);

  color: #fff;

  font-size: .5rem;

  font-weight: 950;

  cursor: pointer;
}

.photo-select-button:hover {
  background: var(--pink);
}

.photo-select-button input {
  display: none;
}

.photo-select-button svg {
  width: .75rem;
  height: .75rem;
}

.photo-remove-button {
  margin-top: .55rem;

  padding: 0;

  border: 0;

  background: transparent;

  color: #b73855;

  font-size: .48rem;

  font-weight: 850;

  text-decoration: underline;

  cursor: pointer;
}

.photo-upload-card small {
  margin-top: .6rem;

  color: #9b938c;

  font-size: .42rem;
}

/* RESUMO */

.summary-wrapper {
  position: relative;
}

.character-counter {
  position: absolute;

  right: .8rem;
  bottom: .65rem;

  padding:
    .2rem .35rem;

  border: 1px solid
    rgba(23,23,26,.2);

  border-radius: .3rem;

  background:
    rgba(245,241,233,.95);

  color: var(--muted);

  font-family:
    "Courier New",
    monospace;

  font-size: .43rem;

  font-weight: 850;
}

.resume-tip {
  display: flex;

  align-items: flex-start;

  gap: .65rem;

  padding: .8rem;

  border: 2px dashed
    var(--ink);

  border-radius: .8rem;

  background:
    rgba(255,212,71,.15);
}

.resume-tip > span {
  display: grid;

  place-items: center;

  flex: 0 0 auto;

  width: 2.2rem;
  height: 2.2rem;

  border: 1.5px solid
    var(--ink);

  border-radius: .6rem;

  background: var(--yellow);
}

.resume-tip svg {
  width: .9rem;
  height: .9rem;
}

.resume-tip strong {
  font-size: .54rem;

  font-weight: 950;
}

.resume-tip p {
  margin:
    .15rem 0 0;

  color: var(--muted);

  font-size: .49rem;

  font-weight: 650;

  line-height: 1.45;
}

/* CARDS DINÂMICOS */

.dynamic-list {
  display: flex;

  flex-direction: column;

  gap: .8rem;
}

.dynamic-card {
  overflow: hidden;

  border: 2px solid
    var(--ink);

  border-radius: 1rem;

  background: #fff;

  box-shadow:
    3px 3px 0
    var(--dynamic-accent);
}

.dynamic-card-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 1rem;

  min-height: 3.1rem;

  padding:
    .55rem .7rem;

  border-bottom:
    1.8px solid
    rgba(23,23,26,.13);

  background:
    rgba(245,241,233,.58);
}

.dynamic-card-header > div:first-child {
  display: flex;

  align-items: center;

  gap: .55rem;
}

.dynamic-card-index {
  display: grid;

  place-items: center;

  width: 1.8rem;
  height: 1.8rem;

  border: 1.5px solid var(--ink);

  border-radius: .5rem;

  background:
    var(--dynamic-accent);

  font-family:
    "Courier New",
    monospace;

  font-size: .46rem;

  font-weight: 950;

  box-shadow:
    2px 2px 0 var(--ink);
}

.dynamic-card-header strong {
  font-size: .57rem;

  font-weight: 950;
}

.dynamic-actions {
  display: flex;

  gap: .3rem;
}

.dynamic-actions button {
  display: grid;

  place-items: center;

  width: 2rem;
  height: 2rem;

  padding: 0;

  border: 1.5px solid
    var(--ink);

  border-radius: .55rem;

  background:
    var(--paper-light);

  color: var(--ink);

  cursor: pointer;
}

.dynamic-actions button:hover {
  background:
    var(--dynamic-accent);
}

.dynamic-actions button:disabled {
  opacity: .3;

  cursor: not-allowed;
}

.dynamic-actions
.danger-action:hover {
  background: var(--pink);

  color: #fff;
}

.dynamic-actions svg {
  width: .7rem;
  height: .7rem;
}

.dynamic-card-body {
  padding: .9rem;
}

.experience-date-grid {
  display: grid;

  grid-template-columns:
    1fr 1fr auto;

  align-items: end;

  gap: .8rem;
}

.current-job-checkbox {
  display: flex;

  align-items: center;

  gap: .45rem;

  min-height: 3rem;

  margin-bottom: .8rem;

  color: var(--muted);

  font-size: .48rem;

  font-weight: 750;

  cursor: pointer;
}

.current-job-checkbox input {
  position: absolute;

  opacity: 0;
}

.current-job-checkbox > span {
  display: grid;

  place-items: center;

  width: 1.15rem;
  height: 1.15rem;

  border: 1.7px solid
    var(--ink);

  border-radius: .3rem;

  background: #fff;

  box-shadow:
    1px 1px 0 var(--ink);
}

.current-job-checkbox svg {
  width: .65rem;
  height: .65rem;

  opacity: 0;
}

.current-job-checkbox
input:checked + span {
  background: var(--lime);
}

.current-job-checkbox
input:checked + span svg {
  opacity: 1;
}

.add-item-button {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: .5rem;

  width: 100%;

  min-height: 3rem;

  margin-top: .9rem;

  border: 2px dashed
    rgba(23,23,26,.4);

  border-radius: .8rem;

  background: transparent;

  color: var(--ink);

  font-size: .54rem;

  font-weight: 950;

  cursor: pointer;

  transition:
    background .2s ease,
    border .2s ease,
    transform .2s ease;
}

.add-item-button:hover {
  border-style: solid;

  background:
    rgba(100,199,238,.12);

  transform:
    translateY(-1px);
}

.add-item-button > span {
  display: grid;

  place-items: center;

  width: 1.7rem;
  height: 1.7rem;

  border: 1.5px solid var(--ink);

  border-radius: .45rem;

  background: var(--blue);
}

.add-item-button svg {
  width: .7rem;
  height: .7rem;
}

/* HABILIDADES */

.skill-input-wrapper {
  display: grid;

  grid-template-columns:
    auto
    minmax(0,1fr)
    auto;

  align-items: center;

  min-height: 3.2rem;

  border: 1.8px solid
    var(--ink);

  border-radius: .8rem;

  background: #fff;

  box-shadow:
    2px 2px 0
    rgba(23,23,26,.12);
}

.skill-input-wrapper > svg {
  width: .9rem;
  height: .9rem;

  margin-left: .9rem;
}

.skill-input-wrapper input {
  width: 100%;

  min-width: 0;

  height: 3rem;

  padding:
    0 .7rem;

  border: 0;

  outline: 0;

  background: transparent;

  color: var(--ink);

  font-size: .66rem;

  font-weight: 700;
}

.skill-input-wrapper button {
  display: flex;

  align-items: center;

  gap: .4rem;

  min-height: 2.5rem;

  margin-right: .3rem;

  padding:
    .5rem .65rem;

  border: 1.7px solid
    var(--ink);

  border-radius: .65rem;

  background: var(--yellow);

  color: var(--ink);

  font-size: .49rem;

  font-weight: 950;

  cursor: pointer;
}

.skill-input-wrapper button:hover {
  background: var(--lime);
}

.skill-input-wrapper button svg {
  width: .7rem;
  height: .7rem;
}

.skills-help {
  color: var(--muted);

  font-size: .47rem;

  margin:
    -.25rem 0 .9rem;
}

.skills-list {
  display: flex;

  flex-wrap: wrap;

  gap: .45rem;
}

.skill-chip {
  display: flex;

  align-items: center;

  gap: .4rem;

  min-height: 2.2rem;

  padding:
    .4rem .55rem;

  border: 1.7px solid
    var(--ink);

  border-radius: 999px;

  background: #fff;

  color: var(--ink);

  font-size: .53rem;

  font-weight: 850;

  cursor: pointer;

  box-shadow:
    2px 2px 0 var(--ink);
}

.skill-chip:hover {
  background: var(--pink);

  color: #fff;
}

.skill-chip > span {
  color: var(--pink);

  font-family:
    "Courier New",
    monospace;

  font-size: .43rem;

  font-weight: 950;
}

.skill-chip:hover > span {
  color: #fff;
}

.skill-chip svg {
  width: .6rem;
  height: .6rem;
}

.skills-empty {
  display: grid;

  place-items: center;

  min-height: 6rem;

  border: 2px dashed
    rgba(23,23,26,.2);

  border-radius: .8rem;

  color: #9f978f;

  font-size: .55rem;

  font-weight: 750;
}

.select-shell {
  position: relative;

  display: flex;

  align-items: center;

  min-height: 3rem;

  border: 1.8px solid
    var(--ink);

  border-radius: .75rem;

  background: #fff;

  box-shadow:
    2px 2px 0
    rgba(23,23,26,.12);
}

.select-shell select {
  width: 100%;

  height: 2.9rem;

  padding:
    0 2.5rem 0 .8rem;

  border: 0;

  outline: 0;

  appearance: none;

  background: transparent;

  color: var(--ink);

  font-size: .65rem;

  font-weight: 750;

  cursor: pointer;
}

.select-shell svg {
  position: absolute;

  right: .8rem;

  width: .8rem;
  height: .8rem;

  pointer-events: none;
}

/* FINAL */

.finish-section {
  position: relative;

  overflow: hidden;

  margin-top: 2rem;

  padding:
    clamp(2rem,4vw,3rem);

  border: 3px solid
    var(--ink);

  border-radius: 1.5rem;

  background:
    linear-gradient(
      rgba(23,23,26,.05) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(23,23,26,.05) 1px,
      transparent 1px
    ),
    var(--yellow);

  background-size:
    30px 30px;

  box-shadow:
    7px 7px 0 var(--pink),
    10px 10px 0 var(--ink);
}

.finish-decoration {
  position: absolute;

  top: 1.3rem;
  right: 1.3rem;

  display: grid;

  place-items: center;

  width: 3.6rem;
  height: 3.6rem;

  border: 2px solid
    var(--ink);

  border-radius: .9rem;

  background: var(--violet);

  color: #fff;

  box-shadow:
    3px 3px 0 var(--ink);

  transform:
    rotate(8deg);
}

.finish-decoration svg {
  width: 1.4rem;
  height: 1.4rem;
}

.finish-kicker {
  font-family:
    "Courier New",
    monospace;

  font-size: .53rem;

  font-weight: 950;

  letter-spacing: .09em;

  text-transform: uppercase;
}

.finish-section h2 {
  max-width: 12ch;

  margin:
    1rem 0 0;

  font-size:
    clamp(2.2rem,4vw,4rem);

  font-weight: 950;

  line-height: .88;

  letter-spacing: -.07em;

  text-transform: uppercase;
}

.finish-section p {
  max-width: 32rem;

  margin:
    1rem 0 0;

  color:
    rgba(23,23,26,.65);

  font-size: .66rem;

  font-weight: 650;

  line-height: 1.55;
}

.finish-progress {
  margin-top: 1.4rem;
}

.finish-progress > div:first-child {
  display: flex;

  justify-content: space-between;

  font-size: .55rem;

  font-weight: 850;
}

.finish-progress strong {
  font-size: .7rem;

  font-weight: 950;
}

.finish-progress-bar {
  height: .55rem;

  margin-top: .45rem;

  overflow: hidden;

  border: 1.5px solid
    var(--ink);

  border-radius: 999px;

  background: #fff;
}

.finish-progress-bar span {
  display: block;

  height: 100%;

  border-right:
    1.5px solid var(--ink);

  background: var(--pink);

  transition:
    width .35s ease;
}

.finish-actions {
  display: flex;

  gap: .7rem;

  margin-top: 1.4rem;
}

.finish-secondary,
.finish-primary {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: .45rem;

  min-height: 3rem;

  padding:
    .6rem .8rem;

  border: 2px solid
    var(--ink);

  border-radius: .75rem;

  font-size: .54rem;

  font-weight: 950;

  cursor: pointer;
}

.finish-secondary {
  background: #fff;

  color: var(--ink);

  box-shadow:
    3px 3px 0 var(--ink);
}

.finish-primary {
  background: var(--ink);

  color: #fff;

  box-shadow:
    4px 4px 0 var(--pink);
}

.finish-primary:hover {
  background: var(--pink);
}

.finish-secondary:hover {
  background: var(--blue);
}

.finish-actions svg {
  width: .8rem;
  height: .8rem;
}

/* =========================================
   COLUNA DIREITA / PREVIEW STICKY
========================================= */

.resume-preview-column {
  min-width: 0;

  align-self: stretch;
}

.preview-sticky {
  position: sticky;

  top: 6.35rem;

  max-height:
    calc(100vh - 7.4rem);

  max-height:
    calc(100dvh - 7.4rem);

  overflow-y: auto;
  overflow-x: hidden;

  padding:
    .2rem .55rem
    1rem .2rem;

  z-index: 30;

  overscroll-behavior:
    contain;

  scrollbar-width: thin;

  scrollbar-color:
    rgba(23,23,26,.22)
    transparent;

  scroll-behavior: smooth;
}

.preview-sticky::-webkit-scrollbar {
  width: 5px;
}

.preview-sticky::-webkit-scrollbar-track {
  background: transparent;
}

.preview-sticky::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background:
    rgba(23,23,26,.2);
}

.preview-sticky::-webkit-scrollbar-thumb:hover {
  background:
    rgba(23,23,26,.35);
}

.preview-toolbar {
  position: sticky;

  z-index: 10;

  top: 0;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 1rem;

  margin-bottom: .8rem;

  padding:
    .25rem 0 .5rem;

  background:
    linear-gradient(
      to bottom,
      var(--paper) 76%,
      transparent
    );
}

.preview-toolbar > div:first-child {
  display: flex;

  flex-direction: column;
}

.preview-toolbar span {
  color: var(--pink);

  font-family:
    "Courier New",
    monospace;

  font-size: .45rem;

  font-weight: 950;

  text-transform: uppercase;
}

.preview-toolbar strong {
  margin-top: .15rem;

  font-size: .65rem;

  font-weight: 950;
}

.preview-toolbar > div:last-child {
  display: flex;

  gap: .35rem;
}

.preview-toolbar button {
  display: grid;

  place-items: center;

  width: 2.3rem;
  height: 2.3rem;

  border: 1.7px solid
    var(--ink);

  border-radius: .65rem;

  background: var(--paper-light);

  cursor: pointer;

  box-shadow:
    2px 2px 0 var(--ink);

  transition:
    background .2s ease,
    transform .2s ease;
}

.preview-toolbar button:hover {
  background: var(--yellow);

  transform:
    translate(-1px,-1px);
}

.preview-toolbar svg {
  width: .75rem;
  height: .75rem;
}

/* FOLHA */

.resume-paper {
  min-height: 35rem;

  padding:
    1.6rem 1.4rem;

  border: 2px solid
    var(--ink);

  border-radius: .8rem;

  background: #fff;

  box-shadow:
    6px 6px 0 var(--ink);

  font-family:
    Arial,
    sans-serif;

  color: #151515;

  transition:
    transform .25s ease,
    box-shadow .25s ease;
}

.preview-sticky:hover
.resume-paper {
  transform:
    translateY(-2px);

  box-shadow:
    8px 8px 0 var(--ink);
}

.paper-header {
  display: grid;

  grid-template-columns:
    auto 1fr;

  align-items: center;

  gap: 1rem;

  padding-bottom: 1rem;

  border-bottom:
    2px solid #151515;
}

.paper-photo {
  display: grid;

  place-items: center;

  width: 4.2rem;
  height: 4.2rem;

  overflow: hidden;

  border: 1.5px solid
    #151515;

  border-radius: .5rem;

  background: #ffd447;

  font-size: 1rem;

  font-weight: 900;
}

.paper-photo img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.paper-identity h2 {
  margin: 0;

  font-size: 1.25rem;

  font-weight: 900;

  line-height: 1;

  letter-spacing: -.04em;
}

.paper-identity > strong {
  display: block;

  margin-top: .3rem;

  color: #e43975;

  font-size: .58rem;

  font-weight: 800;

  text-transform: uppercase;
}

.paper-contact {
  display: flex;

  flex-wrap: wrap;

  gap: .25rem .6rem;

  margin-top: .45rem;

  color: #666;

  font-size: .45rem;
}

.paper-links {
  display: flex;

  flex-direction: column;

  gap: .15rem;

  padding:
    .5rem 0;

  border-bottom:
    1px solid #ddd;

  color: #555;

  font-size: .4rem;
}

.paper-section {
  margin-top: 1rem;
}

.paper-section h3 {
  margin: 0;

  padding-bottom: .3rem;

  border-bottom:
    1px solid #ddd;

  font-size: .55rem;

  font-weight: 900;

  letter-spacing: .05em;

  text-transform: uppercase;
}

.paper-paragraph {
  margin:
    .5rem 0 0;

  color: #444;

  font-size: .47rem;

  line-height: 1.55;
}

.paper-list {
  display: flex;

  flex-direction: column;

  gap: .6rem;

  margin-top: .55rem;
}

.paper-list-item {
  padding-left: .55rem;

  border-left:
    2px solid #ff4f8b;
}

.paper-list-heading {
  display: flex;

  align-items: flex-start;

  justify-content: space-between;

  gap: .5rem;
}

.paper-list-heading > div {
  display: flex;

  flex-direction: column;
}

.paper-list-heading strong {
  font-size: .51rem;

  font-weight: 900;
}

.paper-list-heading span {
  margin-top: .08rem;

  color: #666;

  font-size: .43rem;
}

.paper-list-heading small {
  color: #777;

  font-size: .38rem;

  white-space: nowrap;
}

.paper-list-item p {
  margin:
    .3rem 0 0;

  color: #555;

  font-size: .43rem;

  line-height: 1.5;
}

.paper-skills {
  display: flex;

  flex-wrap: wrap;

  gap: .25rem;

  margin-top: .55rem;
}

.paper-skills span {
  padding:
    .25rem .35rem;

  border:
    1px solid #222;

  border-radius: .25rem;

  background: #f4f0e8;

  font-size: .4rem;

  font-weight: 700;
}

.paper-two-columns {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: .8rem;
}

.paper-mini-list {
  display: flex;

  flex-direction: column;

  gap: .4rem;

  margin-top: .5rem;
}

.paper-mini-list > div {
  display: flex;

  flex-direction: column;
}

.paper-mini-list strong {
  font-size: .46rem;

  font-weight: 850;
}

.paper-mini-list span {
  margin-top: .08rem;

  color: #666;

  font-size: .39rem;
}

.preview-hint {
  display: flex;

  gap: .5rem;

  margin-top: .8rem;

  padding: .65rem;

  border: 2px dashed
    rgba(23,23,26,.2);

  border-radius: .7rem;

  color: var(--muted);

  font-size: .47rem;

  line-height: 1.45;
}

.preview-hint svg {
  flex: 0 0 auto;

  width: .8rem;
  height: .8rem;

  color: var(--ink);
}

/* MOBILE PREVIEW */

.mobile-preview-overlay {
  position: fixed;

  z-index: 3000;

  inset: 0;

  display: flex;

  align-items: flex-end;

  justify-content: center;

  padding: 1rem;

  background:
    rgba(23,23,26,.58);

  backdrop-filter:
    blur(8px);

  -webkit-backdrop-filter:
    blur(8px);
}

.mobile-preview {
  width: min(100%,35rem);

  max-height: 92vh;
  max-height: 92dvh;

  overflow-y: auto;

  padding: 1rem;

  border: 3px solid
    var(--ink);

  border-radius:
    1.2rem 1.2rem 0 0;

  background: var(--paper);

  box-shadow:
    8px 8px 0 var(--pink);
}

.mobile-preview-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: .8rem;
}

.mobile-preview-header > div {
  display: flex;

  flex-direction: column;
}

.mobile-preview-header span {
  color: var(--pink);

  font-size: .45rem;

  font-weight: 950;

  text-transform: uppercase;
}

.mobile-preview-header strong {
  font-size: .7rem;

  font-weight: 950;
}

.mobile-preview-header button {
  display: grid;

  place-items: center;

  width: 2.5rem;
  height: 2.5rem;

  border: 2px solid
    var(--ink);

  border-radius: .65rem;

  background: var(--yellow);

  cursor: pointer;

  box-shadow:
    2px 2px 0 var(--ink);
}

.mobile-preview-header svg {
  width: .8rem;
  height: .8rem;
}

.mobile-preview-actions {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: .6rem;

  margin-top: 1rem;
}

.mobile-preview-actions button {
  display: flex;

  align-items: center;

  justify-content: center;

  gap: .4rem;

  min-height: 2.8rem;

  border: 2px solid
    var(--ink);

  border-radius: .7rem;

  background: var(--paper-light);

  color: var(--ink);

  font-size: .52rem;

  font-weight: 950;

  cursor: pointer;

  box-shadow:
    3px 3px 0 var(--ink);
}

.mobile-preview-actions button:last-child {
  background: var(--yellow);
}

.mobile-preview-actions svg {
  width: .75rem;
  height: .75rem;
}

/* TOAST */

.resume-toast {
  position: fixed;

  z-index: 5000;

  right: 1.2rem;
  bottom: 1.2rem;

  display: flex;

  align-items: center;

  gap: .55rem;

  min-height: 3.2rem;

  padding:
    .65rem .85rem;

  border: 2px solid
    var(--ink);

  border-radius: .8rem;

  background: var(--lime);

  color: var(--ink);

  font-size: .55rem;

  font-weight: 900;

  box-shadow:
    5px 5px 0 var(--pink),
    8px 8px 0 var(--ink);
}

.resume-toast > span {
  display: grid;

  place-items: center;

  width: 1.6rem;
  height: 1.6rem;

  border: 1.5px solid
    var(--ink);

  border-radius: .45rem;

  background: #fff;
}

.resume-toast svg {
  width: .7rem;
  height: .7rem;
}

/* ANIMAÇÕES */

@keyframes savingPulse {
  0%,
  100% {
    transform:
      scale(1);
  }

  50% {
    transform:
      scale(.6);
  }
}

@keyframes activeSectionPulse {
  0%,
  100% {
    transform:
      translateY(-50%)
      scaleY(1);

    opacity: 1;
  }

  50% {
    transform:
      translateY(-50%)
      scaleY(.72);

    opacity: .65;
  }
}

/* RESPONSIVO */

@media (max-width: 1320px) {
  .resume-layout {
    grid-template-columns:
      13rem
      minmax(0,1fr)
      21rem;

    gap: 1.5rem;
  }

  .navigation-progress {
    align-items:
      flex-start;

    flex-direction:
      column;
  }
}

@media (max-width: 1100px) {
  .resume-layout {
    grid-template-columns:
      12rem
      minmax(0,1fr);
  }

  .resume-preview-column {
    display: none;
  }

  .header-preview-button {
    display: flex;
  }
}

/* =========================================
   TABLET / MOBILE

   O MENU DE ETAPAS TAMBÉM ACOMPANHA O SCROLL
========================================= */

@media (max-width: 820px) {
  .resume-header {
    grid-template-columns:
      auto 1fr auto;

    min-height: 4.8rem;
  }

  .resume-logo {
    justify-self: start;
  }

  .resume-back span,
  .save-status {
    display: none;
  }

  .resume-back {
    width: 2.6rem;

    padding: 0;

    justify-content: center;
  }

  .resume-header-actions {
    gap: .4rem;
  }

  .header-preview-button span,
  .header-save-button {
    display: none;
  }

  .header-preview-button {
    display: grid;

    place-items: center;

    width: 2.6rem;

    padding: 0;
  }

  .resume-layout {
    display: block;

    padding:
      0 1rem 6rem;
  }

  /*
    A navegação inteira vira
    barra sticky abaixo do header.
  */
  .resume-navigation {
    position: sticky;

    top: 4.8rem;

    z-index: 900;

    max-height: none;

    overflow: visible;

    margin:
      0 -1rem
      2rem;

    padding:
      .55rem
      1rem
      .35rem;

    border-bottom:
      1px solid
      rgba(23,23,26,.1);

    background:
      rgba(245,241,233,.94);

    backdrop-filter:
      blur(16px);

    -webkit-backdrop-filter:
      blur(16px);

    box-shadow:
      0 10px 25px
      rgba(23,23,26,.05);
  }

  .navigation-progress,
  .keyboard-tip,
  .clear-resume-button {
    display: none;
  }

  .section-navigation {
    flex-direction: row;

    gap: .45rem;

    margin-top: 0;

    overflow-x: auto;
    overflow-y: hidden;

    padding:
      .15rem .15rem .5rem;

    scrollbar-width: none;

    scroll-behavior: smooth;

    overscroll-behavior-x:
      contain;
  }

  .section-navigation::-webkit-scrollbar {
    display: none;
  }

  .section-nav-item {
    flex: 0 0 auto;

    grid-template-columns:
      auto auto;

    min-height: 2.8rem;

    padding:
      .4rem .55rem;
  }

  .section-nav-item:hover {
    transform: none;
  }

  .section-nav-item--active::before {
    left: 50%;
    top: auto;
    bottom: -.37rem;

    width: 1.4rem;
    height: .25rem;

    transform:
      translateX(-50%);

    animation:
      mobileSectionPulse
      1.9s ease-in-out
      infinite;
  }

  .section-nav-number {
    display: none;
  }

  .section-nav-label {
    padding-right: .2rem;
  }

  .editor-intro {
    padding-top: 2rem;
  }

  .editor-intro h1 {
    font-size:
      clamp(
        3rem,
        13vw,
        5rem
      );
  }

  .personal-section-grid {
    grid-template-columns:
      1fr;
  }

  .photo-upload-card {
    width:
      min(100%,18rem);

    justify-self:
      start;
  }
}

@keyframes mobileSectionPulse {
  0%,
  100% {
    transform:
      translateX(-50%)
      scaleX(1);

    opacity: 1;
  }

  50% {
    transform:
      translateX(-50%)
      scaleX(.7);

    opacity: .65;
  }
}

@media (max-width: 620px) {
  .resume-logo img {
    width: 6rem;
  }

  .two-column-grid,
  .three-column-grid,
  .experience-date-grid {
    grid-template-columns:
      1fr;
  }

  .current-job-checkbox {
    margin-top: -.3rem;
  }

  .resume-section-header {
    padding: 1rem;
  }

  .resume-section-content {
    padding: 1rem;
  }

  .dynamic-card-header {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .dynamic-actions {
    width: 100%;

    justify-content:
      flex-end;
  }

  .finish-actions {
    flex-direction:
      column;
  }

  .finish-secondary,
  .finish-primary {
    width: 100%;
  }

  .skill-input-wrapper {
    grid-template-columns:
      auto
      minmax(0,1fr);
  }

  .skill-input-wrapper button {
    grid-column:
      1 / 3;

    margin:
      0 .3rem .3rem;

    justify-content:
      center;
  }

  .paper-two-columns {
    grid-template-columns:
      1fr;
  }

  .resume-toast {
    left: 1rem;
    right: 1rem;

    bottom: 1rem;

    justify-content:
      center;
  }
}

/* PRINT */

@media print {
  .resume-preview-column,
  .preview-sticky {
    display: block !important;
    position: static !important;
  }

  body * {
    visibility:
      hidden !important;
  }

  #resume-print-area,
  #resume-print-area * {
    visibility:
      visible !important;
  }

  #resume-print-area {
    position: absolute;

    top: 0;
    left: 0;

    width: 100%;

    min-height: 0;

    padding: 16mm;

    border: 0;

    border-radius: 0;

    box-shadow: none;

    transform: none !important;

    background: white;
  }

  @page {
    margin: 0;
    size: A4;
  }
}

/* ACESSIBILIDADE */

.resume-page button:focus-visible,
.resume-page input:focus-visible,
.resume-page textarea:focus-visible,
.resume-page select:focus-visible {
  outline:
    3px solid var(--violet);

  outline-offset: 3px;
}

@media (
  prefers-reduced-motion:
  reduce
) {
  html {
    scroll-behavior: auto;
  }

  .resume-page *,
  .resume-page *::before,
  .resume-page *::after {
    animation-duration:
      .01ms !important;

    animation-iteration-count:
      1 !important;

    transition-duration:
      .01ms !important;

    scroll-behavior:
      auto !important;
  }
}
`;

/* =========================================================
   ÍCONES
========================================================= */

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
      <circle
        cx="12"
        cy="8"
        r="3.5"
      />

      <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" />
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
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="3"
      />

      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />

      <path d="M3 12.5c5.5 2 12.5 2 18 0" />
    </svg>
  );
}

function FileIcon() {
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
      <path d="M6 2h8l4 4v16H6Z" />

      <path d="M14 2v5h5" />

      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function EducationIcon() {
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
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />

      <path d="M7 12v4c3 2 7 2 10 0v-4" />
    </svg>
  );
}

function CertificateIcon() {
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
      <circle
        cx="12"
        cy="9"
        r="5"
      />

      <path d="m9 14-1 7 4-2 4 2-1-7" />
    </svg>
  );
}

function LanguageIcon() {
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M3 12h18" />

      <path d="M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z" />
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

      <path d="m18 14 .7 2 .3.7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </svg>
  );
}

function MailIcon() {
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
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
      />

      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
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
      <path d="M7.5 4 10 8l-2 2c1.2 2.7 3.3 4.8 6 6l2-2 4 2.5c-.2 2.2-1.4 3.5-3.5 3.5C9.6 20 4 14.4 4 7.5 4 5.4 5.3 4.2 7.5 4Z" />
    </svg>
  );
}

function MapPinIcon() {
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
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function LinkIcon() {
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
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />

      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function LightbulbIcon() {
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
      <path d="M9 18h6M10 22h4" />

      <path d="M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z" />
    </svg>
  );
}

function UploadIcon() {
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
      <path d="M12 16V4" />

      <path d="m7 9 5-5 5 5" />

      <path d="M5 20h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
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
      <path d="M4 7h16" />

      <path d="M9 7V4h6v3" />

      <path d="m7 7 1 14h8l1-14" />
    </svg>
  );
}

function SaveIcon() {
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
      <path d="M5 3h12l2 2v16H5Z" />

      <path d="M8 3v6h8V3" />

      <path d="M8 21v-7h8v7" />
    </svg>
  );
}

function CopyIcon() {
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
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
      />

      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function PrinterIcon() {
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
      <path d="M7 8V3h10v5" />

      <rect
        x="4"
        y="8"
        width="16"
        height="9"
        rx="2"
      />

      <path d="M7 14h10v7H7Z" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function KeyboardIcon() {
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
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
      />

      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
    </svg>
  );
}

function AlertIcon() {
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 8v5M12 17h.01" />
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

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />

      <path d="m10 7-5 5 5 5" />
    </svg>
  );
}

function ArrowUpIcon() {
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
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon() {
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
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
