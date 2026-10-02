import { profileCompleteness } from "./talentPool";

export default function TalentProfileSummary({
  resume,
  user = {},
  detailed = false,
}) {
  const completeness = profileCompleteness(resume, user);
  const skills = (resume?.habilidades || [])
    .map((skill) => (typeof skill === "string" ? skill : skill.nome))
    .filter(Boolean);
  const contacts = [
    ["E-mail", resume?.email || user.email],
    ["Telefone", resume?.telefone || user.telefone],
    ["Localização", resume?.cidade_estado],
    ["Área de atuação", resume?.area_atuacao],
  ];
  return (
    <div className="talent-profile-summary">
      <div className="talent-profile-heading">
        <span className="talent-avatar" aria-hidden="true">
          {String(resume?.nome_completo || user.name || "C").charAt(0)}
        </span>
        <div>
          <h3>{resume?.nome_completo || user.name || "Seu perfil"}</h3>
          <p>{resume?.area_atuacao || "Área de atuação não informada"}</p>
        </div>
      </div>
      <dl className="talent-facts">
        {contacts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Não informado"}</dd>
          </div>
        ))}
      </dl>
      <div className="talent-completeness">
        <div>
          <strong>Completude do perfil</strong>
          <span>{completeness.percent}%</span>
        </div>
        <progress
          value={completeness.percent}
          max="100"
          aria-label="Completude do perfil"
        />
        <p>
          {completeness.missing.length
            ? `Você pode complementar: ${completeness.missing.join(", ").toLocaleLowerCase("pt-BR")}.`
            : "As informações principais estão preenchidas."}
        </p>
      </div>
      {skills.length > 0 && (
        <section>
          <h3>Habilidades</h3>
          <div className="talent-tags">
            {skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </section>
      )}
      {detailed && (
        <>
          {resume?.resumo && (
            <section>
              <h3>Apresentação profissional</h3>
              <p className="talent-preline">{resume.resumo}</p>
            </section>
          )}
          {[
            ["Experiências", resume?.experiencias, "cargo", "empresa"],
            ["Formação", resume?.formacoes, "curso", "instituicao"],
            ["Cursos", resume?.cursos, "nome", "instituicao"],
          ].map(
            ([title, items, nameKey, orgKey]) =>
              items?.length > 0 && (
                <section key={title}>
                  <h3>{title}</h3>
                  <ul className="talent-resume-list">
                    {items.map((item, index) => (
                      <li key={item.id || index}>
                        <strong>{item[nameKey]}</strong>
                        <span>
                          {[item[orgKey], item.periodo]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {item.descricao && (
                          <p className="talent-preline">{item.descricao}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ),
          )}
          {resume?.idiomas?.length > 0 && (
            <section>
              <h3>Idiomas</h3>
              <div className="talent-tags">
                {resume.idiomas.map((item) => (
                  <span key={item.id || item.idioma}>
                    {item.idioma}
                    {item.nivel && ` · ${item.nivel}`}
                  </span>
                ))}
              </div>
            </section>
          )}
          {resume?.links?.length > 0 && (
            <section>
              <h3>Links profissionais</h3>
              <ul className="talent-resume-list">
                {resume.links
                  .filter((link) => /^https?:\/\//i.test(link))
                  .map((link) => (
                    <li key={link}>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        {link} ↗
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
