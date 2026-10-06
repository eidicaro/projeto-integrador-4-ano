import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiErrorMessage, getApiFieldError } from "../../lib/api";
import talentPoolApi from "./talentPoolApi";
import { collectPaginatedItems } from "../../lib/pagination";

export default function TalentReferral({ talent, onComplete }) {
  const [state, setState] = useState({ loading: true, jobs: [], error: "" });
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    collectPaginatedItems((page) =>
      api.get("/admin/vagas", {
        params: { page, per_page: 100 },
        signal: controller.signal,
      }),
    )
      .then((jobs) => {
        if (active)
          setState({
            loading: false,
            jobs: jobs.filter((job) => job.status === "publicada" && job.isOpen),
            error: "",
          });
      })
      .catch((error) => {
        if (active && error.code !== "ERR_CANCELED")
          setState({
            loading: false,
            jobs: [],
            error: "Não foi possível carregar suas vagas. Tente novamente.",
          });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [reload]);
  const selectedJob = state.jobs.find((job) => String(job.id) === selectedId);
  return (
    <section className="talent-referral">
      <h3>Indicar para uma vaga</h3>
      <p>
        Selecione uma oportunidade publicada sob sua gestão para confirmar a
        indicação de {talent.name}.
      </p>
      <p>A indicação inclui o participante no processo seletivo e aparece em suas candidaturas como indicação da equipe.</p>
      {state.loading ? (
        <div className="talent-skeleton" role="status">
          <span />
          <p>Carregando vagas publicadas…</p>
        </div>
      ) : state.error ? (
        <div role="alert" className="talent-admin-alert">
          {state.error}
          <button
            type="button"
            onClick={() => {
              setSelectedId("");
              setState({ loading: true, jobs: [], error: "" });
              setReload((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : !state.jobs.length ? (
        <p>
          Não há vagas publicadas para indicar.{" "}
          <Link className="talent-text-link" to="/admin/ver-vagas">
            Gerenciar vagas ↗
          </Link>
        </p>
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selectedJob || saving) return;
            setSaving(true);
            setSubmitError("");
            try {
              const application = await talentPoolApi.refer(talent.id, selectedJob.id);
              onComplete(selectedJob, application);
            } catch (requestError) {
              setSubmitError(getApiFieldError(requestError, "curriculo", "vaga_id") ||
                getApiErrorMessage(requestError, "Não foi possível indicar o participante. Tente novamente."));
            } finally {
              setSaving(false);
            }
          }}
          aria-busy={saving}
        >
          <label className="talent-field" htmlFor="talent-referral-job">
            Oportunidade
          </label>
          <select
            id="talent-referral-job"
            disabled={saving}
            required
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            <option value="">Selecione uma vaga</option>
            {state.jobs.map((job) => (
              <option key={job.id} value={String(job.id)}>
                {job.title} · {job.company}
              </option>
            ))}
          </select>
          {selectedJob && (
            <div className="talent-referral-preview">
              <strong>{selectedJob.title}</strong>
              <p>
                {[
                  selectedJob.company,
                  selectedJob.department,
                  selectedJob.location,
                  selectedJob.workMode,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <Link
                to={`/vagas/${selectedJob.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="talent-text-link"
              >
                Consultar detalhes da vaga ↗
              </Link>
            </div>
          )}
          {submitError && <p role="alert" className="talent-admin-alert">{submitError}</p>}
          <button
            className="talent-admin-button"
            type="submit"
            disabled={!selectedJob || saving}
          >
            {saving ? "Indicando…" : "Confirmar indicação"}
          </button>
        </form>
      )}
    </section>
  );
}
