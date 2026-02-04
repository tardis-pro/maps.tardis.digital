"""
Proactive Insight Generation Agent

Uses statistical methods (IQR-based outlier detection) to identify anomalies in numerical data.
"""

import numpy as np
from typing import List, Dict, Any


class InsightAgent:
    """
    Agent that proactively analyzes uploaded data to detect patterns 
    using statistical outlier detection (IQR method).
    """
    
    # Detection thresholds
    MIN_DATA_POINTS = 10
    IQR_MULTIPLIER = 1.5  # Standard IQR threshold for outliers
    
    async def analyze(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze data for statistical outliers using IQR method.
        
        Args:
            data: List of dictionaries with numerical and categorical fields
            
        Returns:
            List of insight dictionaries with type, message, and metadata
        """
        if not data or len(data) < self.MIN_DATA_POINTS:
            return []
        
        insights = []
        numerical_data, columns = self._extract_numerical(data)
        
        if numerical_data.size == 0:
            return []
        
        # Analyze each numerical column for outliers
        for col_idx, column_name in enumerate(columns):
            column_data = numerical_data[:, col_idx]
            
            if len(column_data) < self.MIN_DATA_POINTS:
                continue
            
            outliers, threshold_info = self._detect_outliers_iqr(column_data)
            
            if len(outliers) > 0:
                insights.append({
                    "type": "outlier_detection",
                    "message": f"Found {len(outliers)} outliers in column '{column_name}'",
                    "column": column_name,
                    "outlier_count": len(outliers),
                    "threshold": threshold_info,
                    "outlier_indices": outliers.tolist()
                })
        
        return insights
    
    def _extract_numerical(self, data: List[Dict[str, Any]]) -> tuple[np.ndarray, List[str]]:
        """
        Extract numerical columns from data, handling missing/non-numeric values.
        
        Args:
            data: List of dictionaries
            
        Returns:
            Tuple of (numerical_array, column_names)
        """
        if not data:
            return np.array([]), []
        
        # Identify numerical columns from first row
        numerical_keys = []
        sample = data[0]
        
        for key, value in sample.items():
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                numerical_keys.append(key)
        
        if not numerical_keys:
            return np.array([]), []
        
        # Build array, coercing errors to NaN
        numerical_array = np.array([
            [self._safe_convert(row.get(k), np.nan) for k in numerical_keys]
            for row in data
        ])
        
        return numerical_array, numerical_keys
    
    def _safe_convert(self, value: Any, default: Any) -> Any:
        """Safely convert a value to float, returning default on failure."""
        try:
            if value is None:
                return default
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                return float(value)
            return default
        except (TypeError, ValueError):
            return default
    
    def _detect_outliers_iqr(self, data: np.ndarray) -> tuple[np.ndarray, Dict[str, float]]:
        """
        Detect outliers using Interquartile Range (IQR) method.
        
        Args:
            data: 1D numpy array of numerical values
            
        Returns:
            Tuple of (outlier_indices, threshold_info_dict)
        """
        # Remove NaN values for calculation
        clean_data = data[~np.isnan(data)]
        
        if len(clean_data) < self.MIN_DATA_POINTS:
            return np.array([]), {}
        
        # Calculate quartiles
        q1 = np.percentile(clean_data, 25)
        q3 = np.percentile(clean_data, 75)
        iqr = q3 - q1
        
        # Define bounds
        lower_bound = q1 - (self.IQR_MULTIPLIER * iqr)
        upper_bound = q3 + (self.IQR_MULTIPLIER * iqr)
        
        # Find outliers (NaN values are excluded from detection)
        outlier_mask = (data < lower_bound) | (data > upper_bound)
        outlier_indices = np.where(outlier_mask)[0]
        
        threshold_info = {
            "method": "IQR",
            "q1": float(q1),
            "q3": float(q3),
            "iqr": float(iqr),
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound)
        }
        
        return outlier_indices, threshold_info
