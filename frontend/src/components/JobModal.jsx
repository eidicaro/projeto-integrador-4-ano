export default function JobModal({
    vaga,
    aberto,
    fechar
}) {

    if (!aberto || !vaga) return null;

    return (
        <>
            <style>{animationStyles}</style>

            <div style={styles.overlay}>

                <div style={styles.modal}>

                    {/* BOTÃO FECHAR */}
                    <button
                        style={styles.closeButton}
                        onClick={fechar}

                        onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.1)";
                            e.target.style.background = "#fee2e2";
                        }}

                        onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.background = "#f1f5f9";
                        }}
                    >
                        ✕
                    </button>

                    {/* HEADER */}
                    <div style={styles.megaHeader}>

                        <img
                            src={vaga.imagem}
                            alt={vaga.titulo}
                            style={styles.image}
                        />

                        <div style={styles.header}>

                            <h1 style={styles.title}>
                                {vaga.titulo}
                            </h1>

                            <div style={styles.tagsContainer}>
                                {vaga.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        style={styles.tag}

                                        onMouseEnter={(e) => {
                                            e.target.style.transform = "translateY(-2px)";
                                            e.target.style.background = "#0ea5e9";
                                            e.target.style.color = "#fff";
                                        }}

                                        onMouseLeave={(e) => {
                                            e.target.style.transform = "translateY(0)";
                                            e.target.style.background = "#e0f2fe";
                                            e.target.style.color = "#0369a1";
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                        </div>

                    </div>

                    {/* DESCRIÇÃO */}
                    <div style={styles.content}>

                        <h2 style={styles.sectionTitle}>
                            Sobre a vaga
                        </h2>

                        <div style={styles.titleLine}></div>

                        <div style={styles.description}>
                            {vaga.descricaoCompleta}
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div style={styles.footer}>

                        <button
                            style={styles.applyButton}

                            onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-3px)";
                                e.target.style.boxShadow =
                                    "0 15px 30px rgba(236,72,153,0.45)";
                            }}

                            onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 10px 25px rgba(236,72,153,0.35)";
                            }}
                        >
                            Mandar Currículo
                        </button>

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


        boxShadow:
            "0 25px 60px rgba(0,0,0,0.25)",

        animation: "modalOpen 0.35s ease",

        boxSizing: "border-box",
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

        fontSize: "18px",
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

        flexWrap: "wrap",
    },

    image: {
        width: "150px",
        height: "150px",

        borderRadius: "24px",

        objectFit: "cover",

        boxShadow:
            "0 10px 30px rgba(15,23,42,0.18)",

        flexShrink: 0,
    },

    header: {
        flex: 1,

        minWidth: "250px",

        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },

    title: {
        marginBottom: "20px",

        fontWeight: "800",

        color: "#000",

        fontSize: "clamp(28px, 5vw, 38px)",

        lineHeight: "1.1",

        letterSpacing: "-1px",

        wordBreak: "break-word",

        textAlign: "left"
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

        fontSize: "13px",

        fontWeight: "700",

        transition: "all 0.25s ease",

        cursor: "default",

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

        marginBottom: "8px",
    },

    titleLine: {
        width: "120px",

        height: "5px",

        borderRadius: "999px",

        background:
            "linear-gradient(to right, #ec4899, #60a5fa)",

        marginBottom: "28px",
    },

    description: {
        lineHeight: "1.9",

        color: "#000",

        textAlign: "justify",

        whiteSpace: "pre-line",

        fontSize: "15px",

        wordBreak: "break-word",
    },

    footer: {
        display: "flex",

        justifyContent: "center",

        marginTop: "32px",
    },

    applyButton: {
        width: "100%",
        maxWidth: "320px",

        padding: "16px 42px",

        borderRadius: "16px",

        border: "none",

        background:
            "rgba(231,106,157,1)",

        color: "white",

        fontWeight: "700",

        fontSize: "16px",

        cursor: "pointer",

        transition: "all 0.25s ease",

        boxShadow:
            "0 10px 25px rgba(236,72,153,0.35)",
    },
};

const animationStyles = `
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
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