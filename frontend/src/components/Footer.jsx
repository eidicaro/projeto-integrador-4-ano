import linkedin from "./../assets/linkedin.png"
import insta from "./../assets/insta.png"
import face from "./../assets/face.png"
import point from "./../assets/point.png"
import fatecPoint from "./../assets/fatecPoint.png"

export default function Footer() {

    return (

        <footer style={styles.footer}>

            <div style={styles.left}>

                <div style={styles.leftContainer}>

                    <div style={styles.logoBox}>
                        <img src={point} alt="Point Midia" style={styles.logoMajor} />
                    </div>
                    <div style={styles.logoBox}>
                        <img src={fatecPoint} alt="Point Midia" style={styles.logoMajor2} />
                    </div>

                </div>

                <div style={styles.centerContainer}>
                    <h3 style={styles.title}>Páginas</h3>

                    <p style={styles.link} onMouseEnter={(e) => { e.currentTarget.style.color = "#ff4fa3";}} onMouseLeave={(e) => {e.currentTarget.style.color = "#fff";}} >Perfil</p>
                    <p style={styles.link} onMouseEnter={(e) => { e.currentTarget.style.color = "#ff4fa3";}} onMouseLeave={(e) => {e.currentTarget.style.color = "#fff";}}>Vagas</p>
                    <p style={styles.link} onMouseEnter={(e) => { e.currentTarget.style.color = "#ff4fa3";}} onMouseLeave={(e) => {e.currentTarget.style.color = "#fff";}}>Portfólio</p>

                </div>
            </div>

            <div style={styles.rightContainer}>

                <div style={styles.socials}>

                  <img src={linkedin} alt="Point Midia" style={styles.logo}  />
                  <img src={insta} alt="Point Midia" style={styles.logo} />
                  <img src={face} alt="Point Midia" style={styles.logo} />

                </div>

                <p style={styles.location}>Vila Madalena - São Paulo - SP</p>
                <p style={styles.copyright}>© pointmedia 2026</p>

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

    left:{
        display: "flex",
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
        textAling: "left",
        marginLeft: "30%",
        width: "00%",
        gap: "8px",
    },

    title: {
        margin: 0,
        fontSize: "22px"
    },

    link: {
        margin: 0,
        cursor: "pointer",
        transition: "0.2s"
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
    },

    logo: {
        width: "50px"
    },

    logoMajor:{
        width: "100px"
    },
    logoMajor2:{
        width: "70px"
    }

};