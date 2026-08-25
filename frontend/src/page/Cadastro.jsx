import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/cadastro.png";
import bgVideo from "../assets/bg.mp4";
import { useAuth } from "../context/AuthContext";
import useBackgroundVideoEnabled from "../hooks/useBackgroundVideoEnabled";
import {
  getApiErrorMessage,
  getApiFieldError,
} from "../lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
  nome: "",
  telefone: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  foto: null,
  aceitouTermos: false,
};

export default function Cadastro() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const backgroundVideoEnabled = useBackgroundVideoEnabled();
  const pageRef = useRef(null);

  const [etapa, setEtapa] = useState(1);
  const [direcao, setDirecao] = useState("forward");
  const [form, setForm] = useState(INITIAL_FORM);
  const [erros, setErros] = useState({});
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [fotoPreview, setFotoPreview] = useState("");

  function handleFotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 2 * 1024 * 1024) {
      setErros((current) => ({ ...current, foto: "Use uma imagem JPG, PNG ou WebP de até 2 MB." }));
      event.target.value = "";
      return;
    }
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setForm((current) => ({ ...current, foto: file }));
    setFotoPreview(URL.createObjectURL(file));
    setErros((current) => ({ ...current, foto: "" }));
  }

  const iniciais = useMemo(() => {
    const partes = form.nome
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!partes.length) return "EU";

    return partes.map((parte) => parte[0]?.toUpperCase()).join("");
  }, [form.nome]);

  const criteriosSenha = useMemo(
    () => ({
      tamanho: form.senha.length >= 8,
      maiuscula: /[A-Z]/.test(form.senha),
      minuscula: /[a-z]/.test(form.senha),
      numero: /\d/.test(form.senha),
    }),
    [form.senha],
  );

  const pontuacaoSenha = Object.values(criteriosSenha).filter(Boolean).length;

  const forcaSenha = useMemo(() => {
    if (!form.senha) {
      return {
        texto: "Ainda não definida",
        classe: "empty",
      };
    }

    if (pontuacaoSenha <= 1) {
      return {
        texto: "Senha fraca",
        classe: "weak",
      };
    }

    if (pontuacaoSenha <= 3) {
      return {
        texto: "Senha razoável",
        classe: "medium",
      };
    }

    return {
      texto: "Senha excelente",
      classe: "strong",
    };
  }, [form.senha, pontuacaoSenha]);

  const progresso = etapa === 1 ? 18 : etapa === 2 ? 57 : 100;

  function atualizarCampo(campo, valor) {
    setForm((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));

    if (erros[campo]) {
      setErros((estadoAtual) => ({
        ...estadoAtual,
        [campo]: "",
      }));
    }
  }

  function formatarTelefone(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (!numeros) return "";

    if (numeros.length <= 2) {
      return `(${numeros}`;
    }

    if (numeros.length <= 6) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(
        2,
        6,
      )}-${numeros.slice(6)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7,
    )}-${numeros.slice(7)}`;
  }

  function handleTelefoneChange(event) {
    atualizarCampo("telefone", formatarTelefone(event.target.value));
  }

  function validarEtapa(etapaAtual) {
    const novosErros = {};

    if (etapaAtual === 1) {
      const nomeNormalizado = form.nome.trim();
      const telefoneNumerico = form.telefone.replace(/\D/g, "");

      if (!nomeNormalizado) {
        novosErros.nome = "Digite seu nome completo.";
      } else if (nomeNormalizado.length < 3) {
        novosErros.nome = "O nome precisa ter pelo menos 3 caracteres.";
      } else if (!nomeNormalizado.includes(" ")) {
        novosErros.nome = "Digite também o seu sobrenome.";
      }

      if (!telefoneNumerico) {
        novosErros.telefone = "Digite seu telefone.";
      } else if (
        telefoneNumerico.length !== 10 &&
        telefoneNumerico.length !== 11
      ) {
        novosErros.telefone = "Digite um telefone válido com DDD.";
      }
    }

    if (etapaAtual === 2) {
      const emailNormalizado = form.email.trim();

      if (!emailNormalizado) {
        novosErros.email = "Digite seu e-mail.";
      } else if (!EMAIL_REGEX.test(emailNormalizado)) {
        novosErros.email = "Digite um endereço de e-mail válido.";
      }
    }

    if (etapaAtual === 3) {
      if (!form.senha) {
        novosErros.senha = "Crie uma senha.";
      } else if (pontuacaoSenha < 4) {
        novosErros.senha =
          "A senha precisa atender a todos os requisitos.";
      }

      if (!form.confirmarSenha) {
        novosErros.confirmarSenha = "Confirme sua senha.";
      } else if (form.confirmarSenha !== form.senha) {
        novosErros.confirmarSenha = "As senhas não são iguais.";
      }

      if (!form.aceitouTermos) {
        novosErros.aceitouTermos =
          "Você precisa aceitar os termos para continuar.";
      }
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  function proximaEtapa() {
    if (!validarEtapa(etapa)) return;

    setDirecao("forward");
    setEtapa((etapaAtual) => Math.min(etapaAtual + 1, 3));
  }

  function etapaAnterior() {
    setDirecao("backward");
    setErros({});
    setEtapa((etapaAtual) => Math.max(etapaAtual - 1, 1));
  }

  async function handleCadastro(event) {
    event.preventDefault();

    if (etapa < 3) {
      proximaEtapa();
      return;
    }

    if (carregando || !validarEtapa(3)) return;

    setCarregando(true);

    try {
      const payload = new FormData();
      payload.append("name", form.nome.trim());
      payload.append("email", form.email.trim().toLowerCase());
      payload.append("telefone", form.telefone.replace(/\D/g, ""));
      payload.append("password", form.senha);
      payload.append("password_confirmation", form.confirmarSenha);
      payload.append("accepted_terms", "1");
      if (form.foto) payload.append("foto", form.foto);

      await register(payload);

      setConcluido(true);

      await new Promise((resolve) => setTimeout(resolve, 1400));

      navigate("/login", {
        replace: true,
        state: {
          cadastroRealizado: true,
          email: form.email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      const apiErrors = {
        nome: getApiFieldError(error, "name", "nome"),
        telefone: getApiFieldError(error, "telefone", "phone"),
        email: getApiFieldError(error, "email"),
        senha: getApiFieldError(error, "password", "senha"),
        confirmarSenha: getApiFieldError(
          error,
          "password_confirmation",
          "confirmarSenha",
        ),
        aceitouTermos: getApiFieldError(
          error,
          "accepted_terms",
          "aceitouTermos",
        ),
        foto: getApiFieldError(error, "foto"),
      };

      const hasFieldError = Object.values(apiErrors).some(Boolean);

      setErros({
        ...apiErrors,
        cadastro: hasFieldError
          ? ""
          : getApiErrorMessage(
              error,
              "Não foi possível criar sua conta. Tente novamente.",
            ),
      });

      if (apiErrors.nome || apiErrors.telefone) {
        setDirecao("backward");
        setEtapa(1);
      } else if (apiErrors.email) {
        setDirecao("backward");
        setEtapa(2);
      }
    } finally {
      setCarregando(false);
    }
  }

  function handlePointerMove(event) {
    const page = pageRef.current;

    if (!page || !window.matchMedia("(pointer: fine)").matches) return;

    const rect = page.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const normalizedX = x / rect.width - 0.5;
    const normalizedY = y / rect.height - 0.5;

    page.style.setProperty("--mouse-x", `${x}px`);
    page.style.setProperty("--mouse-y", `${y}px`);
    page.style.setProperty("--move-x", `${normalizedX * 20}px`);
    page.style.setProperty("--move-y", `${normalizedY * 16}px`);
    page.style.setProperty("--move-x-reverse", `${normalizedX * -15}px`);
    page.style.setProperty("--move-y-reverse", `${normalizedY * -12}px`);
  }

  function detectarCapsLock(event) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  return (
    <>
      <style>{`
        :root {
          color-scheme: light;
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

        .register-page,
        .register-page * {
          box-sizing: border-box;
        }

        .register-page {
          --paper: #f5f1e9;
          --paper-light: #fffdf8;
          --ink: #17171a;
          --pink: #ff4f8b;
          --pink-dark: #df3471;
          --blue: #64c7ee;
          --yellow: #ffd447;
          --lime: #baf26d;
          --violet: #9183ff;
          --orange: #ff9466;
          --muted: #706a64;

          --mouse-x: 50%;
          --mouse-y: 50%;
          --move-x: 0px;
          --move-y: 0px;
          --move-x-reverse: 0px;
          --move-y-reverse: 0px;

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
              rgba(145, 131, 255, 0.15),
              transparent 19rem
            ),
            linear-gradient(
              135deg,
              rgba(255, 79, 139, 0.1),
              transparent 31%
            ),
            linear-gradient(
              315deg,
              rgba(100, 199, 238, 0.12),
              transparent 35%
            ),
            var(--paper);
          font-family:
            Inter,
            "SF Pro Display",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .register-page::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -20;
          pointer-events: none;
          background-image:
            linear-gradient(
              rgba(23, 23, 26, 0.045) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(23, 23, 26, 0.045) 1px,
              transparent 1px
            );
          background-size: 52px 52px;
          mask-image: linear-gradient(
            to bottom,
            black,
            rgba(0, 0, 0, 0.5) 60%,
            transparent
          );
        }

        .register-page::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 50;
          opacity: 0.052;
          pointer-events: none;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.9'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px;
        }

        .register-blob {
          position: absolute;
          z-index: -12;
          border: 3px solid var(--ink);
          pointer-events: none;
        }

        .register-blob--yellow {
          top: -10rem;
          left: 23%;
          width: 23rem;
          height: 23rem;
          border-radius: 42% 58% 35% 65% / 52% 36% 64% 48%;
          background: var(--yellow);
          transform:
            translate(var(--move-x-reverse), var(--move-y-reverse))
            rotate(19deg);
          animation: morphShape 12s ease-in-out infinite;
        }

        .register-blob--violet {
          right: -12rem;
          bottom: -13rem;
          width: 29rem;
          height: 29rem;
          border-radius: 61% 39% 49% 51% / 37% 58% 42% 63%;
          background: var(--violet);
          transform:
            translate(var(--move-x), var(--move-y))
            rotate(-13deg);
          animation: morphShape 15s ease-in-out infinite reverse;
        }

        .register-header {
          position: relative;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          min-height: 6rem;
          padding:
            1.25rem
            clamp(1.25rem, 4vw, 4.75rem);
          animation: headerReveal 800ms 100ms cubic-bezier(.2,.8,.2,1)
            both;
        }

        .register-logo-button {
          display: inline-flex;
          align-items: center;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .register-logo {
          display: block;
          width: clamp(8.5rem, 11vw, 11.5rem);
          max-height: 4rem;
          object-fit: contain;
          object-position: left center;
          filter:
            drop-shadow(4px 4px 0 rgba(255, 79, 139, 0.24))
            drop-shadow(8px 8px 0 rgba(100, 199, 238, 0.17));
          transition:
            transform 250ms cubic-bezier(.2,.8,.2,1),
            filter 250ms ease;
        }

        .register-logo-button:hover .register-logo {
          transform: translateY(-3px) rotate(-1deg);
          filter:
            drop-shadow(6px 6px 0 rgba(255, 79, 139, 0.32))
            drop-shadow(10px 10px 0 rgba(100, 199, 238, 0.23));
        }

        .register-header-center {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.62rem 0.85rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--lime);
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          box-shadow: 4px 4px 0 var(--ink);
          transform: rotate(-1deg);
        }

        .register-header-center svg {
          width: 0.9rem;
          height: 0.9rem;
        }

        .login-access {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .login-access-text {
          color: var(--muted);
          font-size: 0.875rem;
          font-weight: 700;
        }

        .login-access-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          min-height: 2.9rem;
          padding: 0.72rem 1rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--blue);
          color: var(--ink);
          font-size: 0.875rem;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 5px 5px 0 var(--ink);
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            box-shadow 220ms ease,
            background 220ms ease;
        }

        .login-access-button:hover {
          background: var(--yellow);
          transform: translate(-2px, -2px) rotate(1deg);
          box-shadow: 8px 8px 0 var(--ink);
        }

        .login-access-button:active {
          transform: translate(3px, 3px);
          box-shadow: 2px 2px 0 var(--ink);
        }

        .login-access-button svg {
          width: 1rem;
          height: 1rem;
        }

        .register-layout {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: minmax(360px, 0.85fr) minmax(460px, 1.15fr);
          gap: clamp(3rem, 7vw, 8rem);
          align-items: center;
          width: min(100%, 1560px);
          min-height: calc(100vh - 6rem);
          min-height: calc(100dvh - 6rem);
          margin: 0 auto;
          padding:
            1rem
            clamp(1.25rem, 4vw, 4.75rem)
            clamp(3rem, 7vh, 5rem);
        }

        .passport-stage {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          min-height: 39rem;
          animation: stageReveal 950ms 280ms cubic-bezier(.2,.8,.2,1)
            both;
        }

        .passport-back {
          position: absolute;
          width: min(92%, 29rem);
          height: 37rem;
          border: 3px solid var(--ink);
          border-radius: 2rem;
          background: var(--pink);
          transform: translate(17px, 17px) rotate(5deg);
        }

        .passport {
          position: relative;
          z-index: 4;
          width: min(92%, 29rem);
          min-height: 37rem;
          overflow: hidden;
          border: 3px solid var(--ink);
          border-radius: 2rem;
          background: var(--paper-light);
          box-shadow: 0 28px 70px rgba(23, 23, 26, 0.15);
          transform:
            translate(var(--move-x-reverse), var(--move-y-reverse))
            rotate(-2deg);
          transition: transform 170ms ease-out;
        }

        .passport-top {
          position: relative;
          min-height: 15rem;
          overflow: hidden;
          border-bottom: 3px solid var(--ink);
          background: var(--blue);
        }

        .passport-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.06) contrast(1.05);
          transform: scale(1.04);
        }

        .passport-video-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              135deg,
              rgba(255, 79, 139, 0.18),
              transparent 42%
            ),
            linear-gradient(
              to top,
              rgba(23, 23, 26, 0.62),
              transparent 68%
            );
        }

        .passport-live-label {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          align-items: center;
          gap: 0.48rem;
          padding: 0.45rem 0.65rem;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--paper-light);
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          box-shadow: 3px 3px 0 var(--ink);
        }

        .passport-live-dot {
          width: 0.48rem;
          height: 0.48rem;
          border: 2px solid var(--ink);
          border-radius: 50%;
          background: var(--lime);
          animation: livePulse 1.8s ease-in-out infinite;
        }

        .passport-initials {
          position: absolute;
          left: 1.25rem;
          bottom: 1.15rem;
          display: grid;
          place-items: center;
          width: 4.8rem;
          height: 4.8rem;
          border: 3px solid var(--ink);
          border-radius: 1.2rem;
          background: var(--yellow);
          color: var(--ink);
          font-size: 1.65rem;
          font-weight: 950;
          letter-spacing: -0.08em;
          box-shadow: 5px 5px 0 var(--ink);
          transform: rotate(-4deg);
        }

        .passport-initials img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .field-group--photo { grid-column: 1 / -1; }
        .register-photo-picker { display: flex; min-height: 76px; align-items: center; gap: 14px; padding: 10px 14px; border: 2px dashed rgba(23,23,26,.28); border-radius: 16px; background: rgba(255,255,255,.55); cursor: pointer; font-size: 14px; font-weight: 850; }
        .register-photo-picker:hover { border-color: #9183ff; background: rgba(145,131,255,.08); }
        .register-photo-picker input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
        .register-photo-picker__preview { display: grid; width: 52px; height: 52px; flex: 0 0 auto; place-items: center; overflow: hidden; border: 2px solid #17171a; border-radius: 14px; background: #64c7ee; }
        .register-photo-picker__preview img { width: 100%; height: 100%; object-fit: cover; }
        .register-photo-picker__preview svg { width: 22px; height: 22px; }

        .passport-stamp {
          position: absolute;
          right: 1rem;
          bottom: 1.2rem;
          display: grid;
          place-items: center;
          width: 6.2rem;
          height: 6.2rem;
          border: 3px solid var(--paper-light);
          border-radius: 50%;
          color: var(--paper-light);
          font-size: 0.875rem;
          font-weight: 950;
          line-height: 1.25;
          letter-spacing: 0.12em;
          text-align: center;
          text-transform: uppercase;
          transform: rotate(12deg);
        }

        .passport-stamp::before {
          content: "";
          position: absolute;
          inset: 0.35rem;
          border: 2px dashed currentColor;
          border-radius: inherit;
        }

        .passport-content {
          padding: 1.55rem;
        }

        .passport-kicker {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.2rem;
          padding-bottom: 0.9rem;
          border-bottom: 2px dashed rgba(23, 23, 26, 0.25);
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .passport-code {
          font-family: "Courier New", monospace;
          color: #8b837c;
        }

        .passport-name {
          min-height: 2.5rem;
          margin: 0;
          overflow: hidden;
          color: var(--ink);
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          font-weight: 950;
          line-height: 0.92;
          letter-spacing: -0.07em;
          text-transform: uppercase;
          text-overflow: ellipsis;
        }

        .passport-name--empty {
          color: #aaa29a;
        }

        .passport-status {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 0.8rem;
          padding: 0.42rem 0.58rem;
          border: 2px solid var(--ink);
          border-radius: 0.55rem;
          background: var(--lime);
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 3px 3px 0 var(--ink);
          transform: rotate(-1deg);
        }

        .passport-data {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
          margin-top: 1.35rem;
        }

        .passport-data-item {
          min-width: 0;
          padding: 0.8rem;
          border: 2px solid var(--ink);
          border-radius: 0.85rem;
          background: #ffffff;
          box-shadow: 3px 3px 0 rgba(23, 23, 26, 0.12);
        }

        .passport-data-item--email {
          grid-column: 1 / -1;
          background: #fff6bf;
        }

        .passport-data-label {
          display: block;
          margin-bottom: 0.3rem;
          color: #8b837c;
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .passport-data-value {
          display: block;
          overflow: hidden;
          color: var(--ink);
          font-size: 0.875rem;
          font-weight: 850;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .passport-data-placeholder {
          color: #aca59e;
        }

        .passport-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1.4rem;
        }

        .passport-barcode {
          display: flex;
          align-items: stretch;
          gap: 2px;
          height: 2.7rem;
        }

        .passport-barcode span {
          display: block;
          width: 2px;
          background: var(--ink);
        }

        .passport-barcode span:nth-child(3n) {
          width: 4px;
        }

        .passport-barcode span:nth-child(4n) {
          height: 78%;
        }

        .passport-number {
          color: #817a73;
          font-family: "Courier New", monospace;
          font-size: 0.875rem;
          font-weight: 900;
          letter-spacing: 0.11em;
          writing-mode: vertical-rl;
        }

        .floating-sticker {
          position: absolute;
          z-index: 8;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--ink);
          color: var(--ink);
          font-weight: 950;
          text-align: center;
          text-transform: uppercase;
          box-shadow: 5px 5px 0 var(--ink);
          pointer-events: none;
        }

        .floating-sticker--start {
          top: 3%;
          right: -1%;
          width: 7.4rem;
          min-height: 4.8rem;
          padding: 0.7rem;
          border-radius: 50%;
          background: var(--yellow);
          font-size: 0.875rem;
          line-height: 1.25;
          letter-spacing: 0.07em;
          transform:
            translate(var(--move-x), var(--move-y))
            rotate(12deg);
          animation: stickerFloat 4.5s ease-in-out infinite;
        }

        .floating-sticker--unique {
          left: -2%;
          bottom: 9%;
          width: 6.4rem;
          height: 6.4rem;
          border-radius: 1.2rem;
          background: var(--violet);
          color: #fff;
          font-size: 0.875rem;
          line-height: 1.3;
          letter-spacing: 0.08em;
          transform:
            translate(var(--move-x), var(--move-y))
            rotate(-11deg);
          animation: stickerFloat 5.4s ease-in-out infinite reverse;
        }

        .register-workspace {
          position: relative;
          min-width: 0;
          animation: workspaceReveal 1s 360ms cubic-bezier(.16,.84,.2,1)
            both;
        }

        .workspace-heading {
          max-width: 44rem;
          margin-bottom: 1.8rem;
        }

        .workspace-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          margin-bottom: 0.85rem;
          padding: 0.45rem 0.62rem;
          border: 2px solid var(--ink);
          border-radius: 0.6rem;
          background: var(--pink);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 3px 3px 0 var(--ink);
          transform: rotate(-1.5deg);
        }

        .workspace-eyebrow svg {
          width: 0.85rem;
          height: 0.85rem;
        }

        .workspace-title {
          margin: 0;
          color: var(--ink);
          font-size: clamp(3rem, 5.6vw, 6rem);
          font-weight: 950;
          line-height: 0.82;
          letter-spacing: -0.085em;
          text-transform: uppercase;
        }

        .workspace-title-highlight {
          position: relative;
          display: inline-block;
          color: var(--paper-light);
          text-shadow:
            -2px -2px 0 var(--ink),
            2px -2px 0 var(--ink),
            -2px 2px 0 var(--ink),
            2px 2px 0 var(--ink),
            6px 6px 0 var(--blue);
          transform: rotate(-1deg);
        }

        .workspace-description {
          max-width: 35rem;
          margin: 1.15rem 0 0;
          color: #58524d;
          font-size: 0.9rem;
          font-weight: 650;
          line-height: 1.65;
        }

        .form-machine-back {
          position: absolute;
          inset: 0;
          border: 3px solid var(--ink);
          border-radius: 1.8rem;
          background: var(--blue);
          transform: translate(12px, 13px) rotate(1.2deg);
        }

        .form-machine {
          position: relative;
          z-index: 3;
          overflow: hidden;
          border: 3px solid var(--ink);
          border-radius: 1.8rem;
          background: var(--paper-light);
          box-shadow: 0 28px 70px rgba(23, 23, 26, 0.14);
        }

        .machine-progress {
          position: relative;
          padding: 1.3rem 1.5rem 1.15rem;
          border-bottom: 3px solid var(--ink);
          background: #ffffff;
        }

        .progress-track {
          position: relative;
          width: 100%;
          height: 0.75rem;
          overflow: hidden;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: #ece7df;
          box-shadow: 2px 2px 0 var(--ink);
        }

        .progress-fill {
          position: absolute;
          inset: 0 auto 0 0;
          width: var(--progress);
          border-right: 2px solid var(--ink);
          background:
            repeating-linear-gradient(
              -45deg,
              rgba(255, 255, 255, 0.25),
              rgba(255, 255, 255, 0.25) 7px,
              transparent 7px,
              transparent 14px
            ),
            var(--pink);
          transition: width 520ms cubic-bezier(.2,.8,.2,1);
        }

        .progress-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .progress-step {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          min-width: 0;
          color: #aaa29a;
          transition: color 250ms ease;
        }

        .progress-step--active,
        .progress-step--complete {
          color: var(--ink);
        }

        .progress-step-number {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 1.75rem;
          height: 1.75rem;
          border: 2px solid var(--ink);
          border-radius: 0.55rem;
          background: #e8e2da;
          font-size: 0.875rem;
          font-weight: 950;
          box-shadow: 2px 2px 0 var(--ink);
          transition:
            background 250ms ease,
            transform 250ms ease;
        }

        .progress-step--active .progress-step-number {
          background: var(--yellow);
          transform: rotate(-5deg);
        }

        .progress-step--complete .progress-step-number {
          background: var(--lime);
        }

        .progress-step-label {
          overflow: hidden;
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.07em;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .machine-body {
          min-height: 24rem;
          padding: clamp(1.3rem, 3vw, 2rem);
        }

        .step-content {
          animation: stepForward 380ms cubic-bezier(.2,.8,.2,1) both;
        }

        .step-content--backward {
          animation-name: stepBackward;
        }

        .step-header {
          margin-bottom: 1.35rem;
        }

        .step-counter {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.7rem;
          color: var(--pink-dark);
          font-family: "Courier New", monospace;
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .step-title {
          margin: 0;
          color: var(--ink);
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 950;
          line-height: 0.95;
          letter-spacing: -0.06em;
          text-transform: uppercase;
        }

        .step-description {
          margin: 0.6rem 0 0;
          color: var(--muted);
          font-size: 0.875rem;
          font-weight: 650;
          line-height: 1.55;
        }

        .register-form {
          display: flex;
          flex-direction: column;
        }

        .field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .field-grid--single {
          grid-template-columns: 1fr;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
        }

        .field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0 0.1rem;
          color: var(--ink);
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .field-label-detail {
          color: #a59e97;
          font-size: 0.875rem;
          font-weight: 850;
        }

        .field-shell {
          position: relative;
          display: flex;
          align-items: center;
          min-height: 3.65rem;
          border: 2px solid var(--ink);
          border-radius: 0.95rem;
          background: #ffffff;
          box-shadow: 4px 4px 0 rgba(23, 23, 26, 0.13);
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            box-shadow 220ms ease,
            background 220ms ease;
        }

        .field-shell:focus-within {
          background: #fffdf8;
          transform: translate(-2px, -2px);
          box-shadow:
            7px 7px 0 var(--yellow),
            9px 9px 0 var(--ink);
        }

        .field-shell--error {
          background: #fff1f4;
          box-shadow:
            5px 5px 0 #ff8da5,
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
          height: 3.55rem;
          padding: 0 1rem 0 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--ink);
          caret-color: var(--pink);
          font-size: 0.875rem;
          font-weight: 760;
        }

        .field-input::placeholder {
          color: #aaa39b;
          font-weight: 620;
        }

        .field-input:-webkit-autofill,
        .field-input:-webkit-autofill:hover,
        .field-input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--ink);
          transition: background-color 9999s ease-out;
          box-shadow: 0 0 0 1000px transparent inset;
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
          width: 1.04rem;
          height: 1.04rem;
        }

        .field-error,
        .caps-warning,
        .form-error {
          display: flex;
          align-items: center;
          gap: 0.42rem;
          padding-left: 0.12rem;
          font-size: 0.875rem;
          font-weight: 800;
          line-height: 1.4;
          animation: feedbackReveal 220ms ease both;
        }

        .field-error,
        .form-error {
          color: #ce2f56;
        }

        .caps-warning {
          color: #96600d;
        }

        .field-error svg,
        .caps-warning svg,
        .form-error svg {
          flex: 0 0 auto;
          width: 0.8rem;
          height: 0.8rem;
        }

        .contact-preview {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.85rem;
          align-items: center;
          margin-top: 1rem;
          padding: 0.9rem;
          border: 2px dashed var(--ink);
          border-radius: 1rem;
          background: rgba(100, 199, 238, 0.13);
        }

        .contact-preview-icon {
          display: grid;
          place-items: center;
          width: 2.7rem;
          height: 2.7rem;
          border: 2px solid var(--ink);
          border-radius: 0.8rem;
          background: var(--blue);
          box-shadow: 3px 3px 0 var(--ink);
          transform: rotate(-4deg);
        }

        .contact-preview-icon svg {
          width: 1.15rem;
          height: 1.15rem;
        }

        .contact-preview-title {
          display: block;
          margin-bottom: 0.18rem;
          font-size: 0.875rem;
          font-weight: 950;
        }

        .contact-preview-description {
          color: var(--muted);
          font-size: 0.875rem;
          font-weight: 650;
          line-height: 1.4;
        }

        .password-strength {
          margin-top: 0.85rem;
          padding: 0.9rem;
          border: 2px dashed var(--ink);
          border-radius: 1rem;
          background: #f6f2eb;
        }

        .password-strength-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.65rem;
        }

        .password-strength-label,
        .password-strength-value {
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .password-strength-value--empty {
          color: #9d958e;
        }

        .password-strength-value--weak {
          color: #d73257;
        }

        .password-strength-value--medium {
          color: #b27300;
        }

        .password-strength-value--strong {
          color: #287a35;
        }

        .password-bars {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.35rem;
        }

        .password-bar {
          height: 0.48rem;
          border: 1.5px solid var(--ink);
          border-radius: 999px;
          background: #ddd6ce;
          transition:
            background 220ms ease,
            transform 220ms ease;
        }

        .password-bar--active {
          background: var(--pink);
          transform: translateY(-1px);
        }

        .password-bar--active:nth-child(2) {
          background: var(--orange);
        }

        .password-bar--active:nth-child(3) {
          background: var(--yellow);
        }

        .password-bar--active:nth-child(4) {
          background: var(--lime);
        }

        .password-criteria {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-top: 0.8rem;
        }

        .password-criterion {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #938b84;
          font-size: 0.875rem;
          font-weight: 750;
          transition: color 200ms ease;
        }

        .password-criterion--complete {
          color: #287a35;
        }

        .criterion-icon {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 1rem;
          height: 1rem;
          border: 1.5px solid currentColor;
          border-radius: 50%;
        }

        .criterion-icon svg {
          width: 0.6rem;
          height: 0.6rem;
        }

        .terms-control {
          display: flex;
          align-items: flex-start;
          gap: 0.7rem;
          margin-top: 1rem;
          padding: 0.9rem;
          border: 2px solid var(--ink);
          border-radius: 0.95rem;
          background: #ffffff;
          box-shadow: 3px 3px 0 rgba(23, 23, 26, 0.12);
          cursor: pointer;
          user-select: none;
          transition:
            transform 200ms ease,
            box-shadow 200ms ease;
        }

        .terms-control:hover {
          transform: translate(-1px, -1px);
          box-shadow: 5px 5px 0 rgba(23, 23, 26, 0.16);
        }

        .terms-input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .terms-checkbox {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid var(--ink);
          border-radius: 0.35rem;
          background: #ffffff;
          box-shadow: 2px 2px 0 var(--ink);
          transition:
            background 200ms ease,
            transform 200ms ease,
            box-shadow 200ms ease;
        }

        .terms-checkbox svg {
          width: 0.74rem;
          height: 0.74rem;
          opacity: 0;
          transform: scale(0.4) rotate(-20deg);
          transition:
            opacity 170ms ease,
            transform 220ms cubic-bezier(.2,.8,.2,1);
        }

        .terms-input:checked + .terms-checkbox {
          background: var(--lime);
          transform: translate(1px, 1px) rotate(-3deg);
          box-shadow: 1px 1px 0 var(--ink);
        }

        .terms-input:checked + .terms-checkbox svg {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .terms-input:focus-visible + .terms-checkbox {
          outline: 3px solid rgba(100, 199, 238, 0.5);
          outline-offset: 3px;
        }

        .terms-text {
          color: var(--muted);
          font-size: 0.875rem;
          font-weight: 650;
          line-height: 1.55;
        }

        .terms-text strong,
        .terms-link {
          color: var(--ink);
          font-weight: 900;
          text-decoration: underline;
          text-decoration-color: var(--pink);
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
        }

        .terms-link:focus-visible {
          border-radius: 0.2rem;
          outline: 3px solid rgba(100, 199, 238, 0.5);
          outline-offset: 2px;
        }

        .machine-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.3rem;
          border-top: 2px dashed rgba(23, 23, 26, 0.24);
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-height: 3.3rem;
          padding: 0.7rem 1rem;
          border: 2px solid var(--ink);
          border-radius: 0.9rem;
          background: #ffffff;
          color: var(--ink);
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 4px 4px 0 var(--ink);
          transition:
            transform 200ms ease,
            box-shadow 200ms ease,
            background 200ms ease;
        }

        .back-button:hover {
          background: var(--blue);
          transform: translate(-2px, -2px);
          box-shadow: 7px 7px 0 var(--ink);
        }

        .back-button:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 var(--ink);
        }

        .back-button svg {
          width: 1rem;
          height: 1rem;
        }

        .next-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 0.65rem;
          min-height: 3.45rem;
          padding: 0.75rem 1.2rem;
          border: 3px solid var(--ink);
          border-radius: 0.95rem;
          overflow: hidden;
          background: var(--ink);
          color: #ffffff;
          font-size: 0.875rem;
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

        .next-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.06) 10px,
              rgba(255, 255, 255, 0.06) 20px
            );
          transform: translateX(-100%);
          transition: transform 550ms cubic-bezier(.2,.8,.2,1);
        }

        .next-button:hover {
          background: var(--yellow);
          color: var(--ink);
          transform: translate(-3px, -3px) rotate(-0.5deg);
          box-shadow:
            9px 9px 0 var(--pink),
            12px 12px 0 var(--ink);
        }

        .next-button:hover::before {
          transform: translateX(0);
        }

        .next-button:active {
          transform: translate(4px, 4px);
          box-shadow: 2px 2px 0 var(--pink);
        }

        .next-button:disabled {
          cursor: wait;
          opacity: 0.88;
        }

        .next-button-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
        }

        .next-button-content svg {
          width: 1rem;
          height: 1rem;
          transition: transform 220ms ease;
        }

        .next-button:hover .next-button-content svg {
          transform: translateX(5px) rotate(-7deg);
        }

        .loading-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spinnerRotate 700ms linear infinite;
        }

        .next-button:hover .loading-spinner {
          border-color: rgba(23, 23, 26, 0.25);
          border-top-color: var(--ink);
        }

        .success-overlay {
          position: absolute;
          inset: 0;
          z-index: 35;
          display: grid;
          place-items: center;
          padding: 1.5rem;
          background: rgba(245, 241, 233, 0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          animation: successReveal 350ms ease both;
        }

        .success-card {
          position: relative;
          width: min(100%, 27rem);
          padding: 2rem;
          border: 3px solid var(--ink);
          border-radius: 1.8rem;
          background: var(--lime);
          text-align: center;
          box-shadow:
            10px 10px 0 var(--pink),
            14px 14px 0 var(--ink);
          transform: rotate(-1deg);
          animation: successCardReveal 550ms cubic-bezier(.2,.8,.2,1)
            both;
        }

        .success-icon {
          display: grid;
          place-items: center;
          width: 5rem;
          height: 5rem;
          margin: 0 auto 1.2rem;
          border: 3px solid var(--ink);
          border-radius: 1.3rem;
          background: var(--yellow);
          box-shadow: 5px 5px 0 var(--ink);
          transform: rotate(-5deg);
        }

        .success-icon svg {
          width: 2.3rem;
          height: 2.3rem;
        }

        .success-title {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 950;
          line-height: 0.92;
          letter-spacing: -0.07em;
          text-transform: uppercase;
        }

        .success-description {
          margin: 1rem 0 0;
          color: #43403d;
          font-size: 0.875rem;
          font-weight: 750;
          line-height: 1.55;
        }

        .success-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          margin-top: 1.25rem;
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .success-loading-dots {
          display: flex;
          gap: 0.25rem;
        }

        .success-loading-dot {
          width: 0.42rem;
          height: 0.42rem;
          border: 1.5px solid var(--ink);
          border-radius: 50%;
          background: var(--pink);
          animation: loadingDot 900ms ease-in-out infinite;
        }

        .success-loading-dot:nth-child(2) {
          animation-delay: 120ms;
        }

        .success-loading-dot:nth-child(3) {
          animation-delay: 240ms;
        }

        .side-marquee {
          position: absolute;
          z-index: 15;
          top: 6rem;
          right: 0;
          bottom: 0;
          width: 2.3rem;
          overflow: hidden;
          border-left: 2px solid var(--ink);
          background: var(--yellow);
        }

        .side-marquee-track {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: max-content;
          animation: verticalMarquee 18s linear infinite;
        }

        .side-marquee-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 0;
          font-size: 0.875rem;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          writing-mode: vertical-rl;
        }

        .side-marquee-item svg {
          width: 0.85rem;
          height: 0.85rem;
        }

        .register-page button:focus-visible {
          outline: 3px solid var(--violet);
          outline-offset: 4px;
        }

        @keyframes morphShape {
          0%,
          100% {
            border-radius: 42% 58% 35% 65% / 52% 36% 64% 48%;
          }

          33% {
            border-radius: 63% 37% 55% 45% / 41% 62% 38% 59%;
          }

          66% {
            border-radius: 35% 65% 47% 53% / 64% 42% 58% 36%;
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

        @keyframes stageReveal {
          from {
            opacity: 0;
            transform: translateX(-2rem) rotate(-3deg);
            filter: blur(8px);
          }

          to {
            opacity: 1;
            transform: translateX(0) rotate(0);
            filter: blur(0);
          }
        }

        @keyframes workspaceReveal {
          from {
            opacity: 0;
            transform: translateX(2rem);
            filter: blur(8px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        @keyframes stickerFloat {
          0%,
          100% {
            translate: 0 0;
          }

          50% {
            translate: 0 -0.65rem;
          }
        }

        @keyframes livePulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(0.68);
          }
        }

        @keyframes stepForward {
          from {
            opacity: 0;
            transform: translateX(1.4rem);
            filter: blur(4px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        @keyframes stepBackward {
          from {
            opacity: 0;
            transform: translateX(-1.4rem);
            filter: blur(4px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
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

        @keyframes successReveal {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes successCardReveal {
          from {
            opacity: 0;
            transform: scale(0.86) rotate(6deg);
          }

          to {
            opacity: 1;
            transform: scale(1) rotate(-1deg);
          }
        }

        @keyframes loadingDot {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-0.4rem);
          }
        }

        @keyframes verticalMarquee {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(-50%);
          }
        }

        @media (max-width: 1250px) {
          .register-layout {
            grid-template-columns: minmax(330px, 0.78fr) minmax(430px, 1.22fr);
            gap: 4rem;
          }

          .passport-stage {
            min-height: 36rem;
          }

          .passport,
          .passport-back {
            min-height: 35rem;
          }
        }

        @media (max-width: 1020px) {
          .register-page {
            overflow-x: hidden;
            overflow-y: auto;
          }

          .register-header-center {
            display: none;
          }

          .register-layout {
            display: flex;
            flex-direction: column-reverse;
            gap: 4rem;
            min-height: auto;
            padding-bottom: 5rem;
          }

          .register-workspace {
            width: min(100%, 48rem);
          }

          .passport-stage {
            width: min(100%, 38rem);
            min-height: 39rem;
          }

          .passport,
          .passport-back {
            width: min(88%, 30rem);
          }

          .workspace-heading {
            max-width: 40rem;
          }

          .side-marquee {
            display: none;
          }
        }

        @media (max-width: 680px) {
          .register-header {
            min-height: 5.3rem;
            padding: 1rem;
          }

          .register-logo {
            width: 7.7rem;
          }

          .login-access-text {
            display: none;
          }

          .login-access-button {
            min-height: 2.6rem;
            padding: 0.62rem 0.8rem;
            font-size: 0.875rem;
            box-shadow: 4px 4px 0 var(--ink);
          }

          .register-layout {
            gap: 3rem;
            padding:
              1rem
              1rem
              4rem;
          }

          .workspace-title {
            font-size: clamp(3rem, 14vw, 5rem);
          }

          .workspace-description {
            font-size: 0.875rem;
          }

          .form-machine-back {
            transform: translate(8px, 9px) rotate(0.8deg);
          }

          .form-machine {
            border-radius: 1.4rem;
          }

          .machine-progress {
            padding: 1rem;
          }

          .progress-step {
            justify-content: center;
          }

          .progress-step-label {
            display: none;
          }

          .progress-step-number {
            width: 2rem;
            height: 2rem;
          }

          .machine-body {
            min-height: 26rem;
            padding: 1.2rem 1rem 1.3rem;
          }

          .field-grid {
            grid-template-columns: 1fr;
          }

          .field-shell {
            min-height: 3.5rem;
          }

          .field-input {
            height: 3.4rem;
            font-size: 0.875rem;
          }

          .field-icon {
            width: 2.9rem;
          }

          .password-criteria {
            grid-template-columns: 1fr;
          }

          .machine-actions {
            align-items: stretch;
          }

          .back-button {
            width: 3.4rem;
            padding: 0;
          }

          .back-button span {
            display: none;
          }

          .passport-stage {
            min-height: 36rem;
          }

          .passport,
          .passport-back {
            width: 92%;
            min-height: 34rem;
          }

          .passport-top {
            min-height: 13rem;
          }

          .passport-content {
            padding: 1.2rem;
          }

          .passport-name {
            font-size: 2rem;
          }

          .floating-sticker--start {
            right: -1%;
            width: 6rem;
            min-height: 4rem;
          }

          .floating-sticker--unique {
            left: -1%;
            bottom: 6%;
            width: 5.5rem;
            height: 5.5rem;
          }
        }

        @media (max-width: 410px) {
          .login-access-button span {
            display: none;
          }

          .login-access-button {
            width: 2.7rem;
            padding: 0;
          }

          .workspace-title {
            font-size: 3.15rem;
          }

          .machine-body {
            padding-inline: 0.85rem;
          }

          .step-title {
            font-size: 1.8rem;
          }

          .passport-data {
            grid-template-columns: 1fr;
          }

          .passport-data-item--email {
            grid-column: auto;
          }

          .passport-stage {
            min-height: 39rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .register-page *,
          .register-page *::before,
          .register-page *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .passport,
          .register-blob {
            transform: none !important;
          }
        }
      `}</style>

      <main
        ref={pageRef}
        className="register-page"
        onPointerMove={handlePointerMove}
      >
        <div
          className="register-blob register-blob--yellow"
          aria-hidden="true"
        />

        <div
          className="register-blob register-blob--violet"
          aria-hidden="true"
        />

        <header className="register-header">
          <button
            type="button"
            className="register-logo-button"
            onClick={() => navigate("/")}
            aria-label="Voltar para a página inicial"
          >
            <img
              src={logo}
              alt="Logo da plataforma"
              className="register-logo"
            />
          </button>

          <div className="register-header-center">
            <SparklesIcon />
            Criando novas possibilidades
          </div>

          <div className="login-access">
            <span className="login-access-text">
              Já possui uma conta?
            </span>

            <button
              type="button"
              className="login-access-button"
              onClick={() => navigate("/login")}
            >
              <span>Fazer login</span>
              <ArrowUpRightIcon />
            </button>
          </div>
        </header>

        <div className="register-layout">
          <section
            className="passport-stage"
            aria-label="Prévia do seu perfil"
          >
            <div className="passport-back" aria-hidden="true" />

            <article className="passport">
              <div className="passport-top">
                {backgroundVideoEnabled && (
                  <video
                    className="passport-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                  >
                    <source src={bgVideo} type="video/mp4" />
                  </video>
                )}

                <div
                  className="passport-video-overlay"
                  aria-hidden="true"
                />

                <div className="passport-live-label">
                  <span className="passport-live-dot" />
                  Perfil em construção
                </div>

                <div className="passport-initials">
                  {fotoPreview ? <img src={fotoPreview} alt="Prévia da sua foto" /> : iniciais}
                </div>

                <div className="passport-stamp">
                  Banco
                  <br />
                  de talentos
                </div>
              </div>

              <div className="passport-content">
                <div className="passport-kicker">
                  <span>Passaporte profissional</span>
                  <span className="passport-code">
                    BR · 2026
                  </span>
                </div>

                <h2
                  className={`passport-name ${
                    !form.nome ? "passport-name--empty" : ""
                  }`}
                >
                  {form.nome || "Seu nome aqui"}
                </h2>

                <div className="passport-status">
                  <TargetIcon />
                  Pronto para novas oportunidades
                </div>

                <div className="passport-data">
                  <div className="passport-data-item">
                    <span className="passport-data-label">
                      Telefone
                    </span>

                    <span
                      className={`passport-data-value ${
                        !form.telefone
                          ? "passport-data-placeholder"
                          : ""
                      }`}
                    >
                      {form.telefone || "(00) 00000-0000"}
                    </span>
                  </div>

                  <div className="passport-data-item">
                    <span className="passport-data-label">
                      Cadastro
                    </span>

                    <span className="passport-data-value">
                      Novo talento
                    </span>
                  </div>

                  <div className="passport-data-item passport-data-item--email">
                    <span className="passport-data-label">
                      E-mail profissional
                    </span>

                    <span
                      className={`passport-data-value ${
                        !form.email
                          ? "passport-data-placeholder"
                          : ""
                      }`}
                    >
                      {form.email || "seunome@email.com"}
                    </span>
                  </div>
                </div>

                <div className="passport-footer">
                  <div
                    className="passport-barcode"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 26 }).map((_, index) => (
                      <span key={index} />
                    ))}
                  </div>

                  <span className="passport-number">
                    PROFILE · {iniciais} · 0926
                  </span>
                </div>
              </div>
            </article>

            <div
              className="floating-sticker floating-sticker--start"
              aria-hidden="true"
            >
              Seu futuro
              <br />
              começa agora
            </div>

            <div
              className="floating-sticker floating-sticker--unique"
              aria-hidden="true"
            >
              Perfil
              <br />
              único
            </div>
          </section>

          <section
            className="register-workspace"
            aria-label="Criação da conta"
          >
            <div className="workspace-heading">
              <div className="workspace-eyebrow">
                <RocketIcon />
                Entrada para novos talentos
              </div>

              <h1 className="workspace-title">
                Crie seu
                <br />
                <span className="workspace-title-highlight">
                  próximo passo.
                </span>
              </h1>

              <p className="workspace-description">
                Monte seu acesso em poucos passos e comece a descobrir
                oportunidades conectadas ao seu perfil.
              </p>
            </div>

            <div style={{ position: "relative" }}>
              <div className="form-machine-back" aria-hidden="true" />

              <article className="form-machine">
                <div className="machine-progress">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        "--progress": `${progresso}%`,
                      }}
                    />
                  </div>

                  <div className="progress-steps">
                    <ProgressStep
                      numero={1}
                      label="Identidade"
                      etapaAtual={etapa}
                    />

                    <ProgressStep
                      numero={2}
                      label="Contato"
                      etapaAtual={etapa}
                    />

                    <ProgressStep
                      numero={3}
                      label="Segurança"
                      etapaAtual={etapa}
                    />
                  </div>
                </div>

                <form
                  className="register-form"
                  onSubmit={handleCadastro}
                  noValidate
                >
                  <div className="machine-body">
                    <div
                      key={etapa}
                      className={`step-content ${
                        direcao === "backward"
                          ? "step-content--backward"
                          : ""
                      }`}
                    >
                      {etapa === 1 && (
                        <StepOne
                          form={form}
                          erros={erros}
                          atualizarCampo={atualizarCampo}
                          handleTelefoneChange={handleTelefoneChange}
                          handleFotoChange={handleFotoChange}
                          fotoPreview={fotoPreview}
                        />
                      )}

                      {etapa === 2 && (
                        <StepTwo
                          form={form}
                          erros={erros}
                          atualizarCampo={atualizarCampo}
                        />
                      )}

                      {etapa === 3 && (
                        <StepThree
                          form={form}
                          erros={erros}
                          atualizarCampo={atualizarCampo}
                          mostrarSenha={mostrarSenha}
                          mostrarConfirmacao={mostrarConfirmacao}
                          setMostrarSenha={setMostrarSenha}
                          setMostrarConfirmacao={
                            setMostrarConfirmacao
                          }
                          detectarCapsLock={detectarCapsLock}
                          capsLock={capsLock}
                          criteriosSenha={criteriosSenha}
                          pontuacaoSenha={pontuacaoSenha}
                          forcaSenha={forcaSenha}
                        />
                      )}

                      {erros.cadastro && (
                        <div
                          className="form-error"
                          role="alert"
                          style={{ marginTop: "1rem" }}
                        >
                          <AlertIcon />
                          {erros.cadastro}
                        </div>
                      )}

                      <div className="machine-actions">
                        {etapa > 1 && (
                          <button
                            type="button"
                            className="back-button"
                            onClick={etapaAnterior}
                            disabled={carregando}
                          >
                            <ArrowLeftIcon />
                            <span>Voltar</span>
                          </button>
                        )}

                        <button
                          type="submit"
                          className="next-button"
                          disabled={carregando}
                        >
                          <span className="next-button-content">
                            {carregando ? (
                              <>
                                <span
                                  className="loading-spinner"
                                  aria-hidden="true"
                                />
                                Criando perfil
                              </>
                            ) : etapa === 3 ? (
                              <>
                                Finalizar cadastro
                                <SparklesIcon />
                              </>
                            ) : (
                              <>
                                Continuar
                                <ArrowRightIcon />
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </article>
            </div>
          </section>
        </div>

        <div className="side-marquee" aria-hidden="true">
          <div className="side-marquee-track">
            <SideMarqueeContent />
            <SideMarqueeContent />
          </div>
        </div>

        {concluido && (
          <div className="success-overlay" role="status">
            <div className="success-card">
              <div className="success-icon">
                <CheckIcon />
              </div>

              <h2 className="success-title">
                Perfil criado!
              </h2>

              <p className="success-description">
                Seu passaporte profissional está pronto. Agora vamos
                levar você para o login.
              </p>

              <div className="success-loading">
                Preparando seu acesso

                <span className="success-loading-dots">
                  <span className="success-loading-dot" />
                  <span className="success-loading-dot" />
                  <span className="success-loading-dot" />
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function ProgressStep({ numero, label, etapaAtual }) {
  const completo = etapaAtual > numero;
  const ativo = etapaAtual === numero;

  return (
    <div
      className={`progress-step ${
        completo
          ? "progress-step--complete"
          : ativo
            ? "progress-step--active"
            : ""
      }`}
    >
      <span className="progress-step-number">
        {completo ? <CheckIcon /> : numero}
      </span>

      <span className="progress-step-label">
        {label}
      </span>
    </div>
  );
}

function StepOne({
  form,
  erros,
  atualizarCampo,
  handleTelefoneChange,
  handleFotoChange,
  fotoPreview,
}) {
  return (
    <>
      <header className="step-header">
        <span className="step-counter">
          Etapa 01 · Identidade
        </span>

        <h2 className="step-title">
          Primeiro, quem é você?
        </h2>

        <p className="step-description">
          Estas informações serão usadas para identificar seu perfil
          dentro do banco de talentos.
        </p>
      </header>

      <div className="field-grid">
        <div className="field-group field-group--photo">
          <label className="field-label" htmlFor="cadastro-foto">Foto de perfil <span className="field-label-detail">Opcional · até 2 MB</span></label>
          <label className={`register-photo-picker ${erros.foto ? "field-shell--error" : ""}`} htmlFor="cadastro-foto">
            <span className="register-photo-picker__preview">{fotoPreview ? <img src={fotoPreview} alt="" /> : <UserIcon />}</span>
            <span>{form.foto ? "Trocar foto escolhida" : "Escolher uma foto"}</span>
            <input id="cadastro-foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFotoChange} />
          </label>
          {erros.foto && <span className="field-error" role="alert"><AlertIcon />{erros.foto}</span>}
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="cadastro-nome">
            Nome completo
            <span className="field-label-detail">
              Como prefere ser chamado
            </span>
          </label>

          <div
            className={`field-shell ${
              erros.nome ? "field-shell--error" : ""
            }`}
          >
            <span className="field-icon" aria-hidden="true">
              <UserIcon />
            </span>

            <input
              id="cadastro-nome"
              className="field-input"
              type="text"
              autoComplete="name"
              placeholder="Nome e sobrenome"
              value={form.nome}
              onChange={(event) =>
                atualizarCampo("nome", event.target.value)
              }
              aria-invalid={Boolean(erros.nome)}
              aria-describedby={
                erros.nome ? "cadastro-nome-error" : undefined
              }
            />
          </div>

          {erros.nome && (
            <span
              id="cadastro-nome-error"
              className="field-error"
              role="alert"
            >
              <AlertIcon />
              {erros.nome}
            </span>
          )}
        </div>

        <div className="field-group">
          <label
            className="field-label"
            htmlFor="cadastro-telefone"
          >
            Telefone
            <span className="field-label-detail">
              Com DDD
            </span>
          </label>

          <div
            className={`field-shell ${
              erros.telefone ? "field-shell--error" : ""
            }`}
          >
            <span className="field-icon" aria-hidden="true">
              <PhoneIcon />
            </span>

            <input
              id="cadastro-telefone"
              className="field-input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={handleTelefoneChange}
              aria-invalid={Boolean(erros.telefone)}
              aria-describedby={
                erros.telefone
                  ? "cadastro-telefone-error"
                  : undefined
              }
            />
          </div>

          {erros.telefone && (
            <span
              id="cadastro-telefone-error"
              className="field-error"
              role="alert"
            >
              <AlertIcon />
              {erros.telefone}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function StepTwo({
  form,
  erros,
  atualizarCampo,
}) {
  return (
    <>
      <header className="step-header">
        <span className="step-counter">
          Etapa 02 · Contato
        </span>

        <h2 className="step-title">
          Onde podemos encontrar você?
        </h2>

        <p className="step-description">
          Use um e-mail que você acessa com frequência para não perder
          nenhuma novidade importante.
        </p>
      </header>

      <div className="field-grid field-grid--single">
        <div className="field-group">
          <label className="field-label" htmlFor="cadastro-email">
            E-mail
            <span className="field-label-detail">
              Será usado no login
            </span>
          </label>

          <div
            className={`field-shell ${
              erros.email ? "field-shell--error" : ""
            }`}
          >
            <span className="field-icon" aria-hidden="true">
              <MailIcon />
            </span>

            <input
              id="cadastro-email"
              className="field-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seunome@email.com"
              value={form.email}
              onChange={(event) =>
                atualizarCampo("email", event.target.value)
              }
              aria-invalid={Boolean(erros.email)}
              aria-describedby={
                erros.email ? "cadastro-email-error" : undefined
              }
            />
          </div>

          {erros.email && (
            <span
              id="cadastro-email-error"
              className="field-error"
              role="alert"
            >
              <AlertIcon />
              {erros.email}
            </span>
          )}
        </div>
      </div>

      <div className="contact-preview">
        <span
          className="contact-preview-icon"
          aria-hidden="true"
        >
          <InboxIcon />
        </span>

        <span>
          <strong className="contact-preview-title">
            Este será seu canal principal
          </strong>

          <span className="contact-preview-description">
            Confirmações de candidatura, avisos e atualizações poderão
            chegar neste endereço.
          </span>
        </span>
      </div>
    </>
  );
}

function StepThree({
  form,
  erros,
  atualizarCampo,
  mostrarSenha,
  mostrarConfirmacao,
  setMostrarSenha,
  setMostrarConfirmacao,
  detectarCapsLock,
  capsLock,
  criteriosSenha,
  pontuacaoSenha,
  forcaSenha,
}) {
  return (
    <>
      <header className="step-header">
        <span className="step-counter">
          Etapa 03 · Segurança
        </span>

        <h2 className="step-title">
          Proteja seu novo universo.
        </h2>

        <p className="step-description">
          Crie uma senha forte para manter seus dados e candidaturas
          protegidos.
        </p>
      </header>

      <div className="field-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="cadastro-senha">
            Criar senha
            <span className="field-label-detail">
              Mínimo 8 caracteres
            </span>
          </label>

          <div
            className={`field-shell ${
              erros.senha ? "field-shell--error" : ""
            }`}
          >
            <span className="field-icon" aria-hidden="true">
              <LockIcon />
            </span>

            <input
              id="cadastro-senha"
              className="field-input"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Digite uma senha segura"
              value={form.senha}
              onChange={(event) =>
                atualizarCampo("senha", event.target.value)
              }
              onKeyDown={detectarCapsLock}
              onKeyUp={detectarCapsLock}
              aria-invalid={Boolean(erros.senha)}
              aria-describedby={
                erros.senha
                  ? "cadastro-senha-error"
                  : capsLock
                    ? "cadastro-caps-lock"
                    : undefined
              }
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setMostrarSenha((estadoAtual) => !estadoAtual)
              }
              aria-label={
                mostrarSenha ? "Ocultar senha" : "Mostrar senha"
              }
              aria-pressed={mostrarSenha}
            >
              {mostrarSenha ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {erros.senha && (
            <span
              id="cadastro-senha-error"
              className="field-error"
              role="alert"
            >
              <AlertIcon />
              {erros.senha}
            </span>
          )}

          {!erros.senha && capsLock && (
            <span
              id="cadastro-caps-lock"
              className="caps-warning"
            >
              <CapsLockIcon />
              Caps Lock está ativado
            </span>
          )}
        </div>

        <div className="field-group">
          <label
            className="field-label"
            htmlFor="cadastro-confirmar-senha"
          >
            Confirmar senha
            <span className="field-label-detail">
              Digite novamente
            </span>
          </label>

          <div
            className={`field-shell ${
              erros.confirmarSenha ? "field-shell--error" : ""
            }`}
          >
            <span className="field-icon" aria-hidden="true">
              <ShieldIcon />
            </span>

            <input
              id="cadastro-confirmar-senha"
              className="field-input"
              type={mostrarConfirmacao ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={form.confirmarSenha}
              onChange={(event) =>
                atualizarCampo(
                  "confirmarSenha",
                  event.target.value,
                )
              }
              onKeyDown={detectarCapsLock}
              onKeyUp={detectarCapsLock}
              aria-invalid={Boolean(erros.confirmarSenha)}
              aria-describedby={
                erros.confirmarSenha
                  ? "cadastro-confirmar-error"
                  : undefined
              }
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setMostrarConfirmacao(
                  (estadoAtual) => !estadoAtual,
                )
              }
              aria-label={
                mostrarConfirmacao
                  ? "Ocultar confirmação de senha"
                  : "Mostrar confirmação de senha"
              }
              aria-pressed={mostrarConfirmacao}
            >
              {mostrarConfirmacao ? (
                <EyeOffIcon />
              ) : (
                <EyeIcon />
              )}
            </button>
          </div>

          {erros.confirmarSenha && (
            <span
              id="cadastro-confirmar-error"
              className="field-error"
              role="alert"
            >
              <AlertIcon />
              {erros.confirmarSenha}
            </span>
          )}
        </div>
      </div>

      <div className="password-strength">
        <div className="password-strength-header">
          <span className="password-strength-label">
            Força da senha
          </span>

          <span
            className={`password-strength-value password-strength-value--${forcaSenha.classe}`}
          >
            {forcaSenha.texto}
          </span>
        </div>

        <div
          className="password-bars"
          aria-label={`Força da senha: ${forcaSenha.texto}`}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className={`password-bar ${
                index < pontuacaoSenha
                  ? "password-bar--active"
                  : ""
              }`}
            />
          ))}
        </div>

        <div className="password-criteria">
          <PasswordCriterion
            completo={criteriosSenha.tamanho}
            texto="8 ou mais caracteres"
          />

          <PasswordCriterion
            completo={criteriosSenha.maiuscula}
            texto="Uma letra maiúscula"
          />

          <PasswordCriterion
            completo={criteriosSenha.minuscula}
            texto="Uma letra minúscula"
          />

          <PasswordCriterion
            completo={criteriosSenha.numero}
            texto="Pelo menos um número"
          />
        </div>
      </div>

      <label className="terms-control">
        <input
          className="terms-input"
          type="checkbox"
          checked={form.aceitouTermos}
          onChange={(event) =>
            atualizarCampo("aceitouTermos", event.target.checked)
          }
        />

        <span className="terms-checkbox" aria-hidden="true">
          <CheckIcon />
        </span>

        <span className="terms-text">
          Li e concordo com os{" "}
          <Link
            className="terms-link"
            to="/termos"
            onClick={(event) => event.stopPropagation()}
          >
            Termos de Uso
          </Link>{" "}
          e com a{" "}
          <Link
            className="terms-link"
            to="/privacidade"
            onClick={(event) => event.stopPropagation()}
          >
            Política de Privacidade
          </Link>{" "}
          da plataforma.
        </span>
      </label>

      {erros.aceitouTermos && (
        <span className="field-error" role="alert">
          <AlertIcon />
          {erros.aceitouTermos}
        </span>
      )}
    </>
  );
}

function PasswordCriterion({ completo, texto }) {
  return (
    <span
      className={`password-criterion ${
        completo ? "password-criterion--complete" : ""
      }`}
    >
      <span className="criterion-icon">
        {completo ? <CheckIcon /> : <MinusIcon />}
      </span>

      {texto}
    </span>
  );
}

function SideMarqueeContent() {
  return (
    <>
      <span className="side-marquee-item">
        Seu perfil
        <SparklesIcon />
      </span>

      <span className="side-marquee-item">
        Novas oportunidades
        <TargetIcon />
      </span>

      <span className="side-marquee-item">
        Próximo capítulo
        <RocketIcon />
      </span>

      <span className="side-marquee-item">
        Banco de talentos
        <UserIcon />
      </span>
    </>
  );
}

function UserIcon() {
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

function PhoneIcon() {
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
      <path d="M7.5 4 10 8l-2 2c1.2 2.7 3.3 4.8 6 6l2-2 4 2.5c-.2 2.2-1.4 3.5-3.5 3.5C9.6 20 4 14.4 4 7.5 4 5.4 5.3 4.2 7.5 4Z" />
    </svg>
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

function InboxIcon() {
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
      <path d="M4 5h16l1 11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3L4 5Z" />
      <path d="M3.5 14h4l1.5 2h6l1.5-2h4" />
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

function RocketIcon() {
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
      <path d="M14 5c3.8-2.2 6-1 6-1s1.2 2.2-1 6l-5 5-5-5 5-5Z" />
      <circle cx="16" cy="8" r="1.5" />
      <path d="m9 10-4 1-2 2 6 1" />
      <path d="m14 15-1 4-2 2-1-6" />
      <path d="M6 17c-1 0-2 1-2 3 2 0 3-1 3-2" />
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

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="m10 7-5 5 5 5" />
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

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M7 12h10" />
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
