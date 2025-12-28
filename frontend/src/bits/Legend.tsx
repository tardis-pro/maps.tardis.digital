import React from 'react';
import { colorRamps } from '../utils/colorUtils';

interface LegendProps {
    colorRamp: string;
    property: string;
    range: [number, number];
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const Legend: React.FC<LegendProps> = ({
    colorRamp,
    property,
    range,
    position = 'bottom-left',
}) => {
    const positionStyles = {
        'top-right': { top: '10px', right: '10px' },
        'top-left': { top: '10px', left: '10px' },
        'bottom-right': { bottom: '10px', right: '10px' },
        'bottom-left': { bottom: '10px', left: '300px' },
    };

    const rampColors = colorRamps[colorRamp] || colorRamps.viridis;

    return (
        <div
            style={{
                position: 'absolute',
                ...positionStyles[position],
                zIndex: 10,
                backgroundColor: 'white',
                borderRadius: '4px',
                padding: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                width: '200px',
            }}
        >
            <div
                style={{
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                }}
            >
                {property}
            </div>

            <div
                style={{
                    height: '20px',
                    width: '100%',
                    backgroundImage: `linear-gradient(to right, ${rampColors.join(', ')})`,
                    borderRadius: '2px',
                    marginBottom: '5px',
                }}
            />

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                }}
            >
                <span>{range[0]}%</span>
                <span>{range[1]}%</span>
            </div>
        </div>
    );
};

export default Legend;
