import base64
import json
import logging
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Any

import requests

from cyber_valley.geodata.models import GeodataLayer

log = logging.getLogger(__name__)

KML_NAMESPACE = "http://www.opengis.net/kml/2.2"
ET.register_namespace("", KML_NAMESPACE)


def sync_geodata(url: str) -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)
        kmz_file = tmpdir_path / "map.kmz"

        # Download KMZ
        log.info("Downloading KMZ from %s...", url)
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        with kmz_file.open("wb") as f:
            f.write(response.content)

        log.info("Downloaded %d bytes", len(response.content))

        # Extract KMZ (it's a ZIP file)
        log.info("Extracting KMZ...")
        with zipfile.ZipFile(kmz_file, "r") as zip_ref:
            zip_ref.extractall(tmpdir_path)

        # Find the KML file
        kml_files = list(tmpdir_path.glob("*.kml"))

        if not kml_files:
            log.error("No KML file found in KMZ")
            return

        log.info("Found %d KML files", len(kml_files))

        for kml_file in kml_files:
            log.info("Found KML: %s", kml_file.name)
            layers = process_kml_by_folders(kml_file)

            for folder_name, geodata in layers.items():
                layer_name = folder_name.lower().replace(" ", "_")

                GeodataLayer.objects.update_or_create(
                    name=layer_name,
                    defaults={
                        "data": geodata,
                        "source_file": url,
                        "is_active": True,
                    },
                )

                log.info("Saved geodata layer: %s", layer_name)


def get_style_element_by_url(
    style_url: str | None, global_styles: dict[str, ET.Element]
) -> ET.Element | None:
    """Resolves a style URL (e.g., #styleID) to its corresponding XML Element."""
    if style_url and style_url.startswith("#"):
        style_id = style_url.lstrip("#")
        return global_styles.get(style_id)
    return None


def resolve_normal_style(
    style_element: ET.Element | None, global_styles: dict[str, ET.Element]
) -> ET.Element | None:
    """
    If the style_element is a StyleMap, resolves it to the specific 'normal'
    Style element. If it's a regular Style, returns it as is.
    """
    if (
        style_element is not None
        and style_element.tag == f"{{{KML_NAMESPACE}}}StyleMap"
    ):
        for pair in style_element.findall(f"./{{{KML_NAMESPACE}}}Pair"):
            key_tag = pair.find(f"./{{{KML_NAMESPACE}}}key")
            if key_tag is not None and key_tag.text == "normal":
                style_url_tag = pair.find(f"./{{{KML_NAMESPACE}}}styleUrl")
                if style_url_tag is not None and style_url_tag.text:
                    return get_style_element_by_url(style_url_tag.text, global_styles)
        return None
    return style_element


def get_coordinates(geometry_tag: ET.Element) -> str:
    """Helper to extract coordinates from geometry tag."""
    coords_tag = geometry_tag.find(f".//{{{KML_NAMESPACE}}}coordinates")
    return (
        coords_tag.text.strip()
        if coords_tag is not None and coords_tag.text is not None
        else ""
    )


def parse_coordinates(
    coord_string: str, geom_type: str
) -> list[dict[str, float]] | dict[str, float]:
    """
    Parses a KML coordinate string (LON,LAT,ALT) into a structured list of
    {"lat": float, "lng": float} objects.
    """
    if not coord_string:
        return [] if geom_type != "point" else {}

    coord_sets = coord_string.strip().split()
    transformed_coords = []

    for coord_set in coord_sets:
        try:
            lon, lat, *_ = map(float, coord_set.split(","))
            transformed_coords.append({"lat": lat, "lng": lon})
        except ValueError:
            continue

    if geom_type == "point" and transformed_coords:
        return transformed_coords[0]

    return transformed_coords


