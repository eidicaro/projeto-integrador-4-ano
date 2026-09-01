import { useEffect, useId, useRef, useState } from "react";

function asParagraph(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join("\n• ");
    return typeof value === "string" ? value.trim() : "";
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === "") return null;

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function salaryLabel(vaga) {
    if (!vaga?.salaryVisible) return "A combinar";

    const minimum = formatCurrency(vaga.salaryMin);
    const maximum = formatCurrency(vaga.salaryMax);

    if (minimum && maximum) return `${minimum} – ${maximum}`;
    if (minimum) return `A partir de ${minimum}`;
    if (maximum) return `Até ${maximum}`;
    return "A combinar";
}

function dateLabel(value) {
    if (!value) return "Sem prazo definido";

    const parsed = new Date(`${value}T12:00:00`);

    return Number.isNaN(parsed.getTime())
        ? "Sem prazo definido"
        : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(parsed);
}

export default function CandidateJobDetailsModal({
    vaga,
    aberto,
    fechar,
    onApply,
    applying = false,
    applied = false,
    applyError = "",
    onSave,
    saving = false,
    saved = false,
    saveError = "",
    hasOnlineResume = false,
}) {
    const modalRef = useRef(null);
    const closeButtonRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    const resumeGroupName = useId();
    const [resumeSource, setResumeSource] = useState(
        hasOnlineResume ? "online" : "arquivo",
    );
    const [resumeFile, setResumeFile] = useState(null);

    useEffect(() => {
        if (!aberto) return undefined;

        const previouslyFocused = document.activeElement;
        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const focusFrame = window.requestAnimationFrame(() => {
            closeButtonRef.current?.focus();
        });

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                fechar();
                return;
            }

            if (event.key !== "Tab" || !modalRef.current) return;

            const focusableElements = Array.from(
                modalRef.current.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            );

            if (focusableElements.length === 0) {
                event.preventDefault();
                modalRef.current.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements.at(-1);

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === lastElement
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousBodyOverflow;
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [aberto, fechar]);

    if (!aberto || !vaga) return null;

    const tags = Array.isArray(vaga.tags) ? vaga.tags : [];
    const benefits = Array.isArray(vaga.benefits)
        ? vaga.benefits.filter(Boolean)
        : asParagraph(vaga.benefits)
          ? [asParagraph(vaga.benefits)]
          : [];
    const description =
        asParagraph(vaga.description) ||
        "A descrição desta vaga não foi informada.";
    const responsibilities = asParagraph(vaga.responsibilities);
    const requirements = asParagraph(vaga.requirements);
    const isUnavailable = vaga.isOpen === false;
    const applyDisabled =
        applying ||
        saving ||
        applied ||
        isUnavailable ||
        typeof onApply !== "function" ||
        (resumeSource === "online" && !hasOnlineResume) ||
        (resumeSource === "arquivo" && !resumeFile);
    const applyLabel = applying
        ? "Enviando…"
        : applied
          ? "Candidatura enviada"
          : isUnavailable
            ? "Inscrições encerradas"
            : "Candidatar agora";
    const saveDisabled = saving || applying || typeof onSave !== "function";
    const saveLabel = saving
        ? "Salvando…"
        : saved
          ? "Remover dos salvos"
          : "Salvar vaga";

    return (
        <div
            className="candidate-job-modal__overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) fechar();
            }}
        >
            <article
                ref={modalRef}
                className="candidate-job-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                aria-busy={applying || saving}
                tabIndex={-1}
            >
                <div className="candidate-job-modal__topbar">
                    <span>Detalhes da oportunidade</span>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        className="candidate-job-modal__close"
                        aria-label="Fechar detalhes da vaga"
                        onClick={fechar}
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>

                <div className="candidate-job-modal__body">
                    <header className="candidate-job-modal__hero">
                        <div className="candidate-job-modal__heading">
                            <span className="candidate-eyebrow">
                                {vaga.department || vaga.category || "Oportunidade"}
                            </span>
                            <h1 id={titleId}>{vaga.title}</h1>
                            <p className="candidate-job-modal__company">
                                {[vaga.company, vaga.location].filter(Boolean).join(" · ") ||
                                    "Empresa e local não informados"}
                            </p>
                        </div>

                        <div className="candidate-job-modal__actions">
                            <button
                                type="button"
                                className="candidate-button-secondary"
                                disabled={saveDisabled}
                                aria-pressed={saved}
                                aria-busy={saving}
                                onClick={() => onSave?.(vaga)}
                            >
                                {saveLabel}
                            </button>
                            <button
                                type="button"
                                className="candidate-button"
                                disabled={applyDisabled}
                                aria-busy={applying}
                                onClick={() =>
                                    onApply?.(vaga, {
                                        source: resumeSource,
                                        file: resumeFile,
                                    })
                                }
                            >
                                {applyLabel}
                            </button>
                        </div>
                    </header>

                    {(applyError || saveError) && (
                        <div className="candidate-alert" role="alert">
                            {applyError || saveError}
                        </div>
                    )}

                    {applied && (
                        <div className="candidate-alert candidate-alert--success" role="status">
                            Seu currículo já foi enviado para esta vaga.
                        </div>
                    )}

                    {!applied && (
                        <section className="candidate-panel candidate-job-modal__resume">
                            <div className="candidate-job-modal__resume-heading">
                                <span className="candidate-eyebrow">
                                    Documento da candidatura
                                </span>
                                <h2>Escolha seu currículo</h2>
                                <p>Defina qual versão será enviada junto à sua candidatura.</p>
                            </div>

                            <div className="candidate-job-modal__resume-options">
                                <label
                                    className={
                                        hasOnlineResume
                                            ? ""
                                            : "candidate-job-modal__resume-option--disabled"
                                    }
                                >
                                    <input
                                        type="radio"
                                        name={resumeGroupName}
                                        value="online"
                                        checked={resumeSource === "online"}
                                        disabled={!hasOnlineResume}
                                        onChange={() => setResumeSource("online")}
                                    />
                                    <span>
                                        <strong>Currículo da Point</strong>
                                        <small>
                                            {hasOnlineResume
                                                ? "Usar a versão online salva na sua conta."
                                                : "Crie seu currículo online para habilitar esta opção."}
                                        </small>
                                    </span>
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name={resumeGroupName}
                                        value="arquivo"
                                        checked={resumeSource === "arquivo"}
                                        onChange={() => setResumeSource("arquivo")}
                                    />
                                    <span>
                                        <strong>Enviar meu próprio PDF</strong>
                                        <small>Arquivo PDF privado de até 5 MB.</small>
                                    </span>
                                </label>
                            </div>

                            {resumeSource === "arquivo" && (
                                <input
                                    className="candidate-job-modal__file"
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    aria-label="Selecionar currículo em PDF"
                                    onChange={(event) =>
                                        setResumeFile(event.target.files?.[0] || null)
                                    }
                                />
                            )}
                        </section>
                    )}

                    <section className="candidate-job-modal__facts" aria-label="Resumo da vaga">
                        <div><span>Modelo</span><strong>{vaga.workMode || "Não informado"}</strong></div>
                        <div><span>Contrato</span><strong>{vaga.employmentType || "Não informado"}</strong></div>
                        <div><span>Senioridade</span><strong>{vaga.seniority || "Não informada"}</strong></div>
                        <div><span>Salário</span><strong>{salaryLabel(vaga)}</strong></div>
                    </section>

                    <div className="candidate-job-modal__content">
                        <section>
                            <h2>Sobre a oportunidade</h2>
                            <p id={descriptionId}>{description}</p>
                            {tags.length > 0 && (
                                <div className="job-tags">
                                    {tags.map((tag) => <span key={tag}>{tag}</span>)}
                                </div>
                            )}
                        </section>

                        {responsibilities && (
                            <section>
                                <h2>Responsabilidades</h2>
                                <p>{responsibilities}</p>
                            </section>
                        )}

                        <section>
                            <h2>Requisitos</h2>
                            <p>{requirements || "Os requisitos serão apresentados durante o processo."}</p>
                        </section>

                        {benefits.length > 0 && (
                            <section>
                                <h2>Benefícios</h2>
                                <p>{benefits.map((benefit) => `• ${benefit}`).join("\n")}</p>
                            </section>
                        )}

                        <section className="candidate-job-modal__deadline">
                            <div>
                                <span className="candidate-eyebrow">Prazo</span>
                                <h2>Prazo para candidatura</h2>
                            </div>
                            <strong>{dateLabel(vaga.applicationDeadline)}</strong>
                        </section>
                    </div>
                </div>
            </article>
        </div>
    );
}
