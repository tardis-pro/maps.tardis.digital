import verde as vd
import rasterio
from rasterio.transform import from_origin
import numpy as np
import geopandas as gpd
from sklearn.model_selection import train_test_split
from matplotlib import pyplot as plt
from pykrige.ok import OrdinaryKriging
import numpy as np
import matplotlib.pyplot as plt
bathymetry_column = 'bathymetry'  # replace this with your actual bathymetry column name

for i in range(25):
    data = gpd.read_file(f'parts/data_{i}.shp')
    
    # Split your data into a training and testing set
    train, test = train_test_split(data, test_size=0.3, random_state=42)
    # grid_lon = np.linspace(train.longitude.min(), train.longitude.max(), num=10)
    # grid_lat = np.linspace(train.latitude.min(), train.latitude.max(), num=10)
# Set   up the Spline interpolator and fit to the training data
    region = vd.get_region((train.longitude, train.latitude))
    spacing = 100 / 111  # Convert meter spacing to degree spacing
    grid_coords = vd.grid_coordinates(region, spacing=spacing)

    spline = vd.Spline()
    spline.fit((train.longitude, train.latitude), train.Z)

    # Predict bathymetry on the grid
    predicted_bathymetry = spline.predict(grid_coords)

    # Save as geotiff
    transform = from_origin(grid_coords[0][0, 0], grid_coords[1][-1, 0], spacing, spacing)
    new_dataset = rasterio.open('bathymetry.tif', 'w', driver='GTiff',
                                height = grid_coords[0].shape[0], width = grid_coords[0].shape[1],
                                count=1, dtype=str(predicted_bathymetry.dtype),
                                crs='+proj=latlong',
                                transform=transform)
    new_dataset.write(predicted_bathymetry, 1)
    new_dataset.close()
