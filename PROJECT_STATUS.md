# Project Status — Point Media Talent Pool

**Assessment date:** 2026-08-05  
**Repository branch:** `main`  
**Reviewed commit:** `010cd9c6da4381f70d0a719ed472174af7d67654` (2026-08-04)  
**Worktree at assessment:** Clean before this report was added

## Executive summary

The repository is an early full-stack prototype for Point Media's talent pool. It has a substantial visual React interface and a Laravel API/data-model foundation, but the two applications are not connected yet. All visible candidate, job, résumé, and administrator flows in React currently use mock data, alerts, delays, or navigation-only handlers. The Laravel API exposes the intended core resources, but it needs authorization fixes, request validation, relationship corrections, and meaningful automated tests before real-company or production use.

The project is best described as **UI prototype + backend foundation**, not an integrated minimum viable product yet.

## Repository structure and stack

| Area | Current implementation |
|---|---|
| Frontend | Standalone React 19.2 application built with Vite 8 |
| Frontend libraries | React Router 7, Framer Motion, Axios, Lucide React |
| Backend | Laravel 12 on PHP 8.2 |
| API authentication | Laravel Sanctum 4 bearer tokens |
| Database target | MySQL in `.env.example`; PHPUnit uses in-memory SQLite |
| Styling | Mostly large component-local inline style objects and embedded CSS |
| Tests | Two unchanged Laravel example tests; no frontend tests |
| CI/deployment | No CI workflow, container configuration, or deployment configuration found |

The root only contains a one-line project description and an empty root `package-lock.json`. The frontend and backend retain mostly framework-template READMEs, so setup, architecture, API use, and team conventions are not yet documented.

## What is implemented

### React frontend

The application declares these browser routes:

| Route | Screen | Current behavior |
|---|---|---|
| `/` | Public landing page | Polished marketing page with hard-coded featured jobs and statistics |
| `/login` | Candidate login | Collects credentials, shows an alert, then navigates without authentication |
| `/cadastro` | Candidate registration | Collects four fields, shows an alert, then navigates without saving |
| `/homeUser` | Candidate dashboard | Displays a mock user and mock jobs grouped by category |
| `/createResume` | Résumé builder | Renders résumé fields and dynamically adds sections, but does not store or submit values |
| `/admin/login` | Administrator login | Simulates a 900 ms login and grants access without validating credentials |
| `/admin/home` | Administrator dashboard | Links to job creation and job listing screens |
| `/admin/criar-vaga` | Create job | Validates required HTML fields, then navigates without creating a job |
| `/admin/ver-vagas` | View jobs/candidates | Displays one hard-coded job and two hard-coded candidates |

Positive frontend progress:

- All principal product areas have at least a visual screen.
- Responsive rules exist for the authentication, administrator-login, and résumé screens.
- Job grouping and job-detail modal interactions are prototyped.
- A production build completes successfully.
- Local branding assets and animations are already present.

### Laravel backend

The API has 16 application endpoints under `/api`:

- Public: registration and login.
- Sanctum-protected: résumé CRUD, job CRUD, create an application, list the current user's applications, list candidates for a job, and update application status.

Implemented backend capabilities include:

- Candidate registration with hashed passwords and a default `candidato` role.
- Credential validation and Sanctum bearer-token creation.
- Résumé creation with nested experiences, education, courses, skills, and languages.
- Job CRUD.
- Job application creation with résumé ownership and duplicate-application checks.
- Candidate application history.
- Recruiter-only candidate listing and application status changes.
- Eloquent models and foreign keys for the core talent-pool domain.

### Data model

The migrations define:

- `users`, including a free-form role string.
- `curriculos`, one intended résumé per user at the model level.
- `experiencias`, `formacoes`, `cursos`, `habilidades`, and `idiomas`, each belonging to a résumé.
- `vagas`.
- `candidaturas`, linking user, job, and résumé with a status.
- Sanctum tokens and Laravel's standard session, cache, and queue tables.

