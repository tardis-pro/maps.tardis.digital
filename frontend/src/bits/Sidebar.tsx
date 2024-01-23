import { motion, useCycle } from "framer-motion";
import Dashboard from './Dashboard';
import Notification from './Notification';
import Settings from './Settings';
import Navigation from './Navigation';
import '../effects/Sidebar.css';

// Define variants outside the component to avoid re-definition on each render
const variant = {
    closed: {
        position: "absolute",
        zIndex: 2,
        pointerEvents: "none",
        background: "radial-gradient(ellipse 90% 125% at 50%, rgba(21, 0, 0, 0) 60%, rgba(21, 0, 0, 0.5) 70%, rgb(21, 0, 0, 1) 90%)"
    },
    open: {
        position: "absolute",
        zIndex: 2,
        pointerEvents: "none",
        background: "radial-gradient(ellipse 85% 125% at 60%, rgba(21, 0, 0, 0) 60%, rgba(21, 0, 0, 0.5) 70%, rgb(21, 0, 0, 1) 90%)"
    }
};

// Define transition outside the component to avoid re-definition on each render
const transition = { duration: 0.5 };

const Sidebar: React.FC = () => {
    const [isOpen, toggleOpen] = useCycle(false, true);

    return (
        <motion.nav animate={isOpen ? "open" : "closed"}>
            <motion.div variants={variant} style={{ width: '100vw', height: '100vh' }} transition={{duration: 0.5}}/>
            <motion.div className="sidebar">
                <motion.div className="clmn-1" variants={{ open: { width: 200 }, closed: { width: 63, transition: { width: { stiffness: 1000, duration: 0.5 } } } }}>
                    <ProfileContainer isOpen={isOpen} />
                    <motion.hr className='hr1' transition={transition} style={{zIndex:2}}/>
                    <Dashboard toggle={toggleOpen} />
                    <Notification />
                    <Settings />
                    <motion.hr className='hr2' variants={{ open: { y: -120 }, closed: { y: 0, transition: { y: { stiffness: 1000, duration: 0.5 } } } }} transition={transition} style={{zIndex:2}}/>
                    <Navigation isOpen={isOpen} />
                </motion.div>
            </motion.div>
        </motion.nav>
    )
}

const ProfileContainer: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <motion.div initial={{ width: 70 }} className='profile-container' variants={{ open: { width: 200 } }} transition={transition} style={{zIndex:2}}>
        <ProfileText isOpen={isOpen} />
    </motion.div>
);

const ProfileText: React.FC<{ isOpen: boolean }> = () => (
    <motion.div
        className="text"
        initial={{ opacity: 0 }}
        variants={{
            closed: { fontSize: '2px', opacity: 0 },
            open: { fontSize: '15px', opacity: 1 }
        }}
        transition={transition}
        style={{zIndex:2}}
    >
        Hi, Mr. Starbucks
    </motion.div>
);

export default Sidebar;
