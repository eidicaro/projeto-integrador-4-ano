import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CandidateHeader from "../components/CandidateHeader";
import api, { getApiErrorMessage } from "../lib/api";
import { normalizeJob, unwrapApiCollection } from "../lib/candidate";
import {
  mergeUniqueById,
  readPaginatedResponse,
} from "../lib/pagination";
import "../styles/candidate-pages.css";

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    api.get("/vagas-salvas", {
      params: { page: 1, per_page: 50 },
      signal: controller.signal,
    })
      .then((response) => {
        if (!active) return;
        const pagination = readPaginatedResponse(response);

        setJobs(unwrapApiCollection(response).map(normalizeJob));
        setPage(pagination.currentPage);
        setHasMore(pagination.hasMore);
        setError("");
      })
      .catch((requestError) => {
        if (!active || requestError?.code === "ERR_CANCELED") return;
        setError(
          getApiErrorMessage(
            requestError,
            "Não foi possível carregar suas vagas salvas.",
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

  async function loadMoreJobs() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError("");

    try {
      const response = await api.get("/vagas-salvas", {
        params: { page: page + 1, per_page: 50 },
      });
      const pagination = readPaginatedResponse(response);
      const loadedJobs = unwrapApiCollection(response).map(normalizeJob);

      setJobs((current) => mergeUniqueById(current, loadedJobs));
      setPage(pagination.currentPage);
      setHasMore(pagination.hasMore);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível carregar mais vagas salvas.",
        ),
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function removeJob(job) {
    setRemovingId(job.id);
    setError("");

    try {
      await api.delete(`/vagas/${encodeURIComponent(job.id)}/salvar`);
      setJobs((current) =>
        current.filter((item) => String(item.id) !== String(job.id)),
      );

      if (hasMore) {
        setPage((currentPage) => Math.max(0, currentPage - 1));
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Não foi possível remover a vaga salva."),
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="candidate-page">
      <CandidateHeader />
      <main className="candidate-main">
        <div className="candidate-heading">
          <div>
            <span className="candidate-eyebrow">Seu radar</span>
            <h1>Vagas salvas</h1>
            <p>Guarde oportunidades interessantes e volte quando estiver pronto para se candidatar.</p>
          </div>
          <Link className="candidate-button" to="/homeUser">Explorar vagas</Link>
        </div>

        {error && <div className="candidate-alert" role="alert">{error}</div>}

        {loading ? (
          <section className="candidate-state" role="status">
            <h2>Carregando vagas salvas…</h2>
            <p>Organizando as oportunidades do seu radar.</p>
          </section>
        ) : error && jobs.length === 0 ? (
          <section className="candidate-state">
            <h2>Não foi possível exibir seus favoritos</h2>
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
        ) : jobs.length === 0 ? (
          <section className="candidate-state">
            <h2>Nenhuma vaga salva</h2>
            <p>Quando você salvar uma oportunidade, ela aparecerá aqui.</p>
            <Link className="candidate-button" to="/homeUser">Encontrar vagas</Link>
          </section>
        ) : (
          <>
            <section className="saved-jobs-grid" aria-label="Vagas salvas">
              {jobs.map((job) => (
                <article className="saved-job-card" key={job.id}>
                <img src={job.image} alt="" loading="lazy" />
                <div className="saved-job-card__body">
                  <p className="saved-job-card__meta">
                    {[job.workMode, job.employmentType, job.seniority]
                      .filter(Boolean)
                      .join(" · ") || "Oportunidade"}
                  </p>
                  <h2>{job.title}</h2>
                  <p>{[job.company, job.location].filter(Boolean).join(" · ")}</p>
                  <div className="saved-job-card__footer">
                    <Link className="candidate-button" to={`/vagas/${job.id}`}>
                      Ver detalhes
                    </Link>
                    <button
                      className="candidate-danger-button"
                      type="button"
                      disabled={removingId === job.id}
                      onClick={() => removeJob(job)}
                    >
                      {removingId === job.id ? "Removendo…" : "Remover"}
                    </button>
                  </div>
                </div>
                </article>
              ))}
            </section>

            {hasMore && (
              <div className="candidate-load-more">
                <button
                  className="candidate-button"
                  type="button"
                  disabled={loadingMore}
                  aria-busy={loadingMore}
                  onClick={loadMoreJobs}
                >
                  {loadingMore ? "Carregando mais…" : "Carregar mais vagas"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
