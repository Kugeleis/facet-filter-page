# scripts/generate_json.py
import json
import csv
import os
import argparse

# Define the output path relative to this script's location.
# It navigates up one directory (..) and into the 'public/' folder.
OUTPUT_JSON_PATH = os.path.join(os.path.dirname(__file__), "../public/")
SOURCE_CSV_DIR = os.path.dirname(__file__)


def type_convert(value: str):
    """
    Attempts to convert a string value to a more specific type.
    - If it's a number, it's converted to an int if it has no decimal part, otherwise a float.
    - Empty strings are converted to null.
    """
    if value == '':
        return None  # Represent empty strings as null in JSON

    try:
        # First, try to convert to a float
        float_val = float(value)
        # If the float is actually an integer (e.g., 10.0), convert to int
        if float_val.is_integer():
            return int(float_val)
        return float_val
    except (ValueError, TypeError):
        # If it can't be a float, it's just a string
        return value


def convert_csv2json(csv_file, json_path):
    """Reads a CSV file, performs type conversion, and saves it as a JSON file."""
    data = []

    try:
        with open(csv_file, mode="r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Process each cell in the row for type conversion
                converted_row = {key: type_convert(value) for key, value in row.items()}
                data.append(converted_row)

    except FileNotFoundError:
        print(f"❌ Error: Source file not found at {csv_file}")
        return

    # Determine the output JSON filename based on the input CSV filename
    base_name = os.path.splitext(os.path.basename(csv_file))[0]
    json_file_path = os.path.join(os.path.abspath(json_path), f"{base_name}.json")

    # Write the data to the JSON file
    with open(json_file_path, mode="w", encoding="utf-8") as jsonfile:
        json.dump(data, jsonfile, indent=4)

    print(f"✅ Successfully converted {csv_file} to {json_file_path} with {len(data)} items.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert a dataset and its configuration from CSV to JSON format."
    )
    parser.add_argument(
        "dataset",
        help="The base name of the dataset (e.g., 'products', 'boxen'). "
             "The script will look for '[dataset].csv' and '[dataset]-config.csv'.",
    )
    args = parser.parse_args()

    dataset_name = args.dataset

    # List of files to be converted for the given dataset
    # Config files should not be type-converted, so we handle them separately.
    data_csv = f"{dataset_name}.csv"
    config_csv = f"{dataset_name}-config.csv"
    ui_config_csv = f"{dataset_name}-ui-config.csv"


    print(f"Processing dataset: {dataset_name}")

    # Convert the main data CSV with type conversion
    csv_path = os.path.join(SOURCE_CSV_DIR, data_csv)
    if os.path.exists(csv_path):
        convert_csv2json(csv_path, OUTPUT_JSON_PATH)
    else:
        print(f"⚠️ Warning: Data file not found, skipping: {csv_path}")

    # For config files, we'll do a simple conversion without type changes
    def convert_config_csv(filename):
        config_path = os.path.join(SOURCE_CSV_DIR, filename)
        if os.path.exists(config_path):
            rows = []
            with open(config_path, mode="r", encoding="utf-8") as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    rows.append(row)

            base_name = os.path.splitext(os.path.basename(config_path))[0]
            json_file_path = os.path.join(os.path.abspath(OUTPUT_JSON_PATH), f"{base_name}.json")

            with open(json_file_path, mode="w", encoding="utf-8") as jsonfile:
                json.dump(rows, jsonfile, indent=4)
            print(f"✅ Successfully converted config {filename} to {json_file_path}")
        else:
            # This is not a fatal error, ui-config might not exist as a CSV
             if 'ui-config' not in filename:
                print(f"⚠️ Warning: Config file not found, skipping: {config_path}")


    convert_config_csv(config_csv)
    convert_config_csv(ui_config_csv)


    print("Done.")