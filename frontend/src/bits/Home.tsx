import { useState } from "react";
import { motion, useCycle } from "framer-motion";
import BaseMap from './BaseMap'
import Sidebar from './Sidebar'
import FileUpload from './file-upload/file-upload.component'
import Uploader from "./Uploader";
import search from '../effects/Search.svg'

export const Home = () => {
    const [isOpen, toggleOpen] = useCycle(false, true);
    const [newUserInfo, setNewUserInfo] = useState({
        profileImages: []
    });

    const updateUploadedFiles = (files) =>
        setNewUserInfo({ ...newUserInfo, profileImages: files });

    const handleSubmit = (event) => {
        event.preventDefault();
        //logic to create new user...
    };

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
            <div style={{ zIndex: 3, position: "absolute", top: 20, right: 20 }}>
                <form onSubmit={handleSubmit}>
                <Uploader/>
                    <button type="submit">Create New User</button>
                </form>
            </div>
            <div className="search-box" style={{ zIndex: 3 }}>
                <input type="text" placeholder="Search..." spellCheck='false' />
                <img className="search-icon" src={search} alt="Search Icon" />
            </div>
        </motion.div>
    )
}

export default Home;
