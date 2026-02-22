#!/usr/bin/env python3
# /// script
# requires-python = ">=3.13"
# dependencies = [
#   "python-benedict[all]",
# ]
# ///
# get all files with prefix foo in dir

import argparse
from pathlib import Path
from convert_to import convert


def get_files_with_prefix(dir_path: str | Path, prefix: str) -> list[Path]:
    p = Path(dir_path)
    if not p.exists():
        return []
    return [f for f in p.iterdir() if f.is_file() and f.name.startswith(prefix)]


def parse_args() -> argparse.Namespace:

    parser = argparse.ArgumentParser(
        description="Convert files with a specific prefix to JSON."
    )
    parser.add_argument("prefix", help="The prefix of the files to convert.")
    parser.add_argument(
        "--dir",
        default="data/csv",
        help="The directory to search for files (default: data/csv).",
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        default="data/json",
        help="The directory to save converted files (default: data/json).",
    )

    return parser.parse_args()


def main():
    args = parse_args()
    files = get_files_with_prefix(args.dir, args.prefix)
    if not files:
        print(f"No files found with prefix '{args.prefix}' in '{args.dir}'")
        return

    for file in files:
        try:
            output_path = convert(file, "json", output_dir=args.output_dir)
            print(f"Converted: {file} -> {output_path}")
        except Exception as e:
            print(f"Failed to convert {file}: {e}")


if __name__ == "__main__":
    """ Run the script to convert files with a specific prefix to JSON format.
    Usage:
    python convert_to_json.py <prefix> [--dir <directory>] [--output-dir <output_directory>]
    Example:
    python convert_to_json.py dataset --dir data/csv --output-dir data/json
    """
    main()
