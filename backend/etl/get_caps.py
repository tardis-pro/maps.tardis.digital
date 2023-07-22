import requests
import xml.etree.ElementTree as ET
from get_wfs import get_wfs_features 
def get_geo_server_layers_info(geo_server_url, service):
    capabilities_url = geo_server_url + '/gwc/service/wmts?request=getcapabilities'

    # Send a GET request to the GeoServer GetCapabilities URL
    response = requests.get(capabilities_url)

    # Parse the XML response
    root = ET.fromstring(response.content)

    # Find all the Layer elements
    layers = root.findall('.//{http://www.opengis.net/wmts/1.0}Layer')

    # Extract and print the information for each layer
    for layer in layers:
        layer_name = layer.find('{http://www.opengis.net/ows/1.1}Identifier').text
        print("Layer Name:", layer_name)
        # if(layer_name =='ITU:itu_trx_public'):
        try:
            get_wfs_features('', layer_name)
        except:
            print('Error')
        style_element = layer.find('.//{http://www.opengis.net/wmts/1.0}Style/{http://www.opengis.net/ows/1.1}Title')
        if style_element is not None:
            layer_style = style_element.text
            print("Style:", layer_style)

        bbox_element = layer.find('.//{http://www.opengis.net/wmts/1.0}BoundingBox')
        if bbox_element is not None:
            layer_bbox = {
                'minx': bbox_element.attrib['minx'],
                'miny': bbox_element.attrib['miny'],
                'maxx': bbox_element.attrib['maxx'],
                'maxy': bbox_element.attrib['maxy']
            }
            print("Bounding Box:", layer_bbox)

        # Extract and print metadata information if available
        metadata_links = layer.findall('.//{http://www.opengis.net/ows/1.1}MetadataLink')
        if metadata_links:
            print("Metadata:")
            for link in metadata_links:
                metadata_type = link.attrib['type']
                metadata_href = link.attrib['href']
                print(f"{metadata_type}: {metadata_href}")

        print('\n')

# Call the function with your GeoServer URL
get_geo_server_layers_info('', 'wfs')
