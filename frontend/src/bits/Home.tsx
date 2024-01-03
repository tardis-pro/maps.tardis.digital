import { useState, useRef, useEffect } from "react";
import { motion, useCycle, Reorder } from "framer-motion";
// import { Responsive, WidthProvider } from "react-grid-layout";
import GridLayout from "react-grid-layout";
import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";
import BaseMap from './BaseMap'
import Sidebar from './Sidebar'
import Uploader from "./Uploader";
import search from '../effects/Search.svg'
import '../effects/Home.css';
import CatalogDial from "./Sources";

// const ResponsiveGridLayout = WidthProvider(Responsive);

export const Home = () => {
    const [isOpen, toggleOpen] = useCycle(false, true);
    const constraintsRef = useRef(null);
    const [mounted, setmounted] = useState(false);
    const [newUserInfo, setNewUserInfo] = useState({
        profileImages: []
    });
    const [layout, setLayout] = useState([
        { i: "0", x: 0, y: 0, w: 2, h: 2, isResizable: false, },
        { i: "1", x: 2, y: 0, w: 1, h: 1, isResizable: false, },
        { i: "2", x: 3, y: 0, w: 2, h: 1, isResizable: false, },
        { i: "3", x: 5, y: 0, w: 1, h: 2, isResizable: false, },
        { i: "4", x: 2, y: 1, w: 1, h: 1, isResizable: false, },
        { i: "5", x: 3, y: 1, w: 2, h: 1, isResizable: false, },
    ]);
    const updateUploadedFiles = (files) =>
        setNewUserInfo({ ...newUserInfo, profileImages: files });

    const handleSubmit = (event) => {
        event.preventDefault();
        //logic to create new user...
    };

    // const onLayoutChange = (layout: any) => {
    //     const fixedLayout = fixLayout(layout)
    //     setlayout(fixedLayout)
    // }

    return (
        <motion.div>
            <div style={{ width: "50%", height: "100%", position: "absolute", right: 0 }} onContextMenu={(e) => e.preventDefault()} >
                <BaseMap initialViewState={{
                    longitude: 77.8365181,
                    latitude: 13.2308261,
                    zoom: 12,
                    maxZoom: 20,
                    minZoom: 1.5,
                    pitch: 0,
                    bearing: 0
                }}
                    className="map"
                    debug
                />
            </div>
            <div style={{ width: "50%", height: "100%", position: "absolute" ,left: 0 }} onContextMenu={(e) => e.preventDefault()} >
                <BaseMap initialViewState={{
                    longitude: 77.8365181,
                    latitude: 13.2308261,
                    zoom: 12,
                    maxZoom: 20,
                    minZoom: 1.5,
                    pitch: 0,
                    bearing: 0
                }}
                    mapStyle="http://192.168.1.14:8080/styles/default-light-standard/style.json"
                    className="scndmap"
                />
            </div>
        </motion.div>
    )
}

const fixLayout = (layout) => {
    // `y` is calculated by `h` in the layout object, since `h` is 20
    // first row will be 0, second 20, third 40
    const maxY = 1

    // xs or cols, we only have 3 cols
    const xs = [0, 1, 2, 3, 4, 5]

    // when an item goes to a new row, there is an empty column in the maxY row
    // so here we find which columns exist
    // tslint:disable-next-line:max-line-length
    const maxRowXs = layout.map((item) => {
        if (item.y === maxY || (item.y === maxY - 1 && item.h === 2)) {
            if (item.w === 2) {
                return [item.x, item.x + 1]; // Append item.x + 1 for items with item.w equal to 2
            } else {
                return item.x; // Keep the original x value for other items in the same row
            }
        } else {
            return null; // For items in other rows, keep them as null
        }
    }).flat().filter((value) => value !== null);
    console.log(maxRowXs)


    // find the missing col
    // tslint:disable-next-line:max-line-length
    const missingX = xs.find((value) => maxRowXs.every((maxRowX) => maxRowX !== value))
    console.log(missingX)

    // bring the item from the new row into maxY row
    // and place it in the missing column
    const fixedLayout = layout.map((item) => {
        if (item.y > maxY) {
            const fixedItem = {
                ...item,
                y: maxY,
                x: missingX
            }
            return fixedItem
        }
        return item
    })
    return fixedLayout
}

export default Home;
