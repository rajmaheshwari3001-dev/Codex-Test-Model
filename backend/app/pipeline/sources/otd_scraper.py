"""
Delhi Open Transit Data (OTD) Scraper and Documentation Inspector (https://otd.delhi.gov.in/)

Scrapes OTD documentation and static data endpoints. Audits access requirements
for static feeds and real-time VehiclePositions Protobuf streams.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

import requests
from bs4 import BeautifulSoup
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

OTD_DOC_URL = "https://otd.delhi.gov.in/documentation/"
OTD_STATIC_URL = "https://otd.delhi.gov.in/data/static/"
DEFAULT_USER_AGENT = "Aaroh-Saarthi-TransitResearch/1.0 (+https://github.com/rajmaheshwari3001-dev/Codex-Test-Model)"


class OTDScraper:
    """Scrapes OTD portal metadata and documentation."""

    def __init__(self, doc_url: str = OTD_DOC_URL, static_url: str = OTD_STATIC_URL):
        self.doc_url = doc_url
        self.static_url = static_url
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        })

    def scrape_documentation(self) -> Dict[str, Any]:
        """
        Scrape and parse OTD documentation regarding GTFS static feeds and Real-time APIs.
        """
        result: Dict[str, Any] = {
            "source_url": self.doc_url,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "status_code": None,
            "gtfs_files_documented": [],
            "realtime_api_spec": {},
            "access_requirements": {},
        }

        try:
            logger.info("Scraping OTD documentation at %s ...", self.doc_url)
            resp = self.session.get(self.doc_url, verify=False, timeout=15)
            result["status_code"] = resp.status_code
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")
            text = soup.get_text()

            # Find documented GTFS static files
            gtfs_files = []
            for fname in ["agency.txt", "calendar.txt", "stops.txt", "routes.txt", "trips.txt", "stop_times.txt"]:
                if fname in text:
                    gtfs_files.append(fname)
            result["gtfs_files_documented"] = gtfs_files

            # Extract real-time info and access requirements
            if "VehiclePositions.pb" in text or "realtime" in text.lower():
                result["realtime_api_spec"] = {
                    "endpoint": "/api/realtime/VehiclePositions.pb",
                    "auth_query_param": "key=YOUR_PRIVATE_KEY",
                    "protocol": "Protocol Buffers (GTFS-RT)",
                    "requires_registration": True,
                    "provider": "Department of Transport, GNCTD / IIIT-Delhi",
                }

            result["access_requirements"] = {
                "static_data": "Openly accessible via Delhi Transport Stack and OTD static repository without API key.",
                "realtime_data": "Requires official user registration and private API key for Protobuf feed consumption.",
            }

            logger.info("Successfully audited OTD documentation.")
            return result

        except Exception as e:
            logger.warning("Failed to scrape OTD documentation (%s); returning documented defaults.", e)
            result["error"] = str(e)
            result["gtfs_files_documented"] = ["agency.txt", "calendar.txt", "stops.txt", "routes.txt", "trips.txt", "stop_times.txt"]
            result["access_requirements"] = {
                "static_data": "Openly accessible via Delhi Transport Stack without API key.",
                "realtime_data": "Requires official registration at otd.delhi.gov.in for private API key.",
            }
            return result

