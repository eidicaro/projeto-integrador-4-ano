# Banco de Talentos — informações para implementação do backend

> **Atualização — 06/10/2026:** o backend deste guia foi implementado. Os seis endpoints, persistência, consentimento, policy, consultas e indicações oficiais estão em [docs/API.md](docs/API.md). As referências abaixo a APIs propostas ou a criar são a especificação histórica; não descrevem mais a disponibilidade do servidor. A integração frontend da seção 10 também foi concluída: as telas usam a API real, com consentimento oficial e sem avisos de demonstração. Veja o [diagnóstico](docs/DIAGNOSTICO.md).

Este documento descreve o frontend implementado, as limitações atuais e uma proposta de contratos para integrar o Banco de Talentos ao Laravel. Serve como referência para o responsável pelo backend.

**Situação na entrega anterior do frontend:** as telas estão implementadas, mas a participação oficial ainda não existe no servidor. A adesão é uma demonstração local; a lista administrativa usa pessoas fictícias; a indicação para vaga é uma simulação. Os avisos estão visíveis na interface.

**Na implementação anterior do frontend, nenhum arquivo de backend, migration, tabela ou endpoint foi alterado.** Os endpoints novos descritos abaixo são propostas para desenvolvimento, não APIs já disponíveis nem chamadas que o frontend esteja fazendo.

## 1. O que foi implementado no frontend

### Home e navegação

- Banco de Talentos como quinto item da navegação principal da Home.
- Acesso pelo menu mobile, pela navegação inferior mobile e pela busca rápida.
- Acesso na navegação do candidato, nas sidebars do Admin e nos acessos mobile do Admin.
- Atalho no dashboard administrativo.
- Ajustes de espaço para evitar sobreposição do menu em notebook.
- Navegação horizontal que mantém o item ativo visível em telas pequenas.
- Carregamento das páginas por `React.lazy`, seguindo a aplicação existente.

### Candidato — `/banco-de-talentos`

- Apresentação pública do propósito do banco, benefícios e funcionamento.
- Acesso ao login para visitantes; reutilização da sessão para candidatos autenticados.
- Reutilização de nome, e-mail e telefone da conta e dos dados do currículo existente.
- Exibição de localização, área de atuação, habilidades, atualização do currículo e completude do perfil.
- Seleção de áreas de interesse por chips com checkboxes acessíveis.
- Sugestões derivadas dos departamentos das vagas, da área do currículo e dos interesses já registrados.
- Campo para acrescentar outra área, sem uma lista fixa obrigatória de categorias.
- Validação: de uma a oito áreas, cada uma com dois a 120 caracteres.
- Estado de participante com data de entrada, última atualização e interesses.
- Atualização de interesses, cancelamento da edição e saída com confirmação.
- Links para editar o contato e atualizar/criar o currículo nas páginas já existentes.
- Tratamento de carregamento, sucesso, falha de perfil/vagas e armazenamento local indisponível ou inválido.

Hoje, **não é obrigatório ter currículo para experimentar a adesão**. A página permite registrar interesses e orienta a criação do currículo. Não adicionar essa exigência no backend sem alinhar também a interface.

### Recrutador — `/admin/banco-de-talentos`

- Rota protegida para o papel `recrutador`.
- Interface própria do Admin, separada visualmente da experiência do candidato.
- Lista de perfis com nome, iniciais, localização, áreas, habilidades e data de entrada.
- Busca com debounce por nome, habilidade/tecnologia, área, localização e cargos das experiências.
- Filtros por área, localização e período de entrada: sete, 30 ou 90 dias.
- Ordenação por mais recentes, mais antigos, nome ou completude do perfil.
- Contador de resultados, limpeza de filtros, estado vazio e estrutura de paginação.
- Indicadores de total, entradas nos últimos 30 dias e quantidade de áreas representadas.
- Drawer com contato, apresentação, habilidades, experiências, formação, cursos, idiomas e links, quando disponíveis.
- Filtros em diálogo no mobile.
- Seleção de vagas publicadas do recrutador para simular uma indicação.

Não foram inventados dados de senioridade, disponibilidade ou modalidade de trabalho do candidato. Esses campos não fazem parte do cadastro de interesses implementado.

### Acessibilidade e validação realizada

Foram reutilizados Lucide, Framer Motion, autenticação, utilitários de paginação e gerenciamento de foco existentes. Os diálogos bloqueiam o fundo com `inert`, permitem Escape e restauram o foco. Animações respeitam movimento reduzido.

