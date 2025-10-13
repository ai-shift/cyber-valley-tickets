import argparse  # New import for command line arguments
import json
import xml.etree.ElementTree as ET
from pathlib import Path

# Define the KML namespace for proper XPath lookups
KML_NAMESPACE = "http://www.opengis.net/kml/2.2"
ET.register_namespace("", KML_NAMESPACE)

# --- Helper Functions for Style Resolution ---


def get_style_element_by_url(style_url, global_styles):
    """
    Resolves a style URL (e.g., #styleID) to its corresponding XML Element.
    """
    if style_url and style_url.startswith("#"):
        style_id = style_url.lstrip("#")
        # Important: Use copy.deepcopy if the style elements were ever modified,
        # but here we just need the reference to the read-only element.
        return global_styles.get(style_id)
    return None


def resolve_normal_style(style_element, global_styles):
    """
    If the style_element is a StyleMap, resolves it to the specific 'normal'
    Style element.
    If it's a regular Style, returns it as is.
    """
    # Check if the element is a StyleMap
    if (
        style_element is not None
        and style_element.tag == f"{{{KML_NAMESPACE}}}StyleMap"
    ):
        # Search for the <Pair> element with <key>normal</key>
        for pair in style_element.findall(f"./{{{KML_NAMESPACE}}}Pair"):
            key_tag = pair.find(f"./{{{KML_NAMESPACE}}}key")
            if key_tag is not None and key_tag.text == "normal":
                style_url_tag = pair.find(f"./{{{KML_NAMESPACE}}}styleUrl")
                if style_url_tag is not None and style_url_tag.text:
                    # Recursively resolve the next level
                    # (which should be the final Style)
                    return get_style_element_by_url(style_url_tag.text, global_styles)
        # If a StyleMap is found but no 'normal' key, return None
        return None

    # If it's not a StyleMap (i.e., it's already a Style), return it
    return style_element


# --- Core Conversion Function ---


def placemark_to_json(placemark, global_styles):  # noqa: C901, PLR0912
    """
    Converts a single KML Placemark to a JSON object based on its geometry and style.
    Handles Polygon (Case 1), LineString (Case 2), and Point (Case 3).
    Returns a dictionary including the 'name' property inside (per user request).
    """
    placemark_name_tag = placemark.find(f"./{{{KML_NAMESPACE}}}name")

    # FIX: Handle cases where the <name> tag exists but is empty (text is None)
    if placemark_name_tag is not None:
        # Use (placemark_name_tag.text or "") to safely handle None text content
        placemark_name = (placemark_name_tag.text or "").strip()
        # If the name is still empty after stripping, assign the default name
        if not placemark_name:
            placemark_name = "Unnamed Placemark"
    else:
        placemark_name = "Unnamed Placemark"

    # 1. Look up the style from the styleUrl
    style_url_tag = placemark.find(f"./{{{KML_NAMESPACE}}}styleUrl")
    initial_style_element = None
    if style_url_tag is not None and style_url_tag.text:
        initial_style_element = get_style_element_by_url(
            style_url_tag.text, global_styles
        )

    # 2. Resolve to the final 'normal' Style element
    final_style = resolve_normal_style(initial_style_element, global_styles)

    # Helper to extract coordinates (used by all geometries)
    def get_coordinates(geometry_tag):
        coords_tag = geometry_tag.find(f".//{{{KML_NAMESPACE}}}coordinates")
        # Also added a check for None text content here for robustness
        return (
            coords_tag.text.strip()
            if coords_tag is not None and coords_tag.text is not None
            else ""
        )

    # --- Case 1: Polygon Processing ---
    polygon_tag = placemark.find(f"./{{{KML_NAMESPACE}}}Polygon")
    if polygon_tag is not None:
        coordinates = get_coordinates(polygon_tag)
        line_color = ""
        poly_color = ""

        if final_style is not None:
            # Line Color
            line_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}LineStyle")
            if line_style_tag is not None:
                color_tag = line_style_tag.find(f"./{{{KML_NAMESPACE}}}color")
                # Added None check
                line_color = (
                    color_tag.text.strip()
                    if color_tag is not None and color_tag.text is not None
                    else line_color
                )

            # Polygon Color
            poly_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}PolyStyle")
            if poly_style_tag is not None:
                color_tag = poly_style_tag.find(f"./{{{KML_NAMESPACE}}}color")
                # Added None check
                poly_color = (
                    color_tag.text.strip()
                    if color_tag is not None and color_tag.text is not None
                    else poly_color
                )

        return {
            "name": placemark_name,
            "type": "polygon",
            "coordinates": coordinates,
            "polygon_color": poly_color,
            "line_color": line_color,
        }

    # --- Case 2: LineString Processing ---
    line_string_tag = placemark.find(f"./{{{KML_NAMESPACE}}}LineString")
    if line_string_tag is not None:
        coordinates = get_coordinates(line_string_tag)
        line_color = ""

        if final_style is not None:
            # Line Color is in LineStyle
            line_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}LineStyle")
            if line_style_tag is not None:
                color_tag = line_style_tag.find(f"./{{{KML_NAMESPACE}}}color")
                # Added None check
                line_color = (
                    color_tag.text.strip()
                    if color_tag is not None and color_tag.text is not None
                    else line_color
                )

        return {
            "name": placemark_name,
            "type": "line",
            "coordinates": coordinates,
            "line_color": line_color,
        }

    # --- Case 3: Point Processing ---
    point_tag = placemark.find(f"./{{{KML_NAMESPACE}}}Point")
    if point_tag is not None:
        # We extract coordinates here
        coordinates = get_coordinates(point_tag)
        icon_url = ""

        if final_style is not None:
            icon_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}IconStyle")
            if icon_style_tag is not None:
                icon_tag = icon_style_tag.find(f"./{{{KML_NAMESPACE}}}Icon")
                if icon_tag is not None:
                    href_tag = icon_tag.find(f"./{{{KML_NAMESPACE}}}href")
                    # Added None check
                    icon_url = (
                        href_tag.text.strip()
                        if href_tag is not None and href_tag.text is not None
                        else icon_url
                    )

        return {
            "name": placemark_name,
            "type": "point",
            "coordinates": coordinates,  # <-- FIX: Coordinates are now included here
            "iconUrl": icon_url,
        }

    # If no recognized geometry is found
    return None


