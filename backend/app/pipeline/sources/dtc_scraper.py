"""
DTC Web Scraper and Fare Rules Engine (https://dtc.delhi.gov.in/)

Scrapes official Delhi Transport Corporation (DTC) timetables, service links,
and fare stages using requests and BeautifulSoup. Implements official distance-stage
fare calculation rules.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

DTC_SERVICES_URL = "https://dtc.delhi.gov.in/dtc/services-and-time-table"
DEFAULT_USER_AGENT = "Aaroh-Saarthi-TransitResearch/1.0 (+https://github.com/rajmaheshwari3001-dev/Codex-Test-Model)"

# Official DTC Fare Structure (Verified from DTC Gazette & Transport Department, GNCTD)
# Distance-based stages where 1 stage = ~2 km
DTC_FARE_SLABS = {
    "non_ac": [
        {"max_km": 4.0, "fare": 5.0, "label": "Up to 4 km (Stages 1-2)"},
        {"max_km": 8.0, "fare": 10.0, "label": "4 km to 8 km (Stages 3-4)"},
        {"max_km": 999.0, "fare": 15.0, "label": "Beyond 8 km (Stage 5+ capped)"},
    ],
    "ac": [
        {"max_km": 4.0, "fare": 10.0, "label": "Up to 4 km (Stages 1-2)"},
        {"max_km": 8.0, "fare": 15.0, "label": "4 km to 8 km (Stages 3-4)"},
        {"max_km": 12.0, "fare": 20.0, "label": "8 km to 12 km (Stages 5-6)"},
        {"max_km": 999.0, "fare": 25.0, "label": "Beyond 12 km (Capped max)"},
    ]
}


class DTCScraper:
    """Scrapes DTC timetables and fare documentation."""

    def __init__(self, services_url: str = DTC_SERVICES_URL):
        self.services_url = services_url
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        })

    def scrape_service_links(self) -> Dict[str, Any]:
        """
        Scrape public timetables, fare stage matrices, and circular links from DTC.
        """
        result: Dict[str, Any] = {
            "source_url": self.services_url,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "status_code": None,
            "page_title": "",
            "documents": [],
            "fare_rules": DTC_FARE_SLABS,
        }

        try:
            logger.info("Scraping DTC services at %s ...", self.services_url)
            resp = self.session.get(self.services_url, verify=False, timeout=15)
            result["status_code"] = resp.status_code
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")
            result["page_title"] = soup.title.get_text(strip=True) if soup.title else ""

            docs: List[Dict[str, str]] = []
            for a in soup.find_all("a"):
                text = a.get_text(strip=True)
                href = a.get("href")
                if not text or not href:
                    continue

                abs_url = urljoin(self.services_url, href)
                lower_text = text.lower()
                if any(k in lower_text for k in ["route", "fare", "fair", "time table", "stage", "express"]):
                    docs.append({
                        "title": text,
                        "url": abs_url,
                        "type": "excel" if abs_url.endswith((".xlsx", ".xls")) else "pdf" if abs_url.endswith(".pdf") else "link"
                    })

            result["documents"] = docs
            logger.info("Found %d relevant DTC timetable/fare documents.", len(docs))
            return result

        except Exception as e:
            logger.warning("Failed to scrape DTC website (%s); using verified offline fare rules fallback.", e)
            result["error"] = str(e)
            return result

    @staticmethod
    def calculate_bus_fare(distance_km: float, is_ac: bool = False, is_female_or_pass: bool = False) -> float:
        """
        Calculate verified official DTC bus fare based on travel distance.
        
        Args:
            distance_km: Distance traveled in kilometers.
            is_ac: True for Air Conditioned / Electric buses (Red/Blue); False for Standard Non-AC (Green/Orange).
            is_female_or_pass: True if eligible for Delhi free travel scheme (Pink Pass / Saheli card).
        
        Returns:
            Fare amount in INR.
        """
        if is_female_or_pass:
            return 0.0

        slabs = DTC_FARE_SLABS["ac"] if is_ac else DTC_FARE_SLABS["non_ac"]
        for slab in slabs:
            if distance_km <= slab["max_km"]:
                return slab["fare"]
        return slabs[-1]["fare"]
