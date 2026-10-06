# API

Base local: `http://localhost:8000/api`. Requisições e respostas usam JSON, exceto upload de foto (`multipart/form-data`). Rotas autenticadas exigem sessão Sanctum ou bearer token válido.

## Público e autenticação

| Método | Caminho | Função |
|---|---|---|
| `POST` | `/register` | Cria candidato; exige `name`, `email`, `telefone`, `password`, `password_confirmation`, `accepted_terms`. |
| `POST` | `/login` | Autentica com `email`, `password` e `remember` opcional. |
| `POST` | `/forgot-password` | Solicita link de recuperação sem revelar se a conta existe. |
| `POST` | `/reset-password` | Redefine com `token`, `email`, senha e confirmação. |
| `GET` | `/vagas` | Lista vagas abertas; filtros `q`, `department`, `work_mode`, `employment_type`, `sort`, `per_page`. |
| `GET` | `/vagas/{id}` | Exibe uma vaga aberta. |

Na SPA, omita `issue_token`: a autenticação usa a sessão Sanctum/CSRF. Clientes não web podem enviar `issue_token: true` e `device_name` (até 100 caracteres); o bearer token será retornado uma única vez em `data.token` e deve seguir no header `Authorization: Bearer <token>`.

## Sessão e perfil

| Método | Caminho | Função |
|---|---|---|
| `GET` | `/me` | Usuário autenticado. |
| `PATCH` | `/me` | Atualiza nome, e-mail e/ou telefone. |
| `POST` | `/logout` | Encerra a sessão/token atual. |
| `POST` | `/logout-all` | Revoga todos os tokens do usuário e encerra a sessão. |

## Currículo

| Método | Caminho | Função |
|---|---|---|
| `GET` | `/curriculos` | Lista o currículo próprio ou currículos enviados a vagas do recrutador autenticado. |
| `GET` | `/curriculos/me` | Currículo do candidato ou `data: null`. |
| `POST` | `/curriculos` | Cria currículo e seções em uma transação. |
| `GET` | `/curriculos/{id}` | Exibe ao dono, ao recrutador com candidatura autorizada ou ao recrutador com participação disponível no Banco de Talentos. |
| `PUT/PATCH` | `/curriculos/{id}` | Sincroniza currículo próprio e seções. |
| `DELETE` | `/curriculos/{id}` | Exclui currículo sem candidaturas vinculadas. |
| `GET` | `/curriculos/{id}/foto` | Entrega a foto privada após validar acesso ao currículo. |
| `POST` | `/curriculos/{id}/foto` | Upload no campo `foto`. |
| `DELETE` | `/curriculos/{id}/foto` | Remove a foto. |

## Candidaturas do candidato

| Método | Caminho | Função |
|---|---|---|
| `POST` | `/vagas/{vaga}/candidaturas` | Envia o currículo próprio para uma vaga aberta. |
| `POST` | `/candidaturas` | Alias que envia a candidatura usando `vaga_id` no corpo. |
| `GET` | `/minhas-candidaturas` | Histórico paginado. |
| `GET` | `/candidaturas/{id}` | Detalhe próprio. |
| `GET` | `/candidaturas/{id}/historico` | Movimentações autorizadas. |
| `PATCH` | `/candidaturas/{id}/retirar` | Retira a candidatura sem apagar o histórico. |

## Vagas salvas

As rotas exigem um candidato autenticado e armazenam somente a relação usuário/vaga no banco.

| Método | Caminho | Função |
|---|---|---|
| `GET` | `/vagas-salvas` | Lista vagas próprias salvas que continuam abertas. |
| `PUT` | `/vagas/{id}/salvar` | Salva de forma idempotente uma vaga aberta. |
| `DELETE` | `/vagas/{id}/salvar` | Remove a vaga dos favoritos de forma idempotente. |

## Administração

