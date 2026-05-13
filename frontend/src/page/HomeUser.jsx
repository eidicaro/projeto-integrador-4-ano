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
            {
                id: 3,
                titulo: "UI/UX Designer",
                descricao: "Criação de interfaces modernas e intuitivas.",
                descricaoCompleta: "Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.Um desenvolvedor Full Stack é um profissional versátil que domina tanto o front-end quanto o back-end.",
                imagem: "https://images.unsplash.com/photo-1559028012-481c04fa702d",
                categoria: "Design",

                tags: [
                    "Remoto",
                    "Tempo Integral",
                    "Full Stack",
                    "React",
                    "Laravel"
                ],
            }
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
                            <button style={styles.curriculoButton}>Criar/Editar currículo</button>
                        </div>
                    </div>

                </header>

            )}

            {/* VAGAS */}

            <main style={styles.main}>

                {Object.entries(vagasAgrupadas).map(([categoria, vagas]) => (

                    <section key={categoria} style={styles.section}>

                        <h2 style={styles.sectionTitle}>{categoria}</h2>

                        <div style={styles.cardsContainer}>

                            {vagas.map((vaga) => (

                                <div key={vaga.id} style={styles.card}>

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
        backgroundColor: "#d9d9d9",
        fontFamily: "Arial"
    },

    header: {
        backgroundColor: "black",
        padding: "30px"
    },

    userContainer: {
        display: "flex",
        alignItems: "center",
        gap: "20px"
    },

    userImage: {
        width: "110px",
        height: "110px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #ff4fa3"
    },

    userName: {
        color: "white",
        margin: 0,
        fontSize: "32px",
        fontWeight: "600",
    },

    userText: {
        color: "white",
        margin: "5px 0",
    },

    curriculoButton: {
        marginTop: "10px",
        padding: "12px 20px",
        borderRadius: "30px",
        border: "none",
        backgroundColor: "#ff4fa3",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "16px",
    },

    main: {
        padding: "20px"
    },

    section: {
        marginBottom: "40px"
    },

    sectionTitle: {
        fontSize: "32px",
        marginBottom: "2%",
        marginLeft: "3%",
        color: "#000",
        fontWeight: "700",
        width: "fit-content",
        borderBottom: "4px solid #000",
        paddingBottom: "5px",
        borderRadius: "4px",
        
    },

    cardsContainer: {
        display: "flex",
        gap: "70px",
        flexWrap: "wrap",
        justifyContent: "left",
        margin: "0 0 0 15%",
    },

    card: {
        width: "280px",
        backgroundColor: "white",
        borderRadius: "15px",
        padding: "15px",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
    },

    cardTitle: {
        marginBottom: "15px"
    },

    cardImage: {
        width: "100%",
        height: "160px",
        objectFit: "cover",
        borderRadius: "10px"
    },

    cardDescription: {
        marginTop: "15px",
        fontSize: "14px",
        textAling: "justify",
    },

    detailsButton: {
        marginTop: "15px",
        width: "100%",
        padding: "12px",
        border: "none",
        borderRadius: "30px",
        backgroundColor: "#ff4fa3",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer"
    },

    footer: {
        backgroundColor: "black",
        color: "white",
        padding: "40px",
        marginTop: "40px"
    },

      // BOTÃO
      buttonContainer: {
        position: "relative",
        width: "180px",
        height: "40px",
        marginTop: "10px",
        margin: "10px auto 0 auto",
    },

    buttonBack: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: "30px",
        border: "3px solid #5dade2",
        top: "6px",
        left: "-9px",
        transition: "all 0.25s ease",
        opacity: 0.9,
    },

    buttonFront: {
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "30px",
        border: "none",
        background:"linear-gradient(135deg, #e85c8b 0%, #d94f82 100%)",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "15px",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow:
        "0 4px 15px rgba(232,92,139,0.25)",
  },

  headerInfos:{
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",

  }
};