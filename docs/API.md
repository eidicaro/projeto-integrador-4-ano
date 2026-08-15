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
| `GET` | `/curriculos/{id}` | Exibe quando o candidato é dono ou o currículo foi enviado a uma vaga do recrutador. |
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
