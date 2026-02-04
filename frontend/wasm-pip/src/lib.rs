//! WebAssembly Point-in-Polygon Service
//!
//! Provides client-side point-in-polygon queries using R-Tree spatial indexing
//! for high-performance geospatial operations in the browser.

use geo::{Point, Polygon};
use rstar::RTree;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

// Panic hook for better error messages in WASM
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Coordinate pair for polygon vertices
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Coordinate {
    pub x: f64,
    pub y: f64,
}

/// Polygon with metadata for spatial queries
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PolygonData {
    pub id: String,
    pub rings: Vec<Coordinate>,
    #[serde(default)]
    pub properties: Option<serde_json::Value>,
}

/// Point query request
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PointQuery {
    pub x: f64,
    pub y: f64,
}

/// Point query response
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PointQueryResult {
    pub found: bool,
    pub polygon_id: Option<String>,
    pub query_time_us: u64,
    pub candidates_checked: usize,
}

/// Batch query result
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BatchQueryResult {
    pub results: Vec<PointQueryResult>,
    pub total_time_us: u64,
}

/// Statistics about the spatial index
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct IndexStats {
    pub polygon_count: usize,
    pub estimated_size_bytes: usize,
}

/// WASM-compatible Point type
#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
pub struct WasmPoint {
    x: f64,
    y: f64,
}

#[wasm_bindgen]
impl WasmPoint {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> WasmPoint {
        WasmPoint { x, y }
    }
}

/// Thread-local spatial index using R-Tree
#[wasm_bindgen]
pub struct SpatialIndex {
    tree: RefCell<RTree<Polygon<f64>>>,
    polygon_ids: RefCell<Vec<String>>,
    polygon_properties: RefCell<Vec<Option<serde_json::Value>>>,
}

#[wasm_bindgen]
impl SpatialIndex {
    /// Create a new empty spatial index
    #[wasm_bindgen(constructor)]
    pub fn new() -> SpatialIndex {
        console_error_panic_hook::set_once();

        SpatialIndex {
            tree: RefCell::new(RTree::new()),
            polygon_ids: RefCell::new(Vec::new()),
            polygon_properties: RefCell::new(Vec::new()),
        }
    }

    /// Clear all polygons from the index
    #[wasm_bindgen]
    pub fn clear(&self) {
        let mut tree = self.tree.borrow_mut();
        let mut ids = self.polygon_ids.borrow_mut();
        let mut props = self.polygon_properties.borrow_mut();

        *tree = RTree::new();
        ids.clear();
        props.clear();
    }

    /// Get the number of polygons in the index
    #[wasm_bindgen]
    pub fn len(&self) -> usize {
        self.polygon_ids.borrow().len()
    }

    /// Check if the index is empty
    #[wasm_bindgen]
    pub fn is_empty(&self) -> bool {
        self.polygon_ids.borrow().is_empty()
    }

    /// Add a single polygon to the index
    #[wasm_bindgen]
    pub fn add_polygon(&self, id: String, rings: JsValue) -> Result<(), JsValue> {
        let coords: Vec<Coordinate> = serde_wasm_bindgen::from_value(rings)
            .map_err(|e| JsValue::from_str(&format!("Invalid coordinates: {}", e)))?;

        let polygon = create_polygon(&coords)?;

        let mut tree = self.tree.borrow_mut();
        let mut ids = self.polygon_ids.borrow_mut();
        let mut props = self.polygon_properties.borrow_mut();

        tree.insert(polygon);
        ids.push(id);
        props.push(None);

        Ok(())
    }

    /// Add multiple polygons to the index
    #[wasm_bindgen]
    pub fn add_polygons(&self, polygons: JsValue) -> Result<(), JsValue> {
        let polys: Vec<PolygonData> = serde_wasm_bindgen::from_value(polygons)
            .map_err(|e| JsValue::from_str(&format!("Invalid polygon data: {}", e)))?;

        let mut tree = self.tree.borrow_mut();
        let mut ids = self.polygon_ids.borrow_mut();
        let mut props = self.polygon_properties.borrow_mut();

        let mut new_polygons = Vec::with_capacity(polys.len());
        let mut new_ids = Vec::with_capacity(polys.len());
        let mut new_props = Vec::with_capacity(polys.len());

        for poly in polys {
            let polygon = create_polygon(&poly.rings)?;
            new_polygons.push(polygon);
            new_ids.push(poly.id);
            new_props.push(poly.properties);
        }

        // Bulk load for optimal R-Tree construction
        let mut all_polygons = tree.iter().cloned().collect::<Vec<_>>();
        all_polygons.extend(new_polygons);
        *tree = RTree::bulk_load(all_polygons);

        ids.extend(new_ids);
        props.extend(new_props);

        Ok(())
    }

