import JobCard from "./JobCard";

export default function JobSection({ titulo, vagas }) {

    return (

        <section style={styles.section}>

            <h2 style={styles.title}>
                {titulo}
            </h2>

            <div style={styles.cardsContainer}>

                {vagas.map((vaga) => (
                    <JobCard
                        key={vaga.id}
                        vaga={vaga}
                    />
                ))}

            </div>

        </section>

    );
}




const styles = {

    section: {
        marginBottom: "50px"
    },

    title: {
        fontSize: "34px",
        fontWeight: "bold",
        marginBottom: "25px",
        color: "#111"
    },

    cardsContainer: {
        display: "flex",
        gap: "25px",
        flexWrap: "wrap"
    }

};