def resolve_icon_url(icon_url: str, kml_path: Path) -> str:
    """
    Resolves icon URL to base64 data URI.
    If it's a local file relative to KML, read and encode it.
    If it's already a URL or data URI, return as is.
    """
    if not icon_url:
        return ""

    # Keep external URLs and data URIs as-is
    if icon_url.startswith(("http://", "https://", "data:")):
        return icon_url

    # Handle local file paths
    kml_dir = Path(kml_path).parent
    icon_path = kml_dir / icon_url

    if icon_path.exists():
        try:
            with icon_path.open("rb") as f:
                image_data = f.read()
            suffix = icon_path.suffix.lower()
            mime_type = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".svg": "image/svg+xml",
            }.get(suffix, "image/png")

        except Exception:
            log.exception("Failed to encode icon %s", icon_url)
            return ""
        else:
            base64_data = base64.b64encode(image_data).decode("utf-8")
            return f"data:{mime_type};base64,{base64_data}"

    log.warning("Icon file not found: %s", icon_path)
    return ""


def placemark_to_json(
    placemark: ET.Element,
    global_styles: dict[str, ET.Element],
    kml_path: Path | None = None,
) -> dict[str, Any] | None:
    """
    Converts a single KML Placemark to a JSON object based on its geometry and style.
    Handles Polygon, LineString, and Point.
    """
    placemark_name_tag = placemark.find(f"./{{{KML_NAMESPACE}}}name")
    if placemark_name_tag is not None:
        placemark_name = (placemark_name_tag.text or "").strip()
        if not placemark_name:
            placemark_name = "Unnamed Placemark"
    else:
        placemark_name = "Unnamed Placemark"

    style_url_tag = placemark.find(f"./{{{KML_NAMESPACE}}}styleUrl")
    initial_style_element = None
    if style_url_tag is not None and style_url_tag.text:
        initial_style_element = get_style_element_by_url(
            style_url_tag.text, global_styles
        )

    final_style = resolve_normal_style(initial_style_element, global_styles)

    # Case 1: Polygon
    polygon_tag = placemark.find(f"./{{{KML_NAMESPACE}}}Polygon")
    if polygon_tag is not None:
        coordinates = get_coordinates(polygon_tag)
        line_color = ""
        poly_color = ""

        if final_style is not None:
            line_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}LineStyle")
            if line_style_tag is not None:
                color_tag = line_style_tag.find(f"./{{{KML_NAMESPACE}}}color")
                line_color = (
                    color_tag.text.strip()
                    if color_tag is not None and color_tag.text is not None
                    else line_color
                )

            poly_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}PolyStyle")
            if poly_style_tag is not None:
                color_tag = poly_style_tag.find(f"./{{{KML_NAMESPACE}}}color")
                poly_color = (
                    color_tag.text.strip()
                    if color_tag is not None and color_tag.text is not None
                    else poly_color
                )

        return {
            "name": placemark_name,
            "type": "polygon",
            "coordinates": parse_coordinates(coordinates, "polygon"),
            "polygon_color": poly_color,
            "line_color": line_color,
        }

    # Case 2: LineString
    line_string_tag = placemark.find(f"./{{{KML_NAMESPACE}}}LineString")
    if line_string_tag is not None:
        coordinates = get_coordinates(line_string_tag)
        line_color = ""

        if final_style is not None:
            line_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}LineStyle")
            if line_style_tag is not None:
                color_tag = line_style_tag.find(f"./{{{KML_NAMESPACE}}}color")
                line_color = (
                    color_tag.text.strip()
                    if color_tag is not None and color_tag.text is not None
                    else line_color
                )

        return {
            "name": placemark_name,
            "type": "line",
            "coordinates": parse_coordinates(coordinates, "line"),
            "line_color": line_color,
        }

    # Case 3: Point
    point_tag = placemark.find(f"./{{{KML_NAMESPACE}}}Point")
    if point_tag is not None:
        coordinates = get_coordinates(point_tag)
        icon_url = ""

        if final_style is not None:
            icon_style_tag = final_style.find(f"./{{{KML_NAMESPACE}}}IconStyle")
            if icon_style_tag is not None:
                icon_tag = icon_style_tag.find(f"./{{{KML_NAMESPACE}}}Icon")
                if icon_tag is not None:
                    href_tag = icon_tag.find(f"./{{{KML_NAMESPACE}}}href")
                    raw_icon_url = (
                        href_tag.text.strip()
                        if href_tag is not None and href_tag.text is not None
                        else ""
                    )
                    if raw_icon_url and kml_path:
                        icon_url = resolve_icon_url(raw_icon_url, kml_path)
                    else:
                        icon_url = raw_icon_url

        return {
            "name": placemark_name,
            "type": "point",
            "coordinates": parse_coordinates(coordinates, "point"),
            "iconUrl": icon_url,
        }

    return None


