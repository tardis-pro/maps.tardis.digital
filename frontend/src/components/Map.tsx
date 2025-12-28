import BaseMap from '../bits/BaseMap';

// Re-export BaseMap as the Map component for pages/Home.tsx
// Using function wrapper to avoid type export issues
const Map: React.FC = () => <BaseMap />;

export default Map;
