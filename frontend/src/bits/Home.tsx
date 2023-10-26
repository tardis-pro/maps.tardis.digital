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
            <Sidebar />
            <div onContextMenu={(e) => e.preventDefault()} >
                <BaseMap initialViewState={{
                    longitude: 72.82254302669458,
                    latitude: 22.59317476003686,
                    zoom: 14,
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
                height: 230
            }}>
                <GridLayout
                    className="layout"
                    layout={layout}
                    cols={6}
                    rowHeight={100}
                    width={800}
                    onLayoutChange={e => setLayout(fixLayout(e))}
                    maxRows={1}
                >
                    <div key="0" className="block">
                        0
                    </div>
                    <div key="1" className="block">
                        1
                    </div>
                    <div key="2" className="block">
                        2
                    </div>
                    <div key="3" className="block" >
                        3
                    </div>
                    <div key="4" className="block" >
                        4
                    </div>
                    <div key="5" className="block" >
                        5
                    </div>
                </GridLayout>
            </div>
            <div className="search-box" style={{ zIndex: 3 }}>
                <input type="text" placeholder="Search..." spellCheck='false' />
                <img className="search-icon" src={search} alt="Search Icon" />
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
        if (item.y === maxY || (item.y === maxY-1 && item.h === 2)) {
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