Cascade deletion is configured on the domain foreign keys, which is a good base for referential cleanup.

## Integration status

There is currently **no React-to-Laravel integration**:

- Axios is installed in the frontend but never imported or called.
- No frontend API base URL or environment variable is defined.
- No bearer token is stored or sent.
- No authenticated-user state, logout, session restoration, or route guard exists.
- Candidate and admin routes are directly accessible by URL.
- Jobs, users, résumés, and candidates shown in the UI are hard-coded.
- The résumé and job forms do not construct or submit API payloads.
- The "Mandar Currículo" action has no click handler.

The frontend field shapes also do not fully match the backend. For example, the registration UI collects a telephone number while the user registration endpoint only persists name, email, and password. The admin job form asks for location and employment type, while the `vagas` table only stores title, description, and requirements.

## Verification results

Commands were run against the checked-in dependencies on 2026-08-05.

| Check | Result |
|---|---|
| Frontend production build (`npm.cmd run build`) | **Passed**; 448 modules transformed |
| Frontend ESLint (`npm.cmd run lint`) | **Failed** with 2 errors |
| PHP syntax check over app/routes/database | **Passed** |
| Composer validation | **Passed** |
| Laravel route registration | **Passed**; 17 non-vendor routes including `/` |
| PHPUnit without an application key | **Failed** with `MissingAppKeyException` |
| PHPUnit with a temporary valid `APP_KEY` | **Passed**; 2 tests and 2 assertions |

The two ESLint findings are:

1. `motion` is reported as unused in `Home.jsx` despite its JSX member usage, indicating the lint configuration and JSX usage need reconciliation.
2. `HomeUser.jsx` synchronously copies constant mock data into state inside an effect (`react-hooks/set-state-in-effect`).

The successful PHP tests do not validate product behavior. They only assert that `true` is true and that the Laravel welcome route returns HTTP 200. Authentication, authorization, validation, database relationships, API responses, and all frontend flows are untested.

The production frontend output is valid, but its largest asset is the background video at approximately **14.8 MB**. The generated JavaScript is approximately **474 KB** before gzip (**144 KB** gzip), so asset optimization and route-level code splitting should be considered before deployment.

## Important issues and risks

### Critical — authorization and data exposure

1. Every job CRUD route is protected only by `auth:sanctum`. Any authenticated candidate can currently create, edit, or delete jobs because `VagaController` has no recruiter-role or policy check.
2. `CurriculoController::show` has no ownership or recruiter authorization check. Once its relationship bug is fixed, any authenticated user could request another résumé by ID.
3. Candidate and administrator React routes have no authentication or role guards. The administrator login always succeeds after a delay.
4. There is no logout/token revocation endpoint, token expiration, or administrator provisioning flow.

### High — backend correctness

1. `CurriculoController` calls `with('user')`, but `Curriculo` does not define a `user()` relationship. Recruiter résumé listing and résumé detail requests will throw a relationship-not-found exception.
2. Résumé creation has no request validation and no transaction. Invalid nested data can fail midway and leave a partially-created résumé.
3. Job updates and résumé updates accept request data without validation. Job creation validates only title and description.
4. The `formacoes` migration's `down()` method tries to drop `formacaos`, so rollback does not remove the table it created.
5. Duplicate applications are checked only in application code. Without a database unique constraint on `(user_id, vaga_id)`, concurrent requests can still create duplicates.
6. The model declares one résumé per user, but the database does not make `curriculos.user_id` unique and the API permits repeated creation.

### High — missing functional integration

1. Authentication, registration, jobs, résumé management, applications, and candidate review are not connected to the API.
2. The protected job index means even reading jobs requires a token, which conflicts with the public landing-page job display unless that is an intentional product rule.
3. No recruiter user is created by the seeder; the only seeded user uses the default candidate role.
4. The UI and database job fields disagree on location and employment type.

### Medium — maintainability and product readiness