Na entrega anterior passaram:

- `npm run lint`;
- `npm test`: sete testes de domínio;
- `npm run build`;
- nove grupos de cenários em Chromium com respostas controladas das APIs existentes;
- verificações de layout entre 320 e 1920 px;
- auditorias axe sem violações nas telas e diálogos avaliados.

O projeto usa JavaScript e não possui script de TypeScript/typecheck. Os testes de navegador não comprovam integração com um backend real do banco, pois essa API ainda não existe.

## 2. Arquivos que o responsável pela integração deve conhecer

Todos os caminhos abaixo são relativos à raiz do repositório.

| Arquivo | Responsabilidade |
| --- | --- |
| `frontend/src/page/TalentPool.jsx` | Apresentação pública, participação do candidato e ações de salvar/sair. |
| `frontend/src/page/Admin/AdminTalentPool.jsx` | Consulta administrativa, filtros, indicadores, seleção de perfil e feedback da indicação. |
| `frontend/src/features/talent-pool/demoRepository.js` | Persistência local de interesses por conta; fronteira a substituir por serviço de API. |
| `frontend/src/features/talent-pool/demoTalents.js` | Perfis administrativos fictícios, isolados do restante da aplicação. |
| `frontend/src/features/talent-pool/talentPool.js` | Contratos JSDoc, normalização, validação, busca, filtros, datas e cálculo de completude. |
| `frontend/src/features/talent-pool/useTalentProfile.js` | Carregamento de currículo, vagas e participação local. |
| `frontend/src/features/talent-pool/TalentInterestForm.jsx` | Seleção de áreas e validação do formulário. |
| `frontend/src/features/talent-pool/TalentProfileSummary.jsx` | Exibição de dados e seções do currículo. |
| `frontend/src/features/talent-pool/TalentReferral.jsx` | Consulta de vagas reais e experiência de indicação, ainda simulada. |
| `frontend/src/features/talent-pool/TalentDialog.jsx` | Diálogos e drawer acessíveis. |
| `frontend/src/features/talent-pool/AdminTalentLayout.jsx` | Estrutura visual da nova área administrativa. |
| `frontend/src/lib/api.js` | Cliente Axios, sessão Sanctum, CSRF e tratamento de sessão expirada. |
| `frontend/src/lib/pagination.js` | Leitura da paginação Laravel. |
| `frontend/tests/talent-pool.test.mjs` | Testes do domínio da funcionalidade. |

Também foram alterados `App.jsx`, `Home.jsx`, `CandidateHeader.jsx`, `AdminHome.jsx`, `AdminCreate.jsx`, `AdminSee.jsx` e estilos relacionados. Foram criados `AdminTalentLink.jsx` e `useActiveNavScroll.js` para navegação compartilhada.

Referência complementar: [README da funcionalidade](frontend/src/features/talent-pool/README.md).

## 3. O que é real e o que está demonstrativo

| Operação | Situação atual |
| --- | --- |
| Autenticação e consulta da conta | Integração existente, por `/api/me`. |
| Consulta do currículo do candidato | Integração existente, por `/api/curriculos/me`. |
| Consulta de vagas e sugestões de áreas | Integração existente, por `/api/vagas`. |
| Consulta de vagas para indicação | Integração existente, por `/api/admin/vagas`. |
| Entrar, atualizar interesses e sair do banco | Somente `localStorage`, sem escrita no servidor. |
| Consultar participantes reais no Admin | Ainda indisponível; a lista contém apenas fixtures fictícias. |
| Indicar candidato para uma vaga | Simulação em memória, sem criação de candidatura. |

A chave local é `point:talent-pool:demo:v1:<userId>`. Ela contém apenas ID da conta, interesses e datas. Não contém currículo, foto ou dados de contato.

A participação local não aparece no Admin, não sincroniza entre dispositivos e não representa uma inscrição oficial. A indicação simulada desaparece ao recarregar a página.

**Não importar automaticamente preferências locais para o servidor.** O texto aceito hoje explica uma demonstração local. Na integração oficial, atualizar esse texto e solicitar uma confirmação explícita de adesão antes de enviar os interesses.

## 4. O que o backend já oferece e deve ser reutilizado

Consultar como referência:

