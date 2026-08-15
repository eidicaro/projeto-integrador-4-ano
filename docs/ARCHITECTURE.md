# Arquitetura

## Visão geral

O repositório mantém duas aplicações independentes:

- `frontend/`: SPA React servida pelo Vite durante o desenvolvimento.
- `backend/`: API Laravel, autenticação, autorização, regras de domínio e persistência.

O frontend usa um cliente Axios único. Em navegadores, a autenticação usa o modo SPA do Sanctum: primeiro o cliente solicita `/sanctum/csrf-cookie`, depois envia login e demais operações com cookies. O cookie de sessão é HttpOnly, portanto o JavaScript não armazena credenciais ou bearer tokens.

## Limites de domínio

### Usuário

Possui um papel fechado: `candidato` ou `recrutador`. O cadastro público sempre cria um candidato; recrutadores são provisionados pelo comando interativo `php artisan app:create-recruiter` ou pelo seed estritamente local.

### Currículo

Existe no máximo um currículo por candidato, garantido por índice único. As cinco coleções filhas são sincronizadas dentro da mesma transação do registro principal.

A foto é armazenada em `storage/app/private` e entregue por um endpoint autenticado que aplica a mesma policy do currículo; ela não depende de symlink público.

### Vaga

Pertence ao recrutador que a criou. Somente esse recrutador pode alterar a vaga ou consultar suas candidaturas. A consulta pública considera apenas vagas `publicada` cujo prazo não expirou.

Um candidato pode manter uma coleção de vagas salvas por meio da pivot `vagas_salvas`, com unicidade por usuário/vaga. A listagem omite vagas fechadas ou expiradas.

### Candidatura

Liga vaga, candidato e currículo. O banco bloqueia duas candidaturas do mesmo usuário/e-mail para a mesma vaga. Dados relevantes do currículo são copiados para `curriculo_snapshot` no envio. Mudanças posteriores do currículo não mudam a submissão original.

O pipeline usa `novo`, `triagem`, `entrevista`, `oferta`, `contratado`, `reprovado` e o estado de retirada `retirado`. Cada mudança de etapa gera uma linha em `candidatura_movimentacoes`, com autor e horário.

## Respostas da API

Recursos usam a chave `data`. Coleções paginadas também retornam `links` e `meta`. Erros de validação seguem o formato Laravel:

```json
{
  "message": "Os dados informados são inválidos.",
  "errors": {
    "email": ["Este e-mail já está em uso."]
  }
}
```

Datas são ISO 8601; datas sem horário usam `YYYY-MM-DD`. Valores monetários são números decimais em reais.