Todas as rotas abaixo usam `/admin` e exigem papel `recrutador`. Recursos são limitados ao recrutador proprietário.

| Método | Caminho | Função |
|---|---|---|
| `GET` | `/admin/dashboard` | Totais e candidaturas recentes. |
| `GET/POST` | `/admin/vagas` | Lista ou cria vagas. |
| `PUT/PATCH/DELETE` | `/admin/vagas/{id}` | Atualiza ou remove logicamente. |
| `PATCH` | `/admin/vagas/{id}/status` | Define como rascunho, publica, pausa, arquiva ou encerra. |
| `POST` | `/admin/vagas/{id}/duplicate` | Duplica como pausada. |
| `POST` | `/admin/vagas/bulk` | Ações `arquivar`, `pausar`, `publicar` ou `excluir` para `ids[]`. |
| `GET` | `/admin/candidaturas` | Lista o pipeline do recrutador. |
| `GET` | `/admin/vagas/{id}/candidaturas` | Candidatos da vaga. |
| `POST` | `/admin/vagas/{id}/candidaturas/manual` | Adiciona candidato manual. |
| `GET/PATCH/DELETE` | `/admin/candidaturas/{id}` | Consulta, atualiza etapa/nota/observação ou remove logicamente. |
| `GET` | `/admin/candidaturas/{id}/historico` | Histórico de etapas e autores. |

## Compatibilidade com o protótipo original

Estes aliases autenticados de recrutador continuam registrados temporariamente; integrações novas devem preferir os caminhos `/admin` acima.

| Método | Caminho | Equivalente atual |
|---|---|---|
| `GET` | `/vagas/{id}/candidatos` | `GET /admin/vagas/{id}/candidaturas` |
| `PUT` | `/candidaturas/{id}/status` | `PATCH /admin/candidaturas/{id}` |

## Exemplo: criar vaga

```json
{
  "title": "Desenvolvedor Front-end",
  "company": "Point Media",
  "department": "Tecnologia",
  "location": "São Paulo - SP",
  "employmentType": "CLT",
  "workMode": "Híbrido",
  "seniority": "Júnior",
  "openings": 2,
  "applicationEmail": "talentos@pointmedia.com.br",
  "applicationDeadline": "2026-09-30",
  "salaryMin": 4500,
  "salaryMax": 6500,
  "salaryVisible": true,
  "description": "Descrição detalhada da oportunidade, do contexto do time e dos objetivos esperados para a função no dia a dia.",
  "responsibilities": "Responsabilidades da função.",
  "requirements": "Requisitos detalhados com pelo menos trinta caracteres.",
  "tags": ["React", "JavaScript", "Git"],
  "benefits": ["vale-refeicao", "plano-saude"]
}
```


## Banco de Talentos (implementado em 06/10/2026)

Sanctum, conta ativa e papel obrigatório. Escritas da SPA exigem CSRF. O frontend está integrado aos endpoints oficiais; preferências demonstrativas locais não são importadas.

| Método | Caminho | Papel e comportamento |
|---|---|---|
| GET | /banco-de-talentos/me | Candidato: participação ativa ou data: null. |
| PUT | /banco-de-talentos/me | Candidato: adesão, atualização ou reentrada; 200. |
| DELETE | /banco-de-talentos/me | Candidato: saída idempotente; 204. |
| GET | /admin/banco-de-talentos | Recrutador: participantes autorizados paginados. |
| GET | /admin/banco-de-talentos/{talent} | Recrutador: detalhe e currículo atual. |
| POST | /admin/banco-de-talentos/{talent}/indicacoes | Recrutador: indicação real para sua vaga; 201. |

### Adesão e interesses

Exemplo de PUT:

~~~json
{"interests":["Tecnologia","Produto"],"consentAccepted":true,"consentVersion":"v1"}
~~~

Interesses: lista com 1–8 strings de 2–120 caracteres após trim. Duplicatas por caixa/acentos são rejeitadas. Áreas livres. Proprietário e datas são definidos pelo servidor. Currículo não é obrigatório para aderir.