- `backend/routes/api.php`;
- `backend/app/Models/User.php`, `Curriculo.php`, `Vaga.php` e `Candidatura.php`;
- `backend/app/Http/Resources/UserResource.php`, `CurriculoResource.php` e `CandidaturaResource.php`;
- `backend/app/Http/Controllers/CurriculoController.php` e `CandidaturaController.php`;
- `backend/app/Policies/CurriculoPolicy.php` e `VagaPolicy.php`;
- `backend/app/Enums/CandidaturaStatus.php`;
- `backend/database/migrations/2026_08_14_000000_complete_talent_pool_schema.php`.

Apesar do nome dessa última migration, ela não implementa a adesão ao novo módulo. Ela amplia usuários, currículos, vagas e candidaturas.

O currículo já possui nome, área, contato, localização, resumo, links e relações de habilidades, experiências, formação, cursos e idiomas. **Não duplicar esses dados em um segundo cadastro de perfil.** O banco deve representar a participação e os interesses, vinculados ao usuário existente.

### Atenção ao cadastro manual de candidaturas

Existe `POST /api/admin/vagas/{vaga}/candidaturas/manual`, mas ele cria um contato manual sem preencher `user_id`, `curriculo_id` e snapshot do currículo.

Ele não resolve a indicação de um participante real: o vínculo com a conta é necessário para que o candidato consiga acompanhar o processo. Não enviar os perfis fictícios para esse endpoint e não transformar o fluxo manual existente em outro comportamento sem preservar sua compatibilidade.

### Atenção às permissões de currículo

Hoje, `CurriculoPolicy::view` permite ao recrutador consultar o currículo quando já existe uma candidatura em uma vaga criada por ele. A listagem `/api/curriculos` também restringe os currículos por candidaturas em suas vagas.

Um participante do banco pode nunca ter se candidatado. Portanto, esses mecanismos sozinhos não permitem o novo fluxo. Implementar autorização específica para o Banco de Talentos e revisar a consulta de currículo/foto quando necessária, preservando os acessos existentes.

## 5. Persistência a implementar — proposta

Criar uma entidade de participação, por exemplo `TalentPoolMembership`, e uma migration nova para uma tabela como `talent_pool_memberships`. Os nomes são sugestões; adaptar ao padrão escolhido pela equipe.

| Campo sugerido | Finalidade |
| --- | --- |
| `id` | Identificador da participação, usado nas rotas administrativas. |
| `user_id` | FK para o candidato existente; vínculo único por usuário. |
| `interests` | Array JSON de áreas, suficiente para a primeira versão. |
| `active` | Participação ativa/inativa. |
| `joined_at` | Entrada na participação atual. |
| `interests_updated_at` | Última alteração dos interesses. |
| `left_at` | Data de saída, quando houver. |
| `consent_accepted_at` | Registro da confirmação da adesão oficial. |
| `consent_version` | Versão do texto de adesão apresentado, se versionado pelo produto. |
| `created_at`, `updated_at` | Timestamps usuais do Laravel. |

Regras recomendadas para esse modelo:

1. Uma única participação por usuário; a adesão deve ser idempotente.
2. Atualizar interesses não altera `joined_at` nem deve reativar uma participação sem confirmação.
3. Sair desativa a participação e a remove das consultas do banco. Não exclui a conta, o currículo ou candidaturas existentes.
4. Sair novamente é uma operação idempotente.
5. Uma nova adesão após a saída reativa o registro, substitui os interesses e inicia uma nova data `joined_at`. Preservar histórico de ciclos em estrutura própria se necessário; não confundir a data do ciclo atual com a primeira adesão histórica.
6. As datas oficiais são geradas pelo servidor, não recebidas do navegador.
7. O perfil consultado no banco acompanha os dados atuais da conta/currículo. O snapshot de uma candidatura, quando criada, segue a regra já existente de preservação do currículo daquele momento.

Validar interesses também no servidor: array com uma a oito strings, trim, dois a 120 caracteres por área, sem valores vazios e sem duplicatas por variações de maiúsculas/acentos. O frontend admite áreas livres; não exigir IDs de categorias nesta primeira integração sem mudar o formulário e seu contrato.

## 6. API proposta para o candidato

**Estes endpoints ainda precisam ser criados.** Reutilizar `auth:sanctum`, `active`, `role:candidato`, CSRF para escritas e o padrão de resposta Laravel existente.

