export default function Footer() {

    return (

        <footer style={styles.footer}>

            <div style={styles.leftContainer}>

                <div style={styles.logoBox}>
                    LOGO
                </div>

                <div style={styles.logoBox}>
                    FATEC
                </div>

            </div>




            <div style={styles.centerContainer}>

                <h3 style={styles.title}>
                    Páginas
                </h3>

                <p style={styles.link}>
                    Meu Perfil
                </p>

                <p style={styles.link}>
                    Vagas
                </p>

                <p style={styles.link}>
                    Meu Portfólio
                </p>

            </div>




            <div style={styles.rightContainer}>

                <div style={styles.socials}>

                    <div style={styles.socialIcon}>
                        in
                    </div>

                    <div style={styles.socialIcon}>
                        ig
                    </div>

                    <div style={styles.socialIcon}>
                        f
                    </div>

                </div>

                <p style={styles.location}>
                    Vila Madalena - São Paulo - SP
                </p>

                <p style={styles.copyright}>
                    © pointmedia 2026
                </p>

            </div>

        </footer>

    );
}




const styles = {

    footer: {
        backgroundColor: "black",
        color: "white",
        padding: "40px 60px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "30px"
    },

    leftContainer: {
        display: "flex",
        gap: "20px",
        alignItems: "center"
    },

    logoBox: {
        width: "90px",
        height: "90px",
        backgroundColor: "white",
        borderRadius: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "black",
        fontWeight: "bold"
    },

    centerContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },

    title: {
        margin: 0,
        fontSize: "22px"
    },

    link: {
        margin: 0,
        cursor: "pointer"
    },

    rightContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px"
    },

    socials: {
        display: "flex",
        gap: "15px"
    },

    socialIcon: {
        width: "45px",
        height: "45px",
        borderRadius: "50%",
        backgroundColor: "white",
        color: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        cursor: "pointer"
    },

    location: {
        margin: 0,
        fontSize: "14px"
    },

    copyright: {
        margin: 0,
        color: "#ff4fa3",
        fontSize: "14px"
    }

};