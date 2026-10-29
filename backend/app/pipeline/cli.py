"""
Command-Line Interface for Aaroh-Saarthi Delhi Transit Data Pipeline.

Usage:
    python -m app.pipeline.cli --help
    python -m app.pipeline.cli --run
    python -m app.pipeline.cli --status
    python -m app.pipeline.cli --offline
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from app.pipeline.importer import DataImporter


def main() -> None:
    parser = argparse.ArgumentParser(description="Delhi Transit Data Collection & Normalization Pipeline")
    parser.add_argument("--run", action="store_true", help="Run full pipeline including remote scraping and GTFS downloads")
    parser.add_argument("--offline", action="store_true", help="Run pipeline using cached local datasets without remote HTTP calls")
    parser.add_argument("--status", action="store_true", help="Display current dataset provenance and pipeline metadata")
    args = parser.parse_args()

    importer = DataImporter()

    if args.status:
        meta_path = importer.metadata_file
        if meta_path.exists():
            with open(meta_path, encoding="utf-8") as f:
                data = json.load(f)
            print(json.dumps(data, indent=2))
        else:
            print("No pipeline metadata file found at", meta_path)
            print("Run with --run or --offline first to generate metadata.")
        return

    download_remote = not args.offline
    print(f"Executing Delhi Transit Data Pipeline (download_remote={download_remote})...")
    result = importer.run_pipeline(download_remote=download_remote)
    print("\n=== PIPELINE RUN COMPLETE ===")
    print(f"Status: {result.get('status')}")
    print(f"Started: {result.get('started_at')} | Finished: {result.get('completed_at')}")
    metrics = result.get("network_metrics", {})
    print(f"Network Summary:")
    print(f"  • Total Stops & Stations: {metrics.get('total_stops')}")
    print(f"  • Total Routes: {metrics.get('total_routes')} ({metrics.get('metro_routes_count')} Metro, {metrics.get('bus_routes_count')} Bus)")
    print(f"  • Total Trips: {metrics.get('total_trips')}")
    print(f"  • Total Stop Times: {metrics.get('total_stop_times')}")
    print(f"  • Total Interchanges: {metrics.get('total_transfers')}")
    print(f"Metadata saved to: {result.get('metadata_file')}")


if __name__ == "__main__":
    main()
