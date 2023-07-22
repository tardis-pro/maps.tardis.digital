import requests
import json
def get_wfs_features(wfs_url, layer_name):
    # Define the parameters for the GetFeature request
    params = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeName': layer_name,
        'outputFormat': 'application/json'
    }

    # Send a GET request to the WFS URL
    response = requests.get(wfs_url, params=params)

    # Check if the request was successful
    if response.status_code == 200:
        feature_collection = response.json()
        # Do something with the feature collection
        filename = f'{layer_name}.geojson'
        # For example, print the properties of each feature
        with open(filename, 'w') as f:
            json.dump(feature_collection, f)
    else:
        print("Error: Failed to retrieve WFS features")

# Call the function with your WFS URL
