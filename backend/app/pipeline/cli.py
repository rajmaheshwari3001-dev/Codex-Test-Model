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
    parser.add_argument("--poochho", action="store_true", help="Display PoochhO auto-rickshaw & taxi statutory fare model details")
    args = parser.parse_args()

    importer = DataImporter()

    if args.poochho:
        from app.pipeline.sources.poochho_scraper import PoochhOScraper
        scraper = PoochhOScraper()
        info = scraper.fetch_app_metadata()
        print("\n=== POOCHHO (DIMTS) DATA & FARE MODEL ===")
        print(f"Source: {info.get('source')}")
        print(f"Package: {info.get('package_name')}")
        print(f"Modes Supported: {', '.join(info.get('modes_supported', []))}")
        print("\nFeatures:")
        for feat in info.get("features", []):
            print(f"  • {feat}")
        print("\nStatutory Fare Rules:")
        print(f"  • Auto: Rs.{info['fare_rules']['auto_rickshaw']['base_fare']} first {info['fare_rules']['auto_rickshaw']['base_distance_km']}km, Rs.{info['fare_rules']['auto_rickshaw']['rate_per_km']}/km thereafter")
        print(f"  • Auto Night Charge: +{info['fare_rules']['auto_rickshaw']['night_surcharge_percent']}% ({info['fare_rules']['auto_rickshaw']['night_hours']})")
        print(f"  • Taxi Non-AC: Rs.{info['fare_rules']['taxi']['base_fare']} first {info['fare_rules']['taxi']['base_distance_km']}km, Rs.{info['fare_rules']['taxi']['non_ac_rate_per_km']}/km thereafter")
        print(f"  • Taxi AC: Rs.{info['fare_rules']['taxi']['base_fare']} first {info['fare_rules']['taxi']['base_distance_km']}km, Rs.{info['fare_rules']['taxi']['ac_rate_per_km']}/km thereafter")
        print("\nSample Calculations:")
        for dist in [2.0, 5.0, 12.0]:
            day_fare = scraper.calculate_auto_fare(dist, departure_time="14:00")
            night_fare = scraper.calculate_auto_fare(dist, departure_time="23:30")
            road_km, duration = scraper.estimate_travel_metrics(dist, "14:00")
            print(f"  • {dist} km straight ({road_km} km road): Daytime Auto Rs.{day_fare:.0f} (~{duration} min) | Night Auto Rs.{night_fare:.0f}")
        return

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