1. Several screens contain hundreds of lines of inline CSS; `AdminLogin.jsx` is especially large. This makes reuse and visual consistency harder.
2. `HeaderUser.jsx` duplicates `JobCard.jsx` and exports a component named `JobCard`, suggesting an unfinished or incorrectly named component. Several shared job components are currently unused.
3. One import uses `page/admin/AdminLogin` while the directory is named `Admin`. It works on case-insensitive Windows but can fail on a case-sensitive Linux build server.
4. Multiple buttons and links are visual placeholders, including résumé navigation, job application, featured-job actions, footer links, password recovery, and admin access from the public menu.
5. Repeated mock jobs use duplicate React keys (`id: 1`), which can cause unstable rendering.
6. The application depends on remote Unsplash and avatar images for primary content; reliability, privacy, licensing, and content-control requirements should be decided.
7. CORS currently allows every origin. This should be restricted for deployed environments.
8. No error, loading, empty, or expired-session states exist for real API operations.

### Low — configuration and documentation

1. `.env.example` uses generic Laravel branding/locales and appears to contain a database-name typo: `bancoo_taalentos`.
2. A fresh checkout has no `.env` or application key, so the feature test cannot boot until setup is performed. This is normal for Laravel locally, but setup instructions are missing.
3. The root lockfile contains no packages, and the Laravel-side Vite/Tailwind scaffold appears separate from the actual standalone React client.
4. The HTML title and favicon still use frontend-template defaults.

## Recommended next steps

### 1. Secure and stabilize the API

- Add role middleware or Laravel policies for job management, candidate review, and application status updates.
- Add the missing `Curriculo::user()` relationship and enforce résumé visibility rules.
- Introduce Form Request validation for every create/update endpoint.
- Wrap résumé plus nested-record creation in a database transaction.
- Add database uniqueness for one résumé per user and one application per user/job, if those are the intended rules.
- Fix the `formacoes` rollback name.
- Add logout/token revocation and an explicit recruiter provisioning strategy.

### 2. Establish automated backend behavior tests

- Add `RefreshDatabase` feature tests for registration, login, invalid credentials, role restrictions, résumé ownership, job CRUD, duplicate applications, and status changes.
- Put a safe testing `APP_KEY` in `phpunit.xml` or documented test environment configuration.
- Test both successful requests and forbidden/validation cases.

### 3. Connect the React application

- Add a single API client with a Vite environment-based base URL and bearer-token handling.
- Implement authentication state, persistence, logout, and candidate/recruiter route guards.
- Replace mock jobs and users with API data.
- Wire registration, login, résumé, job creation, application, candidate listing, and status update flows.
- Align API/database fields with the approved product forms before integration.

### 4. Improve frontend reliability

- Fix the two lint errors and make lint/build required checks.
- Add frontend tests for routing, forms, authentication state, and core user actions.
- Correct the `Admin` import casing, duplicate keys, and placeholder links/actions.
- Break large screens into shared layout, form, modal, and field components.
- Add accessible labels, keyboard/focus behavior, API error messages, and loading/empty states.

### 5. Prepare for team and production use

- Replace template READMEs with exact Windows/Linux setup instructions, environment variables, ports, database creation, migrations, seed credentials, and run commands.
- Decide whether the standalone React build or Laravel Vite pipeline is the single supported frontend path.
- Restrict CORS, disable production debug output, configure secure secrets, and document deployment/SPA fallback behavior.
- Optimize the background video and consider lazy loading/code splitting.
- Add CI for frontend lint/build/tests and backend validation/tests.

## Suggested MVP acceptance path

The shortest path to a credible MVP is:

1. Fix API authorization, relationships, validation, and migrations.
2. Add feature tests for the candidate and recruiter happy paths plus forbidden cases.
3. Integrate candidate registration/login and authenticated route guards.
4. Integrate job listing, résumé creation/editing, and job application.
5. Integrate recruiter login, job management, candidate review, and status updates.
6. Finish error states, documentation, CI, and deployment hardening.

At that point, the existing visual prototype can become a demonstrable end-to-end talent-pool product rather than a set of disconnected screens and endpoints.
