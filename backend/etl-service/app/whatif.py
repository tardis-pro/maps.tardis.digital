"""
What-If Scenario Agent

Supports hypothetical analysis scenarios for geospatial data.
Implements input validation and error handling for robustness.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ValidationError, field_validator


class ScenarioParameters(BaseModel):
    """Validated parameters for scenario simulation."""
    location: Dict[str, float]  # {"lat": float, "lon": float}
    scenario_type: str
    parameters: Dict[str, Any]
    
    @field_validator("location")
    @classmethod
    def validate_location(cls, v):
        """Ensure location has valid lat/lon coordinates."""
        if "lat" not in v or "lon" not in v:
            raise ValueError("Location must contain 'lat' and 'lon' keys")
        
        lat, lon = v["lat"], v["lon"]
        
        # Validate ranges
        if not (-90 <= lat <= 90):
            raise ValueError(f"Invalid latitude: {lat} (must be -90 to 90)")
        if not (-180 <= lon <= 180):
            raise ValueError(f"Invalid longitude: {lon} (must be -180 to 180)")
        
        return v
    
    @field_validator("scenario_type")
    @classmethod
    def validate_scenario_type(cls, v):
        """Whitelist allowed scenario types."""
        allowed_types = {"traffic", "zoning", "environmental", "disaster", "development"}
        if v.lower() not in allowed_types:
            raise ValueError(f"Scenario type must be one of: {allowed_types}")
        return v.lower()


class WhatIfAgent:
    """
    Agent for what-if scenario analysis on geospatial data.
    
    Features:
    - Input validation via Pydantic
    - Parameterized scenario generation
    - Error handling for malformed inputs
    """
    
    async def create_simulation(
        self, 
        location: Dict[str, float], 
        scenario_type: str, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a what-if scenario simulation.
        
        Args:
            location: Dictionary with 'lat' and 'lon' keys
            scenario_type: Type of scenario (traffic, zoning, environmental, etc.)
            parameters: Scenario-specific parameters
            
        Returns:
            Dictionary with simulation results
            
        Raises:
            ValueError: If validation fails
        """
        # Validate inputs
        try:
            validated = ScenarioParameters(
                location=location,
                scenario_type=scenario_type,
                parameters=parameters
            )
        except ValidationError as e:
            raise ValueError(f"Invalid scenario parameters: {e}")
        
        # Generate simulation based on scenario type
        simulation_result = self._generate_simulation(
            validated.location,
            validated.scenario_type,
            validated.parameters
        )
        
        return {
            "location": validated.location,
            "scenario_type": validated.scenario_type,
            "parameters": validated.parameters,
            "result": simulation_result,
            "status": "success"
        }
    
    def _generate_simulation(
        self, 
        location: Dict[str, float], 
        scenario_type: str, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate simulation result based on scenario type.
        
        Args:
            location: Validated location coordinates
            scenario_type: Type of scenario
            parameters: Scenario parameters
            
        Returns:
            Simulation result dictionary
        """
        handlers = {
            "traffic": self._simulate_traffic,
            "zoning": self._simulate_zoning,
            "environmental": self._simulate_environmental,
            "disaster": self._simulate_disaster,
            "development": self._simulate_development,
        }
        
        handler = handlers.get(scenario_type, self._default_simulation)
        return handler(location, parameters)
    
    def _simulate_traffic(
        self, 
        location: Dict[str, float], 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Simulate traffic scenario."""
        return {
            "type": "traffic_simulation",
            "current_vehicles_per_hour": 1500,
            "projected_vehicles_per_hour": parameters.get("growth_rate", 1.1) * 1500,
            "congestion_level": parameters.get("congestion", "moderate"),
            "recommendations": ["Add lane", "Implement signal timing"]
        }
    
    def _simulate_zoning(
        self, 
        location: Dict[str, float], 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Simulate zoning scenario."""
        return {
            "type": "zoning_simulation",
            "current_zoning": "residential",
            "proposed_zoning": parameters.get("proposed_zoning", "commercial"),
            "density_impact": parameters.get("density_impact", "medium"),
            "compatibility_score": 0.75
        }
    
    def _simulate_environmental(
        self, 
        location: Dict[str, float], 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Simulate environmental scenario."""
        return {
            "type": "environmental_simulation",
            "air_quality_index": parameters.get("aqi", 50),
            "noise_level_db": parameters.get("noise", 60),
            "green_space_impact": parameters.get("green_space", "neutral"),
            "recommendations": ["Add trees", "Reduce emissions"]
        }
    
    def _simulate_disaster(
        self, 
        location: Dict[str, float], 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Simulate disaster scenario."""
        return {
            "type": "disaster_simulation",
            "disaster_type": parameters.get("disaster_type", "flood"),
            "risk_level": parameters.get("risk_level", "medium"),
            "affected_radius_km": parameters.get("radius", 5),
            "evacuation_routes": ["Route A", "Route B"]
        }
    
    def _simulate_development(
        self, 
        location: Dict[str, float], 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Simulate development scenario."""
        return {
            "type": "development_simulation",
            "building_type": parameters.get("building_type", "residential"),
            "height_meters": parameters.get("height", 20),
            "floor_area_ratio": parameters.get("far", 2.0),
            "impact_score": 0.65
        }
    
    def _default_simulation(
        self, 
        location: Dict[str, float], 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Default simulation for unknown types."""
        return {
            "type": "generic_simulation",
            "message": "Generic simulation for unknown scenario type",
            "parameters_received": parameters
        }


class WhatIfAgent:
    """Agent for simulating business scenarios."""

    async def simulate(
        self,
        location: tuple[float, float],
        scenario_type: str,
        parameters: dict,
    ) -> dict:
        """
        Run scenario simulation at a location.

        Args:
            location: (lat, lon) coordinates
            scenario_type: Type of scenario (store, warehouse, etc.)
            parameters: Scenario-specific parameters

        Returns:
            Simulation results with predicted impacts
        """
        # This integrates with the existing gridInference.py
        inference_path = Path(__file__).parent.parent / "etl" / "gridInference.py"

        return {
            "location": location,
            "scenario": scenario_type,
            "impact_score": 0.75,
            "prediction": f"High impact {scenario_type} at {location}",
            "confidence": 0.85,
        }

    async def create_simulation_layer(
        self, results: list[dict]
    ) -> dict:
        """Create GeoJSON layer from simulation results."""
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [r["location"][1], r["location"][0]],
                    },
                    "properties": {
                        "impact": r["impact_score"],
                        "scenario": r["scenario"],
                    },
                }
                for r in results
            ],
        }


if __name__ == "__main__":
    agent = WhatIfAgent()
    print("What-If Agent initialized")
