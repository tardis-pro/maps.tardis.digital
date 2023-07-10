import { motion } from "framer-motion";
import React from 'react';
import { useState } from 'react'
import Stores from '../effects/Stores.svg';
import Sales from '../effects/Sales.svg';
import Competitors from '../effects/Competitors.svg'
import Graph from '../effects/Graph.svg'

interface Item {
    text: string;
    icon: string;
}

const items: Item[] = [
    { text: "Stores", icon: Stores },
    { text: "Sales", icon: Sales },
    { text: "Competitors", icon: Competitors },
    { text: "Maturity", icon: Graph },
    { text: "Seasonality", icon: Graph },
    { text: "Marketshare", icon: Graph }
];

const variant1 = {
    open: {
        fontSize: 10,
        y: -120,
        opacity: 0.5,
        transition: { y: { stiffness: 1000, velocity: -100 } }
    },
    closed: {
        fontSize: 3,
        y: 0,
        opacity: 0,
        transition: { y: { stiffness: 1000, duration: 0.5 } }
    },
};

const variant2 = {
    open: {
        fontSize: 10,
        y: -120,
        opacity: 1,
        transition: { y: { stiffness: 1000, velocity: -100 } }
    },
    closed: {
        fontSize: 3,
        y: 0,
        opacity: 0,
        transition: { y: { stiffness: 1000, duration: 0.5 } }
    },
};

const staggering = {
    open: {
        transition: { staggerChildren: 0.07, delayChildren: 0.2 },
    },
    closed: {
        pointerEvents: 'none'
    }
};

export const Navigation: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const [activeStates, setActiveStates] = useState<boolean[]>(
        Array(items.length).fill(true)
    )

    const handleTap = (index: number, checked: boolean) => {
        const newActiveStates = [...activeStates]
        newActiveStates[index] = checked;
        setActiveStates(newActiveStates)
    }
    return (
        <motion.div variants={staggering} style={{ zIndex: 2 }} >

            <motion.div style={{ padding: '0.86rem', opacity: 1 }} className='text-placeholder2' initial={{ opacity: 0 }} variants={variant2}>Management</motion.div>
            {
                items.map((item, index) => (
                    <motion.li
                        className='text-placeholder'
                        id={item.text}
                        style={{
                            padding: '1.5em 0.7em',
                            fontWeight: 'normal',
                        }}
                        animate={{ opacity: isOpen && activeStates[index] ? 0.5 : 1 }}
                        variants={variant1}
                        key={index}
                    >
                        <span
                            style={{ width: 170, display: 'flex', justifyContent: 'space-between' }}
                        >
                            <img
                                src={item.icon}
                                alt={item.text}
                                style={{ width: 25, height: 25 }}
                            />
                            <div style={{ width: 100 }}>{item.text}</div>
                            <motion.input
                                type='checkbox'
                                className={item.text}
                                style={{ y: 6 }}
                                whileTap={{ scale: 0.7 }}
                                onChange={(event) => handleTap(index, !event.target.checked)}
                                transition={{
                                    duration: 0.2,
                                    ease: [0, 0.71, 0.2, 1.01],
                                    scale: {
                                        type: 'spring',
                                        damping: 5,
                                        stiffness: 100,
                                        restDelta: 0.001
                                    }
                                }}
                            />
                        </span>
                    </motion.li>
                ))
            }
            <motion.hr initial={{ opacity: 0 }} variants={variant1} style={{ marginTop: 35 }} />

        </motion.div>
    )
}

export default Navigation;
