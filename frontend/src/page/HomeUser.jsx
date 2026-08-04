import { useEffect, useState } from "react";
import Footer from "./../components/Footer";
import JobModal from "./../components/JobModal";

export default function HomeUser() {

    const [usuario, setUsuario] = useState(null);
    const [vagas, setVagas] = useState([]);
    const [vagaSelecionada, setVagaSelecionada] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {

        const mockUsuario = {
            nome: "Usuário Aleatório",
            email: "usuarioaleatorio@gmail.com",
            telefone: "15 99773-1901",
            foto: "https://i.pravatar.cc/150"
        };

        const mockVagas = [
            {
                id: 1,
                titulo: "Dev FullStack",
                descricao: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                descricaoCompleta: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                imagem: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
                categoria: "Programação",

                tags: [
                    "Remoto",
                    "Tempo Integral",
                    "Full Stack",
                    "React",
                    "Laravel"
                ],
            },
            {
                id: 1,
                titulo: "Dev FullStack",
                descricao: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                descricaoCompleta: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                imagem: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
                categoria: "Programação",

                tags: [
                    "Remoto",
                    "Tempo Integral",
                    "Full Stack",
                    "React",
                    "Laravel"
                ],
            },
            {
                id: 1,
                titulo: "Dev FullStack",
                descricao: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                descricaoCompleta: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                imagem: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
                categoria: "Programação",

                tags: [
                    "Remoto",
                    "Tempo Integral",
                    "Full Stack",
                    "React",
                    "Laravel"
                ],
            },
            {
                id: 1,
                titulo: "Dev FullStack",
                descricao: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                descricaoCompleta: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                imagem: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
                categoria: "Programação",

                tags: [
                    "Remoto",
                    "Tempo Integral",
                    "Full Stack",
                    "React",
                    "Laravel"
                ],
            },
            {
                id: 1,
                titulo: "Dev FullStack",
                descricao: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                descricaoCompleta: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                imagem: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
                categoria: "Programação",

                tags: [
                    "Remoto",
                    "Tempo Integral",
                    "Full Stack",
                    "React",
                    "Laravel"
                ],
            },
            {
                id: 2,
                titulo: "Social Media",
                descricao: "Responsável pelas redes sociais da empresa.",
                descricaoCompleta: `Sobre a vaga
                Quando você pensa em carreira, o que vem à sua mente? Propósito? Colaboração? Ser protagonista para fazer a diferença? No PagBank temos tudo isso e muito mais. 💛


                Estamos em busca de pessoas que vistam a camisa com orgulho. Gente com vontade de facilitar a vida financeira das pessoas e impulsionar negócios!


                Tá a fim de uma carreira que rende mais? Confira essa oportunidade e #VemProPags!



                Responsabilidades e atribuições

                Experiência com linguagem de programação Java.
                Experiência com desenvolvimento para ambiente Unix e Linux.
                Conhecimento em estrutura de dados, algoritmos e depuração de código


                Requisitos e qualificações

                Conhecimento em Docker e Kubernetes
                Experiência com bancos de dados relacionais
                Experiência com Spring Boot.
                Experiência com testes unitários e integrados
                Experiência com Kafka
                Experiência com ferramentas e práticas de monitoração de sistemas como Grafana ou New Relic.
                Conhecimento em plataforma de automação continua, como Jenkins.


                Informações adicionais

                Diferencial:
                Conhecimento em AWS
                Conhecimento em Spring Batch
                Conhecimento em Quartz Scheduler`,
                imagem: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
                categoria: "Marketing",

                tags: [
                    "Remoto",
                    "Tempo Integral",
                    "Full Stack",
                    "React",
                    "Laravel"
                ],
            },
           
        ];

        setUsuario(mockUsuario);
        setVagas(mockVagas);

    }, []);




    const vagasAgrupadas = vagas.reduce((acc, vaga) => {

        if (!acc[vaga.categoria]) {
            acc[vaga.categoria] = [];
        }

        acc[vaga.categoria].push(vaga);

        return acc;

    }, {});




    return (
        <div style={styles.container}>

            {/* HEADER */}

            {usuario && (
                <header style={styles.header}>
                    <div style={styles.userContainer}>
                        <img   src={usuario.foto}  alt="Usuário"  style={styles.userImage}/>

                        <div style={styles.headerInfos}>
                            <h1 style={styles.userName}>{usuario.nome}</h1>
                            <p style={styles.userText}>{usuario.email}</p>
                            <p style={styles.userText}>{usuario.telefone}</p>
                            <button style={styles.curriculoButton}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = "#ff2f8b";
                                }}
                            
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "#ff4fa3";
                                }}>Criar/Editar currículo</button>
                        </div>
                    </div>

                </header>

            )}

            {/* VAGAS */}

            <main style={styles.main}>

            <div style={styles.welcomeBox}>
                <h2 style={styles.welcomeTitle}>
                    Encontre sua próxima oportunidade 🚀
                </h2>

                <p style={styles.welcomeText}>
                    Explore vagas disponíveis nas áreas de tecnologia,
                    design, marketing e muito mais.
                </p>
            </div>

                {Object.entries(vagasAgrupadas).map(([categoria, vagas]) => (

                    <section key={categoria} style={styles.section}>
                        <div>
                            <h2 style={styles.sectionTitle}>{categoria}</h2>
                            <div style={styles.titleLine}></div>
                        </div>
                        <div style={styles.cardsContainer}>
                            {vagas.map((vaga) => (

                                    <div
                                    key={vaga.id}
                                    style={styles.card}

                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-8px)";
                                        e.currentTarget.style.boxShadow =
                                        "0 20px 40px rgba(15,23,42,0.15)";
                                    }}

                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                        "0 10px 30px rgba(15,23,42,0.08)";
                                    }}
                                    >
                                    <h3 style={styles.cardTitle}>{vaga.titulo}</h3>
                                    <img  src={vaga.imagem} alt={vaga.titulo}   style={styles.cardImage}/>
                                    <p style={styles.cardDescription}>{vaga.descricao}</p>

                                    {/* BOTÃO */}
                                    <div style={styles.buttonContainer}  className="login-button-container">
                                        {/* BORDA AZUL */}
                                        <div style={styles.buttonBack}></div>
                                        {/* BOTÃO ROSA */}
                                        <button
                                        type="submit"
                                        style={styles.buttonFront}
                                        className="login-button-front"
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = "translateY(-3px)";
                                            e.target.style.boxShadow =
                                            "0 10px 25px rgba(232,92,139,0.45)";
                                        }}

                                        onMouseLeave={(e) => {
                                            e.target.style.transform = "translateY(0)";
                                            e.target.style.boxShadow = "none";
                                        }}

                                        onMouseDown={(e) => {
                                            e.target.style.transform = "translateY(2px)";
                                        }}

                                        onMouseUp={(e) => {
                                            e.target.style.transform = "translateY(-3px)";
                                        }}

                                        onClick={() => {
                                            setVagaSelecionada(vaga);
                                            setModalAberto(true);
                                        }}
                                        >
                                        Descrição
                                        </button>
                                        <p style={styles.cardDescription}>{vaga.descricao}</p>

                                        <div style={styles.tagsContainer}>
                                            {vaga.tags.map((tag, index) => (
                                                <span key={index} style={styles.tag}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>                  
                                    </div>
                                </div>
                            ))}

                        </div>

                    </section>

                ))}

            <JobModal
                vaga={vagaSelecionada}
                aberto={modalAberto}
                fechar={() => setModalAberto(false)}
            />

            </main>

            {/* FOOTER */}
            <Footer></Footer>

        </div>
    );
}




