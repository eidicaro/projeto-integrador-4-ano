import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { uniqueInterests, validateInterests } from "./talentPool";

export default function TalentInterestForm({
  options,
  initialInterests,
  editing,
  onSave,
  onCancel,
}) {
  const [selected, setSelected] = useState(initialInterests || []);
  const [customAreas, setCustomAreas] = useState([]);
  const [custom, setCustom] = useState("");
  const [consent, setConsent] = useState(Boolean(editing));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const choices = uniqueInterests([...options, ...customAreas, ...selected]);
  function toggle(value) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
    setError("");
  }
  function addArea() {
    const value = custom.trim();
    if (value.length < 2 || value.length > 120) {
      setError("Informe uma área com 2 a 120 caracteres.");
      return;
    }
    const match =
      choices.find(
        (item) =>
          item.localeCompare(value, "pt-BR", { sensitivity: "base" }) === 0,
      ) || value;
    setCustomAreas((current) => uniqueInterests([...current, match]));
    setSelected((current) => uniqueInterests([...current, match]));
    setCustom("");
    setError("");
  }
  async function submit(event) {
    event.preventDefault();
    const message = validateInterests(selected);
    if (message || !consent) {
      setError(
        message ||
          "Confirme que deseja salvar seus interesses nesta demonstração.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(selected);
    } catch {
      setError(
        "Não foi possível salvar. Verifique se o armazenamento local está disponível e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="talent-interest-form" onSubmit={submit} aria-busy={saving}>
      <fieldset disabled={saving}>
        <legend>
          {editing
            ? "Atualizar áreas de interesse"
            : "Onde você quer dar seu próximo passo?"}
        </legend>
        <p id="talent-interest-help">
          Selecione até oito áreas. As sugestões vêm das vagas disponíveis e do
          seu currículo.
        </p>
        <div
          className="talent-interest-options"
          aria-describedby="talent-interest-help"
        >
          {choices.map((area, index) => (
            <label
              className={`talent-interest ${selected.includes(area) ? "is-selected" : ""}`}
              key={area}
            >
              <input
                type="checkbox"
                name="interests"
                value={area}
                checked={selected.includes(area)}
                onChange={() => toggle(area)}
              />
              <span>{area}</span>
              {selected.includes(area) && (
                <Check size={16} aria-hidden="true" />
              )}
              <span className="talent-sr-only">Opção {index + 1}</span>
            </label>
          ))}
        </div>
        <label className="talent-field" htmlFor="talent-custom-area">
          Outra área de interesse
        </label>
        <div className="talent-custom-area">
          <input
            id="talent-custom-area"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            maxLength={120}
            placeholder="Ex.: sua área de atuação"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addArea();
              }
            }}
          />
          <button
            type="button"
            className="candidate-button-secondary"
            onClick={addArea}
            disabled={!custom.trim()}
          >
            <Plus size={16} aria-hidden="true" /> Adicionar
          </button>
        </div>
        <label className="talent-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>
            Quero registrar meu interesse nesta demonstração. Entendo que ele
            será salvo apenas neste navegador e não será enviado à equipe de
            recrutamento.
          </span>
        </label>
      </fieldset>
      {error && (
        <p className="candidate-alert" role="alert">
          {error}
        </p>
      )}
      <div className="talent-actions">
        <button className="candidate-button" type="submit" disabled={saving}>
          {saving
            ? "Salvando…"
            : editing
              ? "Salvar interesses"
              : "Registrar interesse · demonstração"}
        </button>
        {editing && (
          <button
            type="button"
            className="candidate-button-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
