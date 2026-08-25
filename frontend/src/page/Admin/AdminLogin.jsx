import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getApiErrorMessage,
  getApiFieldError,
} from "../../lib/api";

const EmailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="admin-login__field-icon"
  >
    <path
      d="M4 6.75h16v10.5H4V6.75Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="m4.75 7.5 6.18 5.08a1.7 1.7 0 0 0 2.14 0l6.18-5.08"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="admin-login__field-icon"
  >
    <path
      d="M6.75 10.25h10.5a1.5 1.5 0 0 1 1.5 1.5v7h-13.5v-7a1.5 1.5 0 0 1 1.5-1.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 10.25V7.7a3.5 3.5 0 0 1 7 0v2.55"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M12 14v1.75"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const EyeIcon = ({ visible }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="admin-login__eye-icon"
  >
    {visible ? (
      <>
        <path
          d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="2.25"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </>
    ) : (
      <>
        <path
          d="M4 4 20 20"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M9.6 7.34A8.8 8.8 0 0 1 12 7c5.5 0 8.5 5 8.5 5a13 13 0 0 1-2.05 2.55M14.4 16.66A8.8 8.8 0 0 1 12 17c-5.5 0-8.5-5-8.5-5a13 13 0 0 1 2.05-2.55"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
  </svg>
);

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="admin-login__arrow-icon"
  >
    <path
      d="M5 12h14M14 7l5 5-5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className="admin-login__shield-icon"
  >
    <path
      d="M16 3.5 26 7v7.45c0 6.3-4.25 11.12-10 14.05-5.75-2.93-10-7.75-10-14.05V7l10-3.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="m11.75 15.7 2.65 2.65 5.85-6.2"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SparkleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="admin-login__sparkle-icon"
  >
    <path
      d="M12 2.75c.65 4.43 2.82 6.6 7.25 7.25-4.43.65-6.6 2.82-7.25 7.25-.65-4.43-2.82-6.6-7.25-7.25C9.18 9.35 11.35 7.18 12 2.75Z"
      fill="currentColor"
    />
    <path
      d="M19 16.5c.28 1.92 1.22 2.86 3.14 3.14-1.92.28-2.86 1.22-3.14 3.14-.28-1.92-1.22-2.86-3.14-3.14 1.92-.28 2.86-1.22 3.14-3.14Z"
      fill="currentColor"
      opacity=".65"
    />
  </svg>
);

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setAuthError("");

    try {
      const authenticatedUser = await login({
        email: email.trim().toLowerCase(),
        password,
        remember: rememberMe,
      });

      if (
        String(authenticatedUser.role || "").toLowerCase() !==
        "recrutador"
      ) {
        try {
          await logout();
        } catch {
          // O estado local é limpo pelo AuthContext mesmo se a API falhar.
        }

        setAuthError(
          "Esta conta não possui acesso de recrutador.",
        );
        return;
      }

      navigate("/admin/home", { replace: true });
    } catch (error) {
      setAuthError(
        getApiFieldError(error, "email", "password") ||
          getApiErrorMessage(
            error,
            "Não foi possível autenticar. Verifique suas credenciais.",
          ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          min-height: 100%;
          margin: 0;
        }

        button,
        input {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes admin-login-page-enter {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes admin-login-card-enter {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.975);
            filter: blur(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes admin-login-content-enter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes admin-login-orb-one {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(40px, 24px, 0) scale(1.12);
          }
        }

        @keyframes admin-login-orb-two {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(-35px, -26px, 0) scale(1.1);
          }
        }

        @keyframes admin-login-grid-move {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(40px);
          }
        }

        @keyframes admin-login-shimmer {
          0% {
            transform: translateX(-140%) skewX(-20deg);
          }

          55%,
          100% {
            transform: translateX(240%) skewX(-20deg);
          }
        }

        @keyframes admin-login-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes admin-login-status-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(255, 91, 146, 0.5);
          }

          50% {
            box-shadow: 0 0 0 6px rgba(255, 91, 146, 0);
          }
        }

        .admin-login {
          --accent: #ff4f91;
          --accent-light: #ff84b4;
          --accent-dark: #c91f62;
          --background: #070407;
          --surface: rgba(18, 13, 18, 0.76);
          --surface-soft: rgba(255, 255, 255, 0.045);
          --border: rgba(255, 255, 255, 0.09);
          --text: #fff9fc;
          --text-muted: #a89da4;

          position: relative;
          isolation: isolate;
          display: grid;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: hidden;
          color: var(--text);
          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(255, 60, 132, 0.13),
              transparent 32%
            ),
            radial-gradient(
              circle at 88% 82%,
              rgba(137, 24, 80, 0.12),
              transparent 35%
            ),
            linear-gradient(145deg, #120910 0%, #080507 46%, #030203 100%);
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          animation: admin-login-page-enter 0.6s ease-out both;
        }

        .admin-login::before {
          content: "";
          position: absolute;
          z-index: -4;
          inset: 0;
          pointer-events: none;
          opacity: 0.14;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
          mask-image: radial-gradient(
            circle at center,
            black 10%,
            transparent 78%
          );
          animation: admin-login-grid-move 12s linear infinite;
        }

        .admin-login::after {
          content: "";
          position: absolute;
          z-index: -3;
          inset: 0;
          pointer-events: none;
          opacity: 0.21;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.18'/%3E%3C/svg%3E");
          mix-blend-mode: soft-light;
        }

        .admin-login__ambient {
          position: absolute;
          z-index: -2;
          border-radius: 999px;
          pointer-events: none;
          will-change: transform;
        }

        .admin-login__ambient--one {
          top: -260px;
          left: -210px;
          width: 650px;
          height: 650px;
          background: rgba(255, 52, 126, 0.21);
          filter: blur(135px);
          animation: admin-login-orb-one 12s ease-in-out infinite;
        }

        .admin-login__ambient--two {
          right: -240px;
          bottom: -280px;
          width: 680px;
          height: 680px;
          background: rgba(170, 22, 91, 0.17);
          filter: blur(150px);
          animation: admin-login-orb-two 14s ease-in-out infinite;
        }

        .admin-login__spotlight {
          position: absolute;
          z-index: -1;
          top: 50%;
          left: 50%;
          width: 900px;
          height: 650px;
          pointer-events: none;
          background: radial-gradient(
            ellipse,
            rgba(255, 255, 255, 0.035),
            transparent 68%
          );
          transform: translate(-50%, -50%);
        }

        .admin-login__layout {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(440px, 0.95fr);
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
        }

        .admin-login__showcase {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
          padding: clamp(36px, 5vw, 76px);
          border-right: 1px solid rgba(255, 255, 255, 0.055);
        }

        .admin-login__brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          width: fit-content;
          color: #fff;
          text-decoration: none;
          animation: admin-login-content-enter 0.65s 0.08s ease-out both;
        }

        .admin-login__brand-symbol {
          position: relative;
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 13px;
          color: #fff;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.15),
              rgba(255, 255, 255, 0.025)
            ),
            linear-gradient(145deg, var(--accent), var(--accent-dark));
          box-shadow:
            0 12px 32px rgba(220, 35, 104, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }

        .admin-login__brand-symbol::after {
          content: "";
          position: absolute;
          inset: -25%;
          background: linear-gradient(
            110deg,
            transparent 35%,
            rgba(255, 255, 255, 0.28) 50%,
            transparent 65%
          );
          transform: translateX(-140%) skewX(-20deg);
          animation: admin-login-shimmer 5.5s 1s ease-in-out infinite;
        }

        .admin-login__brand-symbol svg {
          position: relative;
          z-index: 1;
          width: 24px;
          height: 24px;
        }

        .admin-login__brand-copy {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .admin-login__brand-name {
          font-size: 15px;
          font-weight: 760;
          letter-spacing: 0.02em;
        }

        .admin-login__brand-category {
          color: #8f858b;
          font-size: 14px;
          font-weight: 650;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .admin-login__hero {
          max-width: 700px;
          margin: clamp(70px, 11vh, 130px) 0;
          animation: admin-login-content-enter 0.75s 0.16s ease-out both;
        }

        .admin-login__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 24px;
          padding: 8px 11px 8px 9px;
          border: 1px solid rgba(255, 97, 153, 0.19);
          border-radius: 999px;
          color: #eeb5ca;
          background: rgba(255, 71, 137, 0.065);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
          font-size: 14px;
          font-weight: 730;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .admin-login__eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--accent);
          animation: admin-login-status-pulse 2.2s ease-in-out infinite;
        }

        .admin-login__hero-title {
          max-width: 650px;
          margin: 0;
          color: #fff;
          font-size: clamp(43px, 5.3vw, 77px);
          font-weight: 770;
          line-height: 0.99;
          letter-spacing: -0.055em;
        }

        .admin-login__hero-title span {
          display: block;
          padding-bottom: 0.07em;
          color: transparent;
          background: linear-gradient(
            110deg,
            #fff 0%,
            #ffc2d8 42%,
            #ff4f91 100%
          );
          background-clip: text;
          -webkit-background-clip: text;
        }

        .admin-login__hero-description {
          max-width: 560px;
          margin: 27px 0 0;
          color: #a69ba2;
          font-size: clamp(15px, 1.4vw, 18px);
          line-height: 1.72;
        }

        .admin-login__features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          max-width: 650px;
          margin-top: 38px;
        }

        .admin-login__feature {
          position: relative;
          overflow: hidden;
          min-width: 0;
          padding: 17px;
          border: 1px solid rgba(255, 255, 255, 0.065);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.027);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            background 0.3s ease;
        }

        .admin-login__feature:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 91, 146, 0.19);
          background: rgba(255, 255, 255, 0.042);
        }

        .admin-login__feature-value {
          display: block;
          margin-bottom: 6px;
          color: #fff5f9;
          font-size: 14px;
          font-weight: 720;
        }

        .admin-login__feature-label {
          display: block;
          overflow: hidden;
          color: #847981;
          font-size: 14px;
          font-weight: 620;
          letter-spacing: 0.03em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-login__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          color: #645b61;
          font-size: 14px;
          font-weight: 600;
          animation: admin-login-content-enter 0.75s 0.24s ease-out both;
        }

        .admin-login__security {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-login__security svg {
          width: 15px;
          height: 15px;
          color: #8f8088;
        }

        .admin-login__access-area {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(28px, 5vw, 76px);
        }

        .admin-login__form-wrapper {
          width: min(100%, 460px);
          animation: admin-login-card-enter 0.85s 0.08s
            cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .admin-login__mobile-brand {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 25px;
        }

        .admin-login__card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          padding: clamp(28px, 4vw, 42px);
          border: 1px solid rgba(255, 255, 255, 0.095);
          border-radius: 28px;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.045),
              transparent 35%
            ),
            rgba(16, 11, 15, 0.76);
          box-shadow:
            0 34px 100px rgba(0, 0, 0, 0.52),
            0 12px 34px rgba(0, 0, 0, 0.28),
            0 0 0 1px rgba(255, 76, 143, 0.035),
            inset 0 1px 0 rgba(255, 255, 255, 0.065);
          backdrop-filter: blur(26px) saturate(135%);
          -webkit-backdrop-filter: blur(26px) saturate(135%);
        }

        .admin-login__card::before {
          content: "";
          position: absolute;
          z-index: -1;
          top: -170px;
          left: 50%;
          width: 400px;
          height: 250px;
          border-radius: 50%;
          background: rgba(255, 67, 136, 0.14);
          filter: blur(90px);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .admin-login__card::after {
          content: "";
          position: absolute;
          z-index: 2;
          top: 0;
          left: 14%;
          width: 72%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 130, 177, 0.65),
            transparent
          );
          pointer-events: none;
        }

        .admin-login__icon-shell {
          position: relative;
          display: grid;
          width: 68px;
          height: 68px;
          margin-bottom: 28px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          color: #fff;
          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.16),
              rgba(255, 255, 255, 0.025)
            ),
            linear-gradient(145deg, #ff5b97, #c61d5d);
          box-shadow:
            0 15px 38px rgba(231, 42, 111, 0.31),
            inset 0 1px 0 rgba(255, 255, 255, 0.24);
        }

        .admin-login__icon-shell::before {
          content: "";
          position: absolute;
          inset: -7px;
          z-index: -1;
          border: 1px solid rgba(255, 86, 148, 0.12);
          border-radius: 25px;
        }

        .admin-login__shield-icon {
          width: 32px;
          height: 32px;
        }

        .admin-login__heading-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .admin-login__sparkle {
          display: grid;
          flex: 0 0 auto;
          width: 37px;
          height: 37px;
          margin-top: 2px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          color: #d68ca9;
          background: rgba(255, 255, 255, 0.025);
        }

        .admin-login__sparkle-icon {
          width: 18px;
          height: 18px;
        }

        .admin-login__title {
          margin: 0;
          color: #fff;
          font-size: clamp(26px, 3vw, 32px);
          font-weight: 765;
          line-height: 1.12;
          letter-spacing: -0.035em;
        }

        .admin-login__subtitle {
          margin: 10px 0 0;
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.65;
        }

        .admin-login__form {
          display: flex;
          flex-direction: column;
          gap: 19px;
          margin-top: 31px;
        }

        .admin-login__field-group {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .admin-login__label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #d8cfd4;
          font-size: 14px;
          font-weight: 690;
          letter-spacing: 0.025em;
        }

        .admin-login__input-shell {
          position: relative;
          display: flex;
          align-items: center;
          min-height: 55px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.085);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.033);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.025),
            0 8px 22px rgba(0, 0, 0, 0.12);
          transition:
            border-color 0.25s ease,
            background 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;
        }

        .admin-login__input-shell:hover {
          border-color: rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.044);
        }

        .admin-login__input-shell:focus-within {
          border-color: rgba(255, 87, 149, 0.66);
          background: rgba(255, 255, 255, 0.052);
          box-shadow:
            0 0 0 4px rgba(255, 75, 142, 0.095),
            0 12px 30px rgba(0, 0, 0, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.035);
          transform: translateY(-1px);
        }

        .admin-login__field-icon {
          flex: 0 0 auto;
          width: 20px;
          height: 20px;
          margin-left: 17px;
          color: #7f747b;
          transition: color 0.25s ease;
        }

        .admin-login__input-shell:focus-within .admin-login__field-icon {
          color: var(--accent-light);
        }

        .admin-login__input {
          min-width: 0;
          width: 100%;
          height: 54px;
          padding: 0 15px;
          border: 0;
          outline: 0;
          color: #fff;
          background: transparent;
          caret-color: var(--accent);
          font-size: 14px;
          font-weight: 520;
        }

        .admin-login__input::placeholder {
          color: #6e646a;
          opacity: 1;
        }

        .admin-login__input:-webkit-autofill,
        .admin-login__input:-webkit-autofill:hover,
        .admin-login__input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          transition: background-color 9999s ease-out;
          box-shadow: 0 0 0 1000px #171116 inset;
        }

        .admin-login__password-toggle {
          display: grid;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          margin-right: 6px;
          padding: 0;
          place-items: center;
          border: 0;
          border-radius: 11px;
          color: #7d7379;
          background: transparent;
          cursor: pointer;
          transition:
            color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .admin-login__password-toggle:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.055);
        }

        .admin-login__password-toggle:active {
          transform: scale(0.93);
        }

        .admin-login__password-toggle:focus-visible {
          outline: 2px solid rgba(255, 91, 150, 0.8);
          outline-offset: 1px;
        }

        .admin-login__eye-icon {
          width: 19px;
          height: 19px;
        }

        .admin-login__options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: -2px;
        }

        .admin-login__remember {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #93888f;
          font-size: 14px;
          font-weight: 590;
          cursor: pointer;
          user-select: none;
        }

        .admin-login__checkbox {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }

        .admin-login__checkbox-ui {
          position: relative;
          display: grid;
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.035);
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .admin-login__checkbox-ui::after {
          content: "";
          width: 7px;
          height: 4px;
          border-bottom: 1.8px solid white;
          border-left: 1.8px solid white;
          opacity: 0;
          transform: translateY(-1px) rotate(-45deg) scale(0.6);
          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        .admin-login__checkbox:checked + .admin-login__checkbox-ui {
          border-color: rgba(255, 110, 163, 0.75);
          background: linear-gradient(145deg, var(--accent-light), var(--accent-dark));
          box-shadow: 0 5px 14px rgba(222, 42, 108, 0.25);
        }

        .admin-login__checkbox:checked
          + .admin-login__checkbox-ui::after {
          opacity: 1;
          transform: translateY(-1px) rotate(-45deg) scale(1);
        }

        .admin-login__checkbox:focus-visible
          + .admin-login__checkbox-ui {
          outline: 2px solid rgba(255, 91, 150, 0.75);
          outline-offset: 2px;
        }

        .admin-login__forgot {
          padding: 2px;
          border: 0;
          color: #df90ad;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 650;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .admin-login__forgot:hover {
          color: #ffbdd5;
        }

        .admin-login__forgot:focus-visible {
          border-radius: 4px;
          outline: 2px solid rgba(255, 91, 150, 0.75);
          outline-offset: 3px;
        }

        .admin-login__submit {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 55px;
          margin-top: 3px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 15px;
          color: #fff;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.13),
              transparent 48%
            ),
            linear-gradient(135deg, #ff609b 0%, #ed397b 48%, #c51c5c 100%);
          box-shadow:
            0 17px 36px rgba(218, 34, 103, 0.29),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
          cursor: pointer;
          font-size: 14px;
          font-weight: 760;
          letter-spacing: 0.025em;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            filter 0.25s ease;
        }

        .admin-login__submit::before {
          content: "";
          position: absolute;
          inset: -50%;
          background: linear-gradient(
            110deg,
            transparent 40%,
            rgba(255, 255, 255, 0.28) 50%,
            transparent 60%
          );
          transform: translateX(-140%) skewX(-20deg);
          transition: transform 0.7s ease;
        }

        .admin-login__submit:hover:not(:disabled) {
          transform: translateY(-3px);
          filter: saturate(1.08) brightness(1.05);
          box-shadow:
            0 23px 45px rgba(218, 34, 103, 0.38),
            0 0 0 5px rgba(255, 80, 143, 0.065),
            inset 0 1px 0 rgba(255, 255, 255, 0.28);
        }

        .admin-login__submit:hover:not(:disabled)::before {
          transform: translateX(140%) skewX(-20deg);
        }

        .admin-login__submit:active:not(:disabled) {
          transform: translateY(-1px) scale(0.99);
        }

        .admin-login__submit:focus-visible {
          outline: 3px solid rgba(255, 132, 180, 0.48);
          outline-offset: 3px;
        }

        .admin-login__submit:disabled {
          cursor: wait;
          opacity: 0.82;
        }

        .admin-login__submit-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .admin-login__arrow-icon {
          width: 18px;
          height: 18px;
          transition: transform 0.25s ease;
        }

        .admin-login__submit:hover:not(:disabled)
          .admin-login__arrow-icon {
          transform: translateX(4px);
        }

        .admin-login__spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #fff;
          border-radius: 999px;
          animation: admin-login-spin 0.7s linear infinite;
        }

        .admin-login__card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 23px 0 0;
          color: #6f656b;
          font-size: 14px;
          font-weight: 620;
          letter-spacing: 0.045em;
          text-align: center;
          text-transform: uppercase;
        }

        .admin-login__card-footer::before,
        .admin-login__card-footer::after {
          content: "";
          width: 23px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.11)
          );
        }

        .admin-login__card-footer::after {
          transform: rotate(180deg);
        }

        @media (max-width: 1050px) {
          .admin-login__layout {
            grid-template-columns: minmax(0, 0.86fr) minmax(420px, 1.14fr);
          }

          .admin-login__features {
            grid-template-columns: 1fr;
            max-width: 300px;
          }

          .admin-login__feature {
            padding: 14px 15px;
          }
        }

        @media (max-width: 850px) {
          .admin-login__layout {
            display: flex;
            min-height: 100vh;
            min-height: 100dvh;
          }

          .admin-login__showcase {
            display: none;
          }

          .admin-login__access-area {
            width: 100%;
            padding: 30px 22px;
          }

          .admin-login__mobile-brand {
            display: flex;
          }
        }

        @media (max-width: 520px) {
          .admin-login__access-area {
            align-items: flex-start;
            padding: 23px 15px;
          }

          .admin-login__form-wrapper {
            margin: auto 0;
          }

          .admin-login__mobile-brand {
            margin-bottom: 18px;
          }

          .admin-login__card {
            padding: 26px 20px;
            border-radius: 23px;
          }

          .admin-login__icon-shell {
            width: 59px;
            height: 59px;
            margin-bottom: 23px;
            border-radius: 17px;
          }

          .admin-login__heading-row {
            gap: 12px;
          }

          .admin-login__sparkle {
            display: none;
          }

          .admin-login__form {
            margin-top: 27px;
          }

          .admin-login__options {
            align-items: flex-start;
          }
        }

        @media (max-width: 365px) {
          .admin-login__options {
            flex-direction: column;
            gap: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <main className="admin-login">
        <div className="admin-login__ambient admin-login__ambient--one" />
        <div className="admin-login__ambient admin-login__ambient--two" />
        <div className="admin-login__spotlight" />

        <div className="admin-login__layout">
          <section
            className="admin-login__showcase"
            aria-label="Apresentação do sistema"
          >
            <div className="admin-login__brand">
              <div className="admin-login__brand-symbol">
                <ShieldIcon />
              </div>

              <div className="admin-login__brand-copy">
                <span className="admin-login__brand-name">Administration</span>
                <span className="admin-login__brand-category">
                  Control Center
                </span>
              </div>
            </div>

            <div className="admin-login__hero">
              <div className="admin-login__eyebrow">
                <span className="admin-login__eyebrow-dot" />
                Ambiente protegido
              </div>

              <h1 className="admin-login__hero-title">
                Controle absoluto.
                <span>Gestão excepcional.</span>
              </h1>

              <p className="admin-login__hero-description">
                Acesse uma experiência administrativa segura, inteligente e
                projetada para oferecer clareza em cada decisão.
              </p>

              <div className="admin-login__features">
                <div className="admin-login__feature">
                  <span className="admin-login__feature-value">Seguro</span>
                  <span className="admin-login__feature-label">
                    Acesso criptografado
                  </span>
                </div>

                <div className="admin-login__feature">
                  <span className="admin-login__feature-value">Rápido</span>
                  <span className="admin-login__feature-label">
                    Respostas em tempo real
                  </span>
                </div>

                <div className="admin-login__feature">
                  <span className="admin-login__feature-value">Preciso</span>
                  <span className="admin-login__feature-label">
                    Gestão centralizada
                  </span>
                </div>
              </div>
            </div>

            <footer className="admin-login__footer">
              <span>© 2026 Todos os direitos reservados</span>

              <span className="admin-login__security">
                <LockIcon />
                Conexão protegida
              </span>
            </footer>
          </section>

          <section
            className="admin-login__access-area"
            aria-label="Acesso administrativo"
          >
            <div className="admin-login__form-wrapper">
              <div className="admin-login__mobile-brand">
                <div className="admin-login__brand-symbol">
                  <ShieldIcon />
                </div>

                <div className="admin-login__brand-copy">
                  <span className="admin-login__brand-name">
                    Administration
                  </span>
                  <span className="admin-login__brand-category">
                    Control Center
                  </span>
                </div>
              </div>

              <div className="admin-login__card">
                <div className="admin-login__icon-shell">
                  <ShieldIcon />
                </div>

                <div className="admin-login__heading-row">
                  <div>
                    <h2 className="admin-login__title">
                      Bem-vindo de volta
                    </h2>

                    <p className="admin-login__subtitle">
                      Insira suas credenciais para acessar o painel
                      administrativo.
                    </p>
                  </div>

                  <div className="admin-login__sparkle">
                    <SparkleIcon />
                  </div>
                </div>

                <form
                  className="admin-login__form"
                  onSubmit={handleLogin}
                  noValidate={false}
                >
                  <div className="admin-login__field-group">
                    <label
                      className="admin-login__label"
                      htmlFor="admin-email"
                    >
                      E-mail
                    </label>

                    <div className="admin-login__input-shell">
                      <EmailIcon />

                      <input
                        id="admin-email"
                        className="admin-login__input"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setAuthError("");
                        }}
                        placeholder="admin@empresa.com"
                        autoComplete="email"
                        inputMode="email"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-login__field-group">
                    <label
                      className="admin-login__label"
                      htmlFor="admin-password"
                    >
                      Senha
                    </label>

                    <div className="admin-login__input-shell">
                      <LockIcon />

                      <input
                        id="admin-password"
                        className="admin-login__input"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setAuthError("");
                        }}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                        disabled={isLoading}
                        required
                      />

                      <button
                        className="admin-login__password-toggle"
                        type="button"
                        aria-label={
                          showPassword
                            ? "Ocultar senha"
                            : "Mostrar senha"
                        }
                        aria-pressed={showPassword}
                        disabled={isLoading}
                        onClick={() =>
                          setShowPassword((currentValue) => !currentValue)
                        }
                      >
                        <EyeIcon visible={showPassword} />
                      </button>
                    </div>
                  </div>

                  <div className="admin-login__options">
                    <label className="admin-login__remember">
                      <input
                        className="admin-login__checkbox"
                        type="checkbox"
                        checked={rememberMe}
                        disabled={isLoading}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                      />

                      <span className="admin-login__checkbox-ui" />
                      Manter conectado
                    </label>

                    <button
                      className="admin-login__forgot"
                      type="button"
                      disabled={isLoading}
                      onClick={() => navigate("/recuperar-senha")}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  {authError && (
                    <p
                      className="admin-login__subtitle"
                      role="alert"
                      style={{
                        margin: 0,
                        color: "#ff91b9",
                      }}
                    >
                      {authError}
                    </p>
                  )}

                  <button
                    className="admin-login__submit"
                    type="submit"
                    disabled={isLoading}
                  >
                    <span className="admin-login__submit-content">
                      {isLoading ? (
                        <>
                          <span className="admin-login__spinner" />
                          Autenticando...
                        </>
                      ) : (
                        <>
                          Acessar painel
                          <ArrowIcon />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <p className="admin-login__card-footer">
                  Acesso restrito e monitorado
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
