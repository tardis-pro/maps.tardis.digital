import { motion, useCycle } from "framer-motion";
import Dashboard from './Dashboard';
import Notification from './Notification';
import Settings from './Settings';
import Navigation from './Navigation';
import '../effects/Sidebar.css';

// Define variants outside the component to avoid re-definition on each render
const variants = {
    closed: {
        position: "absolute",
        zIndex: 10,
        background: "radial-gradient(ellipse 90% 125% at 50%, rgba(21, 0, 0, 0) 60%, rgba(21, 0, 0, 0.5) 70%, rgb(21, 0, 0, 1) 90%)"
    },
    open: {
        position: "absolute",
        zIndex: 10,
        background: "radial-gradient(ellipse 80% 125% at 60%, rgba(21, 0, 0, 0) 60%, rgba(21, 0, 0, 0.5) 70%, rgb(21, 0, 0, 1) 90%)"
    }
};

// Define transition outside the component to avoid re-definition on each render
const transition = { duration: 0.5 };

const Sidebar: React.FC = () => {
    const [isOpen, toggleOpen] = useCycle(false, true);

    return (
        <motion.nav animate={isOpen ? "open" : "closed"} variants={variants}>
            <motion.div className="sidebar">
                <motion.div className="clmn-1" variants={{ open: { width: 200 } }}>
                    <ProfileContainer isOpen={isOpen} />
                    <motion.hr className='hr1' transition={transition} />
                    <Dashboard toggle={toggleOpen} />
                    <Notification />
                    <Settings />
                    <motion.hr className='hr2' variants={{ open: { y: -120 } }} transition={transition} />
                    <Navigation />
                </motion.div>
            </motion.div>
        </motion.nav>
    )
}

const ProfileContainer: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <motion.div initial={{ width: 70 }} className='profile-container' variants={{ open: { width: 200 } }} transition={transition}>
        <motion.img variants={{ open: { scale: 1.5 } }} transition={transition} className='avatar' src="https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg" alt="Profile" />
        <ProfileText isOpen={isOpen} />
    </motion.div>
);

const ProfileText: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <motion.div
        className="text"
        initial={{ opacity: 0 }}
        variants={{
            closed: { fontSize: '2px', opacity: 0 },
            open: { fontSize: '15px', opacity: 1 }
        }}
        transition={transition}
    >
        Hi, Mr. Starbucks
    </motion.div>
);

export default Sidebar;