| Método | Rota proposta | Comportamento |
| --- | --- | --- |
| GET | `/api/banco-de-talentos/me` | Retorna a participação ativa do usuário autenticado; `data: null` se não participa. |
| PUT | `/api/banco-de-talentos/me` | Adere ou atualiza interesses; reativação exige confirmação de adesão. |
| DELETE | `/api/banco-de-talentos/me` | Desativa a participação, de forma idempotente; resposta `204`. |

Exemplo de envio para adesão ou reentrada:

```json
{
  "interests": ["Tecnologia", "Produto"],
  "consentAccepted": true,
  "consentVersion": "v1"
}
```

Para atualizar interesses de uma participação ativa, enviar `interests`; preservar o registro de adesão já aceito. A versão válida do texto deve ser conhecida e validada pelo servidor.

Exemplo de resposta de participação ativa:

```json
{
  "data": {
    "id": 42,
    "userId": 7,
    "interests": ["Tecnologia", "Produto"],
    "joinedAt": "2026-10-02T12:00:00Z",
    "updatedAt": "2026-10-02T12:00:00Z"
  }
}
```

Nesse contrato, `updatedAt` representa a atualização dos interesses, não a última edição do currículo. Manter a atualização do currículo em `resume.updatedAt`.

Não aceitar `userId` do cliente para escolher o proprietário. Derivar o candidato da sessão. O adapter do frontend deve normalizar o ID numérico para string onde o contrato local atual exigir string.

## 7. API proposta para o Admin

Proteger com `auth:sanctum`, `active`, `role:recrutador` e uma policy do banco.

| Método | Rota proposta | Comportamento |
| --- | --- | --- |
| GET | `/api/admin/banco-de-talentos` | Lista paginada de participantes ativos autorizados. |
| GET | `/api/admin/banco-de-talentos/{talent}` | Detalhe do participante com perfil/currículo e relações autorizadas. |
| POST | `/api/admin/banco-de-talentos/{talent}/indicacoes` | Indica o participante para uma vaga do recrutador. |

`{talent}` deve identificar o registro de participação, não um ID arbitrário de currículo ou usuário.

### Busca, filtros e ordenação

Proposta de parâmetros para a listagem:

| Parâmetro | Exemplo | Regra |
| --- | --- | --- |
| `q` | `react sao paulo` | Busca em nome, localização, áreas, habilidades e cargos das experiências; ignorar caixa e acentos. |
| `area` | `Tecnologia` | Área de interesse registrada no banco. |
| `location` | `Sorocaba, SP` | Localização existente no currículo. |
| `period` | `30` | Entradas nos últimos sete, 30 ou 90 dias, calculadas no servidor. |
| `sort` | `recent` | Valores aceitos: `recent`, `oldest`, `name`, `complete`. |
| `page` | `1` | Página, a partir de um. |
| `per_page` | `12` | Tamanho validado e limitado; a interface atual usa 12 itens por página. |

Na busca atual, todos os termos digitados precisam aparecer no conjunto de campos pesquisáveis, mesmo que estejam em campos diferentes. Preservar essa semântica ou alinhar a mudança com o frontend.

Executar filtros e ordenação antes de paginar. Usar ordenação secundária estável, como ID, para evitar repetição/perda de itens entre páginas. Validar o enum de ordenação e os parâmetros; não interpolar entradas diretamente em SQL.

Para `complete`, reproduzir o cálculo atual: oito verificações de nome, e-mail, telefone, localização, área, resumo, ao menos uma habilidade e ao menos uma experiência ou formação. Cada verificação preenchida pesa igualmente, com arredondamento do percentual. Nome/e-mail/telefone usam o currículo com fallback para a conta. Completude não deve bloquear a adesão nem representar avaliação de qualidade profissional.

### Dados da resposta

Usar `data`, `meta` e `links` no padrão da paginação Laravel. Cada item deve fornecer pelo menos:

- `id`: ID da participação;
- `userId`;
- `name`, `email`, `phone`, `location` com os fallbacks de conta/currículo;
- `interests`: array de strings;
- `skills`: array de nomes de habilidades;
- `joinedAt`, `updatedAt`;
- `profileCompleteness`, se usado para ordenar/exibir no servidor.

A lista pode ser enxuta. O endpoint de detalhe deve acrescentar `resume`, usando o formato já exposto por `CurriculoResource`, com habilidades, experiências, formação, cursos, idiomas e links. `resume` pode ser `null`; nesse caso, o frontend deverá mostrar os dados disponíveis da conta em vez de um perfil vazio.

