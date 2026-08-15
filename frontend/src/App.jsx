import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import RouteEffects from "./components/RouteEffects";

const Home = lazy(() => import("./page/Home"));
const Login = lazy(() => import("./page/Login"));
const Cadastro = lazy(() => import("./page/Cadastro"));
const ForgotPassword = lazy(() =>
  import("./page/PasswordRecovery").then((module) => ({
    default: module.ForgotPassword,
  })),
);
const ResetPassword = lazy(() =>
  import("./page/PasswordRecovery").then((module) => ({
    default: module.ResetPassword,
  })),
);
const InfoPage = lazy(() => import("./page/InfoPage"));
const JobDetails = lazy(() => import("./page/JobDetails"));

const HomeUser = lazy(() => import("./page/HomeUser"));
const CreateResume = lazy(() => import("./page/CreateResume.jsx"));
const MyApplications = lazy(() =>
  import("./page/MyApplications"),
);
const Profile = lazy(() => import("./page/Profile"));
const SavedJobs = lazy(() => import("./page/SavedJobs"));

const AdminLogin = lazy(() =>
  import("./page/Admin/AdminLogin"),
);
const AdminHome = lazy(() => import("./page/Admin/AdminHome"));
const AdminCreate = lazy(() =>
  import("./page/Admin/AdminCreate"),
);
const AdminSee = lazy(() => import("./page/Admin/AdminSee"));

const routeLoadingStyles = `
  .route-loading-shell {
    min-height: 100vh;
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    background:
      radial-gradient(circle at 20% 18%, rgba(255, 79, 139, 0.2), transparent 28rem),
      radial-gradient(circle at 82% 78%, rgba(100, 199, 238, 0.22), transparent 28rem),
      #fffdf8;
    color: #17171a;
  }

  .route-loading-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: min(100%, 22rem);
    padding: 1.1rem 1.2rem;
    border: 3px solid #17171a;
    border-radius: 1.15rem;
    background: #ffffff;
    box-shadow: 7px 7px 0 #ff4f8b;
  }

  .route-loading-mark {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 3rem;
    height: 3rem;
    border: 2px solid #17171a;
    border-radius: 0.85rem;
    background: #ffd447;
    font-size: 1.45rem;
    font-weight: 950;
    box-shadow: 3px 3px 0 #17171a;
    animation: routeLoadingPulse 1.1s ease-in-out infinite;
  }

  .route-loading-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .route-loading-copy strong {
    font-size: 1rem;
    font-weight: 950;
    letter-spacing: -0.035em;
  }

  .route-loading-copy span {
    color: #716a65;
    font-size: 0.78rem;
    font-weight: 700;
  }

  @keyframes routeLoadingPulse {
    0%, 100% { transform: rotate(-4deg) scale(1); }
    50% { transform: rotate(2deg) scale(1.06); }
  }

  @media (prefers-reduced-motion: reduce) {
    .route-loading-mark { animation: none; }
  }
`;

function RouteLoadingFallback() {
  return (
    <main
      className="route-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <style>{routeLoadingStyles}</style>

      <div className="route-loading-card">
        <span className="route-loading-mark" aria-hidden="true">
          p.
        </span>

        <span className="route-loading-copy">
          <strong>Preparando seu próximo passo</strong>
          <span>Carregando a página...</span>
        </span>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>

        {/* Público */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/vagas" element={<Navigate to="/#vagas" replace />} />
        <Route path="/vagas/:id" element={<JobDetails />} />
        <Route path="/empresas" element={<InfoPage type="empresas" />} />
        <Route path="/sobre" element={<InfoPage type="sobre" />} />
        <Route path="/contato" element={<InfoPage type="contato" />} />
        <Route path="/privacidade" element={<InfoPage type="privacidade" />} />
        <Route path="/termos" element={<InfoPage type="termos" />} />

        {/* Usuário */}
        <Route
          path="/homeUser"
          element={
            <ProtectedRoute roles={["candidato"]}>
              <HomeUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/createResume"
          element={
            <ProtectedRoute roles={["candidato"]}>
              <CreateResume />
            </ProtectedRoute>
          }
        />
        <Route path="/portfolio" element={<Navigate to="/createResume" replace />} />
        <Route
          path="/candidaturas"
          element={
            <ProtectedRoute roles={["candidato"]}>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vagas-salvas"
          element={
            <ProtectedRoute roles={["candidato"]}>
              <SavedJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute roles={["candidato"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/home"
          element={
            <ProtectedRoute roles={["recrutador"]}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/criar-vaga"
          element={
            <ProtectedRoute roles={["recrutador"]}>
              <AdminCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ver-vagas"
          element={
            <ProtectedRoute roles={["recrutador"]}>
              <AdminSee />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<InfoPage type="notFound" />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
