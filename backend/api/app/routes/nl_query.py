"""
Natural Language Query Interface

Converts natural language queries to spatial SQL/PostGIS queries.
"""

from typing import Any


class NLQueryInterface:
    """Converts natural language to spatial queries."""

    SCHEMA_CONTEXT = """
    Tables:
    - geometries: id, name, geom (Polygon), area, perimeter
    - sources: id, name, data_type, created_at

    Functions:
    - ST_Contains(g1, g2)
    - ST_Intersects(g1, g2)
    - ST_DWithin(g1, g2, distance)
    - ST_Area(geom)
    - ST_Centroid(geom)
    """

    async def query(self, natural_query: str) -> dict[str, Any]:
        """
        Convert natural language query to SQL.

        Args:
            natural_query: "Show me stores within 5km of high traffic areas"

        Returns:
            Dict with SQL and explanation
        """
        # Simple keyword-based mapping for demo
        sql = self._generate_sql(natural_query)

        return {
            "original": natural_query,
            "sql": sql,
            "explanation": f"Generated spatial query for: {natural_query}",
        }

    def _generate_sql(self, query: str) -> str:
        """Generate SQL from keywords."""
        q = query.lower()

        if "within" in q or "near" in q or "distance" in q:
            return """
            SELECT g.* FROM geometries g
            JOIN geometries target ON ST_DWithin(g.geom, target.geom, 5000)
            WHERE target.name = 'high_traffic_area'
            """
        elif "contains" in q or "inside" in q:
            return "SELECT * FROM geometries WHERE ST_Contains(geom, query_geom)"
        elif "intersects" in q or "overlap" in q:
            return "SELECT * FROM geometries WHERE ST_Intersects(geom, query_geom)"
        else:
            return "SELECT * FROM geometries LIMIT 100"


if __name__ == "__main__":
    iface = NLQueryInterface()
    result = asyncio.run(iface.query("Show me stores near downtown"))
    print(result)
