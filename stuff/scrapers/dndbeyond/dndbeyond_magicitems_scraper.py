#!/usr/bin/env python3
"""
Scrape D&D Beyond magic items listing (no detail-page navigation).

Outputs:
 - dndbeyond-magicitems-urls.csv -> ID, NAME, URL
 - dndbeyond-magicitems-data.csv -> ID, NAME, RARITY, TYPE, ATTUNEMENT, NOTES, SOURCE, URL

Fields to populate from the listing/inline "more-info" block:
 - name        -> .row.item-name a.link (anchor text)
 - rarity      -> .row.item-name .rarity
 - type        -> .row.item-type .type
 - attunement  -> .row.requires-attunement span ("Required" or empty)
 - notes       -> .row.notes span
 - source      -> .more-info-footer-source OR .ddb-blocked-content-body-text-main
               (we expand the inline "more-info" panel when needed)

Usage: edit CONFIG if needed and run. Requires: selenium, tqdm
"""

from __future__ import annotations

import csv
import os
import random
import re
import sys
import time
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
)
from tqdm import tqdm

# CONFIG
BASE_URL = "https://www.dndbeyond.com"
START_URL = BASE_URL + "/magic-items"
OUTPUT_FILE_URLS = "stuff/data/dndbeyond-magicitems-urls.csv"
OUTPUT_FILE_DATA = "stuff/data/dndbeyond-magicitems-data.csv"
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


# --- parsing helpers ------------------------------------------------------
def _parse_id_slug_from_el(el) -> Tuple[Optional[str], Optional[str]]:
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
        m = re.search(r"/magic-items/(\d+)-([^/?#]+)", href)
        if m:
            return m.group(1), m.group(2)
    except Exception:
        pass
    return None, None


def _get_more_info_element(driver, id_: str, slug: str, info_el):
    # try by specific class
    try:
        sel = f".more-info-magic-item-{id_}-{slug}"
        els = driver.find_elements(By.CSS_SELECTOR, sel)
        if els:
            return els[0]
    except Exception:
        pass
    # fallback: immediate following sibling .more-info that looks like magic-item
    try:
        sib = info_el.find_element(By.XPATH, "./following-sibling::div[contains(@class,'more-info-magic-item')][1]")
        return sib
    except Exception:
        pass
    # general fallback: any sibling .more-info-magic-item
    try:
        next_more = info_el.find_element(By.XPATH, "./following-sibling::div[contains(@class,'more-info')][1]")
        return next_more
    except Exception:
        pass
    return None


def _ensure_more_info_loaded(driver, info_el, id_: str, slug: str, wait: int = MAX_WAIT):
    """
    Ensure inline more-info for this row is present and has usable content.
    Toggle open if needed. Returns the more-info element or None.
    """
    more = _get_more_info_element(driver, id_, slug, info_el)
    try:
        if more and more.is_displayed():
            # quick check: has any of the indicators we need (.more-info-footer-source
            # or .ddb-blocked-content-body-text-main or .more-info-body-description)
            try:
                if more.find_element(By.CSS_SELECTOR, ".more-info-footer-source"):
                    return more
            except Exception:
                pass
            try:
                if more.find_element(By.CSS_SELECTOR, ".ddb-blocked-content-body-text-main"):
                    return more
            except Exception:
                pass
            try:
                if more.find_element(By.CSS_SELECTOR, ".more-info-body-description"):
                    return more
            except Exception:
                pass
    except StaleElementReferenceException:
        more = None

    # If not displayed or not containing content, click the toggle in the row
    try:
        toggle = info_el.find_element(By.CSS_SELECTOR, ".row.item-indicator .item-color")
        try:
            toggle.click()
        except Exception:
            driver.execute_script("arguments[0].click();", toggle)
    except Exception:
        # no toggle found; try alternative: click the name anchor
        try:
            name_anchor = info_el.find_element(By.CSS_SELECTOR, ".row.item-name a.link")
            driver.execute_script("arguments[0].scrollIntoView(true);", name_anchor)
            try:
                name_anchor.click()
            except Exception:
                driver.execute_script("arguments[0].click();", name_anchor)
        except Exception:
            pass

    # wait until more-info is visible and contains at least some content
    deadline = time.time() + wait
    while time.time() < deadline:
        more = _get_more_info_element(driver, id_, slug, info_el)
        if not more:
            time.sleep(0.15)
            continue
        try:
            if more.is_displayed():
                # check for content
                try:
                    if more.find_element(By.CSS_SELECTOR, ".more-info-footer-source"):
                        return more
                except Exception:
                    pass
                try:
                    if more.find_element(By.CSS_SELECTOR, ".ddb-blocked-content-body-text-main"):
                        return more
                except Exception:
                    pass
                try:
                    if more.find_element(By.CSS_SELECTOR, ".more-info-body-description"):
                        return more
                except Exception:
                    pass
                # if displayed but none of those specific selectors, still return it
                return more
        except StaleElementReferenceException:
            more = None
        time.sleep(0.15)
    # final attempt: return whatever we can find
    more = _get_more_info_element(driver, id_, slug, info_el)
    return more


