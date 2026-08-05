import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const shortcuts = [
  {
    id: "create-job",
    title: "Criar vaga",
    description:
      "Cadastre uma nova oportunidade com todas as informações necessárias.",
    path: "/admin/criar-vaga",
    category: "Cadastro",
    icon: "plus",
    accent: "pink",
    shortcut: "C",
  },
  {
    id: "view-jobs",
    title: "Ver vagas",
    description:
      "Visualize, organize e acompanhe todas as oportunidades publicadas.",
    path: "/admin/ver-vagas",
    category: "Gerenciamento",
    icon: "briefcase",
    accent: "blue",
    shortcut: "V",
  },
];

function Icon({ name, size = 22, strokeWidth = 1.8 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "plus":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "briefcase":
      return (
        <svg {...commonProps}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
          <path d="M10 12v2h4v-2" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...commonProps}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...commonProps}>
          <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M3 10h18" />
        </svg>
      );

    case "clock":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "activity":
      return (
        <svg {...commonProps}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      );

    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.7 7.5 9.5 4.4-1.8 7.5-4.9 7.5-9.5V6L12 3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "sparkles":
      return (
        <svg {...commonProps}>
          <path d="m12 3-1.1 3.2a2.8 2.8 0 0 1-1.7 1.7L6 9l3.2 1.1a2.8 2.8 0 0 1 1.7 1.7L12 15l1.1-3.2a2.8 2.8 0 0 1 1.7-1.7L18 9l-3.2-1.1a2.8 2.8 0 0 1-1.7-1.7L12 3Z" />
          <path d="m5 16-.6 1.6a1.6 1.6 0 0 1-1 1L2 19l1.4.4a1.6 1.6 0 0 1 1 1L5 22l.6-1.6a1.6 1.6 0 0 1 1-1L8 19l-1.4-.4a1.6 1.6 0 0 1-1-1L5 16Z" />
          <path d="m19 13-.5 1.3a1.4 1.4 0 0 1-.8.8l-1.2.4 1.2.4a1.4 1.4 0 0 1 .8.8L19 19l.5-1.3a1.4 1.4 0 0 1 .8-.8l1.2-.4-1.2-.4a1.4 1.4 0 0 1-.8-.8L19 13Z" />
        </svg>
      );

    case "command":
      return (
        <svg {...commonProps}>
          <path d="M9 6V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V5" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...commonProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "close":
      return (
        <svg {...commonProps}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );

    case "layers":
      return (
        <svg {...commonProps}>
          <path d="m12 2 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 17 9 5 9-5" />
        </svg>
      );

    case "check":
      return (
        <svg {...commonProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    default:
      return null;
  }
}

export default function AdminHome() {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleKeyboard(event) {
      const isCommandShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (isCommandShortcut) {
        event.preventDefault();
        setIsCommandOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setIsCommandOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const greeting = useMemo(() => {
    const hour = currentDate.getHours();

    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";

    return "Boa noite";
  }, [currentDate]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(currentDate),
    [currentDate]
  );

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(currentDate),
    [currentDate]
  );

  const formattedUpdateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated),
    [lastUpdated]
  );

  const filteredShortcuts = useMemo(() => {
    const normalizedSearch = commandSearch.trim().toLowerCase();

    if (!normalizedSearch) return shortcuts;

    return shortcuts.filter((shortcut) => {
      const searchableContent = [
        shortcut.title,
        shortcut.description,
        shortcut.category,
      ]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(normalizedSearch);
    });
  }, [commandSearch]);

  function handleNavigate(path) {
    setIsCommandOpen(false);
    setCommandSearch("");
    navigate(path);
  }

  function handleRefresh() {
    const updatedAt = new Date();

    setLastUpdated(updatedAt);

    setToast({
      title: "Painel atualizado",
      description: "As informações visuais foram sincronizadas.",
    });
  }

  function handleCardMouseMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();

    card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  }

  function handleCommandKeyDown(event) {
    if (event.key === "Enter" && filteredShortcuts.length > 0) {
      handleNavigate(filteredShortcuts[0].path);
    }
  }

  return (
    <>
      <style>
        {`
          :root {
            color-scheme: dark;
          }

          * {
            box-sizing: border-box;
          }

          html {
            min-width: 320px;
            min-height: 100%;
            background: #050609;
          }

          body {
            min-width: 320px;
            min-height: 100%;
            margin: 0;
            background: #050609;
          }

          button,
          input {
            font: inherit;
          }

          button {
            border: 0;
          }

          .admin-app {
            --background: #050609;
            --surface: rgba(18, 20, 28, 0.72);
            --surface-strong: rgba(22, 24, 34, 0.9);
            --surface-soft: rgba(255, 255, 255, 0.035);
            --border: rgba(255, 255, 255, 0.085);
            --border-hover: rgba(255, 255, 255, 0.17);
            --text-primary: #f8f8fb;
            --text-secondary: #9c9eab;
            --text-muted: #707280;
            --pink: #ff4d8d;
            --pink-light: #ff8ab4;
            --pink-dark: #bb1e59;
            --blue: #4d83ff;
            --blue-light: #86aaff;
            --blue-dark: #2457d6;
            --green: #4ade80;
            --shadow:
              0 40px 100px rgba(0, 0, 0, 0.45),
              0 12px 40px rgba(0, 0, 0, 0.25);

            position: relative;
            min-height: 100vh;
            overflow: hidden;
            color: var(--text-primary);
            background:
              radial-gradient(
                circle at 15% 15%,
                rgba(255, 61, 129, 0.11),
                transparent 30%
              ),
              radial-gradient(
                circle at 90% 10%,
                rgba(61, 123, 255, 0.12),
                transparent 30%
              ),
              radial-gradient(
                circle at 70% 90%,
                rgba(119, 74, 255, 0.08),
                transparent 28%
              ),
              var(--background);
            font-family:
              Inter,
              ui-sans-serif,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
            isolation: isolate;
          }

          .admin-app::before {
            position: fixed;
            z-index: -3;
            inset: 0;
            content: "";
            pointer-events: none;
            opacity: 0.34;
            background-image:
              linear-gradient(
                rgba(255, 255, 255, 0.017) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.017) 1px,
                transparent 1px
              );
            background-size: 42px 42px;
            mask-image: linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.9),
              transparent 90%
            );
          }

          .admin-app::after {
            position: fixed;
            z-index: -2;
            inset: 0;
            content: "";
            pointer-events: none;
            opacity: 0.07;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.55'/%3E%3C/svg%3E");
          }

          .admin-orb {
            position: fixed;
            z-index: -1;
            width: 420px;
            height: 420px;
            border-radius: 999px;
            pointer-events: none;
            filter: blur(95px);
            opacity: 0.13;
            animation: adminOrbFloat 14s ease-in-out infinite;
          }

          .admin-orb--pink {
            top: -210px;
            left: 20%;
            background: var(--pink);
          }

          .admin-orb--blue {
            right: -200px;
            bottom: -180px;
            background: var(--blue);
            animation-delay: -7s;
          }

          .admin-shell {
            display: grid;
            grid-template-columns: 268px minmax(0, 1fr);
            min-height: 100vh;
          }

          .admin-sidebar {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            padding: 24px 18px;
            border-right: 1px solid var(--border);
            background: rgba(7, 8, 13, 0.72);
            box-shadow: 20px 0 70px rgba(0, 0, 0, 0.18);
            backdrop-filter: blur(24px);
          }

          .admin-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 58px;
            padding: 8px 10px;
          }

          .admin-brand__symbol {
            position: relative;
            display: grid;
            flex: 0 0 auto;
            width: 42px;
            height: 42px;
            place-items: center;
            overflow: hidden;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 14px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 77, 141, 0.96),
                rgba(80, 91, 255, 0.94)
              );
            box-shadow:
              0 13px 30px rgba(255, 77, 141, 0.2),
              inset 0 1px rgba(255, 255, 255, 0.3);
          }

          .admin-brand__symbol::before {
            position: absolute;
            width: 32px;
            height: 32px;
            content: "";
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 11px;
            transform: rotate(45deg);
          }

          .admin-brand__symbol svg {
            position: relative;
            z-index: 1;
          }

          .admin-brand__name {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .admin-brand__caption {
            display: block;
            margin-top: 3px;
            color: var(--text-muted);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .admin-sidebar__section {
            margin-top: 34px;
          }

          .admin-sidebar__label {
            display: block;
            margin: 0 12px 10px;
            color: #5f616e;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .admin-nav {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .admin-nav__item {
            position: relative;
            display: flex;
            width: 100%;
            min-height: 48px;
            align-items: center;
            gap: 12px;
            padding: 0 13px;
            overflow: hidden;
            color: var(--text-secondary);
            border: 1px solid transparent;
            border-radius: 14px;
            background: transparent;
            cursor: pointer;
            text-align: left;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
          }

          .admin-nav__item:hover {
            color: var(--text-primary);
            border-color: rgba(255, 255, 255, 0.07);
            background: rgba(255, 255, 255, 0.035);
            transform: translateX(2px);
          }

          .admin-nav__item--active {
            color: #fff;
            border-color: rgba(255, 255, 255, 0.1);
            background:
              linear-gradient(
                90deg,
                rgba(255, 77, 141, 0.12),
                rgba(77, 131, 255, 0.06)
              );
            box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
          }

          .admin-nav__item--active::before {
            position: absolute;
            top: 11px;
            bottom: 11px;
            left: 0;
            width: 3px;
            content: "";
            border-radius: 0 10px 10px 0;
            background: linear-gradient(
              to bottom,
              var(--pink-light),
              var(--blue)
            );
            box-shadow: 0 0 16px rgba(255, 77, 141, 0.65);
          }

          .admin-nav__icon {
            display: grid;
            flex: 0 0 auto;
            width: 28px;
            height: 28px;
            place-items: center;
          }

          .admin-nav__text {
            flex: 1;
            font-size: 13px;
            font-weight: 650;
          }

          .admin-nav__arrow {
            color: #4c4e5b;
            transition: transform 180ms ease;
          }

          .admin-nav__item:hover .admin-nav__arrow {
            color: var(--text-secondary);
            transform: translateX(3px);
          }

          .admin-sidebar__bottom {
            margin-top: auto;
            padding-top: 28px;
          }

          .admin-profile {
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 11px;
            border: 1px solid var(--border);
            border-radius: 17px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.047),
                rgba(255, 255, 255, 0.018)
              );
            box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
          }

          .admin-profile__avatar {
            position: relative;
            display: grid;
            flex: 0 0 auto;
            width: 39px;
            height: 39px;
            place-items: center;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.13);
            border-radius: 13px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 77, 141, 0.9),
                rgba(77, 131, 255, 0.82)
              );
            box-shadow: 0 8px 24px rgba(77, 131, 255, 0.16);
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.04em;
          }

          .admin-profile__status {
            position: absolute;
            right: -2px;
            bottom: -2px;
            width: 11px;
            height: 11px;
            border: 3px solid #0d0e14;
            border-radius: 999px;
            background: var(--green);
            box-shadow: 0 0 10px rgba(74, 222, 128, 0.65);
          }

          .admin-profile__content {
            min-width: 0;
          }

          .admin-profile__name {
            display: block;
            overflow: hidden;
            color: var(--text-primary);
            font-size: 12px;
            font-weight: 750;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-profile__role {
            display: block;
            margin-top: 3px;
            overflow: hidden;
            color: var(--text-muted);
            font-size: 10px;
            font-weight: 600;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-main {
            min-width: 0;
            padding: 26px clamp(22px, 4vw, 54px) 46px;
          }

          .admin-topbar {
            display: flex;
            min-height: 54px;
            align-items: center;
            justify-content: space-between;
            gap: 22px;
            margin-bottom: 34px;
          }

          .admin-breadcrumb {
            display: flex;
            align-items: center;
            gap: 9px;
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 650;
          }

          .admin-breadcrumb__current {
            color: var(--text-secondary);
          }

          .admin-breadcrumb__separator {
            color: #3c3e49;
          }

          .admin-topbar__actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .admin-command-button,
          .admin-icon-button {
            display: inline-flex;
            min-height: 42px;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            border: 1px solid var(--border);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.035);
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.035),
              0 10px 30px rgba(0, 0, 0, 0.14);
            cursor: pointer;
            transition:
              color 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              transform 180ms ease;
            backdrop-filter: blur(12px);
          }

          .admin-command-button {
            gap: 9px;
            padding: 0 12px 0 14px;
          }

          .admin-icon-button {
            width: 42px;
            padding: 0;
          }

          .admin-command-button:hover,
          .admin-icon-button:hover {
            color: #fff;
            border-color: var(--border-hover);
            background: rgba(255, 255, 255, 0.065);
            transform: translateY(-2px);
          }

          .admin-command-button:active,
          .admin-icon-button:active {
            transform: translateY(0) scale(0.97);
          }

          .admin-command-button__label {
            font-size: 12px;
            font-weight: 700;
          }

          .admin-command-button__key {
            display: inline-flex;
            height: 24px;
            align-items: center;
            padding: 0 8px;
            color: #8f919d;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 7px;
            background: rgba(0, 0, 0, 0.22);
            font-size: 10px;
            font-weight: 800;
            box-shadow: inset 0 -1px rgba(255, 255, 255, 0.035);
          }

          .admin-hero {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: end;
            gap: 30px;
            padding: clamp(26px, 4vw, 42px);
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 28px;
            background:
              radial-gradient(
                circle at 78% 18%,
                rgba(77, 131, 255, 0.13),
                transparent 26%
              ),
              radial-gradient(
                circle at 8% 100%,
                rgba(255, 77, 141, 0.1),
                transparent 30%
              ),
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.055),
                rgba(255, 255, 255, 0.018)
              );
            box-shadow: var(--shadow);
            isolation: isolate;
            animation: adminReveal 650ms cubic-bezier(0.16, 1, 0.3, 1)
              both;
            backdrop-filter: blur(26px);
          }

          .admin-hero::before {
            position: absolute;
            z-index: -1;
            top: -110px;
            right: -70px;
            width: 310px;
            height: 310px;
            content: "";
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 50%;
            box-shadow:
              0 0 0 30px rgba(255, 255, 255, 0.012),
              0 0 0 65px rgba(255, 255, 255, 0.009),
              0 0 100px rgba(77, 131, 255, 0.09);
          }

          .admin-hero::after {
            position: absolute;
            top: 0;
            left: 13%;
            width: 220px;
            height: 1px;
            content: "";
            background: linear-gradient(
              to right,
              transparent,
              rgba(255, 255, 255, 0.6),
              transparent
            );
            opacity: 0.45;
          }

          .admin-hero__content {
            position: relative;
            z-index: 1;
            max-width: 760px;
          }

          .admin-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 19px;
            color: #c8cad4;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: 0.17em;
            text-transform: uppercase;
          }

          .admin-eyebrow__icon {
            display: grid;
            width: 28px;
            height: 28px;
            place-items: center;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 9px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 77, 141, 0.16),
                rgba(77, 131, 255, 0.14)
              );
          }

          .admin-hero__title {
            max-width: 710px;
            margin: 0;
            color: #fff;
            font-size: clamp(34px, 5vw, 64px);
            font-weight: 850;
            letter-spacing: -0.055em;
            line-height: 0.98;
          }

          .admin-hero__title-gradient {
            color: transparent;
            background:
              linear-gradient(
                100deg,
                #ffffff 0%,
                #ff97bd 36%,
                #8eacff 82%,
                #ffffff 100%
              );
            background-size: 220% auto;
            background-clip: text;
            -webkit-background-clip: text;
            animation: adminGradientMove 8s linear infinite;
          }

          .admin-hero__description {
            max-width: 650px;
            margin: 20px 0 0;
            color: var(--text-secondary);
            font-size: clamp(13px, 1.4vw, 15px);
            line-height: 1.75;
          }

          .admin-hero__details {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 25px;
          }

          .admin-detail-pill {
            display: inline-flex;
            min-height: 34px;
            align-items: center;
            gap: 8px;
            padding: 0 12px;
            color: #a7a9b5;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 999px;
            background: rgba(5, 6, 9, 0.35);
            font-size: 10px;
            font-weight: 700;
            backdrop-filter: blur(12px);
          }

          .admin-detail-pill--online {
            color: #bdf8d0;
          }

          .admin-detail-pill__dot {
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: var(--green);
            box-shadow: 0 0 12px rgba(74, 222, 128, 0.8);
            animation: adminStatusPulse 2s ease-in-out infinite;
          }

          .admin-hero__time {
            position: relative;
            z-index: 1;
            min-width: 188px;
            padding: 18px 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            background: rgba(6, 7, 11, 0.43);
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.035),
              0 18px 50px rgba(0, 0, 0, 0.2);
            text-align: right;
            backdrop-filter: blur(18px);
          }

          .admin-hero__time-label {
            display: block;
            margin-bottom: 6px;
            color: var(--text-muted);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .admin-hero__time-value {
            display: block;
            color: #fff;
            font-size: clamp(24px, 3vw, 34px);
            font-weight: 780;
            letter-spacing: -0.045em;
            font-variant-numeric: tabular-nums;
          }

          .admin-section {
            margin-top: 36px;
            animation: adminReveal 650ms 90ms
              cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .admin-section__header {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 17px;
          }

          .admin-section__title {
            margin: 0;
            color: var(--text-primary);
            font-size: 20px;
            font-weight: 790;
            letter-spacing: -0.025em;
          }

          .admin-section__description {
            margin: 7px 0 0;
            color: var(--text-muted);
            font-size: 12px;
            line-height: 1.6;
          }

          .admin-section__count {
            color: var(--text-muted);
            font-size: 10px;
            font-weight: 750;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .admin-action-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .admin-action-card {
            --accent: var(--pink);
            --accent-light: var(--pink-light);
            --accent-rgb: 255, 77, 141;
            --mouse-x: 50%;
            --mouse-y: 50%;

            position: relative;
            display: flex;
            min-height: 260px;
            flex-direction: column;
            padding: 25px;
            overflow: hidden;
            color: inherit;
            border: 1px solid var(--border);
            border-radius: 24px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.05),
                rgba(255, 255, 255, 0.018)
              );
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.04),
              0 24px 65px rgba(0, 0, 0, 0.22);
            cursor: pointer;
            text-align: left;
            isolation: isolate;
            transition:
              border-color 240ms ease,
              box-shadow 240ms ease,
              transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(22px);
          }

          .admin-action-card--blue {
            --accent: var(--blue);
            --accent-light: var(--blue-light);
            --accent-rgb: 77, 131, 255;
          }

          .admin-action-card::before {
            position: absolute;
            z-index: -2;
            inset: 0;
            content: "";
            opacity: 0;
            background:
              radial-gradient(
                350px circle at var(--mouse-x) var(--mouse-y),
                rgba(var(--accent-rgb), 0.15),
                transparent 45%
              );
            transition: opacity 240ms ease;
          }

          .admin-action-card::after {
            position: absolute;
            z-index: -1;
            right: -80px;
            bottom: -100px;
            width: 240px;
            height: 240px;
            content: "";
            border-radius: 50%;
            background: var(--accent);
            opacity: 0.07;
            filter: blur(10px);
            transition:
              opacity 300ms ease,
              transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .admin-action-card:hover {
            border-color: rgba(var(--accent-rgb), 0.34);
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.055),
              0 35px 90px rgba(0, 0, 0, 0.34),
              0 0 60px rgba(var(--accent-rgb), 0.07);
            transform: translateY(-7px);
          }

          .admin-action-card:hover::before {
            opacity: 1;
          }

          .admin-action-card:hover::after {
            opacity: 0.13;
            transform: translate(-24px, -20px) scale(1.12);
          }

          .admin-action-card:active {
            transform: translateY(-3px) scale(0.99);
          }

          .admin-action-card__top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
          }

          .admin-action-card__icon {
            position: relative;
            display: grid;
            width: 52px;
            height: 52px;
            place-items: center;
            color: #fff;
            border: 1px solid rgba(var(--accent-rgb), 0.3);
            border-radius: 17px;
            background:
              linear-gradient(
                145deg,
                rgba(var(--accent-rgb), 0.28),
                rgba(var(--accent-rgb), 0.08)
              );
            box-shadow:
              0 18px 40px rgba(var(--accent-rgb), 0.15),
              inset 0 1px rgba(255, 255, 255, 0.13);
            transition:
              transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 300ms ease;
          }

          .admin-action-card:hover .admin-action-card__icon {
            box-shadow:
              0 22px 50px rgba(var(--accent-rgb), 0.23),
              inset 0 1px rgba(255, 255, 255, 0.18);
            transform: rotate(-5deg) scale(1.06);
          }

          .admin-action-card__category {
            display: inline-flex;
            min-height: 28px;
            align-items: center;
            padding: 0 10px;
            color: var(--accent-light);
            border: 1px solid rgba(var(--accent-rgb), 0.18);
            border-radius: 999px;
            background: rgba(var(--accent-rgb), 0.07);
            font-size: 9px;
            font-weight: 850;
            letter-spacing: 0.11em;
            text-transform: uppercase;
          }

          .admin-action-card__content {
            margin-top: 30px;
          }

          .admin-action-card__title {
            margin: 0;
            color: #fff;
            font-size: clamp(22px, 2.5vw, 28px);
            font-weight: 810;
            letter-spacing: -0.04em;
          }

          .admin-action-card__description {
            max-width: 460px;
            margin: 11px 0 0;
            color: var(--text-secondary);
            font-size: 12px;
            line-height: 1.7;
          }

          .admin-action-card__footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-top: auto;
            padding-top: 28px;
          }

          .admin-action-card__link {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            color: var(--accent-light);
            font-size: 11px;
            font-weight: 800;
          }

          .admin-action-card__arrow {
            transition: transform 240ms ease;
          }

          .admin-action-card:hover .admin-action-card__arrow {
            transform: translateX(5px);
          }

          .admin-action-card__shortcut {
            display: grid;
            width: 30px;
            height: 30px;
            place-items: center;
            color: #747683;
            border: 1px solid rgba(255, 255, 255, 0.075);
            border-radius: 9px;
            background: rgba(0, 0, 0, 0.19);
            font-size: 9px;
            font-weight: 850;
            box-shadow: inset 0 -1px rgba(255, 255, 255, 0.03);
          }

          .admin-info-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-top: 18px;
            animation: adminReveal 650ms 160ms
              cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .admin-info-card {
            position: relative;
            min-height: 128px;
            padding: 18px;
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 20px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.04),
                rgba(255, 255, 255, 0.015)
              );
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.035),
              0 18px 45px rgba(0, 0, 0, 0.15);
            transition:
              border-color 200ms ease,
              background 200ms ease,
              transform 200ms ease;
            backdrop-filter: blur(18px);
          }

          .admin-info-card:hover {
            border-color: var(--border-hover);
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.06),
                rgba(255, 255, 255, 0.02)
              );
            transform: translateY(-3px);
          }

          .admin-info-card__icon {
            display: grid;
            width: 34px;
            height: 34px;
            place-items: center;
            color: #b9bbc6;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 11px;
            background: rgba(255, 255, 255, 0.035);
          }

          .admin-info-card__label {
            display: block;
            margin-top: 17px;
            color: var(--text-muted);
            font-size: 9px;
            font-weight: 850;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .admin-info-card__value {
            display: block;
            margin-top: 6px;
            overflow: hidden;
            color: #f2f2f6;
            font-size: 14px;
            font-weight: 750;
            letter-spacing: -0.02em;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-bottom-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
            gap: 18px;
            margin-top: 18px;
            animation: adminReveal 650ms 220ms
              cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .admin-panel {
            padding: 23px;
            border: 1px solid var(--border);
            border-radius: 22px;
            background:
              linear-gradient(
                145deg,
                rgba(255, 255, 255, 0.042),
                rgba(255, 255, 255, 0.015)
              );
            box-shadow:
              inset 0 1px rgba(255, 255, 255, 0.035),
              0 20px 55px rgba(0, 0, 0, 0.17);
            backdrop-filter: blur(20px);
          }

          .admin-panel__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            padding-bottom: 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.055);
          }

          .admin-panel__title-wrapper {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .admin-panel__title-icon {
            display: grid;
            width: 36px;
            height: 36px;
            place-items: center;
            color: #c9cbd5;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 11px;
            background: rgba(255, 255, 255, 0.035);
          }

          .admin-panel__title {
            margin: 0;
            color: #f3f3f6;
            font-size: 14px;
            font-weight: 760;
            letter-spacing: -0.015em;
          }

          .admin-panel__subtitle {
            margin: 4px 0 0;
            color: var(--text-muted);
            font-size: 10px;
          }

          .admin-panel__badge {
            display: inline-flex;
            min-height: 28px;
            align-items: center;
            gap: 7px;
            padding: 0 10px;
            color: #bff8d1;
            border: 1px solid rgba(74, 222, 128, 0.15);
            border-radius: 999px;
            background: rgba(74, 222, 128, 0.06);
            font-size: 9px;
            font-weight: 850;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .admin-activity-list {
            display: flex;
            flex-direction: column;
            margin-top: 7px;
          }

          .admin-activity-item {
            display: flex;
            align-items: flex-start;
            gap: 13px;
            padding: 15px 2px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.045);
          }

          .admin-activity-item:last-child {
            border-bottom: 0;
          }

          .admin-activity-item__marker {
            display: grid;
            flex: 0 0 auto;
            width: 31px;
            height: 31px;
            place-items: center;
            color: #b8bac5;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.03);
          }

          .admin-activity-item__content {
            min-width: 0;
          }

          .admin-activity-item__title {
            margin: 0;
            color: #dfe0e6;
            font-size: 11px;
            font-weight: 720;
          }

          .admin-activity-item__description {
            margin: 5px 0 0;
            color: var(--text-muted);
            font-size: 10px;
            line-height: 1.55;
          }

          .admin-system {
            display: flex;
            min-height: 100%;
            flex-direction: column;
          }

          .admin-system__visual {
            position: relative;
            display: grid;
            width: 112px;
            height: 112px;
            place-items: center;
            margin: 25px auto 23px;
          }

          .admin-system__ring {
            position: absolute;
            inset: 0;
            border: 1px solid rgba(74, 222, 128, 0.13);
            border-radius: 50%;
            animation: adminRingRotate 10s linear infinite;
          }

          .admin-system__ring::before,
          .admin-system__ring::after {
            position: absolute;
            content: "";
            border-radius: 50%;
          }

          .admin-system__ring::before {
            inset: 13px;
            border: 1px dashed rgba(74, 222, 128, 0.19);
            animation: adminRingRotate 7s linear infinite reverse;
          }

          .admin-system__ring::after {
            top: -3px;
            left: 50%;
            width: 7px;
            height: 7px;
            background: var(--green);
            box-shadow:
              0 0 12px rgba(74, 222, 128, 0.8),
              0 0 30px rgba(74, 222, 128, 0.35);
            transform: translateX(-50%);
          }

          .admin-system__center {
            display: grid;
            width: 66px;
            height: 66px;
            place-items: center;
            color: #a9f4c2;
            border: 1px solid rgba(74, 222, 128, 0.17);
            border-radius: 50%;
            background:
              radial-gradient(
                circle,
                rgba(74, 222, 128, 0.12),
                rgba(74, 222, 128, 0.025)
              );
            box-shadow:
              0 0 40px rgba(74, 222, 128, 0.1),
              inset 0 1px rgba(255, 255, 255, 0.04);
          }

          .admin-system__title {
            margin: 0;
            color: #f1f2f5;
            font-size: 16px;
            font-weight: 780;
            text-align: center;
          }

          .admin-system__description {
            max-width: 270px;
            margin: 8px auto 0;
            color: var(--text-muted);
            font-size: 10px;
            line-height: 1.6;
            text-align: center;
          }

          .admin-system__footer {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            margin-top: auto;
            padding-top: 21px;
            color: #b9bbc4;
            font-size: 9px;
            font-weight: 700;
          }

          .admin-system__footer-dot {
            width: 5px;
            height: 5px;
            border-radius: 999px;
            background: var(--green);
            box-shadow: 0 0 9px rgba(74, 222, 128, 0.6);
          }

          .admin-command-overlay {
            position: fixed;
            z-index: 100;
            inset: 0;
            display: grid;
            place-items: start center;
            padding: max(90px, 12vh) 18px 30px;
            background: rgba(2, 3, 6, 0.74);
            animation: adminOverlayIn 180ms ease both;
            backdrop-filter: blur(16px);
          }

          .admin-command-dialog {
            width: min(100%, 590px);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 23px;
            background:
              linear-gradient(
                145deg,
                rgba(25, 27, 37, 0.96),
                rgba(12, 13, 19, 0.98)
              );
            box-shadow:
              0 50px 150px rgba(0, 0, 0, 0.68),
              inset 0 1px rgba(255, 255, 255, 0.06);
            animation: adminDialogIn 260ms cubic-bezier(0.16, 1, 0.3, 1)
              both;
          }

          .admin-command-dialog__header {
            display: flex;
            align-items: center;
            gap: 13px;
            min-height: 67px;
            padding: 0 17px 0 21px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          }

          .admin-command-dialog__search-icon {
            display: grid;
            flex: 0 0 auto;
            color: #777986;
          }

          .admin-command-dialog__input {
            flex: 1;
            width: 100%;
            min-width: 0;
            height: 66px;
            color: #f4f4f7;
            border: 0;
            outline: none;
            background: transparent;
            font-size: 14px;
          }

          .admin-command-dialog__input::placeholder {
            color: #626470;
          }

          .admin-command-dialog__close {
            display: grid;
            flex: 0 0 auto;
            width: 34px;
            height: 34px;
            place-items: center;
            color: #777986;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.025);
            cursor: pointer;
            transition:
              color 180ms ease,
              background 180ms ease;
          }

          .admin-command-dialog__close:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.06);
          }

          .admin-command-dialog__body {
            padding: 10px;
          }

          .admin-command-dialog__label {
            display: block;
            padding: 8px 10px;
            color: #656773;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .admin-command-item {
            display: flex;
            width: 100%;
            align-items: center;
            gap: 13px;
            padding: 12px;
            color: inherit;
            border: 1px solid transparent;
            border-radius: 14px;
            background: transparent;
            cursor: pointer;
            text-align: left;
            transition:
              border-color 160ms ease,
              background 160ms ease;
          }

          .admin-command-item:hover,
          .admin-command-item:focus-visible {
            border-color: rgba(255, 255, 255, 0.08);
            outline: none;
            background: rgba(255, 255, 255, 0.045);
          }

          .admin-command-item__icon {
            display: grid;
            flex: 0 0 auto;
            width: 39px;
            height: 39px;
            place-items: center;
            color: #e5e6eb;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.035);
          }

          .admin-command-item__content {
            min-width: 0;
            flex: 1;
          }

          .admin-command-item__title {
            display: block;
            color: #e8e9ed;
            font-size: 12px;
            font-weight: 750;
          }

          .admin-command-item__description {
            display: block;
            margin-top: 4px;
            overflow: hidden;
            color: #70727f;
            font-size: 10px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .admin-command-item__key {
            display: grid;
            flex: 0 0 auto;
            width: 28px;
            height: 28px;
            place-items: center;
            color: #777985;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.16);
            font-size: 9px;
            font-weight: 850;
          }

          .admin-command-empty {
            padding: 38px 20px;
            color: #6e707c;
            font-size: 11px;
            text-align: center;
          }

          .admin-command-dialog__footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            padding: 12px 20px;
            color: #626470;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(0, 0, 0, 0.1);
            font-size: 9px;
            font-weight: 700;
          }

          .admin-command-dialog__hint {
            display: flex;
            align-items: center;
            gap: 7px;
          }

          .admin-command-dialog__hint-key {
            display: grid;
            min-width: 22px;
            height: 22px;
            place-items: center;
            padding: 0 5px;
            color: #8e909a;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.025);
            font-size: 8px;
            font-weight: 850;
          }

          .admin-toast {
            position: fixed;
            z-index: 120;
            right: 25px;
            bottom: 25px;
            display: flex;
            width: min(calc(100% - 36px), 350px);
            align-items: flex-start;
            gap: 12px;
            padding: 15px;
            border: 1px solid rgba(74, 222, 128, 0.17);
            border-radius: 17px;
            background:
              linear-gradient(
                145deg,
                rgba(20, 27, 25, 0.97),
                rgba(11, 14, 16, 0.97)
              );
            box-shadow:
              0 30px 90px rgba(0, 0, 0, 0.55),
              inset 0 1px rgba(255, 255, 255, 0.05);
            animation: adminToastIn 360ms cubic-bezier(0.16, 1, 0.3, 1)
              both;
            backdrop-filter: blur(18px);
          }

          .admin-toast__icon {
            display: grid;
            flex: 0 0 auto;
            width: 35px;
            height: 35px;
            place-items: center;
            color: #baf6cd;
            border: 1px solid rgba(74, 222, 128, 0.15);
            border-radius: 11px;
            background: rgba(74, 222, 128, 0.07);
          }

          .admin-toast__title {
            display: block;
            color: #ecf7ef;
            font-size: 11px;
            font-weight: 780;
          }

          .admin-toast__description {
            display: block;
            margin-top: 5px;
            color: #7f9286;
            font-size: 9px;
            line-height: 1.5;
          }

          .admin-mobile-nav {
            display: none;
          }

          .admin-app button:focus-visible,
          .admin-app input:focus-visible {
            outline: 2px solid rgba(134, 170, 255, 0.75);
            outline-offset: 3px;
          }

          @keyframes adminReveal {
            from {
              opacity: 0;
              transform: translateY(20px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes adminOverlayIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes adminDialogIn {
            from {
              opacity: 0;
              transform: translateY(-15px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes adminToastIn {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.96);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes adminGradientMove {
            to {
              background-position: 220% center;
            }
          }

          @keyframes adminOrbFloat {
            0%,
            100% {
              transform: translate3d(0, 0, 0) scale(1);
            }

            50% {
              transform: translate3d(25px, -25px, 0) scale(1.08);
            }
          }

          @keyframes adminStatusPulse {
            0%,
            100% {
              opacity: 1;
              transform: scale(1);
            }

            50% {
              opacity: 0.55;
              transform: scale(0.78);
            }
          }

          @keyframes adminRingRotate {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1180px) {
            .admin-info-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .admin-bottom-grid {
              grid-template-columns: minmax(0, 1fr);
            }

            .admin-system__description {
              max-width: 420px;
            }
          }

          @media (max-width: 920px) {
            .admin-shell {
              display: block;
            }

            .admin-sidebar {
              min-height: auto;
              padding: 14px 20px;
              border-right: 0;
              border-bottom: 1px solid var(--border);
            }

            .admin-brand {
              min-height: 50px;
              padding: 0;
            }

            .admin-sidebar__section,
            .admin-sidebar__bottom {
              display: none;
            }

            .admin-main {
              padding-top: 22px;
              padding-bottom: 105px;
            }

            .admin-mobile-nav {
              position: fixed;
              z-index: 60;
              right: 16px;
              bottom: 16px;
              left: 16px;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 7px;
              padding: 8px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              background: rgba(12, 13, 19, 0.87);
              box-shadow:
                0 25px 70px rgba(0, 0, 0, 0.55),
                inset 0 1px rgba(255, 255, 255, 0.04);
              backdrop-filter: blur(24px);
            }

            .admin-mobile-nav__item {
              display: flex;
              min-height: 55px;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
              color: #757783;
              border: 1px solid transparent;
              border-radius: 14px;
              background: transparent;
              cursor: pointer;
            }

            .admin-mobile-nav__item--active {
              color: #fff;
              border-color: rgba(255, 255, 255, 0.07);
              background:
                linear-gradient(
                  145deg,
                  rgba(255, 77, 141, 0.12),
                  rgba(77, 131, 255, 0.08)
                );
            }

            .admin-mobile-nav__label {
              font-size: 9px;
              font-weight: 750;
            }
          }

          @media (max-width: 760px) {
            .admin-topbar {
              margin-bottom: 24px;
            }

            .admin-command-button__label,
            .admin-command-button__key {
              display: none;
            }

            .admin-command-button {
              width: 42px;
              padding: 0;
            }

            .admin-hero {
              grid-template-columns: 1fr;
              align-items: start;
            }

            .admin-hero__time {
              width: 100%;
              min-width: 0;
              text-align: left;
            }

            .admin-action-grid {
              grid-template-columns: 1fr;
            }

            .admin-action-card {
              min-height: 245px;
            }
          }

          @media (max-width: 540px) {
            .admin-sidebar {
              padding-right: 16px;
              padding-left: 16px;
            }

            .admin-main {
              padding-right: 16px;
              padding-left: 16px;
            }

            .admin-breadcrumb__root,
            .admin-breadcrumb__separator {
              display: none;
            }

            .admin-hero {
              padding: 24px 20px;
              border-radius: 23px;
            }

            .admin-hero__title {
              font-size: clamp(34px, 12vw, 48px);
            }

            .admin-hero__details {
              align-items: stretch;
              flex-direction: column;
            }

            .admin-detail-pill {
              justify-content: center;
            }

            .admin-section__header {
              align-items: flex-start;
              flex-direction: column;
              gap: 10px;
            }

            .admin-info-grid {
              grid-template-columns: 1fr;
            }

            .admin-info-card {
              min-height: 115px;
            }

            .admin-action-card {
              padding: 21px;
              border-radius: 21px;
            }

            .admin-panel {
              padding: 19px;
            }

            .admin-panel__badge {
              display: none;
            }

            .admin-command-dialog__footer {
              display: none;
            }

            .admin-toast {
              right: 18px;
              bottom: 92px;
              left: 18px;
              width: auto;
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
        `}
      </style>

      <div className="admin-app">
        <div className="admin-orb admin-orb--pink" />
        <div className="admin-orb admin-orb--blue" />

        <div className="admin-shell">
          <aside className="admin-sidebar">
            <div className="admin-brand">
              <div className="admin-brand__symbol">
                <Icon name="layers" size={21} />
              </div>

              <div>
                <p className="admin-brand__name">Painel Admin</p>
                <span className="admin-brand__caption">Área de controle</span>
              </div>
            </div>

            <div className="admin-sidebar__section">
              <span className="admin-sidebar__label">Navegação</span>

              <nav className="admin-nav" aria-label="Navegação administrativa">
                <button
                  type="button"
                  className="admin-nav__item admin-nav__item--active"
                  aria-current="page"
                >
                  <span className="admin-nav__icon">
                    <Icon name="home" size={18} />
                  </span>

                  <span className="admin-nav__text">Visão geral</span>
                </button>

                <button
                  type="button"
                  className="admin-nav__item"
                  onClick={() => handleNavigate("/admin/criar-vaga")}
                >
                  <span className="admin-nav__icon">
                    <Icon name="plus" size={18} />
                  </span>

                  <span className="admin-nav__text">Criar vaga</span>

                  <span className="admin-nav__arrow">
                    <Icon name="chevron" size={14} />
                  </span>
                </button>

                <button
                  type="button"
                  className="admin-nav__item"
                  onClick={() => handleNavigate("/admin/ver-vagas")}
                >
                  <span className="admin-nav__icon">
                    <Icon name="briefcase" size={18} />
                  </span>

                  <span className="admin-nav__text">Ver vagas</span>

                  <span className="admin-nav__arrow">
                    <Icon name="chevron" size={14} />
                  </span>
                </button>
              </nav>
            </div>

            <div className="admin-sidebar__bottom">
              <div className="admin-profile">
                <div className="admin-profile__avatar">
                  AD
                  <span className="admin-profile__status" />
                </div>

                <div className="admin-profile__content">
                  <span className="admin-profile__name">Administrador</span>
                  <span className="admin-profile__role">
                    Acesso administrativo
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <main className="admin-main">
            <header className="admin-topbar">
              <div className="admin-breadcrumb">
                <span className="admin-breadcrumb__root">
                  Área administrativa
                </span>

                <span className="admin-breadcrumb__separator">/</span>

                <span className="admin-breadcrumb__current">
                  Visão geral
                </span>
              </div>

              <div className="admin-topbar__actions">
                <button
                  type="button"
                  className="admin-command-button"
                  onClick={() => setIsCommandOpen(true)}
                  aria-label="Abrir menu de ações rápidas"
                  aria-expanded={isCommandOpen}
                >
                  <Icon name="search" size={17} />

                  <span className="admin-command-button__label">
                    Ações rápidas
                  </span>

                  <span className="admin-command-button__key">Ctrl K</span>
                </button>

                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={handleRefresh}
                  aria-label="Atualizar painel"
                  title="Atualizar painel"
                >
                  <Icon name="refresh" size={17} />
                </button>
              </div>
            </header>

            <section className="admin-hero">
              <div className="admin-hero__content">
                <div className="admin-eyebrow">
                  <span className="admin-eyebrow__icon">
                    <Icon name="sparkles" size={15} />
                  </span>

                  Central administrativa
                </div>

                <h1 className="admin-hero__title">
                  {greeting},{" "}
                  <span className="admin-hero__title-gradient">
                    Administrador.
                  </span>
                </h1>

                <p className="admin-hero__description">
                  Gerencie suas oportunidades em um ambiente rápido,
                  organizado e desenvolvido para manter todas as ações
                  importantes ao seu alcance.
                </p>

                <div className="admin-hero__details">
                  <span className="admin-detail-pill">
                    <Icon name="calendar" size={14} />
                    {formattedDate}
                  </span>

                  <span className="admin-detail-pill admin-detail-pill--online">
                    <span className="admin-detail-pill__dot" />
                    Sistema disponível
                  </span>

                  <span className="admin-detail-pill">
                    <Icon name="shield" size={14} />
                    Ambiente protegido
                  </span>
                </div>
              </div>

              <div className="admin-hero__time">
                <span className="admin-hero__time-label">Horário atual</span>
                <strong className="admin-hero__time-value">
                  {formattedTime}
                </strong>
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section__header">
                <div>
                  <h2 className="admin-section__title">Ações principais</h2>

                  <p className="admin-section__description">
                    Escolha uma opção para continuar o gerenciamento.
                  </p>
                </div>

                <span className="admin-section__count">
                  {shortcuts.length} atalhos disponíveis
                </span>
              </div>

              <div className="admin-action-grid">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.id}
                    type="button"
                    className={`admin-action-card ${
                      shortcut.accent === "blue"
                        ? "admin-action-card--blue"
                        : ""
                    }`}
                    onClick={() => handleNavigate(shortcut.path)}
                    onMouseMove={handleCardMouseMove}
                    aria-label={`${shortcut.title}: ${shortcut.description}`}
                  >
                    <div className="admin-action-card__top">
                      <span className="admin-action-card__icon">
                        <Icon name={shortcut.icon} size={24} />
                      </span>

                      <span className="admin-action-card__category">
                        {shortcut.category}
                      </span>
                    </div>

                    <div className="admin-action-card__content">
                      <h3 className="admin-action-card__title">
                        {shortcut.title}
                      </h3>

                      <p className="admin-action-card__description">
                        {shortcut.description}
                      </p>
                    </div>

                    <div className="admin-action-card__footer">
                      <span className="admin-action-card__link">
                        Acessar área

                        <span className="admin-action-card__arrow">
                          <Icon name="arrow" size={16} />
                        </span>
                      </span>

                      <span
                        className="admin-action-card__shortcut"
                        aria-hidden="true"
                      >
                        {shortcut.shortcut}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section
              className="admin-info-grid"
              aria-label="Informações do painel"
            >
              <article className="admin-info-card">
                <span className="admin-info-card__icon">
                  <Icon name="layers" size={17} />
                </span>

                <span className="admin-info-card__label">Atalhos ativos</span>
                <strong className="admin-info-card__value">
                  {shortcuts.length} opções
                </strong>
              </article>

              <article className="admin-info-card">
                <span className="admin-info-card__icon">
                  <Icon name="calendar" size={17} />
                </span>

                <span className="admin-info-card__label">Data atual</span>
                <strong className="admin-info-card__value">
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(currentDate)}
                </strong>
              </article>

              <article className="admin-info-card">
                <span className="admin-info-card__icon">
                  <Icon name="shield" size={17} />
                </span>

                <span className="admin-info-card__label">
                  Status do sistema
                </span>
                <strong className="admin-info-card__value">
                  Operacional
                </strong>
              </article>

              <article className="admin-info-card">
                <span className="admin-info-card__icon">
                  <Icon name="clock" size={17} />
                </span>

                <span className="admin-info-card__label">
                  Última atualização
                </span>
                <strong className="admin-info-card__value">
                  Hoje às {formattedUpdateTime}
                </strong>
              </article>
            </section>

            <section className="admin-bottom-grid">
              <article className="admin-panel">
                <div className="admin-panel__header">
                  <div className="admin-panel__title-wrapper">
                    <span className="admin-panel__title-icon">
                      <Icon name="activity" size={17} />
                    </span>

                    <div>
                      <h3 className="admin-panel__title">
                        Atividade do painel
                      </h3>

                      <p className="admin-panel__subtitle">
                        Informações desta sessão administrativa
                      </p>
                    </div>
                  </div>

                  <span className="admin-panel__badge">
                    <span className="admin-detail-pill__dot" />
                    Em tempo real
                  </span>
                </div>

                <div className="admin-activity-list">
                  <div className="admin-activity-item">
                    <span className="admin-activity-item__marker">
                      <Icon name="check" size={15} />
                    </span>

                    <div className="admin-activity-item__content">
                      <p className="admin-activity-item__title">
                        Painel carregado com sucesso
                      </p>

                      <p className="admin-activity-item__description">
                        Todos os componentes administrativos estão disponíveis.
                      </p>
                    </div>
                  </div>

                  <div className="admin-activity-item">
                    <span className="admin-activity-item__marker">
                      <Icon name="shield" size={15} />
                    </span>

                    <div className="admin-activity-item__content">
                      <p className="admin-activity-item__title">
                        Sessão administrativa ativa
                      </p>

                      <p className="admin-activity-item__description">
                        As opções de cadastro e visualização estão prontas para
                        uso.
                      </p>
                    </div>
                  </div>

                  <div className="admin-activity-item">
                    <span className="admin-activity-item__marker">
                      <Icon name="command" size={15} />
                    </span>

                    <div className="admin-activity-item__content">
                      <p className="admin-activity-item__title">
                        Navegação rápida disponível
                      </p>

                      <p className="admin-activity-item__description">
                        Pressione Ctrl + K para abrir o menu de ações.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="admin-panel admin-system">
                <div className="admin-panel__header">
                  <div className="admin-panel__title-wrapper">
                    <span className="admin-panel__title-icon">
                      <Icon name="shield" size={17} />
                    </span>

                    <div>
                      <h3 className="admin-panel__title">Saúde do sistema</h3>
                      <p className="admin-panel__subtitle">
                        Monitoramento local
                      </p>
                    </div>
                  </div>
                </div>

                <div className="admin-system__visual">
                  <div className="admin-system__ring" />

                  <div className="admin-system__center">
                    <Icon name="check" size={25} />
                  </div>
                </div>

                <h4 className="admin-system__title">
                  Tudo funcionando
                </h4>

                <p className="admin-system__description">
                  O painel está carregado e pronto para receber suas próximas
                  ações.
                </p>

                <div className="admin-system__footer">
                  <span className="admin-system__footer-dot" />
                  Atualizado às {formattedUpdateTime}
                </div>
              </article>
            </section>
          </main>
        </div>

        <nav className="admin-mobile-nav" aria-label="Navegação móvel">
          <button
            type="button"
            className="admin-mobile-nav__item admin-mobile-nav__item--active"
            aria-current="page"
          >
            <Icon name="home" size={18} />
            <span className="admin-mobile-nav__label">Início</span>
          </button>

          <button
            type="button"
            className="admin-mobile-nav__item"
            onClick={() => handleNavigate("/admin/criar-vaga")}
          >
            <Icon name="plus" size={18} />
            <span className="admin-mobile-nav__label">Criar</span>
          </button>

          <button
            type="button"
            className="admin-mobile-nav__item"
            onClick={() => handleNavigate("/admin/ver-vagas")}
          >
            <Icon name="briefcase" size={18} />
            <span className="admin-mobile-nav__label">Vagas</span>
          </button>
        </nav>

        {isCommandOpen && (
          <div
            className="admin-command-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsCommandOpen(false);
              }
            }}
          >
            <div
              className="admin-command-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de ações rápidas"
            >
              <div className="admin-command-dialog__header">
                <span className="admin-command-dialog__search-icon">
                  <Icon name="search" size={20} />
                </span>

                <input
                  autoFocus
                  className="admin-command-dialog__input"
                  type="text"
                  value={commandSearch}
                  onChange={(event) => setCommandSearch(event.target.value)}
                  onKeyDown={handleCommandKeyDown}
                  placeholder="Busque uma ação administrativa..."
                  aria-label="Buscar ação administrativa"
                />

                <button
                  type="button"
                  className="admin-command-dialog__close"
                  onClick={() => setIsCommandOpen(false)}
                  aria-label="Fechar menu"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>

              <div className="admin-command-dialog__body">
                <span className="admin-command-dialog__label">
                  Ações disponíveis
                </span>

                {filteredShortcuts.length > 0 ? (
                  filteredShortcuts.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      type="button"
                      className="admin-command-item"
                      onClick={() => handleNavigate(shortcut.path)}
                    >
                      <span className="admin-command-item__icon">
                        <Icon name={shortcut.icon} size={18} />
                      </span>

                      <span className="admin-command-item__content">
                        <span className="admin-command-item__title">
                          {shortcut.title}
                        </span>

                        <span className="admin-command-item__description">
                          {shortcut.description}
                        </span>
                      </span>

                      <span className="admin-command-item__key">
                        {shortcut.shortcut}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="admin-command-empty">
                    Nenhuma ação encontrada para “{commandSearch}”.
                  </div>
                )}
              </div>

              <div className="admin-command-dialog__footer">
                <span className="admin-command-dialog__hint">
                  <span className="admin-command-dialog__hint-key">Enter</span>
                  Abrir primeira opção
                </span>

                <span className="admin-command-dialog__hint">
                  <span className="admin-command-dialog__hint-key">Esc</span>
                  Fechar
                </span>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="admin-toast" role="status" aria-live="polite">
            <span className="admin-toast__icon">
              <Icon name="check" size={17} />
            </span>

            <div>
              <strong className="admin-toast__title">{toast.title}</strong>
              <span className="admin-toast__description">
                {toast.description}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}