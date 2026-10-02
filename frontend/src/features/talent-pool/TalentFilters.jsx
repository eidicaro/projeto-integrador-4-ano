import { useId } from "react";

export default function TalentFilters({
  filters,
  areas,
  locations,
  onChange,
  onClear,
}) {
  const id = useId();
  return (
    <div className="talent-filters">
      <div className="talent-filter-field">
        <label htmlFor={`${id}-area`}>Área de interesse</label>
        <select
          id={`${id}-area`}
          value={filters.area}
          onChange={(event) => onChange("area", event.target.value)}
        >
          <option value="">Todas as áreas</option>
          {areas.map((area) => (
            <option key={area}>{area}</option>
          ))}
        </select>
      </div>
      <div className="talent-filter-field">
        <label htmlFor={`${id}-location`}>Localização</label>
        <select
          id={`${id}-location`}
          value={filters.location}
          onChange={(event) => onChange("location", event.target.value)}
        >
          <option value="">Todas as localidades</option>
          {locations.map((location) => (
            <option key={location}>{location}</option>
          ))}
        </select>
      </div>
      <div className="talent-filter-field">
        <label htmlFor={`${id}-period`}>Entrada no banco</label>
        <select
          id={`${id}-period`}
          value={filters.period}
          onChange={(event) => onChange("period", event.target.value)}
        >
          <option value="">Qualquer período</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>
      <button
        className="talent-admin-button talent-admin-button--secondary"
        type="button"
        onClick={onClear}
      >
        Limpar filtros
      </button>
    </div>
  );
}
