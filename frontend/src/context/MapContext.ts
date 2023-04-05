import React, { useContext } from "react";

// create a custom hook to access the map object from any child component
export function useMap(context) {
    const map = useContext(context);
    if (!map) {
        throw new Error('useMap must be used within a MapContext.Provider');
    }
    return map;
}
 