Primeira adesão e reentrada exigem consentAccepted aceito e consentVersion v1, definida em TalentPoolMembership::CONSENT_VERSION. O frontend apresenta e confirma explicitamente a adesão oficial, compartilhamento do perfil com a equipe e possibilidade de indicação ao processo. O aceite demonstrativo anterior não autoriza migração automática.

Atualização ativa pode enviar somente interests. Preserva joinedAt e consentimento; repetir os mesmos interesses preserva updatedAt. Saída preserva conta, currículo e candidaturas. Reentrada reutiliza ID e reinicia joinedAt e consentimento. Ciclos antigos não são mantidos em tabela histórica nesta versão.

~~~json
{"data":{"id":42,"userId":7,"interests":["Tecnologia"],"joinedAt":"2026-10-06T12:00:00.000000Z","updatedAt":"2026-10-06T12:00:00.000000Z"}}
~~~

updatedAt é a atualização dos interesses; resume.updatedAt continua sendo a atualização do currículo.

### Consulta administrativa

Escopo explícito de empresa única: recrutadores ativos consultam participantes ativos de contas candidatas ativas. Multiempresa exigirá vínculo organizacional e revisão da policy antes de uso.

Parâmetros: q (até 200 caracteres), area (até 120), location (até 255), period (7/30/90), sort (recent/oldest/name/complete), page (>=1), per_page (1–100, padrão 12).

Busca ignora caixa/acentos e exige todos os termos no conjunto de nome, área do currículo, localização, interesses, habilidades e cargos. area e location têm correspondência exata. Datas são calculadas no servidor. Nome é ordenado pela representação normalizada sem acentos. Filtros e ordenação precedem paginação, com desempate por ID; complete também desempata por nome.

Envelope: data, meta, links, summary e facets. summary tem total, newLast30Days e areas, considerando todo o banco autorizado sem filtros. facets tem areas e locations desse escopo. meta.total considera filtros.

Itens: id da participação, userId, name/email/phone (currículo com fallback da conta), location, interests, skills, joinedAt, updatedAt, profileCompleteness e resume. O currículo usa CurriculoResource com as cinco coleções; pode ser null. Completude dá peso igual às oito verificações do guia, incluindo fallback de contato, com arredondamento.

A primeira versão faz eager loading e normaliza/filtra em PHP para consistência entre SQLite e MySQL. O custo de memória cresce com os participantes e suas seções. Para volumes maiores, usar busca indexada e agregações no banco, preservando semântica e indicadores.

### Indicações e currículo

Enviar {"vaga_id":15}. Exige currículo, participação/conta ativas, ownership da vaga e isOpenForApplications(). Cria candidatura vinculada ao participante e currículo, snapshot compartilhado com o fluxo existente, contatos, habilidades, estágio novo, origem banco_de_talentos, recrutador em atualizada_por e movimentação inicial. Aparece em /minhas-candidaturas, com retirada conforme as regras existentes.

Adesão, saída e indicação bloqueiam conta e participação na mesma ordem; indicação revalida esses estados em transação e bloqueia a vaga. Duplicatas por usuário/vaga ou vaga/e-mail, incluindo soft delete, retornam 409. Violações concorrentes dos índices únicos também retornam 409, sem reativação.

GET /curriculos/{id} e /curriculos/{id}/foto permitem leitura ao recrutador enquanto houver participação disponível. Após saída, permanece somente acesso autorizado por candidaturas anteriores. GET /curriculos mantém a listagem antiga por candidaturas; participantes sem candidatura são consultados pelo endpoint específico do banco.

Erros: 401 sem sessão; 403 por papel/ownership; 404 para recurso inexistente ou participante indisponível; 409 para vaga fechada/duplicidade; 422 com errors por campo para interesses, consentimento e currículo ausente.
