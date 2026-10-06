# Banco de Talentos

Rotas oficiais: /banco-de-talentos (apresentação pública e participação do candidato) e /admin/banco-de-talentos (recrutador).

## Integração com a API

Os fluxos usam o cliente Axios compartilhado, sessão Sanctum e CSRF existentes:

- apiRepository.js define os contratos de leitura, adesão/atualização, saída, consulta administrativa, detalhe e indicação. talentPoolApi.js conecta o adapter ao cliente da aplicação.
- useTalentProfile.js consulta participação oficial, currículo e vagas em paralelo, com cancelamento de leituras e tratamento independente de falhas. Uma falha de participação impede nova adesão até consulta bem-sucedida.
- TalentInterestForm exige confirmação explícita na adesão/reentrada, informando compartilhamento de perfil e indicação pela equipe. Interesses ativos podem ser atualizados sem renovar o aceite. Datas e IDs vêm do servidor.
- AdminTalentPool envia busca, filtros, ordenação e paginação à API. Não filtra só a página recebida. Indicadores e opções vêm de summary/facets; detalhes são consultados ao abrir o drawer, com cancelamento e nova tentativa.
- TalentReferral lista apenas vagas publicadas e abertas do recrutador. POST oficial cria o processo; sucesso aparece somente após resposta. Falhas de duplicidade, currículo e vaga são exibidas sem simular conclusão.
- MyApplications identifica a origem banco_de_talentos como indicação da equipe, preservando a retirada e demais etapas.

Dados demonstrativos anteriores não são importados do localStorage. demoRepository.js e demoTalents.js permanecem somente para testes históricos do domínio e não são importados pelas telas/adapters oficiais.

Contratos: [docs/API.md](../../../../docs/API.md).

## Validação em 06/10/2026

- ESLint, 11 testes Node (sete de domínio e quatro do adapter oficial) e build aprovados.
- Ensaio em Chrome headless com frontend Vite e Laravel real em banco SQLite isolado: adesão confirmada, persistência após reload, atualização, saída/reentrada, 14 participantes com paginação 12+2, busca de múltiplos termos sem acentos, indicadores gerais, detalhe, indicação real, duplicidade 409, origem visível ao candidato, remoção do Admin após saída e retry de falha na leitura da participação.
- Sem erros de runtime no ensaio; telas conferidas em 375 px.
- Ferramentas, banco e contas do ensaio foram criados em pasta ignorada pelo Git, sem escrever no MySQL do usuário.
- Não foi refeita auditoria axe nem teste completo de concorrência/MySQL 8.4.

Comandos: npm run lint, npm test, npm run build. Em PowerShell com npm.ps1 bloqueado, usar npm.cmd. O projeto usa JavaScript e não tem typecheck.
