use rocket::{fairing::AdHoc, response::content::Json};
use rocket_codegen::post;

#[derive(Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}

struct Polygon {
    vertices: Vec<Point>,
}
fn is_point_inside_polygon(point: &Point, polygon: &Polygon) -> bool {
    let mut inside = false;
    let num_vertices = polygon.vertices.len();

    for i in 0..num_vertices {
        let j = (i + 1) % num_vertices;
        let p1 = &polygon.vertices[i];
        let p2 = &polygon.vertices[j];

        if p1.y > point.y != p2.y > point.y && point.x < (p2.x - p1.x) * (point.y - p1.y) / (p2.y - p1.y) + p1.x {
            inside = !inside;
        }
    }

    inside
}


fn is_left(p1: &Point, p2: &Point, p: &Point) -> bool {
    (p2.x - p1.x) * (p.y - p1.y) - (p.x - p1.x) * (p2.y - p1.y) > 0.0
}

#[post("/point-in-polygon")]
fn point_in_polygon(point: Json<Point>, polygon: Json<Polygon>) -> Json<bool> {
    let result = is_point_inside_polygon(&point.into_inner(), &polygon.into_inner());
    Json(result)
}

fn main() {
    // Additional configuration for Rocket, if needed
    let rocket = rocket::build()
        .mount("/", routes![point_in_polygon]);

    // Start the Rocket web server
    rocket.launch();
}
