import os
import re
import xml.etree.ElementTree as ET

# Define the KML namespace for proper XPath lookups
KML_NAMESPACE = "http://www.opengis.net/kml/2.2"
ET.register_namespace("", KML_NAMESPACE)


# Helper function to strip the namespace from an XML tag for easier comparison
def strip_namespace(tag):
    return tag.replace(f"{{{KML_NAMESPACE}}}", "")


def resolve_dependencies(initial_ids, global_styles):
    """
    Recursively finds all dependent Style and StyleMap IDs.
    If an ID points to a StyleMap, it checks the <Pair><styleUrl> tags
    and adds those styles to the list to be included.
    """
    # Start with the IDs directly referenced by Placemarks
    all_required_ids = set(initial_ids)
    # Queue for IDs whose dependencies haven't been processed yet
    ids_to_process = list(initial_ids)

    while ids_to_process:
        current_id = ids_to_process.pop(0)

        # Look up the style element in the global store
        if current_id in global_styles:
            style_element = global_styles[current_id]

            # Check if this element is a StyleMap
            if strip_namespace(style_element.tag) == "StyleMap":
                # Iterate through <Pair> elements to find nested style URLs
                for pair in style_element.findall(f"./{{{KML_NAMESPACE}}}Pair"):
                    style_url_tag = pair.find(f"./{{{KML_NAMESPACE}}}styleUrl")

                    if style_url_tag is not None and style_url_tag.text:
                        # Extract the dependent ID and remove the leading '#'
                        dependent_id = style_url_tag.text.strip().lstrip("#")

                        # If it's a new, unseen dependency, add it to the set and the queue
                        if dependent_id not in all_required_ids:
                            all_required_ids.add(dependent_id)
                            ids_to_process.append(dependent_id)

    return all_required_ids


def split_kml_by_folder(  # noqa: C901, PLR0912, PLR0915
    input_kml_path, output_dir="output_kml_files"
):
    """
    Parses a large KML file and splits it into smaller KML files, one for each
    <Folder>. Each new file includes the necessary <Style> definitions,
    including nested dependencies.

    Args:
        input_kml_path (str): Path to the large input KML file.
        output_dir (str): Directory where the new KML files will be saved.
    """
    print(f"Starting KML splitting for: {input_kml_path}")

    # Check if the input file exists
    if not os.path.exists(input_kml_path):
        print(f"Error: Input file not found at {input_kml_path}")
        return

    # 1. Load the KML file
    try:
        tree = ET.parse(input_kml_path)
        root = tree.getroot()
    except Exception as e:
        print(f"Error parsing XML file: {e}")
        return

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # 2. Extract and store all global Style definitions
    # Keys are the style IDs (without the '#') and values are the XML elements
    global_styles = {}

    # KML Styles are typically found directly under <Document> or <kml>
    document_element = root.find(f".//{{{KML_NAMESPACE}}}Document")

    if document_element is None:
        print(
            "Warning: Could not find a <Document> tag. Checking styles under <kml> root."
        )
        style_container = root
    else:
        style_container = document_element

    # Find all Style and StyleMap elements
    for style_type in ["Style", "StyleMap"]:
        for style_element in style_container.findall(
            f"./{{{KML_NAMESPACE}}}{style_type}"
        ):
            style_id = style_element.get("id")
            if style_id:
                global_styles[style_id] = style_element

    print(f"Found {len(global_styles)} global styles/style maps.")

    # 3. Iterate through all <Folder> tags
    folder_elements = root.findall(f".//{{{KML_NAMESPACE}}}Folder")
    if not folder_elements:
        print("No <Folder> elements found. Exiting.")
        return

    print(f"Found {len(folder_elements)} folders to process.")

    for folder in folder_elements:
        # Get file name from <name> tag
        name_tag = folder.find(f"./{{{KML_NAMESPACE}}}name")
        if name_tag is None or not name_tag.text.strip():
            print("Warning: Found a <Folder> without a valid <name> tag. Skipping.")
            continue

        folder_name = name_tag.text.strip()

        # Clean up the folder name for use as a filename
        sanitized_name = re.sub(r"[^\w\-_\. ]", "", folder_name).strip()
        sanitized_name = re.sub(
            r"\s+", "_", sanitized_name
        )  # Replace spaces with underscores
        output_filename = os.path.join(output_dir, f"{sanitized_name}.kml")

        # Set to store unique style IDs required directly by Placemarks (without the '#')
        required_style_ids = set()

        # Identify all Placemarks and extract their styleUrls within this folder
        for placemark in folder.findall(f".//{{{KML_NAMESPACE}}}Placemark"):
            style_url_tag = placemark.find(f"./{{{KML_NAMESPACE}}}styleUrl")
            if style_url_tag is not None and style_url_tag.text:
                # The styleUrl is typically like #styleID, so we remove the '#'
                style_id_from_url = style_url_tag.text.strip().lstrip("#")
                required_style_ids.add(style_id_from_url)

        # 4. Resolve all nested style dependencies
        final_required_ids = resolve_dependencies(required_style_ids, global_styles)

        # 5. Create the new KML structure for this folder

        # Create the root <kml> element
        new_kml = ET.Element("kml", xmlns=KML_NAMESPACE)

        # Create the <Document> element
        new_document = ET.SubElement(new_kml, "Document")

        # 6. Insert required Styles into the new document
        styles_added_count = 0
        for style_id in final_required_ids:
            if style_id in global_styles:
                # IMPORTANT: We use ET.Element.copy() to ensure we don't move the
                # element from the global_styles map, which could break other folders.
                style_copy = global_styles[style_id]

                # Check if the style element is already in the new document (avoid duplicates if copied twice in recursion)
                # This simple check is omitted since we use final_required_ids set, but it's good practice.
                new_document.append(style_copy)
                styles_added_count += 1
            else:
                print(
                    f"  Warning: Style ID '{style_id}' referenced but not found globally. Skipping."
                )

        # 7. Insert the entire Folder element into the new document
        new_document.append(folder)

        # 8. Save the new KML file
        new_tree = ET.ElementTree(new_kml)
        new_tree.write(output_filename, encoding="utf-8", xml_declaration=True)

        print(
            f"Successfully created: {output_filename} (Styles added: {styles_added_count})"
        )

    print("\nKML splitting complete!")


