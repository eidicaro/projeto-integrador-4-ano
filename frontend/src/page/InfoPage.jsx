import { Link } from "react-router-dom";

const CONTENT = {
  empresas: {
    eyebrow: "Para empresas",
    title: "Encontre pessoas que combinam com o seu time.",
    introduction:
      "A Point Talentos organiza vagas e processos seletivos em um só lugar, com acesso separado para recrutadores e candidatos.",
    sections: [
      ["Publicação completa", "Cadastre requisitos, responsabilidades, benefícios, modalidade, faixa salarial e prazo da oportunidade."],
      ["Pipeline organizado", "Acompanhe candidatos entre triagem, entrevista, oferta e conclusão, mantendo um histórico de cada mudança."],
      ["Dados protegidos", "Cada recrutador acessa apenas as vagas e candidaturas sob sua responsabilidade."],
    ],
    action: ["Acesso do recrutador", "/admin/login"],
  },
  sobre: {
    eyebrow: "Sobre a plataforma",
    title: "Talento e oportunidade, no mesmo ponto.",
    introduction:
      "Este banco de talentos foi criado para tornar a descoberta de oportunidades mais clara para candidatos e a gestão mais simples para recrutadores.",
    sections: [
      ["Experiência direta", "Busca de vagas, currículo, candidatura e acompanhamento foram desenhados como uma jornada contínua."],
      ["Informação confiável", "Os dados exibidos vêm da API e do banco de dados, com validação e permissões por perfil."],
      ["Evolução responsável", "A plataforma prioriza acessibilidade, segurança e decisões transparentes em cada nova funcionalidade."],
    ],
    action: ["Explorar oportunidades", "/#vagas"],
  },
  contato: {
    eyebrow: "Fale com a Point",
    title: "Como podemos ajudar?",
    introduction:
      "Para dúvidas sobre uma candidatura, acesso de recrutador, privacidade ou suporte técnico, fale com a equipe responsável.",
    sections: [
      ["Candidatos", "Use o e-mail da sua conta e, se possível, informe a vaga relacionada para agilizar o atendimento."],
      ["Empresas", "Conte brevemente sobre a organização e a necessidade de recrutamento."],
      ["Privacidade", "Solicitações sobre dados pessoais devem identificar o titular e o tipo de solicitação."],
    ],
    action: ["Enviar e-mail", "mailto:talentos@pointmedia.com.br"],
  },
  privacidade: {
    eyebrow: "Privacidade",
    title: "Seus dados merecem contexto e cuidado.",
    introduction:
      "Esta página resume como os dados do banco de talentos são usados. A versão jurídica definitiva deve ser revisada pela organização responsável antes da publicação comercial.",
    sections: [
      ["Dados tratados", "Dados de conta, currículo, candidaturas e registros necessários para segurança e funcionamento da plataforma."],
      ["Finalidades", "Autenticar usuários, apresentar oportunidades, viabilizar candidaturas e permitir que recrutadores responsáveis conduzam processos seletivos."],
      ["Acesso e retenção", "Recrutadores acessam currículos somente após candidatura em vagas próprias. Prazos de retenção e solicitações do titular devem seguir a política oficial da organização."],
      ["Segurança", "Senhas são armazenadas com hash; sessões usam proteção CSRF; acessos são limitados por função e propriedade dos registros."],
    ],
    action: ["Falar sobre meus dados", "/contato"],
  },
  termos: {
    eyebrow: "Termos de uso",
    title: "Regras claras para uma boa experiência.",
    introduction:
      "Ao criar uma conta, o usuário concorda em fornecer informações verdadeiras e usar a plataforma apenas para finalidades legítimas de recrutamento e candidatura.",
    sections: [
      ["Conta e acesso", "Cada pessoa é responsável por proteger suas credenciais. Contas não devem ser compartilhadas ou usadas para acessar dados de terceiros."],
      ["Conteúdo", "Informações de currículo e vaga devem ser corretas, pertinentes e não podem violar direitos de terceiros."],
      ["Processos seletivos", "A plataforma facilita o contato e a organização do processo; decisões de contratação pertencem às organizações responsáveis."],
      ["Uso indevido", "Tentativas de fraude, automação abusiva, exploração de falhas ou coleta indevida de dados podem resultar em bloqueio de acesso."],
    ],
    action: ["Criar conta", "/cadastro"],
  },
  notFound: {
    eyebrow: "Erro 404",
    title: "Essa página saiu do mapa.",
    introduction:
      "O endereço pode ter mudado ou não existir. Volte ao início para continuar navegando.",
    sections: [],
    action: ["Voltar ao início", "/"],
  },
};

