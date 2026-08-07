import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import { useNavigate } from "react-router-dom";

const MOCK_USER = {
  id: 1,
  nome: "Usuário Aleatório",
  email: "usuarioaleatorio@gmail.com",
  telefone: "(15) 99773-1901",
  foto: "https://i.pravatar.cc/300?img=12",
  cidade: "Tatuí, SP",
  objetivo: "Desenvolvimento de Software",
  perfilCompleto: 72,
};

const JOBS = [
  {
    id: 1,
    titulo: "Frontend Developer",
    empresa: "Point Tech",
    empresaSigla: "PT",
    descricao:
      "Crie experiências digitais rápidas, responsivas e visualmente marcantes usando tecnologias modernas de front-end.",
    descricaoCompleta:
      "Você fará parte de um time de produto multidisciplinar, trabalhando diretamente com design, produto e engenharia para construir novas experiências digitais.",
    categoria: "Desenvolvimento",
    modalidade: "Remoto",
    nivel: "Júnior",
    local: "São Paulo, SP",
    salario: "R$ 4.500 — R$ 6.500",
    match: 96,
    publicada: "Há 2 horas",
    candidatos: 18,
    nova: true,
    cor: "#ff4f8b",
    corClara: "#ffd9e6",
    skills: ["React", "JavaScript", "CSS", "REST API"],
    requisitos: [
      "Conhecimento em React",
      "JavaScript moderno",
      "HTML e CSS responsivo",
      "Git e consumo de APIs",
    ],
  },
  {
    id: 2,
    titulo: "Full Stack Developer",
    empresa: "Cloud System",
    empresaSigla: "CS",
    descricao:
      "Atue em aplicações web completas, criando APIs, interfaces e integrações para produtos em crescimento.",
    descricaoCompleta:
      "A equipe busca alguém com visão completa de produto, capacidade de trabalhar entre front-end e back-end e interesse por arquitetura.",
    categoria: "Desenvolvimento",
    modalidade: "Híbrido",
    nivel: "Júnior",
    local: "Campinas, SP",
    salario: "R$ 5.000 — R$ 7.000",
    match: 91,
    publicada: "Hoje",
    candidatos: 24,
    nova: true,
    cor: "#64c7ee",
    corClara: "#d9f5ff",
    skills: ["React", "Laravel", "MySQL", "Git"],
    requisitos: [
      "React",
      "Laravel",
      "Banco de dados relacional",
      "Versionamento com Git",
    ],
  },
  {
    id: 3,
    titulo: "UI/UX Designer",
    empresa: "Creative Studio",
    empresaSigla: "CR",
    descricao:
      "Crie interfaces modernas, fluxos intuitivos e experiências digitais centradas nas pessoas.",
    descricaoCompleta:
      "Você participará do processo completo de design, desde pesquisa e definição de fluxos até protótipos e entrega para desenvolvimento.",
    categoria: "Design",
    modalidade: "Híbrido",
    nivel: "Pleno",
    local: "São Paulo, SP",
    salario: "R$ 6.000 — R$ 8.500",
    match: 84,
    publicada: "Há 1 dia",
    candidatos: 31,
    nova: false,
    cor: "#9183ff",
    corClara: "#e3dfff",
    skills: ["Figma", "UX", "UI", "Design System"],
    requisitos: [
      "Figma",
      "Prototipação",
      "Design Systems",
      "Pesquisa com usuários",
    ],
  },
  {
    id: 4,
    titulo: "Analista de Dados",
    empresa: "Data Bloom",
    empresaSigla: "DB",
    descricao:
      "Transforme dados em decisões utilizando dashboards, análises e indicadores de negócio.",
    descricaoCompleta:
      "Você trabalhará com diferentes áreas da empresa para transformar dados brutos em informações acionáveis.",
    categoria: "Dados",
    modalidade: "Remoto",
    nivel: "Júnior",
    local: "Belo Horizonte, MG",
    salario: "R$ 4.000 — R$ 5.800",
    match: 78,
    publicada: "Há 2 dias",
    candidatos: 19,
    nova: false,
    cor: "#baf26d",
    corClara: "#eaffce",
    skills: ["SQL", "Power BI", "Excel", "Python"],
    requisitos: [
      "SQL",
      "Power BI",
      "Excel",
      "Raciocínio analítico",
    ],
  },
  {
    id: 5,
    titulo: "Social Media",
    empresa: "North Agency",
    empresaSigla: "NA",
    descricao:
      "Planeje conteúdos, acompanhe tendências e construa presença digital para marcas relevantes.",
    descricaoCompleta:
      "A pessoa atuará com planejamento editorial, produção de conteúdo e análise de desempenho nas principais plataformas.",
    categoria: "Marketing",
    modalidade: "Remoto",
    nivel: "Júnior",
    local: "Brasil",
    salario: "R$ 3.000 — R$ 4.200",
    match: 66,
    publicada: "Há 3 dias",
    candidatos: 42,
    nova: false,
    cor: "#ffd447",
    corClara: "#fff4bd",
    skills: ["Instagram", "TikTok", "Copy", "Analytics"],
    requisitos: [
      "Redes sociais",
      "Produção de conteúdo",
      "Copywriting",
      "Métricas digitais",
    ],
  },
  {
    id: 6,
    titulo: "QA Engineer",
    empresa: "Reliable Apps",
    empresaSigla: "RA",
    descricao:
      "Ajude a garantir qualidade, confiabilidade e estabilidade em aplicações utilizadas diariamente.",
    descricaoCompleta:
      "Você participará da definição da estratégia de qualidade, testes automatizados e validação de funcionalidades críticas.",
    categoria: "Qualidade",
    modalidade: "Remoto",
    nivel: "Pleno",
    local: "Florianópolis, SC",
    salario: "R$ 6.000 — R$ 8.000",
    match: 73,
    publicada: "Há 4 dias",
    candidatos: 17,
    nova: false,
    cor: "#ff9466",
    corClara: "#ffe1d5",
    skills: ["Cypress", "Playwright", "QA", "CI/CD"],
    requisitos: [
      "Testes automatizados",
      "Cypress ou Playwright",
      "Testes de API",
      "CI/CD",
    ],
  },
];

const APPLICATIONS = [
  {
    id: 1,
    empresa: "Nova Digital",
    vaga: "React Developer",
    status: "Entrevista",
    detalhe: "Entrevista técnica amanhã às 14h",
    cor: "#ffd447",
  },
  {
    id: 2,
    empresa: "Pixel Labs",
    vaga: "Frontend Júnior",
    status: "Em análise",
    detalhe: "Currículo visualizado há 2 horas",
    cor: "#64c7ee",
  },
  {
    id: 3,
    empresa: "Soft Vision",
    vaga: "Web Developer",
    status: "Enviada",
    detalhe: "Candidatura realizada ontem",
    cor: "#baf26d",
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    titulo: "Seu perfil chamou atenção",
    texto: "A Point Tech visualizou seu perfil.",
    tempo: "Há 8 min",
    nova: true,
  },
  {
    id: 2,
    titulo: "Nova vaga compatível",
    texto: "Frontend Developer possui 96% de match.",
    tempo: "Há 25 min",
    nova: true,
  },
  {
    id: 3,
    titulo: "Candidatura atualizada",
    texto: "Nova Digital avançou você para entrevista.",
    tempo: "Ontem",
    nova: false,
  },
];

const CATEGORIES = [
  "Todas",
  "Desenvolvimento",
  "Design",
  "Dados",
  "Marketing",
  "Qualidade",
];

const MODES = [
  "Todas",
  "Remoto",
  "Híbrido",
  "Presencial",
];