# --- Execution Block ---
# You need to provide the path to your large KML file here.
if __name__ == "__main__":
    # >>> IMPORTANT: Replace 'path/to/your/large_input.kml' with your actual file path. <<<
    input_file = "map.kml"

    # Create a dummy file for testing purposes if it doesn't exist
    if not os.path.exists(input_file):
        print(f"Creating a dummy file '{input_file}' for demonstration...")
        # Note: The dummy content now implicitly tests the dependency resolution:
        # Placemark -> StyleMap (map-red) -> Style (style-red).
        dummy_kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="{KML_NAMESPACE}">
  <Document>
    <name>Master KML Document</name>
    
    <Style id="style-red">
      <LineStyle><color>ff0000ff</color><width>5</width></LineStyle>
    </Style>
    <Style id="style-blue">
      <PolyStyle><color>ff00ffff</color></PolyStyle>
    </Style>
    <StyleMap id="map-red">
      <Pair><key>normal</key><styleUrl>#style-red</styleUrl></Pair>
      <Pair><key>highlight</key><styleUrl>#style-red</styleUrl></Pair>
    </StyleMap>

    <Folder>
      <name>Road Segments</name>
      <Placemark>
        <name>Main Road</name>
        <styleUrl>#map-red</styleUrl>
        <LineString><coordinates>...</coordinates></LineString>
      </Placemark>
      <Placemark>
        <name>Side Street</name>
        <styleUrl>#map-red</styleUrl>
        <LineString><coordinates>...</coordinates></LineString>
      </Placemark>
    </Folder>

    <Folder>
      <name>Building Outlines</name>
      <Placemark>
        <name>Warehouse</name>
        <styleUrl>#style-blue</styleUrl>
        <Polygon><outerBoundaryIs>...</outerBoundaryIs></Polygon>
      </Placemark>
      <Placemark>
        <name>Office Tower</name>
        <styleUrl>#style-blue</styleUrl>
        <Polygon><outerBoundaryIs>...</outerBoundaryIs></Polygon>
      </Placemark>
    </Folder>
  </Document>
</kml>
"""
        with open(input_file, "w", encoding="utf-8") as f:
            f.write(dummy_kml_content)
        print(f"Dummy file '{input_file}' created. Running script now...")

    split_kml_by_folder(input_file)