const infoStyles = `
  .info-page {
    min-height: 100vh;
    padding: 24px;
    color: #151722;
    background: radial-gradient(circle at 12% 14%, rgba(255,79,139,.18), transparent 30rem), #f8f8fb;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }
  .info-nav { width: min(1040px, 100%); margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
  .info-brand { color: #151722; font-size: 27px; font-weight: 950; letter-spacing: -.08em; text-decoration: none; }
  .info-brand span { color: #ff4f8b; }
  .info-nav-links { display: flex; gap: 18px; }
  .info-nav-links a { color: #555867; font-size: 14px; font-weight: 750; text-decoration: none; }
  .info-content { width: min(900px, 100%); margin: 0 auto; padding: clamp(70px, 12vw, 140px) 0 80px; }
  .info-eyebrow { color: #ff4f8b; font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
  .info-content h1 { max-width: 850px; margin: 14px 0 22px; font-size: clamp(42px, 8vw, 82px); line-height: .94; letter-spacing: -.06em; }
  .info-introduction { max-width: 720px; margin: 0; color: #626574; font-size: clamp(17px, 2.2vw, 21px); line-height: 1.65; }
  .info-sections { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 48px 0; }
  .info-section { padding: 26px; border: 1px solid rgba(21,23,34,.1); border-radius: 22px; background: rgba(255,255,255,.86); }
  .info-section h2 { margin: 0 0 10px; font-size: 20px; }
  .info-section p { margin: 0; color: #626574; line-height: 1.65; }
  .info-action { display: inline-flex; min-height: 52px; align-items: center; padding: 0 23px; border-radius: 999px; color: #fff; background: #151722; font-weight: 850; text-decoration: none; }
  .info-action:hover { background: #ff4f8b; }
  @media (max-width: 650px) {
    .info-page { padding: 20px 16px; }
    .info-nav-links a:first-child { display: none; }
    .info-sections { grid-template-columns: 1fr; }
  }
`;

export default function InfoPage({ type }) {
  const content = CONTENT[type] || CONTENT.notFound;
  const [actionLabel, actionTarget] = content.action;
  const isExternal = actionTarget.startsWith("mailto:");

  return (
    <main className="info-page">
      <style>{infoStyles}</style>
      <nav className="info-nav" aria-label="Navegação institucional">
        <Link className="info-brand" to="/">p<span>o</span>int</Link>
        <div className="info-nav-links">
          <Link to="/#vagas">Vagas</Link>
          <Link to="/empresas">Empresas</Link>
          <Link to="/login">Entrar</Link>
        </div>
      </nav>

      <article className="info-content">
        <span className="info-eyebrow">{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p className="info-introduction">{content.introduction}</p>

        {content.sections.length > 0 && (
          <div className="info-sections">
            {content.sections.map(([title, description]) => (
              <section className="info-section" key={title}>
                <h2>{title}</h2>
                <p>{description}</p>
              </section>
            ))}
          </div>
        )}

        {isExternal ? (
          <a className="info-action" href={actionTarget}>{actionLabel}</a>
        ) : (
          <Link className="info-action" to={actionTarget}>{actionLabel}</Link>
        )}
      </article>
    </main>
  );
}
