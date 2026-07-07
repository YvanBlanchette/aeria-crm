#!/usr/bin/env python3
"""Scrape cruise-ship itineraries from cruisemapper.com.

Improvements over the original:
  * Structured into functions with a real main(); no network calls at import time.
  * A single requests.Session reuses TCP connections (much faster, more polite).
  * Retries/backoff are handled by urllib3's Retry, which honours Retry-After
    headers on 429/503 instead of hand-rolled sleeps.
  * Deduplicates as it writes, keyed on (cruise line, ship, date, port), so the
    output is clean without a separate pass. A --dedupe-existing flag can also
    clean a pre-existing messy file in place.
  * Resumable: already-scraped itineraries are skipped on restart.
  * Per-ship error isolation, request timeouts, and graceful Ctrl-C handling.
"""

import argparse
import csv
import json
import logging
import math
import os
import re
import sys
import time
from datetime import datetime, timedelta
from typing import Optional

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib.parse import urljoin
from urllib3.util.retry import Retry

BASE_DOMAIN = "https://www.cruisemapper.com"
LISTING_URL = f"{BASE_DOMAIN}/ships?page={{page}}"
SHIPS_PER_PAGE = 15
CSV_HEADER = ["Itinerary Id", "Cruise Line", "Ship Name", "Date",
              "Time", "Port", "Max Passengers", "Crew"]

# A current, realistic User-Agent (the original pinned Chrome 58 from 2017).
USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")


