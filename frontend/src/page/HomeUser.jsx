import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CandidateHeader from "../components/CandidateHeader";
import Footer from "../components/Footer";
import JobModal from "../components/JobModal";
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

function createInitialsAvatar(name) {
    const initials =
        String(name || "Candidato")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("")
            .replace(/[^\p{L}\p{N}]/gu, "") || "C";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#60a5fa"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect width="160" height="160" rx="80" fill="url(#g)"/><text x="80" y="92" text-anchor="middle" font-family="Arial,sans-serif" font-size="54" font-weight="700" fill="white">${initials}</text></svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function HomeUser() {
    const navigate = useNavigate();
    const location = useLocation();
    const requestedJobId = location.state?.openJobId;
    const [usuario, setUsuario] = useState(null);
    const [vagas, setVagas] = useState([]);
    const [curriculo, setCurriculo] = useState(null);
    const [candidaturas, setCandidaturas] = useState([]);
    const [savedJobIds, setSavedJobIds] = useState(() => new Set());
    const [vagaSelecionada, setVagaSelecionada] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [jobsPage, setJobsPage] = useState(1);
    const [jobsHasMore, setJobsHasMore] = useState(false);
    const [jobsLoadingMore, setJobsLoadingMore] = useState(false);
    const [jobsMoreError, setJobsMoreError] = useState("");
    const [applyingJobId, setApplyingJobId] = useState(null);
    const [savingJobId, setSavingJobId] = useState(null);
    const [applyError, setApplyError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [feedback, setFeedback] = useState(() => {
        const navigationFeedback = location.state?.feedback;

        return typeof navigationFeedback === "string"
            ? { type: "success", message: navigationFeedback }
            : null;
    });

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        Promise.all([
            api.get("/me", { signal: controller.signal }),
            api.get("/vagas", {
                params: { page: 1, per_page: 50 },
                signal: controller.signal,
            }),
            api.get("/curriculos/me", { signal: controller.signal }),
            collectPaginatedItems((page) =>
                api.get("/minhas-candidaturas", {
                    params: { page, per_page: 100 },
                    signal: controller.signal,
                }),
            ),
            collectPaginatedItems((page) =>
                api.get("/vagas-salvas", {
                    params: { page, per_page: 50 },
                    signal: controller.signal,
                }),
            ),
        ])
            .then(
                ([
                    userResponse,
                    jobsResponse,
                    resumeResponse,
                    loadedApplications,
                    loadedSavedJobs,
                ]) => {
                    if (!active) return;

                    const loadedUser = extractAuthenticatedUser(userResponse);
                    if (!loadedUser) {
                        throw new Error(
                            "A API não retornou os dados do candidato.",
                        );
                    }

                    const jobsPageData = readPaginatedResponse(jobsResponse);
                    const loadedJobs = jobsPageData.items
                        .filter(
                            (job) =>
                                job?.id !== null && job?.id !== undefined,
                        )
                        .map(normalizeJob);

                    setUsuario(loadedUser);
                    setVagas(loadedJobs);
                    setJobsPage(jobsPageData.currentPage);
                    setJobsHasMore(jobsPageData.hasMore);
                    setCurriculo(unwrapApiData(resumeResponse));
                    setCandidaturas(loadedApplications);
                    setSavedJobIds(
                        new Set(
                            loadedSavedJobs
                                .map((savedJob) =>
                                    savedJob?.id ??
                                    savedJob?.vagaId ??
                                    savedJob?.vaga?.id,
                                )
                                .filter(
                                    (jobId) =>
                                        jobId !== null &&
                                        jobId !== undefined,
                                )
                                .map(String),
                        ),
                    );

                    if (
                        requestedJobId !== null &&
                        requestedJobId !== undefined
                    ) {
                        const requestedJob = loadedJobs.find(
                            (job) =>
                                String(job.id) === String(requestedJobId),
                        );

                        if (requestedJob) {
                            setVagaSelecionada(requestedJob);
                            setModalAberto(true);
                        }
                    }

                    setLoadError("");
                },
            )
            .catch((error) => {
                if (!active || error?.code === "ERR_CANCELED") return;

                setLoadError(
                    getApiErrorMessage(
                        error,
                        "Não foi possível carregar suas oportunidades.",
                    ),
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [reloadKey, requestedJobId]);

    const vagasAgrupadas = useMemo(
        () =>
            vagas.reduce((groups, vaga) => {
                const category = vaga.category || "Outras oportunidades";

                if (!groups[category]) groups[category] = [];
                groups[category].push(vaga);

                return groups;
            }, {}),
        [vagas],
    );

    const appliedJobIds = useMemo(
        () =>
            new Set(
                candidaturas
                    .map(getApplicationJobId)
                    .filter(
                        (jobId) => jobId !== null && jobId !== undefined,
                    )
                    .map(String),
            ),
        [candidaturas],
    );

    const selectedJobApplied = vagaSelecionada
        ? appliedJobIds.has(String(vagaSelecionada.id))
        : false;
    const selectedJobSaved = vagaSelecionada
        ? savedJobIds.has(String(vagaSelecionada.id))
        : false;

    function handleRetry() {
        setLoading(true);
        setLoadError("");
        setJobsMoreError("");
        setReloadKey((currentKey) => currentKey + 1);
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
            const loadedJobs = page.items
                .filter(
                    (job) => job?.id !== null && job?.id !== undefined,
                )
                .map(normalizeJob);

            setVagas((currentJobs) =>
                mergeUniqueById(currentJobs, loadedJobs),
            );
            setJobsPage(page.currentPage);
            setJobsHasMore(page.hasMore);
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

    function openJob(vaga) {
        setApplyError("");
        setSaveError("");
        setVagaSelecionada(vaga);
        setModalAberto(true);
    }

    const closeJob = useCallback(() => {
        setModalAberto(false);
        setApplyError("");
        setSaveError("");
    }, []);

    function goToResume(vagaId = null) {
        navigate("/createResume", {
            state: {
                redirectTo: "/homeUser",
                vagaId,
            },
        });
    }

    async function handleApply(vaga) {
        if (!curriculo?.id) {
            closeJob();
            goToResume(vaga.id);
            return;
        }

        if (
            appliedJobIds.has(String(vaga.id)) ||
            applyingJobId !== null
        ) {
            return;
        }

        setApplyingJobId(vaga.id);
        setApplyError("");

        try {
            const response = await api.post(
                `/vagas/${encodeURIComponent(vaga.id)}/candidaturas`,
            );
            const responseApplication = unwrapApiData(response);
            const application =
                responseApplication && typeof responseApplication === "object"
                    ? responseApplication
                    : {};

            setCandidaturas((currentApplications) => [
                ...currentApplications,
                { ...application, jobId: vaga.id },
            ]);
            setFeedback({
                type: "success",
                message: `Sua candidatura para ${vaga.title} foi enviada.`,
            });
        } catch (error) {
            setApplyError(
                getApiErrorMessage(
                    error,
                    "Não foi possível enviar sua candidatura.",
                ),
            );
        } finally {
            setApplyingJobId(null);
        }
    }

    async function handleToggleSaved(vaga) {
        if (savingJobId !== null) return;

        const jobId = String(vaga.id);
        const isSaved = savedJobIds.has(jobId);
        setSavingJobId(vaga.id);
        setSaveError("");

        try {
            if (isSaved) {
                await api.delete(
                    `/vagas/${encodeURIComponent(vaga.id)}/salvar`,
                );
            } else {
                await api.put(
                    `/vagas/${encodeURIComponent(vaga.id)}/salvar`,
                );
            }

            setSavedJobIds((currentIds) => {
                const nextIds = new Set(currentIds);

                if (isSaved) nextIds.delete(jobId);
                else nextIds.add(jobId);

                return nextIds;
            });
            setFeedback({
                type: "success",
                message: isSaved
                    ? `${vaga.title} foi removida das vagas salvas.`
                    : `${vaga.title} foi adicionada às vagas salvas.`,
            });
        } catch (error) {
            const message = getApiErrorMessage(
                error,
                isSaved
                    ? "Não foi possível remover a vaga salva."
                    : "Não foi possível salvar esta vaga.",
            );
            setSaveError(message);
            setFeedback({ type: "error", message });
        } finally {
            setSavingJobId(null);
        }
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <style>{homeUserAnimationStyles}</style>
                <CandidateHeader />
                <main style={styles.stateMain}>
                    <section
                        style={styles.statePanel}
                        role="status"
                        aria-live="polite"
                    >
                        <span style={styles.spinner} aria-hidden="true" />
                        <h1 style={styles.stateTitle}>
                            Carregando oportunidades
                        </h1>
                        <p style={styles.stateText}>
                            Estamos preparando seu perfil e as vagas disponíveis.
                        </p>
                    </section>
                </main>
                <Footer />
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={styles.container}>
                <style>{homeUserAnimationStyles}</style>
                <CandidateHeader />
                <main style={styles.stateMain}>
                    <section style={styles.statePanel} role="alert">
                        <h1 style={styles.stateTitle}>
                            Não foi possível carregar
                        </h1>
                        <p style={styles.stateText}>{loadError}</p>
                        <button
                            type="button"
                            style={styles.retryButton}
                            onClick={handleRetry}
                        >
                            Tentar novamente
                        </button>
                    </section>
                </main>
                <Footer />
            </div>
        );
    }

    const displayName = curriculo?.nome_completo || usuario?.name;
    const avatarFallback = createInitialsAvatar(displayName);

    return (
        <div style={styles.container}>
            <style>{homeUserAnimationStyles}</style>
            <CandidateHeader />
            <header style={styles.header}>
                <div style={styles.userContainer}>
                    <img
                        src={curriculo?.foto || usuario?.foto || avatarFallback}
                        alt={`Foto de ${displayName}`}
                        style={styles.userImage}
                        onError={(event) => {
                            event.currentTarget.src = avatarFallback;
                        }}
                    />

                    <div style={styles.headerInfos}>
                        <h1 style={styles.userName}>{displayName}</h1>
                        <p style={styles.userText}>
                            {curriculo?.email || usuario?.email}
                        </p>
                        {(curriculo?.telefone || usuario?.telefone) && (
                            <p style={styles.userText}>
                                {curriculo?.telefone || usuario?.telefone}
                            </p>
                        )}
                        <button
                            type="button"
                            style={styles.curriculoButton}
                            onClick={() => goToResume()}
                            onMouseEnter={(event) => {
                                event.currentTarget.style.backgroundColor =
                                    "#ff2f8b";
                            }}
                            onMouseLeave={(event) => {
                                event.currentTarget.style.backgroundColor =
                                    "#ff4fa3";
                            }}
                        >
                            {curriculo ? "Editar currículo" : "Criar currículo"}
                        </button>
                    </div>
                </div>
            </header>

            <main style={styles.main}>
                <div style={styles.welcomeBox}>
                    <h2 style={styles.welcomeTitle}>
                        Encontre sua próxima oportunidade 🚀
                    </h2>

                    <p style={styles.welcomeText}>
                        Explore vagas disponíveis nas áreas de tecnologia,
                        design, marketing e muito mais.
                    </p>
                </div>

                {feedback && (
                    <div
                        role={feedback.type === "error" ? "alert" : "status"}
                        aria-live="polite"
                        style={{
                            ...styles.feedback,
                            ...(feedback.type === "error"
                                ? styles.feedbackError
                                : styles.feedbackSuccess),
                        }}
                    >
                        <span>{feedback.message}</span>
                        <button
                            type="button"
                            aria-label="Fechar mensagem"
                            style={styles.feedbackClose}
                            onClick={() => setFeedback(null)}
                        >
                            ×
                        </button>
                    </div>
                )}

                {vagas.length === 0 ? (
                    <section style={styles.emptyPanel}>
                        <h2 style={styles.stateTitle}>
                            Nenhuma vaga disponível no momento
                        </h2>
                        <p style={styles.stateText}>
                            Volte em breve para conferir novas oportunidades.
                        </p>
                    </section>
                ) : (
                    <>
                        {Object.entries(vagasAgrupadas).map(
                            ([categoria, jobs]) => (
                            <section key={categoria} style={styles.section}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        {categoria}
                                    </h2>
                                    <div style={styles.titleLine} />
                                </div>

                                <div style={styles.cardsContainer}>
                                    {jobs.map((vaga) => {
                                        const isApplied = appliedJobIds.has(
                                            String(vaga.id),
                                        );
                                        const isSaved = savedJobIds.has(
                                            String(vaga.id),
                                        );
                                        const isSaving =
                                            savingJobId !== null &&
                                            String(savingJobId) ===
                                                String(vaga.id);

                                        return (
                                            <article
                                                key={vaga.id}
                                                style={styles.card}
                                                onMouseEnter={(event) => {
                                                    event.currentTarget.style.transform =
                                                        "translateY(-8px)";
                                                    event.currentTarget.style.boxShadow =
                                                        "0 20px 40px rgba(15,23,42,0.15)";
                                                }}
                                                onMouseLeave={(event) => {
                                                    event.currentTarget.style.transform =
                                                        "translateY(0)";
                                                    event.currentTarget.style.boxShadow =
                                                        "0 10px 30px rgba(15,23,42,0.08)";
                                                }}
                                            >
                                                <div>
                                                    <h3 style={styles.cardTitle}>
                                                        {vaga.title}
                                                    </h3>
                                                    {vaga.company && (
                                                        <p style={styles.cardCompany}>
                                                            {vaga.company}
                                                        </p>
                                                    )}
                                                </div>

                                                <img
                                                    src={vaga.image}
                                                    alt=""
                                                    loading="lazy"
                                                    style={styles.cardImage}
                                                />

                                                <p style={styles.cardDescription}>
                                                    {vaga.description}
                                                </p>

                                                <div style={styles.tagsContainer}>
                                                    {vaga.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            style={styles.tag}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {isApplied && (
                                                    <p style={styles.appliedBadge}>
                                                        Candidatura enviada
                                                    </p>
                                                )}

                                                <button
                                                    type="button"
                                                    style={{
                                                        ...styles.savedButton,
                                                        ...(isSaved
                                                            ? styles.savedButtonActive
                                                            : {}),
                                                    }}
                                                    aria-pressed={isSaved}
                                                    aria-busy={isSaving}
                                                    disabled={isSaving}
                                                    onClick={() =>
                                                        handleToggleSaved(vaga)
                                                    }
                                                >
                                                    {isSaving
                                                        ? "Salvando..."
                                                        : isSaved
                                                          ? "★ Vaga salva"
                                                          : "☆ Salvar vaga"}
                                                </button>

                                                <div style={styles.buttonContainer}>
                                                    <div
                                                        style={styles.buttonBack}
                                                        aria-hidden="true"
                                                    />
                                                    <button
                                                        type="button"
                                                        style={styles.buttonFront}
                                                        onMouseEnter={(event) => {
                                                            event.currentTarget.style.transform =
                                                                "translateY(-3px)";
                                                            event.currentTarget.style.boxShadow =
                                                                "0 10px 25px rgba(232,92,139,0.45)";
                                                        }}
                                                        onMouseLeave={(event) => {
                                                            event.currentTarget.style.transform =
                                                                "translateY(0)";
                                                            event.currentTarget.style.boxShadow =
                                                                "none";
                                                        }}
                                                        onMouseDown={(event) => {
                                                            event.currentTarget.style.transform =
                                                                "translateY(2px)";
                                                        }}
                                                        onMouseUp={(event) => {
                                                            event.currentTarget.style.transform =
                                                                "translateY(-3px)";
                                                        }}
                                                        onClick={() => openJob(vaga)}
                                                    >
                                                        Ver detalhes
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                            ),
                        )}

                        {jobsMoreError && (
                            <p style={styles.loadMoreError} role="alert">
                                {jobsMoreError}
                            </p>
                        )}

                        {jobsHasMore && (
                            <div style={styles.loadMoreWrapper}>
                                <button
                                    type="button"
                                    style={styles.retryButton}
                                    onClick={loadMoreJobs}
                                    disabled={jobsLoadingMore}
                                    aria-busy={jobsLoadingMore}
                                >
                                    {jobsLoadingMore
                                        ? "Carregando mais vagas..."
                                        : "Carregar mais vagas"}
                                </button>
                            </div>
                        )}
                    </>
                )}

                <JobModal
                    vaga={vagaSelecionada}
                    aberto={modalAberto}
                    fechar={closeJob}
                    onApply={handleApply}
                    applying={
                        applyingJobId !== null &&
                        String(applyingJobId) ===
                            String(vagaSelecionada?.id)
                    }
                    applied={selectedJobApplied}
                    applyError={applyError}
                    onSave={handleToggleSaved}
                    saving={
                        savingJobId !== null &&
                        String(savingJobId) ===
                            String(vagaSelecionada?.id)
                    }
                    saved={selectedJobSaved}
                    saveError={saveError}
                />
            </main>

            <Footer />
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
        fontFamily: "Arial, sans-serif",
    },
    header: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "clamp(32px, 7vw, 50px) 8%",
        borderBottomLeftRadius: "30px",
        borderBottomRightRadius: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    },
    userContainer: {
        display: "flex",
        alignItems: "center",
        gap: "25px",
        flexWrap: "wrap",
    },
    userImage: {
        width: "clamp(92px, 18vw, 120px)",
        height: "clamp(92px, 18vw, 120px)",
        borderRadius: "50%",
        objectFit: "cover",
        border: "4px solid rgba(255,255,255,0.2)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
    },
    headerInfos: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        minWidth: 0,
    },
    userName: {
        color: "white",
        margin: 0,
        fontSize: "clamp(28px, 7vw, 38px)",
        fontWeight: "700",
        letterSpacing: "-1px",
        overflowWrap: "anywhere",
    },
    userText: {
        color: "#cbd5e1",
        margin: "6px 0",
        fontSize: "15px",
        overflowWrap: "anywhere",
    },
    curriculoButton: {
        marginTop: "18px",
        padding: "14px 24px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        color: "white",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "15px",
        transition: "all 0.25s ease",
        boxShadow: "0 10px 20px rgba(236,72,153,0.35)",
    },
    main: {
        padding: "clamp(38px, 8vw, 60px) 8%",
    },
    welcomeBox: {
        marginBottom: "45px",
    },
    welcomeTitle: {
        fontSize: "clamp(32px, 7vw, 44px)",
        color: "#0f172a",
        marginBottom: "12px",
        fontWeight: "700",
    },
    welcomeText: {
        color: "#64748b",
        fontSize: "18px",
        lineHeight: "1.6",
    },
    feedback: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        padding: "16px 20px",
        marginBottom: "38px",
        borderRadius: "16px",
        fontWeight: "700",
        lineHeight: 1.5,
    },
    feedbackSuccess: {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
    },
    feedbackError: {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fecaca",
    },
    feedbackClose: {
        border: 0,
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        fontSize: "24px",
        lineHeight: 1,
    },
    section: {
        marginBottom: "70px",
    },
    sectionTitle: {
        fontSize: "clamp(28px, 6vw, 34px)",
        color: "#0f172a",
        fontWeight: "700",
        marginBottom: "8px",
    },
    titleLine: {
        width: "120px",
        height: "5px",
        borderRadius: "999px",
        background: "linear-gradient(to right, #ec4899, #60a5fa)",
        marginBottom: "35px",
    },
    cardsContainer: {
        display: "flex",
        gap: "32px",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "stretch",
    },
    card: {
        width: "100%",
        maxWidth: "320px",
        minHeight: "520px",
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(10px)",
        borderRadius: "24px",
        padding: "18px",
        border: "1px solid rgba(255,255,255,0.4)",
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        transition: "all 0.3s ease",
        overflow: "hidden",
        boxSizing: "border-box",
    },
    cardTitle: {
        margin: "0 0 6px",
        fontSize: "22px",
        color: "#0f172a",
        fontWeight: "700",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    cardCompany: {
        margin: "0 0 14px",
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "600",
    },
    cardImage: {
        width: "100%",
        height: "190px",
        minHeight: "190px",
        objectFit: "cover",
        borderRadius: "18px",
        display: "block",
    },
    cardDescription: {
        marginTop: "16px",
        fontSize: "14px",
        color: "#475569",
        lineHeight: "1.7",
        textAlign: "left",
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
        minHeight: "95px",
    },
    tagsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "8px",
    },
    tag: {
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        padding: "7px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "600",
    },
    appliedBadge: {
        alignSelf: "flex-start",
        margin: "16px 0 0",
        padding: "7px 12px",
        borderRadius: "999px",
        background: "#dcfce7",
        color: "#166534",
        fontSize: "12px",
        fontWeight: "800",
    },
    savedButton: {
        alignSelf: "flex-start",
        marginTop: "12px",
        padding: "9px 13px",
        borderRadius: "999px",
        border: "1px solid #cbd5e1",
        background: "rgba(255,255,255,0.9)",
        color: "#475569",
        fontSize: "12px",
        fontWeight: "800",
        cursor: "pointer",
    },
    savedButtonActive: {
        borderColor: "#f9a8d4",
        background: "#fce7f3",
        color: "#be185d",
    },
    buttonContainer: {
        position: "relative",
        width: "180px",
        height: "44px",
        marginTop: "auto",
        paddingTop: "25px",
        marginLeft: "auto",
        marginRight: "auto",
        boxSizing: "content-box",
    },
    buttonBack: {
        position: "absolute",
        width: "100%",
        height: "44px",
        borderRadius: "16px",
        border: "2px solid #60a5fa",
        bottom: "-6px",
        left: "-8px",
        transition: "all 0.25s ease",
        opacity: 0.9,
    },
    buttonFront: {
        position: "relative",
        width: "100%",
        height: "44px",
        borderRadius: "16px",
        border: "none",
        background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        color: "#fff",
        fontWeight: "700",
        fontSize: "15px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 4px 15px rgba(236,72,153,0.25)",
    },
    stateMain: {
        minHeight: "70vh",
        padding: "60px 20px",
        display: "grid",
        placeItems: "center",
    },
    statePanel: {
        width: "min(100%, 620px)",
        padding: "42px 30px",
        borderRadius: "24px",
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 15px 40px rgba(15,23,42,0.12)",
        textAlign: "center",
    },
    emptyPanel: {
        width: "min(100%, 720px)",
        margin: "0 auto 60px",
        padding: "42px 30px",
        borderRadius: "24px",
        background: "rgba(255,255,255,0.82)",
        boxShadow: "0 15px 40px rgba(15,23,42,0.08)",
        textAlign: "center",
    },
    loadMoreWrapper: {
        display: "flex",
        justifyContent: "center",
        margin: "-24px 0 60px",
    },
    loadMoreError: {
        margin: "-24px auto 24px",
        color: "#991b1b",
        fontWeight: "700",
        textAlign: "center",
    },
    stateTitle: {
        margin: "0 0 12px",
        color: "#0f172a",
        fontSize: "clamp(24px, 6vw, 32px)",
    },
    stateText: {
        margin: 0,
        color: "#64748b",
        fontSize: "16px",
        lineHeight: 1.6,
    },
    retryButton: {
        marginTop: "24px",
        padding: "13px 22px",
        border: 0,
        borderRadius: "14px",
        background: "linear-gradient(135deg, #ec4899, #db2777)",
        color: "white",
        fontWeight: "700",
        cursor: "pointer",
    },
    spinner: {
        width: "38px",
        height: "38px",
        display: "inline-block",
        marginBottom: "20px",
        borderRadius: "50%",
        border: "4px solid #dbeafe",
        borderTopColor: "#ec4899",
        animation: "candidate-spin 0.8s linear infinite",
    },
};

const homeUserAnimationStyles = `
@keyframes candidate-spin {
    to { transform: rotate(360deg); }
}
`;
