import BaseMap from './BaseMap';
import Sidebar from './Sidebar'

export const Home = () => {
    return (
        <div>

            <Sidebar />
            <BaseMap viewState={{
                longitude: -73.75,
                latitude: 40.73,
                zoom: 9.6,
                maxZoom: 16,
                pitch: 0,
                bearing: 0
            }} />
        </div>
    )
}

export default Home;