# --------------------------------------------------------------------------- #
# HTTP
# --------------------------------------------------------------------------- #
def build_session(max_retries: int, backoff: float) -> requests.Session:
    """A Session with connection pooling and automatic retry/backoff."""
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    retry = Retry(
        total=max_retries,
        connect=max_retries,
        read=max_retries,
        backoff_factor=backoff,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
        respect_retry_after_header=True,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def fetch(session: requests.Session, url: str, timeout: float,
          extra_headers: Optional[dict] = None) -> Optional[requests.Response]:
    """GET a URL, returning the Response on 200 or None on any failure."""
    try:
        response = session.get(url, headers=extra_headers, timeout=timeout)
    except requests.RequestException as exc:
        logging.warning("Request error for %s: %s", url, exc)
        return None
    if response.status_code == 200:
        return response
    logging.warning("Request failed for %s (status %s)", url, response.status_code)
    return None


# --------------------------------------------------------------------------- #
# Parsing
# --------------------------------------------------------------------------- #
def get_total_ships(session: requests.Session, timeout: float) -> int:
    """Read the total ship count from the first listing page."""
    response = fetch(session, LISTING_URL.format(page=1), timeout)
    if response is None:
        raise SystemExit("Could not fetch the ships listing page; aborting.")
    soup = BeautifulSoup(response.text, "html.parser")
    total_span = soup.find("span", class_="total")
    if total_span is None:
        raise SystemExit("Could not find the total ship count; site layout may have changed.")
    try:
        return int(total_span.text.split()[0].replace(",", ""))
    except (ValueError, IndexError):
        raise SystemExit(f"Could not parse total ship count from: {total_span.text!r}")


def parse_ship_stats(ship_soup: BeautifulSoup):
    """Extract (max_passengers, crew) from a ship's detail page."""
    max_passengers = ""
    crew = ""
    for row in ship_soup.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        label = cells[0].text.strip()
        numbers = re.findall(r"\d+", cells[1].text)  # handles "1,200", ranges, etc.
        if label == "Passengers":
            max_passengers = max(map(int, numbers)) if numbers else ""
        elif label == "Crew":
            crew = max(map(int, numbers)) if numbers else ""
    return max_passengers, crew


def parse_date_time(date_time_text: str, year: int):
    """Parse cruisemapper's date/time cell text into (dates, time_str, year).

    Left functionally identical to the original -- it is verified correct for
    every documented format and relies on falling through to the final regex.
    """
    date_time_regexes = [
        (r"(\d{1,2} \w{3}) (\d{2}:\d{2}) - (\d{2}:\d{2})", "%d %b %H:%M"),               # 26 Jul 07:00 - 17:00
        (r"(\d{1,2} \w{3} \d{2}:\d{2}) - (\d{1,2} \w{3} \d{2}:\d{2})", "%d %b %H:%M"),    # 30 Jul 14:30 - 31 Jul 17:00
        (r"(\d{1,2} \w{3}) (\d{2}:\d{2})", "%d %b %H:%M"),                               # 25 Jul 17:00
        (r"(\d{1,2} \w{3}) - (\d{1,2} \w{3})", "%d %b"),                                 # 27 Jul - 28 Jul
        (r"(\d{1,2} \w{3})", "%d %b"),                                                   # 21 Jul
    ]
    for regex, date_format in date_time_regexes:
        match = re.match(regex, date_time_text)
        if not match:
            continue
        date_str = match.group(1)
        try:
            start_date = datetime.strptime(f"{date_str} {year}", f"{date_format} %Y")
        except ValueError:
            try:
                start_date = datetime.strptime(f"{date_str} {year+1}", f"{date_format} %Y")
                year += 1
            except ValueError:
                continue

        end_date = start_date
        if match.lastindex >= 2:
            end_date_str = match.group(2)
            try:
                end_date = datetime.strptime(f"{end_date_str} {year}", f"{date_format} %Y")
            except ValueError:
                try:
                    end_date = datetime.strptime(f"{end_date_str} {year+1}", f"{date_format} %Y")
                    year += 1
                except ValueError:
                    continue

        date = start_date
        dates = []
        while date <= end_date:
            dates.append(date.strftime("%Y-%m-%d"))
            date += timedelta(days=1)

        time_str = ""
        time_match = re.search(r"(\d{2}:\d{2})(?:\s*-\s*(\d{2}:\d{2}))?", date_time_text)
        if time_match:
            time_str = (f"{time_match.group(1)} - {time_match.group(2)}"
                        if time_match.group(2) else time_match.group(1))
        return dates, time_str, year

    return [], "", year


# --------------------------------------------------------------------------- #
# CSV state / dedupe
# --------------------------------------------------------------------------- #
def row_key(row):
    """Dedupe key: (cruise line, ship, date, port)."""
    return (row[1], row[2], row[3], row[5])


def load_state(csv_path: str):
    """Return (processed_itineraries, seen_rows) from an existing CSV.

    processed_itineraries -> set of (itinerary_id, ship_name) already scraped.
    seen_rows             -> set of row_key()s already written (for dedupe).
    """
    processed_itineraries = set()
    seen_rows = set()
    if not os.path.isfile(csv_path) or os.stat(csv_path).st_size == 0:
        return processed_itineraries, seen_rows
    with open(csv_path, "r", newline="") as fh:
        reader = csv.reader(fh)
        try:
            next(reader)  # header
        except StopIteration:
            return processed_itineraries, seen_rows
        for row in reader:
            if len(row) < 6:
                continue
            processed_itineraries.add((row[0], row[2]))
            seen_rows.add(row_key(row))
    return processed_itineraries, seen_rows


def dedupe_file_in_place(csv_path: str) -> None:
    """Rewrite csv_path keeping only the first occurrence of each row_key()."""
    if not os.path.isfile(csv_path):
        logging.warning("%s not found; nothing to deduplicate.", csv_path)
        return
    with open(csv_path, "r", newline="") as fh:
        reader = csv.reader(fh)
        try:
            header = next(reader)
        except StopIteration:
            logging.warning("%s is empty; nothing to deduplicate.", csv_path)
            return
        seen, unique = set(), []
        for row in reader:
            key = row_key(row)
            if key in seen:
                continue
            seen.add(key)
            unique.append(row)
    with open(csv_path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(header)
        writer.writerows(unique)
    logging.info("Deduplicated %s -> %d unique rows.", csv_path, len(unique))


# --------------------------------------------------------------------------- #
# Scraping
# --------------------------------------------------------------------------- #
def clean_port(text: str) -> str:
    text = text.strip()
    for junk in ("Arriving in ", "Departing from ", " hotels"):
        text = text.replace(junk, "")
    return text.rstrip()


def scrape_itinerary(session, itinerary_id, ship_name, cruise_line, year,
                     max_passengers, crew, writer, seen_rows, args):
    """Fetch one itinerary's day-by-day rows and write the new/unique ones."""
    url = f"{BASE_DOMAIN}/ships/cruise.json?id={itinerary_id}"
    ajax_headers = {"X-Requested-With": "XMLHttpRequest"}
    time.sleep(args.delay_time)
    response = fetch(session, url, args.timeout, extra_headers=ajax_headers)
    if response is None:
        logging.warning("Skipping itinerary %s; could not fetch cruise data.", itinerary_id)
        return
    try:
        result_html = json.loads(response.text)["result"]
    except (ValueError, KeyError) as exc:
        logging.warning("Bad cruise JSON for itinerary %s: %s; skipping.", itinerary_id, exc)
        return

    soup = BeautifulSoup(result_html, "html.parser")
    date_times = soup.find_all("td", class_="date")
    ports = soup.find_all("td", class_="text")

    prev_date = None
    for date_cell, port_cell in zip(date_times, ports):
        dates, time_data, year = parse_date_time(date_cell.text, year)
        for date in dates:
            if prev_date:
                days_diff = (datetime.strptime(date, "%Y-%m-%d") - prev_date).days
                if days_diff < 0:  # year rolled over
                    year += 1
                    date = (datetime.strptime(date, "%Y-%m-%d")
                            .replace(year=year).strftime("%Y-%m-%d"))
                elif days_diff > 1:  # fill "At Sea" gaps
                    gap = prev_date + timedelta(days=1)
                    while gap < datetime.strptime(date, "%Y-%m-%d"):
                        write_unique(writer, seen_rows,
                                     [itinerary_id, cruise_line, ship_name,
                                      gap.strftime("%Y-%m-%d"), "", "At Sea",
                                      max_passengers, crew])
                        gap += timedelta(days=1)

            port_text = clean_port(port_cell.text)
            write_unique(writer, seen_rows,
                         [itinerary_id, cruise_line, ship_name, date,
                          time_data, port_text, max_passengers, crew])
            prev_date = datetime.strptime(date, "%Y-%m-%d")


def write_unique(writer, seen_rows, row) -> None:
    """Write a row only if its (line, ship, date, port) key is new."""
    key = row_key(row)
    if key in seen_rows:
        return
    seen_rows.add(key)
    writer.writerow(row)


def scrape_ship(session, ship_el, cruise_line_cache, writer,
                processed_itineraries, seen_rows, args) -> None:
    heading = ship_el.find("h3")
    anchor = ship_el.find("a", href=True)
    if heading is None or anchor is None:
        return
    ship_name = heading.text.strip()
    ship_url = urljoin(BASE_DOMAIN, anchor["href"])
    if "/ships/" not in ship_url:
        return

    logging.info("Scraping itinerary for ship: %s", ship_name)
    time.sleep(args.delay_time)
    response = fetch(session, ship_url, args.timeout)
    if response is None:
        logging.warning("Skipping ship %s; could not fetch its page.", ship_name)
        return

    soup = BeautifulSoup(response.text, "html.parser")
    max_passengers, crew = parse_ship_stats(soup)
    line_tag = soup.find("a", class_="shipCompanyLink")
    cruise_line = line_tag.text.strip() if line_tag else ""

    for row in soup.find_all("tr", {"data-row": True}):
        itinerary_id = row["data-row"]
        if (itinerary_id, ship_name) in processed_itineraries:
            logging.info("Itinerary %s for %s already processed; skipping.",
                         itinerary_id, ship_name)
            continue
        datetime_cell = row.find("td", class_="cruiseDatetime")
        if datetime_cell is None:
            logging.warning("No cruiseDatetime for itinerary %s; skipping.", itinerary_id)
            continue
        try:
            year = int(datetime_cell.text.split()[0])
        except (ValueError, IndexError):
            logging.warning("Could not parse year for itinerary %s; skipping.", itinerary_id)
            continue

        scrape_itinerary(session, itinerary_id, ship_name, cruise_line, year,
                         max_passengers, crew, writer, seen_rows, args)
        processed_itineraries.add((itinerary_id, ship_name))

    logging.info("Finished processing ship %s", ship_name)


def scrape(args) -> None:
    session = build_session(args.max_retries, args.backoff)
    total_ships = get_total_ships(session, args.timeout)
    end_page = args.end_page or math.ceil(total_ships / SHIPS_PER_PAGE)
    logging.info("Total ships: %d  ->  pages %d-%d", total_ships, args.start_page, end_page)

    processed_itineraries, seen_rows = load_state(args.output)
    if processed_itineraries:
        logging.info("Resuming: %d itineraries already in %s.",
                     len(processed_itineraries), args.output)

    new_file = not os.path.isfile(args.output) or os.stat(args.output).st_size == 0
    with open(args.output, "a", newline="") as fh:
        writer = csv.writer(fh)
        if new_file:
            writer.writerow(CSV_HEADER)

        for page in range(args.start_page, end_page + 1):
            url = LISTING_URL.format(page=page)
            logging.info("Fetching page %d/%d: %s", page, end_page, url)
            response = fetch(session, url, args.timeout)
            if response is None:
                logging.warning("Skipping page %d; could not fetch.", page)
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            for ship_el in soup.find_all("li", class_="col-sm-6"):
                try:
                    scrape_ship(session, ship_el, {}, writer,
                                processed_itineraries, seen_rows, args)
                except Exception as exc:  # isolate per-ship failures
                    logging.error("Error processing a ship: %s", exc)
                fh.flush()  # persist progress after each ship

            time.sleep(args.delay_time)
            logging.info("Finished page %d.", page)


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def parse_args(argv=None):
    p = argparse.ArgumentParser(description="Scrape cruise ship itineraries.")
    p.add_argument("--output", default="itineraries.csv", help="Output CSV path.")
    p.add_argument("--delay-time", type=float, default=0.7,
                   help="Seconds to sleep between requests (default: 0.7).")
    p.add_argument("--timeout", type=float, default=30.0,
                   help="Per-request timeout in seconds (default: 30).")
    p.add_argument("--max-retries", type=int, default=5,
                   help="Retries on network/5xx/429 errors (default: 5).")
    p.add_argument("--backoff", type=float, default=1.0,
                   help="Retry backoff factor in seconds (default: 1.0).")
    p.add_argument("--start-page", type=int, default=1, help="First listing page.")
    p.add_argument("--end-page", type=int, default=None,
                   help="Last listing page (default: computed from total ships).")
    p.add_argument("--dedupe-existing", action="store_true",
                   help="Deduplicate the output file in place, then exit.")
    p.add_argument("--log-file", default=None, help="Also write logs to this file.")
    return p.parse_args(argv)


def configure_logging(log_file):
    handlers = [logging.StreamHandler(sys.stdout)]
    if log_file:
        handlers.append(logging.FileHandler(log_file))
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )


def main(argv=None):
    args = parse_args(argv)
    configure_logging(args.log_file)

    if args.dedupe_existing:
        dedupe_file_in_place(args.output)
        return

    try:
        scrape(args)
    except KeyboardInterrupt:
        logging.info("Interrupted by user; progress up to the last ship is saved.")
    finally:
        logging.info("Script finished.")


if __name__ == "__main__":
    main()