export default function HomeUser() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const pageRef = useRef(null);
  const jobsRef = useRef(null);

  const [usuario] = useState(MOCK_USER);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [modalidade, setModalidade] = useState("Todas");
  const [ordenacao, setOrdenacao] = useState("match");

  const [vagaSelecionada, setVagaSelecionada] =
    useState(null);

  const [favoritas, setFavoritas] = useState(new Set());
  const [favoritasCarregadas, setFavoritasCarregadas] =
    useState(false);

  const [candidaturas, setCandidaturas] =
    useState(APPLICATIONS);

  const [candidatadas, setCandidatadas] = useState(
    new Set(),
  );

  const [notificacoesAbertas, setNotificacoesAbertas] =
    useState(false);

  const [toast, setToast] = useState("");

  const primeiroNome =
    usuario.nome.trim().split(" ")[0] || "Usuário";

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";

    return "Boa noite";
  }, []);

  const vagasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const resultado = JOBS.filter((vaga) => {
      const correspondeCategoria =
        categoria === "Todas" ||
        vaga.categoria === categoria;

      const correspondeModalidade =
        modalidade === "Todas" ||
        vaga.modalidade === modalidade;

      const textoPesquisavel = [
        vaga.titulo,
        vaga.empresa,
        vaga.categoria,
        vaga.modalidade,
        vaga.local,
        vaga.nivel,
        ...vaga.skills,
      ]
        .join(" ")
        .toLowerCase();

      const correspondeBusca =
        !termo || textoPesquisavel.includes(termo);

      return (
        correspondeCategoria &&
        correspondeModalidade &&
        correspondeBusca
      );
    });

    return [...resultado].sort((a, b) => {
      if (ordenacao === "recentes") {
        return Number(b.nova) - Number(a.nova);
      }

      if (ordenacao === "salario") {
        return (
          extrairSalarioInicial(b.salario) -
          extrairSalarioInicial(a.salario)
        );
      }

      return b.match - a.match;
    });
  }, [busca, categoria, modalidade, ordenacao]);

  const melhoresMatches = useMemo(
    () =>
      [...JOBS]
        .sort((a, b) => b.match - a.match)
        .slice(0, 3),
    [],
  );

  const novasNotificacoes = NOTIFICATIONS.filter(
    (notificacao) => notificacao.nova,
  ).length;

  useEffect(() => {
    try {
      const armazenadas = localStorage.getItem(
        "point:user:favoritas",
      );

      if (armazenadas) {
        const ids = JSON.parse(armazenadas);

        if (Array.isArray(ids)) {
          setFavoritas(new Set(ids));
        }
      }
    } catch (error) {
      console.error(
        "Erro ao carregar vagas favoritas:",
        error,
      );
    } finally {
      setFavoritasCarregadas(true);
    }
  }, []);

  useEffect(() => {
    if (!favoritasCarregadas) return;

    try {
      localStorage.setItem(
        "point:user:favoritas",
        JSON.stringify([...favoritas]),
      );
    } catch (error) {
      console.error(
        "Erro ao salvar vagas favoritas:",
        error,
      );
    }
  }, [favoritas, favoritasCarregadas]);

  useEffect(() => {
    const temModal =
      vagaSelecionada || notificacoesAbertas;

    document.body.style.overflow = temModal
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [vagaSelecionada, notificacoesAbertas]);

  function handlePointerMove(event) {
    if (
      reduceMotion ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    const page = pageRef.current;

    if (!page) return;

    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    page.style.setProperty(
      "--move-x",
      `${x * 16}px`,
    );

    page.style.setProperty(
      "--move-y",
      `${y * 12}px`,
    );

    page.style.setProperty(
      "--move-x-reverse",
      `${x * -12}px`,
    );

    page.style.setProperty(
      "--move-y-reverse",
      `${y * -10}px`,
    );
  }

  function scrollParaVagas() {
    jobsRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function toggleFavorita(id) {
    const jaFavorita = favoritas.has(id);

    setFavoritas((estadoAtual) => {
      const proximo = new Set(estadoAtual);

      if (proximo.has(id)) {
        proximo.delete(id);
      } else {
        proximo.add(id);
      }

      return proximo;
    });

    mostrarToast(
      jaFavorita
        ? "Vaga removida das favoritas."
        : "Vaga salva para ver depois.",
    );
  }

  function candidatar(vaga) {
    if (candidatadas.has(vaga.id)) return;

    setCandidatadas((estadoAtual) => {
      const proximo = new Set(estadoAtual);
      proximo.add(vaga.id);
      return proximo;
    });

    setCandidaturas((estadoAtual) => [
      {
        id: Date.now(),
        empresa: vaga.empresa,
        vaga: vaga.titulo,
        status: "Enviada",
        detalhe: "Candidatura realizada agora",
        cor: vaga.cor,
      },
      ...estadoAtual,
    ]);

    mostrarToast(
      `Candidatura enviada para ${vaga.empresa}!`,
    );
  }

  function mostrarToast(mensagem) {
    setToast(mensagem);

    window.clearTimeout(
      mostrarToast.timeout,
    );

    mostrarToast.timeout =
      window.setTimeout(() => {
        setToast("");
      }, 2600);
  }

  return (
    <>
      <style>{styles}</style>

      <main
        ref={pageRef}
        className="user-home"
        onPointerMove={handlePointerMove}
      >
        <div
          className="background-shape background-shape--pink"
          aria-hidden="true"
        />

        <div
          className="background-shape background-shape--blue"
          aria-hidden="true"
        />

        <header className="user-header">
          <button
            type="button"
            className="brand"
            onClick={() => navigate("/")}
          >
            <span className="brand-p">p</span>
            <span className="brand-o">o</span>
            int
            <i />
          </button>

          <nav className="desktop-nav">
            <button className="active">
              Meu espaço
            </button>

            <button onClick={scrollParaVagas}>
              Vagas
            </button>

            <button
              onClick={() =>
                navigate("/candidaturas")
              }
            >
              Candidaturas
            </button>

            <button
              onClick={() =>
                navigate("/portfolio")
              }
            >
              Portfólio
            </button>
          </nav>

          <div className="header-right">
            <button
              type="button"
              className="notification-button"
              onClick={() =>
                setNotificacoesAbertas(true)
              }
              aria-label="Abrir notificações"
            >
              <BellIcon />

              {novasNotificacoes > 0 && (
                <span>
                  {novasNotificacoes}
                </span>
              )}
            </button>

            <button
              type="button"
              className="user-menu-button"
              onClick={() => navigate("/perfil")}
            >
              <img
                src={usuario.foto}
                alt={usuario.nome}
              />

              <span>
                <strong>{primeiroNome}</strong>
                <small>Meu perfil</small>
              </span>

              <ArrowUpRightIcon />
            </button>
          </div>
        </header>

        <div className="user-layout">
          <section className="welcome-section">
            <motion.div
              className="welcome-copy"
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
            >
              <span className="welcome-kicker">
                <SparklesIcon />
                Seu espaço profissional
              </span>

              <h1>
                {saudacao},
                <br />
                <strong>{primeiroNome}.</strong>
              </h1>

              <p>
                Tem coisa acontecendo por aqui.
                Encontramos novas oportunidades que
                combinam com seu perfil e há etapas da
                sua jornada esperando por você.
              </p>

              <div className="welcome-actions">
                <button
                  type="button"
                  className="primary-action"
                  onClick={scrollParaVagas}
                >
                  Ver meus matches
                  <ArrowRightIcon />
                </button>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() =>
                    navigate("/perfil")
                  }
                >
                  Melhorar meu perfil
                </button>
              </div>
            </motion.div>

            <motion.div
              className="career-card-wrapper"
              initial={{
                opacity: 0,
                scale: 0.96,
                rotate: 2,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.1,
              }}
            >
              <div
                className="career-card-back"
                aria-hidden="true"
              />

              <article className="career-card">
                <div className="career-card-top">
                  <span>
                    Perfil profissional
                  </span>

                  <span className="career-code">
                    POINT · 2026
                  </span>
                </div>

                <div className="career-user">
                  <img
                    src={usuario.foto}
                    alt={usuario.nome}
                  />

                  <div>
                    <h2>{usuario.nome}</h2>
                    <p>{usuario.objetivo}</p>

                    <span>
                      <MapPinIcon />
                      {usuario.cidade}
                    </span>
                  </div>
                </div>

                <div className="profile-progress-header">
                  <span>
                    Força do perfil
                  </span>

                  <strong>
                    {usuario.perfilCompleto}%
                  </strong>
                </div>

                <div className="profile-progress">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{
                      width: `${usuario.perfilCompleto}%`,
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.45,
                    }}
                  />
                </div>

                <div className="career-card-tip">
                  <span className="tip-icon">
                    <LightbulbIcon />
                  </span>

                  <div>
                    <strong>
                      Falta pouco para ficar incrível
                    </strong>

                    <p>
                      Adicione 2 projetos e suas
                      principais habilidades.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/perfil")
                  }
                >
                  Completar meu perfil
                  <ArrowUpRightIcon />
                </button>
              </article>
            </motion.div>
          </section>

          <section className="overview-grid">
            <DashboardStat
              label="Matches"
              value="12"
              detail="4 novos hoje"
              color="#ff4f8b"
              icon={<TargetIcon />}
            />

            <DashboardStat
              label="Candidaturas"
              value={candidaturas.length}
              detail="1 em entrevista"
              color="#64c7ee"
              icon={<RouteIcon />}
            />

            <DashboardStat
              label="Favoritas"
              value={favoritas.size}
              detail="Salvas para depois"
              color="#ffd447"
              icon={<BookmarkIcon />}
            />

            <DashboardStat
              label="Visualizações"
              value="27"
              detail="+8 nesta semana"
              color="#baf26d"
              icon={<EyeIcon />}
            />
          </section>

          <section className="dashboard-content">
            <div className="dashboard-main-column">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">
                    <i />
                    Próximos passos
                  </span>

                  <h2>
                    Sua jornada está andando.
                  </h2>
                </div>
              </div>

              <div className="journey-grid">
                <article className="journey-card journey-card--interview">
                  <div className="journey-card-top">
                    <span className="journey-label">
                      Próximo compromisso
                    </span>

                    <CalendarIcon />
                  </div>

                  <strong className="journey-time">
                    Amanhã · 14:00
                  </strong>

                  <h3>
                    Entrevista técnica
                  </h3>

                  <p>
                    React Developer · Nova Digital
                  </p>

                  <div className="interview-actions">
                    <button
                      type="button"
                      onClick={() =>
                        mostrarToast(
                          "Preparação de entrevista adicionada ao seu radar.",
                        )
                      }
                    >
                      <SparklesIcon />
                      Preparar entrevista
                    </button>

                    <button
                      type="button"
                      aria-label="Mais informações"
                    >
                      <ArrowUpRightIcon />
                    </button>
                  </div>
                </article>

                <article className="journey-card journey-card--task">
                  <div className="journey-card-top">
                    <span className="journey-label">
                      Melhore seu alcance
                    </span>

                    <ProfileIcon />
                  </div>

                  <h3>
                    Complete seu perfil.
                  </h3>

                  <p>
                    Perfis acima de 85% recebem mais
                    visualizações das empresas.
                  </p>

                  <div className="mini-progress">
                    <span
                      style={{
                        width: `${usuario.perfilCompleto}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/perfil")
                    }
                  >
                    Continuar agora
                    <ArrowRightIcon />
                  </button>
                </article>
              </div>
            </div>

            <aside className="application-sidebar">
              <div className="sidebar-heading">
                <div>
                  <span>
                    Minhas candidaturas
                  </span>

                  <strong>
                    {candidaturas.length}
                  </strong>
                </div>

                <button
                  onClick={() =>
                    navigate("/candidaturas")
                  }
                >
                  Ver todas
                </button>
              </div>

              <div className="applications-list">
                {candidaturas
                  .slice(0, 4)
                  .map((aplicacao) => (
                    <ApplicationItem
                      key={aplicacao.id}
                      application={aplicacao}
                    />
                  ))}
              </div>
            </aside>
          </section>

          <section
            ref={jobsRef}
            className="recommended-jobs"
          >
            <div className="section-heading section-heading--jobs">
              <div>
                <span className="section-eyebrow">
                  <i />
                  Radar personalizado
                </span>

                <h2>
                  Feitas para você.
                </h2>

                <p>
                  As oportunidades são ordenadas
                  considerando compatibilidade com seu
                  perfil.
                </p>
              </div>

              <div className="match-summary">
                <span>
                  Melhor match
                </span>

                <strong>
                  {melhoresMatches[0].match}%
                </strong>
              </div>
            </div>

            <div className="jobs-toolbar">
              <div className="search-field">
                <SearchIcon />

                <input
                  type="search"
                  value={busca}
                  onChange={(event) =>
                    setBusca(event.target.value)
                  }
                  placeholder="Cargo, empresa, habilidade..."
                />

                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>

              <label className="sort-field">
                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(
                      event.target.value,
                    )
                  }
                >
                  <option value="match">
                    Melhor match
                  </option>

                  <option value="recentes">
                    Mais recentes
                  </option>

                  <option value="salario">
                    Maior salário
                  </option>
                </select>

                <ChevronDownIcon />
              </label>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      categoria === item
                        ? "filter-chip filter-chip--active"
                        : "filter-chip"
                    }
                    onClick={() =>
                      setCategoria(item)
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="work-mode-filter">
                <span>
                  Modelo
                </span>

                <select
                  value={modalidade}
                  onChange={(event) =>
                    setModalidade(
                      event.target.value,
                    )
                  }
                >
                  {MODES.map((modo) => (
                    <option
                      key={modo}
                      value={modo}
                    >
                      {modo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="results-line">
              <span>
                <strong>
                  {vagasFiltradas.length}
                </strong>{" "}
                oportunidades encontradas
              </span>

              {(busca ||
                categoria !== "Todas" ||
                modalidade !== "Todas") && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setCategoria("Todas");
                    setModalidade("Todas");
                  }}
                >
                  Limpar filtros
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {vagasFiltradas.length > 0 ? (
                <motion.div
                  layout
                  className="jobs-grid"
                >
                  {vagasFiltradas.map(
                    (vaga, index) => (
                      <JobCard
                        key={vaga.id}
                        vaga={vaga}
                        index={index}
                        favorita={favoritas.has(
                          vaga.id,
                        )}
                        candidatada={candidatadas.has(
                          vaga.id,
                        )}
                        onFavoritar={() =>
                          toggleFavorita(vaga.id)
                        }
                        onAbrir={() =>
                          setVagaSelecionada(vaga)
                        }
                      />
                    ),
                  )}
                </motion.div>
              ) : (
                <EmptyState
                  onReset={() => {
                    setBusca("");
                    setCategoria("Todas");
                    setModalidade("Todas");
                  }}
                />
              )}
            </AnimatePresence>

            <div className="jobs-footer-action">
              <button
                type="button"
                onClick={() =>
                  navigate("/vagas")
                }
              >
                Explorar todas as vagas
                <ArrowRightIcon />
              </button>
            </div>
          </section>

          <section className="career-insights">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  <i />
                  Insights do seu perfil
                </span>

                <h2>
                  Pequenas ações. Mais oportunidades.
                </h2>
              </div>
            </div>

            <div className="insights-grid">
              <InsightCard
                number="01"
                icon={<CodeIcon />}
                color="#64c7ee"
                title="React aparece em 68% dos seus matches"
                text="Destacar projetos reais com React pode aumentar sua relevância nas recomendações."
                action="Adicionar projeto"
                onClick={() =>
                  navigate("/portfolio")
                }
              />

              <InsightCard
                number="02"
                icon={<FileIcon />}
                color="#ffd447"
                title="Seu currículo ainda pode melhorar"
                text="Você ainda não adicionou resultados ou conquistas nas experiências profissionais."
                action="Editar currículo"
                onClick={() =>
                  navigate("/curriculo")
                }
              />

              <InsightCard
                number="03"
                icon={<TargetIcon />}
                color="#baf26d"
                title="Seu perfil está bem alinhado"
                text="Desenvolvimento Front-end é hoje a área com maior compatibilidade para você."
                action="Ver oportunidades"
                onClick={scrollParaVagas}
              />
            </div>
          </section>
        </div>

        <footer className="user-footer">
          <div className="footer-brand">
            <span>
              <i>p</i>
              <b>o</b>
              int
            </span>

            <p>
              Seu espaço para construir caminhos
              profissionais com mais personalidade.
            </p>
          </div>

          <div className="footer-links">
            <button
              onClick={scrollParaVagas}
            >
              Vagas
            </button>

            <button
              onClick={() =>
                navigate("/candidaturas")
              }
            >
              Candidaturas
            </button>

            <button
              onClick={() =>
                navigate("/perfil")
              }
            >
              Perfil
            </button>

            <button
              onClick={() =>
                navigate("/portfolio")
              }
            >
              Portfólio
            </button>
          </div>

          <span className="footer-copy">
            © 2026 Point
          </span>
        </footer>

        <AnimatePresence>
          {vagaSelecionada && (
            <JobModal
              vaga={vagaSelecionada}
              favorita={favoritas.has(
                vagaSelecionada.id,
              )}
              candidatada={candidatadas.has(
                vagaSelecionada.id,
              )}
              onFavoritar={() =>
                toggleFavorita(
                  vagaSelecionada.id,
                )
              }
              onCandidatar={() =>
                candidatar(vagaSelecionada)
              }
              onClose={() =>
                setVagaSelecionada(null)
              }
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notificacoesAbertas && (
            <NotificationsPanel
              onClose={() =>
                setNotificacoesAbertas(false)
              }
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              className="toast"
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

function DashboardStat({
  label,
  value,
  detail,
  color,
  icon,
}) {
  return (
    <motion.article
      className="dashboard-stat"
      style={{
        "--stat-color": color,
      }}
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{ once: true }}
      whileHover={{
        y: -4,
      }}
    >
      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-copy">
        <span>{label}</span>

        <strong>{value}</strong>

        <small>{detail}</small>
      </div>
    </motion.article>
  );
}

function ApplicationItem({
  application,
}) {
  return (
    <div className="application-item">
      <span
        className="application-indicator"
        style={{
          background: application.cor,
        }}
      />

      <div>
        <strong>
          {application.vaga}
        </strong>

        <span>
          {application.empresa}
        </span>

        <small>
          {application.detalhe}
        </small>
      </div>

      <span className="application-status">
        {application.status}
      </span>
    </div>
  );
}

function JobCard({
  vaga,
  index,
  favorita,
  candidatada,
  onFavoritar,
  onAbrir,
}) {
  return (
    <motion.article
      layout
      className="job-card"
      style={{
        "--job-color": vaga.cor,
        "--job-soft": vaga.corClara,
      }}
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.96,
      }}
      transition={{
        delay: Math.min(
          index * 0.05,
          0.25,
        ),
      }}
      onClick={onAbrir}
    >
      <div className="job-card-top">
        <span className="company-avatar">
          {vaga.empresaSigla}
        </span>

        <div className="job-top-tags">
          {vaga.nova && (
            <span className="new-job-tag">
              Nova
            </span>
          )}

          <span>
            {vaga.publicada}
          </span>
        </div>

        <button
          type="button"
          className={
            favorita
              ? "favorite-button favorite-button--active"
              : "favorite-button"
          }
          onClick={(event) => {
            event.stopPropagation();
            onFavoritar();
          }}
        >
          <BookmarkIcon
            filled={favorita}
          />
        </button>
      </div>

      <div className="job-match">
        <span>
          <TargetIcon />
          Match com você
        </span>

        <strong>
          {vaga.match}%
        </strong>
      </div>

      <h3>{vaga.titulo}</h3>

      <div className="job-company">
        <strong>
          {vaga.empresa}
        </strong>

        <span>
          {vaga.local}
        </span>
      </div>

      <div className="job-meta">
        <span>
          <LaptopIcon />
          {vaga.modalidade}
        </span>

        <span>
          <BriefcaseIcon />
          {vaga.nivel}
        </span>
      </div>

      <div className="job-skills">
        {vaga.skills
          .slice(0, 3)
          .map((skill) => (
            <span key={skill}>
              {skill}
            </span>
          ))}
      </div>

      <div className="job-footer">
        <div>
          <small>
            Faixa salarial
          </small>

          <strong>
            {vaga.salario}
          </strong>
        </div>

        <button
          type="button"
          className={
            candidatada
              ? "job-open-button job-open-button--applied"
              : "job-open-button"
          }
          onClick={(event) => {
            event.stopPropagation();
            onAbrir();
          }}
        >
          {candidatada ? (
            <CheckIcon />
          ) : (
            <ArrowUpRightIcon />
          )}
        </button>
      </div>
    </motion.article>
  );
}

function JobModal({
  vaga,
  favorita,
  candidatada,
  onFavoritar,
  onCandidatar,
  onClose,
}) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <motion.article
        className="job-modal"
        style={{
          "--job-color": vaga.cor,
          "--job-soft": vaga.corClara,
        }}
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 24,
          scale: 0.97,
        }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <div className="modal-header">
          <span className="modal-company-avatar">
            {vaga.empresaSigla}
          </span>

          <div>
            <span className="modal-kicker">
              {vaga.categoria} ·{" "}
              {vaga.modalidade}
            </span>

            <h2>
              {vaga.titulo}
            </h2>

            <p>
              {vaga.empresa} ·{" "}
              {vaga.local}
            </p>
          </div>
        </div>

        <div className="modal-match-box">
          <div>
            <span>
              Compatibilidade
            </span>

            <strong>
              {vaga.match}%
            </strong>
          </div>

          <div className="modal-match-bar">
            <span
              style={{
                width: `${vaga.match}%`,
              }}
            />
          </div>

          <small>
            Seu perfil possui boa
            compatibilidade com os requisitos
            desta vaga.
          </small>
        </div>

        <div className="modal-stats">
          <div>
            <span>Salário</span>
            <strong>
              {vaga.salario}
            </strong>
          </div>

          <div>
            <span>Nível</span>
            <strong>
              {vaga.nivel}
            </strong>
          </div>

          <div>
            <span>Candidatos</span>
            <strong>
              {vaga.candidatos}
            </strong>
          </div>
        </div>

        <div className="modal-body">
          <section>
            <h3>
              Sobre a oportunidade
            </h3>

            <p>
              {vaga.descricaoCompleta}
            </p>
          </section>

          <section>
            <h3>
              O que estamos procurando
            </h3>

            <ul>
              {vaga.requisitos.map(
                (item) => (
                  <li key={item}>
                    <CheckIcon />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </section>

          <section>
            <h3>
              Tecnologias
            </h3>

            <div className="modal-skills">
              {vaga.skills.map(
                (skill) => (
                  <span key={skill}>
                    {skill}
                  </span>
                ),
              )}
            </div>
          </section>
        </div>

        <footer className="modal-footer">
          <button
            type="button"
            className={
              favorita
                ? "modal-favorite modal-favorite--active"
                : "modal-favorite"
            }
            onClick={onFavoritar}
          >
            <BookmarkIcon
              filled={favorita}
            />

            {favorita
              ? "Vaga salva"
              : "Salvar vaga"}
          </button>

          <button
            type="button"
            className={
              candidatada
                ? "modal-apply modal-apply--done"
                : "modal-apply"
            }
            onClick={onCandidatar}
            disabled={candidatada}
          >
            {candidatada ? (
              <>
                <CheckIcon />
                Candidatura enviada
              </>
            ) : (
              <>
                Candidatar agora
                <ArrowRightIcon />
              </>
            )}
          </button>
        </footer>
      </motion.article>
    </motion.div>
  );
}

function NotificationsPanel({
  onClose,
}) {
  return (
    <motion.div
      className="notification-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <motion.aside
        className="notification-panel"
        initial={{
          x: "105%",
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x: "105%",
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 28,
        }}
      >
        <div className="notification-header">
          <div>
            <span>
              Central
            </span>

            <h2>
              Notificações
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="notification-list">
          {NOTIFICATIONS.map(
            (notification) => (
              <article
                key={notification.id}
                className={
                  notification.nova
                    ? "notification-item notification-item--new"
                    : "notification-item"
                }
              >
                <span className="notification-dot" />

                <div>
                  <strong>
                    {notification.titulo}
                  </strong>

                  <p>
                    {notification.texto}
                  </p>

                  <small>
                    {notification.tempo}
                  </small>
                </div>
              </article>
            ),
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}

function InsightCard({
  number,
  icon,
  color,
  title,
  text,
  action,
  onClick,
}) {
  return (
    <motion.article
      className="insight-card"
      style={{
        "--insight-color": color,
      }}
      whileHover={{
        y: -5,
      }}
    >
      <span className="insight-number">
        {number}
      </span>

      <span className="insight-icon">
        {icon}
      </span>

      <h3>{title}</h3>

      <p>{text}</p>

      <button
        type="button"
        onClick={onClick}
      >
        {action}
        <ArrowUpRightIcon />
      </button>
    </motion.article>
  );
}

function EmptyState({ onReset }) {
  return (
    <motion.div
      className="empty-state"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
    >
      <span>
        <SearchIcon />
      </span>

      <h3>
        Nenhuma oportunidade por aqui.
      </h3>

      <p>
        Ajuste os filtros para ampliar sua
        busca.
      </p>

      <button
        type="button"
        onClick={onReset}
      >
        Limpar filtros
      </button>
    </motion.div>
  );
}

function extrairSalarioInicial(
  salario,
) {
  const resultado =
    salario.match(/R\$\s*([\d.]+)/);

  if (!resultado) return 0;

  return Number(
    resultado[1].replace(".", ""),
  );
}

const styles = `
  :root {
    color-scheme: light;
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

  .user-home,
  .user-home * {
    box-sizing: border-box;
  }

  .user-home {
    --paper: #f5f1e9;
    --paper-light: #fffdf8;
    --ink: #17171a;
    --pink: #ff4f8b;
    --blue: #64c7ee;
    --yellow: #ffd447;
    --lime: #baf26d;
    --violet: #9183ff;
    --muted: #716a64;

    --move-x: 0px;
    --move-y: 0px;
    --move-x-reverse: 0px;
    --move-y-reverse: 0px;

    position: relative;
    min-height: 100vh;
    overflow: hidden;

    background:
      linear-gradient(
        rgba(23,23,26,.035) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(23,23,26,.035) 1px,
        transparent 1px
      ),
      var(--paper);

    background-size:
      56px 56px,
      56px 56px,
      auto;

    color: var(--ink);

    font-family:
      Inter,
      "SF Pro Display",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .user-home::after {
    content: "";

    position: absolute;
    inset: 0;

    z-index: 9999;

    pointer-events: none;

    opacity: .045;

    background-image:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.9'/%3E%3C/svg%3E");

    mix-blend-mode: multiply;
  }

  .background-shape {
    position: absolute;

    z-index: 0;

    border: 3px solid var(--ink);

    pointer-events: none;

    transition:
      transform .15s ease-out;
  }

  .background-shape--pink {
    top: 2rem;
    right: -9rem;

    width: 23rem;
    height: 23rem;

    border-radius:
      55% 45% 38% 62% /
      42% 59% 41% 58%;

    background: var(--pink);

    opacity: .11;

    transform:
      translate(
        var(--move-x),
        var(--move-y)
      );

    animation:
      blobMorph 13s ease-in-out infinite;
  }

  .background-shape--blue {
    top: 50rem;
    left: -11rem;

    width: 25rem;
    height: 25rem;

    border-radius:
      44% 56% 62% 38% /
      59% 41% 59% 41%;

    background: var(--blue);

    opacity: .12;

    transform:
      translate(
        var(--move-x-reverse),
        var(--move-y-reverse)
      );

    animation:
      blobMorph 16s ease-in-out infinite reverse;
  }

  .user-header {
    position: sticky;

    z-index: 500;

    top: 0;

    display: grid;

    grid-template-columns:
      minmax(9rem,1fr)
      auto
      minmax(9rem,1fr);

    align-items: center;

    gap: 2rem;

    min-height: 5.4rem;

    padding:
      .8rem
      clamp(1rem,4vw,4.5rem);

    border-bottom:
      1px solid rgba(23,23,26,.09);

    background:
      rgba(245,241,233,.89);

    backdrop-filter:
      blur(18px);

    -webkit-backdrop-filter:
      blur(18px);
  }

  .brand {
    position: relative;

    justify-self: start;

    display: inline-flex;

    align-items: baseline;

    padding: 0;

    border: 0;

    background: transparent;

    color: var(--ink);

    font-size: 2.1rem;

    font-weight: 950;

    letter-spacing: -.08em;

    cursor: pointer;
  }

  .brand-p {
    color: var(--pink);
  }

  .brand-o {
    color: #358edc;
  }

  .brand i {
    position: absolute;

    top: .15rem;
    right: -.65rem;

    width: .45rem;
    height: .45rem;

    border: 1.5px solid var(--ink);

    border-radius: 50%;

    background: var(--lime);
  }

  .desktop-nav {
    display: flex;

    align-items: center;

    gap: .2rem;

    padding: .3rem;

    border: 2px solid var(--ink);

    border-radius: 999px;

    background: var(--paper-light);

    box-shadow:
      3px 3px 0 var(--ink);
  }

  .desktop-nav button {
    min-height: 2.25rem;

    padding:
      .5rem .8rem;

    border: 0;

    border-radius: 999px;

    background: transparent;

    color: var(--ink);

    font-size: .66rem;

    font-weight: 850;

    cursor: pointer;
  }

  .desktop-nav button:hover {
    background: #ece6dc;
  }

  .desktop-nav .active {
    background: var(--yellow);
  }

  .header-right {
    justify-self: end;

    display: flex;

    align-items: center;

    gap: .7rem;
  }

  .notification-button {
    position: relative;

    display: grid;

    place-items: center;

    width: 2.8rem;
    height: 2.8rem;

    border: 2px solid var(--ink);

    border-radius: 50%;

    background: var(--paper-light);

    color: var(--ink);

    cursor: pointer;

    box-shadow:
      3px 3px 0 var(--ink);

    transition:
      transform .2s ease,
      background .2s ease;
  }

  .notification-button:hover {
    background: var(--yellow);

    transform:
      translate(-2px,-2px)
      rotate(-5deg);
  }

  .notification-button svg {
    width: 1rem;
    height: 1rem;
  }

  .notification-button > span {
    position: absolute;

    top: -.4rem;
    right: -.4rem;

    display: grid;

    place-items: center;

    min-width: 1.3rem;
    height: 1.3rem;

    border: 2px solid var(--ink);

    border-radius: 999px;

    background: var(--pink);

    color: #fff;

    font-size: .5rem;

    font-weight: 950;
  }

  .user-menu-button {
    display: grid;

    grid-template-columns:
      auto
      minmax(0,1fr)
      auto;

    align-items: center;

    gap: .65rem;

    min-width: 10rem;

    padding:
      .35rem .6rem .35rem .35rem;

    border: 2px solid var(--ink);

    border-radius: 999px;

    background: var(--paper-light);

    color: var(--ink);

    cursor: pointer;

    box-shadow:
      3px 3px 0 rgba(23,23,26,.18);

    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }

  .user-menu-button:hover {
    transform:
      translate(-1px,-1px);

    box-shadow:
      5px 5px 0 var(--ink);
  }

  .user-menu-button img {
    width: 2rem;
    height: 2rem;

    border: 1.5px solid var(--ink);

    border-radius: 50%;

    object-fit: cover;
  }

  .user-menu-button > span {
    display: flex;

    flex-direction: column;

    min-width: 0;

    text-align: left;
  }

  .user-menu-button strong {
    overflow: hidden;

    font-size: .63rem;

    font-weight: 950;

    text-overflow: ellipsis;

    white-space: nowrap;
  }

  .user-menu-button small {
    color: var(--muted);

    font-size: .5rem;

    font-weight: 700;
  }

  .user-menu-button > svg {
    width: .85rem;
    height: .85rem;
  }

  .user-layout {
    position: relative;

    z-index: 5;

    width:
      min(100%,1520px);

    margin: 0 auto;

    padding:
      0
      clamp(1rem,4vw,4.5rem)
      7rem;
  }

  .welcome-section {
    display: grid;

    grid-template-columns:
      minmax(0,1fr)
      minmax(360px,.65fr);

    align-items: center;

    gap:
      clamp(3rem,7vw,7rem);

    min-height: 35rem;

    padding:
      clamp(3rem,7vh,6rem)
      0;
  }

  .welcome-kicker {
    display: inline-flex;

    align-items: center;

    gap: .5rem;

    padding:
      .45rem .6rem;

    border: 2px solid var(--ink);

    border-radius: .55rem;

    background: var(--blue);

    font-size: .58rem;

    font-weight: 950;

    letter-spacing: .1em;

    text-transform: uppercase;

    box-shadow:
      3px 3px 0 var(--ink);

    transform:
      rotate(-1deg);
  }

  .welcome-kicker svg {
    width: .8rem;
    height: .8rem;
  }

  .welcome-copy h1 {
    margin:
      1.2rem 0 0;

    font-size:
      clamp(3.5rem,7vw,7rem);

    font-weight: 950;

    line-height: .82;

    letter-spacing: -.085em;

    text-transform: uppercase;
  }

  .welcome-copy h1 strong {
    position: relative;

    display: inline-block;

    color: var(--paper-light);

    text-shadow:
      -2px -2px 0 var(--ink),
      2px -2px 0 var(--ink),
      -2px 2px 0 var(--ink),
      2px 2px 0 var(--ink),
      6px 6px 0 var(--pink);

    transform:
      rotate(-1deg);
  }

  .welcome-copy p {
    max-width: 37rem;

    margin:
      1.5rem 0 0;

    color: #56504b;

    font-size: .9rem;

    font-weight: 650;

    line-height: 1.7;
  }

  .welcome-actions {
    display: flex;

    flex-wrap: wrap;

    gap: .8rem;

    margin-top: 1.8rem;
  }

  .primary-action,
  .secondary-action {
    min-height: 3.3rem;

    padding:
      .7rem 1rem;

    border: 2px solid var(--ink);

    border-radius: .9rem;

    font-size: .65rem;

    font-weight: 950;

    letter-spacing: .05em;

    text-transform: uppercase;

    cursor: pointer;

    transition:
      transform .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }

  .primary-action {
    display: flex;

    align-items: center;

    gap: .6rem;

    background: var(--ink);

    color: #fff;

    box-shadow:
      5px 5px 0 var(--pink);
  }

  .primary-action:hover {
    background: var(--pink);

    transform:
      translate(-2px,-2px);

    box-shadow:
      8px 8px 0 var(--blue),
      10px 10px 0 var(--ink);
  }

  .primary-action svg {
    width: .95rem;
    height: .95rem;
  }

  .secondary-action {
    background: var(--paper-light);

    color: var(--ink);

    box-shadow:
      4px 4px 0 var(--ink);
  }

  .secondary-action:hover {
    background: var(--lime);

    transform:
      translate(-2px,-2px);
  }

  .career-card-wrapper {
    position: relative;

    width: min(100%,28rem);

    justify-self: end;
  }

  .career-card-back {
    position: absolute;

    inset: .8rem -.7rem -.7rem .7rem;

    border: 3px solid var(--ink);

    border-radius: 1.6rem;

    background: var(--pink);

    transform:
      rotate(2deg);
  }

  .career-card {
    position: relative;

    z-index: 2;

    padding: 1.3rem;

    border: 3px solid var(--ink);

    border-radius: 1.6rem;

    background: var(--paper-light);

    box-shadow:
      0 20px 60px rgba(23,23,26,.1);
  }

  .career-card-top {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;

    padding-bottom: .8rem;

    border-bottom:
      2px dashed rgba(23,23,26,.22);

    font-size: .54rem;

    font-weight: 950;

    letter-spacing: .09em;

    text-transform: uppercase;
  }

  .career-code {
    color: var(--muted);

    font-family:
      "Courier New",
      monospace;
  }

  .career-user {
    display: flex;

    align-items: center;

    gap: .9rem;

    margin-top: 1rem;
  }

  .career-user img {
    width: 4.5rem;
    height: 4.5rem;

    border: 2px solid var(--ink);

    border-radius: 1.1rem;

    object-fit: cover;

    box-shadow:
      4px 4px 0 var(--yellow);

    transform:
      rotate(-3deg);
  }

  .career-user > div {
    min-width: 0;
  }

  .career-user h2 {
    margin: 0;

    overflow: hidden;

    font-size: 1.2rem;

    font-weight: 950;

    letter-spacing: -.04em;

    text-overflow: ellipsis;

    white-space: nowrap;
  }

  .career-user p {
    margin:
      .2rem 0 .45rem;

    color: var(--muted);

    font-size: .6rem;

    font-weight: 700;
  }

  .career-user span {
    display: flex;

    align-items: center;

    gap: .3rem;

    font-size: .55rem;

    font-weight: 800;
  }

  .career-user span svg {
    width: .7rem;
    height: .7rem;
  }

  .profile-progress-header {
    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-top: 1.3rem;

    font-size: .59rem;

    font-weight: 850;
  }

  .profile-progress-header strong {
    font-size: .75rem;

    font-weight: 950;
  }

  .profile-progress {
    height: .55rem;

    margin-top: .5rem;

    overflow: hidden;

    border: 1.5px solid var(--ink);

    border-radius: 999px;

    background: #e8e1d8;
  }

  .profile-progress span {
    display: block;

    height: 100%;

    border-right:
      1.5px solid var(--ink);

    background:
      linear-gradient(
        90deg,
        var(--pink),
        var(--violet)
      );
  }

  .career-card-tip {
    display: flex;

    gap: .7rem;

    margin-top: 1rem;

    padding: .8rem;

    border: 2px solid var(--ink);

    border-radius: .85rem;

    background: #fff6c7;
  }

  .tip-icon {
    display: grid;

    place-items: center;

    flex: 0 0 auto;

    width: 2.2rem;
    height: 2.2rem;

    border: 1.5px solid var(--ink);

    border-radius: .65rem;

    background: var(--yellow);
  }

  .tip-icon svg {
    width: 1rem;
    height: 1rem;
  }

  .career-card-tip strong {
    font-size: .59rem;

    font-weight: 950;
  }

  .career-card-tip p {
    margin:
      .2rem 0 0;

    color: var(--muted);

    font-size: .53rem;

    font-weight: 650;

    line-height: 1.45;
  }

  .career-card > button {
    display: flex;

    align-items: center;

    justify-content: space-between;

    width: 100%;

    min-height: 3rem;

    margin-top: 1rem;

    padding:
      .6rem .8rem;

    border: 2px solid var(--ink);

    border-radius: .8rem;

    background: var(--ink);

    color: #fff;

    font-size: .6rem;

    font-weight: 950;

    cursor: pointer;

    box-shadow:
      4px 4px 0 var(--blue);
  }

  .career-card > button:hover {
    background: var(--blue);

    color: var(--ink);
  }

  .career-card > button svg {
    width: .9rem;
    height: .9rem;
  }

  .overview-grid {
    display: grid;

    grid-template-columns:
      repeat(4,1fr);

    gap: 1rem;

    margin-bottom:
      clamp(6rem,9vw,9rem);
  }

  .dashboard-stat {
    display: flex;

    align-items: center;

    gap: .9rem;

    padding: 1rem;

    border: 2px solid var(--ink);

    border-radius: 1rem;

    background: var(--paper-light);

    box-shadow:
      4px 4px 0 rgba(23,23,26,.15);
  }

  .stat-icon {
    display: grid;

    place-items: center;

    flex: 0 0 auto;

    width: 3rem;
    height: 3rem;

    border: 2px solid var(--ink);

    border-radius: .85rem;

    background: var(--stat-color);

    box-shadow:
      3px 3px 0 var(--ink);

    transform:
      rotate(-4deg);
  }

  .stat-icon svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .stat-copy {
    display: grid;

    grid-template-columns:
      1fr auto;

    min-width: 0;

    flex: 1;
  }

  .stat-copy > span {
    color: var(--muted);

    font-size: .55rem;

    font-weight: 850;

    text-transform: uppercase;
  }

  .stat-copy strong {
    grid-row:
      1 / 3;

    grid-column: 2;

    align-self: center;

    font-size: 1.7rem;

    font-weight: 950;

    letter-spacing: -.06em;
  }

  .stat-copy small {
    margin-top: .2rem;

    color: var(--ink);

    font-size: .52rem;

    font-weight: 720;
  }

  .dashboard-content {
    display: grid;

    grid-template-columns:
      minmax(0,1.45fr)
      minmax(300px,.55fr);

    gap: 1.4rem;

    margin-bottom:
      clamp(7rem,10vw,10rem);
  }

  .section-heading {
    display: flex;

    align-items: flex-end;

    justify-content: space-between;

    gap: 2rem;

    margin-bottom: 2rem;
  }

  .section-eyebrow {
    display: inline-flex;

    align-items: center;

    gap: .5rem;

    color: var(--pink);

    font-family:
      "Courier New",
      monospace;

    font-size: .56rem;

    font-weight: 950;

    letter-spacing: .09em;

    text-transform: uppercase;
  }

  .section-eyebrow i {
    width: 1.7rem;
    height: 2px;

    background: currentColor;
  }

  .section-heading h2 {
    max-width: 15ch;

    margin:
      .7rem 0 0;

    font-size:
      clamp(2.3rem,4.6vw,4.5rem);

    font-weight: 950;

    line-height: .88;

    letter-spacing: -.07em;

    text-transform: uppercase;
  }

  .section-heading p {
    max-width: 37rem;

    margin:
      .8rem 0 0;

    color: var(--muted);

    font-size: .74rem;

    font-weight: 650;

    line-height: 1.6;
  }

  .journey-grid {
    display: grid;

    grid-template-columns:
      1fr 1fr;

    gap: 1rem;
  }

  .journey-card {
    padding: 1.3rem;

    border: 3px solid var(--ink);

    border-radius: 1.3rem;

    box-shadow:
      5px 5px 0 var(--ink);
  }

  .journey-card--interview {
    background: var(--yellow);
  }

  .journey-card--task {
    background: var(--paper-light);
  }

  .journey-card-top {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;
  }

  .journey-label {
    font-family:
      "Courier New",
      monospace;

    font-size: .54rem;

    font-weight: 950;

    letter-spacing: .08em;

    text-transform: uppercase;
  }

  .journey-card-top svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .journey-time {
    display: block;

    margin-top: 1.8rem;

    color: var(--pink);

    font-size: .72rem;

    font-weight: 950;
  }

  .journey-card h3 {
    margin:
      .55rem 0 0;

    font-size: 1.65rem;

    font-weight: 950;

    line-height: .95;

    letter-spacing: -.055em;
  }

  .journey-card > p {
    margin:
      .5rem 0 0;

    color: rgba(23,23,26,.64);

    font-size: .64rem;

    font-weight: 700;

    line-height: 1.5;
  }

  .interview-actions {
    display: grid;

    grid-template-columns:
      1fr auto;

    gap: .6rem;

    margin-top: 1.4rem;
  }

  .interview-actions button {
    min-height: 2.8rem;

    border: 2px solid var(--ink);

    border-radius: .75rem;

    background: var(--paper-light);

    color: var(--ink);

    font-size: .57rem;

    font-weight: 950;

    cursor: pointer;

    box-shadow:
      3px 3px 0 var(--ink);
  }

  .interview-actions button:first-child {
    display: flex;

    align-items: center;

    justify-content: center;

    gap: .45rem;
  }

  .interview-actions button:hover {
    background: var(--blue);
  }

  .interview-actions svg {
    width: .85rem;
    height: .85rem;
  }

  .mini-progress {
    height: .55rem;

    margin-top: 1.4rem;

    overflow: hidden;

    border: 1.5px solid var(--ink);

    border-radius: 999px;

    background: #e5ded5;
  }

  .mini-progress span {
    display: block;

    height: 100%;

    background: var(--pink);

    border-right:
      1.5px solid var(--ink);
  }

  .journey-card--task > button {
    display: flex;

    align-items: center;

    justify-content: space-between;

    width: 100%;

    min-height: 2.8rem;

    margin-top: 1rem;

    padding:
      .6rem .75rem;

    border: 2px solid var(--ink);

    border-radius: .75rem;

    background: var(--ink);

    color: #fff;

    font-size: .57rem;

    font-weight: 950;

    cursor: pointer;
  }

  .journey-card--task > button svg {
    width: .85rem;
    height: .85rem;
  }

  .application-sidebar {
    align-self: stretch;

    padding: 1.2rem;

    border: 3px solid var(--ink);

    border-radius: 1.3rem;

    background: var(--violet);

    color: #fff;

    box-shadow:
      6px 6px 0 var(--ink);
  }

  .sidebar-heading {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;

    padding-bottom: 1rem;

    border-bottom:
      2px solid rgba(23,23,26,.65);
  }

  .sidebar-heading > div {
    display: flex;

    align-items: center;

    gap: .5rem;

    font-size: .58rem;

    font-weight: 950;

    text-transform: uppercase;
  }

  .sidebar-heading strong {
    display: grid;

    place-items: center;

    width: 1.5rem;
    height: 1.5rem;

    border: 1.5px solid var(--ink);

    border-radius: 50%;

    background: var(--yellow);

    color: var(--ink);

    font-size: .55rem;
  }

  .sidebar-heading button {
    padding: 0;

    border: 0;

    background: transparent;

    color: #fff;

    font-size: .55rem;

    font-weight: 850;

    text-decoration: underline;

    text-underline-offset: 3px;

    cursor: pointer;
  }

  .applications-list {
    display: flex;

    flex-direction: column;

    margin-top: .7rem;
  }

  .application-item {
    position: relative;

    display: grid;

    grid-template-columns:
      auto
      minmax(0,1fr)
      auto;

    align-items: center;

    gap: .65rem;

    padding:
      .85rem 0;

    border-bottom:
      1px solid rgba(255,255,255,.22);
  }

  .application-item:last-child {
    border-bottom: 0;
  }

  .application-indicator {
    width: .65rem;
    height: 2.7rem;

    border: 1.5px solid var(--ink);

    border-radius: 999px;
  }

  .application-item > div {
    display: flex;

    flex-direction: column;

    min-width: 0;
  }

  .application-item strong {
    overflow: hidden;

    font-size: .61rem;

    font-weight: 950;

    text-overflow: ellipsis;

    white-space: nowrap;
  }

  .application-item > div span {
    margin-top: .12rem;

    color: rgba(255,255,255,.78);

    font-size: .53rem;

    font-weight: 700;
  }

  .application-item small {
    margin-top: .25rem;

    overflow: hidden;

    color: rgba(255,255,255,.54);

    font-size: .48rem;

    text-overflow: ellipsis;

    white-space: nowrap;
  }

  .application-status {
    padding:
      .3rem .42rem;

    border: 1.5px solid var(--ink);

    border-radius: 999px;

    background: var(--paper-light);

    color: var(--ink);

    font-size: .47rem;

    font-weight: 950;

    white-space: nowrap;
  }

  .recommended-jobs {
    scroll-margin-top: 6rem;

    margin-bottom:
      clamp(7rem,10vw,10rem);
  }

  .section-heading--jobs {
    align-items: flex-end;
  }

  .match-summary {
    flex: 0 0 auto;

    display: flex;

    flex-direction: column;

    align-items: center;

    min-width: 7.2rem;

    padding: .8rem;

    border: 2px solid var(--ink);

    border-radius: 1rem;

    background: var(--lime);

    box-shadow:
      4px 4px 0 var(--ink);

    transform:
      rotate(2deg);
  }

  .match-summary span {
    font-size: .5rem;

    font-weight: 950;

    text-transform: uppercase;
  }

  .match-summary strong {
    margin-top: .3rem;

    font-size: 1.8rem;

    font-weight: 950;

    letter-spacing: -.07em;
  }

  .jobs-toolbar {
    display: grid;

    grid-template-columns:
      minmax(0,1fr)
      auto;

    gap: .8rem;
  }

  .search-field {
    display: flex;

    align-items: center;

    min-height: 3.5rem;

    padding:
      0 .4rem 0 1rem;

    border: 2px solid var(--ink);

    border-radius: .9rem;

    background: var(--paper-light);

    box-shadow:
      3px 3px 0 rgba(23,23,26,.14);

    transition:
      transform .2s ease,
      box-shadow .2s ease;
  }

  .search-field:focus-within {
    transform:
      translate(-2px,-2px);

    box-shadow:
      6px 6px 0 var(--blue),
      8px 8px 0 var(--ink);
  }

  .search-field > svg {
    width: 1rem;
    height: 1rem;
  }

  .search-field input {
    flex: 1;

    min-width: 0;

    height: 3.35rem;

    padding:
      0 .8rem;

    border: 0;

    outline: 0;

    background: transparent;

    color: var(--ink);

    font-size: .76rem;

    font-weight: 730;
  }

  .search-field input::placeholder {
    color: #9d958e;
  }

  .search-field button {
    display: grid;

    place-items: center;

    width: 2.5rem;
    height: 2.5rem;

    border: 0;

    border-radius: .65rem;

    background: transparent;

    cursor: pointer;
  }

  .search-field button:hover {
    background: var(--pink);
  }

  .search-field button svg {
    width: .9rem;
    height: .9rem;
  }

  .sort-field {
    position: relative;

    display: flex;

    align-items: center;

    min-width: 11rem;

    min-height: 3.5rem;

    border: 2px solid var(--ink);

    border-radius: .9rem;

    background: var(--yellow);

    box-shadow:
      3px 3px 0 var(--ink);
  }

  .sort-field select {
    width: 100%;

    height: 100%;

    padding:
      0 2.5rem 0 .8rem;

    border: 0;

    outline: 0;

    appearance: none;

    background: transparent;

    color: var(--ink);

    font-size: .62rem;

    font-weight: 900;

    cursor: pointer;
  }

  .sort-field svg {
    position: absolute;

    right: .8rem;

    width: .8rem;
    height: .8rem;

    pointer-events: none;
  }

  .filter-row {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;

    margin-top: 1rem;
  }

  .filter-group {
    display: flex;

    gap: .5rem;

    overflow-x: auto;

    padding: .15rem .15rem .5rem;

    scrollbar-width: thin;
  }

  .filter-chip {
    flex: 0 0 auto;

    min-height: 2.3rem;

    padding:
      .5rem .7rem;

    border: 1.8px solid var(--ink);

    border-radius: 999px;

    background: var(--paper-light);

    color: var(--ink);

    font-size: .57rem;

    font-weight: 850;

    cursor: pointer;

    box-shadow:
      2px 2px 0 var(--ink);
  }

  .filter-chip:hover {
    background: #ece5dc;
  }

  .filter-chip--active {
    background: var(--pink);

    color: #fff;

    transform:
      rotate(-1deg);
  }

  .work-mode-filter {
    display: flex;

    align-items: center;

    gap: .45rem;

    flex: 0 0 auto;

    min-height: 2.3rem;

    padding:
      0 .65rem;

    border: 1.8px solid var(--ink);

    border-radius: .7rem;

    background: var(--paper-light);

    box-shadow:
      2px 2px 0 var(--ink);
  }

  .work-mode-filter span {
    color: var(--muted);

    font-size: .5rem;

    font-weight: 850;

    text-transform: uppercase;
  }

  .work-mode-filter select {
    border: 0;

    outline: 0;

    background: transparent;

    color: var(--ink);

    font-size: .56rem;

    font-weight: 900;
  }

  .results-line {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;

    margin:
      1.1rem 0 1.5rem;

    color: var(--muted);

    font-size: .6rem;

    font-weight: 700;
  }

  .results-line strong {
    color: var(--ink);

    font-size: .75rem;

    font-weight: 950;
  }

  .results-line button {
    padding: 0;

    border: 0;

    background: transparent;

    color: var(--pink);

    font-size: .56rem;

    font-weight: 900;

    text-decoration: underline;

    text-underline-offset: 3px;

    cursor: pointer;
  }

  .jobs-grid {
    display: grid;

    grid-template-columns:
      repeat(3,minmax(0,1fr));

    gap: 1rem;
  }

  .job-card {
    position: relative;

    min-width: 0;

    padding: 1.15rem;

    border: 2.5px solid var(--ink);

    border-radius: 1.3rem;

    background:
      linear-gradient(
        145deg,
        var(--job-soft),
        transparent 47%
      ),
      var(--paper-light);

    cursor: pointer;

    box-shadow:
      5px 5px 0 var(--ink);

    transition:
      transform .22s ease,
      box-shadow .22s ease;
  }

  .job-card:hover {
    transform:
      translate(-3px,-4px);

    box-shadow:
      8px 8px 0 var(--job-color),
      11px 11px 0 var(--ink);
  }

  .job-card-top {
    display: grid;

    grid-template-columns:
      auto
      minmax(0,1fr)
      auto;

    align-items: center;

    gap: .7rem;
  }

  .company-avatar {
    display: grid;

    place-items: center;

    width: 3rem;
    height: 3rem;

    border: 2px solid var(--ink);

    border-radius: .8rem;

    background: var(--job-color);

    font-size: .68rem;

    font-weight: 950;

    box-shadow:
      3px 3px 0 var(--ink);

    transform:
      rotate(-4deg);
  }

  .job-top-tags {
    display: flex;

    align-items: center;

    gap: .4rem;

    min-width: 0;

    color: var(--muted);

    font-size: .5rem;

    font-weight: 730;
  }

  .new-job-tag {
    padding:
      .28rem .4rem;

    border: 1.5px solid var(--ink);

    border-radius: 999px;

    background: var(--lime);

    color: var(--ink);

    font-size: .46rem;

    font-weight: 950;

    text-transform: uppercase;
  }

  .favorite-button {
    display: grid;

    place-items: center;

    width: 2.5rem;
    height: 2.5rem;

    border: 1.8px solid var(--ink);

    border-radius: 50%;

    background: var(--paper-light);

    color: var(--ink);

    cursor: pointer;

    box-shadow:
      2px 2px 0 var(--ink);
  }

  .favorite-button:hover {
    transform:
      rotate(-7deg);
  }

  .favorite-button--active {
    background: var(--pink);

    color: #fff;
  }

  .favorite-button svg {
    width: .9rem;
    height: .9rem;
  }

  .job-match {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: .5rem;

    margin-top: 1rem;

    padding-bottom: .7rem;

    border-bottom:
      2px dashed rgba(23,23,26,.18);
  }

  .job-match span {
    display: flex;

    align-items: center;

    gap: .35rem;

    color: var(--muted);

    font-size: .52rem;

    font-weight: 800;
  }

  .job-match span svg {
    width: .75rem;
    height: .75rem;
  }

  .job-match strong {
    color: var(--job-color);

    font-size: 1rem;

    font-weight: 950;

    text-shadow:
      1px 1px 0 var(--ink);
  }

  .job-card h3 {
    margin:
      1rem 0 0;

    font-size: 1.5rem;

    font-weight: 950;

    line-height: .95;

    letter-spacing: -.05em;
  }

  .job-company {
    display: flex;

    flex-direction: column;

    gap: .18rem;

    margin-top: .65rem;
  }

  .job-company strong {
    font-size: .65rem;

    font-weight: 850;
  }

  .job-company span {
    color: var(--muted);

    font-size: .55rem;

    font-weight: 650;
  }

  .job-meta {
    display: flex;

    flex-wrap: wrap;

    gap: .45rem;

    margin-top: 1rem;
  }

  .job-meta span {
    display: flex;

    align-items: center;

    gap: .3rem;

    padding:
      .35rem .45rem;

    border: 1.4px solid var(--ink);

    border-radius: .5rem;

    background: #fff;

    font-size: .5rem;

    font-weight: 800;
  }

  .job-meta svg {
    width: .7rem;
    height: .7rem;
  }

  .job-skills {
    display: flex;

    flex-wrap: wrap;

    gap: .38rem;

    margin-top: .8rem;
  }

  .job-skills span {
    padding:
      .3rem .4rem;

    border-radius: .4rem;

    background: var(--job-soft);

    color: var(--ink);

    font-size: .48rem;

    font-weight: 820;
  }

  .job-footer {
    display: flex;

    align-items: flex-end;

    justify-content: space-between;

    gap: .7rem;

    margin-top: 1rem;

    padding-top: .8rem;

    border-top:
      2px dashed rgba(23,23,26,.18);
  }

  .job-footer > div {
    display: flex;

    flex-direction: column;

    gap: .16rem;
  }

  .job-footer small {
    color: var(--muted);

    font-size: .46rem;

    font-weight: 800;

    text-transform: uppercase;
  }

  .job-footer strong {
    font-size: .6rem;

    font-weight: 950;
  }

  .job-open-button {
    display: grid;

    place-items: center;

    width: 2.65rem;
    height: 2.65rem;

    border: 2px solid var(--ink);

    border-radius: .75rem;

    background: var(--job-color);

    cursor: pointer;

    box-shadow:
      3px 3px 0 var(--ink);
  }

  .job-open-button:hover {
    transform:
      translate(-1px,-1px)
      rotate(5deg);
  }

  .job-open-button--applied {
    background: var(--lime);
  }

  .job-open-button svg {
    width: .95rem;
    height: .95rem;
  }

  .jobs-footer-action {
    display: flex;

    justify-content: center;

    margin-top: 2rem;
  }

  .jobs-footer-action button {
    display: flex;

    align-items: center;

    gap: .55rem;

    min-height: 3.2rem;

    padding:
      .65rem 1rem;

    border: 2px solid var(--ink);

    border-radius: .85rem;

    background: var(--ink);

    color: #fff;

    font-size: .62rem;

    font-weight: 950;

    cursor: pointer;

    box-shadow:
      5px 5px 0 var(--pink);
  }

  .jobs-footer-action button:hover {
    background: var(--yellow);

    color: var(--ink);

    transform:
      translate(-2px,-2px);
  }

  .jobs-footer-action svg {
    width: .9rem;
    height: .9rem;
  }

  .career-insights {
    margin-bottom: 4rem;
  }

  .insights-grid {
    display: grid;

    grid-template-columns:
      repeat(3,minmax(0,1fr));

    gap: 1rem;
  }

  .insight-card {
    position: relative;

    min-width: 0;

    padding: 1.2rem;

    border: 2.5px solid var(--ink);

    border-radius: 1.2rem;

    background: var(--paper-light);

    box-shadow:
      5px 5px 0 var(--ink);
  }

  .insight-number {
    position: absolute;

    top: .9rem;
    right: .9rem;

    color: rgba(23,23,26,.23);

    font-family:
      "Courier New",
      monospace;

    font-size: .55rem;

    font-weight: 950;
  }

  .insight-icon {
    display: grid;

    place-items: center;

    width: 3rem;
    height: 3rem;

    border: 2px solid var(--ink);

    border-radius: .8rem;

    background: var(--insight-color);

    box-shadow:
      3px 3px 0 var(--ink);

    transform:
      rotate(-4deg);
  }

  .insight-icon svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .insight-card h3 {
    margin:
      1.5rem 0 0;

    font-size: 1.25rem;

    font-weight: 950;

    line-height: 1;

    letter-spacing: -.045em;
  }

  .insight-card p {
    margin:
      .65rem 0 0;

    color: var(--muted);

    font-size: .62rem;

    font-weight: 650;

    line-height: 1.55;
  }

  .insight-card button {
    display: flex;

    align-items: center;

    justify-content: space-between;

    width: 100%;

    min-height: 2.7rem;

    margin-top: 1.2rem;

    padding:
      .55rem .65rem;

    border: 1.8px solid var(--ink);

    border-radius: .7rem;

    background: #fff;

    color: var(--ink);

    font-size: .54rem;

    font-weight: 950;

    cursor: pointer;

    box-shadow:
      2px 2px 0 var(--ink);
  }

  .insight-card button:hover {
    background: var(--insight-color);
  }

  .insight-card button svg {
    width: .8rem;
    height: .8rem;
  }

  .empty-state {
    display: flex;

    flex-direction: column;

    align-items: center;

    padding: 4rem 1rem;

    border:
      2px dashed var(--ink);

    border-radius: 1.2rem;

    background:
      rgba(255,253,248,.72);

    text-align: center;
  }

  .empty-state > span {
    display: grid;

    place-items: center;

    width: 4rem;
    height: 4rem;

    border: 2px solid var(--ink);

    border-radius: 1rem;

    background: var(--yellow);

    box-shadow:
      4px 4px 0 var(--ink);
  }

  .empty-state svg {
    width: 1.4rem;
    height: 1.4rem;
  }

  .empty-state h3 {
    margin:
      1.2rem 0 0;

    font-size: 1.4rem;

    font-weight: 950;
  }

  .empty-state p {
    margin:
      .4rem 0 0;

    color: var(--muted);

    font-size: .65rem;
  }

  .empty-state button {
    margin-top: 1rem;

    padding:
      .55rem .8rem;

    border: 2px solid var(--ink);

    border-radius: .7rem;

    background: var(--blue);

    font-size: .55rem;

    font-weight: 950;

    cursor: pointer;

    box-shadow:
      3px 3px 0 var(--ink);
  }

  .user-footer {
    position: relative;

    z-index: 10;

    display: grid;

    grid-template-columns:
      1fr auto auto;

    align-items: center;

    gap: 3rem;

    padding:
      3rem
      clamp(1rem,4vw,4.5rem);

    border-top:
      3px solid var(--ink);

    background: var(--ink);

    color: #fff;
  }

  .footer-brand > span {
    font-size: 2rem;

    font-weight: 950;

    letter-spacing: -.08em;
  }

  .footer-brand i {
    color: var(--pink);

    font-style: normal;
  }

  .footer-brand b {
    color: var(--blue);
  }

  .footer-brand p {
    max-width: 21rem;

    margin:
      .6rem 0 0;

    color: rgba(255,255,255,.48);

    font-size: .6rem;

    font-weight: 620;

    line-height: 1.5;
  }

  .footer-links {
    display: flex;

    gap: 1rem;
  }

  .footer-links button {
    padding: 0;

    border: 0;

    background: transparent;

    color:
      rgba(255,255,255,.6);

    font-size: .58rem;

    font-weight: 700;

    cursor: pointer;
  }

  .footer-links button:hover {
    color: var(--yellow);
  }

  .footer-copy {
    color:
      rgba(255,255,255,.35);

    font-size: .55rem;
  }

  .modal-overlay,
  .notification-overlay {
    position: fixed;

    z-index: 3000;

    inset: 0;

    background:
      rgba(23,23,26,.55);

    backdrop-filter:
      blur(9px);

    -webkit-backdrop-filter:
      blur(9px);
  }

  .modal-overlay {
    display: grid;

    place-items: center;

    padding: 1rem;

    overflow-y: auto;
  }

  .job-modal {
    position: relative;

    width: min(100%,47rem);

    max-height:
      calc(100vh - 2rem);

    overflow-y: auto;

    border: 3px solid var(--ink);

    border-radius: 1.5rem;

    background: var(--paper-light);

    box-shadow:
      10px 10px 0 var(--job-color),
      14px 14px 0 var(--ink);
  }

  .modal-close {
    position: absolute;

    z-index: 20;

    top: 1rem;
    right: 1rem;

    display: grid;

    place-items: center;

    width: 2.6rem;
    height: 2.6rem;

    border: 2px solid var(--ink);

    border-radius: 50%;

    background: var(--paper-light);

    cursor: pointer;

    box-shadow:
      2px 2px 0 var(--ink);
  }

  .modal-close:hover {
    background: var(--pink);

    transform:
      rotate(7deg);
  }

  .modal-close svg {
    width: .9rem;
    height: .9rem;
  }

  .modal-header {
    display: flex;

    align-items: center;

    gap: 1rem;

    padding:
      2rem 5rem 1.5rem 1.5rem;

    border-bottom:
      3px dashed var(--ink);

    background: var(--job-soft);
  }

  .modal-company-avatar {
    display: grid;

    place-items: center;

    flex: 0 0 auto;

    width: 4rem;
    height: 4rem;

    border: 2px solid var(--ink);

    border-radius: 1rem;

    background: var(--job-color);

    font-size: .9rem;

    font-weight: 950;

    box-shadow:
      4px 4px 0 var(--ink);

    transform:
      rotate(-4deg);
  }

  .modal-kicker {
    color: var(--muted);

    font-size: .53rem;

    font-weight: 950;

    text-transform: uppercase;
  }

  .modal-header h2 {
    margin:
      .4rem 0 0;

    font-size:
      clamp(1.8rem,4vw,3rem);

    font-weight: 950;

    line-height: .92;

    letter-spacing: -.06em;
  }

  .modal-header p {
    margin:
      .4rem 0 0;

    color: var(--muted);

    font-size: .62rem;

    font-weight: 700;
  }

  .modal-match-box {
    padding:
      1.2rem 1.5rem;

    border-bottom:
      2px solid rgba(23,23,26,.1);
  }

  .modal-match-box > div:first-child {
    display: flex;

    justify-content: space-between;

    align-items: center;

    font-size: .58rem;

    font-weight: 850;
  }

  .modal-match-box strong {
    color: var(--job-color);

    font-size: 1.3rem;

    font-weight: 950;
  }

  .modal-match-bar {
    height: .55rem;

    margin-top: .5rem;

    overflow: hidden;

    border: 1.5px solid var(--ink);

    border-radius: 999px;

    background: #e6dfd6;
  }

  .modal-match-bar span {
    display: block;

    height: 100%;

    border-right:
      1.5px solid var(--ink);

    background: var(--job-color);
  }

  .modal-match-box small {
    display: block;

    margin-top: .5rem;

    color: var(--muted);

    font-size: .52rem;

    font-weight: 650;
  }

  .modal-stats {
    display: grid;

    grid-template-columns:
      repeat(3,1fr);

    gap: .7rem;

    padding:
      1.2rem 1.5rem;
  }

  .modal-stats > div {
    padding: .7rem;

    border: 1.8px solid var(--ink);

    border-radius: .7rem;

    background: #fff;

    box-shadow:
      2px 2px 0 rgba(23,23,26,.12);
  }

  .modal-stats span {
    display: block;

    color: var(--muted);

    font-size: .48rem;

    font-weight: 800;

    text-transform: uppercase;
  }

  .modal-stats strong {
    display: block;

    margin-top: .25rem;

    font-size: .62rem;

    font-weight: 950;
  }

  .modal-body {
    display: flex;

    flex-direction: column;

    gap: 1.3rem;

    padding:
      .5rem 1.5rem 1.5rem;
  }

  .modal-body section {
    padding-bottom: 1.2rem;

    border-bottom:
      2px dashed rgba(23,23,26,.15);
  }

  .modal-body section:last-child {
    border-bottom: 0;
  }

  .modal-body h3 {
    margin: 0;

    font-size: .64rem;

    font-weight: 950;

    text-transform: uppercase;

    letter-spacing: .05em;
  }

  .modal-body p {
    margin:
      .6rem 0 0;

    color: var(--muted);

    font-size: .68rem;

    font-weight: 620;

    line-height: 1.65;
  }

  .modal-body ul {
    display: grid;

    grid-template-columns:
      1fr 1fr;

    gap: .55rem;

    margin:
      .7rem 0 0;

    padding: 0;

    list-style: none;
  }

  .modal-body li {
    display: flex;

    align-items: center;

    gap: .4rem;

    font-size: .61rem;

    font-weight: 700;
  }

  .modal-body li svg {
    width: .78rem;
    height: .78rem;

    color: #28813a;
  }

  .modal-skills {
    display: flex;

    flex-wrap: wrap;

    gap: .4rem;

    margin-top: .7rem;
  }

  .modal-skills span {
    padding:
      .35rem .5rem;

    border: 1.5px solid var(--ink);

    border-radius: .45rem;

    background: var(--job-soft);

    font-size: .52rem;

    font-weight: 850;
  }

  .modal-footer {
    position: sticky;

    bottom: 0;

    display: grid;

    grid-template-columns:
      auto 1fr;

    gap: .7rem;

    padding: 1rem 1.5rem;

    border-top:
      3px solid var(--ink);

    background: var(--paper-light);
  }

  .modal-favorite,
  .modal-apply {
    min-height: 3.1rem;

    padding:
      .6rem .8rem;

    border: 2px solid var(--ink);

    border-radius: .8rem;

    font-size: .58rem;

    font-weight: 950;

    cursor: pointer;
  }

  .modal-favorite {
    display: flex;

    align-items: center;

    gap: .4rem;

    background: #fff;

    color: var(--ink);
  }

  .modal-favorite--active {
    background: var(--pink);

    color: #fff;
  }

  .modal-favorite svg {
    width: .85rem;
    height: .85rem;
  }

  .modal-apply {
    display: flex;

    align-items: center;

    justify-content: center;

    gap: .5rem;

    background: var(--ink);

    color: #fff;

    box-shadow:
      4px 4px 0 var(--job-color);
  }

  .modal-apply:hover {
    background: var(--yellow);

    color: var(--ink);
  }

  .modal-apply--done {
    background: var(--lime);

    color: var(--ink);

    cursor: default;
  }

  .modal-apply svg {
    width: .85rem;
    height: .85rem;
  }

  .notification-overlay {
    display: flex;

    justify-content: flex-end;
  }

  .notification-panel {
    width:
      min(92%,25rem);

    min-height: 100%;

    padding: 1.2rem;

    border-left:
      3px solid var(--ink);

    background: var(--paper);
  }

  .notification-header {
    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;

    padding-bottom: 1rem;

    border-bottom:
      2px solid var(--ink);
  }

  .notification-header span {
    color: var(--pink);

    font-family:
      "Courier New",
      monospace;

    font-size: .53rem;

    font-weight: 950;

    text-transform: uppercase;
  }

  .notification-header h2 {
    margin:
      .3rem 0 0;

    font-size: 1.7rem;

    font-weight: 950;

    letter-spacing: -.05em;
  }

  .notification-header button {
    display: grid;

    place-items: center;

    width: 2.6rem;
    height: 2.6rem;

    border: 2px solid var(--ink);

    border-radius: .75rem;

    background: var(--yellow);

    box-shadow:
      3px 3px 0 var(--ink);

    cursor: pointer;
  }

  .notification-header svg {
    width: .9rem;
    height: .9rem;
  }

  .notification-list {
    display: flex;

    flex-direction: column;

    margin-top: .8rem;
  }

  .notification-item {
    display: grid;

    grid-template-columns:
      auto 1fr;

    gap: .65rem;

    padding:
      .9rem .2rem;

    border-bottom:
      1px solid rgba(23,23,26,.12);
  }

  .notification-item--new {
    padding:
      .9rem .65rem;

    border:
      2px solid var(--ink);

    border-radius: .8rem;

    background: #fff6c7;

    box-shadow:
      3px 3px 0 var(--ink);

    margin-bottom: .7rem;
  }

  .notification-dot {
    width: .55rem;
    height: .55rem;

    margin-top: .15rem;

    border: 1.5px solid var(--ink);

    border-radius: 50%;

    background: #c6bdb4;
  }

  .notification-item--new
  .notification-dot {
    background: var(--pink);
  }

  .notification-item strong {
    font-size: .61rem;

    font-weight: 950;
  }

  .notification-item p {
    margin:
      .25rem 0 0;

    color: var(--muted);

    font-size: .56rem;

    font-weight: 650;

    line-height: 1.45;
  }

  .notification-item small {
    display: block;

    margin-top: .35rem;

    color: #9b938c;

    font-size: .48rem;

    font-weight: 700;
  }

  .toast {
    position: fixed;

    z-index: 4000;

    right: 1.2rem;
    bottom: 1.2rem;

    display: flex;

    align-items: center;

    gap: .6rem;

    min-height: 3.3rem;

    padding:
      .65rem .9rem;

    border: 2px solid var(--ink);

    border-radius: .85rem;

    background: var(--lime);

    color: var(--ink);

    font-size: .59rem;

    font-weight: 900;

    box-shadow:
      5px 5px 0 var(--pink),
      8px 8px 0 var(--ink);
  }

  .toast > span {
    display: grid;

    place-items: center;

    width: 1.7rem;
    height: 1.7rem;

    border: 1.5px solid var(--ink);

    border-radius: .5rem;

    background: #fff;
  }

  .toast svg {
    width: .75rem;
    height: .75rem;
  }

  @keyframes blobMorph {
    0%,
    100% {
      border-radius:
        55% 45% 38% 62% /
        42% 59% 41% 58%;
    }

    50% {
      border-radius:
        38% 62% 56% 44% /
        63% 37% 63% 37%;
    }
  }

  @media (max-width: 1150px) {
    .overview-grid {
      grid-template-columns:
        repeat(2,1fr);
    }

    .dashboard-content {
      grid-template-columns: 1fr;
    }

    .application-sidebar {
      width: 100%;
    }

    .jobs-grid {
      grid-template-columns:
        repeat(2,1fr);
    }
  }

  @media (max-width: 900px) {
    .desktop-nav {
      display: none;
    }

    .user-header {
      grid-template-columns:
        1fr auto;
    }

    .welcome-section {
      grid-template-columns: 1fr;
    }

    .career-card-wrapper {
      justify-self: start;

      width: min(100%,32rem);
    }

    .insights-grid {
      grid-template-columns: 1fr;
    }

    .footer-links {
      display: none;
    }

    .user-footer {
      grid-template-columns:
        1fr auto;
    }
  }

  @media (max-width: 680px) {
    .user-header {
      min-height: 4.8rem;

      padding:
        .7rem 1rem;
    }

    .brand {
      font-size: 1.9rem;
    }

    .user-menu-button {
      min-width: 0;

      width: 2.8rem;
      height: 2.8rem;

      padding: .3rem;

      border-radius: 50%;
    }

    .user-menu-button img {
      width: 100%;
      height: 100%;
    }

    .user-menu-button > span,
    .user-menu-button > svg {
      display: none;
    }

    .user-layout {
      padding:
        0 1rem 5rem;
    }

    .welcome-section {
      min-height: auto;

      padding:
        3rem 0 4rem;
    }

    .welcome-copy h1 {
      font-size:
        clamp(3.3rem,16vw,5rem);
    }

    .overview-grid {
      grid-template-columns: 1fr 1fr;

      gap: .7rem;
    }

    .dashboard-stat {
      align-items: flex-start;

      flex-direction: column;

      gap: .7rem;
    }

    .stat-copy {
      width: 100%;
    }

    .journey-grid {
      grid-template-columns: 1fr;
    }

    .section-heading {
      align-items: flex-start;

      flex-direction: column;
    }

    .section-heading h2 {
      font-size:
        clamp(2.5rem,12vw,3.8rem);
    }

    .match-summary {
      align-items: flex-start;

      transform: none;
    }

    .jobs-toolbar {
      grid-template-columns: 1fr;
    }

    .sort-field {
      min-width: 0;
    }

    .filter-row {
      align-items: stretch;

      flex-direction: column;
    }

    .work-mode-filter {
      width: fit-content;
    }

    .jobs-grid {
      grid-template-columns: 1fr;
    }

    .results-line {
      align-items: flex-start;

      flex-direction: column;
    }

    .footer-copy {
      display: none;
    }

    .user-footer {
      grid-template-columns: 1fr;

      padding: 2.5rem 1rem;
    }

    .modal-stats {
      grid-template-columns: 1fr;
    }

    .modal-body ul {
      grid-template-columns: 1fr;
    }

    .modal-footer {
      grid-template-columns: 1fr;
    }

    .toast {
      left: 1rem;
      right: 1rem;

      justify-content: center;
    }
  }

  @media (max-width: 420px) {
    .overview-grid {
      grid-template-columns: 1fr;
    }

    .career-card {
      padding: 1rem;
    }

    .career-user img {
      width: 4rem;
      height: 4rem;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .user-home *,
    .user-home *::before,
    .user-home *::after {
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
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
    >
      <circle
        cx="12"
        cy="12"
        r="8"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
      />

      <circle
        cx="12"
        cy="12"
        r="1"
      />
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
    >
      <circle
        cx="6"
        cy="19"
        r="2"
      />

      <circle
        cx="18"
        cy="5"
        r="2"
      />

      <path d="M8 19h3a3 3 0 0 0 3-3V8a3 3 0 0 1 3-3" />
    </svg>
  );
}

function BookmarkIcon({
  filled = false,
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={
        filled
          ? "currentColor"
          : "none"
      }
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17l-6-4-6 4V4Z" />
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

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
      />

      <path d="M8 3v4M16 3v4M3 10h18" />
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

function LightbulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 18h6M10 22h4" />

      <path d="M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z" />
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
    >
      <path d="m12 3 1 3.2L16 7.5l-3 1.3L12 12l-1-3.2-3-1.3 3-1.3L12 3Z" />
      <path d="m18 14 .7 2 .3.7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </svg>
  );
}

function LaptopIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="12"
        rx="2"
      />

      <path d="M2 20h20" />
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
    >
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="3"
      />

      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
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
    >
      <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
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
    >
      <path d="M6 2h8l4 4v16H6Z" />

      <path d="M14 2v5h5M9 13h6M9 17h6" />
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
    >
      <path d="m6 6 12 12M18 6 6 18" />
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
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}