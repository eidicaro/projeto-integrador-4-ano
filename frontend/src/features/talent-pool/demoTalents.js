/** Fictional UI fixtures matching the departments and roles in VagaFactory.
 * Never use these to create real applications. */
export function getDemoTalents(now = Date.now()) {
  const entries = [
    [
      "demo-1",
      "Marina Alves",
      "São Paulo, SP",
      "Tecnologia",
      ["React", "JavaScript", "Acessibilidade"],
      "Desenvolvedora frontend",
      2,
    ],
    [
      "demo-2",
      "Lucas Ferreira",
      "Sorocaba, SP",
      "Tecnologia",
      ["Python", "SQL", "Power BI"],
      "Analista de dados",
      8,
    ],
    [
      "demo-3",
      "Camila Santos",
      "Votorantim, SP",
      "Design",
      ["Figma", "Pesquisa", "Prototipação"],
      "Designer de produto",
      18,
    ],
    [
      "demo-4",
      "Rafael Oliveira",
      "Sorocaba, SP",
      "Produto",
      ["Cypress", "Testes", "Qualidade"],
      "QA Engineer",
      36,
    ],
    [
      "demo-5",
      "Beatriz Costa",
      "São Paulo, SP",
      "Marketing",
      ["Conteúdo", "Comunicação", "Redes sociais"],
      "Social Media",
      45,
    ],
    [
      "demo-6",
      "Pedro Lima",
      "Itu, SP",
      "Tecnologia",
      ["Java", "Spring", "MySQL"],
      "Desenvolvedor backend",
      65,
    ],
  ];
  return entries.map(
    ([id, name, location, area, skills, role, days], index) => {
      const joinedAt = new Date(now - days * 86400000).toISOString();
      return {
        id,
        name,
        email: `talento${index + 1}@example.invalid`,
        phone: "",
        location,
        interests: [area],
        skills,
        joinedAt,
        updatedAt: joinedAt,
        source: "demo",
        resume: {
          nome_completo: name,
          email: `talento${index + 1}@example.invalid`,
          cidade_estado: location,
          area_atuacao: area,
          resumo: `Perfil fictício para demonstrar a avaliação de profissionais de ${area.toLocaleLowerCase("pt-BR")}.`,
          habilidades: skills.map((nome) => ({ nome })),
          links: [],
          experiencias: [
            {
              cargo: role,
              empresa: "Empresa de exemplo",
              periodo: "2023–2026",
              descricao:
                "Experiência ilustrativa, sem vínculo com um candidato real.",
            },
          ],
          formacoes:
            index % 2
              ? []
              : [
                  {
                    curso: "Formação na área de atuação",
                    instituicao: "Instituição de exemplo",
                    periodo: "2020–2023",
                  },
                ],
        },
      };
    },
  );
}