As opções de filtros e indicadores devem considerar **toda a coleção autorizada**, não apenas a página carregada. Uma proposta é acrescentar ao envelope da listagem:

```json
{
  "summary": {
    "total": 120,
    "newLast30Days": 18,
    "areas": 4
  },
  "facets": {
    "areas": ["Design", "Marketing", "Produto", "Tecnologia"],
    "locations": ["Sorocaba, SP", "São Paulo, SP"]
  }
}
```

Esses números e localidades são exemplos de contrato. `meta.total` representa os resultados depois dos filtros; `summary` representa os indicadores gerais do banco autorizado, sem os filtros da busca. `facets` fornece as opções gerais disponíveis. Não calcular os indicadores usando somente os 12 registros da página.

### Escopo de acesso a definir no servidor

O código atual vincula vagas ao recrutador por `created_by`; isso não define quem pode consultar um talento antes de haver candidatura.

Para a aplicação atual de uma única empresa, uma regra possível é permitir que recrutadores ativos consultem os participantes ativos dessa empresa. Implementar essa regra explicitamente na policy do banco. Se houver várias empresas/organizações, será necessário um vínculo de participação com a empresa e restrição por organização; não inferir esse vínculo do usuário que abriu a tela.

Quem saiu do banco não deve aparecer em listagem, detalhes novos ou novas indicações. Isso não elimina o acesso legitimamente existente a candidaturas anteriores, que continua sujeito às policies dos processos seletivos.

## 8. Indicação real para vaga — proposta de comportamento

A proposta abaixo cria uma entrada real no processo seletivo, identificada como **indicação da equipe**, e não como candidatura enviada voluntariamente pelo candidato. A equipe deve adotar essa semântica também nos textos da área do candidato. Se o produto desejar somente uma sugestão interna sem entrar no processo, precisará de uma entidade de indicação separada; não usar uma candidatura para fingir esse comportamento.

Requisição proposta:

```json
{
  "vaga_id": 15
}
```

No servidor:

1. Confirmar que a participação está ativa e que o candidato está ativo.
2. Autorizar a consulta do participante pelo recrutador.
3. Autorizar a vaga usando a regra equivalente a `VagaPolicy::viewCandidates`, incluindo `created_by`.
4. Confirmar que a vaga aceita candidaturas, usando a regra existente `isOpenForApplications()`. Não confiar só no filtro visual de vagas publicadas.
5. Obter o usuário e o currículo do participante. Nunca usar o ID do recrutador autenticado como `user_id` da candidatura.
6. Para este fluxo com currículo online, exigir currículo existente; retornar erro compreensível se faltar, sem bloquear a adesão ao banco.
7. Verificar duplicidade por usuário/vaga e vaga/e-mail, inclusive registros com soft delete que ainda ocupam os índices únicos.
8. Criar a candidatura em transação, preservando `user_id`, `vaga_id`, `curriculo_id`, snapshot, contato e habilidades com a lógica já existente.
9. Usar estágio inicial `novo`, registrar origem distinta, por exemplo `banco_de_talentos`, e identificar o recrutador em `atualizada_por` e no histórico de movimentações.
10. Revalidar a participação no contexto da transação para tratar concorrência com a saída do banco.
11. Retornar `201` com a candidatura no formato de `CandidaturaResource`.

Para duplicidade, retornar `409` sem criar outra candidatura nem reativar silenciosamente um processo encerrado/retirado. Tratar também a exceção do índice único para requisições concorrentes.

A indicação deve aparecer no gerenciamento da vaga e em `/api/minhas-candidaturas` por preservar `user_id`. O candidato deve poder consultar o processo e exercer as ações já permitidas pelo estágio, como retirada. O frontend precisará diferenciar a origem nos textos; a copy atual de candidatura enviada não descreve uma indicação feita pelo recrutador.

Envio automático de e-mail, convite ou notificações não foi implementado nem é necessário para substituir a simulação inicial. Só adicionar esses canais se fizerem parte do escopo combinado pela equipe.

## 9. Respostas de erro e permissões

Seguir o envelope de validação existente do Laravel, com `message` e `errors` por campo. A interface deve receber mensagens compreensíveis, sem SQL, stack trace ou detalhes internos.

