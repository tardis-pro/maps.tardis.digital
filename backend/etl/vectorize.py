from osgeo import gdal, ogr,gdalconst

from pdf2image import convert_from_path
import numpy as np

# Step 1: Convert PDF to PNG
#pdf file path
pages = convert_from_path('#PATH', dpi=300)
pages[0].save('out.png', 'PNG')

# Step 2: Vectorize PNG image
# Open the image
src_ds = gdal.Open('out.png')
band = src_ds.GetRasterBand(1)
datatype = band.DataType
image_array = band.ReadAsArray()

unique_values = np.unique(image_array)
drv = ogr.GetDriverByName("ESRI Shapefile")

for pixel_value in unique_values:
    # Create binary mask for the current pixel value
    mask = np.zeros_like(image_array, dtype=np.uint8)
    mask[image_array == pixel_value] = 1

    # Save mask to a temporary file
    mask_ds = gdal.GetDriverByName('GTiff').Create('temp.tif', src_ds.RasterXSize, src_ds.RasterYSize, 1, gdalconst.GDT_Byte)
    mask_ds.SetGeoTransform(src_ds.GetGeoTransform())
    mask_ds.SetProjection(src_ds.GetProjection())
    mask_band = mask_ds.GetRasterBand(1)
    mask_band.WriteArray(mask)
    mask_ds = None  # save and close temporary file

    # Vectorize temporary file
    srcband = gdal.Open('temp.tif').GetRasterBand(1)
    dst_layername = f"POLYGONIZED_{pixel_value}"
    dst_ds = drv.CreateDataSource(dst_layername + ".shp")
    dst_layer = dst_ds.CreateLayer(dst_layername, srs = None)
    gdal.Polygonize(srcband, None, dst_layer, -1, [], callback=None)
    dst_ds.Destroy()
