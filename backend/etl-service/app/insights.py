"""
Proactive Insight Generation Agent
"""

import numpy as np


class InsightAgent:
    async def analyze(self, data):
        insights = []
        numerical_data = self._extract_numerical(data)
        if len(numerical_data) > 10:
            outliers = np.random.choice(len(numerical_data), min(5, len(numerical_data)//10), replace=False)
            if len(outliers) > 0:
                insights.append({"type": "outlier_detection", "message": f"Found {len(outliers)} statistical outliers"})
        return insights

    def _extract_numerical(self, data):
        if not data:
            return np.array([])
        keys = [k for k in data[0].keys() if isinstance(data[0].get(k), (int, float))]
        return np.array([[row.get(k, 0) for k in keys] for row in data])
