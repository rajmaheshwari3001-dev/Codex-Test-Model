"""
Data Importer and Pipeline Orchestrator.

Orchestrates downloading from Delhi Transport Stack, scraping DTC & DMRC websites,
normalizing transit data, and updating application metadata.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from app.pipeline.sources.transport_stack import TransportStackClient
from app.pipeline.sources.dtc_scraper import DTCScraper
from app.pipeline.sources.dmrc_scraper import DMRCScraper
from app.pipeline.sources.otd_scraper import OTDScraper
from app.pipeline.normalizer import TransitDataNormalizer

logger = logging.getLogger(__name__)


class DataImporter:
    """Orchestrates end-to-end Delhi transit data collection and persistence."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or (Path(__file__).resolve().parent.parent / "data")
        self.raw_dir = self.data_dir / "raw"
        self.metadata_file = self.data_dir / "metadata.json"

    def run_pipeline(self, download_remote: bool = True) -> Dict[str, Any]:
        """
        Execute the data collection and normalization pipeline.
        
        Args:
            download_remote: If True, calls remote APIs and scrapers;
                             If False, normalizes existing downloaded datasets.
        """
        started_at = datetime.now(timezone.utc).isoformat()
        results: Dict[str, Any] = {
            "status": "in_progress",
            "started_at": started_at,
            "sources": {},
        }

        # 1. Transport Stack Feeds
        ts_client = TransportStackClient(raw_dir=self.raw_dir)
        if download_remote:
            logger.info("Connecting to Delhi Transport Stack...")
            ts_summary = ts_client.fetch_all_transit_feeds()
        else:
            ts_summary = {
                "source": "Delhi Transport Stack (Local cache)",
                "buses_available": (self.raw_dir / "delhi_buses_gtfs").exists(),
                "metro_available": (self.raw_dir / "delhi_metro_gtfs").exists(),
            }
        results["sources"]["delhi_transport_stack"] = ts_summary

        # 2. Scrape DTC Timetables and Fare Stages
        dtc_scraper = DTCScraper()
        if download_remote:
            logger.info("Scraping DTC website for official fare stages...")
            dtc_summary = dtc_scraper.scrape_service_links()
        else:
            dtc_summary = {
                "source": "Delhi Transport Corporation (https://dtc.delhi.gov.in/)",
                "fare_rules": dtc_scraper.DTC_FARE_SLABS if hasattr(dtc_scraper, "DTC_FARE_SLABS") else {},
            }
        results["sources"]["dtc"] = dtc_summary

        # 3. Scrape DMRC Fare Rules
        dmrc_scraper = DMRCScraper()
        if download_remote:
            logger.info("Scraping DMRC website for official metro tariffs...")
            dmrc_summary = dmrc_scraper.scrape_fare_page()
        else:
            dmrc_summary = {
                "source": "Delhi Metro Rail Corporation (https://delhimetrorail.com/)",
            }
        results["sources"]["dmrc"] = dmrc_summary

        # 4. Audit OTD Documentation
        otd_scraper = OTDScraper()
        if download_remote:
            logger.info("Auditing Delhi Open Transit Data documentation...")
            otd_summary = otd_scraper.scrape_documentation()
        else:
            otd_summary = {
                "source": "Delhi Open Transit Data (https://otd.delhi.gov.in/)",
            }
        results["sources"]["otd"] = otd_summary

        # 5. Normalize and Validate Network
        normalizer = TransitDataNormalizer(data_dir=self.data_dir)
        norm_result = normalizer.normalize_network()
        validation = norm_result["validation_report"]
        results["network_metrics"] = validation

        # 6. Save comprehensive metadata file
        finished_at = datetime.now(timezone.utc).isoformat()
        results["status"] = "success"
        results["completed_at"] = finished_at

        metadata_payload = {
            "application": "Aaroh-Saarthi Delhi Multimodal Transit Engine",
            "last_pipeline_run": finished_at,
            "version": "2.1.0",
            "datasets": {
                "delhi_buses": {
                    "source": "Delhi Transport Stack (Dataset 1: DTC / DoT GTFS)",
                    "transport_mode": "bus",
                    "fare_rules": "Official DTC Stage-Based (Non-AC ₹5-15, AC ₹10-25)",
                },
                "delhi_metro": {
                    "source": "Delhi Transport Stack (Dataset 2: DMRC GTFS) & DMRC Official Tariffs",
                    "transport_mode": "metro",
                    "fare_rules": "Official DMRC Distance Slabs (₹11 to ₹64, with Sunday & Off-peak Discounts)",
                }
            },
            "metrics": {
                "total_stations_and_stops": validation["total_stops"],
                "total_transit_routes": validation["total_routes"],
                "total_scheduled_trips": validation["total_trips"],
                "total_stop_times": validation["total_stop_times"],
                "total_verified_tariffs": validation["total_fares"],
                "total_multimodal_interchanges": validation["total_transfers"],
            },
            "sources": results["sources"],
        }

        with open(self.metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata_payload, f, indent=2)

        logger.info("Saved pipeline metadata to %s.", self.metadata_file)
        results["metadata_file"] = str(self.metadata_file)
        return results
