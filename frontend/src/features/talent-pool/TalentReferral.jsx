import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { collectPaginatedItems } from "../../lib/pagination";

export default function TalentReferral({ talent, onComplete }) {
  const [state, setState] = useState({ loading: true, jobs: [], error: "" });
  const [selectedId, setSelectedId] = useState("");
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
            jobs: jobs.filter((job) => job.status === "publicada"),
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
        Selecione uma oportunidade publicada sob sua gestão para visualizar a
        indicação de {talent.name}.
      </p>
      <div className="talent-notice">
        <strong>Simulação</strong>
        <p>
          Este perfil é fictício. A indicação não cria uma candidatura e não
          envia dados para a empresa.
        </p>
      </div>
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
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedJob) onComplete(selectedJob);
          }}
        >
          <label className="talent-field" htmlFor="talent-referral-job">
            Oportunidade
          </label>
          <select
            id="talent-referral-job"
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
          <button
            className="talent-admin-button"
            type="submit"
            disabled={!selectedJob}
          >
            Simular indicação
          </button>
        </form>
      )}
    </section>
  );
}
