import { useState } from "react";
import Logo from "./../assets/logo-invertida.png";

export default function CreateResume() {

    const [experiencias, setExperiencias] = useState([{}]);
    const [formacoes, setFormacoes] = useState([{}]);
    const [cursos, setCursos] = useState([{}]);
    const [idiomas, setIdiomas] = useState([{}]);

    return (
        <div style={styles.page}>

            {/* CÍRCULOS */}
            <div style={styles.topCircle}></div>
            <div style={styles.bottomCircle}></div>

            {/* LOGO */}
            <div style={styles.logo}>
                <img src={Logo} alt="sla"  style={styles.image}/>
            </div>

            <div style={styles.container}>

                {/* INFORMAÇÕES PESSOAIS */}
                <section style={styles.section}>
                    <h2 style={styles.title}>Informações Pessoais</h2>

                    <div style={styles.personalGrid}>

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
                    <h2 style={styles.title}>Resumo Profissional</h2>

                    <textarea
                        style={styles.textarea}
                        placeholder="Profissional com experiência em..., com foco em.."
                    />
                </section>

                {/* EXPERIÊNCIA */}
                <section style={styles.section}>
                    <h2 style={styles.title}>Experiência Profissional</h2>

                    {experiencias.map((_, index) => (
                        <div key={index}>

                            <div style={styles.row}>
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
                            onClick={() => setExperiencias([...experiencias, {}])}
                        >
                            Adicionar mais Experiências +
                        </button>
                    </div>
                </section>

                {/* FORMAÇÃO */}
                <section style={styles.section}>
                    <h2 style={styles.title}>Formação Acadêmica</h2>

                    {formacoes.map((_, index) => (
                        <div key={index} style={styles.row}>
                            <input style={styles.smallInput} placeholder="Curso" />
                            <input style={styles.smallInput} placeholder="Instituição" />
                            <input style={styles.smallInput} placeholder="Período" />
                        </div>
                    ))}

                    <div style={styles.addButtonContainer}>
                        <button
                            style={styles.addButton}
                            onClick={() => setFormacoes([...formacoes, {}])}
                        >
                            Adicionar mais Formações +
                        </button>
                    </div>
                </section>

                {/* CURSOS */}
                <section style={styles.section}>
                    <h2 style={styles.title}>Cursos Complementares</h2>

                    {cursos.map((_, index) => (
                        <div key={index} style={styles.row}>
                            <input style={styles.smallInput} placeholder="Nome do Curso" />
                            <input style={styles.smallInput} placeholder="Instituição" />
                            <input style={styles.smallInput} placeholder="Período" />
                        </div>
                    ))}

                    <div style={styles.addButtonContainer}>
                        <button
                            style={styles.addButton}
                            onClick={() => setCursos([...cursos, {}])}
                        >
                            Adicionar mais Cursos +
                        </button>
                    </div>
                </section>

                {/* HABILIDADES */}
                <section style={styles.section}>
                    <h2 style={styles.title}>Habilidades</h2>

                    <input
                        style={styles.input}
                        placeholder="Ver Habilidades"
                    />
                </section>

                {/* IDIOMAS */}
                <section style={styles.section}>
                    <h2 style={styles.title}>Idiomas</h2>

                    {idiomas.map((_, index) => (
                        <div key={index} style={styles.row}>
                            <input style={styles.smallInput} placeholder="Idioma" />
                            <input style={styles.smallInput} placeholder="Nível" />
                        </div>
                    ))}

                    <div style={styles.addButtonContainer}>
                        <button
                            style={styles.addButton}
                            onClick={() => setIdiomas([...idiomas, {}])}
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
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow =
                                "0 10px 25px rgba(107,164,232,0.4)";
                        }}

                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        Criar Currículo
                    </button>
                </div>

            </div>

        </div>
    );
}

const styles = {

    page: {
        minHeight: "100vh",
        backgroundColor: "#000",
        padding: "50px 20px",
        fontFamily: "Poppins, sans-serif",
        position: "relative",
        overflow: "hidden"
    },

    topCircle: {
        position: "absolute",
        width: "450px",
        height: "450px",
        borderRadius: "50%",
        backgroundColor: "#6ba4e8",
        top: "-150px",
        right: "-150px",
    },

    bottomCircle: {
        position: "absolute",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        backgroundColor: "#6ba4e8",
        bottom: "-250px",
        left: "-250px",
    },

    logo: {
        textAlign: "left",
        marginLeft: "3%",
        position: "relative",
        zIndex: 2
    },

    image: {
        width: "190px",
        height: "auto", 
    },

    blueDot: {
        color: "#6ba4e8"
    },

    container: {
        maxWidth: "1000px",
        margin: "0 auto",
        position: "relative",
        zIndex: 2
    },

    section: {
        marginBottom: "55px"
    },

    title: {
        color: "#fff",
        marginBottom: "20px",
        fontSize: "30px",
        fontWeight: "700",
        textAlign: "left"
    },

    personalGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 250px",
        gap: "20px",
        alignItems: "stretch"
    },

    column: {
        display: "flex",
        flexDirection: "column",
        gap: "20px"
    },

    input: {
        width: "100%",
        padding: "16px 22px",
        borderRadius: "40px",
        border: "3px solid #6ba4e8",
        outline: "none",
        fontSize: "15px",
        transition: "0.3s",
        backgroundColor: "#fff",
        marginBottom: "15px",
        boxSizing: "border-box",
    },

    smallInput: {
        flex: 1,
        padding: "16px 22px",
        borderRadius: "40px",
        border: "2px solid #6ba4e8",
        outline: "none",
        fontSize: "15px",
        backgroundColor: "#fff"
    },

    textarea: {
        width: "100%",
        minHeight: "140px",
        padding: "20px",
        borderRadius: "25px",
        border: "2px solid #6ba4e8",
        resize: "none",
        outline: "none",
        fontSize: "15px",
        backgroundColor: "#fff"
    },

    highlightTextarea: {
        width: "100%",
        minHeight: "130px",
        padding: "20px",
        borderRadius: "25px",
        border: "2px solid #6ba4e8",
        resize: "none",
        outline: "none",
        marginTop: "15px",
        fontSize: "15px",
        backgroundColor: "#fff",
        marginBottom: "15px"
    },

    row: {
        display: "flex",
        gap: "20px",
        marginBottom: "20px"
    },

    uploadBox: {
        backgroundColor: "#fff",
        borderRadius: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#000",
        fontWeight: "600",
        minHeight: "180px",
        cursor: "pointer",
        transition: "0.3s",
        fontSize: "18px"
    },

    addButtonContainer: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "10px"
    },

    addButton: {
        background: "none",
        border: "none",
        color: "#6ba4e8",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "15px",
        transition: "0.3s"
    },

    footer: {
        display: "flex",
        justifyContent: "center",
        marginTop: "70px",
        marginBottom: "50px"
    },

    createButton: {
        background: "linear-gradient(135deg, #6ba4e8 0%, #4d8fe0 100%)",
        color: "#fff",
        border: "none",
        padding: "20px 60px",
        borderRadius: "20px",
        fontWeight: "bold",
        fontSize: "20px",
        cursor: "pointer",
        transition: "0.3s"
    }

};