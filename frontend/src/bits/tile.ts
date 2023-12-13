export const styleFactory = ({ sources, inclusion?, exclusion? }) => {
    const style = {
        "version": 8,
        "name": "Type 40",
        "metadata": {
            "style_version": "0.40.0"
        },
        "light": {
            "anchor": "map",
            "color": "#f5f9ff",
            "intensity": 0.08,
            "position": [
                1.15,
                210,
                30
            ]
        },
        "sprite": "http://localhost:8080/styles/default-light-standard/sprite",
        "glyphs": "http://localhost:8080/fonts/{fontstack}/{range}.pbf",
        "sources": {
            "openmaptiles": {
                "type": "vector",
                "url": sources["openmaptiles"]
            },
            
        },
        "layers": [
            {
                "id": "background",
                "type": "background",
                "paint": { "background-color": "rgba(233, 236, 246, 1)" }
            },
            {
                "id": "landuse_restriction",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landuse",
                "minzoom": 14,
                "maxzoom": 24,
                "filter": [
                    "any",
                    ["==", "class", "industrial"],
                    ["==", "class", "construction"],
                    ["==", "class", "railway"],
                    ["==", "class", "military"]
                ],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(225, 228, 241, 1)",
                    "fill-opacity": {
                        "stops": [
                            [14, 0],
                            [15, 0.8]
                        ]
                    },
                    "fill-outline-color": "rgba(154, 212, 106, 0)"
                }
            },
            {
                "id": "park",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "park",
                "minzoom": 0,
                "maxzoom": 24,
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(153, 235, 191, 1)",
                    "fill-opacity": 1,
                    "fill-outline-color": "rgba(154, 212, 106, 0)"
                }
            },
            {
                "id": "landcover_wood",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landcover",
                "minzoom": 0,
                "maxzoom": 24,
                "filter": ["any", ["==", "class", "wood"], ["==", "subclass", "wood"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-antialias": false,
                    "fill-color": "rgba(153, 235, 191, 1)",
                    "fill-opacity": 1
                }
            },
            {
                "id": "landcover_grass",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landcover",
                "minzoom": 0,
                "maxzoom": 24,
                "filter": ["all", ["==", "class", "grass"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-antialias": false,
                    "fill-color": "rgba(153, 235, 191, 1)",
                    "fill-opacity": 1,
                    "fill-outline-color": "rgba(0, 0, 0, 0)"
                }
            },
            {
                "id": "water",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "water",
                "maxzoom": 24,
                "filter": ["all", ["!=", "brunnel", "tunnel"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(180, 232, 253, 1)",
                    "fill-antialias": false,
                    "fill-translate": [0, 0],
                    "fill-outline-color": "rgba(0, 0, 0, 0)"
                }
            },
            {
                "id": "landuse_quarry",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landuse",
                "minzoom": 0,
                "maxzoom": 24,
                "filter": ["any", ["==", "class", "quarry"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(232, 220, 213, 1)",
                    "fill-opacity": 1,
                    "fill-outline-color": "rgba(154, 212, 106, 0)",
                    "fill-translate-anchor": "map"
                }
            },
            {
                "id": "landuse_stadium",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landuse",
                "minzoom": 0,
                "maxzoom": 24,
                "filter": [
                    "any",
                    ["==", "class", "stadium"],
                    ["==", "class", "playground"]
                ],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(153, 235, 191, 1)",
                    "fill-opacity": 1,
                    "fill-outline-color": "rgba(154, 212, 106, 0)"
                }
            },
            {
                "id": "landuse_pitch",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landuse",
                "minzoom": 0,
                "maxzoom": 24,
                "filter": ["any", ["==", "class", "pitch"], ["==", "class", "scrub"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(122, 231, 173, 1)",
                    "fill-opacity": 1,
                    "fill-outline-color": "rgba(154, 212, 106, 0)"
                }
            },
            {
                "id": "landuse_commercial",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landuse",
                "minzoom": 13,
                "maxzoom": 24,
                "filter": [
                    "any",
                    ["==", "class", "retail"],
                    ["==", "class", "commercial"]
                ],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(213, 231, 241, 1)",
                    "fill-opacity": {
                        "stops": [
                            [13, 0],
                            [14, 1]
                        ]
                    },
                    "fill-outline-color": "rgba(154, 212, 106, 0)"
                }
            },
            {
                "id": "landuse_education",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landuse",
                "minzoom": 13,
                "maxzoom": 24,
                "filter": ["any", ["==", "class", "education"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(221, 222, 243, 1)",
                    "fill-opacity": {
                        "stops": [
                            [13, 0],
                            [14, 1]
                        ]
                    },
                    "fill-outline-color": "rgba(154, 212, 106, 0)"
                }
            },
            {
                "id": "landcover_sand",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "landcover",
                "maxzoom": 24,
                "filter": ["all", ["==", "class", "sand"]],
                "layout": { "visibility": "visible" },
                "paint": { "fill-color": "rgba(246, 236, 221, 1)" }
            },
            {
                "id": "ferry_lines",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "maxzoom": 21,
                "filter": ["all", ["==", "class", "ferry"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(255, 192, 203,1)",
                    "line-dasharray": [3, 3],
                    "line-gap-width": {
                        "stops": [
                            [12, 0],
                            [20, 6]
                        ]
                    },
                    "line-opacity": 1,
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [8, 1],
                            [20, 2]
                        ]
                    }
                }
            },
            {
                "id": "waterway_tunnel",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "waterway",
                "minzoom": 13,
                "maxzoom": 21,
                "filter": ["all", ["==", "brunnel", "tunnel"], ["!=", "class", "drain"]],
                "layout": { "visibility": "none" },
                "paint": {
                    "line-color": "rgba(180, 232, 253, 1)",
                    "line-dasharray": [3, 3],
                    "line-gap-width": {
                        "stops": [
                            [12, 0],
                            [20, 6]
                        ]
                    },
                    "line-opacity": 1,
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [8, 1],
                            [20, 2]
                        ]
                    }
                }
            },
            {
                "id": "waterway_river",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "waterway",
                "minzoom": 0,
                "maxzoom": 24,
                "filter": ["all", ["==", "class", "river"], ["!=", "brunnel", "tunnel"]],
                "layout": { "line-cap": "round", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(180, 232, 253, 1)",
                    "line-width": {
                        "stops": [
                            [13, 3],
                            [16, 10],
                            [18, 50],
                            [20, 160],
                            [22, 400]
                        ]
                    }
                }
            },
            {
                "id": "waterway_other",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "waterway",
                "minzoom": 0,
                "maxzoom": 24,
                "filter": ["all", ["!=", "class", "river"], ["!=", "brunnel", "tunnel"]],
                "layout": { "line-cap": "round", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(180, 232, 253, 1)",
                    "line-width": {
                        "stops": [
                            [14, 2],
                            [16, 10],
                            [18, 14],
                            [20, 50],
                            [23, 300]
                        ]
                    }
                }
            },
            {
                "id": "aeroway_runway",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "aeroway",
                "minzoom": 11,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["==", "class", "runway"]
                ],
                "paint": {
                    "line-color": "rgba(208, 210, 216, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [11, 3],
                            [20, 16]
                        ]
                    }
                }
            },
            {
                "id": "aeroway_taxiway",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "aeroway",
                "minzoom": 11,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["==", "class", "taxiway"]
                ],
                "paint": {
                    "line-color": "rgba(208, 210, 216, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [11, 0.5],
                            [20, 6]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_motorway_link_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["==", "ramp", 1],
                    ["==", "brunnel", "tunnel"]
                ],
                "layout": { "line-join": "miter", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-dasharray": [3, 3],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_service_track_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 15,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "service", "track"]
                ],
                "layout": { "line-join": "round", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-dasharray": [0.5, 0.25],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [15, 4],
                            [17, 6],
                            [18, 7],
                            [19, 15],
                            [20, 24],
                            [21, 36],
                            [22, 50]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "tunnel_link_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": ["all", ["==", "ramp", 1], ["==", "brunnel", "tunnel"]],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "stops": [
                            [15, 10],
                            [17, 17],
                            [18, 20],
                            [19, 46],
                            [20, 77],
                            [21, 115],
                            [22, 158]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "tunnel_street_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "street", "street_limited"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-opacity": {
                        "stops": [
                            [12, 0],
                            [12.5, 1]
                        ]
                    },
                    "line-width": {
                        "stops": [
                            [15, 6],
                            [16, 8],
                            [18, 14],
                            [19, 34],
                            [20, 60],
                            [21, 90],
                            [22, 128]
                        ]
                    },
                    "line-dasharray": [1, 0.5]
                }
            },
            {
                "id": "tunnel_secondary_tertiary_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "secondary", "tertiary"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 24],
                            [19, 50],
                            [20, 88],
                            [21, 124],
                            [22, 170]
                        ]
                    },
                    "line-dasharray": [1, 0.5],
                    "line-opacity": 1
                }
            },
            {
                "id": "tunnel_trunk_primary_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "primary", "trunk"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    },
                    "line-dasharray": [3, 3],
                    "line-opacity": 1
                }
            },
            {
                "id": "tunnel_motorway_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["!=", "ramp", 1],
                    ["==", "brunnel", "tunnel"]
                ],
                "layout": { "line-join": "miter" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-dasharray": [3, 3],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    },
                    "line-gap-width": {
                        "stops": [
                            [14, 0.8],
                            [16, 30],
                            [22, 300]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "tunnel_path_pedestrian",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 14,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "path", "pedestrian"]
                ],
                "paint": {
                    "line-color": "rgba(255, 248, 239, 1)",
                    "line-dasharray": [1, 1],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 1],
                            [20, 7]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_motorway_link",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["==", "ramp", 1],
                    ["==", "brunnel", "tunnel"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255,255,255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [7, 0],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_service_track",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "service", "track"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(243, 246, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 0.1],
                            [15, 2],
                            [18, 5],
                            [23, 60]
                        ]
                    },
                    "line-opacity": {
                        "stops": [
                            [12, 0],
                            [14, 1]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_link",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": ["all", ["==", "ramp", 1], ["==", "brunnel", "tunnel"]],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255,255,255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12.5, 0],
                            [13, 1.5],
                            [14, 2.5],
                            [20, 11.5]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_minor",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": ["all", ["==", "brunnel", "tunnel"], ["in", "class", "minor"]],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 0.1],
                            [15, 4],
                            [18, 10],
                            [22, 120]
                        ]
                    },
                    "line-opacity": {
                        "stops": [
                            [12, 0],
                            [14, 1]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_secondary_tertiary",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "secondary", "tertiary"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "hsl(0, 0%, 100%)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [7, 0],
                            [16, 10],
                            [18, 20],
                            [22, 160]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_trunk_primary",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 5,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "primary", "trunk"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [4, 1],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_motorway",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 5,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["!=", "ramp", 1],
                    ["==", "brunnel", "tunnel"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [4, 1],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_major_rail",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": ["all", ["==", "brunnel", "tunnel"], ["in", "class", "rail"]],
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14, 0.4],
                            [15, 0.75],
                            [20, 2]
                        ]
                    },
                    "line-dasharray": [8, 0.8],
                    "line-pattern": {
                        "stops": [
                            [6, ""],
                            [10, ""]
                        ]
                    },
                    "line-gap-width": {
                        "stops": [
                            [14, 0],
                            [16, 0.4],
                            [18, 1.8],
                            [20, 4]
                        ]
                    }
                }
            },
            {
                "id": "tunnel_major_rail_hatching",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": ["all", ["==", "brunnel", "tunnel"], ["==", "class", "rail"]],
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-dasharray": [0.1, 6],
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [12, 2],
                            [14, 6],
                            [16, 8],
                            [20, 20]
                        ]
                    },
                    "line-gap-width": 0
                }
            },
            {
                "id": "tunnel_transit_rail",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["in", "class", "transit"]
                ],
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14, 0.4],
                            [15, 0.75],
                            [20, 2.8]
                        ]
                    },
                    "line-dasharray": [7, 0],
                    "line-gap-width": 0.2
                }
            },
            {
                "id": "tunnel_transit_rail_hatching",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["==", "brunnel", "tunnel"],
                    ["==", "class", "transit"]
                ],
                "layout": { "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-dasharray": [0.2, 8],
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14.5, 0],
                            [15, 2.6],
                            [20, 10]
                        ]
                    },
                    "line-gap-width": 0
                }
            },
            {
                "id": "road_area_pattern",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "maxzoom": 9,
                "filter": ["all", ["==", "$type", "Polygon"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-pattern": "pedestrian_polygon",
                    "fill-color": "rgba(255, 255, 255, 1)"
                }
            },
            {
                "id": "road_under_construction-narrow-road-casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": [
                    "any",
                    ["==", "class", "minor_construction"],
                    ["==", "class", "path_construction"],
                    ["==", "class", "service_construction"],
                    ["==", "class", "track_construction"]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(255, 218, 186, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 4],
                            [18, 12],
                            [22, 120]
                        ]
                    },
                    "line-dasharray": [1]
                }
            },
            {
                "id": "road_under_construction-wide-casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": [
                    "any",
                    ["==", "class", "motorway_construction"],
                    ["==", "class", "trunk_construction"],
                    ["==", "class", "primary_construction"],
                    ["==", "class", "secondary_construction"],
                    ["==", "class", "tertiary_construction"],
                    ["==", "class", "raceway_construction"]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(255, 218, 186, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 4],
                            [18, 12],
                            [22, 120]
                        ]
                    },
                    "line-dasharray": [1]
                }
            },
            {
                "id": "road_motorway_link_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "motorway"],
                    ["==", "ramp", 1]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    }
                }
            },
            {
                "id": "road_service_track_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 15,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "service", "track"]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [15, 4],
                            [17, 6],
                            [18, 7],
                            [19, 15],
                            [20, 24],
                            [21, 36],
                            [22, 50]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "road_link_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 15,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["!in", "class", "pedestrian", "path", "track", "service", "motorway"],
                    ["==", "ramp", 1]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [15, 10],
                            [16, 12],
                            [18, 23],
                            [19, 50],
                            [20, 84],
                            [21, 120],
                            [22, 168]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "road_minor_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 15,
                "maxzoom": 23,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "minor"],
                    ["!=", "ramp", 1]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-opacity": 1,
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [15, 6],
                            [16, 8],
                            [18, 14],
                            [19, 34],
                            [20, 60],
                            [21, 90],
                            [22, 128]
                        ]
                    }
                }
            },
            {
                "id": "road_secondary_tertiary_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "secondary", "tertiary"],
                    ["!=", "ramp", 1]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 24],
                            [19, 50],
                            [20, 88],
                            [21, 124],
                            [22, 170]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "road_trunk_primary_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "primary", "trunk"]
                ],
                "layout": {
                    "line-join": "round",
                    "line-cap": "butt",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    },
                    "line-translate-anchor": "map",
                    "line-opacity": 1
                }
            },
            {
                "id": "road_motorway_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "motorway"],
                    ["!=", "ramp", 1]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "road_under_construction_narrow_roads",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": [
                    "any",
                    ["==", "class", "minor_construction"],
                    ["==", "class", "path_construction"],
                    ["==", "class", "service_construction"],
                    ["==", "class", "track_construction"]
                ],
                "layout": {
                    "line-cap": "butt",
                    "line-join": "miter",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(255, 142, 70, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 0.1],
                            [15, 4],
                            [18, 10],
                            [23, 120]
                        ]
                    },
                    "line-dasharray": [0.3, 0.3]
                }
            },
            {
                "id": "road_under_construction_wide_roads",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": [
                    "any",
                    ["==", "class", "motorway_construction"],
                    ["==", "class", "trunk_construction"],
                    ["==", "class", "primary_construction"],
                    ["==", "class", "secondary_construction"],
                    ["==", "class", "tertiary_construction"],
                    ["==", "class", "raceway_construction"]
                ],
                "layout": {
                    "line-cap": "butt",
                    "line-join": "miter",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(255, 142, 70, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 4],
                            [18, 12],
                            [22, 120]
                        ]
                    },
                    "line-dasharray": [0.3, 0.3]
                }
            },
            {
                "id": "road_path_pedestrian",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 14,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "path", "pedestrian"]
                ],
                "layout": {
                    "line-join": "miter",
                    "visibility": "visible",
                    "line-cap": "butt",
                    "line-round-limit": 1.05,
                    "line-miter-limit": 2
                },
                "paint": {
                    "line-color": "rgba(255, 248, 239, 1)",
                    "line-dasharray": [1, 1],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 1],
                            [20, 7]
                        ]
                    },
                    "line-gap-width": 0,
                    "line-translate-anchor": "map"
                }
            },
            {
                "id": "road_motorway_link",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "motorway"],
                    ["==", "ramp", 1]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "hsl(0, 0%, 100%)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [7, 0],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "road_service_track",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "service", "track"]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(243, 246, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 0.1],
                            [15, 2],
                            [18, 5],
                            [23, 60]
                        ]
                    },
                    "line-opacity": {
                        "stops": [
                            [12, 0],
                            [14, 1]
                        ]
                    }
                }
            },
            {
                "id": "road_link",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "ramp", 1],
                    ["!in", "class", "pedestrian", "path", "track", "service", "motorway"]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12.5, 0],
                            [13, 1.5],
                            [14, 2.5],
                            [20, 11.5]
                        ]
                    }
                }
            },
            {
                "id": "road_minor",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "minor"]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "hsl(0, 0%, 100%)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 0.1],
                            [15, 4],
                            [18, 10],
                            [22, 120]
                        ]
                    },
                    "line-opacity": {
                        "stops": [
                            [12, 0],
                            [14, 1]
                        ]
                    }
                }
            },
            {
                "id": "road_secondary_tertiary",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "secondary", "tertiary"]
                ],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [7, 0],
                            [16, 10],
                            [18, 20],
                            [22, 160]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "zebra_crossing_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "road_furniture",
                "minzoom": 14,
                "filter": ["in", "class", "zebra"],
                "layout": {
                    "line-join": "miter",
                    "visibility": "none",
                    "line-cap": "butt",
                    "line-round-limit": 1.05,
                    "line-miter-limit": 2
                },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-dasharray": [1, 1],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 5],
                            [20, 15]
                        ]
                    },
                    "line-gap-width": 0,
                    "line-translate-anchor": "map"
                }
            },
            {
                "id": "zebra_crossing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "road_furniture",
                "minzoom": 14,
                "filter": ["in", "class", "zebra"],
                "layout": {
                    "line-join": "miter",
                    "visibility": "visible",
                    "line-cap": "butt",
                    "line-round-limit": 1.05,
                    "line-miter-limit": 2
                },
                "paint": {
                    "line-color": "rgba(0, 0, 0, 1)",
                    "line-dasharray": [1, 1],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 5],
                            [20, 15]
                        ]
                    },
                    "line-gap-width": 0,
                    "line-translate-anchor": "map"
                }
            },
            {
                "id": "road_trunk_primary",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 5,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["in", "class", "primary", "trunk"]
                ],
                "layout": {
                    "line-join": "round",
                    "visibility": "visible",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [4, 1],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "road_motorway",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 5,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "motorway"],
                    ["!=", "ramp", 1]
                ],
                "layout": {
                    "line-cap": {
                        "stops": [
                            [0, "butt"],
                            [13, "round"]
                        ]
                    },
                    "line-join": {
                        "stops": [
                            [0, "miter"],
                            [13, "round"]
                        ]
                    },
                    "visibility": "visible"
                },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [4, 1],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "road_major_rail",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "rail"]
                ],
                "layout": { "visibility": "visible", "line-cap": "butt" },
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14, 0.4],
                            [15, 0.75],
                            [20, 2]
                        ]
                    },
                    "line-dasharray": [8, 0.8],
                    "line-gap-width": {
                        "stops": [
                            [14, 0],
                            [16, 0.4],
                            [18, 1.8],
                            [20, 4]
                        ]
                    }
                }
            },
            {
                "id": "road_major_rail_hatching",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "rail"]
                ],
                "layout": {
                    "visibility": "visible",
                    "line-cap": "butt",
                    "line-join": "miter"
                },
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-dasharray": [0.1, 6],
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [12, 2],
                            [14, 6],
                            [16, 8],
                            [20, 20]
                        ]
                    }
                }
            },
            {
                "id": "road_transit_rail",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "maxzoom": 9,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "transit"]
                ],
                "layout": { "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14, 0.4],
                            [15, 0.75],
                            [20, 5]
                        ]
                    },
                    "line-dasharray": [7, 0],
                    "line-gap-width": 0.2
                }
            },
            {
                "id": "road_transit_rail_hatching",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "maxzoom": 9,
                "filter": [
                    "all",
                    ["!in", "brunnel", "bridge", "tunnel"],
                    ["==", "class", "transit"]
                ],
                "layout": { "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(130, 130, 130, 1)",
                    "line-dasharray": [0.2, 8],
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14.5, 0.5],
                            [15, 2.6],
                            [20, 200]
                        ]
                    }
                }
            },
            {
                "id": "road_one_way_arrow",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 16,
                "filter": ["==", "oneway", 1],
                "layout": {
                    "icon-image": "Arrow",
                    "symbol-placement": "line",
                    "text-font": [],
                    "visibility": "visible",
                    "text-field": "",
                    "icon-size": 0.7
                },
                "paint": {
                    "text-color": "rgba(0, 0, 0, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "icon-opacity": 0.7
                }
            },
            {
                "id": "road_one_way_arrow_opposite",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 16,
                "filter": ["==", "oneway", -1],
                "layout": {
                    "symbol-placement": "line",
                    "icon-rotate": 180,
                    "text-font": [],
                    "visibility": "visible",
                    "text-field": "",
                    "icon-image": "Arrow",
                    "icon-size": 0.7
                },
                "paint": {
                    "icon-color": "rgba(0, 0, 0, 1)",
                    "icon-halo-color": "rgba(255, 255, 255, 1)"
                }
            },
            {
                "id": "bridge_motorway_link_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["==", "ramp", 1],
                    ["==", "brunnel", "bridge"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    }
                }
            },
            {
                "id": "bridge_service_track_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 15,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "service", "track"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [15, 4],
                            [17, 6],
                            [18, 7],
                            [19, 15],
                            [20, 24],
                            [21, 36],
                            [22, 50]
                        ]
                    }
                }
            },
            {
                "id": "bridge_link_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 13,
                "maxzoom": 24,
                "filter": ["all", ["==", "class", "link"], ["==", "brunnel", "bridge"]],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 1],
                            [13, 3],
                            [14, 4],
                            [20, 15]
                        ]
                    }
                }
            },
            {
                "id": "bridge_street_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 15,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "street", "street_limited"]
                ],
                "layout": { "line-join": "round", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(0, 51, 255, 1)",
                    "line-opacity": 1,
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [15, 6],
                            [16, 8],
                            [18, 14],
                            [19, 34],
                            [20, 60],
                            [21, 90],
                            [22, 128]
                        ]
                    }
                }
            },
            {
                "id": "bridge_path_pedestrian_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 14,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "path", "pedestrian"]
                ],
                "layout": { "visibility": "visible", "line-cap": "butt" },
                "paint": {
                    "line-color": "rgba(208, 210, 216, 1)",
                    "line-dasharray": [1, 0],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 1],
                            [20, 8]
                        ]
                    }
                }
            },
            {
                "id": "bridge_secondary_tertiary_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "secondary", "tertiary"]
                ],
                "layout": { "line-join": "round", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 24],
                            [19, 50],
                            [20, 88],
                            [21, 124],
                            [22, 170]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "bridge_trunk_primary_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "primary", "trunk"]
                ],
                "layout": { "line-join": "round", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    },
                    "line-translate-anchor": "viewport",
                    "line-opacity": 1
                }
            },
            {
                "id": "bridge_motorway_casing",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["!=", "ramp", 1],
                    ["==", "brunnel", "bridge"]
                ],
                "layout": { "line-join": "round", "visibility": "visible" },
                "paint": {
                    "line-color": "rgba(220, 222, 229, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [10, 1],
                            [15, 10],
                            [16, 12],
                            [18, 34],
                            [19, 66],
                            [20, 110],
                            [21, 150],
                            [22, 210]
                        ]
                    },
                    "line-opacity": 1
                }
            },
            {
                "id": "bridge_path_pedestrian",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 14,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "path", "pedestrian"]
                ],
                "paint": {
                    "line-color": "rgba(255, 248, 239, 1)",
                    "line-dasharray": [1, 1],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 1],
                            [20, 7]
                        ]
                    }
                }
            },
            {
                "id": "bridge_motorway_link",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["==", "ramp", 1],
                    ["==", "brunnel", "bridge"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [7, 0],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "bridge_service_track",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "service", "track"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(243, 246, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 0.1],
                            [15, 2],
                            [18, 5],
                            [23, 60]
                        ]
                    },
                    "line-opacity": {
                        "stops": [
                            [12, 0],
                            [14, 1]
                        ]
                    }
                }
            },
            {
                "id": "bridge_link",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "maxzoom": 24,
                "filter": ["all", ["==", "class", "link"], ["==", "brunnel", "bridge"]],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12.5, 0],
                            [13, 1.5],
                            [14, 2.5],
                            [20, 11.5]
                        ]
                    }
                }
            },
            {
                "id": "bridge_street",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "maxzoom": 24,
                "filter": ["all", ["==", "brunnel", "bridge"], ["in", "class", "minor"]],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 0.1],
                            [15, 4],
                            [18, 10],
                            [22, 120]
                        ]
                    },
                    "line-opacity": {
                        "stops": [
                            [12, 0],
                            [14, 1]
                        ]
                    }
                }
            },
            {
                "id": "bridge_secondary_tertiary",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "secondary", "tertiary"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "hsl(0, 0%, 100%)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [7, 0],
                            [16, 10],
                            [18, 20],
                            [22, 160]
                        ]
                    }
                }
            },
            {
                "id": "bridge_trunk_primary",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 5,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "brunnel", "bridge"],
                    ["in", "class", "primary", "trunk"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [4, 1],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "bridge_motorway",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 5,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "class", "motorway"],
                    ["!=", "ramp", 1],
                    ["==", "brunnel", "bridge"]
                ],
                "layout": { "line-join": "round" },
                "paint": {
                    "line-color": "rgba(255, 255, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [4, 1],
                            [16, 10],
                            [18, 30],
                            [22, 200]
                        ]
                    }
                }
            },
            {
                "id": "bridge_major_rail",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "maxzoom": 24,
                "filter": ["all", ["==", "class", "rail"], ["==", "brunnel", "bridge"]],
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14, 0.4],
                            [15, 0.75],
                            [20, 2]
                        ]
                    },
                    "line-dasharray": [8, 0.8],
                    "line-gap-width": {
                        "stops": [
                            [14, 0],
                            [16, 0.4],
                            [18, 1.8],
                            [20, 4]
                        ]
                    }
                }
            },
            {
                "id": "bridge_major_rail_hatching",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 12,
                "maxzoom": 24,
                "filter": ["all", ["==", "class", "rail"], ["==", "brunnel", "bridge"]],
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-dasharray": [0.1, 6],
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [12, 2],
                            [14, 6],
                            [16, 8],
                            [20, 20]
                        ]
                    }
                }
            },
            {
                "id": "bridge_transit_rail",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "class", "transit"],
                    ["==", "brunnel", "bridge"]
                ],
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14, 0.4],
                            [15, 0.75],
                            [20, 2.8]
                        ]
                    },
                    "line-dasharray": [7, 0],
                    "line-gap-width": 0.2
                }
            },
            {
                "id": "bridge_transit_rail_hatching",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 7,
                "maxzoom": 24,
                "filter": [
                    "all",
                    ["==", "class", "transit"],
                    ["==", "brunnel", "bridge"]
                ],
                "paint": {
                    "line-color": "rgba(196, 197, 205, 1)",
                    "line-dasharray": [0.2, 8],
                    "line-width": {
                        "base": 1.4,
                        "stops": [
                            [14.5, 0],
                            [15, 2.6],
                            [20, 10]
                        ]
                    }
                }
            },
            {
                "id": "building",
                "type": "fill",
                "source": "openmaptiles",
                "source-layer": "building",
                "minzoom": 13,
                "maxzoom": 24,
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-color": "rgba(244, 246, 251, 1)",
                    "fill-opacity": {
                        "stops": [
                            [13, 0],
                            [16, 1]
                        ]
                    },
                    "fill-antialias": true,
                    "fill-outline-color": "rgba(212, 215, 222, 0)"
                }
            },
            {
                "id": "building-3d",
                "type": "fill-extrusion",
                "source": "openmaptiles",
                "source-layer": "building",
                "minzoom": 16.2,
                "filter": ["all", ["!has", "hide_3d"]],
                "layout": { "visibility": "visible" },
                "paint": {
                    "fill-extrusion-color": "rgba(249, 249, 249, 1)",
                    "fill-extrusion-height": {
                        "property": "render_height",
                        "type": "identity"
                    },
                    "fill-extrusion-base": {
                        "property": "render_min_height",
                        "type": "identity"
                    },
                    "fill-extrusion-opacity": {
                        "stops": [
                            [16.2, 0],
                            [16.5, 1]
                        ]
                    }
                }
            },
            {
                "id": "building_name",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "building",
                "minzoom": 16,
                "maxzoom": 24,
                "filter": ["has", "name"],
                "layout": {
                    "text-field": { "type": "identity", "property": "name" },
                    "text-size": 13,
                    "text-padding": 2,
                    "icon-size": 0.72,
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 1.2],
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "visibility": "visible",
                    "icon-image": "general",
                    "text-font": ["Gentona_Medium"]
                },
                "paint": {
                    "text-color": "rgba(57, 172, 208, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "boundary_2_z0-4",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "boundary",
                "maxzoom": 9,
                "filter": ["all", ["==", "admin_level", 2], ["!has", "claimed_by"]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "none"
                },
                "paint": {
                    "line-color": "rgba(171, 192, 192, 1)",
                    "line-opacity": {
                        "base": 1,
                        "stops": [
                            [0, 0.4],
                            [4, 1]
                        ]
                    },
                    "line-width": {
                        "base": 1,
                        "stops": [
                            [3, 1],
                            [5, 1.2],
                            [12, 3]
                        ]
                    }
                }
            },
            {
                "id": "boundary_state",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "boundary",
                "minzoom": 3,
                "filter": ["all", ["<=", "admin_level", 4]],
                "layout": {
                    "visibility": "visible",
                    "line-cap": "round",
                    "line-join": "miter"
                },
                "paint": {
                    "line-color": "rgba(189, 189, 210, 1)",
                    "line-opacity": {
                        "stops": [
                            [10, 1],
                            [14, 0.2]
                        ]
                    },
                    "line-width": 1
                }
            },
            {
                "id": "boundary_country",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "boundary",
                "minzoom": 0,
                "filter": ["all", ["==", "admin_level", 2]],
                "layout": {
                    "line-cap": "round",
                    "line-join": "miter",
                    "visibility": "none"
                },
                "paint": {
                    "line-color": "rgba(189, 189, 210, 1)",
                    "line-opacity": {
                        "base": 1,
                        "stops": [
                            [10, 1],
                            [14, 0.2]
                        ]
                    },
                    "line-width": 1
                }
            },
            {
                "id": "water_name_line",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "waterway",
                "minzoom": 13,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["!=", "class", "drain"]
                ],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-max-width": 5,
                    "text-size": 14,
                    "symbol-placement": "line",
                    "visibility": "visible",
                    "text-pitch-alignment": "viewport",
                    "symbol-spacing": 500
                },
                "paint": {
                    "text-color": "hsl(197, 63%, 57%)",
                    "text-halo-color": "rgba(255, 255, 255, 0)",
                    "text-halo-width": 2
                }
            },
            {
                "id": "water_name_point",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "water_name",
                "minzoom": 14,
                "filter": ["==", "$type", "Point"],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book_Italic"],
                    "text-max-width": 5,
                    "text-size": 13,
                    "visibility": "visible",
                    "text-transform": "none"
                },
                "paint": {
                    "text-color": "rgba(76, 175, 214, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 0)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "metro_line",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["!in", "bridge"],
                    ["==", "subclass", "subway"],
                    ["!=", "service", "yard"],
                    ["!=", "service", "siding"],
                    ["has", "color"]
                ],
                "layout": {
                    "line-join": "round",
                    "visibility": "visible",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": [
                        "match",
                        ["get", "color"],
                        
                        ["#1e90ff", "blue", "#0000ff", "#4169E1", "#3281c4", "#4169e1"],
                        "#349EFF",
                        ["#e542de", "#CC338B","#CD00DE", "#800080", "#9400d3"],
                        "#EA67FF",
                        ["#ff0000", "red", "#FF4040"],
                        "#FA4F4F",
                        ["#009933", "#53b848", "#12C900","#008000", "#00ff00", "green"],
                        "#11BF4B",
                        ["aqua", "#7FFFD4", "#00FFFF"],
                        "#00D7D7",
                        ["#FC8EAC", "#ffc0cb", "#ff748c"],
                        "#FF81B6",
                        ["#FFDF00", "#ffff00", "#ffa500", "yellow"],
                        "#FFB800",
                        ["orange", "#F47421" ,"#FF8C00"],
                        "#FF891C",
                        ["#553592"],
                        "#A56FFF",
                        ["#838996", "gray"],
                        "#969892",
                        "#000000"
                    ],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 1.5],
                            [18, 4],
                            [20, 26]
                        ]
                    },
                    "line-opacity": 0.8
                }
            },
            {
                "id": "monorail_line",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["!in", "bridge"],
                    ["==", "subclass", "monorail"],
                    ["!=", "service", "yard"],
                    ["!=", "service", "siding"]
                ],
                "layout": {
                    "line-join": "round",
                    "visibility": "visible",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "rgba(234, 103, 255, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 1.5],
                            [18, 4],
                            [20, 26]
                        ]
                    },
                    "line-opacity": 0.8
                }
            },
            {
                "id": "railway_construction",
                "type": "line",
                "source": "openmaptiles",
                "source-layer": "transportation",
                "minzoom": 14,
                "filter": [
                    "all",
                    ["==", "$type", "LineString"],
                    ["!in", "bridge"],
                    ["in", "class", "construction"]
                ],
                "layout": { "line-join": "round", "visibility": "none" },
                "paint": {
                    "line-color": "rgba(185, 196, 231, 1)",
                    "line-dasharray": [4, 3],
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [14, 1.5],
                            [18, 4],
                            [20, 26]
                        ]
                    }
                }
            },
            {
                "id": "road_label_link",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 12,
                "filter": [
                    "all",
                    ["==", "class", "pedestrian"],
                    ["==", "class", "path"],
                    ["==", "class", "track"],
                    ["==", "class", "service"]
                ],
                "layout": {
                    "symbol-placement": "line",
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-offset": [0, 0.15],
                    "text-size": {
                        "base": 1,
                        "stops": [
                            [13, 11],
                            [14, 12]
                        ]
                    },
                    "visibility": "visible",
                    "text-line-height": 1.3,
                    "symbol-spacing": {
                        "stops": [
                            [14, 300],
                            [16, 260],
                            [18, 400],
                            [20, 800]
                        ]
                    },
                    "text-pitch-alignment": "viewport"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 2,
                    "text-opacity": 1
                }
            },
            {
                "id": "road_label_minor",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 15,
                "filter": ["all", ["==", "class", "minor"]],
                "layout": {
                    "symbol-placement": "line",
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-offset": [0, 0.15],
                    "text-size": {
                        "base": 1,
                        "stops": [
                            [13, 11],
                            [14, 12]
                        ]
                    },
                    "visibility": "visible",
                    "text-line-height": 1.3,
                    "symbol-spacing": {
                        "stops": [
                            [14, 300],
                            [16, 260],
                            [18, 400],
                            [20, 800]
                        ]
                    },
                    "text-pitch-alignment": "viewport"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 2,
                    "text-opacity": 1
                }
            },
            {
                "id": "road_label_tertiary",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 14,
                "filter": ["all", ["==", "class", "tertiary"]],
                "layout": {
                    "symbol-placement": "line",
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-offset": [0, 0.15],
                    "text-size": {
                        "base": 1,
                        "stops": [
                            [13, 11],
                            [14, 12]
                        ]
                    },
                    "visibility": "visible",
                    "text-line-height": 1.3,
                    "symbol-spacing": {
                        "stops": [
                            [14, 300],
                            [16, 260],
                            [18, 400],
                            [20, 600]
                        ]
                    },
                    "text-pitch-alignment": "viewport"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 2,
                    "text-opacity": 1
                }
            },
            {
                "id": "road_label_secondary",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 13,
                "filter": ["all", ["==", "class", "secondary"]],
                "layout": {
                    "symbol-placement": "line",
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-offset": [0, 0.15],
                    "text-size": {
                        "base": 1,
                        "stops": [
                            [13, 11],
                            [14, 12]
                        ]
                    },
                    "visibility": "visible",
                    "text-line-height": 1.3,
                    "symbol-spacing": {
                        "stops": [
                            [14, 300],
                            [16, 260],
                            [18, 400],
                            [20, 800]
                        ]
                    },
                    "text-pitch-alignment": "viewport"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 2,
                    "text-opacity": 1
                }
            },
            {
                "id": "road_closure_polygon",
                "type": "fill",
                "source": "vectordata",
                "source-layer": "road_closures",
                "minzoom": 12,
                "maxzoom": 21,
                "layout": { "visibility": "none" },
                "paint": {
                    "fill-opacity": [
                        "match",
                        ["get", "layer"],
                        ["Control_Zone_1"],
                        0.4,
                        0.8
                    ],
                    "fill-color": "#FFB6D5"
                }
            },
            {
                "id": "road_closure-casing",
                "type": "line",
                "source": "vectordata",
                "source-layer": "road_closures",
                "minzoom": 16,
                "layout": {
                    "line-cap": "round",
                    "line-join": "round",
                    "visibility": "none"
                },
                "paint": {
                    "line-color": "rgba(253, 209, 208, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 4],
                            [18, 12],
                            [22, 120]
                        ]
                    },
                    "line-dasharray": [1]
                }
            },
            {
                "id": "road_closure",
                "type": "line",
                "source": "vectordata",
                "source-layer": "road_closures",
                "minzoom": 16,
                "layout": {
                    "line-cap": "butt",
                    "line-join": "miter",
                    "visibility": "none"
                },
                "paint": {
                    "line-color": "rgba(255, 94, 70, 1)",
                    "line-width": {
                        "base": 1.2,
                        "stops": [
                            [12, 4],
                            [18, 12],
                            [22, 120]
                        ]
                    },
                    "line-dasharray": [0.3, 0.3]
                }
            },
            {
                "id": "road_closure_label",
                "type": "symbol",
                "source": "vectordata",
                "source-layer": "road_closures",
                "minzoom": 11,
                "maxzoom": 24,
                "layout": {
                    "icon-image": "Road_Closed_Sign",
                    "symbol-placement": "point",
                    "text-font": [],
                    "visibility": "none",
                    "text-field": "",
                    "icon-size": 0.72,
                    "text-line-height": 0.95
                },
                "paint": {
                    "text-color": "rgba(255, 0, 0, 1)",
                    "icon-color": "rgba(255, 0, 0, 1)",
                    "icon-halo-color": "rgba(255, 255, 255, 1)",
                    "icon-opacity": 1
                }
            },
            {
                "id": "poi_bus",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transit",
                "filter": ["all", ["==", "class", "bus_stop"]],
                "minzoom": 14,
                "layout": {
                    "text-field": "{name}",
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 0.9],
                    "icon-image": "bus",
                    "icon-size": 0.6,
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "visibility": "visible",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"]
                },
                "paint": {
                    "text-color": "#1D81DD",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "poi_railway",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transit",
                "filter": ["all", ["==", "class", "railway"]],
                "minzoom": 13,
                "layout": {
                    "text-field": "{name}",
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 0.9],
                    "icon-image": "railway",
                    "icon-size": 0.6,
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "visibility": "visible",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"]
                },
                "paint": {
                    "text-color": "#1D81DD",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "poi",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "poi",
                "minzoom": 11,
                "filter": ["all", ["has", "name"]],
                "layout": {
                    "text-field": [
                        "step",
                        ["zoom"],
                        ["coalesce", ["get", "shortName"], ["get", "name"]],
                        16,
                        ["get", "name"]
                    ],
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 1.2],
                    "icon-image": "{class}",
                    "icon-size": 0.72,
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "visibility": "visible",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"],
                    "symbol-sort-key": ["get", "pop"]
                },
                "paint": {
                    "text-color": [
                        "match",
                        ["get", "class"],
                        [
                            "financial",
                            "toll_booth",
                            "general",
                            "education",
                            "universities",
                            "shop"
                        ],
                        "#39ACD0",
                        ["petrol_pump"],
                        "#607DE2",
                        ["food"],
                        "#EF884F",
                        ["mall", "grocery", "supermarket"],
                        "#E1A21C",
                        ["nature"],
                        "#5AA51F",
                        ["fire_station", "medical", "police", "hospitals"],
                        "#D75D5D",
                        ["hotel"],
                        "#8B6AEA",
                        ["tourism", "historic", "theatre", "sport"],
                        "#BF53D0",
                        ["religion"],
                        "#977A6B",
                        ["parking", "office", "it"],
                        "#1D81DD",
                        "rgba(0, 0, 0, 1)"
                    ],
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "poi_tbt",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "poi",
                "minzoom": 16,
                "filter": [
                    "all",
                    ["has", "name"],
                    [
                        "any",
                        ["==", "class", "parking"],
                        ["==", "class", "petrol_pump"],
                        ["==", "class", "mall"],
                        ["==", "class", "financial"],
                        ["==", "class", "police"],
                        ["==", "class", "hospitals"],
                        ["==", "class", "nature"],
                        ["==", "class", "universities"],
                        ["==", "class", "golf_courses"],
                        ["==", "class", "hotel"],
                        ["==", "class", "it"]
                    ]
                ],
                "layout": {
                    "text-field": [
                        "step",
                        ["zoom"],
                        ["coalesce", ["get", "shortName"], ["get", "name"]],
                        16,
                        ["get", "name"]
                    ],
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 1.2],
                    "icon-image": "{class}",
                    "icon-size": 0.72,
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "visibility": "none",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"],
                    "symbol-sort-key": ["get", "pop"]
                },
                "paint": {
                    "text-color": [
                        "match",
                        ["get", "class"],
                        ["hospitals", "police"],
                        "#E86969",
                        ["nature"],
                        "#63AA2B",
                        ["parking", "it"],
                        "#288DEB",
                        ["petrol_pump"],
                        "#758FEC",
                        ["mall"],
                        "#E0A527",
                        ["hotel"],
                        "#9978F7",
                        ["universities", "golf_courses", "financial"],
                        "#4CB3D3",
                        "rgba(57, 110, 245, 1)"
                    ],
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "road_signs",
                "type": "symbol",
                "source": "vectordata",
                "source-layer": "road_signs",
                "minzoom": 11,
                "filter": ["all", ["has", "category"]],
                "layout": {
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-radial-offset": 1,
                    "icon-image": "{category}",
                    "icon-size": 0.72,
                    "visibility": "none",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Book"],
                    "text-line-height": 0.95
                },
                "paint": {
                    "text-color": "rgba(48, 48, 48, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-halo-blur": 0
                }
            },
            {
                "id": "road_signs_tbt",
                "type": "symbol",
                "source": "vectordata",
                "source-layer": "road_signs",
                "minzoom": 11,
                "filter": [
                    "any",
                    ["==", "category", "regulatory--no-left-turn"],
                    ["==", "category", "regulatory--no-right-turn"],
                    ["==", "category", "regulatory--no-u-turn"],
                    ["==", "category", "regulatory--no-overtaking"],
                    ["==", "category", "regulatory--stop"]
                ],
                "layout": {
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-radial-offset": 1,
                    "icon-image": "{category}",
                    "icon-size": 0.72,
                    "visibility": "none",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Book"]
                },
                "paint": {
                    "text-color": "rgba(48, 48, 48, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 0.5,
                    "text-halo-blur": 0.5
                }
            },
            {
                "id": "road_label_primary",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 12,
                "filter": ["all", ["==", "class", "primary"]],
                "layout": {
                    "symbol-placement": "line",
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-size": {
                        "base": 1,
                        "stops": [
                            [13, 13],
                            [14, 13]
                        ]
                    },
                    "visibility": "visible",
                    "text-transform": "none",
                    "text-justify": "center",
                    "text-offset": [0, 0],
                    "icon-text-fit": "none",
                    "text-line-height": 1.3,
                    "symbol-spacing": {
                        "stops": [
                            [14, 300],
                            [16, 260],
                            [18, 400],
                            [20, 800]
                        ]
                    },
                    "text-pitch-alignment": "viewport"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 2,
                    "text-opacity": 1
                }
            },
            {
                "id": "road_label_trunk",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 12,
                "filter": ["all", ["==", "class", "trunk"]],
                "layout": {
                    "symbol-placement": "line",
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-offset": [0, 0],
                    "text-size": {
                        "base": 1,
                        "stops": [
                            [13, 13],
                            [14, 13]
                        ]
                    },
                    "visibility": "visible",
                    "text-transform": "none",
                    "text-line-height": 1.3,
                    "symbol-spacing": {
                        "stops": [
                            [14, 300],
                            [16, 260],
                            [18, 400],
                            [20, 800]
                        ]
                    },
                    "text-pitch-alignment": "viewport"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 2,
                    "text-opacity": 1
                }
            },
            {
                "id": "road_label_motorway",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 12,
                "filter": ["all", ["==", "class", "motorway"]],
                "layout": {
                    "symbol-placement": "line",
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-offset": [0, 0.15],
                    "text-size": {
                        "base": 1,
                        "stops": [
                            [13, 13],
                            [14, 14]
                        ]
                    },
                    "visibility": "visible",
                    "text-line-height": 1.3,
                    "symbol-spacing": {
                        "stops": [
                            [14, 300],
                            [16, 260],
                            [18, 400],
                            [20, 800]
                        ]
                    },
                    "text-pitch-alignment": "viewport"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 2,
                    "text-opacity": 1
                }
            },
            {
                "id": "poi_traffic_signal",
                "type": "symbol",
                "source": "openmaptiles",
                "filter": ["==", "class", "traffic_signals"],
                "source-layer": "road_furniture",
                "minzoom": 15,
                "layout": {
                    "icon-image": "traffic_signal",
                    "icon-size": 0.72,
                    "visibility": "visible",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"],
                    "icon-anchor": "bottom",
                    "icon-pitch-alignment": "auto"
                }
            },
            {
                "id": "ola-pois",
                "type": "symbol",
                "source": "vectordata",
                "source-layer": "hyperchargers",
                "minzoom": 11,
                "maxzoom": 24,
                "filter": ["all", ["has", "types"]],
                "layout": {
                    "text-field": { "type": "identity", "property": "name" },
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 1.2],
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "icon-image": "{types}",
                    "icon-size": 0.72,
                    "visibility": "visible",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"]
                },
                "paint": {
                    "text-color": [
                        "match",
                        ["get", "types"],
                        ["ola-experiencecenter", "ola_factory"],
                        "#303030",
                        ["ola-hypercharger", "ola-slowcharger"],
                        "#00B227",
                        ["ola-servicecenter"],
                        "#5D7599",
                        "rgba(57, 110, 245, 1)"
                    ],
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-halo-blur": 0
                }
            },
            {
                "id": "poi-vectordata",
                "type": "symbol",
                "source": "vectordata",
                "source-layer": "poi",
                "minzoom": 11,
                "layout": {
                    "text-field": { "type": "identity", "property": "name" },
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 1.2],
                    "icon-image": "{class}",
                    "icon-size": 0.72,
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "visibility": "visible",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"],
                    "symbol-sort-key": ["-", ["get", "popScore"]]
                },
                "paint": {
                    "text-color": [
                        "match",
                        ["get", "class"],
                        [
                            "financial",
                            "toll_booth",
                            "general",
                            "education",
                            "universities",
                            "shop"
                        ],
                        "#39ACD0",
                        ["petrol_pump"],
                        "#607DE2",
                        ["food"],
                        "#EF884F",
                        ["mall", "grocery", "supermarket"],
                        "#E1A21C",
                        ["nature"],
                        "#5AA51F",
                        ["fire_station", "medical", "police", "hospitals"],
                        "#D75D5D",
                        ["hotel"],
                        "#8B6AEA",
                        ["tourism", "historic", "theatre", "sport"],
                        "#BF53D0",
                        ["religion"],
                        "#977A6B",
                        ["railway", "bus", "parking", "office", "it"],
                        "#1D81DD",
                        "rgba(0, 0, 0, 1)"
                    ],
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "road_shield",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transportation_name",
                "minzoom": 10,
                "filter": [
                    "all",
                    ["<=", "ref_length", 6],
                    [
                        "any",
                        ["==", "class", "motorway"],
                        ["==", "class", "trunk"],
                        ["==", "class", "primary"]
                    ]
                ],
                "layout": {
                    "icon-image": "road_shield_nh",
                    "icon-rotation-alignment": "viewport",
                    "symbol-placement": {
                        "base": 1,
                        "stops": [
                            [10, "point"],
                            [11, "line"]
                        ]
                    },
                    "symbol-spacing": 500,
                    "text-field": "{ref}",
                    "text-font": ["Gentona_Medium"],
                    "text-offset": [0, 0],
                    "text-rotation-alignment": "viewport",
                    "text-size": 10,
                    "text-line-height": 0.95,
                    "icon-size": 0.7,
                    "icon-text-fit": "both",
                    "icon-text-fit-padding": [7, 12, 9, 12],
                    "visibility": "visible",
                    "text-pitch-alignment": "auto",
                    "icon-pitch-alignment": "auto",
                    "icon-padding": 2,
                    "icon-anchor": "center"
                },
                "paint": {
                    "text-color": "rgba(72, 49, 5, 1)",
                    "icon-opacity": 1,
                    "icon-color": "rgba(0, 0, 0, 0)",
                    "icon-halo-width": 0,
                    "icon-halo-color": "rgba(0, 0, 0, 0)"
                }
            },
            {
                "id": "poi_metro",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "transit",
                "filter": ["all", ["==", "class", "metro"]],
                "minzoom": 11,
                "layout": {
                    "text-field": ["step", ["zoom"], "", 10, "", 11, ["get", "name"]],
                    "text-size": 13,
                    "text-padding": 2,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-offset": [0.9, 0.9],
                    "icon-image": "metro",
                    "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.45, 11, 0.72],
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2],
                    "visibility": "visible",
                    "text-optional": false,
                    "icon-optional": false,
                    "text-font": ["Gentona_Medium"]
                },
                "paint": {
                    "text-color": "#1D81DD",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "poi_airport",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "aerodrome_label",
                "minzoom": 10,
                "layout": {
                    "icon-image": "Airport",
                    "icon-size": 0.72,
                    "text-radial-offset": 1,
                    "text-justify": "auto",
                    "text-variable-anchor": ["top", "bottom", "left", "right"],
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-max-width": 9,
                    "text-optional": false,
                    "icon-optional": false,
                    "text-padding": 2,
                    "text-size": 13,
                    "visibility": "visible",
                    "text-offset": [0.9, 0.9],
                    "text-line-height": ["step", ["zoom"], 0.95, 21, 1.2]
                },
                "paint": {
                    "text-color": "rgba(29, 129, 221, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "place_neighbourhood_quarter-copy",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 14,
                "maxzoom": 17,
                "filter": [
                    "all",
                    ["in", "class", "neighbourhood"],
                    ["in", "class", "quarter"]
                ],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-letter-spacing": 0.15,
                    "text-max-width": 9,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [12, 11],
                            [15, 12]
                        ]
                    },
                    "text-transform": "uppercase",
                    "visibility": "visible"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "place_locality",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 10.2,
                "maxzoom": 15,
                "filter": [
                    "all",
                    ["in", "class", "locality"],
                    [">=", "population", 50000]
                ],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-letter-spacing": 0,
                    "text-max-width": 9,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [12, 12],
                            [15, 18]
                        ]
                    },
                    "text-transform": "uppercase",
                    "visibility": "visible",
                    "icon-text-fit": "none",
                    "text-padding": 50,
                    "text-line-height": 1.2
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-halo-blur": 0.5
                }
            },
            {
                "id": "place_island_islet",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "filter": ["all", ["==", "class", "island"], ["==", "class", "islet"]],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-max-width": 8,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [12, 11],
                            [15, 12]
                        ]
                    },
                    "visibility": "visible"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "place_village",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 13,
                "filter": ["any", ["==", "class", "village"]],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Book"],
                    "text-max-width": 8,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [13, 10],
                            [15, 15]
                        ]
                    },
                    "visibility": "visible"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "place_town",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 9,
                "maxzoom": 16,
                "filter": [
                    "all",
                    ["==", "class", "city"],
                    [">", "population", 10000],
                    ["<", "population", 300000]
                ],
                "layout": {
                    "icon-image": "",
                    "text-anchor": "bottom",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-max-width": 8,
                    "text-offset": [0, 0],
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [7, 8],
                            [11, 15]
                        ]
                    },
                    "visibility": "visible",
                    "text-transform": "uppercase",
                    "text-letter-spacing": 0
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-halo-blur": 1
                }
            },
            {
                "id": "place_city_major_4",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 8,
                "maxzoom": 14,
                "filter": ["all", ["==", "class", "city"], ["<", "population", 1000000]],
                "layout": {
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-max-width": 8,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [7, 10],
                            [11, 14]
                        ]
                    },
                    "icon-allow-overlap": true,
                    "icon-optional": false,
                    "icon-anchor": "bottom",
                    "visibility": "visible",
                    "text-justify": "center",
                    "symbol-z-order": "auto",
                    "icon-size": 0.65,
                    "text-offset": [0.5, 0.5]
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-opacity": 1,
                    "text-halo-blur": 1
                }
            },
            {
                "id": "place_city_major_3",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 8,
                "maxzoom": 14,
                "filter": ["all", ["==", "class", "city"], [">", "population", 1000000]],
                "layout": {
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-max-width": 8,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [7, 14],
                            [11, 20]
                        ]
                    },
                    "icon-allow-overlap": true,
                    "icon-optional": false,
                    "icon-anchor": "bottom",
                    "visibility": "visible",
                    "text-justify": "center",
                    "symbol-z-order": "auto",
                    "icon-size": 0.65,
                    "text-offset": [0.5, 0.5]
                },
                "paint": {
                    "text-color": "rgba(0, 0, 0, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-opacity": 1,
                    "text-halo-blur": 1
                }
            },
            {
                "id": "place_city_major_2",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 7,
                "maxzoom": 14,
                "filter": ["all", ["==", "class", "city"], [">", "population", 1300000]],
                "layout": {
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-max-width": 8,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [7, 14],
                            [11, 20]
                        ]
                    },
                    "icon-allow-overlap": true,
                    "icon-optional": false,
                    "icon-anchor": "bottom",
                    "visibility": "visible",
                    "text-justify": "center",
                    "symbol-z-order": "auto",
                    "icon-size": 0.65,
                    "text-offset": [0.5, 0.5]
                },
                "paint": {
                    "text-color": "rgba(0, 0, 0, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-opacity": 1,
                    "text-halo-blur": 1
                }
            },
            {
                "id": "place_city_major_1",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 6,
                "maxzoom": 14,
                "filter": ["all", ["==", "class", "city"], [">", "population", 1500000]],
                "layout": {
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-max-width": 8,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [7, 14],
                            [11, 20]
                        ]
                    },
                    "icon-allow-overlap": true,
                    "icon-optional": false,
                    "icon-anchor": "bottom",
                    "visibility": "visible",
                    "text-justify": "center",
                    "symbol-z-order": "auto",
                    "icon-size": 0.65,
                    "text-offset": [0.5, 0.5]
                },
                "paint": {
                    "text-color": "rgba(0, 0, 0, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-opacity": 1,
                    "text-halo-blur": 1
                }
            },
            {
                "id": "place_city_major",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 5,
                "maxzoom": 14,
                "filter": ["all", ["==", "class", "city"], [">", "population", 2000000]],
                "layout": {
                    "icon-size": 0.65,
                    "text-anchor": "center",
                    "text-field": "{name}",
                    "text-font": ["Gentona_Semi_Bold"],
                    "text-max-width": 8,
                    "text-size": {
                        "base": 1.2,
                        "stops": [
                            [6, 16],
                            [11, 24]
                        ]
                    },
                    "icon-allow-overlap": true,
                    "icon-optional": false,
                    "icon-anchor": "bottom",
                    "visibility": "visible",
                    "text-justify": "center",
                    "symbol-z-order": "auto",
                    "text-offset": [0.5, 0.5]
                },
                "paint": {
                    "text-color": "rgba(0, 0, 0, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-opacity": 1,
                    "text-halo-blur": 1
                }
            },
            {
                "id": "state",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 3,
                "maxzoom": 8,
                "filter": ["all", ["==", "class", "state"]],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Medium"],
                    "text-size": {
                        "stops": [
                            [4, 11],
                            [6, 15]
                        ]
                    },
                    "text-transform": "uppercase",
                    "visibility": "visible"
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1,
                    "text-opacity": 1
                }
            },
            {
                "id": "country_3",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 2,
                "maxzoom": 6,
                "filter": ["all", ["==", "class", "country"]],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Extra_Bold"],
                    "text-max-width": 6,
                    "text-size": {
                        "stops": [
                            [3, 11],
                            [6, 17]
                        ]
                    },
                    "text-transform": "none",
                    "visibility": "visible",
                    "text-line-height": 1.1
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-blur": 1,
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "continent",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "maxzoom": 3,
                "filter": ["all", ["==", "class", "continent"]],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Heavy"],
                    "text-size": {
                        "stops": [
                            [0, 10],
                            [2.5, 15]
                        ]
                    },
                    "text-transform": "uppercase",
                    "text-justify": "center",
                    "visibility": "visible",
                    "text-line-height": 1.1,
                    "text-max-width": 6,
                    "text-letter-spacing": 0.05
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            },
            {
                "id": "country_1",
                "type": "symbol",
                "source": "openmaptiles",
                "source-layer": "place",
                "minzoom": 2,
                "maxzoom": 6,
                "filter": ["==", "class", "country"],
                "layout": {
                    "text-field": "{name}",
                    "text-font": ["Gentona_Bold"],
                    "text-max-width": 6,
                    "text-size": {
                        "stops": [
                            [3, 11],
                            [6, 17]
                        ]
                    },
                    "text-transform": "none",
                    "visibility": "visible",
                    "text-line-height": 1.1
                },
                "paint": {
                    "text-color": "rgba(90, 104, 115, 1)",
                    "text-halo-blur": 0,
                    "text-halo-color": "rgba(255, 255, 255, 1)",
                    "text-halo-width": 1
                }
            }
        ],
        "id": "default_light_standard"
    }
    const conditionalStyles = {
        ...style,
        layers: style.layers
            .filter(layer => inclusion ? inclusion.includes(layer['source-layer']) : true)
            .filter(layer => exclusion ? !exclusion.includes(layer['source']) : true)
    }

    return conditionalStyles
}