| Status | Uso esperado |
| --- | --- |
| `401` | Sessão ausente/expirada. |
| `403` | Papel incorreto ou ação fora das permissões. |
| `404` | Participante/vaga inexistente ou recurso indisponível conforme a policy. |
| `409` | Candidatura duplicada ou vaga que não aceita candidaturas. |
| `422` | Interesses inválidos, adesão sem confirmação ou falta de currículo para indicação. |

Exemplo de validação:

```json
{
  "message": "Selecione pelo menos uma área de interesse.",
  "errors": {
    "interests": ["Selecione pelo menos uma área de interesse."]
  }
}
```

Manter candidato restrito à sua própria participação. Recrutador não deve alterar interesses, editar currículo ou aderir em nome de outra conta pelos endpoints do candidato. Photos e detalhes de currículo precisam obedecer à autorização correspondente, mesmo que suas URLs sejam conhecidas.

## 10. Alterações necessárias no frontend depois da API

**Implementar o backend não ativa automaticamente essas telas.** Será necessário substituir os adapters e ajustar os fluxos assíncronos.

1. Criar o serviço de API do banco usando `frontend/src/lib/api.js` e os endpoints efetivamente acordados.
2. Substituir `getDemoRepository()` e a leitura local em `useTalentProfile.js` pela consulta oficial de participação.
3. Fazer salvar/sair aguardarem a resposta do servidor antes de atualizar status, datas e feedback. Hoje o repository local é síncrono; trocar apenas o nome das funções não basta.
4. Substituir `getDemoTalents()` pela listagem paginada do Admin, com busca, filtros e ordenação enviados à API. Não filtrar somente a página recebida como se fosse a coleção inteira.
5. Buscar detalhes ao abrir o drawer, com loading, tratamento de erro e cancelamento de requisição.
6. Carregar indicadores e opções de filtros do escopo completo do servidor.
7. Substituir a simulação de `TalentReferral.jsx` por chamada ao endpoint de indicação. Só exibir sucesso depois da confirmação da API e tratar `409`/`422`.
8. Atualizar contratos e normalização: o tipo atual de talento marca `source: 'demo'`. Distinguir dados reais no adapter; a origem da candidatura é um campo separado.
9. Atualizar a copy e a confirmação de adesão oficial; remover avisos de demonstração somente nos fluxos conectados.
10. Remover o uso dos fixtures e de `localStorage` no fluxo oficial. Dados fictícios podem permanecer apenas em testes/demonstrações explicitamente separadas.
11. Ajustar a área de candidaturas para identificar indicações da equipe, preservando os fluxos existentes.
12. Reexecutar lint, testes, build e validação visual/acessível, agora incluindo integração com a API real.

## 11. Checklist de entrega do backend e integração

- [ ] Migration nova e model de participação com vínculo ao usuário existente.
- [ ] Validação de interesses e confirmação de adesão.
- [ ] Consulta da própria participação, adesão/atualização e saída idempotentes.
- [ ] Adesão sem vaga específica e sem duplicação de perfil/currículo.
- [ ] Listagem administrativa autorizada e paginada.
- [ ] Busca, filtros, ordenação, indicadores e opções de filtros corretos no conjunto completo.
- [ ] Detalhes do perfil autorizados, inclusive quando não existe candidatura anterior.
- [ ] Permissões de foto/currículo compatíveis com a participação e com os fluxos antigos.
- [ ] Indicação preservando conta, currículo, snapshot, origem e histórico.
- [ ] Tratamento de vagas fechadas, currículo ausente, duplicidade e concorrência.
- [ ] Saída impede novas consultas/indicações do banco, sem apagar candidaturas existentes.
- [ ] Testes de acesso por papel, propriedade e escopo de empresa/recrutador.
- [ ] Testes de cadastro, atualização, saída, reentrada e datas.
- [ ] Testes de paginação, busca, filtros, ordenação e indicadores.
- [ ] Testes de indicação válida, duplicada, concorrente, vaga de outro recrutador e participante inativo.
- [ ] Testes de regressão de login, perfil, currículo, candidatura e cadastro manual existentes.
- [ ] Documentação dos endpoints efetivamente implementados em `docs/API.md`.
- [ ] Frontend conectado e avisos demonstrativos removidos apenas após validação real.

Ordem prática sugerida: persistência e endpoints do candidato; policy e consulta administrativa; indicação e histórico; testes do backend; integração dos adapters no frontend; validação completa do produto.
