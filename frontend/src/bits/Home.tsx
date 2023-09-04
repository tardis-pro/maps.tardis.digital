import { useState, useRef } from "react";
import { motion, useCycle, Reorder } from "framer-motion";
import BaseMap from './BaseMap'
import Sidebar from './Sidebar'
import Uploader from "./Uploader";
import search from '../effects/Search.svg'

const listItems = [
    { name: "Michael Jordan", id: 1 },
    { name: "Kobe Bryant", id: 2 },
    { name: "LeBron James", id: 3 },
    { name: "Magic Johnson", id: 4 }
];

export const Home = () => {
    const [isOpen, toggleOpen] = useCycle(false, true);
    const [items, setItems] = useState(listItems);
    const constraintsRef = useRef(null);
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
                <BaseMap initialViewState={{
                    longitude: -74.0060,
                    latitude: 40.7128,
                    zoom: 8,
                    maxZoom: 20,
                    minZoom: 1.5,
                    pitch: 0,
                    bearing: 0
                }}
                    className="map"
                />
            </div>
            <div style={{ zIndex: 3, position: "absolute", top: 20, right: 0, color: '#cdcdcd', display: 'inline-block' }}>
                <form onSubmit={handleSubmit}>
                    <Uploader />
                    <button type="submit">Create New User</button>
                </form>
            </div>
            <div style={{
                zIndex: 3,
                flexWrap: "wrap",
                position: "absolute",
                bottom: 40,
                right: 40,
                backgroundColor: 'black',
                width: 800,
                height: 200
            }}>
                <motion.div className="drag-area" ref={constraintsRef} />
                <Reorder.Group values={items} onReorder={setItems} style={{
                    height: '100%',
                    alignItems: "center",
                    color: 'yellow',
                    backgroundColor: 'tan',
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px"
                }}>
                    {items.map((item) => (
                        // Change the li to Reorder.Item and add value prop
                        <Reorder.Item key={item.id} drag value={item} style={{ height: '100%' }}>
                            <Item />
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
                <motion.div drag />
            </div>
            <div className="search-box" style={{ zIndex: 3 }}>
                <input type="text" placeholder="Search..." spellCheck='false' />
                <img className="search-icon" src={search} alt="Search Icon" />
            </div>
        </motion.div>
    )
}

const Item = () => {
    return (
        <div style={{
            height: '100%',
            width: 90,
            backgroundColor: 'grey',
            flex: '1',
            border: '1px solid red',
            borderRadius: 10
        }}>
            Pronit
        </div>
    )
}

export default Home;
