import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/login.png";
import bgVideo from "../assets/bg.mp4";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const [erros, setErros] = useState({
    email: "",
    senha: "",
  });

  function validarFormulario() {
    const novosErros = {
      email: "",
      senha: "",
    };

    if (!email.trim()) {
      novosErros.email = "Digite seu e-mail.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      novosErros.email = "Digite um e-mail válido.";
    }

    if (!senha) {
      novosErros.senha = "Digite sua senha.";
    } else if (senha.length < 4) {
      novosErros.senha = "A senha precisa ter pelo menos 4 caracteres.";
    }

    setErros(novosErros);

    return !novosErros.email && !novosErros.senha;
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (carregando || !validarFormulario()) {
      return;
    }

    setCarregando(true);

    try {
      /*
        Substitua esta simulação pela sua API:

        await api.post("/login", {
          email: email.trim(),
          senha,
          lembrar,
        });
      */

      await new Promise((resolve) => setTimeout(resolve, 1200));

      navigate("/");
    } catch (error) {
      setErros({
        email: "",
        senha:
          error?.response?.data?.message ||
          "Não foi possível entrar. Tente novamente.",
      });
    } finally {
      setCarregando(false);
    }
  }

  function handlePointerMove(event) {
    const page = pageRef.current;

    if (!page) return;

    const rect = page.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const normalizedX = x / rect.width - 0.5;
    const normalizedY = y / rect.height - 0.5;

    page.style.setProperty("--mouse-x", `${x}px`);
    page.style.setProperty("--mouse-y", `${y}px`);
    page.style.setProperty("--parallax-x", `${normalizedX * 22}px`);
    page.style.setProperty("--parallax-y", `${normalizedY * 18}px`);
    page.style.setProperty("--parallax-x-reverse", `${normalizedX * -16}px`);
    page.style.setProperty("--parallax-y-reverse", `${normalizedY * -14}px`);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (erros.email) {
      setErros((current) => ({
        ...current,
        email: "",
      }));
    }
  }

  function handleSenhaChange(event) {
    setSenha(event.target.value);

    if (erros.senha) {
      setErros((current) => ({
        ...current,
        senha: "",
      }));
    }
  }

  function handleCapsLock(event) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  return (
    <>
      <style>{`
        :root {
          color-scheme: light;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          min-height: 100%;
        }

        body {
          margin: 0;
          background: #f4f0e8;
        }

        button,
        input {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .public-login {
          --paper: #f5f1e9;
          --paper-light: #fffdf8;
          --ink: #17171a;
          --pink: #ff4f8b;
          --pink-dark: #e73876;
          --blue: #64c7ee;
          --yellow: #ffd447;
          --lime: #baf26d;
          --violet: #9183ff;
          --muted: #6c6864;

          --mouse-x: 50%;
          --mouse-y: 50%;
          --parallax-x: 0px;
          --parallax-y: 0px;
          --parallax-x-reverse: 0px;
          --parallax-y-reverse: 0px;

          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow: hidden;
          isolation: isolate;
          color: var(--ink);
          background:
            radial-gradient(
              circle at var(--mouse-x) var(--mouse-y),
              rgba(255, 79, 139, 0.13),
              transparent 19rem
            ),
            linear-gradient(
              135deg,
              rgba(100, 199, 238, 0.12),
              transparent 28%
            ),
            linear-gradient(
              315deg,
              rgba(255, 212, 71, 0.15),
              transparent 32%
            ),
            var(--paper);
          font-family:
            Inter,
            "SF Pro Display",
            "Segoe UI",
            Arial,
            sans-serif;
        }

        .public-login::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -10;
          pointer-events: none;
          background-image:
            linear-gradient(
              rgba(23, 23, 26, 0.048) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(23, 23, 26, 0.048) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
          mask-image: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.75),
            transparent 92%
          );
        }

        .public-login::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 50;
          opacity: 0.055;
          pointer-events: none;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.9'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px;
        }

        .decorative-shape {
          position: absolute;
          z-index: -5;
          pointer-events: none;
          transition: transform 180ms ease-out;
        }

        .decorative-shape--pink {
          top: -11rem;
          left: 31%;
          width: 22rem;
          height: 22rem;
          border: 3px solid var(--ink);
          border-radius: 39% 61% 64% 36% / 42% 38% 62% 58%;
          background: var(--pink);
          transform:
            translate(
              var(--parallax-x-reverse),
              var(--parallax-y-reverse)
            )
            rotate(18deg);
          animation: organicMorph 10s ease-in-out infinite;
        }

        .decorative-shape--blue {
          right: -8rem;
          bottom: -10rem;
          width: 26rem;
          height: 26rem;
          border: 3px solid var(--ink);
          border-radius: 65% 35% 42% 58% / 46% 64% 36% 54%;
          background: var(--blue);
          transform:
            translate(var(--parallax-x), var(--parallax-y))
            rotate(-14deg);
          animation: organicMorph 13s ease-in-out infinite reverse;
        }

        .decorative-star {
          position: absolute;
          z-index: 1;
          color: var(--ink);
          pointer-events: none;
        }

        .decorative-star--one {
          top: 21%;
          left: 44%;
          width: 4.3rem;
          transform:
            translate(var(--parallax-x), var(--parallax-y))
            rotate(12deg);
          animation: starSpin 15s linear infinite;
        }

        .decorative-star--two {
          right: 4%;
          top: 39%;
          width: 2.8rem;
          color: var(--pink);
          transform:
            translate(
              var(--parallax-x-reverse),
              var(--parallax-y-reverse)
            );
          animation: starSpin 11s linear infinite reverse;
        }

        .public-header {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          width: 100%;
          min-height: 6.5rem;
          padding:
            1.5rem
            clamp(1.25rem, 4.2vw, 4.8rem);
          animation: headerReveal 800ms 100ms cubic-bezier(.2,.8,.2,1)
            both;
        }

        .public-logo-button {
          display: inline-flex;
          align-items: center;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .public-logo {
          display: block;
          width: clamp(8.6rem, 11vw, 11.5rem);
          max-height: 4.2rem;
          object-fit: contain;
          object-position: left center;
          filter:
            drop-shadow(4px 4px 0 rgba(255, 79, 139, 0.24))
            drop-shadow(7px 7px 0 rgba(100, 199, 238, 0.18));
          transition:
            transform 260ms cubic-bezier(.2,.8,.2,1),
            filter 260ms ease;
        }

        .public-logo-button:hover .public-logo {
          transform: translateY(-3px) rotate(-1deg);
          filter:
            drop-shadow(6px 6px 0 rgba(255, 79, 139, 0.3))
            drop-shadow(10px 10px 0 rgba(100, 199, 238, 0.23));
        }

        .header-center-label {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.68rem 1rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--paper-light);
          color: var(--ink);
          font-size: 0.69rem;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          box-shadow: 4px 4px 0 var(--ink);
          transform: rotate(-1.5deg);
        }

        .header-center-label-dot {
          width: 0.55rem;
          height: 0.55rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--lime);
          animation: dotBlink 2s ease-in-out infinite;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-login-label {
          color: var(--muted);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .create-account-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          min-height: 3rem;
          padding: 0.75rem 1.15rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--yellow);
          color: var(--ink);
          font-size: 0.77rem;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 5px 5px 0 var(--ink);
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            box-shadow 220ms ease,
            background 220ms ease;
        }

        .create-account-button:hover {
          background: var(--lime);
          transform: translate(-2px, -2px) rotate(1deg);
          box-shadow: 8px 8px 0 var(--ink);
        }

        .create-account-button:active {
          transform: translate(3px, 3px);
          box-shadow: 2px 2px 0 var(--ink);
        }

        .create-account-button svg {
          width: 1rem;
          height: 1rem;
          transition: transform 220ms ease;
        }

        .create-account-button:hover svg {
          transform: translateX(3px) rotate(-5deg);
        }

        .login-layout {
          position: relative;
          z-index: 4;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(380px, 0.8fr);
          gap: clamp(2rem, 5vw, 6rem);
          width: 100%;
          max-width: 1600px;
          min-height: calc(100vh - 6.5rem);
          min-height: calc(100dvh - 6.5rem);
          margin: 0 auto;
          padding:
            clamp(1.25rem, 2vw, 2.25rem)
            clamp(1.25rem, 4.2vw, 4.8rem)
            clamp(2rem, 5vh, 4.5rem);
        }

        .visual-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          padding: 1rem 0 2rem;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          gap: 0.7rem;
          margin-bottom: 1rem;
          padding: 0.55rem 0.78rem;
          border: 2px solid var(--ink);
          border-radius: 0.75rem;
          background: var(--blue);
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          box-shadow: 4px 4px 0 var(--ink);
          transform: rotate(-2deg);
          animation: stickerReveal 850ms 260ms cubic-bezier(.2,.8,.2,1)
            both;
        }

        .hero-kicker svg {
          width: 0.95rem;
          height: 0.95rem;
        }

        .hero-title {
          position: relative;
          z-index: 3;
          max-width: 9.4ch;
          margin: 0;
          color: var(--ink);
          font-size: clamp(4rem, 8.1vw, 9rem);
          font-weight: 950;
          line-height: 0.79;
          letter-spacing: -0.085em;
          text-transform: uppercase;
        }

        .hero-title-row {
          display: block;
          width: fit-content;
          animation: titleEnter 950ms cubic-bezier(.16,.84,.2,1) both;
        }

        .hero-title-row:nth-child(1) {
          animation-delay: 330ms;
        }

        .hero-title-row:nth-child(2) {
          position: relative;
          z-index: 5;
          margin-left: clamp(1.5rem, 8vw, 7rem);
          color: var(--paper-light);
          text-shadow:
            -3px -3px 0 var(--ink),
            3px -3px 0 var(--ink),
            -3px 3px 0 var(--ink),
            3px 3px 0 var(--ink),
            7px 7px 0 var(--pink);
          transform: rotate(-2deg);
          animation-delay: 420ms;
        }

        .hero-title-row:nth-child(3) {
          margin-left: clamp(0rem, 2vw, 2rem);
          animation-delay: 510ms;
        }

        .hero-title-highlight {
          position: relative;
          display: inline-block;
        }

        .hero-title-highlight::after {
          content: "";
          position: absolute;
          z-index: -1;
          left: -0.08em;
          right: -0.04em;
          bottom: 0.04em;
          height: 0.24em;
          border: 2px solid var(--ink);
          background: var(--yellow);
          transform: rotate(-1.5deg);
        }

        .hero-description {
          position: relative;
          z-index: 5;
          max-width: 34rem;
          margin: 1.8rem 0 0;
          color: #46423f;
          font-size: clamp(0.96rem, 1.15vw, 1.08rem);
          font-weight: 620;
          line-height: 1.7;
          letter-spacing: -0.015em;
          animation: descriptionReveal 850ms 660ms ease both;
        }

        .hero-description strong {
          color: var(--ink);
          font-weight: 900;
        }

        .visual-composition {
          position: relative;
          width: min(100%, 51rem);
          height: clamp(17rem, 34vw, 27rem);
          margin-top: clamp(2rem, 4vh, 3.5rem);
          animation: compositionReveal 1s 720ms cubic-bezier(.2,.8,.2,1)
            both;
        }

        .video-frame-shadow {
          position: absolute;
          top: 1rem;
          left: clamp(2rem, 8vw, 7rem);
          width: min(68%, 31rem);
          height: 88%;
          border: 3px solid var(--ink);
          border-radius: 30% 70% 57% 43% / 42% 37% 63% 58%;
          background: var(--pink);
          transform: rotate(-6deg);
        }

        .video-frame {
          position: absolute;
          z-index: 3;
          top: 0;
          left: clamp(1rem, 7vw, 6rem);
          width: min(68%, 31rem);
          height: 88%;
          overflow: hidden;
          border: 3px solid var(--ink);
          border-radius: 30% 70% 57% 43% / 42% 37% 63% 58%;
          background: var(--ink);
          transform:
            translate(var(--parallax-x), var(--parallax-y))
            rotate(-2deg);
          box-shadow: 10px 12px 0 rgba(23, 23, 26, 0.12);
          transition: transform 180ms ease-out;
        }

        .composition-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.05) contrast(1.03);
          transform: scale(1.03);
        }

        .video-frame-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              rgba(255, 79, 139, 0.08),
              transparent 45%
            ),
            linear-gradient(
              to top,
              rgba(23, 23, 26, 0.22),
              transparent 45%
            );
        }

        .video-corner-label {
          position: absolute;
          z-index: 4;
          right: 1.6rem;
          bottom: 1.7rem;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.55rem 0.72rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--paper-light);
          font-size: 0.64rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 3px 3px 0 var(--ink);
        }

        .video-corner-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 999px;
          background: var(--pink);
          box-shadow: 0 0 0 3px rgba(255, 79, 139, 0.2);
        }

        .floating-stat {
          position: absolute;
          z-index: 8;
          border: 2px solid var(--ink);
          color: var(--ink);
          box-shadow: 5px 5px 0 var(--ink);
          transition:
            transform 240ms cubic-bezier(.2,.8,.2,1),
            box-shadow 240ms ease;
        }

        .floating-stat:hover {
          transform: translate(-3px, -3px) rotate(0deg);
          box-shadow: 8px 8px 0 var(--ink);
        }

        .floating-stat--opportunities {
          top: 8%;
          right: 0;
          width: min(13.5rem, 35%);
          padding: 1rem;
          border-radius: 1.2rem;
          background: var(--yellow);
          transform:
            translate(
              var(--parallax-x-reverse),
              var(--parallax-y-reverse)
            )
            rotate(4deg);
          transition: transform 180ms ease-out;
        }

        .floating-stat--match {
          left: 0;
          bottom: 0;
          width: min(15rem, 38%);
          padding: 1rem;
          border-radius: 1.2rem;
          background: var(--lime);
          transform:
            translate(var(--parallax-x), var(--parallax-y))
            rotate(-4deg);
          transition: transform 180ms ease-out;
        }

        .floating-stat-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.61rem;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .floating-stat-label svg {
          width: 1rem;
          height: 1rem;
        }

        .floating-stat-value {
          display: block;
          font-size: clamp(1.55rem, 3vw, 2.4rem);
          font-weight: 950;
          line-height: 0.95;
          letter-spacing: -0.07em;
        }

        .floating-stat-description {
          display: block;
          margin-top: 0.55rem;
          color: rgba(23, 23, 26, 0.67);
          font-size: 0.66rem;
          font-weight: 750;
          line-height: 1.4;
        }

        .mini-avatar-row {
          display: flex;
          align-items: center;
          margin-top: 0.8rem;
        }

        .mini-avatar {
          display: grid;
          place-items: center;
          width: 1.8rem;
          height: 1.8rem;
          margin-left: -0.35rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--paper-light);
          font-size: 0.58rem;
          font-weight: 950;
        }

        .mini-avatar:first-child {
          margin-left: 0;
          background: var(--pink);
        }

        .mini-avatar:nth-child(2) {
          background: var(--blue);
        }

        .mini-avatar:nth-child(3) {
          background: var(--violet);
        }

        .mini-avatar:nth-child(4) {
          background: var(--paper-light);
        }

        .sparkle-badge {
          position: absolute;
          z-index: 10;
          right: 22%;
          bottom: 4%;
          display: grid;
          place-items: center;
          width: 4.7rem;
          height: 4.7rem;
          border: 3px solid var(--ink);
          border-radius: 50%;
          background: var(--violet);
          box-shadow: 5px 5px 0 var(--ink);
          transform: rotate(12deg);
          animation: badgeBounce 3.5s ease-in-out infinite;
        }

        .sparkle-badge svg {
          width: 2rem;
          height: 2rem;
          color: var(--paper-light);
        }

        .login-panel-area {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          padding: 1rem 0 2rem;
        }

        .login-ticket-wrap {
          position: relative;
          width: min(100%, 29rem);
          animation: ticketReveal 1s 420ms cubic-bezier(.16,.84,.2,1)
            both;
        }

        .ticket-backdrop {
          position: absolute;
          inset: 0;
          border: 3px solid var(--ink);
          border-radius: 1.8rem;
          background: var(--pink);
          transform: translate(13px, 14px) rotate(2.5deg);
        }

        .login-ticket {
          position: relative;
          z-index: 3;
          width: 100%;
          overflow: hidden;
          border: 3px solid var(--ink);
          border-radius: 1.8rem;
          background:
            linear-gradient(
              90deg,
              transparent 0,
              transparent calc(100% - 1px),
              rgba(23, 23, 26, 0.03) calc(100% - 1px)
            ),
            var(--paper-light);
          box-shadow: 0 28px 70px rgba(23, 23, 26, 0.15);
        }

        .ticket-header {
          position: relative;
          padding: 1.75rem 1.75rem 1.45rem;
          border-bottom: 3px dashed var(--ink);
          background:
            linear-gradient(
              135deg,
              rgba(100, 199, 238, 0.22),
              transparent 52%
            ),
            var(--paper-light);
        }

        .ticket-header::before,
        .ticket-header::after {
          content: "";
          position: absolute;
          bottom: -0.9rem;
          width: 1.6rem;
          height: 1.6rem;
          border: 3px solid var(--ink);
          border-radius: 50%;
          background: var(--paper);
        }

        .ticket-header::before {
          left: -0.9rem;
        }

        .ticket-header::after {
          right: -0.9rem;
        }

        .ticket-number {
          position: absolute;
          top: 1.15rem;
          right: 1.25rem;
          color: rgba(23, 23, 26, 0.32);
          font-family: "Courier New", monospace;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          transform: rotate(90deg) translateX(1.4rem);
          transform-origin: right top;
        }

        .ticket-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.45rem 0.65rem;
          border: 2px solid var(--ink);
          border-radius: 0.6rem;
          background: var(--lime);
          font-size: 0.63rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 3px 3px 0 var(--ink);
          transform: rotate(-2deg);
        }

        .ticket-badge svg {
          width: 0.85rem;
          height: 0.85rem;
        }

        .ticket-title {
          max-width: 8ch;
          margin: 0;
          font-size: clamp(2.3rem, 4vw, 3.35rem);
          font-weight: 950;
          line-height: 0.9;
          letter-spacing: -0.075em;
          text-transform: uppercase;
        }

        .ticket-subtitle {
          max-width: 23rem;
          margin: 0.9rem 0 0;
          color: var(--muted);
          font-size: 0.8rem;
          font-weight: 620;
          line-height: 1.55;
        }

        .ticket-body {
          padding: 1.65rem 1.75rem 1.8rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          color: var(--ink);
          font-size: 0.7rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .field-label-detail {
          color: #9a938c;
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.07em;
        }

        .field-shell {
          position: relative;
          display: flex;
          align-items: center;
          min-height: 3.7rem;
          border: 2px solid var(--ink);
          border-radius: 0.95rem;
          background: #ffffff;
          box-shadow: 4px 4px 0 rgba(23, 23, 26, 0.12);
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            box-shadow 220ms ease,
            background 220ms ease;
        }

        .field-shell:focus-within {
          background: #fffdf8;
          transform: translate(-2px, -2px);
          box-shadow:
            7px 7px 0 var(--blue),
            9px 9px 0 var(--ink);
        }

        .field-shell--error {
          background: #fff2f4;
          box-shadow:
            5px 5px 0 #ff869f,
            7px 7px 0 var(--ink);
          animation: fieldShake 350ms ease;
        }

        .field-icon {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 3.2rem;
          height: 100%;
          color: var(--ink);
        }

        .field-icon svg {
          width: 1.08rem;
          height: 1.08rem;
        }

        .field-input {
          width: 100%;
          min-width: 0;
          height: 3.6rem;
          padding: 0 1rem 0 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--ink);
          caret-color: var(--pink);
          font-size: 0.88rem;
          font-weight: 750;
        }

        .field-input::placeholder {
          color: #aaa39b;
          font-weight: 600;
        }

        .password-toggle {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 3rem;
          height: 3rem;
          margin-right: 0.25rem;
          border: 2px solid transparent;
          border-radius: 0.75rem;
          background: transparent;
          color: var(--ink);
          cursor: pointer;
          transition:
            background 200ms ease,
            border-color 200ms ease,
            transform 200ms ease;
        }

        .password-toggle:hover {
          border-color: var(--ink);
          background: var(--yellow);
          transform: rotate(-4deg);
        }

        .password-toggle svg {
          width: 1.05rem;
          height: 1.05rem;
        }

        .field-error,
        .caps-warning {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding-left: 0.15rem;
          font-size: 0.66rem;
          font-weight: 800;
          line-height: 1.4;
          animation: feedbackReveal 220ms ease both;
        }

        .field-error {
          color: #d52d57;
        }

        .caps-warning {
          color: #9b6613;
        }

        .field-error svg,
        .caps-warning svg {
          flex: 0 0 auto;
          width: 0.8rem;
          height: 0.8rem;
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin: 0.1rem 0 0.15rem;
        }

        .remember-label {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          color: #625d58;
          font-size: 0.7rem;
          font-weight: 750;
          cursor: pointer;
          user-select: none;
        }

        .remember-input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .remember-checkbox {
          display: grid;
          place-items: center;
          width: 1.2rem;
          height: 1.2rem;
          border: 2px solid var(--ink);
          border-radius: 0.32rem;
          background: #ffffff;
          box-shadow: 2px 2px 0 var(--ink);
          transition:
            background 200ms ease,
            transform 200ms ease,
            box-shadow 200ms ease;
        }

        .remember-checkbox svg {
          width: 0.72rem;
          height: 0.72rem;
          opacity: 0;
          transform: scale(0.4) rotate(-20deg);
          transition:
            opacity 170ms ease,
            transform 220ms cubic-bezier(.2,.8,.2,1);
        }

        .remember-input:checked + .remember-checkbox {
          background: var(--pink);
          transform: translate(1px, 1px) rotate(-3deg);
          box-shadow: 1px 1px 0 var(--ink);
        }

        .remember-input:checked + .remember-checkbox svg {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .remember-input:focus-visible + .remember-checkbox {
          outline: 3px solid rgba(100, 199, 238, 0.4);
          outline-offset: 3px;
        }

        .forgot-button {
          padding: 0.2rem;
          border: 0;
          background: transparent;
          color: var(--ink);
          font-size: 0.69rem;
          font-weight: 900;
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-decoration-color: var(--pink);
          text-underline-offset: 4px;
          cursor: pointer;
          transition:
            color 200ms ease,
            transform 200ms ease;
        }

        .forgot-button:hover {
          color: var(--pink-dark);
          transform: rotate(-1deg);
        }

        .submit-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 3.8rem;
          margin-top: 0.2rem;
          padding: 0 1.25rem;
          border: 3px solid var(--ink);
          border-radius: 1rem;
          overflow: hidden;
          background: var(--ink);
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 6px 6px 0 var(--pink);
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            box-shadow 220ms ease,
            background 220ms ease,
            color 220ms ease;
        }

        .submit-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.05) 10px,
              rgba(255, 255, 255, 0.05) 20px
            );
          transform: translateX(-100%);
          transition: transform 550ms cubic-bezier(.2,.8,.2,1);
        }

        .submit-button:hover {
          background: var(--yellow);
          color: var(--ink);
          transform: translate(-3px, -3px) rotate(-0.5deg);
          box-shadow:
            9px 9px 0 var(--pink),
            12px 12px 0 var(--ink);
        }

        .submit-button:hover::before {
          transform: translateX(0);
        }

        .submit-button:active {
          transform: translate(4px, 4px);
          box-shadow: 2px 2px 0 var(--pink);
        }

        .submit-button:disabled {
          cursor: wait;
          opacity: 0.88;
        }

        .submit-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.7rem;
        }

        .submit-content svg {
          width: 1.05rem;
          height: 1.05rem;
          transition: transform 220ms ease;
        }

        .submit-button:hover .submit-content svg {
          transform: translateX(5px) rotate(-8deg);
        }

        .loading-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spinnerRotate 700ms linear infinite;
        }

        .submit-button:hover .loading-spinner {
          border-color: rgba(23, 23, 26, 0.25);
          border-top-color: var(--ink);
        }

        .ticket-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 1.35rem;
          padding-top: 1.25rem;
          border-top: 2px solid rgba(23, 23, 26, 0.12);
          color: #766f69;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .ticket-footer button {
          padding: 0.2rem;
          border: 0;
          background: transparent;
          color: var(--pink-dark);
          font-weight: 950;
          cursor: pointer;
          transition:
            color 200ms ease,
            transform 200ms ease;
        }

        .ticket-footer button:hover {
          color: var(--ink);
          transform: translateY(-1px);
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          margin-top: 1.1rem;
          color: #9a938c;
          font-size: 0.62rem;
          font-weight: 750;
        }

        .security-note svg {
          width: 0.8rem;
          height: 0.8rem;
        }

        .marquee-bar {
          position: absolute;
          z-index: 15;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          overflow: hidden;
          min-height: 2.3rem;
          border-top: 2px solid var(--ink);
          border-bottom: 2px solid var(--ink);
          background: var(--yellow);
          transform: rotate(-0.65deg) scaleX(1.02);
          transform-origin: center;
        }

        .marquee-track {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          min-width: max-content;
          animation: marqueeMove 23s linear infinite;
        }

        .marquee-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 0 1.25rem;
          color: var(--ink);
          font-size: 0.68rem;
          font-weight: 950;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .marquee-item svg {
          width: 0.9rem;
          height: 0.9rem;
        }

        .public-login button:focus-visible {
          outline: 3px solid var(--blue);
          outline-offset: 4px;
        }

        @keyframes organicMorph {
          0%,
          100% {
            border-radius: 39% 61% 64% 36% / 42% 38% 62% 58%;
          }

          33% {
            border-radius: 58% 42% 35% 65% / 52% 61% 39% 48%;
          }

          66% {
            border-radius: 46% 54% 67% 33% / 62% 42% 58% 38%;
          }
        }

        @keyframes starSpin {
          to {
            rotate: 360deg;
          }
        }

        @keyframes headerReveal {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dotBlink {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(0.65);
          }
        }

        @keyframes stickerReveal {
          from {
            opacity: 0;
            transform: translateY(1rem) rotate(-8deg);
          }

          to {
            opacity: 1;
            transform: translateY(0) rotate(-2deg);
          }
        }

        @keyframes titleEnter {
          from {
            opacity: 0;
            transform: translateY(0.75em) rotate(3deg);
            filter: blur(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
            filter: blur(0);
          }
        }

        @keyframes descriptionReveal {
          from {
            opacity: 0;
            transform: translateY(1.2rem);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes compositionReveal {
          from {
            opacity: 0;
            transform: translateY(2rem) scale(0.95);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes badgeBounce {
          0%,
          100% {
            transform: translateY(0) rotate(12deg);
          }

          50% {
            transform: translateY(-0.65rem) rotate(5deg);
          }
        }

        @keyframes ticketReveal {
          from {
            opacity: 0;
            transform: translateY(2rem) rotate(3deg) scale(0.96);
            filter: blur(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
            filter: blur(0);
          }
        }

        @keyframes fieldShake {
          0%,
          100% {
            transform: translateX(0);
          }

          30% {
            transform: translateX(-4px);
          }

          65% {
            transform: translateX(4px);
          }
        }

        @keyframes feedbackReveal {
          from {
            opacity: 0;
            transform: translateY(-0.25rem);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spinnerRotate {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes marqueeMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 1180px) {
          .login-layout {
            grid-template-columns: minmax(0, 1fr) minmax(370px, 0.78fr);
            gap: 3rem;
          }

          .hero-title {
            font-size: clamp(4rem, 7.4vw, 7rem);
          }

          .decorative-star--one {
            left: 42%;
          }

          .floating-stat--opportunities {
            right: -1rem;
          }
        }

        @media (max-width: 980px) {
          .public-login {
            overflow-x: hidden;
            overflow-y: auto;
          }

          .public-header {
            min-height: 5.8rem;
          }

          .header-center-label,
          .header-login-label {
            display: none;
          }

          .login-layout {
            display: flex;
            flex-direction: column;
            min-height: auto;
            padding-bottom: 6rem;
          }

          .visual-stage {
            min-height: auto;
            padding-top: 1.5rem;
          }

          .hero-title {
            font-size: clamp(4.2rem, 12vw, 7.5rem);
          }

          .hero-description {
            max-width: 38rem;
          }

          .visual-composition {
            width: min(100%, 46rem);
            height: clamp(20rem, 60vw, 29rem);
          }

          .login-panel-area {
            padding-top: 2rem;
          }

          .login-ticket-wrap {
            width: min(100%, 34rem);
          }

          .decorative-shape--pink {
            left: auto;
            right: -8rem;
          }

          .decorative-star--one {
            top: 30%;
            left: 83%;
          }
        }

        @media (max-width: 650px) {
          .public-header {
            padding: 1.1rem 1rem;
          }

          .public-logo {
            width: 7.8rem;
          }

          .create-account-button {
            min-height: 2.65rem;
            padding: 0.65rem 0.85rem;
            font-size: 0.69rem;
            box-shadow: 4px 4px 0 var(--ink);
          }

          .login-layout {
            gap: 1.5rem;
            padding:
              1rem
              1rem
              5.5rem;
          }

          .hero-kicker {
            margin-bottom: 0.8rem;
            font-size: 0.61rem;
          }

          .hero-title {
            font-size: clamp(3.7rem, 17vw, 6rem);
          }

          .hero-title-row:nth-child(2) {
            margin-left: 1rem;
            text-shadow:
              -2px -2px 0 var(--ink),
              2px -2px 0 var(--ink),
              -2px 2px 0 var(--ink),
              2px 2px 0 var(--ink),
              5px 5px 0 var(--pink);
          }

          .hero-description {
            margin-top: 1.35rem;
            font-size: 0.9rem;
          }

          .visual-composition {
            height: 22rem;
            margin-top: 1.8rem;
          }

          .video-frame-shadow,
          .video-frame {
            left: 8%;
            width: 78%;
            height: 72%;
          }

          .floating-stat--opportunities {
            top: 4%;
            right: 0;
            width: 41%;
          }

          .floating-stat--match {
            bottom: 2%;
            width: 45%;
          }

          .floating-stat {
            padding: 0.8rem;
            box-shadow: 4px 4px 0 var(--ink);
          }

          .floating-stat-label {
            font-size: 0.53rem;
          }

          .floating-stat-value {
            font-size: 1.4rem;
          }

          .floating-stat-description {
            font-size: 0.57rem;
          }

          .sparkle-badge {
            right: 10%;
            bottom: 3%;
            width: 3.8rem;
            height: 3.8rem;
          }

          .sparkle-badge svg {
            width: 1.6rem;
            height: 1.6rem;
          }

          .ticket-backdrop {
            transform: translate(8px, 10px) rotate(1.5deg);
          }

          .login-ticket {
            border-radius: 1.4rem;
          }

          .ticket-header {
            padding: 1.4rem 1.2rem 1.3rem;
          }

          .ticket-body {
            padding: 1.4rem 1.2rem 1.5rem;
          }

          .ticket-title {
            font-size: 2.35rem;
          }

          .ticket-number {
            display: none;
          }

          .field-shell {
            min-height: 3.5rem;
          }

          .field-input {
            height: 3.4rem;
            font-size: 0.83rem;
          }

          .field-icon {
            width: 2.9rem;
          }

          .form-options {
            align-items: flex-start;
          }

          .remember-label,
          .forgot-button {
            font-size: 0.64rem;
          }

          .submit-button {
            min-height: 3.55rem;
          }

          .decorative-star--one,
          .decorative-star--two {
            display: none;
          }
        }

        @media (max-width: 390px) {
          .create-account-button span {
            display: none;
          }

          .create-account-button {
            width: 2.8rem;
            padding: 0;
          }

          .hero-title {
            font-size: 3.6rem;
          }

          .floating-stat--opportunities {
            width: 44%;
          }

          .floating-stat--match {
            width: 49%;
          }

          .ticket-header,
          .ticket-body {
            padding-inline: 1rem;
          }

          .form-options {
            gap: 0.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .public-login *,
          .public-login *::before,
          .public-login *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .video-frame,
          .floating-stat,
          .decorative-shape {
            transform: none !important;
          }
        }
      `}</style>

      <main
        ref={pageRef}
        className="public-login"
        onPointerMove={handlePointerMove}
      >
        <div
          className="decorative-shape decorative-shape--pink"
          aria-hidden="true"
        />

        <div
          className="decorative-shape decorative-shape--blue"
          aria-hidden="true"
        />

        <StarShape className="decorative-star decorative-star--one" />
        <StarShape className="decorative-star decorative-star--two" />

        <header className="public-header">
          <button
            type="button"
            className="public-logo-button"
            onClick={() => navigate("/")}
            aria-label="Voltar para a página inicial"
          >
            <img
              src={logo}
              alt="Logo da plataforma"
              className="public-logo"
            />
          </button>

          <div className="header-center-label">
            <span className="header-center-label-dot" />
            Área do candidato
          </div>

          <div className="header-actions">
            <span className="header-login-label">
              Ainda não faz parte?
            </span>

            <button
              type="button"
              className="create-account-button"
              onClick={() => navigate("/cadastro")}
            >
              <span>Criar conta</span>
              <ArrowUpRightIcon />
            </button>
          </div>
        </header>

        <div className="login-layout">
          <section className="visual-stage" aria-label="Apresentação">
            <div className="hero-kicker">
              <SparklesIcon />
              Seu próximo capítulo começa aqui
            </div>

            <h1 className="hero-title">
              <span className="hero-title-row">Entre.</span>

              <span className="hero-title-row">Explore.</span>

              <span className="hero-title-row">
                <span className="hero-title-highlight">
                  Evolua.
                </span>
              </span>
            </h1>

            <p className="hero-description">
              Não é apenas uma página de vagas. É o lugar onde seu
              perfil encontra empresas, projetos e oportunidades que
              realmente fazem sentido para <strong>quem você é</strong>.
            </p>

            <div className="visual-composition">
              <div
                className="video-frame-shadow"
                aria-hidden="true"
              />

              <div className="video-frame">
                <video
                  className="composition-video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                >
                  <source src={bgVideo} type="video/mp4" />
                </video>

                <div
                  className="video-frame-overlay"
                  aria-hidden="true"
                />

                <div className="video-corner-label">
                  <span className="video-corner-dot" />
                  Explore possibilidades
                </div>
              </div>

              <div className="floating-stat floating-stat--opportunities">
                <div className="floating-stat-label">
                  Novidades
                  <BriefcaseIcon />
                </div>

                <strong className="floating-stat-value">
                  +128
                </strong>

                <span className="floating-stat-description">
                  novas oportunidades publicadas recentemente
                </span>
              </div>

              <div className="floating-stat floating-stat--match">
                <div className="floating-stat-label">
                  Seu perfil
                  <TargetIcon />
                </div>

                <strong className="floating-stat-value">
                  Match real
                </strong>

                <span className="floating-stat-description">
                  encontre vagas conectadas aos seus objetivos
                </span>

                <div className="mini-avatar-row" aria-hidden="true">
                  <span className="mini-avatar">UX</span>
                  <span className="mini-avatar">DEV</span>
                  <span className="mini-avatar">QA</span>
                  <span className="mini-avatar">+</span>
                </div>
              </div>

              <div className="sparkle-badge" aria-hidden="true">
                <SparklesIcon />
              </div>
            </div>
          </section>

          <section
            className="login-panel-area"
            aria-label="Acesso à conta"
          >
            <div className="login-ticket-wrap">
              <div
                className="ticket-backdrop"
                aria-hidden="true"
              />

              <article className="login-ticket">
                <header className="ticket-header">
                  <span className="ticket-number">
                    ACCESS · 0926
                  </span>

                  <div className="ticket-badge">
                    <TicketIcon />
                    Passe de acesso
                  </div>

                  <h2 className="ticket-title">
                    Acesse seu universo.
                  </h2>

                  <p className="ticket-subtitle">
                    Entre para acompanhar oportunidades, candidaturas e
                    novidades feitas para o seu perfil.
                  </p>
                </header>

                <div className="ticket-body">
                  <form
                    className="login-form"
                    onSubmit={handleLogin}
                    noValidate
                  >
                    <div className="field-group">
                      <label
                        className="field-label"
                        htmlFor="login-email"
                      >
                        E-mail

                        <span className="field-label-detail">
                          Identificação
                        </span>
                      </label>

                      <div
                        className={`field-shell ${
                          erros.email ? "field-shell--error" : ""
                        }`}
                      >
                        <span
                          className="field-icon"
                          aria-hidden="true"
                        >
                          <MailIcon />
                        </span>

                        <input
                          id="login-email"
                          className="field-input"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="seunome@email.com"
                          value={email}
                          onChange={handleEmailChange}
                          disabled={carregando}
                          aria-invalid={Boolean(erros.email)}
                          aria-describedby={
                            erros.email
                              ? "login-email-error"
                              : undefined
                          }
                        />
                      </div>

                      {erros.email && (
                        <span
                          id="login-email-error"
                          className="field-error"
                          role="alert"
                        >
                          <AlertIcon />
                          {erros.email}
                        </span>
                      )}
                    </div>

                    <div className="field-group">
                      <label
                        className="field-label"
                        htmlFor="login-password"
                      >
                        Senha

                        <span className="field-label-detail">
                          Acesso seguro
                        </span>
                      </label>

                      <div
                        className={`field-shell ${
                          erros.senha ? "field-shell--error" : ""
                        }`}
                      >
                        <span
                          className="field-icon"
                          aria-hidden="true"
                        >
                          <LockIcon />
                        </span>

                        <input
                          id="login-password"
                          className="field-input"
                          type={mostrarSenha ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Digite sua senha"
                          value={senha}
                          onChange={handleSenhaChange}
                          onKeyDown={handleCapsLock}
                          onKeyUp={handleCapsLock}
                          disabled={carregando}
                          aria-invalid={Boolean(erros.senha)}
                          aria-describedby={
                            erros.senha
                              ? "login-password-error"
                              : capsLock
                                ? "caps-lock-warning"
                                : undefined
                          }
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setMostrarSenha((current) => !current)
                          }
                          disabled={carregando}
                          aria-label={
                            mostrarSenha
                              ? "Ocultar senha"
                              : "Mostrar senha"
                          }
                          aria-pressed={mostrarSenha}
                        >
                          {mostrarSenha ? (
                            <EyeOffIcon />
                          ) : (
                            <EyeIcon />
                          )}
                        </button>
                      </div>

                      {erros.senha && (
                        <span
                          id="login-password-error"
                          className="field-error"
                          role="alert"
                        >
                          <AlertIcon />
                          {erros.senha}
                        </span>
                      )}

                      {!erros.senha && capsLock && (
                        <span
                          id="caps-lock-warning"
                          className="caps-warning"
                        >
                          <CapsLockIcon />
                          Caps Lock está ativado
                        </span>
                      )}
                    </div>

                    <div className="form-options">
                      <label className="remember-label">
                        <input
                          className="remember-input"
                          type="checkbox"
                          checked={lembrar}
                          onChange={(event) =>
                            setLembrar(event.target.checked)
                          }
                          disabled={carregando}
                        />

                        <span
                          className="remember-checkbox"
                          aria-hidden="true"
                        >
                          <CheckIcon />
                        </span>

                        Lembrar de mim
                      </label>

                      <button
                        type="button"
                        className="forgot-button"
                        onClick={() =>
                          navigate("/recuperar-senha")
                        }
                        disabled={carregando}
                      >
                        Esqueci a senha
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={carregando}
                    >
                      <span className="submit-content">
                        {carregando ? (
                          <>
                            <span
                              className="loading-spinner"
                              aria-hidden="true"
                            />
                            Preparando acesso
                          </>
                        ) : (
                          <>
                            Entrar na plataforma
                            <ArrowRightIcon />
                          </>
                        )}
                      </span>
                    </button>
                  </form>

                  <div className="ticket-footer">
                    <span>Primeira vez por aqui?</span>

                    <button
                      type="button"
                      onClick={() => navigate("/cadastro")}
                    >
                      Crie seu perfil gratuitamente
                    </button>
                  </div>

                  <div className="security-note">
                    <ShieldIcon />
                    Seus dados permanecem protegidos
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div className="marquee-bar" aria-hidden="true">
          <div className="marquee-track">
            <MarqueeContent />
            <MarqueeContent />
          </div>
        </div>
      </main>
    </>
  );
}

