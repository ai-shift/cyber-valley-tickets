import json
import argparse
import os

# --- Core Transformation Logic ---

def parse_coordinates(coord_string, geom_type):
    """
    Parses a KML coordinate string (LON,LAT,ALT) into a structured list of 
    {"lat": float, "lng": float} objects.

    Args:
        coord_string (str): The raw coordinate string from the KML (space-separated, LON,LAT,ALT comma-separated).
        geom_type (str): The geometry type ('point', 'polygon', 'line').

    Returns:
        list or dict: A list of coordinate objects for lines/polygons, or a single object for points.
    """
    if not coord_string:
        return [] if geom_type != 'point' else {}

    # Split the string by space to get individual coordinate sets
    coord_sets = coord_string.strip().split()
    
    transformed_coords = []
    
    for coord_set in coord_sets:
        try:
            # KML format is LON,LAT,ALT (Longitude, Latitude, Altitude)
            # We ignore the altitude (_)
            lon, lat, _ = map(float, coord_set.split(','))
            
            transformed_coords.append({
                "lat": lat,
                "lng": lon
            })
        except ValueError:
            print(f"Warning: Skipped malformed coordinate set: {coord_set}")
            continue

    # For 'point' type, return the single object directly.
    if geom_type == 'point' and transformed_coords:
        return transformed_coords[0]
    
    # For 'line' and 'polygon', return the array.
    return transformed_coords

def transform_json_coordinates(input_data):
    """
    Iterates through the list of features and transforms the 'coordinates' field
    for all coordinate-bearing geometries (polygon, line, point).
    The raw coordinate string value is replaced with the structured object/array 
    under the same 'coordinates' key.
    """
    transformed_features = []
    
    for feature in input_data:
        # Create a copy to avoid modifying the input data structure directly
        new_feature = feature.copy()
        
        # Check if the feature has raw coordinates and is a geometry we process
        if 'coordinates' in new_feature and new_feature['type'] in ('polygon', 'line', 'point'):
            
            # The key 'coordinates' is used for the output structure for all types.
            # We grab the raw string value...
            coord_string = new_feature['coordinates'] 
            
            # ...and overwrite the raw string with the parsed structure 
            # (array for line/poly, single object for point).
            new_feature['coordinates'] = parse_coordinates(coord_string, new_feature['type'])
            
        transformed_features.append(new_feature)
        
    return transformed_features

# --- Main Execution ---

def main():
    parser = argparse.ArgumentParser(
        description="Transforms raw KML coordinate strings (LON,LAT,ALT) in a JSON array into structured {lat, lng} objects.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    # Define the required input file argument
    parser.add_argument(
        'input_json_file', 
        type=str, 
        help="Path to the input JSON file (the output from kml_to_json_converter.py)."
    )
    # Define an optional output file argument
    parser.add_argument(
        '-o', '--output', 
        type=str, 
        default='transformed_kml_output.json', 
        help="Path for the output JSON file (default: transformed_kml_output.json)."
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_json_file):
        print(f"Error: Input JSON file not found at {args.input_json_file}")
        return

    print(f"Reading input JSON from: {args.input_json_file}")

    try:
        with open(args.input_json_file, 'r', encoding='utf-8') as f:
            input_data = json.load(f)
    except Exception as e:
        print(f"Error reading or parsing input JSON file: {e}")
        return
    
    print(f"Successfully loaded {len(input_data)} features.")

    # Perform the transformation
    transformed_data = transform_json_coordinates(input_data)
    
    # Save the transformed JSON file
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(transformed_data, f, indent=2)
        print(f"\nCoordinate transformation complete. Output saved to: {args.output}")
    except Exception as e:
        print(f"Error writing output JSON file: {e}")


if __name__ == '__main__':
    # NOTE: Since this script is designed to run independently, I'm including 
    # a dummy input JSON generation here for demonstration purposes only.
    DUMMY_INPUT_PATH = 'dummy_input_for_transformer.json'
    
    if not os.path.exists(DUMMY_INPUT_PATH):
        print(f"Creating a dummy input JSON file '{DUMMY_INPUT_PATH}' for demonstration...")
        DUMMY_INPUT = [
            {
                "name": "sinwood",
                "type": "polygon",
                "coordinates": "115.0893669,-8.3006452,0 115.0895493,-8.3007647,0 115.0897464,-8.3009399,0",
                "polygon_color": "24589d0f",
                "line_color": "ff589d0f"
            },
            {
                "name": "road",
                "type": "line",
                "coordinates": "115.090725,-8.3024748,0 115.090761,-8.3024598,0 115.090689,-8.3024878,0",
                "line_color": "ff757575"
            },
            {
                "name": "helipad",
                "type": "point",
                "coordinates": "115.0882602,-8.2955132,0", # Included raw coords for point parsing
                "iconUrl": "images/icon-15.png"
            }
        ]
        with open(DUMMY_INPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(DUMMY_INPUT, f, indent=2)
            
        print(f"To run manually: python coordinate_transformer.py {DUMMY_INPUT_PATH}")
        # Run the main function using the dummy file path
        main()
    else:
        main()

