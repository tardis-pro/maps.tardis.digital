import { motion } from "framer-motion";
import stores from '../effects/Stores.svg'
import sales from '../effects/Sales.svg';
import competitors from '../effects/Competitors.svg'

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
    fontWeight: 'normal'
};

const title = {
    padding: '1.5rem', /* top | right | bottom | left */
}

interface Item {
    text: string;
    icon: string;
}

const items: Item[] = [
    {
        text: "Stores",
        icon: stores
    },
    {
        text: "Sales",
        icon: sales
    },
    {
        text: "Competitors",
        icon: competitors
    },
];

export const Navigation = () => {
    const listManagement = items.map((item) =>
        <motion.li
            className="text-placeholder"
            style={style}
            variants={variant1}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <span style={{ width: 170, display: 'flex' }}>
                <img src={item.icon} alt="Stores" style={{ width: 25, height: 25, marginRight: 20 }} />
                {item.text}
                <span>
                    <input
                        type="radio"
                        className="radiobutton"
                        style={{
                            alignSelf: "flex-end",
                            flex: 1
                        }}
                    />
                </span> 
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