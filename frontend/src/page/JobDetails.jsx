import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api, { getApiErrorMessage } from "../lib/api";
import {
  getApplicationJobId,
  normalizeJob,
  unwrapApiCollection,
  unwrapApiData,
} from "../lib/candidate";
import "../styles/candidate-pages.css";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function salaryLabel(job) {
  if (!job.salaryVisible) return "A combinar";
  const minimum = formatCurrency(job.salaryMin);
  const maximum = formatCurrency(job.salaryMax);

  if (minimum && maximum) return `${minimum} – ${maximum}`;
  if (minimum) return `A partir de ${minimum}`;
  if (maximum) return `Até ${maximum}`;
  return "A combinar";
}

function dateLabel(value) {
  if (!value) return "Sem prazo definido";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "Sem prazo definido"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(parsed);
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: authLoading, user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resume, setResume] = useState(null);
  const [candidateLoaded, setCandidateLoaded] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [resumeSource, setResumeSource] = useState("online");
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    api.get(`/vagas/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((response) => {
        if (!active) return;
        setJob(normalizeJob(unwrapApiData(response)));
        setError("");
      })
      .catch((requestError) => {
        if (!active || requestError?.code === "ERR_CANCELED") return;
        setError(
          requestError?.response?.status === 404
            ? "Esta vaga não está mais disponível."
            : getApiErrorMessage(requestError, "Não foi possível carregar esta vaga."),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    if (authLoading || user?.role !== "candidato") return undefined;

    const controller = new AbortController();
    let active = true;

    Promise.all([
      api.get("/curriculos/me", { signal: controller.signal }),
      api.get("/minhas-candidaturas", {
        params: { per_page: 100 },
        signal: controller.signal,
      }),
      api.get("/vagas-salvas", {
        params: { per_page: 50 },
        signal: controller.signal,
      }),
    ])
      .then(([resumeResponse, applicationsResponse, savedResponse]) => {
        if (!active) return;
        const applications = unwrapApiCollection(applicationsResponse);
        const savedJobs = unwrapApiCollection(savedResponse);

        setResume(unwrapApiData(resumeResponse));
        setApplied(
          applications.some(
            (application) => String(getApplicationJobId(application)) === String(id),
          ),
        );
        setSaved(savedJobs.some((savedJob) => String(savedJob.id) === String(id)));
      })
      .catch((requestError) => {
        if (!active || requestError?.code === "ERR_CANCELED") return;
        setError(getApiErrorMessage(requestError, "Não foi possível carregar seus dados."));
      })
      .finally(() => {
        if (active) setCandidateLoaded(true);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, id, user?.role]);

  const candidateBusy = authLoading || (user?.role === "candidato" && !candidateLoaded);
  const tags = useMemo(() => job?.tags || [], [job]);

  function requireCandidate() {
    if (!user) {
      navigate("/login", {
        state: { redirectTo: `${location.pathname}${location.search}` },
      });
      return false;
    }

    if (user.role !== "candidato") {
      setError("Apenas candidatos podem realizar esta ação.");
      return false;
    }

    return true;
  }

  async function handleApply() {
    if (!requireCandidate() || applying || applied || candidateBusy) return;

    if (resumeSource === "online" && !resume?.id) {
      navigate("/createResume", {
        state: {
          redirectTo: `/vagas/${id}`,
          vagaId: id,
        },
      });
      return;
    }

    setApplying(true);
    setError("");
    setFeedback("");

    try {
      const formData = new FormData();
      formData.append("curriculo_origem", resumeSource);
      if (resumeSource === "online") formData.append("curriculo_id", resume.id);
      if (resumeSource === "arquivo" && resumeFile) formData.append("curriculo_arquivo", resumeFile);
      await api.post(`/vagas/${encodeURIComponent(id)}/candidaturas`, formData);
      setApplied(true);
      setFeedback("Candidatura enviada com sucesso.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível enviar a candidatura."));
    } finally {
      setApplying(false);
    }
  }

  async function toggleSaved() {
    if (!requireCandidate() || saving || candidateBusy) return;

    setSaving(true);
    setError("");

    try {
      if (saved) {
        await api.delete(`/vagas/${encodeURIComponent(id)}/salvar`);
      } else {
        await api.put(`/vagas/${encodeURIComponent(id)}/salvar`);
      }
      setSaved((current) => !current);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível atualizar seus favoritos."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="candidate-page">
      <main className="job-detail">
        <Link className="job-detail__back" to={user?.role === "candidato" ? "/homeUser" : "/#vagas"}>
          ← Voltar para as vagas
        </Link>

        {loading ? (
          <section className="candidate-state" role="status">
            <h2>Carregando oportunidade…</h2>
            <p>Aguarde enquanto buscamos os detalhes da vaga.</p>
          </section>
        ) : error && !job ? (
          <section className="candidate-state" role="alert">
            <h2>Oportunidade indisponível</h2>
            <p>{error}</p>
            <Link className="candidate-button" to="/#vagas">Ver outras vagas</Link>
          </section>
        ) : job ? (
          <>
            <div className="job-detail__hero">
              <div>
                <span className="candidate-eyebrow">
                  {job.department || "Oportunidade"}
                </span>
                <h1>{job.title}</h1>
                <p className="job-detail__company">
                  {[job.company, job.location].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="job-detail__actions">
                <button
                  className="candidate-button-secondary"
                  type="button"
                  onClick={toggleSaved}
                  disabled={saving || candidateBusy}
                >
                  {saving ? "Salvando…" : saved ? "Remover dos salvos" : "Salvar vaga"}
                </button>
                <button
                  className="candidate-button"
                  type="button"
                  onClick={handleApply}
                  disabled={
                    applying ||
                    applied ||
                    candidateBusy ||
                    job.isOpen === false ||
                    (resumeSource === "arquivo" && !resumeFile)
                  }
                >
                  {applying
                    ? "Enviando…"
                    : applied
                      ? "Candidatura enviada"
                      : job.isOpen === false
                        ? "Inscrições encerradas"
                        : "Candidatar agora"}
                </button>
              </div>
            </div>

            {error && <div className="candidate-alert" role="alert">{error}</div>}
            {feedback && (
              <div className="candidate-alert candidate-alert--success" role="status">
                {feedback}
              </div>
            )}

            {user?.role === "candidato" && !applied && (
              <section className="candidate-panel job-resume-choice">
                <div>
                  <span className="candidate-eyebrow">Documento da candidatura</span>
                  <h2>Escolha seu currículo</h2>
                </div>
                <label>
                  <input
                    type="radio"
                    name="detail-resume-source"
                    checked={resumeSource === "online"}
                    disabled={!resume?.id}
                    onChange={() => setResumeSource("online")}
                  />
                  Usar meu currículo online
                </label>
                <label>
                  <input
                    type="radio"
                    name="detail-resume-source"
                    checked={resumeSource === "arquivo"}
                    onChange={() => setResumeSource("arquivo")}
                  />
                  Enviar meu próprio PDF
                </label>
                {resumeSource === "arquivo" && (
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                  />
                )}
              </section>
            )}

            <section className="job-detail__facts" aria-label="Resumo da vaga">
              <div><span>Modelo</span><strong>{job.workMode || "Não informado"}</strong></div>
              <div><span>Contrato</span><strong>{job.employmentType || "Não informado"}</strong></div>
              <div><span>Senioridade</span><strong>{job.seniority || "Não informada"}</strong></div>
              <div><span>Salário</span><strong>{salaryLabel(job)}</strong></div>
            </section>

            <div className="job-detail__content">
              <section>
                <h2>Sobre a oportunidade</h2>
                <p>{job.description}</p>
                {tags.length > 0 && (
                  <div className="job-tags">
                    {tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                )}
              </section>

              {job.responsibilities && (
                <section>
                  <h2>Responsabilidades</h2>
                  <p>{job.responsibilities}</p>
                </section>
              )}

              <section>
                <h2>Requisitos</h2>
                <p>{job.requirements || "Os requisitos serão apresentados durante o processo."}</p>
              </section>

              {Array.isArray(job.benefits) && job.benefits.length > 0 && (
                <section>
                  <h2>Benefícios</h2>
                  <p>{job.benefits.map((benefit) => `• ${benefit}`).join("\n")}</p>
                </section>
              )}

              <section>
                <h2>Prazo para candidatura</h2>
                <p>{dateLabel(job.applicationDeadline)}</p>
              </section>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
