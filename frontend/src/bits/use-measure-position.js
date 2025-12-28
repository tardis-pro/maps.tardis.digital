import { useEffect, useRef } from 'react';

export const useMeasurePosition = (update) => {
    // We'll use a `ref` to access the DOM element that the `motion.div` produces.
    // This will allow us to measure its width and position, which will be useful to
    // decide when a dragging element should switch places with its siblings.
    const ref = useRef(null);

    // Update the measured position of the item so we can calculate when we should rearrange.
    useEffect(() => {
        update({
            height: ref.current.offsetHeight,
            width: ref.current.offsetWidth,
            left: ref.current.offsetLeft,
            top: ref.current.offsetTop,
        });
    });

    return ref;
};
