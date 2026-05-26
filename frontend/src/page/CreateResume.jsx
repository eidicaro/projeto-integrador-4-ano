import { useState } from "react";
import Logo from "./../assets/logo-invertida.png";

export default function CreateResume() {

    const [experiencias, setExperiencias] = useState([{}]);
    const [formacoes, setFormacoes] = useState([{}]);
    const [cursos, setCursos] = useState([{}]);
    const [idiomas, setIdiomas] = useState([{}]);

    return (
        <>
            <style>{responsiveStyles}</style>

            <div style={styles.page}>

                {/* CÍRCULOS */}
                <div style={styles.topCircle}></div>
                <div style={styles.bottomCircle}></div>

                {/* LOGO */}
                <div style={styles.logo}>
                    <img
                        src={Logo}
                        alt="Logo"
                        style={styles.image}
                    />
                </div>

                <div style={styles.container}>

                    {/* INFORMAÇÕES PESSOAIS */}
                    <section style={styles.section}>

                        <h2 style={styles.title}>
                            Informações Pessoais
                        </h2>

                        <div
                            style={styles.personalGrid}
                            className="personal-grid"
                        >

                            <div style={styles.column}>
                                <input style={styles.input} placeholder="Nome Completo" />
                                <input style={styles.input} placeholder="Telefone" />
                                <input style={styles.input} placeholder="Cidade/Estado" />
                            </div>

                            <div style={styles.column}>
                                <input style={styles.input} placeholder="Área de trabalho" />
                                <input style={styles.input} placeholder="Email" />
                                <input style={styles.input} placeholder="Links ex: linkedin, git" />
                            </div>

                            <div style={styles.uploadBox}>
                                Enviar foto
                                <br />
                                (opcional)
                            </div>

                        </div>

                    </section>

                    {/* RESUMO */}
                    <section style={styles.section}>

                        <h2 style={styles.title}>
                            Resumo Profissional
                        </h2>

                        <textarea
                            style={styles.textarea}
                            placeholder="Profissional com experiência em..., com foco em..."
                        />

                    </section>

                    {/* EXPERIÊNCIA */}
                    <section style={styles.section}>

                        <h2 style={styles.title}>
                            Experiência Profissional
                        </h2>

                        {experiencias.map((_, index) => (
                            <div key={index}>

                                <div
                                    style={styles.row}
                                    className="responsive-row"
                                >
                                    <input style={styles.smallInput} placeholder="Cargo" />
                                    <input style={styles.smallInput} placeholder="Empresa" />
                                    <input style={styles.smallInput} placeholder="Período" />
                                </div>

                                <textarea
                                    style={styles.highlightTextarea}
                                    placeholder="Nos dê uma breve descrição da sua experiencia"
                                />

                            </div>
                        ))}

                        <div style={styles.addButtonContainer}>

                            <button
                                style={styles.addButton}
                                onClick={() =>
                                    setExperiencias([...experiencias, {}])
                                }
                            >
                                Adicionar mais Experiências +
                            </button>

                        </div>

                    </section>

                    {/* FORMAÇÃO */}
                    <section style={styles.section}>

                        <h2 style={styles.title}>
                            Formação Acadêmica
                        </h2>

                        {formacoes.map((_, index) => (
                            <div
                                key={index}
                                style={styles.row}
                                className="responsive-row"
                            >
                                <input style={styles.smallInput} placeholder="Curso" />
                                <input style={styles.smallInput} placeholder="Instituição" />
                                <input style={styles.smallInput} placeholder="Período" />
                            </div>
                        ))}

                        <div style={styles.addButtonContainer}>

                            <button
                                style={styles.addButton}
                                onClick={() =>
                                    setFormacoes([...formacoes, {}])
                                }
                            >
                                Adicionar mais Formações +
                            </button>

                        </div>

                    </section>

                    {/* CURSOS */}
                    <section style={styles.section}>

                        <h2 style={styles.title}>
                            Cursos Complementares
                        </h2>

                        {cursos.map((_, index) => (
                            <div
                                key={index}
                                style={styles.row}
                                className="responsive-row"
                            >
                                <input style={styles.smallInput} placeholder="Nome do Curso" />
                                <input style={styles.smallInput} placeholder="Instituição" />
                                <input style={styles.smallInput} placeholder="Período" />
                            </div>
                        ))}

                        <div style={styles.addButtonContainer}>

                            <button
                                style={styles.addButton}
                                onClick={() =>
                                    setCursos([...cursos, {}])
                                }
                            >
                                Adicionar mais Cursos +
                            </button>

                        </div>

                    </section>

                    {/* HABILIDADES */}
                    <section style={styles.section}>

                        <h2 style={styles.title}>
                            Habilidades
                        </h2>

                        <input
                            style={styles.input}
                            placeholder="Ver Habilidades"
                        />

                    </section>

                    {/* IDIOMAS */}
                    <section style={styles.section}>

                        <h2 style={styles.title}>
                            Idiomas
                        </h2>

                        {idiomas.map((_, index) => (
                            <div
                                key={index}
                                style={styles.row}
                                className="responsive-row"
                            >
                                <input style={styles.smallInput} placeholder="Idioma" />
                                <input style={styles.smallInput} placeholder="Nível" />
                            </div>
                        ))}

                        <div style={styles.addButtonContainer}>

                            <button
                                style={styles.addButton}
                                onClick={() =>
                                    setIdiomas([...idiomas, {}])
                                }
                            >
                                Adicionar mais Idiomas +
                            </button>

                        </div>

                    </section>

                    {/* BOTÃO */}
                    <div style={styles.footer}>

                        <button
                            style={styles.createButton}

                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(-3px)";

                                e.currentTarget.style.boxShadow =
                                    "0 10px 25px rgba(107,164,232,0.4)";
                            }}

                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(0)";

                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            Criar Currículo
                        </button>

                    </div>

                </div>

            </div>
        </>
    );
}