const styles = {

    container: {
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
        fontFamily: "Arial, sans-serif",
    },

    header: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "50px 8%",
        borderBottomLeftRadius: "30px",
        borderBottomRightRadius: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    },

    userContainer: {
        display: "flex",
        alignItems: "center",
        gap: "25px",
        flexWrap: "wrap",
    },

    userImage: {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "4px solid rgba(255,255,255,0.2)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
    },

    headerInfos: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
    },

    userName: {
        color: "white",
        margin: 0,
        fontSize: "38px",
        fontWeight: "700",
        letterSpacing: "-1px",
    },

    userText: {
        color: "#cbd5e1",
        margin: "6px 0",
        fontSize: "15px",
    },

    curriculoButton: {
        marginTop: "18px",
        padding: "14px 24px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        color: "white",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "15px",
        transition: "all 0.25s ease",
        boxShadow: "0 10px 20px rgba(236,72,153,0.35)",
    },

    main: {
        padding: "60px 8%",
    },

    welcomeBox: {
        marginBottom: "60px",
    },

    welcomeTitle: {
        fontSize: "44px",
        color: "#0f172a",
        marginBottom: "12px",
        fontWeight: "700",
    },

    welcomeText: {
        color: "#64748b",
        fontSize: "18px",
        lineHeight: "1.6",
    },

    section: {
        marginBottom: "70px",
    },

    sectionTitle: {
        fontSize: "34px",
        color: "#0f172a",
        fontWeight: "700",
        marginBottom: "8px",
    },

    titleLine: {
        width: "120px",
        height: "5px",
        borderRadius: "999px",
        background: "linear-gradient(to right, #ec4899, #60a5fa)",
        marginBottom: "35px",
    },

    cardsContainer: {
        display: "flex",
        gap: "32px",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "stretch",
    },

    card: {
        width: "320px",
        minHeight: "520px",
    
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(10px)",
    
        borderRadius: "24px",
        padding: "18px",
    
        border: "1px solid rgba(255,255,255,0.4)",
    
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
    
        transition: "all 0.3s ease",
        cursor: "pointer",
    
        overflow: "hidden",
    },

    cardTitle: {
        marginBottom: "16px",
        fontSize: "22px",
        color: "#0f172a",
        fontWeight: "700",
    
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },

    cardImage: {
        width: "100%",
        height: "190px",
        minHeight: "190px",
        objectFit: "cover",
        borderRadius: "18px",
    
        display: "block",
    },

    cardDescription: {
        marginTop: "16px",
    
        fontSize: "14px",
        color: "#475569",
    
        lineHeight: "1.7",
    
        textAlign: "justify",
    
        overflow: "hidden",
    
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
    
        minHeight: "95px",
    },

    tagsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "18px",
    
        overflow: "hidden",
    },

    tag: {
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        padding: "7px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "600",
    },

    buttonContainer: {
        position: "relative",
        width: "180px",
        height: "44px",
        marginTop: "25px",
        marginLeft: "auto",
        marginRight: "auto",
    },

    buttonBack: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        border: "2px solid #60a5fa",
        top: "6px",
        left: "-8px",
        transition: "all 0.25s ease",
        opacity: 0.9,
    },

    buttonFront: {
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "16px",
        border: "none",
        background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        color: "#fff",
        fontWeight: "700",
        fontSize: "15px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 4px 15px rgba(236,72,153,0.25)",
    },

    footer: {
        background: "#0f172a",
        color: "white",
        padding: "50px",
        marginTop: "50px",
    },
};