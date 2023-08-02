use rocket::Rocket;
use rocket::serde::json::Json;

#[post("/point-in-polygon")]
fn point_in_polygon(point: Json<Point>, polygon: Json<Polygon>) -> Json<bool> {
    let result = is_point_inside_polygon(&point, &polygon);
    Json(result)
}

// Add this function to launch the Rocket web server
fn rocket() -> Rocket {
    rocket::build().mount("/", routes![point_in_polygon])
}