def _extract_source_from_more(more) -> str:
    # Prefer .more-info-footer-source
    try:
        el = more.find_element(By.CSS_SELECTOR, ".more-info-footer-source")
        text = _clean(el.text)
        if text:
            return text
    except Exception:
        pass
    # blocked content's book hint
    try:
        el = more.find_element(By.CSS_SELECTOR, ".ddb-blocked-content-body-text-main")
        text = _clean(el.text)
        if text:
            return text
    except Exception:
        pass
    # sometimes there is a description upper block that includes source-like text
    try:
        el = more.find_element(By.CSS_SELECTOR, ".more-info-body-description-upper")
        txt = _clean(el.text)
        # often this contains "Armor (any medium or heavy, except hide armor), uncommon"
        # not a source -- ignore unless it looks like a book name (contains colon or named book words)
        if txt and (":" in txt or "Guide" in txt or "Compendium" in txt or "Player" in txt or "Tasha" in txt or "Dungeon" in txt):
            return txt
    except Exception:
        pass
    return ""


def _parse_item_from_info(driver, info_el) -> Dict[str, str]:
    """
    Extract fields:
    - ID, NAME, RARITY, TYPE, ATTUNEMENT, NOTES, SOURCE, URL
    """
    id_, slug = _parse_id_slug_from_el(info_el)
    if not id_:
        id_ = ""
    url = urljoin(BASE_URL, f"/magic-items/{id_}-{slug}") if id_ and slug else ""

    # NAME
    name = ""
    try:
        a = info_el.find_element(By.CSS_SELECTOR, ".row.item-name a.link")
        name = _clean(a.text)
    except Exception:
        try:
            name = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.item-name .name").text)
        except Exception:
            name = ""

    # RARITY
    rarity = ""
    try:
        rarity = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.item-name .rarity").text)
    except Exception:
        # sometimes rarity is a class on the inner span
        try:
            inner_span = info_el.find_element(By.CSS_SELECTOR, ".row.item-name a.link span")
            rarity = ""
            # find sibling .rarity first; if not, infer from span class (very-rare, rare)
            try:
                rarity_el = info_el.find_element(By.CSS_SELECTOR, ".row.item-name .rarity")
                rarity = _clean(rarity_el.text)
            except Exception:
                cls = inner_span.get_attribute("class") or ""
                if "very-rare" in cls:
                    rarity = "Very Rare"
                elif "rare" in cls and "very" not in cls:
                    rarity = "Rare"
                elif "uncommon" in cls:
                    rarity = "Uncommon"
                elif "artifact" in cls:
                    rarity = "Artifact"
                elif "varies" in cls:
                    rarity = "Varies"
        except Exception:
            rarity = ""

    # TYPE
    itype = ""
    try:
        itype = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.item-type .type").text)
    except Exception:
        itype = ""

    # ATTUNEMENT
    attunement = ""
    try:
        att = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.requires-attunement span").text)
        # treat "——" or em-dash markers as empty
        if att and not re.match(r"^[-–—]+$", att):
            attunement = att
        else:
            attunement = ""
    except Exception:
        attunement = ""

    # NOTES
    notes = ""
    try:
        notes = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.notes span").text)
    except Exception:
        notes = ""

    # SOURCE: may require opening the inline more-info
    source = ""
    # detect if more-info associated exists and contains source; expand if necessary
    if id_:
        more = _get_more_info_element(driver, id_, slug, info_el)
        # if more not present or lacks source, attempt to open/ensure loaded
        need_expand = True
        if more:
            try:
                if more.find_elements(By.CSS_SELECTOR, ".more-info-footer-source, .ddb-blocked-content-body-text-main"):
                    need_expand = False
            except Exception:
                need_expand = True
        if need_expand:
            more = _ensure_more_info_loaded(driver, info_el, id_, slug)
        if more:
            source = _extract_source_from_more(more)

    # return row
    return {
        "ID": id_,
        "NAME": name,
        "RARITY": rarity,
        "TYPE": itype,
        "ATTUNEMENT": attunement,
        "NOTES": notes,
        "SOURCE": source,
        "URL": url,
    }


