# scripts/generate_json.py
import json
import csv
import os

# Crucial: Define the output path relative to this script
# It writes up one directory (..) and into the public/ folder.
OUTPUT_JSON_PATH = os.path.join(os.path.dirname(__file__), "../public/")
SOURCE_CSV_FILE = os.path.join(os.path.dirname(__file__), "products.csv")

name = "products"


def convert_csv2json(csv_file, json_path):
    """Reads CSV, performs type conversion, and writes to JSON for the frontend."""
    products = []

    try:
        with open(csv_file, mode="r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                products.append(row)

    except FileNotFoundError:
        print(f"Error: Source file not found at {csv_file}")
        return

    base_name = os.path.splitext(os.path.basename(csv_file))[0]
    json_file_path = os.path.join(os.path.abspath(json_path), f"{base_name}.json")

    # Write the list of dictionaries to the final JSON file
    with open(json_file_path, mode="w", encoding="utf-8") as jsonfile:
        json.dump(products, jsonfile, indent=4)

    print(f"✅ Successfully generated {len(products)} products into {json_file_path}")


def get_related_csv_files(name: str, dir=".") -> list[str]:
    """Returns a list of related csv files for a given base name.
    Convention: there might be more files with name-something... include them.
    """
    related_files = []
    for file in os.listdir(dir):
        if file.startswith(name) and file.endswith(".csv") and file != f"{name}.csv":
            related_files.append(file)
    return related_files


if __name__ == "__main__":
    for related_file in get_related_csv_files(name, dir=os.path.dirname(__file__)):
        print(f"Found related file: {related_file}. Please merge manually if needed.")
        convert_csv2json(os.path.join(os.path.dirname(__file__), related_file), OUTPUT_JSON_PATH)