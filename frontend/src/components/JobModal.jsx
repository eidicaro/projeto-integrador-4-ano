export default function JobModal({
    vaga,
    aberto,
    fechar
}) {

    if (!aberto || !vaga) return null;

    return (

        <div style={styles.overlay}>

            <div style={styles.modal}>

                {/* FECHAR */}
                <button
                    style={styles.closeButton}
                    onClick={fechar}
                >
                    X
                </button>
                <div style={styles.megaHeader}>
                    <img src={vaga.imagem} alt={vaga.titulo} style={styles.image}/>
                    {/* HEADER */}
                    <div style={styles.header}>
                        <div>

                            <h1 style={styles.title}>{vaga.titulo}</h1>

                            <div style={styles.tagsContainer}>
                                {vaga.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        style={styles.tag}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                        </div>

                    </div>
                </div>

                {/* DESCRIÇÃO */}
                <div style={styles.content}>
                <div style={styles.description}>{vaga.descricaoCompleta}</div>
                </div>

                {/* BOTÃO */}
                <div style={styles.footer}>
                    <button style={styles.applyButton}>Mandar Currículo</button>
                </div>

            </div>

        </div>

    );
}




const styles = {

    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999
    },

    modal: {
        width: "80%",
        maxWidth: "900px",
        backgroundColor: "#000",
        borderRadius: "10px",
        padding: "30px",
        position: "relative",
        maxHeight: "90vh",
        overflowY: "auto"
    },

    closeButton: {
        position: "absolute",
        top: "15px",
        right: "15px",
        border: "none",
        background: "transparent",
        color: "#fff",
        fontSize: "22px",
        cursor: "pointer"
    },

    megaHeader:{
        display: "flex",
        gap: "2%",
    },

    header: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "25px"
    },
    
    title: {
        marginBottom: "15px",
        fontWeight: "700",
        color: "#fff",
        textAlign: "left",
        width: "fit-content",
        borderBottom: "4px solid #fff",
        paddingBottom: "5px",
        borderRadius: "4px",
    },

    image: {
        width: "120px",
        height: "120px",
        borderRadius: "10px",
        objectFit: "cover"
    },
    
    tagsContainer: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center"
    },

    tag: {
        padding: "8px 18px",
        borderRadius: "20px",
        border: "2px solid #5dade2",
        backgroundColor: "#000",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "bold"
    },

    content: {
        backgroundColor: "#ddd",
        padding: "20px",
        borderRadius: "10px"
    },

    description: {
        lineHeight: "1.7",
        textAlign: "justify",
        whiteSpace: "pre-line",
    },

    footer: {
        display: "flex",
        justifyContent: "center",
        marginTop: "25px"
    },

    applyButton: {
        padding: "15px 40px",
        borderRadius: "30px",
        border: "none",
        backgroundColor: "#ff4fa3",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        cursor: "pointer"
    }

};