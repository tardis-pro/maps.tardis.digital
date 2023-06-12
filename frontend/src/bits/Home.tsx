import '../effects/Home.css'
import Sidebar from './Sidebar'

export const Home = () => {
    return (
        <div className="home">
            <div className='radial'>
                <Sidebar/>
            </div>
        </div>
    )
}

export default Home;