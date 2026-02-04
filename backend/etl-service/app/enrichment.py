"""
Automated Data Enrichment Worker
"""

import httpx


class DataEnrichmentWorker:
    async def enrich_data(self, columns, data):
        enriched = []
        for row in data:
            new_row = dict(row)
            if "lat" in row and "elevation" not in new_row:
                new_row["elevation"] = await self._fetch_elevation(row["lat"], row.get("lon", row["lat"]))
            enriched.append(new_row)
        return enriched

    async def _fetch_elevation(self, lat, lon):
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(f"https://api.opentopodata.org/v1/eudem25m?locations={lat},{lon}", timeout=10)
                return r.json()["results"][0]["elevation"]
            except:
                return 0.0
