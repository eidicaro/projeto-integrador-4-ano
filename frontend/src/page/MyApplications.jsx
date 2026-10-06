import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CandidateHeader from "../components/CandidateHeader";
import api, { getApiErrorMessage } from "../lib/api";
import { unwrapApiCollection, unwrapApiData } from "../lib/candidate";
import {
  mergeUniqueById,
  readPaginatedResponse,
} from "../lib/pagination";
import "../styles/candidate-pages.css";

const STAGE_LABELS = {
  novo: "Candidatura recebida",
  triagem: "Em triagem",
  entrevista: "Entrevista",
  oferta: "Proposta",
  contratado: "Contratado",
  reprovado: "Processo encerrado",
  retirado: "Retirada",
};

const TERMINAL_STAGES = new Set(["contratado", "reprovado", "retirado"]);

function formatDate(value) {
  if (!value) return "Data não informada";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Data não informada"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    api.get("/minhas-candidaturas", {
      params: { page: 1, per_page: 100 },
      signal: controller.signal,
    })
      .then((response) => {
        if (!active) return;
        const pagination = readPaginatedResponse(response);

        setApplications(unwrapApiCollection(response));
        setPage(pagination.currentPage);
        setHasMore(pagination.hasMore);
        setError("");
      })
      .catch((requestError) => {
        if (!active || requestError?.code === "ERR_CANCELED") return;
        setError(
          getApiErrorMessage(
            requestError,
            "Não foi possível carregar suas candidaturas.",
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
  }, [reloadKey]);

  async function loadMoreApplications() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError("");

    try {
      const response = await api.get("/minhas-candidaturas", {
        params: { page: page + 1, per_page: 100 },
      });
      const pagination = readPaginatedResponse(response);

      setApplications((current) =>
        mergeUniqueById(current, unwrapApiCollection(response)),
      );
      setPage(pagination.currentPage);
      setHasMore(pagination.hasMore);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar mais candidaturas.",
        ),
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function withdraw(application) {
    if (
      !window.confirm(
        "Deseja retirar esta candidatura? Essa ação encerra sua participação neste processo.",
      )
    ) {
      return;
    }

    setWithdrawingId(application.id);
    setError("");
    setFeedback("");

    try {
      const response = await api.patch(
        `/candidaturas/${encodeURIComponent(application.id)}/retirar`,
      );
      const updated = unwrapApiData(response);
      setApplications((current) =>
        current.map((item) => (item.id === application.id ? updated : item)),
      );
      setFeedback("Candidatura retirada com sucesso.");
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível retirar a candidatura."),
      );
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div className="candidate-page">
      <CandidateHeader />
      <main className="candidate-main">
        <div className="candidate-heading">
          <div>
            <span className="candidate-eyebrow">Seu progresso</span>
            <h1>Minhas candidaturas</h1>
            <p>Acompanhe cada processo e consulte os detalhes das oportunidades.</p>
          </div>
          <Link className="candidate-button" to="/homeUser">Explorar vagas</Link>
        </div>

        {feedback && (
          <div className="candidate-alert candidate-alert--success" role="status">
            {feedback}
          </div>
        )}

        {error && (
          <div className="candidate-alert" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <section className="candidate-state" role="status">
            <h2>Carregando candidaturas…</h2>
            <p>Estamos buscando as atualizações dos seus processos.</p>
          </section>
        ) : error && applications.length === 0 ? (
          <section className="candidate-state">
            <h2>Não foi possível exibir os processos</h2>
            <p>Tente novamente para atualizar a lista.</p>
            <button
              className="candidate-button"
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                setReloadKey((value) => value + 1);
              }}
            >
              Tentar novamente
            </button>
          </section>
        ) : applications.length === 0 ? (
          <section className="candidate-state">
            <h2>Você ainda não se candidatou</h2>
            <p>Encontre uma oportunidade e envie seu currículo em poucos passos.</p>
            <Link className="candidate-button" to="/homeUser">Ver oportunidades</Link>
          </section>
        ) : (
          <>
            <section className="application-list" aria-label="Lista de candidaturas">
              {applications.map((application) => {
              const job = application.job || {};
              const stage = application.stage || "novo";
              const canWithdraw = !TERMINAL_STAGES.has(stage);

                return (
                  <article className="application-card" key={application.id}>
                  <div className="application-card__top">
                    <div>
                      <h2>{job.title || "Oportunidade indisponível"}</h2>
                      <p>
                        {[job.company, job.location, job.workMode]
                          .filter(Boolean)
                          .join(" · ") || "Detalhes preservados no processo"}
                      </p>
                    </div>
                    <span className="stage-pill">
                      {stage === "novo" && application.source === "banco_de_talentos" ? "Indicação recebida" : STAGE_LABELS[stage] || stage}
                    </span>
                  </div>

                  <div className="application-card__footer">
                    <time dateTime={application.appliedAt || undefined}>
                      {application.source === "banco_de_talentos" ? "Indicada pela equipe em " : "Enviada em "}{formatDate(application.appliedAt)}
                    </time>
                    <div className="application-card__actions">
                      {job.id && (
                        <Link className="candidate-button-secondary" to={`/vagas/${job.id}`}>
                          Ver vaga
                        </Link>
                      )}
                      {canWithdraw && (
                        <button
                          className="candidate-danger-button"
                          type="button"
                          disabled={withdrawingId === application.id}
                          onClick={() => withdraw(application)}
                        >
                          {withdrawingId === application.id ? "Retirando…" : "Retirar"}
                        </button>
                      )}
                    </div>
                  </div>
                  </article>
                );
              })}
            </section>

            {hasMore && (
              <div className="candidate-load-more">
                <button
                  className="candidate-button"
                  type="button"
                  disabled={loadingMore}
                  aria-busy={loadingMore}
                  onClick={loadMoreApplications}
                >
                  {loadingMore
                    ? "Carregando mais…"
                    : "Carregar mais candidaturas"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
