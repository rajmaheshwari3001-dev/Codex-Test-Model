"""
Delhi Transport Stack Connector (Primary Source: https://delhi.transportstack.in/)

Interacts with the official Delhi Transport Stack REST backend
(https://dts-backend.transportstack.in/) to discover, inspect, and download
structured GTFS feeds for Delhi Buses (DTC/DoT) and Delhi Metro (DMRC).
"""

from __future__ import annotations

import os
import json
import logging
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

DTS_BASE_URL = "https://dts-backend.transportstack.in"
DEFAULT_USER_AGENT = "Aaroh-Saarthi-TransitResearch/1.0 (+https://github.com/rajmaheshwari3001-dev/Codex-Test-Model)"


class TransportStackClient:
    """Client for Delhi Transport Stack dataset APIs and GTFS downloads."""

    def __init__(self, base_url: str = DTS_BASE_URL, raw_dir: Optional[Path] = None):
        self.base_url = base_url.rstrip("/")
        self.raw_dir = raw_dir or (Path(__file__).resolve().parent.parent.parent / "data" / "raw")
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "application/json, application/octet-stream, */*",
        })

    def get_dataset_catalog(self) -> Dict[str, Any]:
        """Fetch all public datasets cataloged on Delhi Transport Stack."""
        url = f"{self.base_url}/api/dataset/list?size=50"
        try:
            resp = self.session.get(url, verify=False, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            logger.info("Successfully fetched %d datasets from Delhi Transport Stack catalog.", len(data.get("content", [])))
            return data
        except Exception as e:
            logger.warning("Failed to fetch DTS catalog (%s); returning empty catalog fallback.", e)
            return {"content": []}

    def get_dataset_detail(self, dataset_id: int) -> Dict[str, Any]:
        """Fetch metadata and download links for a specific dataset ID (1=Bus, 2=Metro)."""
        url = f"{self.base_url}/api/dataset/detail?id={dataset_id}"
        try:
            resp = self.session.get(url, verify=False, timeout=15)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning("Failed to fetch dataset %d detail: %s", dataset_id, e)
            return {}

    def download_dataset(self, dataset_id: int, target_name: str) -> Optional[Path]:
        """
        Download and extract a dataset ZIP package from Delhi Transport Stack.
        
        Args:
            dataset_id: 1 for Delhi Buses, 2 for Delhi Metro.
            target_name: Destination directory name under raw_dir.
            
        Returns:
            Path to extracted directory or None on failure.
        """
        detail = self.get_dataset_detail(dataset_id)
        docs_by_type = detail.get("documentsByType", {})
        dataset_files = docs_by_type.get("DATASET_FILE", [])

        if not dataset_files:
            logger.warning("No downloadable file entries found in dataset %d detail.", dataset_id)
            # Check if local fallback already exists
            extract_dir = self.raw_dir / target_name
            if extract_dir.exists():
                return extract_dir
            return None

        file_info = dataset_files[0]
        download_rel_url = file_info.get("url")
        file_key = file_info.get("fileKey", f"dataset_{dataset_id}.zip")

        if not download_rel_url:
            logger.warning("Missing relative URL in file entry for dataset %d.", dataset_id)
            return None

        full_download_url = f"{self.base_url}{download_rel_url}"
        zip_path = self.raw_dir / f"{target_name}.zip"
        extract_dir = self.raw_dir / target_name

        try:
            logger.info("Downloading dataset %d from %s ...", dataset_id, full_download_url)
            resp = self.session.get(full_download_url, verify=False, timeout=30, stream=True)
            resp.raise_for_status()

            with open(zip_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            logger.info("Saved %d bytes to %s. Extracting...", zip_path.stat().st_size, zip_path)
            extract_dir.mkdir(parents=True, exist_ok=True)

            with zipfile.ZipFile(zip_path, "r") as zf:
                zf.extractall(extract_dir)

            logger.info("Extracted %s successfully.", target_name)
            return extract_dir

        except Exception as e:
            logger.error("Error downloading dataset %d: %s", dataset_id, e)
            if extract_dir.exists():
                logger.info("Using previously extracted files at %s.", extract_dir)
                return extract_dir
            return None

    def fetch_all_transit_feeds(self) -> Dict[str, Any]:
        """
        Download and unpack both Delhi Bus and Delhi Metro GTFS feeds.
        Returns provenance and extraction status.
        """
        bus_path = self.download_dataset(1, "delhi_buses_gtfs")
        metro_path = self.download_dataset(2, "delhi_metro_gtfs")

        return {
            "source": "Delhi Transport Stack (https://delhi.transportstack.in/)",
            "retrieval_timestamp": datetime.now(timezone.utc).isoformat(),
            "buses_gtfs_path": str(bus_path) if bus_path else None,
            "metro_gtfs_path": str(metro_path) if metro_path else None,
            "buses_available": bus_path is not None and bus_path.exists(),
            "metro_available": metro_path is not None and metro_path.exists(),
        }

