import '../effects/Home.css'
import Sidebar from './Sidebar'
import search from '../effects/Search.svg'

export const Home = () => {
    return (
        <div className="home">
            <div className='radial'>
                <Sidebar/>
            </div>
            <div className="search-box">
                <input type="text" placeholder="Search..." spellcheck='false' />
                <img className="search-icon" src={search} alt="Search Icon" />
            </div>
        </div>
    )
}

export default Home;