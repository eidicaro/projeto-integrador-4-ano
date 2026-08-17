# Estado do projeto — Point Media Talentos

**Atualizado em:** 15/08/2026

**Branch analisada:** `ele-carrega-a-champions-nas-costas`

## Resumo

O projeto deixou de ser um protótipo desconectado e agora funciona como uma aplicação full-stack. A interface React usa a API Laravel e o banco de dados para autenticação, currículo, vagas, favoritos, candidaturas, dashboard e pipeline de recrutamento.

Não há mais login administrativo simulado, vagas/candidatos mockados como fonte de dados ou PII persistida no `localStorage`. Todas as rotas sensíveis têm autenticação, papel e ownership no servidor; as proteções do frontend servem como experiência de navegação, não como barreira de segurança.

## Implementação atual

### Candidato

- Cadastro real com aceite de termos, telefone e senha forte.
- Login por sessão Sanctum/CSRF, restauração de sessão, logout e recuperação de senha.
- Rotas protegidas por papel.
- Busca e detalhe de vagas públicas vindas da API.
- Currículo único com edição, seções aninhadas e foto validada.
- Favoritos persistidos no banco.
- Candidatura com snapshot do currículo, prevenção de duplicidade e retirada controlada.
- Páginas de perfil, vagas salvas e acompanhamento de candidaturas.

### Recrutador

- Login real e dashboard com métricas do banco.
- Provisionamento seguro pelo comando `php artisan app:create-recruiter`.
- CRUD de vagas, publicação/pausa/arquivo, duplicação, exclusão lógica e ações em lote.
- Edição de vagas a partir do painel.
- Pipeline de candidatos, inclusão manual, busca, filtros, etapas, notas e avaliação.
- Histórico de movimentações e isolamento estrito por proprietário da vaga.
- Exportação CSV com neutralização de fórmulas.

### Backend e segurança

- Laravel 12.66.0 e Sanctum 4.3.3.
- 46 rotas de API da aplicação; 49 rotas HTTP totais quando incluídos os endpoints do framework.
- Enums de papel, status de vaga e status de candidatura.
- Form Requests, Resources, Policies, middleware de conta ativa e middleware de papel.
- Transações nas operações compostas, foreign keys, índices, unicidade e soft deletes.
- Rate limits separados; chave de login normalizada contra bypass por espaços/case.
- CORS por allowlist, cookies criptografados, CSRF, headers de segurança, HSTS em produção e `no-store` em respostas autenticadas.
- Upload limitado a JPEG/PNG/WebP, 2 MB e 4096 × 4096 px, armazenado de forma privada e servido apenas após autorização.
- Dependências atualizadas e sem advisories conhecidos nos auditores usados.

### Frontend e experiência

- 24 caminhos de navegador, incluindo páginas institucionais e 404 real.
- Estados de carregamento, erro, retry e vazio nos fluxos de rede.
- Modais com teclado/foco e feedback de operações.
- Rotas divididas via `React.lazy`; o chunk inicial ficou em 290,41 kB (95,34 kB gzip).
- O vídeo de fundo não é renderizado nem baixado em telas móveis, dispositivos touch, `save-data` ou preferência por movimento reduzido.
- Build compatível com filesystem case-sensitive.
- Layouts existentes preservados e complementados com navegação e páginas responsivas.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| PHPUnit | **68 testes / 448 asserções, aprovado** |
| Laravel Pint | **Aprovado** |
| Ciclo de migrations | **fresh + seed → rollback → migrate, aprovado em SQLite** |
| Rotas Laravel | **46 de API / 49 HTTP totais** |
| ESLint frontend completo | **Aprovado, zero erros/warnings** |
| Build Vite de produção | **Aprovado, 517 módulos** |
| Composer validate/audit | **Válido; zero advisories** |
| npm audit frontend/backend | **Zero vulnerabilidades reportadas** |
| Ensaio HTTP real | **Recrutador → vaga → candidato → currículo → favorito → candidatura → pipeline; aprovado** |
| Teste de autorização HTTP | **Candidato em dashboard admin: 403** |
| CI | **Workflow de PHP/Node criado para push e pull request, com jobs SQLite e MySQL 8.4** |

O banco e os logs criados exclusivamente para o ensaio HTTP foram removidos ao final; nenhum dado do projeto foi descartado.

## Preparação externa para produção

O código está pronto para configuração de ambiente, mas publicar exige decisões e credenciais que não pertencem ao repositório:

1. Configurar MySQL, domínio, HTTPS, e-mail transacional, segredos e cookies seguros.
2. Executar migrations e criar o primeiro recrutador pelo comando seguro.
3. Configurar backup/restauração do banco e de `storage/app/private`.
4. Definir a política formal de retenção de currículos e revisar juridicamente Termos/Privacidade.
5. Substituir ou comprimir `frontend/src/assets/bg.mp4` (14,8 MB) se a meta de banda em desktop exigir um asset menor. O frontend já evita renderizar e solicitar o vídeo em mobile, touch, `save-data` e movimento reduzido.

Consulte [README.md](README.md), [docs/API.md](docs/API.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/SECURITY.md](docs/SECURITY.md) para instalação e operação.
