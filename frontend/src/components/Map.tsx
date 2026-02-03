import BaseMap from '../bits/BaseMap';
import { MapErrorBoundary } from './errors/MapErrorBoundary';

// Re-export BaseMap as the Map component for pages/Home.tsx
// Using function wrapper to avoid type export issues
const Map: React.FC = () => (
    <MapErrorBoundary>
        <BaseMap />
    </MapErrorBoundary>
);

export default Map;
