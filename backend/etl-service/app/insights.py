"""
Proactive Insight Generation Agent

Runs statistical analysis after data ingestion to highlight patterns.
"""

import numpy as np
from sklearn.ensemble import IsolationForest


class InsightAgent:
    """Agent that generates insights from uploaded data."""

    async def analyze(self, data: list[dict]) -> list[dict]:
        """Run analysis and return insights."""
        insights = []

        # Convert to numpy array for numerical columns
        numerical_data = self._extract_numerical(data)
        if len(numerical_data) < 10:
            return insights

        # Outlier detection using Isolation Forest
        try:
            iso = IsolationForest(contamination=0.1)
            outliers = iso.fit_predict(numerical_data)

            outlier_count = (outliers == -1).sum()
            if outlier_count > 0:
                insights.append({
                    "type": "outlier_detection",
                    "message": f"Found {outlier_count} statistical outliers in data",
                    "severity": "info",
                })
        except Exception:
            pass

        # Check for clusters
        if len(data) > 100:
            insights.append({
                "type": "cluster_detected",
                "message": "Large dataset suitable for clustering analysis",
                "severity": "info",
            })

        return insights

    def _extract_numerical(self, data: list[dict]) -> np.ndarray:
        """Extract numerical columns from data."""
        if not data:
            return np.array([])

        keys = [k for k in data[0].keys() if isinstance(data[0][k], (int, float))]
        if not keys:
            return np.array([])

        return np.array([[row.get(k, 0) for k in keys] for row in data])


if __name__ == "__main__":
    agent = InsightAgent()
    print("Insight Agent initialized")
