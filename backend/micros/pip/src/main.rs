use geo::{Point, Polygon};
use rstar::RTree;
use rocket::{fairing::AdHoc, response::content::Json, serde::json::Json as RocketJson};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// Global R-Tree index stored in Rocket state
// Using Mutex for thread-safe access to the R-Tree
type PIPIndex = Mutex<RTree<Polygon<f64>>>;

// Initialize the R-Tree index on startup
fn stage_index() -> AdHoc {
    AdHoc::on_ignite("Stage R-Tree Index", |rocket| Box::pin(async move {
        let index = RTree::new();
        rocket.manage(PIPIndex::new(index))
    }))
}

// Request payload for point-in-polygon query
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PointRequest {
    pub x: f64,
    pub y: f64,
}

// Request payload for batch polygon loading
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PolygonRequest {
    pub rings: Vec<Vec<(f64, f64>>>, // Outer ring + inner holes
}

// Response for point-in-polygon query
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PIPResponse {
    pub found: bool,
    pub polygon_index: Option<usize>,
    pub query_time_us: u64,
}

// Stats response
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StatsResponse {
    pub total_polygons: usize,
}

// Build R-Tree from polygon collection
fn build_rtree(polygons: &[Polygon<f64>]) -> RTree<Polygon<f64>> {
    RTree::bulk_load(polygons.to_vec())
}

// Check if a point is inside a specific polygon using geo crate
fn is_point_in_polygon_geo(point: Point<f64>, polygon: &Polygon<f64>) -> bool {
    polygon.contains(&point)
}

// Load polygons into R-Tree index
#[post("/polygons/load", format = "json", data = "<polygons>")]
async fn load_polygons(
    polygons: RocketJson<Vec<PolygonRequest>>,
    index: &rocket::State<PIPIndex>,
) -> Json<String> {
    let polygons: Vec<Polygon<f64>> = polygons
        .iter()
        .map(|req| {
            // Convert ring coordinates to geo polygon
            let coords: Vec<_> = req.rings[0]
                .iter()
                .map(|(x, y)| geo::Coord { x: *x, y: *y })
                .collect();

            if req.rings.len() > 1 {
                // Has holes - create polygon with interior rings
                let interiors: Vec<_> = req.rings[1..]
                    .iter()
                    .map(|ring| {
                        geo::LineString::from(
                            ring.iter().map(|(x, y)| geo::Coord { x: *x, y: *y }).collect::<Vec<_>>(),
                        )
                    })
                    .collect();
                Polygon::new(coords, interiors)
            } else {
                Polygon::new(coords, vec![])
            }
        })
        .collect();

    let mut index = index.lock().unwrap();
    *index = build_rtree(&polygons);

    Json(format!("Loaded {} polygons into R-Tree index", polygons.len()))
}

// Point-in-polygon query using R-Tree spatial index
#[post("/point-in-polygon", format = "json", data = "<point>")]
async fn point_in_polygon(
    point: RocketJson<PointRequest>,
    index: &rocket::State<PIPIndex>,
) -> RocketJson<PIPResponse> {
    let start = std::time::Instant::now();
    let geo_point = Point::new(point.x, point.y);

    let index = index.lock().unwrap();

    // Use R-Tree to find candidate polygons first (O(log n) instead of O(n))
    // locate_all_at_point returns an iterator over all geometries containing the point
    let candidates: Vec<_> = index.locate_all_at_point(&geo_point).collect();

    let (found, polygon_index) = if !candidates.is_empty() {
        // Verify with geo crate's precise contains check
        for (idx, polygon) in index.iter().enumerate() {
            if polygon.contains(&geo_point) {
                return RocketJson(PIPResponse {
                    found: true,
                    polygon_index: Some(idx),
                    query_time_us: start.elapsed().as_micros() as u64,
                });
            }
        }
        (false, None)
    } else {
        (false, None)
    };

    RocketJson(PIPResponse {
        found,
        polygon_index,
        query_time_us: start.elapsed().as_micros() as u64,
    })
}

// Get index statistics
#[get("/stats")]
async fn stats(index: &rocket::State<PIPIndex>) -> RocketJson<StatsResponse> {
    let index = index.lock().unwrap();
    RocketJson(StatsResponse {
        total_polygons: index.size(),
    })
}

// Clear the index
#[delete("/polygons")]
async fn clear_polygons(index: &rocket::State<PIPIndex>) -> Json<String> {
    let mut index = index.lock().unwrap();
    *index = RTree::new();
    Json("Index cleared".to_string())
}

#[rocket::launch]
fn rocket() -> _ {
    rocket::build()
        .manage(PIPIndex::new(RTree::new()))
        .attach(AdHoc::on_ignite("R-Tree Index", |rocket| {
            Box::pin(async move {
                rocket
                    .mount("/", routes![point_in_polygon, load_polygons, stats, clear_polygons])
            }
        }))
}