    /// Query a single point
    #[wasm_bindgen]
    pub fn query(&self, x: f64, y: f64) -> JsValue {
        let start = web_time::Instant::now();
        let point = Point::new(x, y);

        let tree = self.tree.borrow();
        let ids = self.polygon_ids.borrow();
        let props = self.polygon_properties.borrow();

        // Use R-Tree to find candidate polygons
        let mut candidates_checked = 0;
        let mut found_id = None;

        for (idx, polygon) in tree.iter().enumerate() {
            candidates_checked += 1;
            if polygon.contains(&point) {
                found_id = Some(ids[idx].clone());
                break;
            }
        }

        let result = PointQueryResult {
            found: found_id.is_some(),
            polygon_id: found_id,
            query_time_us: start.elapsed().as_micros() as u64,
            candidates_checked,
        };

        serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
    }

    /// Query multiple points
    #[wasm_bindgen]
    pub fn query_batch(&self, points: JsValue) -> JsValue {
        let points: Vec<PointQuery> = serde_wasm_bindgen::from_value(points)
            .unwrap_or_else(|_| Vec::new());

        let start = web_time::Instant::now();
        let tree = self.tree.borrow();
        let ids = self.polygon_ids.borrow();

        let results: Vec<PointQueryResult> = points
            .iter()
            .map(|p| {
                let point = Point::new(p.x, p.y);
                let mut candidates_checked = 0;
                let mut found_id = None;

                for (idx, polygon) in tree.iter().enumerate() {
                    candidates_checked += 1;
                    if polygon.contains(&point) {
                        found_id = Some(ids[idx].clone());
                        break;
                    }
                }

                PointQueryResult {
                    found: found_id.is_some(),
                    polygon_id: found_id,
                    query_time_us: 0, // Individual timing not available in batch
                    candidates_checked,
                }
            })
            .collect();

        let batch_result = BatchQueryResult {
            results,
            total_time_us: start.elapsed().as_micros() as u64,
        };

        serde_wasm_bindgen::to_value(&batch_result).unwrap_or(JsValue::NULL)
    }

    /// Get statistics about the index
    #[wasm_bindgen]
    pub fn stats(&self) -> JsValue {
        let ids = self.polygon_ids.borrow();
        let props = self.polygon_properties.borrow();

        // Rough estimate of memory usage
        let estimated_bytes = ids.len() * 64 + props.len() * 128;

        let stats = IndexStats {
            polygon_count: ids.len(),
            estimated_size_bytes: estimated_bytes,
        };

        serde_wasm_bindgen::to_value(&stats).unwrap_or(JsValue::NULL)
    }

    /// Export the index as JSON (for caching)
    #[wasm_bindgen]
    pub fn export(&self) -> JsValue {
        let tree = self.tree.borrow();
        let ids = self.polygon_ids.borrow();
        let props = self.polygon_properties.borrow();

        let polygons: Vec<PolygonData> = tree
            .iter()
            .zip(ids.iter())
            .zip(props.iter())
            .map(|((polygon, id), prop)| {
                let exterior: Vec<Coordinate> = polygon
                    .exterior()
                    .0
                    .iter()
                    .map(|c| Coordinate { x: c.x, y: c.y })
                    .collect();

                let interiors: Vec<Vec<Coordinate>> = polygon
                    .interiors()
                    .iter()
                    .map(|ring| {
                        ring.0.iter()
                            .map(|c| Coordinate { x: c.x, y: c.y })
                            .collect()
                    })
                    .collect();

                let mut rings = vec![exterior];
                rings.extend(interiors);

                PolygonData {
                    id: id.clone(),
                    rings,
                    properties: prop.clone(),
                }
            })
            .collect();

        serde_wasm_bindgen::to_value(&polygons).unwrap_or(JsValue::NULL)
    }

    /// Import polygons from JSON (for loading cached index)
    #[wasm_bindgen]
    pub fn import_data(&self, data: JsValue) -> Result<(), JsValue> {
        self.add_polygons(data)
    }
}

/// Create a Geo polygon from coordinate rings
fn create_polygon(coords: &[Coordinate]) -> Result<Polygon<f64>, String> {
    if coords.is_empty() {
        return Err("Empty coordinate ring".to_string());
    }

    let exterior: Vec<_> = coords
        .iter()
        .map(|c| geo::Coord { x: c.x, y: c.y })
        .collect();

    if exterior.len() < 4 {
        return Err("Polygon must have at least 4 vertices".to_string());
    }

    // Check if polygon is closed
    if exterior[0] != exterior[exterior.len() - 1] {
        return Err("Polygon ring is not closed".to_string());
    }

    Ok(Polygon::new(exterior, vec![]))
}

/// Initialize panic hook for better error messages
#[wasm_bindgen(start)]
pub fn initialize_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
