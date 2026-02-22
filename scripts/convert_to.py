#!/usr/bin/env python3
# /// script
# requires-python = ">=3.13"
# dependencies = [
#   "python-benedict[all]",
# ]
# ///
"""
convert_to — Universal file format converter powered by python-benedict.

Converts a source file from one format to another. Supported formats:
  csv, ini, json, pickle, plist, query-string, toml, xml, yaml

Install dependency:
  pip install "python-benedict[all]"

Usage:
  python convert_to.py <source_file> <target_format> [options]

Examples:
  python convert_to.py data.csv yaml
  python convert_to.py data.json toml --output-dir ./out
  python convert_to.py config.yaml ini --output-dir /tmp
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Dependency guard
# ---------------------------------------------------------------------------
try:
    from benedict import benedict  # type: ignore
except ImportError:
    sys.exit(
        'python-benedict is not installed.\nRun:  pip install "python-benedict[all]"'
    )

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Maps each format name to:
#   - its canonical name as used by benedict (from_* / to_* methods)
#   - the default file extension
FORMATS: dict[str, tuple[str, str]] = {
    "csv": ("csv", ".csv"),
    "ini": ("ini", ".ini"),
    "json": ("json", ".json"),
    "pickle": ("pickle", ".pkl"),
    "plist": ("plist", ".plist"),
    "query-string": ("query-string", ".qs"),
    "toml": ("toml", ".toml"),
    "xml": ("xml", ".xml"),
    "yaml": ("yaml", ".yaml"),
}

# ---------------------------------------------------------------------------
# Format detection
# ---------------------------------------------------------------------------

_EXT_TO_FORMAT: dict[str, str] = {
    ".csv": "csv",
    ".ini": "ini",
    ".cfg": "ini",
    ".json": "json",
    ".pkl": "pickle",
    ".plist": "plist",
    ".qs": "query-string",
    ".toml": "toml",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
}


def detect_format(path: Path) -> str:
    """Return the format name for *path* based on its extension."""
    fmt = _EXT_TO_FORMAT.get(path.suffix.lower())
    if fmt is None:
        raise ValueError(
            f"Cannot detect format from extension '{path.suffix}'. "
            f"Supported extensions: {', '.join(sorted(_EXT_TO_FORMAT))}"
        )
    return fmt


# ---------------------------------------------------------------------------
# I/O helpers (thin wrappers that keep benedict calls in one place)
# ---------------------------------------------------------------------------


def load(source: Path, fmt: str) -> benedict:
    """Load *source* as a benedict instance using *fmt*."""
    loader = getattr(benedict, f"from_{fmt.replace('-', '_')}")
    return loader(str(source))


def save(data: benedict, target: Path, fmt: str) -> None:
    """Write *data* to *target* in *fmt*."""
    saver = getattr(data, f"to_{fmt.replace('-', '_')}")
    saver(filepath=str(target))


def unwrap_values(data: Any) -> Any:
    """
    Unwrap 'values' if it is the only key and its value is a list.

    Args:
        data: The data to unwrap.

    Returns:
        The unwrapped list if applicable, otherwise the original data.
    """
    if (
        isinstance(data, dict)
        and "values" in data
        and len(data) == 1
        and isinstance(data["values"], list)
    ):
        return data["values"]
    return data


def save_any(data: Any, target: Path, fmt: str) -> None:
    """
    Write data to target in specified format, handling both dict and list.

    Args:
        data: The data to save.
        target: The target file path.
        fmt: The target format.
    """
    if fmt == "json":
        import json

        with open(target, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    else:
        # For other formats, benedict requires a dict.
        # If data is a list, wrap it back in a benedict instance.
        data_to_save = data
        if isinstance(data, list):
            data_to_save = benedict({"values": data})
        elif not isinstance(data, benedict):
            data_to_save = benedict(data)
        save(data_to_save, target, fmt)


# ---------------------------------------------------------------------------
# Output path builder
# ---------------------------------------------------------------------------


def build_output_path(
    source: Path, target_fmt: str, output_dir: str | Path | None
) -> Path:
    """
    Derive the output file path from the source, target format and output dir.

    Args:
        source: The source file path.
        target_fmt: The target format name.
        output_dir: The directory for the output file.

    Returns:
        The derived output path.
    """
    _, ext = FORMATS[target_fmt]
    directory = output_dir if output_dir is not None else source.parent
    return Path(directory) / (source.stem + ext)


# ---------------------------------------------------------------------------
# Core conversion logic
# ---------------------------------------------------------------------------


def convert(source: Path, target_fmt: str, output_dir: str | Path | None) -> Path:
    """
    Convert *source* to *target_fmt*, write the result, and return the
    output path.

    Args:
        source: The source file path.
        target_fmt: The target format name.
        output_dir: The directory for the output file.

    Returns:
        The path to the converted file.

    Raises:
        ValueError: For same-format conversion or unsupported formats.
    """
    source_fmt = detect_format(source)
    output_path = build_output_path(source, target_fmt, output_dir)

    # If source and target formats are same, check if we're actually changing the location
    # or if we might need to unwrap values.
    # We'll proceed anyway to be safe and allow 'cleaning' of JSON files.

    if output_dir is not None:
        Path(output_dir).mkdir(parents=True, exist_ok=True)

    data = load(source, source_fmt)
    transformed_data = unwrap_values(data)
    save_any(transformed_data, output_path, target_fmt)

    return output_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="convert_to",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "source_file",
        type=Path,
        help="Path to the source file. Format is inferred from the extension.",
    )
    parser.add_argument(
        "target_format",
        choices=list(FORMATS),
        metavar="target_format",
        help=("Output format. Choices: " + ", ".join(FORMATS)),
    )
    parser.add_argument(
        "--output-dir",
        "-o",
        type=Path,
        default=None,
        metavar="DIR",
        help=(
            "Directory for the output file. "
            "Defaults to the same directory as the source file."
        ),
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    source: Path = args.source_file.resolve()

    if not source.is_file():
        parser.error(f"Source file not found: {source}")

    try:
        output_path = convert(source, args.target_format, args.output_dir)
    except ValueError as exc:
        parser.error(str(exc))
    except Exception as exc:
        sys.exit(f"Conversion failed: {exc}")

    print(f"  {source.name}  →  {output_path}")


if __name__ == "__main__":
    main()
