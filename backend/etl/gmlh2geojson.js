const file = 'gmlh.json'


const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)


//We can also easily convert latitudeE7 and longitudeE7 by dividing by 1e7. 481265044/1e7 becomes 48.1265044 and 116593258/1e7 is 11.6593258 giving us the coordinates 48.1265044, 11.6593258 which is 48°07'35.4"N 11°39'33.6"E.
const coordinatesToDegrees = (latitudeE7, longitudeE7) => {
    const lat = latitudeE7 / 1e7
    const lon = longitudeE7 / 1e7
    return [lat, lon]       
}

// write a function to parse the json to geojson, take file as the input
// and return the geojson
const parse = async (file) => {
    const data = await readFile(file)
    const json = JSON.parse(data)
    const features = json.locations.map((f) => {
        console.log(f)
        const { latitudeE7, longitudeE7, ...rest } = f
        const coordinates = coordinatesToDegrees(latitudeE7, longitudeE7)
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates
            },
            properties: rest
        }
    })
    const geojson = {
        type: 'FeatureCollection',
        features
    }
    console.log(geojson)
    fs.writeFileSync('gmlh.geojson'), JSON.stringify(geojson, null, 2 ))
    return geojson
}
parse(file)