# --- main collection / CSV -------------------------------------------------
def collect_magic_items(driver, start_time: float) -> Tuple[List[Dict[str, str]], int]:
    rows: List[Dict[str, str]] = []
    seen_ids = set()
    pages_processed = 0

    WebDriverWait(driver, MAX_WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".listing, .listing-rpgmagic-item"))
    )

    # detect total pages
    total_pages = None
    try:
        pag_els = driver.find_elements(By.CSS_SELECTOR, "ul.b-pagination-list a, .b-pagination a")
        nums = []
        for e in pag_els:
            txt = (e.text or "").strip()
            if txt.isdigit():
                nums.append(int(txt)); continue
            href = e.get_attribute("href") or ""
            m = re.search(r"[?&]page=(\d+)", href)
            if m:
                nums.append(int(m.group(1)))
        if nums:
            total_pages = max(nums)
    except Exception:
        total_pages = None

    sel_candidates = [
        "ul.listing-rpgmagic-item .info",
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
        inner = None
        if items_total > 0:
            inner = tqdm(total=items_total, ncols=86, leave=False, unit="item")

        new_here = 0
        for info_el in info_els:
            try:
                row = _parse_item_from_info(driver, info_el)
            except StaleElementReferenceException:
                if inner:
                    inner.update(1)
                continue
            if not row["ID"]:
                if inner:
                    inner.update(1)
                continue
            if row["ID"] in seen_ids:
                if inner:
                    inner.update(1)
                continue
            seen_ids.add(row["ID"])
            rows.append(row)
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

        # find and click "Next"
        clicked = False
        try:
            next_sel = ("ul.b-pagination-list a[rel='next'], .b-pagination a[rel='next'], "
                        ".b-pagination .b-pagination-item-next a, a[data-next-page]")
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

        # infinite scroll fallback
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


def save_urls(rows: List[Dict[str, str]], filename: str):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ID", "NAME", "URL"])
        for r in rows:
            w.writerow([r.get("ID", ""), r.get("NAME", ""), r.get("URL", "")])


def save_data(rows: List[Dict[str, str]], filename: str):
    header = ["ID", "NAME", "RARITY", "TYPE", "ATTUNEMENT", "NOTES", "SOURCE", "URL"]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow([r.get(h, "") for h in header])


def main():
    start = time.perf_counter()
    driver = make_driver(headless=HEADLESS, user_agent=USER_AGENT)
    try:
        driver.get(START_URL)
        rows, pages = collect_magic_items(driver, start)
    finally:
        try:
            driver.quit()
        except Exception:
            pass

    if not rows:
        print("No items found. Exiting.")
        sys.exit(1)

    save_urls(rows, OUTPUT_FILE_URLS)
    save_data(rows, OUTPUT_FILE_DATA)

    elapsed = _format_elapsed(time.perf_counter() - start)
    print(f"\n{elapsed} -- {pages} pages, {len(rows)} items")
    print(f"Saved: {OUTPUT_FILE_URLS} and {OUTPUT_FILE_DATA}")


if __name__ == "__main__":
    main()