# --- Main Logic ---


def convert_kml_to_json(input_kml_path, output_json_path="kml_output.json"):
    """
    Loads KML, extracts styles, and converts Placemarks to a list of JSON objects.
    """
    print(f"Starting KML to JSON conversion for: {input_kml_path}")

    if not Path(input_kml_path).exists():
        print(f"Error: Input file not found at {input_kml_path}")
        return

    try:
        # Ensure the namespace is used for parsing
        tree = ET.parse(input_kml_path)  # noqa: S314
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing XML file: {e}")
        return

    # 1. Extract all global Style definitions
    global_styles = {}
    # Find Document element anywhere in the tree,
    # which is the typical container for styles
    document_element = root.find(f".//{{{KML_NAMESPACE}}}Document")
    style_container = document_element if document_element is not None else root

    for style_type in ["Style", "StyleMap"]:
        # Find all styles and style maps globally within the Document or root
        for style_element in style_container.findall(
            f".//{{{KML_NAMESPACE}}}{style_type}"
        ):
            style_id = style_element.get("id")
            if style_id:
                global_styles[style_id] = style_element

    # 2. Iterate through all Placemarks and convert
    all_placemarks_json = []
    placemark_elements = root.findall(f".//{{{KML_NAMESPACE}}}Placemark")

    print(f"Found {len(placemark_elements)} placemarks to process.")

    for placemark in placemark_elements:
        result = placemark_to_json(placemark, global_styles)
        if result:
            all_placemarks_json.append(result)

    # 3. Save the final JSON file
    try:
        with Path(output_json_path).open("w", encoding="utf-8") as f:
            json.dump(all_placemarks_json, f, indent=2)
        print(f"\nKML to JSON conversion complete. Output saved to: {output_json_path}")
    except Exception as e:
        print(f"Error writing JSON file: {e}")


# --- Execution Block (Uses argparse) ---

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Convert KML Placemarks (Polygon, LineString, Point)to a single JSON array."
        ),
        formatter_class=argparse.RawTextHelpFormatter,
    )
    # Define the required input file argument
    parser.add_argument(
        "input_file", type=str, help="Path to the input KML file (e.g., 'data.kml')."
    )
    # Define an optional output file argument
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="kml_output.json",
        help="Path for the output JSON file (default: kml_output.json).",
    )

    args = parser.parse_args()

    # Call the conversion function with user-provided paths
    convert_kml_to_json(args.input_file, args.output)
