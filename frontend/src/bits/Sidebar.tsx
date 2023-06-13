import { useState } from 'react';
import { motion, useCycle } from "framer-motion";
import Dashboard from './Dashboard';
import Notification from './Notification';
import Settings from './Settings';
import Navigation from './Navigation';
import '../effects/Sidebar.css'
import { duration } from '@material-ui/core';

export const Sidebar: React.FC = function () {
    const [isOpen, toggleOpen] = useCycle(false, true);

    return (
        <motion.nav
            animate={isOpen ? "open" : "closed"}
            variants={{
                closed: { background: "radial-gradient(ellipse 90% 125% at 50%, rgba(21, 0, 0, 0) 60%, rgba(21, 0, 0, 0.5) 70%, rgb(21, 0, 0, 1) 90%)" },
                open: { background: "radial-gradient(ellipse 80% 125% at 60%, rgba(21, 0, 0, 0) 60%, rgba(21, 0, 0, 0.5) 70%, rgb(21, 0, 0, 1) 90%)" }
            }}
        >
            <motion.div className="sidebar" >
                <motion.svg
                    viewBox="0 0 26.08 26.08"
                    initial={{ opacity: 0 }}
                    variants={{ 
                        open: { opacity: 1 },
                        closed: { opacity: 0 }
                    }}
                    style={{ height: 16, width: 16, y: 243, x: 6 }}
                    transition={{ duration: 0.5 }}
                >
                    <g id="a" />
                    <g id="b">
                        <g id="c">
                            <path
                                className="d"
                                d="M13.04,0h0c7.2,0,13.04,5.84,13.04,13.04h0c0,7.2-5.84,13.04-13.04,13.04h0C5.84,26.08,0,20.24,0,13.04H0C0,5.84,5.84,0,13.04,0Z"
                            />
                        </g>
                    </g>
                </motion.svg>
                <motion.div className="clmn-1" variants={{ open: { width: 200 } }}  >
                    <motion.div initial={{ width: 70 }} className='profile-container' variants={{ open: { width: 200 } }} transition={{ duration: 0.5 }}>
                        <motion.img variants={{ open: { scale: 1.5 } }} transition={{ duration: 0.5 }} className='avatar' src="https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg" alt="Profile" />
                        <motion.div
                            className="text"
                            initial={{ opacity: 0 }}
                            variants={{
                                closed: {
                                    fontSize: '2px',
                                    opacity: 0
                                },
                                open: {
                                    fontSize: '15px',
                                    opacity: 1
                                }
                            }}
                            transition={{
                                duration: 0.5
                            }}
                        >
                            Hi, Mr. Starbucks
                        </motion.div>
                    </motion.div>
                    <motion.hr className='hr1' transition={{ duration: 0.5 }} />
                    <Dashboard toggle={() => toggleOpen()} />
                    <Notification />
                    <Settings />
                    <motion.hr className='hr2' variants={{ open: { y: -120 }, }} transition={{ duration: 0.5 }} />
                    <Navigation />
                </motion.div>
            </motion.div >
        </motion.nav >
    )
}

export default Sidebar;