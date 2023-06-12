import { motion } from "framer-motion";
import React from 'react';

enum Icons {
    stores = '../effects/Stores.svg',
    sales = '../effects/Sales.svg',
    competitors = '../effects/Competitors.svg',
}

interface Item {
    text: string;
    icon: Icons;
}

const items: Item[] = [
    { text: "Stores", icon: Icons.stores },
    { text: "Sales", icon: Icons.sales },
    { text: "Competitors", icon: Icons.competitors },
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
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
};

interface ListItemProps {
    item: Item;
}

const ListItem: React.FC<ListItemProps> = ({ item }) => (
    <motion.li
        className="p-6"
        variants={variant1}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
    >
        <div className="flex items-center space-x-5">
            <img src={item.icon} alt={item.text} className="w-6 h-6 mr-5" />
            {item.text}
            <div className="flex-grow">
                <input type="radio" className="align-baseline flex-grow" />
            </div>
        </div>
    </motion.li>
);

export const Navigation: React.FC = () => (
    <motion.div variants={staggering}>

        <motion.div className="p-6" initial={{ opacity: 0 }} variants={variant2}>Management</motion.div>
        {items.map(item => <ListItem key={item.text} item={item} />)}
        <motion.hr initial={{ opacity: 0 }} variants={variant1} className="mt-10" />

    </motion.div>
);

export default Navigation;
