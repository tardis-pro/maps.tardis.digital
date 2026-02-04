"""
Automated Data Enrichment Worker

Background service that automatically fetches metadata for uploaded files.
"""

import asyncio
import httpx
from pathlib import Path


class DataEnrichmentWorker:
    """Worker that enriches uploaded data with external metadata."""

    # Column name mappings for common enrichments
    ENRICHMENT_SOURCES = {
        "city": {
            "us_census": "https://api.census.gov/data/2020/geo",
            "nominatim": "https://nominatim.openstreetmap.org/search",
        },
        "coordinates": {
            "geocoding": "https://api.opencagedata.com/geocode/v1/json",
        },
        "elevation": {
            "opentopo": "https://api.opentopodata.org/v1/eudem25m",
        },
    }

    async def enrich_data(self, columns: list[str], data: list[dict]) -> list[dict]:
        """Enrich data with additional columns."""
        enriched = []

        for row in data:
            new_row = dict(row)

            # Check for missing columns that can be enriched
            if "city" in columns and "city" not in new_row:
                new_row["city"] = await self._fetch_city_data(row)

            if "elevation" in columns and "elevation" not in new_row:
                if "lat" in row and "lon" in row:
                    new_row["elevation"] = await self._fetch_elevation(
                        row["lat"], row["lon"]
                    )

            enriched.append(new_row)

        return enriched

    async def _fetch_city_data(self, row: dict) -> str:
        """Fetch city name from coordinates."""
        lat = row.get("lat") or row.get("latitude")
        lon = row.get("lon") or row.get("longitude")

        if not lat or not lon:
            return ""

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={"lat": lat, "lon": lon, "format": "json"},
                    timeout=10,
                )
                data = resp.json()
                return data.get("address", {}).get("city", "")
            except:
                return ""

    async def _fetch_elevation(self, lat: float, lon: float) -> float:
        """Fetch elevation from OpenTopoData."""
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    "https://api.opentopodata.org/v1/eudem25m",
                    params={"locations": f"{lat},{lon}"},
                    timeout=10,
                )
                data = resp.json()
                return data["results"][0]["elevation"]
            except:
                return 0.0


if __name__ == "__main__":
    worker = DataEnrichmentWorker()
    print("Data Enrichment Worker initialized")
