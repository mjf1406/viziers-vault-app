#!/usr/bin/env python3
"""
Scrape D&D Beyond monsters listing (no detail-page navigation).

Outputs:
 - dndbeyond-monsters-urls.csv -> ID, NAME, URL
 - dndbeyond-monsters-data.csv -> NAME, CR, TYPE, SIZE, ALIGNMENT, HABITAT, SOURCE

Edit CONFIG and run. Requires: selenium, tqdm
"""
from __future__ import annotations

import csv
import os
import re
import sys
import time
import random
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
)
from tqdm import tqdm

# CONFIG
BASE_URL = "https://www.dndbeyond.com"
START_URL = BASE_URL + "/monsters"
OUTPUT_FILE_URLS = "stuff/data/dndbeyond-monsters-urls.csv"
OUTPUT_FILE_DATA = "stuff/data/dndbeyond-monsters-data.csv"
HEADLESS = True
DELAY_MIN = 0.8
DELAY_MAX = 1.8
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/121.0.0.0 Safari/537.36"
)
MAX_WAIT = 15
MAX_SCROLL_ROUNDS = 5


def make_driver(headless: bool = True, user_agent: Optional[str] = None):
    opts = Options()
    if headless:
        try:
            opts.add_argument("--headless=new")
        except Exception:
            opts.add_argument("--headless")
    opts.add_argument("--window-size=1200,900")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-background-networking")
    opts.add_argument("--disable-features=PushMessaging")
    opts.add_argument("--disable-notifications")
    opts.add_argument("--log-level=3")
    if user_agent:
        opts.add_argument(f"user-agent={user_agent}")
    opts.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
    opts.add_experimental_option("useAutomationExtension", False)

    service = Service(log_path=os.devnull)
    return webdriver.Chrome(service=service, options=opts)


def _clean(txt: str) -> str:
    return " ".join((txt or "").split()).strip()


def _format_elapsed(seconds: float) -> str:
    ms = int((seconds - int(seconds)) * 1000)
    total_seconds = int(seconds)
    mins = total_seconds // 60
    secs = total_seconds % 60
    return f"{mins:02d}:{secs:02d}:{ms:03d}"


# --- helpers to parse the listing elements ---------------------------------
def _parse_id_slug_from_el(el) -> Tuple[Optional[str], Optional[str]]:
    """Return (id, slug) using data-slug or anchor href."""
    try:
        ds = el.get_attribute("data-slug") or ""
        m = re.match(r"^\s*(\d+)-(.*)$", ds)
        if m:
            return m.group(1), m.group(2).strip()
    except Exception:
        pass
    try:
        a = el.find_element(By.CSS_SELECTOR, "a.link, a")
        href = a.get_attribute("href") or ""
        m = re.search(r"/monsters/(\d+)-([^/?#]+)", href)
        if m:
            return m.group(1), m.group(2)
    except Exception:
        pass
    return None, None


def _get_more_info_element(driver, id_: str, slug: str, info_el):
    """Try to find the inline more-info block for this row."""
    try:
        sel = f".more-info-monster-{id_}-{slug}"
        els = driver.find_elements(By.CSS_SELECTOR, sel)
        if els:
            return els[0]
    except Exception:
        pass
    try:
        sib = info_el.find_element(By.XPATH, "./following-sibling::div[contains(@class,'more-info-monster')][1]")
        return sib
    except Exception:
        pass
    # fallback: any following .more-info
    try:
        sib = info_el.find_element(By.XPATH, "./following-sibling::div[contains(@class,'more-info')][1]")
        return sib
    except Exception:
        pass
    return None


def _ensure_more_info_loaded(driver, info_el, id_: str, slug: str, wait: int = MAX_WAIT):
    """Click the row toggle if necessary and wait for more-info content (source)."""
    more = _get_more_info_element(driver, id_, slug, info_el)
    # If more exists and contains obvious content, return it
    if more:
        try:
            if more.find_elements(By.CSS_SELECTOR, ".more-info-footer-source, .ddb-blocked-content-body-text-main"):
                return more
        except StaleElementReferenceException:
            more = None

    # attempt to click the in-row toggle
    try:
        toggle = info_el.find_element(By.CSS_SELECTOR, ".row.monster-indicator .monster-color")
        try:
            toggle.click()
        except Exception:
            driver.execute_script("arguments[0].click();", toggle)
    except Exception:
        # fallback: click the row anchor
        try:
            name_anchor = info_el.find_element(By.CSS_SELECTOR, ".row.monster-name a.link")
            driver.execute_script("arguments[0].scrollIntoView(true);", name_anchor)
            try:
                name_anchor.click()
            except Exception:
                driver.execute_script("arguments[0].click();", name_anchor)
        except Exception:
            pass

    deadline = time.time() + wait
    while time.time() < deadline:
        more = _get_more_info_element(driver, id_, slug, info_el)
        if not more:
            time.sleep(0.15)
            continue
        try:
            if more.is_displayed():
                # check for likely source content
                if more.find_elements(By.CSS_SELECTOR, ".more-info-footer-source, .ddb-blocked-content-body-text-main"):
                    return more
                return more
        except StaleElementReferenceException:
            more = None
        time.sleep(0.15)
    return _get_more_info_element(driver, id_, slug, info_el)


