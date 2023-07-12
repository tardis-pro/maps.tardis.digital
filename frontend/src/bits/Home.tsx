import { motion, useCycle } from "framer-motion";
import BaseMap from './BaseMap'
import Sidebar from './Sidebar'
import SmoothScroll from "./SmoothScroll"
import search from '../effects/Search.svg'

export const Home = () => {
    const [isOpen, toggleOpen] = useCycle(false, true);

    return (
        <motion.div>
            <Sidebar />
            <div onContextMenu={(e) => e.preventDefault()} >
                <BaseMap viewState={{
                    longitude: 55.1403,
                    latitude: 25.0805,
                    zoom: 9.6,
                    maxZoom: 20,
                    minZoom: 1.5,
                    pitch: 0,
                    bearing: 0
                }}
                    className="map"
                />
            </div>
            <div className="search-box" style={{ zIndex: 3 }}>
                <input type="text" placeholder="Search..." spellCheck='false' />
                <img className="search-icon" src={search} alt="Search Icon" />
            </div>
        </motion.div>
    )
}

export default Home;