const styles = {

    page: {
        minHeight: "100vh",
        background:
            "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
        padding: "50px 20px",
        fontFamily: "Poppins, sans-serif",
        position: "relative",
        overflow: "hidden",
    },

    topCircle: {
        position: "absolute",
        width: "450px",
        height: "450px",
        borderRadius: "50%",
        background:
            "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
        top: "-150px",
        right: "-150px",
        opacity: 0.5,
        filter: "blur(20px)",
    },

    bottomCircle: {
        position: "absolute",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background:
            "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        bottom: "-250px",
        left: "-250px",
        opacity: 0.4,
        filter: "blur(20px)",
    },

    logo: {
        position: "relative",
        zIndex: 2,
        marginBottom: "40px",
        textAlign: "center",
    },

    image: {
        width: "190px",
        maxWidth: "70%",
        height: "auto",
    },

    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        position: "relative",
        zIndex: 2,
    },

    section: {
        marginBottom: "60px",
    },

    title: {
        color: "#fff",
        marginBottom: "24px",
        fontSize: "clamp(28px, 5vw, 36px)",
        fontWeight: "700",
        letterSpacing: "-1px",
    },

    personalGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 250px",
        gap: "20px",
        alignItems: "stretch",
    },

    column: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },

    input: {
        width: "100%",
        padding: "18px 22px",
        borderRadius: "18px",
        border: "2px solid rgba(96,165,250,0.35)",
        outline: "none",
        fontSize: "15px",
        transition: "0.3s",
        background:
            "rgba(255,255,255,0.92)",
        boxSizing: "border-box",
        color: "#0f172a",
    },

    smallInput: {
        flex: 1,
        minWidth: "0",
        padding: "18px 22px",
        borderRadius: "18px",
        border: "2px solid rgba(96,165,250,0.35)",
        outline: "none",
        fontSize: "15px",
        background:
            "rgba(255,255,255,0.92)",
        boxSizing: "border-box",
    },

    textarea: {
        width: "100%",
        minHeight: "160px",
        padding: "22px",
        borderRadius: "24px",
        border: "2px solid rgba(96,165,250,0.35)",
        resize: "vertical",
        outline: "none",
        fontSize: "15px",
        background:
            "rgba(255,255,255,0.92)",
        boxSizing: "border-box",
    },

    highlightTextarea: {
        width: "100%",
        minHeight: "140px",
        padding: "22px",
        borderRadius: "24px",
        border: "2px solid rgba(96,165,250,0.35)",
        resize: "vertical",
        outline: "none",
        marginTop: "15px",
        fontSize: "15px",
        background:
            "rgba(255,255,255,0.92)",
        marginBottom: "15px",
        boxSizing: "border-box",
    },

    row: {
        display: "flex",
        gap: "20px",
        marginBottom: "20px",
    },

    uploadBox: {
        background:
            "rgba(255,255,255,0.92)",
        borderRadius: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#0f172a",
        fontWeight: "600",
        minHeight: "180px",
        cursor: "pointer",
        transition: "0.3s",
        fontSize: "18px",
        border:
            "2px dashed rgba(96,165,250,0.5)",
        padding: "20px",
        boxSizing: "border-box",
    },

    addButtonContainer: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "10px",
    },

    addButton: {
        background: "none",
        border: "none",
        color: "#60a5fa",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "15px",
        transition: "0.3s",
    },

    footer: {
        display: "flex",
        justifyContent: "center",
        marginTop: "80px",
        marginBottom: "50px",
    },

    createButton: {
        width: "100%",
        maxWidth: "380px",
        background:
            "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
        color: "#fff",
        border: "none",
        padding: "20px 40px",
        borderRadius: "20px",
        fontWeight: "700",
        fontSize: "20px",
        cursor: "pointer",
        transition: "0.3s",
        boxSizing: "border-box",
    },
};

const responsiveStyles = `
*{
    box-sizing:border-box;
}

input,
textarea,
button{
    font-family:Poppins,sans-serif;
}

@media (max-width: 1024px){

    .personal-grid{
        grid-template-columns:1fr !important;
    }

}

@media (max-width: 768px){

    .responsive-row{
        flex-direction:column !important;
    }

}

@media (max-width: 640px){

    body{
        overflow-x:hidden;
    }

}
`;