def _extract_source_from_more(more) -> str:
    """Try to extract a human-friendly source string from the more-info block."""
    try:
        el = more.find_element(By.CSS_SELECTOR, ".more-info-footer-source")
        t = _clean(el.text)
        if t:
            return t
    except Exception:
        pass
    try:
        el = more.find_element(By.CSS_SELECTOR, ".ddb-blocked-content-body-text-main")
        t = _clean(el.text)
        if t:
            return t
    except Exception:
        pass
    return ""


def _parse_monster_row(driver, info_el) -> Dict[str, str]:
    """Extract requested monster fields from one .info element."""
    id_, slug = _parse_id_slug_from_el(info_el)
    url = urljoin(BASE_URL, f"/monsters/{id_}-{slug}") if id_ and slug else ""

    # NAME
    name = ""
    try:
        a = info_el.find_element(By.CSS_SELECTOR, ".row.monster-name a.link")
        name = _clean(a.text)
    except Exception:
        try:
            name = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-name .name").text)
        except Exception:
            name = ""

    # CR
    cr = ""
    try:
        cr = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-challenge span").text)
    except Exception:
        # sometimes challenge may be direct text
        try:
            cr = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-challenge").text)
        except Exception:
            cr = ""

    # TYPE + subtype (combine)
    mtype = ""
    try:
        t = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-type .type").text)
        st = ""
        try:
            st = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-type .subtype").text)
        except Exception:
            st = ""
        # subtype sometimes already contains parentheses; otherwise append
        if st:
            # if st starts with "(" or similar, attach directly
            if st.startswith("(") or st.startswith("—") or st.startswith("-"):
                mtype = f"{t} {st}".strip()
            else:
                mtype = f"{t} {st}".strip()
        else:
            mtype = t
    except Exception:
        mtype = ""

    # SIZE
    size = ""
    try:
        size = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-size span").text)
    except Exception:
        size = ""

    # ALIGNMENT
    alignment = ""
    try:
        alignment = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-alignment span").text)
    except Exception:
        alignment = ""

    # HABITAT (monster-environment)
    habitat = ""
    try:
        # prefer title attribute (when truncated with tip)
        span = info_el.find_element(By.CSS_SELECTOR, ".row.monster-environment span")
        title = span.get_attribute("title") or ""
        text = _clean(span.text)
        habitat = title.strip() if title.strip() else text
    except Exception:
        habitat = ""

    # SOURCE: prefer .row.monster-name .source; fallback to inline more-info
    source = ""
    try:
        source = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.monster-name .source").text)
    except Exception:
        source = ""

    if not source and id_:
        # attempt to open inline "more-info" block and read source
        try:
            more = _ensure_more_info_loaded(driver, info_el, id_, slug)
            if more:
                src = _extract_source_from_more(more)
                if src:
                    source = src
        except Exception:
            pass

    return {
        "ID": id_ or "",
        "NAME": name,
        "CR": cr,
        "TYPE": mtype,
        "SIZE": size,
        "ALIGNMENT": alignment,
        "HABITAT": habitat,
        "SOURCE": source,
        "URL": url,
    }


