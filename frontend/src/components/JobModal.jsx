import { useEffect, useId, useRef, useState } from "react";

function asParagraph(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean).join("\n• ");
    }

    return typeof value === "string" ? value.trim() : "";
}

function buildJobDescription(vaga) {
    const sections = [];
    const description = asParagraph(vaga?.description);
    const responsibilities = asParagraph(vaga?.responsibilities);
    const requirements = asParagraph(vaga?.requirements);
    const benefits = asParagraph(vaga?.benefits);

    if (description) sections.push(description);
    if (responsibilities) {
        sections.push(`Responsabilidades\n${responsibilities}`);
    }
    if (requirements) sections.push(`Requisitos\n${requirements}`);
    if (benefits) sections.push(`Benefícios\n• ${benefits}`);

    return sections.join("\n\n") || "A descrição desta vaga não foi informada.";
}

export default function JobModal({
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
    const [resumeSource, setResumeSource] = useState(hasOnlineResume ? "online" : "arquivo");
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

            if (previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus();
            }
        };
    }, [aberto, fechar]);

    if (!aberto || !vaga) return null;

    const tags = Array.isArray(vaga.tags) ? vaga.tags : [];
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
        ? "Enviando currículo..."
        : applied
          ? "Candidatura enviada"
          : isUnavailable
            ? "Vaga indisponível"
            : "Mandar currículo";
    const saveDisabled =
        saving || applying || typeof onSave !== "function";
    const saveLabel = saving
        ? "Salvando..."
        : saved
          ? "Remover das salvas"
          : "Salvar vaga";

    return (
        <>
            <style>{animationStyles}</style>

            <div
                style={styles.overlay}
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) fechar();
                }}
            >
                <div
                    ref={modalRef}
                    className="modal-responsive"
                    style={styles.modal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    aria-busy={applying || saving}
                    tabIndex={-1}
                >
                    <button
                        ref={closeButtonRef}
                        type="button"
                        aria-label="Fechar detalhes da vaga"
                        style={styles.closeButton}
                        onClick={fechar}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.transform = "scale(1.1)";
                            event.currentTarget.style.background = "#fee2e2";
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.transform = "scale(1)";
                            event.currentTarget.style.background = "#f1f5f9";
                        }}
                    >
                        ×
                    </button>

                    <div style={styles.megaHeader}>
                        {vaga.image && (
                            <img
                                src={vaga.image}
                                alt=""
                                style={styles.image}
                            />
                        )}

                        <div style={styles.header}>
                            <h1 id={titleId} style={styles.title}>
                                {vaga.title}
                            </h1>

                            {(vaga.company || vaga.location) && (
                                <p style={styles.meta}>
                                    {[vaga.company, vaga.location]
                                        .filter(Boolean)
                                        .join(" • ")}
                                </p>
                            )}

                            {tags.length > 0 && (
                                <div style={styles.tagsContainer}>
                                    {tags.map((tag) => (
                                        <span key={tag} style={styles.tag}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={styles.content}>
                        <h2 style={styles.sectionTitle}>Sobre a vaga</h2>
                        <div style={styles.titleLine} />
                        <div id={descriptionId} style={styles.description}>
                            {buildJobDescription(vaga)}
                        </div>
                    </div>

                    <div style={styles.footer}>
                        {(applyError || saveError) && (
                            <p style={styles.errorMessage} role="alert">
                                {applyError || saveError}
                            </p>
                        )}

                        {applied && (
                            <p style={styles.successMessage} role="status">
                                Seu currículo já foi enviado para esta vaga.
                            </p>
                        )}

                        {!applied && (
                            <fieldset style={styles.resumePicker}>
                                <legend style={styles.resumePickerLegend}>Qual currículo deseja enviar?</legend>
                                <label style={styles.resumeOption}>
                                    <input
                                        type="radio"
                                        name="resume-source"
                                        value="online"
                                        checked={resumeSource === "online"}
                                        disabled={!hasOnlineResume}
                                        onChange={() => setResumeSource("online")}
                                    />
                                    <span><strong>Currículo da Point</strong><small>{hasOnlineResume ? "Usar a versão online salva na sua conta." : "Crie e salve seu currículo online para habilitar."}</small></span>
                                </label>
                                <label style={styles.resumeOption}>
                                    <input
                                        type="radio"
                                        name="resume-source"
                                        value="arquivo"
                                        checked={resumeSource === "arquivo"}
                                        onChange={() => setResumeSource("arquivo")}
                                    />
                                    <span><strong>Enviar meu próprio PDF</strong><small>Arquivo PDF privado de até 5 MB.</small></span>
                                </label>
                                {resumeSource === "arquivo" && (
                                    <input
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        style={styles.resumeFile}
                                        onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                                    />
                                )}
                            </fieldset>
                        )}

                        <div style={styles.footerActions}>
                            <button
                                type="button"
                                style={{
                                    ...styles.saveButton,
                                    ...(saved ? styles.saveButtonSaved : {}),
                                    ...(saveDisabled
                                        ? styles.applyButtonDisabled
                                        : {}),
                                }}
                                disabled={saveDisabled}
                                aria-pressed={saved}
                                aria-busy={saving}
                                onClick={() => onSave(vaga)}
                            >
                                {saveLabel}
                            </button>

                            <button
                                type="button"
                                style={{
                                    ...styles.applyButton,
                                    ...(applyDisabled
                                        ? styles.applyButtonDisabled
                                        : {}),
                                    ...(applied ? styles.applyButtonApplied : {}),
                                }}
                                disabled={applyDisabled}
                                aria-busy={applying}
                                onClick={() => onApply(vaga, { source: resumeSource, file: resumeFile })}
                                onMouseEnter={(event) => {
                                    if (applyDisabled) return;
                                    event.currentTarget.style.transform =
                                        "translateY(-3px)";
                                    event.currentTarget.style.boxShadow =
                                        "0 15px 30px rgba(236,72,153,0.45)";
                                }}
                                onMouseLeave={(event) => {
                                    if (applyDisabled) return;
                                    event.currentTarget.style.transform =
                                        "translateY(0)";
                                    event.currentTarget.style.boxShadow =
                                        "0 10px 25px rgba(236,72,153,0.35)";
                                }}
                            >
                                {applyLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        zIndex: 999,
        overflowY: "auto",
        animation: "fadeIn 0.35s ease",
    },
    modal: {
        width: "100%",
        maxWidth: "950px",
        background: "rgb(255, 255, 255)",
        borderRadius: "32px",
        padding: "32px",
        position: "relative",
        maxHeight: "92vh",
        overflowY: "auto",
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        animation: "modalOpen 0.35s ease",
        boxSizing: "border-box",
        outline: "none",
    },
    closeButton: {
        position: "absolute",
        top: "18px",
        right: "18px",
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        border: "none",
        background: "#f1f5f9",
        color: "#0f172a",
        fontSize: "22px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.25s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
    },
    megaHeader: {
        display: "flex",
        gap: "28px",
        alignItems: "center",
        marginBottom: "35px",
        paddingRight: "42px",
        flexWrap: "wrap",
    },
    image: {
        width: "150px",
        height: "150px",
        borderRadius: "24px",
        objectFit: "cover",
        boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
        flexShrink: 0,
    },
    header: {
        flex: 1,
        minWidth: "min(250px, 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },
    title: {
        margin: "0 0 10px",
        fontWeight: "800",
        color: "#000",
        fontSize: "clamp(28px, 5vw, 38px)",
        lineHeight: "1.1",
        letterSpacing: "-1px",
        wordBreak: "break-word",
        textAlign: "left",
    },
    meta: {
        margin: "0 0 18px",
        color: "#475569",
        fontSize: "15px",
        fontWeight: "600",
    },
    tagsContainer: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
    },
    tag: {
        padding: "9px 16px",
        borderRadius: "999px",
        background: "#e0f2fe",
        color: "#0369a1",
        fontSize: "14px",
        fontWeight: "700",
        textAlign: "center",
    },
    content: {
        background: "rgb(228, 227, 227)",
        padding: "28px",
        borderRadius: "24px",
        border: "1px solid #e2e8f0",
    },
    sectionTitle: {
        fontSize: "clamp(22px, 4vw, 28px)",
        color: "#0f172a",
        fontWeight: "700",
        margin: "0 0 8px",
    },
    titleLine: {
        width: "120px",
        maxWidth: "70%",
        height: "5px",
        borderRadius: "999px",
        background: "linear-gradient(to right, #ec4899, #60a5fa)",
        marginBottom: "28px",
    },
    description: {
        lineHeight: "1.9",
        color: "#000",
        textAlign: "left",
        whiteSpace: "pre-line",
        fontSize: "15px",
        overflowWrap: "anywhere",
    },
    footer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        marginTop: "32px",
    },
    errorMessage: {
        width: "100%",
        maxWidth: "620px",
        margin: 0,
        padding: "12px 16px",
        borderRadius: "12px",
        background: "#fee2e2",
        color: "#991b1b",
        textAlign: "center",
        fontWeight: "700",
    },
    successMessage: {
        width: "100%",
        maxWidth: "620px",
        margin: 0,
        padding: "12px 16px",
        borderRadius: "12px",
        background: "#dcfce7",
        color: "#166534",
        textAlign: "center",
        fontWeight: "700",
    },
    footerActions: {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        gap: "12px",
        flexWrap: "wrap",
    },
    resumePicker: {
        width: "100%",
        maxWidth: "620px",
        display: "grid",
        gap: "10px",
        padding: "18px",
        border: "2px solid #141622",
        borderRadius: "18px",
        background: "#fffdf8",
    },
    resumePickerLegend: { padding: "0 8px", fontWeight: "900" },
    resumeOption: { display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" },
    resumeFile: { width: "100%", padding: "12px", border: "1px dashed #9183ff", borderRadius: "12px", background: "#f5f3ff" },
    saveButton: {
        width: "100%",
        maxWidth: "220px",
        padding: "16px 24px",
        borderRadius: "16px",
        border: "1px solid #f9a8d4",
        background: "#fff1f2",
        color: "#be185d",
        fontWeight: "700",
        fontSize: "16px",
        cursor: "pointer",
    },
    saveButtonSaved: {
        borderColor: "#f472b6",
        background: "#fce7f3",
    },
    applyButton: {
        width: "100%",
        maxWidth: "320px",
        padding: "16px 42px",
        borderRadius: "16px",
        border: "none",
        background: "rgba(231,106,157,1)",
        color: "white",
        fontWeight: "700",
        fontSize: "16px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 10px 25px rgba(236,72,153,0.35)",
    },
    applyButtonDisabled: {
        cursor: "not-allowed",
        opacity: 0.7,
        boxShadow: "none",
    },
    applyButtonApplied: {
        background: "#16a34a",
        opacity: 1,
    },
};

const animationStyles = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes modalOpen {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.96);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (max-width: 768px) {
    .modal-responsive {
        padding: 22px !important;
        border-radius: 24px !important;
    }
}
`;
