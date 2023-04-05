module.exports = function override(config, env) {
    config.module.rules.push({
        resolve:{
            alias: {
                ...config.resolve.alias,
                'mapbox-gl': 'maplibre-gl'
            }
        }
    })

    return config
}
