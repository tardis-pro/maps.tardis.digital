"""
Automated Data Enrichment Worker

Enriches geographical data with external APIs (elevation, geocoding, etc.).
Implements proper error handling, client reuse, and retry logic.
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type


logger = logging.getLogger(__name__)


class DataEnrichmentWorker:
    """
    Worker for enriching geographical data with external APIs.
    
    Features:
    - HTTP client reuse for connection pooling
    - Retry logic with exponential backoff
    - Proper error handling (distinguishes missing vs failed)
    - Lat/lon validation
    """
    
    # API endpoints
    ELEVATION_API = "https://api.opopdata.org/v1/eudem25m"
    TIMEOUT = 10.0
    MAX_RETRIES = 3
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create shared HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.TIMEOUT,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
        return self._client
    
    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None
    
    async def enrich_data(
        self, 
        columns: List[str], 
        data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Enrich data with additional fields based on available columns.
        
        Args:
            columns: List of column names to potentially enrich
            data: List of data dictionaries
            
        Returns:
            List of enriched data dictionaries
        """
        if not data:
            return []
        
        client = await self._get_client()
        enriched = []
        
        for row in data:
            new_row = dict(row)
            
            # Enrich with elevation if lat/lon available
            if "lat" in row and "elevation" not in new_row:
                lat, lon = self._validate_coordinates(row["lat"], row.get("lon"))
                if lat is not None:
                    elevation = await self._fetch_elevation_with_retry(client, lat, lon)
                    new_row["elevation"] = elevation
                    new_row["elevation_source"] = "opentopodata"
            
            enriched.append(new_row)
        
        return enriched
    
    def _validate_coordinates(
        self, 
        lat: Any, 
        lon: Any
    ) -> tuple[Optional[float], Optional[float]]:
        """
        Validate and convert latitude/longitude to floats.
        
        Returns:
            Tuple of (lat, lon) as floats, or (None, None) if invalid
        """
        try:
            lat_f = float(lat)
            lon_f = float(lon)
            
            # Validate ranges
            if not (-90 <= lat_f <= 90):
                logger.warning(f"Invalid latitude: {lat_f}")
                return None, None
            if not (-180 <= lon_f <= 180):
                logger.warning(f"Invalid longitude: {lon_f}")
                return None, None
            
            return lat_f, lon_f
        except (TypeError, ValueError) as e:
            logger.warning(f"Invalid coordinates: {lat}, {lon} - {e}")
            return None, None
    
    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException))
    )
    async def _fetch_elevation_with_retry(
        self, 
        client: httpx.AsyncClient, 
        lat: float, 
        lon: float
    ) -> Optional[float]:
        """
        Fetch elevation with retry logic.
        
        Returns:
            Elevation in meters, or None if fetch failed
        """
        return await self._fetch_elevation(client, lat, lon)
    
    async def _fetch_elevation(
        self, 
        client: httpx.AsyncClient, 
        lat: float, 
        lon: float
    ) -> Optional[float]:
        """
        Fetch elevation from OpenTopoData API.
        
        Args:
            client: HTTP client to use
            lat, lon: Coordinates
            
        Returns:
            Elevation in meters, or None if not available
        """
        try:
            url = f"{self.ELEVATION_API}?locations={lat},{lon}"
            response = await client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            # Check for valid results
            if "results" in data and len(data["results"]) > 0:
                result = data["results"][0]
                if "elevation" in result and result["elevation"] is not None:
                    return float(result["elevation"])
            
            logger.info(f"No elevation data available for {lat}, {lon}")
            return None
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching elevation: {e}")
            raise
        except (httpx.RequestError, TimeoutError) as e:
            logger.error(f"Request error fetching elevation: {e}")
            raise
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Error parsing elevation response: {e}")
            return None
