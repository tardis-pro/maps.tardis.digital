import React from 'react';
import { colorRamps } from '../utils/colorUtils';

interface ColorRampSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const ColorRampSelector: React.FC<ColorRampSelectorProps> = ({
    value,
    onChange,
}) => {
    return (
        <div>
            <label htmlFor="color-ramp-select">Color Scheme:</label>
            <select
                id="color-ramp-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '5px',
                    marginTop: '5px',
                    borderRadius: '4px',
                }}
            >
                {Object.keys(colorRamps).map((rampName) => (
                    <option key={rampName} value={rampName}>
                        {rampName.charAt(0).toUpperCase() + rampName.slice(1)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ColorRampSelector;