function MarqueeContent() {
  return (
    <>
      <span className="marquee-item">
        Encontre seu próximo desafio
        <SparklesIcon />
      </span>

      <span className="marquee-item">
        Conecte talento e oportunidade
        <StarSmallIcon />
      </span>

      <span className="marquee-item">
        Mostre quem você é
        <ProfileIcon />
      </span>

      <span className="marquee-item">
        Construa novos caminhos
        <ArrowUpRightIcon />
      </span>
    </>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.2 2.9" />
      <path d="M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.7-4" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 1 3.2L16 7.5l-3 1.3L12 12l-1-3.2-3-1.3 3-1.3L12 3Z" />
      <path d="m18.5 13 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
      <path d="m6 14 .6 1.8 1.8.6-1.8.6L6 18.8 5.4 17l-1.8-.6 1.8-.6L6 14Z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2V8Z" />
      <path d="M13 6v12" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M3 12.5c5.5 2 12.5 2 18 0" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" />
    </svg>
  );
}

function CapsLockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 11 7-7 7 7" />
      <path d="M8 11v4h8v-4" />
      <path d="M8 20h8" />
    </svg>
  );
}

function StarSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 1.5 2.6 7.9 7.9 2.6-7.9 2.6-2.6 7.9-2.6-7.9L1.5 12l7.9-2.6L12 1.5Z" />
    </svg>
  );
}

function StarShape({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M50 0c2.7 28.7 21.3 47.3 50 50-28.7 2.7-47.3 21.3-50 50C47.3 71.3 28.7 52.7 0 50 28.7 47.3 47.3 28.7 50 0Z" />
    </svg>
  );
}