import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import api, {
  getApiErrorMessage,
  initializeCsrf,
} from "../lib/api";

const recoveryStyles = `
  .password-recovery {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 32px 18px;
    color: #161824;
    background:
      radial-gradient(circle at 12% 14%, rgba(255, 79, 139, .28), transparent 31%),
      radial-gradient(circle at 86% 80%, rgba(100, 199, 238, .27), transparent 34%),
      #f7f7fb;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .password-recovery__card {
    width: min(100%, 480px);
    padding: clamp(26px, 6vw, 46px);
    border: 1px solid rgba(22, 24, 36, .08);
    border-radius: 28px;
    background: rgba(255, 255, 255, .92);
    box-shadow: 0 24px 70px rgba(22, 24, 36, .13);
    backdrop-filter: blur(16px);
  }

  .password-recovery__brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 32px;
    color: #161824;
    text-decoration: none;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -.05em;
  }

  .password-recovery__brand-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ff4f8b;
    box-shadow: 15px 0 0 #64c7ee;
    margin-right: 15px;
  }

  .password-recovery h1 {
    margin: 0 0 12px;
    font-size: clamp(28px, 7vw, 40px);
    line-height: 1.04;
    letter-spacing: -.045em;
  }

  .password-recovery p {
    margin: 0 0 28px;
    color: #626575;
    line-height: 1.65;
  }

  .password-recovery form {
    display: grid;
    gap: 18px;
  }

  .password-recovery label {
    display: grid;
    gap: 8px;
    font-size: 14px;
    font-weight: 750;
  }

  .password-recovery input {
    min-height: 52px;
    width: 100%;
    box-sizing: border-box;
    padding: 0 16px;
    border: 1px solid #d9dbe5;
    border-radius: 14px;
    background: #fff;
    color: #161824;
    font: inherit;
    outline: none;
    transition: border-color .18s ease, box-shadow .18s ease;
  }

  .password-recovery input:focus {
    border-color: #ff4f8b;
    box-shadow: 0 0 0 4px rgba(255, 79, 139, .12);
  }

  .password-recovery button {
    min-height: 54px;
    border: 0;
    border-radius: 14px;
    background: #161824;
    color: #fff;
    font: inherit;
    font-weight: 850;
    cursor: pointer;
    transition: transform .18s ease, opacity .18s ease;
  }

  .password-recovery button:hover:not(:disabled) { transform: translateY(-2px); }
  .password-recovery button:disabled { cursor: wait; opacity: .64; }

  .password-recovery__message {
    padding: 13px 15px;
    margin: 0 !important;
    border-radius: 12px;
    font-size: 14px;
  }

  .password-recovery__message--error {
    color: #9c1c46 !important;
    background: #ffe5ee;
  }

  .password-recovery__message--success {
    color: #176844 !important;
    background: #dcf8ec;
  }

  .password-recovery__back {
    display: block;
    margin-top: 24px;
    color: #626575;
    text-align: center;
    text-decoration: none;
    font-weight: 700;
  }

  .password-recovery__back:hover { color: #ff4f8b; }
`;

function RecoveryLayout({ title, description, children }) {
  return (
    <main className="password-recovery">
      <style>{recoveryStyles}</style>
      <section className="password-recovery__card" aria-labelledby="recovery-title">
        <Link className="password-recovery__brand" to="/" aria-label="Ir para a página inicial">
          <span className="password-recovery__brand-dot" aria-hidden="true" />
          point
        </Link>
        <h1 id="recovery-title">{title}</h1>
        <p>{description}</p>
        {children}
        <Link className="password-recovery__back" to="/login">
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await initializeCsrf();
      const response = await api.post("/forgot-password", { email });
      setMessage(
        response.data?.message ||
          "Se existir uma conta para este e-mail, enviaremos as instruções.",
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível solicitar a recuperação agora.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RecoveryLayout
      title="Recupere seu acesso"
      description="Informe o e-mail da sua conta. Se ele estiver cadastrado, você receberá um link seguro para criar uma nova senha."
    >
      <form onSubmit={handleSubmit}>
        <label>
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
          />
        </label>

        {error && (
          <p className="password-recovery__message password-recovery__message--error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="password-recovery__message password-recovery__message--success" role="status">
            {message}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Enviando…" : "Enviar link de recuperação"}
        </button>
      </form>
    </RecoveryLayout>
  );
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setError("Este link de recuperação está incompleto. Solicite um novo link.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await initializeCsrf();
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Senha redefinida. Você já pode entrar." },
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Não foi possível redefinir a senha.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RecoveryLayout
      title="Crie uma nova senha"
      description="Use pelo menos oito caracteres, com letras maiúsculas, minúsculas e números."
    >
      <form onSubmit={handleSubmit}>
        <label>
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
          />
        </label>

        <label>
          Nova senha
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={255}
          />
        </label>

        <label>
          Confirme a nova senha
          <input
            type="password"
            name="password_confirmation"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
            minLength={8}
            maxLength={255}
          />
        </label>

        {error && (
          <p className="password-recovery__message password-recovery__message--error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Salvando…" : "Redefinir senha"}
        </button>
      </form>
    </RecoveryLayout>
  );
}

