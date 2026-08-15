import linkedin from "./../assets/linkedin.png"
import insta from "./../assets/Insta.png"
import face from "./../assets/Face.png"
import point from "./../assets/point.png"
import fatecPoint from "./../assets/fatecPoint.png"
import { Link } from "react-router-dom"

export default function Footer() {

    return (

        <footer className="point-footer" style={styles.footer}>

            <style>{`
                @media (max-width: 720px) {
                    .point-footer { align-items: flex-start !important; padding: 34px 22px !important; }
                    .point-footer-left { width: 100%; flex-wrap: wrap; }
                    .point-footer-pages { margin-left: 0 !important; min-width: 130px; }
                    .point-footer-right { width: 100%; align-items: flex-start !important; }
                }
            `}</style>

            <div className="point-footer-left" style={styles.left}>

                <div style={styles.leftContainer}>

                    <div style={styles.logoBox}>
                        <img src={point} alt="Point Midia" style={styles.logoMajor} />
                    </div>
                    <div style={styles.logoBox}>
                        <img src={fatecPoint} alt="Point Midia" style={styles.logoMajor2} />
                    </div>

                </div>

                <nav className="point-footer-pages" style={styles.centerContainer} aria-label="Páginas do candidato">
                    <h3 style={styles.title}>Páginas</h3>

                    <Link to="/perfil" style={styles.link}>Perfil</Link>
                    <Link to="/homeUser" style={styles.link}>Vagas</Link>
                    <Link to="/createResume" style={styles.link}>Currículo</Link>

                </nav>
            </div>

            <div className="point-footer-right" style={styles.rightContainer}>

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
        gap: "40px",
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
        textAlign: "left",
        marginLeft: "20px",
        minWidth: "120px",
        gap: "8px",
    },

    title: {
        margin: 0,
        fontSize: "22px"
    },

    link: {
        margin: 0,
        cursor: "pointer",
        transition: "0.2s",
        color: "#fff",
        textDecoration: "none",
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
