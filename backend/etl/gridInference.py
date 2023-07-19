import geopandas as gpd
import numpy as np
import verde as vd
import rasterio
from rasterio.transform import from_origin
from sklearn.model_selection import train_test_split
from matplotlib import pyplot as plt
from pykrige.ok import OrdinaryKriging

# Load your data from a Shapefile
data = gpd.read_file('')

# # Extract longitude and latitude from the geometry 
data['longitude'] = data['geometry'].x
data['latitude'] = data['geometry'].y
# # Split your data into a training and testing set
# # train, test = train_test_split(data, test_size=0.3, random_state=42)
data_splits = np.array_split(data, 25)

for idx, split in enumerate(data_splits):
    split.to_file(f'parts/data_{idx}.shp')
exit()
# # Setup the Spline interpolator and fit to the training data
# data = gpd.read_file(f'parts/data_{i}.shp')
# Split your data into a training and testing set
train, test = train_test_split(data, test_size=0.3, random_state=42)
grid_lon = np.linspace(train.longitude.min(), train.longitude.max(), num=10)
grid_lat = np.linspace(train.latitude.min(), train.latitude.max(), num=10)
# Setup the Spline interpolator and fit to the training data
OK = OrdinaryKriging(
    train.longitude, train.latitude, train.Z, variogram_model="linear", verbose=False, enable_plotting=False
)
region = (train.longitude.min(), train.longitude.max(), train.latitude.min(), train.latitude.max())
spacing = 10 / 111  # Convert meter spacing to degree spacing
z, ss = OK.execute("grid", grid_lon, grid_lat)


# Save as geotiff
filename = f'bathymetry.tif'
transform = from_origin(train.longitude.min(), train.latitude.min(), spacing, spacing)
new_dataset = rasterio.open(filename, 'w', driver='GTiff',
                            height = z.shape[0], width = z.shape[1],
                            count=1, dtype=str(z.dtype),
                            crs='+proj=latlong',
                            transform=transform)
new_dataset.write(z, 1)
new_dataset.close()