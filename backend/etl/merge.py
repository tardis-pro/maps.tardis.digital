import glob
import rasterio
from rasterio.merge import merge

# Path to the directory that contains the files
directory_path = ''

# Use glob to get a list of all GeoTIFF files
file_list = glob.glob(directory_path + 'bathymetry*.tif')
print(file_list)
image_list = []

# Open and append images
for file in file_list:
    image = rasterio.open(file)
    image_list.append(image)

# Merge function returns single image and transformation info
merged_image, transform = merge(image_list)

# Write merged image to new file
with rasterio.open('merged.tif', 'w', driver='GTiff',
                   height=merged_image.shape[1], width=merged_image.shape[2],
                   count=1, dtype=merged_image.dtype,
                   crs=image.crs, transform=transform) as dest:
    dest.write(merged_image)

# Close original image files
for image in image_list:
    image.close()