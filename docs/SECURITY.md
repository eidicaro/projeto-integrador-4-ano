# Segurança e operação

## Controles implementados

- Sessão Sanctum, cookie HttpOnly, CSRF e rotação do ID de sessão no login.
- Logout invalida a sessão e o token atual; `logout-all` revoga todos os tokens pessoais.
- Limites separados para API, login, cadastro e redefinição de senha.
- Policies e filtros por ownership para vagas, currículos e candidaturas.
- Validação de tamanho, formato, listas, URLs, imagens, enumerações e payloads aninhados.
- Senha mínima de oito caracteres, com maiúscula, minúscula e número.
- Resposta genérica na recuperação de senha para evitar enumeração de contas.
- CORS por allowlist e headers `nosniff`, `DENY`, Referrer Policy e Permissions Policy.
- HSTS em produção quando a requisição chega por HTTPS.
- Soft delete em vagas e candidaturas; snapshots e histórico preservam rastreabilidade.

## Dados pessoais e LGPD

Currículos, telefones, e-mails, notas e avaliações não devem ser mantidos no `localStorage`. O frontend deve receber apenas os dados autorizados pela API. Defina com a Point Media uma política formal de retenção, exportação e exclusão de dados antes de produção.

Logs não devem registrar senhas, cookies, tokens, payloads completos de currículo ou conteúdo de formulários. Proteja o acesso aos backups como ao banco principal.

## Resposta a incidentes

1. Revogue sessões/tokens afetados e troque os segredos do ambiente.
2. Preserve logs e evidências sem copiar dados pessoais desnecessários.
3. Corrija e teste a causa antes de restaurar o serviço.
4. Avalie obrigações de comunicação à ANPD e aos titulares com orientação jurídica.

## Rotina recomendada

- Diariamente: backup incremental e monitoramento de erros/abuso.
- Semanalmente: teste de restauração e revisão de usuários recrutadores ativos.
- Em cada PR: testes, Pint, ESLint, build, `composer audit` e `npm audit`.
- Mensalmente: atualização de patches de PHP, Laravel, Node e dependências.
