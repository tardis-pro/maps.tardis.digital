import { motion, useCycle } from 'framer-motion';
import { useState, useRef, useEffect } from "react";

// Function to fetch data from the API
async function fetchCatalogData() {
  try {
    const response = await fetch('http://localhost:3000/catalog');
    const data = await response.json();
    return data.tiles; // Assuming 'tiles' is the array you need
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}

// Component to display the dial
function CatalogDial() {
  const [catalogItems, setCatalogItems] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchCatalogData().then(data => {
        console.log(data)
        setCatalogItems(Object.keys(data));

    });
  }, []);

  return (
    <motion.div style={{ 
        width: "800px", 
        zIndex: 10000, 
        height: "100px" }} >
      {catalogItems && catalogItems.map((item, index) => (
        <motion.div
          key={index}
          
          // Position each item in a circular layout
          style={{
            textOverflow: 'ellipsis',
            width: '100px',
            }}
          // Add a click handler if needed
          onClick={() => console.log(`Clicked on item: ${item}`)}
        >
          {item} {/* Display the item */}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default CatalogDial;