def process_kml_file(kml_path: Path | str) -> list[dict[str, Any]]:
    """
    Processes a KML file and returns a list of geodata objects.
    Combines conversion and coordinate transformation in one step.
    """
    kml_path = Path(kml_path)
    if not kml_path.exists():
        raise FileNotFoundError(f"KML file not found: {kml_path}")

    tree = ET.parse(kml_path)  # noqa: S314
    root = tree.getroot()

    # Extract all global Style definitions
    global_styles = {}
    document_element = root.find(f".//{{{KML_NAMESPACE}}}Document")
    style_container = document_element if document_element is not None else root

    for style_type in ["Style", "StyleMap"]:
        for style_element in style_container.findall(
            f".//{{{KML_NAMESPACE}}}{style_type}"
        ):
            style_id = style_element.get("id")
            if style_id:
                global_styles[style_id] = style_element

    # Process all Placemarks
    all_placemarks_json = []
    placemark_elements = root.findall(f".//{{{KML_NAMESPACE}}}Placemark")

    for placemark in placemark_elements:
        result = placemark_to_json(placemark, global_styles, kml_path)
        if result:
            all_placemarks_json.append(result)

    return all_placemarks_json


def process_kml_by_folders(kml_path: Path | str) -> dict[str, list[dict[str, Any]]]:
    """
    Processes a KML file and returns a dict mapping folder names to geodata lists.
    Each folder becomes a separate layer.
    """
    kml_path = Path(kml_path)
    if not kml_path.exists():
        raise FileNotFoundError(f"KML file not found: {kml_path}")

    tree = ET.parse(kml_path)  # noqa: S314
    root = tree.getroot()

    # Extract all global Style definitions
    global_styles = {}
    document_element = root.find(f".//{{{KML_NAMESPACE}}}Document")
    style_container = document_element if document_element is not None else root

    for style_type in ["Style", "StyleMap"]:
        for style_element in style_container.findall(
            f".//{{{KML_NAMESPACE}}}{style_type}"
        ):
            style_id = style_element.get("id")
            if style_id:
                global_styles[style_id] = style_element

    # Process Folders
    layers = {}
    folders = root.findall(f".//{{{KML_NAMESPACE}}}Folder")

    for folder in folders:
        folder_name_tag = folder.find(f"./{{{KML_NAMESPACE}}}name")
        folder_name = (
            folder_name_tag.text.strip()
            if folder_name_tag is not None and folder_name_tag.text
            else "Unnamed"
        )

        placemarks = []
        for placemark in folder.findall(f"./{{{KML_NAMESPACE}}}Placemark"):
            result = placemark_to_json(placemark, global_styles, kml_path)
            if result:
                placemarks.append(result)

        if placemarks:
            layers[folder_name] = placemarks

    return layers


def load_json_file(json_path: Path | str) -> Any:
    """Load geodata from a JSON file."""
    json_path = Path(json_path)
    if not json_path.exists():
        raise FileNotFoundError(f"JSON file not found: {json_path}")

    with json_path.open(encoding="utf-8") as f:
        return json.load(f)
