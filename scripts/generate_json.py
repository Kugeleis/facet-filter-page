# scripts/generate_json.py
import json
import csv
import os

# Crucial: Define the output path relative to this script
# It writes up one directory (..) and into the public/ folder.
OUTPUT_JSON_PATH = os.path.join(os.path.dirname(__file__), "../public/products.json")
SOURCE_CSV_FILE = os.path.join(os.path.dirname(__file__), "products.csv")


def generate_static_json(csv_path, json_path):
    """Reads CSV, performs type conversion, and writes to JSON for the frontend."""
    products = []

    try:
        with open(csv_path, mode="r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Type Conversion for filtering accuracy in the frontend
                row["id"] = int(row["id"])
                row["weight_kg"] = float(row["weight_kg"])
                row["price"] = float(row["price"])
                products.append(row)

    except FileNotFoundError:
        print(f"Error: Source file not found at {csv_path}")
        return

    # Write the list of dictionaries to the final JSON file
    with open(json_path, mode="w", encoding="utf-8") as jsonfile:
        json.dump(products, jsonfile, indent=4)

    print(f"✅ Successfully generated {len(products)} products into {json_path}")


if __name__ == "__main__":
    generate_static_json(SOURCE_CSV_FILE, OUTPUT_JSON_PATH)
