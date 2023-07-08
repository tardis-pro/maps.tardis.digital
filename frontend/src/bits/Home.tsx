import { motion, useCycle } from "framer-motion";
import BaseMap from './BaseMap'
import Sidebar from './Sidebar'
import search from '../effects/Search.svg'

export const Home = () => {
    const [isOpen, toggleOpen] = useCycle(false, true);

    return (
        <motion.div>
                <Sidebar/>
                <BaseMap viewState={{
                    longitude: 73.1812,
                    latitude: 22.3072,
                    zoom: 9.6,
                    maxZoom: 22,
                    minZoom: 0,
                    pitch: 0,
                    bearing: 0
                }} 
                className="map"
                />
        </motion.div>
    )
}

export default Home;