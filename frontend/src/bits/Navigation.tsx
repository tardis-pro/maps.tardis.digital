import { motion, useCycle } from "framer-motion";
import { useState } from 'react'
import stores from '../effects/Stores.svg'
import sales from '../effects/Sales.svg';
import competitors from '../effects/Competitors.svg'
import graphs from '../effects/Graph.svg'

const variant1 = {
    open: {
        fontSize: 10,
        y: -120,
        opacity: 0.5,
        transition: {
            y: { stiffness: 1000, velocity: -100 }
        }
    },
    closed: {
        fontSize: 3,
        y: 0,
        opacity: 0,
        transition: { y: { stiffness: 1000, duration: 0.5 } }
    }
};

const variant2 = {
    open: {
        fontSize: 10,
        y: -120,
        opacity: 1,
        transition: {
            y: { stiffness: 1000, velocity: -100 }
        }
    },
    closed: {
        fontSize: 3,
        y: 0,
        opacity: 0,
        transition: { y: { stiffness: 1000, duration: 0.5 } }
    }
};

const staggering = {
    open: {
        transition: { staggerChildren: 0.07, delayChildren: 0.2 }
    }
}

const style = {
    padding: '1.5em 0.97em',
    fontWeight: 'normal',
};

const title = {
    padding: '1.5rem', /* top | right | bottom | left */
}

interface Item {
    id: number;
    text: string;
    icon: string;
}

const items: Item[] = [
    {
        id: 1,
        text: "Stores",
        icon: stores
    },
    {
        id: 2,
        text: "Sales",
        icon: sales
    },
    {
        id: 3,
        text: "Competitors",
        icon: competitors
    },
    {
        id: 4,
        text: "Maturity",
        icon: graphs
    },
    {
        id: 5,
        text: "Seasonality",
        icon: graphs
    },
    {
        id: 6,
        text: "Marketshare",
        icon: graphs
    },
];

export const Navigation = () => {
    const [isActive, setActive] = useCycle(false, true);

    const handleTap = (e: any) => {
        if (e.target.checked) {
            setActive(1);
        } else {
            setActive(0);
        }
    };

    const listManagement = items.map((item) =>
        <motion.li
            className="text-placeholder"
            style={style}
            variants={variant1}
            initial={{ opacity: 0 }}
            whileTap={{ opacity: isActive ? 1 : 0.5 }}
        >
            <span style={{ width: 170, display: 'flex', justifyContent: 'space-between' }}>
                <img src={item.icon} alt="Stores" style={{ width: 25, height: 25 }} />
                <div style={{ width: 100 }}>
                    {item.text}
                </div>
                <motion.input
                    type="checkbox"
                    className={item.text}
                    style={{ y: 6 }}
                    whileTap={{ scale: 0.7 }}
                    onChange={handleTap}
                    transition={{
                        duration: 0.5,
                        ease: [0, 0.71, 0.2, 1.01],
                        scale: {
                            type: "spring",
                            damping: 5,
                            stiffness: 100,
                            restDelta: 0.001
                        }
                    }}
                />
            </span>
        </motion.li>
    )

    return (
        <motion.ul variants={staggering} >
            <li>
                {/* <motion.img src={stores} alt="Stores" variants={variant1} /> */}
                <motion.div className="text-placeholder2" initial={{ opacity: 0 }} variants={variant2} style={title}>Management</motion.div>
                {listManagement}
                <motion.hr initial={{ opacity: 0 }} variants={variant1} style={{ marginTop: 40 }} />
            </li>
        </motion.ul>
    )
}

export default Navigation;