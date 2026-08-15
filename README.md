# Point Media — Banco de Talentos

Aplicação full-stack para divulgação de vagas, cadastro de candidatos, criação de currículo, candidaturas e gestão do processo seletivo da Point Media.

## Stack

- Frontend: React 19, React Router, Vite e Axios.
- Backend: PHP 8.2+, Laravel 12 e Laravel Sanctum.
- Banco: MySQL em desenvolvimento/produção e SQLite em memória nos testes.
- Autenticação web: sessão segura do Laravel/Sanctum, cookie HttpOnly e proteção CSRF. Tokens pessoais opcionais continuam disponíveis para clientes não web.

## Funcionalidades

### Candidato

- Cadastro com telefone, aceite de termos e política forte de senha.
- Login, restauração da sessão e logout.
- Consulta pública de vagas publicadas e ainda abertas.
- Currículo único com experiências, formações, cursos, habilidades, idiomas, links e foto.
- Criação e edição transacional do currículo.
- Candidatura sem duplicidade e histórico pessoal de candidaturas.
- Snapshot imutável do currículo no momento da candidatura.

### Recrutador

- Login e rotas protegidas por perfil.
- Criação e gestão de vagas com todos os campos da interface.
- Publicação, pausa, arquivamento, duplicação, exclusão lógica e ações em lote.
- Pipeline de candidatos com seis etapas, avaliação e observações.
- Inclusão manual de candidatos sem criar contas falsas.
- Dashboard, filtros, paginação e histórico de movimentações.

### Segurança e integridade

- Policies e escopo por recrutador/dono da vaga.
- Form Requests; nenhum controller persiste `$request->all()`.
- Rate limiting em login, cadastro, recuperação de senha e API.
- CORS restrito por variável de ambiente.
- Cookies de sessão criptografados, CSRF e headers de segurança.
- Foreign keys, índices, unicidade de currículo e candidatura, soft delete e transações.
- Upload de imagem limitado a JPEG, PNG ou WebP de até 2 MB.
- Respostas não revelam senhas, tokens, `remember_token` ou dados de candidatos fora do escopo autorizado.

## Pré-requisitos

- PHP 8.2 ou superior com `pdo_mysql`, `mbstring`, `openssl`, `fileinfo` e `zip`.
- Composer 2.8 ou superior.
- Node.js 20.19+ ou 22.12+ e npm 10+.
- MySQL 8+.

## Instalação local

### 1. Backend

No PowerShell:

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Crie o banco `banco_talentos` no MySQL e ajuste as variáveis `DB_*` do arquivo `backend/.env`. Depois execute:

```powershell
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

O backend ficará em `http://localhost:8000`.

O seeder só cria dados demonstrativos fora de produção. Por padrão local, o recrutador é `admin@pointmedia.com.br` e a senha é `Point@2026!`. Defina `SEED_RECRUITER_PASSWORD` antes do seed para substituir essa senha.

### 2. Frontend

Em outro terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

O frontend ficará em `http://localhost:5173`.

## Comandos de qualidade

Backend:

```powershell
cd backend
composer test
vendor\bin\pint --test
composer audit --locked
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
npm audit
```

## Configuração de produção

Antes de publicar:

1. Use HTTPS e defina `APP_ENV=production`, `APP_DEBUG=false`, `LOG_LEVEL=warning` e `SESSION_SECURE_COOKIE=true`.
2. Use segredos exclusivos; nunca copie a chave ou a senha do ambiente local.
3. Restrinja `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS` e `SESSION_DOMAIN` aos domínios reais.
4. Configure um provedor de e-mail para redefinição de senha.
5. Use usuário MySQL exclusivo, com senha forte e privilégios mínimos.
6. Execute migrations em backup testado e configure backups automáticos do banco e de `storage/app/public`.
7. Não execute o seeder demonstrativo em produção.
8. Rode testes, lint, build e auditorias de dependências no CI antes do deploy.

## Documentação

- [API e contratos](docs/API.md)
- [Arquitetura e decisões](docs/ARCHITECTURE.md)
- [Segurança e operação](docs/SECURITY.md)
- [Estado e verificações](PROJECT_STATUS.md)
