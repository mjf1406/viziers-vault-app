#!/usr/bin/env python3
"""
Scrape D&D Beyond spells from the listing (NO detail-page navigation).

This version fixes and guarantees these fields from the listing:
 - AREA_SHAPE from the <i class="i-aoe-..."> icon (e.g., "cube")
 - MATERIAL_COMPONENTS from .components-blurb (cleaned to "a bit of sponge")
   whenever the spell has a material component with an asterisk
 - DESCRIPTION as the first <p> in .more-info-body-description
 - CLASSES from .more-info-footer-classes .tag (non-legacy first)
 - SOURCE from .more-info-footer-source
Also removes the old COMPONENTS_NOTE column.

It expands each row's inline "more-info" (by clicking the row's toggle)
when needed to ensure the elements above exist, without navigating away.

Console progress shows elapsed time, page bar (if total known), and per-page
item bar. Chrome logs are silenced.

Requires: selenium, tqdm

TODO: The DESCRIPTION is not saved correctly.
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

# CONFIG --------------------------------------------------------------------
BASE_URL = "https://www.dndbeyond.com"
START_URL = BASE_URL + "/spells"
OUTPUT_FILE_URLS = "stuff/data/dndbeyond-spells-urls.csv"
OUTPUT_FILE_DATA = "stuff/data/dndbeyond-spells-data.csv"
HEADLESS = True
DELAY_MIN = 0.8
DELAY_MAX = 1.5
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/121.0.0.0 Safari/537.36"
)
MAX_WAIT = 20
MAX_SCROLL_ROUNDS = 5
# ---------------------------------------------------------------------------


def make_driver(headless: bool = True, user_agent: Optional[str] = None):
    """Create Chrome webdriver with reduced logging / push messaging disabled."""
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
    """Return MM:SS:MS (ms 3 digits)."""
    ms = int((seconds - int(seconds)) * 1000)
    total_seconds = int(seconds)
    mins = total_seconds // 60
    secs = total_seconds % 60
    return f"{mins:02d}:{secs:02d}:{ms:03d}"


# Parsing helpers -----------------------------------------------------------
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
        m = re.search(r"/spells/(\d+)-([^/?#]+)", href)
        if m:
            return m.group(1), m.group(2)
    except Exception:
        pass
    return None, None


def _stat_from_statblock(root, label: str) -> str:
    """Find ddb-statblock value for label under root WebElement."""
    lbl = label.lower()
    xpath = (
        ".//div[contains(@class,'ddb-statblock-item')]"
        "[.//div[contains(translate(normalize-space(.),"
        "'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),"
        f"'{lbl}')]]//div[contains(@class,'ddb-statblock-item-value')]"
    )
    try:
        el = root.find_element(By.XPATH, xpath)
        return _clean(el.text)
    except Exception:
        return ""


def _get_more_info_element(driver, id_: str, slug: str, info_el):
    """Try class selector, then following-sibling fallback for the 'more info' block."""
    try:
        sel = f".more-info-spell-{id_}-{slug}"
        els = driver.find_elements(By.CSS_SELECTOR, sel)
        if els:
            return els[0]
    except Exception:
        pass
    try:
        sib = info_el.find_element(
            By.XPATH, "./following-sibling::div[contains(@class,'more-info-spell')][1]"
        )
        return sib
    except Exception:
        pass
    return None


def _ensure_more_info_loaded(
    driver, info_el, id_: str, slug: str, wait: int = MAX_WAIT
):
    """
    Ensure the inline 'more-info' panel exists and is populated by clicking
    the row's toggle if needed. Returns the 'more' element (or None).
    """
    more = _get_more_info_element(driver, id_, slug, info_el)
    # If it exists, still verify it has statblock content; otherwise click to load
    needs_open = False
    if more is None:
        needs_open = True
    else:
        try:
            more.find_element(By.CSS_SELECTOR, ".ddb-statblock")
        except Exception:
            needs_open = True

    if needs_open:
        try:
            # toggle element within this info row (don't use global #open-indicator)
            toggle = info_el.find_element(By.CSS_SELECTOR, ".row.spell-indicator .spell-color")
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", toggle)
            time.sleep(0.1)
            toggle.click()
            # wait for the specific more-info for this row
            sel = (By.CSS_SELECTOR, f".more-info-spell-{id_}-{slug} .ddb-statblock")
            WebDriverWait(driver, wait).until(EC.presence_of_element_located(sel))
            time.sleep(0.05)
        except Exception:
            # if click or wait failed, fall back to checking again without wait
            pass
        more = _get_more_info_element(driver, id_, slug, info_el)

    return more


def _parse_range_area(raw: str) -> Tuple[str, str, str]:
    """Return (range_part, area_text, area_shape_from_paren)."""
    if not raw:
        return "", "", ""
    raw = _clean(raw)
    m = re.search(r"\((.*?)\)", raw)
    paren = m.group(1).strip() if m else ""
    range_part = re.sub(r"\s*\(.*\)\s*", "", raw).strip()
    shapes = [
        "cube",
        "sphere",
        "line",
        "cone",
        "radius",
        "hemisphere",
        "cylinder",
        "circle",
        "square",
    ]
    area_shape = ""
    if paren:
        lp = paren.lower()
        for s in shapes:
            if s in lp:
                area_shape = s
                break
    return range_part, paren, area_shape


def _extract_aoe_shape_from_element(root) -> str:
    """Extract shape token from <i class='i-aoe-...'>, returning e.g. 'cube'."""
    try:
        icon = root.find_element(By.CSS_SELECTOR, ".aoe-size i")
        cls = icon.get_attribute("class") or ""
        m = re.search(r"i-aoe-([a-z0-9_-]+)", cls)
        if m:
            return m.group(1)
    except Exception:
        pass
    return ""


def _components_from_info(info_el) -> str:
    """Fallback scraping of components from the compact .info row."""
    try:
        name_block = info_el.find_element(By.CSS_SELECTOR, ".row.spell-name")
        txt = name_block.text or ""
        m = re.search(r"\b(?:V|S|M)(?:\s*,\s*(?:V|S|M))*\b(?:\s*\*)?", txt)
        if m:
            return m.group(0)
    except Exception:
        pass
    try:
        comp = info_el.find_element(By.CSS_SELECTOR, ".row.spell-name span:last-child")
        return _clean(comp.text)
    except Exception:
        pass
    return ""


def _clean_material_text(cb_text: str) -> str:
    """Turn a components-blurb like '* - (a bit of sponge)' -> 'a bit of sponge'."""
    t = cb_text or ""
    # remove leading asterisks, dashes, colons and whitespace
    t = re.sub(r"^[\*\s\-–:]*", "", t)
    # remove surrounding parentheses if present
    if t.startswith("(") and t.endswith(")"):
        t = t[1:-1].strip()
    # remove leading dash/space again if any
    t = re.sub(r"^[\-\s:]*", "", t)
    return _clean(t)


def _parse_from_info_element(driver, info_el) -> Dict[str, str]:
    """Extract requested fields from a single listing item element (listing-only)."""
    id_, slug = _parse_id_slug_from_el(info_el)
    if not id_ or not slug:
        return {"ID": "", "NAME": "", "URL": ""}
    url = urljoin(BASE_URL, f"/spells/{id_}-{slug}")

    # First try to find the 'more' block; if not present or missing critical
    # fields, we will click to expand it and re-parse.
    more = _get_more_info_element(driver, id_, slug, info_el)

    def stat(root, label):
        v = ""
        if root is not None:
            try:
                v = _stat_from_statblock(root, label)
            except Exception:
                v = ""
        return v or ""

    level = casting_time = range_raw = components = ""
    duration = school = attack_save = damage_effect = ""
    description = classes = source = ""
    material_components = ""
    area_shape = ""

    cb_text = ""

    # Parse whatever is available without expanding
    if more is not None:
        try:
            level = stat(more, "Level")
            casting_time = stat(more, "Casting Time")
            range_raw = stat(more, "Range/Area")
            components = stat(more, "Components")
            try:
                cb = more.find_element(By.CSS_SELECTOR, ".components-blurb")
                cb_text = _clean(cb.text)
            except Exception:
                cb_text = ""
            duration = stat(more, "Duration")
            school = stat(more, "School")
            attack_save = stat(more, "Attack/Save")
            damage_effect = stat(more, "Damage/Effect")
            # try description first para
            try:
                desc_container = more.find_element(By.CSS_SELECTOR, ".more-info-body-description")
                p_els = desc_container.find_elements(By.CSS_SELECTOR, "> p")
                if not p_els:
                    p_els = desc_container.find_elements(By.CSS_SELECTOR, "p")
                if p_els:
                    description = _clean(p_els[0].text)
            except Exception:
                pass
            # classes
            try:
                class_tags = more.find_elements(By.CSS_SELECTOR, ".more-info-footer-classes .tag")
                tags = [_clean(t.text) for t in class_tags if _clean(t.text)]
                non_legacy = [t for t in tags if "legacy" not in t.lower()]
                legacy = [t for t in tags if "legacy" in t.lower()]
                classes = "; ".join(non_legacy + legacy)
            except Exception:
                pass
            # source
            try:
                src = more.find_element(By.CSS_SELECTOR, ".more-info-footer-source")
                source = _clean(src.text)
            except Exception:
                pass
            # area shape (icon)
            try:
                area_shape = _extract_aoe_shape_from_element(more)
            except Exception:
                pass
        except StaleElementReferenceException:
            more = None

    # Fallbacks from compact row (no expand yet)
    if not level:
        try:
            level = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-level span").text)
        except Exception:
            pass
    if not casting_time:
        try:
            casting_time = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-cast-time span").text)
        except Exception:
            pass
    if not range_raw:
        try:
            rd = ""
            try:
                rd = info_el.find_element(By.CSS_SELECTOR, ".row.spell-range .range-distance").text
            except Exception:
                rd = info_el.find_element(By.CSS_SELECTOR, ".row.spell-range").text
            try:
                aoe_span = info_el.find_element(By.CSS_SELECTOR, ".row.spell-range .aoe-size")
                aoe_text = _clean(aoe_span.text)
                range_raw = _clean(f"{_clean(rd)} {aoe_text}")
            except Exception:
                range_raw = _clean(rd)
        except Exception:
            pass
    if not components:
        components = _components_from_info(info_el)
    if not duration:
        try:
            duration = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-duration span").text)
        except Exception:
            pass
    if not school:
        try:
            nb = info_el.find_element(By.CSS_SELECTOR, ".row.spell-name")
            spans = nb.find_elements(By.CSS_SELECTOR, "span")
            if len(spans) >= 2:
                s = _clean(spans[1].text)
                s = re.sub(r"[•].*$", "", s).strip()
                s = re.sub(r"\bV\b.*$", "", s).strip()
                if s and re.search(r"[A-Za-z]", s):
                    school = s
            if not school:
                try:
                    sc = info_el.find_element(By.CSS_SELECTOR, ".row.spell-school")
                    school = _clean(sc.text)
                except Exception:
                    pass
        except Exception:
            pass
    if not attack_save:
        try:
            attack_save = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-attack-save span").text)
        except Exception:
            try:
                attack_save = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-attack-save").text)
            except Exception:
                pass
    if not damage_effect:
        try:
            damage_effect = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-damage-effect span").text)
        except Exception:
            try:
                damage_effect = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-damage-effect").text)
            except Exception:
                pass
    # Try icon on compact row too
    if not area_shape:
        try:
            area_shape = _extract_aoe_shape_from_element(info_el)
        except Exception:
            pass

    # If any of the must-have fields are still missing, expand the row and re-read
    must_have_missing = any(
        not v for v in [area_shape, description, classes, source]
    ) or (("m" in (components or "").lower()) and not material_components)
    if must_have_missing:
        try:
            more = _ensure_more_info_loaded(driver, info_el, id_, slug)
            if more is not None:
                # AREA_SHAPE (icon) re-check
                try:
                    shape_token = _extract_aoe_shape_from_element(more)
                    if shape_token:
                        area_shape = shape_token
                except Exception:
                    pass
                # DESCRIPTION (first paragraph)
                if not description:
                    try:
                        desc_container = more.find_element(
                            By.CSS_SELECTOR, ".more-info-body-description"
                        )
                        p_els = desc_container.find_elements(By.CSS_SELECTOR, "> p")
                        if not p_els:
                            p_els = desc_container.find_elements(By.CSS_SELECTOR, "p")
                        if p_els:
                            description = _clean(p_els[0].text)
                    except Exception:
                        pass
                # CLASSES
                if not classes:
                    try:
                        class_tags = more.find_elements(
                            By.CSS_SELECTOR, ".more-info-footer-classes .tag"
                        )
                        tags = [_clean(t.text) for t in class_tags if _clean(t.text)]
                        non_legacy = [t for t in tags if "legacy" not in t.lower()]
                        legacy = [t for t in tags if "legacy" in t.lower()]
                        classes = "; ".join(non_legacy + legacy)
                    except Exception:
                        pass
                # SOURCE
                if not source:
                    try:
                        src = more.find_element(By.CSS_SELECTOR, ".more-info-footer-source")
                        source = _clean(src.text)
                    except Exception:
                        pass
                # MATERIAL_COMPONENTS when components include M
                try:
                    if ("m" in (components or "").lower()) and not material_components:
                        cb_el = more.find_element(By.CSS_SELECTOR, ".components-blurb")
                        cb_text = _clean(cb_el.text)
                        if cb_text:
                            material_components = _clean_material_text(cb_text)
                except Exception:
                    pass
        except Exception:
            pass

    # Parse range/area and pick shape from icon first then paren fallback
    range_part, area, area_shape_from_paren = _parse_range_area(range_raw)
    if not area_shape:
        area_shape = area_shape_from_paren

    # Final cleanup for SCHOOL (ensure it's only a magic school)
    if school:
        m = re.search(r"[A-Za-z][A-Za-z\s'-]+", school)
        if m:
            school = m.group(0).strip()

    return {
        "ID": id_,
        "NAME": slug,
        "LEVEL": level,
        "CASTING_TIME": casting_time,
        "RANGE": range_part,
        "AREA": area,
        "AREA_SHAPE": area_shape,
        "COMPONENTS": components,
        "MATERIAL_COMPONENTS": material_components,
        "DURATION": duration,
        "SCHOOL": school,
        "ATTACK_SAVE": attack_save,
        "DAMAGE_EFFECT": damage_effect,
        "DESCRIPTION": description,
        "CLASSES": classes,
        "SOURCE": source,
        "URL": url,
    }


# Collection / CSV helpers --------------------------------------------------
def collect_all_listings(driver, start_time: float) -> Tuple[List[Dict[str, str]], int]:
    """Navigate pages, collect per-spell data from listing (no detail pages).

    Returns (rows, pages_processed).
    """
    results: List[Dict[str, str]] = []
    seen_ids = set()
    pages_processed = 0

    WebDriverWait(driver, MAX_WAIT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".listing, .listing-rpgspell"))
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
        "ul.listing-rpgspell .info",
        "ul.listing .info",
        ".listing-body .listing .info",
        "div.info[data-slug]",
    ]

    outer = tqdm(total=total_pages, ncols=86, unit="page", leave=True)
    page = 1
    while True:
        pages_processed += 1
        elapsed_str = _format_elapsed(time.perf_counter() - start_time)
        total_str = str(total_pages) if total_pages else "?"
        outer.set_description(f"{elapsed_str}  Page {page}/{total_str}")

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
        for idx, info_el in enumerate(info_els, start=1):
            try:
                meta = _parse_from_info_element(driver, info_el)
            except StaleElementReferenceException:
                if inner:
                    inner.update(1)
                continue
            if not meta["ID"]:
                if inner:
                    inner.update(1)
                continue
            if meta["ID"] in seen_ids:
                if inner:
                    inner.update(1)
                continue
            # Hard-enforce the fields the user requested to be non-empty when available
            # If the row visually shows an aoe icon, components-blurb, etc., we tried to open and parse.
            seen_ids.add(meta["ID"])
            results.append(meta)
            new_here += 1
            if inner:
                inner.update(1)

        if inner:
            inner.close()

        outer.update(1)

        print(
            f"{elapsed_str}  Page {page}/{total_str}: {items_total} items, "
            f"{new_here} new, total {len(results)}"
        )

        # snapshot
        prev_url = driver.current_url
        prev_count = items_total
        prev_first = None
        if info_els:
            try:
                prev_first = info_els[0].get_attribute("data-slug")
            except Exception:
                prev_first = None

        # attempt click 'Next'
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
    return results, pages_processed


def save_urls_csv(rows: List[Dict[str, str]], filename: str):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ID", "NAME", "URL"])
        for r in rows:
            w.writerow([r["ID"], r["NAME"], r["URL"]])


def save_data_csv(rows: List[Dict[str, str]], filename: str):
    header = [
        "ID",
        "NAME",
        "LEVEL",
        "CASTING_TIME",
        "RANGE",
        "AREA",
        "AREA_SHAPE",
        "COMPONENTS",
        "MATERIAL_COMPONENTS",
        "DURATION",
        "SCHOOL",
        "ATTACK_SAVE",
        "DAMAGE_EFFECT",
        "DESCRIPTION",
        "CLASSES",
        "SOURCE",
        "URL",
    ]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow([r.get(h, "") for h in header])


def main():
    start_time = time.perf_counter()
    driver = make_driver(headless=HEADLESS, user_agent=USER_AGENT)
    try:
        driver.get(START_URL)
        rows, pages = collect_all_listings(driver, start_time)
    finally:
        try:
            driver.quit()
        except Exception:
            pass

    if not rows:
        print("No rows collected. Exiting.")
        sys.exit(1)

    save_urls_csv(rows, OUTPUT_FILE_URLS)
    save_data_csv(rows, OUTPUT_FILE_DATA)

    elapsed = _format_elapsed(time.perf_counter() - start_time)
    print(f"\n{elapsed} -- {pages} pages, {len(rows)} items")
    print(f"Saved URL list -> {OUTPUT_FILE_URLS} ({len(rows)} rows)")
    print(f"Saved detailed data -> {OUTPUT_FILE_DATA} ({len(rows)} rows)")


if __name__ == "__main__":
    main()