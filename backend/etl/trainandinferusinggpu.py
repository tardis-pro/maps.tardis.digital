import numpy as np
import geopandas as gpd
import numpy as np
import verde as vd
import rasterio
from rasterio.transform import from_origin
from sklearn.model_selection import train_test_split
from matplotlib import pyplot as plt
from pykrige.ok import OrdinaryKriging


import cupy as cp
import verde as vd
import xarray as xr
from scipy.spatial import cKDTree
from verde import grid_coordinates, BlockReduce
import pyproj
import geopandas as gpd
import rasterio
from rasterio.transform import from_origin
import matplotlib.pyplot as plt

cp.cuda.Device(0).use()


class MyArray(np.ndarray):
    def __new__(cls, *args, **kwargs):
        return np.array(*args, **kwargs).view(cls)

    def __round__(self, decimals=0):
        return self.__class__(np.round(self, decimals))


# Load your data from a Shapefile
data = gpd.read_file(
    '')
chunks = 10
crs = data.crs

# # # Extract longitude and latitude from the geometry
data['longitude'] = data['geometry'].x
data['latitude'] = data['geometry'].y
# # # Split your data into a training and testing set
# # # train, test = train_test_split(data, test_size=0.3, random_state=42)
# data_splits = np.array_split(data, chunks)

# for idx, split in enumerate(data_splits):
#     split.to_file(f'parts/data_{idx}.shp')
# # Replace this with your actual bathymetry column name
# bathymetry_column = 'bathymetry'
# for i in range(chunks):
# data = gpd.read_file(f'parts/data_{i}.shp')
lons = np.array(data['longitude'])
lats = np.array(data['latitude'])
# Adjust this to use the correct column name for bathymetry
z = np.array(data['Z'])
lon_gpu = cp.asarray(lons)
lat_gpu = cp.asarray(lats)
bathymetry_gpu = cp.asarray(z)
spacing = 10  # 10m x 10m grid spacing
# Define the region of interest
region = (lons.min(), lons.max(), lats.min(), lats.max())
grid = vd.grid_coordinates(region, spacing=spacing)
# Convert grid coordinates to NumPy arrays
grid = (np.array(grid[0]), np.array(grid[1]))
tree = cKDTree(np.column_stack((lon_gpu.get(), lat_gpu.get())))
_, indices = tree.query(np.column_stack(
    (grid[0].ravel(), grid[1].ravel())))
interpolated_gpu = bathymetry_gpu.get()[indices]
grid_shape = (len(grid[0]), len(grid[1]))

interpolated_gpu = interpolated_gpu.reshape(grid_shape)

transform = from_origin(grid[0][0, 0], grid[1][-1, 0], spacing, spacing)
transparency_value = 0
interpolated_gpu = np.where(interpolated_gpu == transparency_value, 0, interpolated_gpu)

with rasterio.open(f'bathymetry_main.tif', 
                    'w', 
                    driver='GTiff',
                    height=grid[0].shape[0], 
                    width=grid[0].shape[1], 
                    count=1, 
                    dtype=interpolated_gpu.dtype, 
                    crs=crs, 
                    transform=transform) as dst:
    dst.write(interpolated_gpu, 1)  