# --- main scraping loop ---------------------------------------------------
def collect_monsters(driver, start_time: float) -> Tuple[List[Dict[str, str]], int]:
    """Collect all monster rows across paginated listing. Returns (rows, pages)."""
    rows: List[Dict[str, str]] = []
    seen_ids = set()
    pages_processed = 0

    WebDriverWait(driver, MAX_WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".listing, .listing-rpgmonster"))
    )

    # detect total pages
    total_pages = None
    try:
        pag_els = driver.find_elements(By.CSS_SELECTOR, "ul.b-pagination-list a, .b-pagination a")
        nums = []
        for e in pag_els:
            txt = (e.text or "").strip()
            if txt.isdigit():
                nums.append(int(txt))
                continue
            href = e.get_attribute("href") or ""
            m = re.search(r"[?&]page=(\d+)", href)
            if m:
                nums.append(int(m.group(1)))
        if nums:
            total_pages = max(nums)
    except Exception:
        total_pages = None

    sel_candidates = [
        "ul.listing-rpgmonster .info",
        "ul.listing .info",
        ".listing-body .listing .info",
        "div.info[data-slug]",
    ]

    outer = tqdm(total=total_pages, ncols=86, unit="page", leave=True)
    page = 1
    while True:
        pages_processed += 1
        elapsed = _format_elapsed(time.perf_counter() - start_time)
        total_str = str(total_pages) if total_pages else "?"
        outer.set_description(f"{elapsed}  Page {page}/{total_str}")

        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

        info_els = []
        for s in sel_candidates:
            try:
                info_els = driver.find_elements(By.CSS_SELECTOR, s)
            except Exception:
                info_els = []
            if info_els:
                break

        items_total = len(info_els)
        inner = tqdm(total=items_total, ncols=86, leave=False, unit="item") if items_total > 0 else None

        new_here = 0
        for info_el in info_els:
            try:
                item = _parse_monster_row(driver, info_el)
            except StaleElementReferenceException:
                if inner:
                    inner.update(1)
                continue
            if not item["ID"]:
                if inner:
                    inner.update(1)
                continue
            if item["ID"] in seen_ids:
                if inner:
                    inner.update(1)
                continue
            seen_ids.add(item["ID"])
            rows.append(item)
            new_here += 1
            if inner:
                inner.update(1)

        if inner:
            inner.close()
        outer.update(1)

        print(f"{elapsed}  Page {page}/{total_str}: {items_total} items, {new_here} new, total {len(rows)}")

        # snapshot before navigation
        prev_url = driver.current_url
        prev_count = items_total
        prev_first = None
        if info_els:
            try:
                prev_first = info_els[0].get_attribute("data-slug")
            except Exception:
                prev_first = None

        # attempt to click 'Next'
        clicked = False
        try:
            next_sel = (
                "ul.b-pagination-list a[rel='next'], .b-pagination a[rel='next'], "
                ".b-pagination .b-pagination-item-next a, a[data-next-page]"
            )
            el = driver.find_element(By.CSS_SELECTOR, next_sel)
            aria = (el.get_attribute("aria-disabled") or "").lower()
            cls = (el.get_attribute("class") or "").lower()
            href = el.get_attribute("href") or ""
            if aria != "true" and "disabled" not in cls:
                try:
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
                    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX) / 2)
                    el.click()
                except Exception:
                    if href:
                        driver.get(urljoin(driver.current_url, href))
                clicked = True
        except NoSuchElementException:
            clicked = False
        except Exception:
            clicked = False

        if clicked:
            start_wait = time.time()
            while time.time() - start_wait < MAX_WAIT:
                time.sleep(0.5)
                if driver.current_url != prev_url:
                    break
                # re-find listing items and compare first slug / count
                new_info = []
                for s in sel_candidates:
                    try:
                        new_info = driver.find_elements(By.CSS_SELECTOR, s)
                    except Exception:
                        new_info = []
                    if new_info:
                        break
                if not new_info:
                    continue
                try:
                    new_first = new_info[0].get_attribute("data-slug")
                except Exception:
                    new_first = None
                if prev_first and new_first and new_first != prev_first:
                    break
                if len(new_info) != prev_count:
                    break
            page += 1
            continue

        # infinite-scroll fallback
        scrolled = False
        for _ in range(MAX_SCROLL_ROUNDS):
            old_count = items_total
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
            try:
                new_info = driver.find_elements(By.CSS_SELECTOR, sel_candidates[0])
            except Exception:
                new_info = []
            if len(new_info) > old_count:
                scrolled = True
                break
        if scrolled:
            page += 1
            continue

        print("No 'Next' control and no additional items loaded. Finished.")
        break

    outer.close()
    return rows, pages_processed


# --- CSV output ------------------------------------------------------------
def save_urls(rows: List[Dict[str, str]], filename: str):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ID", "NAME", "URL"])
        for r in rows:
            w.writerow([r.get("ID", ""), r.get("NAME", ""), r.get("URL", "")])


def save_data(rows: List[Dict[str, str]], filename: str):
    header = ["NAME", "CR", "TYPE", "SIZE", "ALIGNMENT", "HABITAT", "SOURCE"]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow([r.get("NAME", ""), r.get("CR", ""), r.get("TYPE", ""),
                        r.get("SIZE", ""), r.get("ALIGNMENT", ""), r.get("HABITAT", ""),
                        r.get("SOURCE", "")])


# --- main ------------------------------------------------------------------
def main():
    start = time.perf_counter()
    driver = make_driver(headless=HEADLESS, user_agent=USER_AGENT)
    try:
        driver.get(START_URL)
        rows, pages = collect_monsters(driver, start)
    finally:
        try:
            driver.quit()
        except Exception:
            pass

    if not rows:
        print("No monsters collected.")
        sys.exit(1)

    save_urls(rows, OUTPUT_FILE_URLS)
    save_data(rows, OUTPUT_FILE_DATA)

    elapsed = _format_elapsed(time.perf_counter() - start)
    print(f"\n{elapsed} -- {pages} pages, {len(rows)} items")
    print(f"Saved: {OUTPUT_FILE_URLS}, {OUTPUT_FILE_DATA}")


if __name__ == "__main__":
    main()