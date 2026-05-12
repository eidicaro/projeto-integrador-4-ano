export default function JobCard({ vaga }) {

    return (

        <div style={styles.card}>

            <h3 style={styles.title}>{vaga.titulo}</h3>

            <img src={vaga.imagem} alt={vaga.titulo}  style={styles.image}/>

            <p style={styles.description}>{vaga.descricao}</p>

            <button style={styles.button}>Detalhes</button>

        </div>

    );
}




const styles = {

    card: {
        width: "280px",
        backgroundColor: "white",
        borderRadius: "18px",
        padding: "18px",
        boxShadow: "0 0 10px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        transition: "0.2s"
    },

    title: {
        margin: 0,
        marginBottom: "15px",
        fontSize: "28px",
        fontWeight: "bold",
        color: "#111"
    },

    image: {
        width: "100%",
        height: "160px",
        objectFit: "cover",
        borderRadius: "12px"
    },

    description: {
        marginTop: "15px",
        fontSize: "14px",
        color: "#444",
        lineHeight: "1.5"
    },

    button: {
        marginTop: "auto",
        padding: "12px",
        border: "none",
        borderRadius: "30px",
        backgroundColor: "#ff4fa3",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        cursor: "pointer"
    }

};