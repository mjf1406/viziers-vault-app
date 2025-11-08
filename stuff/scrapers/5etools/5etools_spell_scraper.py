#!/usr/bin/env python3
"""
Scrape D&D Beyond spells from the listing (NO detail-page navigation) and
augment with SOURCE_SHORT from 5e.tools/spells.html.

This version:
 - Extracts AREA_SHAPE from the <i class="i-aoe-..."> icon (e.g., "cube")
 - Extracts MATERIAL_COMPONENTS from .components-blurb (cleaned to
   "a bit of sponge") whenever the spell has a material component
   with an asterisk
 - Extracts exact visible NAME from DDB listing (not from slug)
 - Moves the previous slug value to SLUG
 - Removes DESCRIPTION (was previously the first <p> in
   .more-info-body-description)
 - Extracts CLASSES from .more-info-footer-classes .tag (non-legacy
   first), and converts it to a JSON string array in the CSV
 - Extracts SOURCE from .more-info-footer-source
 - Adds SOURCE_SHORT by scraping 5e.tools/spells.html:
   - Iterate every item in the div with id="list"
   - Click each list item (the row is clickable)
   - Read URL and parse the fragment (hash) after the underscore as
     source short (first encountered per name)
   - Join back to DDB rows by normalized NAME (lowercase,
     non-alphanumerics removed)

It expands each row's inline "more-info" (by clicking the row's toggle) when
needed to ensure the elements above exist, without navigating away.

Console progress shows elapsed time, page bar (if total known), and per-page
item bar. Chrome logs are silenced.

Requires: selenium, tqdm

Testing/Speed knobs:
 - Set TEST_LIMIT_SPELLS = 10 to only scrape 10 DDB spells and limit 5e.tools
 - Set SCRAPE_ALL_5ETOOLS = False to only click 5e.tools rows until all DDB
   names (within the limit) are matched (faster when testing)
"""
from __future__ import annotations

import csv
import json
import os
import random
import re
import sys
import time
from typing import Dict, List, Optional, Tuple, Set
from urllib.parse import urljoin, urlsplit

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
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeElapsedColumn, MofNCompleteColumn
from rich.console import Console
from rich.live import Live
from rich.table import Table
from rich.panel import Panel

# CONFIG --------------------------------------------------------------------
BASE_URL = "https://www.dndbeyond.com"
START_URL = BASE_URL + "/spells"
FIVEETOOLS_URL = "https://5e.tools/spells.html"

OUTPUT_FILE_URLS = "stuff/data/5etools/spells-urls.csv"
OUTPUT_FILE_DATA = "stuff/data/5etools/spells-data.csv"

HEADLESS = True
DELAY_MIN = 0.05
DELAY_MAX = 0.20
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/121.0.0.0 Safari/537.36"
)
MAX_WAIT = 20
MAX_SCROLL_ROUNDS = 5
PER_ITEM_DELAY = 0.01  # Minimal delay between items on same page (fast)
PER_PAGE_DELAY_MIN = 2.0  # Longer delay between pages (respectful)
PER_PAGE_DELAY_MAX = 4.0
TOGGLE_WAIT = 5  # Reduced from MAX_WAIT for toggle clicks

FIVEETOOLS_MAX_WAIT = 20  # For initial page load
FIVEETOOLS_ROW_WAIT = 3   # For individual row clicks (much shorter)

# Testing/Speed controls
# If > 0, stop after collecting this many DDB spells (and limit 5e.tools)
TEST_LIMIT_SPELLS = 0  # e.g., set to 10 for a quick run; 0 or None for all
# When False, only click 5e.tools rows until all DDB names are matched
SCRAPE_ALL_5ETOOLS = True
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
    # Lightweight page load
    opts.add_argument("--blink-settings=imagesEnabled=false")
    opts.add_experimental_option(
        "prefs",
        {
            "profile.managed_default_content_settings.images": 2,
            "profile.managed_default_content_settings.fonts": 2,
        },
    )
    # Faster initial page load
    try:
        opts.page_load_strategy = "eager"
    except Exception:
        pass

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
    opts.add_experimental_option(
        "excludeSwitches", ["enable-automation", "enable-logging"]
    )
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


def _norm_name(name: str) -> str:
    """Normalize a name for joining: lowercase and strip non-alphanumerics."""
    return re.sub(r"[^a-z0-9]+", "", (name or "").lower())


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
            By.XPATH,
            "./following-sibling::div[contains(@class,'more-info-spell')][1]",
        )
        return sib
    except Exception:
        pass
    return None


def _ensure_more_info_loaded(
    driver, info_el, id_: str, slug: str, wait: int = TOGGLE_WAIT
):
    """
    Ensure the inline 'more-info' panel exists and is populated by clicking
    the row's toggle if needed. Returns the 'more' element (or None).
    """
    more = _get_more_info_element(driver, id_, slug, info_el)
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
            # Toggle element within this info row
            toggle = info_el.find_element(
                By.CSS_SELECTOR, ".row.spell-indicator .spell-color"
            )
            driver.execute_script(
                "arguments[0].scrollIntoView({block:'center'});", toggle
            )
            time.sleep(0.1)
            toggle.click()
            # wait for the specific more-info for this row
            sel = (
                By.CSS_SELECTOR,
                f".more-info-spell-{id_}-{slug} .ddb-statblock",
            )
            WebDriverWait(driver, wait).until(
                EC.presence_of_element_located(sel)
            )
            time.sleep(0.05)
        except Exception:
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
    classes = source = ""
    material_components = ""
    area_shape = ""
    name_text = ""
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
            # classes
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

    # Extract visible name (exact), prefer anchor within name row
    if not name_text:
        try:
            nb = info_el.find_element(By.CSS_SELECTOR, ".row.spell-name")
            try:
                a = nb.find_element(By.CSS_SELECTOR, "a.link, a")
                name_text = _clean(a.text)
            except Exception:
                # Fallback: text before any "•"
                t = _clean(nb.text)
                name_text = _clean(t.split("•")[0])
        except Exception:
            name_text = ""
    if not name_text and more is not None:
        try:
            hd = more.find_element(By.CSS_SELECTOR, "h1,h2,h3,.heading")
            name_text = _clean(hd.text)
        except Exception:
            pass
    if not name_text:
        # Absolute last fallback: derive from slug (not preferred)
        name_text = _clean(slug.replace("-", " ").replace("_", " ")).title()

    # Fallbacks from compact row (no expand yet)
    if not level:
        try:
            level = _clean(info_el.find_element(By.CSS_SELECTOR, ".row.spell-level span").text)
        except Exception:
            pass
    if not casting_time:
        try:
            casting_time = _clean(
                info_el.find_element(By.CSS_SELECTOR, ".row.spell-cast-time span").text
            )
        except Exception:
            pass
    if not range_raw:
        try:
            rd = ""
            try:
                rd = info_el.find_element(
                    By.CSS_SELECTOR, ".row.spell-range .range-distance"
                ).text
            except Exception:
                rd = info_el.find_element(By.CSS_SELECTOR, ".row.spell-range").text
            try:
                aoe_span = info_el.find_element(
                    By.CSS_SELECTOR, ".row.spell-range .aoe-size"
                )
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
            duration = _clean(
                info_el.find_element(By.CSS_SELECTOR, ".row.spell-duration span").text
            )
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
            attack_save = _clean(
                info_el.find_element(By.CSS_SELECTOR, ".row.spell-attack-save span").text
            )
        except Exception:
            try:
                attack_save = _clean(
                    info_el.find_element(By.CSS_SELECTOR, ".row.spell-attack-save").text
                )
            except Exception:
                pass
    if not damage_effect:
        try:
            damage_effect = _clean(
                info_el.find_element(
                    By.CSS_SELECTOR, ".row.spell-damage-effect span"
                ).text
            )
        except Exception:
            try:
                damage_effect = _clean(
                    info_el.find_element(By.CSS_SELECTOR, ".row.spell-damage-effect").text
                )
            except Exception:
                pass
    # Try icon on compact row too
    if not area_shape:
        try:
            area_shape = _extract_aoe_shape_from_element(info_el)
        except Exception:
            pass

    must_have_missing = any(not v for v in [area_shape, classes, source]) or (
        ("m" in (components or "").lower()) and not material_components
    )
    if must_have_missing:
        try:
            more = _ensure_more_info_loaded(driver, info_el, id_, slug)
            if more is not None:
                try:
                    shape_token = _extract_aoe_shape_from_element(more)
                    if shape_token:
                        area_shape = shape_token
                except Exception:
                    pass
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
                if not source:
                    try:
                        src = more.find_element(
                            By.CSS_SELECTOR, ".more-info-footer-source"
                        )
                        source = _clean(src.text)
                    except Exception:
                        pass
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

    range_part, area, area_shape_from_paren = _parse_range_area(range_raw)
    if not area_shape:
        area_shape = area_shape_from_paren

    if school:
        m = re.search(r"[A-Za-z][A-Za-z\s'-]+", school)
        if m:
            school = m.group(0).strip()

    return {
        "ID": id_,
        "NAME": name_text,
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
        "CLASSES": classes,
        "SOURCE": source,
        "URL": url,
        "SLUG": slug,
    }


# Collection / CSV helpers --------------------------------------------------
def collect_all_listings(
    driver, start_time: float, limit: Optional[int] = None
) -> Tuple[List[Dict[str, str]], int]:
    """Navigate pages, collect per-spell data from listing (no detail pages).

    Returns (rows, pages_processed).
    """
    console = Console()
    results: List[Dict[str, str]] = []
    seen_ids = set()
    pages_processed = 0

    WebDriverWait(driver, MAX_WAIT).until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, ".listing, .listing-rpgspell")
        )
    )

    # detect total pages
    total_pages = None
    try:
        pag_els = driver.find_elements(
            By.CSS_SELECTOR, "ul.b-pagination-list a, .b-pagination a"
        )
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

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        TextColumn("•"),
        TimeElapsedColumn(),
        console=console,
        transient=False,
    ) as progress:
        
        page_task = progress.add_task(
            "[cyan]D&D Beyond Pages",
            total=total_pages if total_pages else None
        )
        item_task = None  # Will be created per-page
        
        page = 1
        while True:
            pages_processed += 1
            elapsed_str = _format_elapsed(time.perf_counter() - start_time)
            total_str = str(total_pages) if total_pages else "?"
            
            progress.update(
                page_task,
                description=f"[cyan]DDB Page {page}/{total_str} | Total spells: {len(results)}",
                completed=page
            )

            info_els = []
            for s in sel_candidates:
                try:
                    info_els = driver.find_elements(By.CSS_SELECTOR, s)
                except Exception:
                    info_els = []
                if info_els:
                    break

            items_total = len(info_els)
            
            # Create per-page item task
            if item_task is not None:
                progress.remove_task(item_task)
            
            if items_total > 0:
                item_task = progress.add_task(
                    f"[yellow]  → Page {page} items",
                    total=items_total
                )

            stop_all = False
            new_here = 0
            current_spell_name = ""
            
            for idx, info_el in enumerate(info_els, start=1):
                try:
                    meta = _parse_from_info_element(driver, info_el)
                    current_spell_name = meta.get("NAME", "")[:30]
                    time.sleep(PER_ITEM_DELAY)  # Minimal delay between items
                except StaleElementReferenceException:
                    if item_task is not None:
                        progress.update(item_task, advance=1)
                    continue
                
                if not meta["ID"]:
                    if item_task is not None:
                        progress.update(item_task, advance=1)
                    continue
                
                if meta["ID"] in seen_ids:
                    if item_task is not None:
                        progress.update(item_task, advance=1)
                    continue
                
                seen_ids.add(meta["ID"])
                results.append(meta)
                new_here += 1
                
                if item_task is not None:
                    progress.update(
                        item_task,
                        advance=1,
                        description=f"[yellow]  → Page {page} items | New: {new_here} | Current: {current_spell_name}"
                    )
                
                # test/limit early exit
                if limit and len(results) >= limit:
                    stop_all = True
                    break

            if item_task is not None:
                progress.remove_task(item_task)
                item_task = None

            if stop_all:
                progress.update(
                    page_task,
                    description=f"[green]Reached limit ({limit} spells) | Total: {len(results)}"
                )
                console.print(f"[yellow]Reached TEST_LIMIT_SPELLS; stopping DDB pagination.")
                break

            console.print(
                f"[dim]{elapsed_str}[/dim]  "
                f"Page {page}/{total_str}: {items_total} items, "
                f"{new_here} new, total [bold]{len(results)}[/bold]"
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
                        driver.execute_script(
                            "arguments[0].scrollIntoView({block:'center'});", el
                        )
                        time.sleep(0.1)  # Quick pause before click
                        el.click()
                        # Longer delay after clicking to be respectful
                        time.sleep(random.uniform(PER_PAGE_DELAY_MIN, PER_PAGE_DELAY_MAX))
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

            progress.update(
                page_task,
                description=f"[green]Complete! Scraped {len(results)} spells from {pages_processed} pages"
            )
            console.print("[green]No 'Next' control and no additional items loaded. Finished.")
            break

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
        "NAME_LOWER",
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
        "CLASSES",
        "SOURCE",
        "URL",
        "SOURCE_SHORT",
        "SLUG",
    ]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        for r in rows:
            w.writerow([r.get(h, "") for h in header])

def _ensure_parent_dir(path: str):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

def _dismiss_5etools_overlays(driver):
    """Best-effort close of any modal/toast overlays which can block clicks."""
    selectors = [
        ".veapp__spc-announcements .veapp__btn-close",
        ".ui-modal__wrp button",
        ".ui-modal__wrp .ve-btn",
        ".ui-toast__wrp .btn-close",
        ".ui-toast__wrp button",
    ]
    for sel in selectors:
        try:
            for el in driver.find_elements(By.CSS_SELECTOR, sel):
                try:
                    driver.execute_script(
                        "arguments[0].scrollIntoView({block:'center'});", el
                    )
                except Exception:
                    pass
                try:
                    el.click()
                except Exception:
                    try:
                        driver.execute_script("arguments[0].click();", el)
                    except Exception:
                        pass
        except Exception:
            pass


def collect_5e_tools_sources(
    driver,
    names_filter: Optional[Set[str]] = None,
    limit: Optional[int] = None,
) -> Dict[str, str]:
    """
    Visit 5e.tools/spells.html, iterate all rows in #list, click each,
    read the URL hash, and extract the source code after the underscore.
    Returns mapping from normalized name -> first seen SOURCE_SHORT.
    """
    console = Console()
    mapping: Dict[str, str] = {}
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=False,
    ) as progress:
        
        load_task = progress.add_task("[cyan]Loading 5e.tools/spells.html...", total=None)
        
        driver.get(FIVEETOOLS_URL)

        # CHECK: Print current URL to verify we're not redirected/blocked
        time.sleep(2)
        actual_url = driver.current_url
        console.print(f"[dim]Loaded URL: {actual_url}[/dim]")
        if "5e.tools" not in actual_url:
            console.print(f"[red]Warning: Redirected away from 5e.tools to {actual_url}[/red]")
            return mapping

        # Ensure page ready and list container exists
        try:
            WebDriverWait(driver, FIVEETOOLS_MAX_WAIT).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            WebDriverWait(driver, FIVEETOOLS_MAX_WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "#list"))
            )
            progress.update(load_task, description="[green]Page loaded, dismissing overlays...")
        except TimeoutException:
            progress.update(load_task, description="[red]Timeout loading page")
            console.print("[yellow]Warning: 5e.tools did not load fully within timeout (stage: base).")
            return mapping

        _dismiss_5etools_overlays(driver)

        row_selectors = [
            "#list .lst__row",
            "#list .lst__row-inner",
            "#list [class*='lst__row']",
            "#list [data-list-row]",
            "#list .lst__wrp-cells",
        ]

        def _find_rows_local(drv):
            for sel in row_selectors:
                try:
                    els = drv.find_elements(By.CSS_SELECTOR, sel)
                except Exception:
                    els = []
                if els:
                    return els, sel
            return [], None

        # Try up to FIVEETOOLS_MAX_WAIT seconds to get rows; scroll to trigger lazy load.
        def _wait_rows_with_scroll(timeout: int) -> bool:
            progress.update(load_task, description=f"[cyan]Searching for spell rows (timeout: {timeout}s)...")
            t_end = time.time() + timeout
            last_len = -1
            stagnation = 0
            attempts = 0
            while time.time() < t_end:
                attempts += 1
                rows, selector_used = _find_rows_local(driver)
                # if rows:
                    # console.print(f"[cyan]Found {len(rows)} rows using selector: {selector_used}[/cyan]")
                    # console.print(f"[cyan]First row HTML: {rows[0].get_attribute('outerHTML')[:200]}[/cyan]")
                if rows:
                    progress.update(load_task, description=f"[green]Found {len(rows)} rows after {attempts} attempts")
                    return True
                # Try to scroll the list container; if not found, page scroll
                try:
                    list_container = driver.find_element(By.CSS_SELECTOR, "#list")
                    driver.execute_script(
                        "arguments[0].scrollTop = arguments[0].scrollHeight;",
                        list_container,
                    )
                except Exception:
                    try:
                        driver.execute_script(
                            "window.scrollTo(0, document.body.scrollHeight);"
                        )
                    except Exception:
                        pass
                time.sleep(0.5)
                # check if DOM is changing at all
                try:
                    cur_len = driver.execute_script(
                        "return document.querySelector('#list')?.children?.length || 0"
                    )
                    if cur_len == last_len:
                        stagnation += 1
                    else:
                        stagnation = 0
                        progress.update(load_task, description=f"[cyan]Loading rows... (found {cur_len} elements)")
                    last_len = cur_len
                except Exception:
                    pass
                if stagnation > 5:
                    break
            progress.update(load_task, description="[red]No rows found after scrolling")
            return False

        got_rows = _wait_rows_with_scroll(FIVEETOOLS_MAX_WAIT)
        if not got_rows:
            # Try one refresh+retry
            progress.update(load_task, description="[yellow]Refreshing and retrying...")
            try:
                driver.refresh()
                WebDriverWait(driver, FIVEETOOLS_MAX_WAIT).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
                WebDriverWait(driver, FIVEETOOLS_MAX_WAIT).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "#list"))
                )
                _dismiss_5etools_overlays(driver)
                got_rows = _wait_rows_with_scroll(FIVEETOOLS_MAX_WAIT // 2)
            except Exception:
                got_rows = False

        if not got_rows:
            progress.update(load_task, description="[red]Failed to find rows", completed=True)
            console.print("[yellow]Warning: 5e.tools rows not found after retries; continuing without sources.")
            return mapping

        # Get the rows in the proper scope
        rows, selector_used = _find_rows_local(driver)
        if not rows:
            progress.update(load_task, description="[red]No rows in scope", completed=True)
            console.print("[yellow]Warning: Rows check passed but no rows found. Continuing without sources.")
            return mapping
        
        progress.update(load_task, description="[green]Setup complete", completed=True)
        progress.remove_task(load_task)
        
        # Start main extraction with proper progress bar
        total_rows = len(rows)
        target_names = len(names_filter) if names_filter else total_rows
        
        extract_task = progress.add_task(
            f"[cyan]Extracting sources (target: {target_names} names)...",
            total=limit if limit else total_rows
        )
        
        seen_indexes = set()
        stagnation_rounds = 0
        last_count = 0
        clicks_done = 0
        consecutive_failures = 0
        MAX_CONSECUTIVE_FAILURES = 10

        while True:
            rows, selector_used = _find_rows_local(driver)
            # if rows:
            #     console.print(f"[cyan]Found {len(rows)} rows using selector: {selector_used}[/cyan]")
            #     console.print(f"[cyan]First row HTML: {rows[0].get_attribute('outerHTML')[:200]}[/cyan]")
            if not rows:
                progress.update(extract_task, description="[green]All rows processed")
                break

            for idx in range(len(rows)):
                if idx in seen_indexes:
                    continue

                # Re-acquire rows to avoid stale references
                rows, selector_used = _find_rows_local(driver)
                # if rows:
                #     console.print(f"[cyan]Found {len(rows)} rows using selector: {selector_used}[/cyan]")
                #     console.print(f"[cyan]First row HTML: {rows[0].get_attribute('outerHTML')[:200]}[/cyan]")
                if idx >= len(rows):
                    continue

                # Early-exit if we've satisfied filter or hit limit
                if names_filter:
                    missing = {k for k in names_filter if not mapping.get(k)}
                    if not missing:
                        progress.update(
                            extract_task,
                            description=f"[green]All {target_names} names matched!",
                            completed=clicks_done
                        )
                        return mapping
                if limit and clicks_done >= limit:
                    progress.update(
                        extract_task,
                        description=f"[yellow]Limit reached ({limit})",
                        completed=clicks_done
                    )
                    return mapping

                row = rows[idx]

                try:
                    # Find the <a> tag inside the row
                    try:
                        link = row.find_element(By.CSS_SELECTOR, "a.lst__row-inner, a")
                    except:
                        link = row
                    
                    driver.execute_script(
                        "arguments[0].scrollIntoView({block:'center'});", link
                    )
                    time.sleep(0.05)
                    prev_url = driver.current_url
                    prev_hash = urlsplit(prev_url).fragment
                    
                    # Click the link element
                    try:
                        driver.execute_script("arguments[0].click();", link)
                    except Exception:
                        try:
                            link.click()
                        except Exception:
                            pass

                    # Wait for URL hash to update and name header to render
                    def _hash_changed(d):
                        h = urlsplit(d.current_url).fragment
                        return bool(h) and h != prev_hash

                    try:
                        WebDriverWait(driver, FIVEETOOLS_ROW_WAIT).until(_hash_changed)
                    except TimeoutException:
                        # If hash didn't change, skip to next row
                        seen_indexes.add(idx)
                        continue

                    try:
                        WebDriverWait(driver, MAX_WAIT).until(
                            EC.presence_of_element_located(
                                (By.CSS_SELECTOR, "h1.stats__h-name")
                            )
                        )
                    except TimeoutException:
                        pass

                    # Extract name and source_short
                    try:
                        name_el = driver.find_element(
                            By.CSS_SELECTOR, "h1.stats__h-name"
                        )
                        name = _clean(name_el.text)
                    except Exception:
                        name = ""

                    cur_url = driver.current_url
                    frag = urlsplit(cur_url).fragment or ""
                    # drop anything after ',' or '&'
                    main_part = re.split(r"[,&]", frag)[0]
                    source_short = ""
                    if "_" in main_part:
                        try:
                            source_short = main_part.rsplit("_", 1)[1].lower()
                        except Exception:
                            source_short = ""

                    if name and source_short is not None:
                        key = _norm_name(name)
                        # Only set first-seen source
                        if key not in mapping:
                            # If filtering, only store matches
                            if names_filter is None or key in names_filter:
                                mapping[key] = source_short

                    seen_indexes.add(idx)
                    clicks_done += 1
                    
                    # Update progress
                    matched = len(mapping)
                    progress.update(
                        extract_task,
                        completed=clicks_done,
                        description=f"[cyan]Clicks: {clicks_done} | Matched: {matched}/{target_names} | Current: {name[:30]}"
                    )
                    
                except StaleElementReferenceException:
                    continue

            # Post-iteration early-exit checks
            if names_filter:
                missing = {k for k in names_filter if not mapping.get(k)}
                if not missing:
                    progress.update(
                        extract_task,
                        description=f"[green]Complete! Matched all {target_names} names",
                        completed=clicks_done
                    )
                    break
            if limit and clicks_done >= limit:
                progress.update(
                    extract_task,
                    description=f"[yellow]Limit reached: {limit} clicks",
                    completed=clicks_done
                )
                break

            # Try to scroll the list container to reveal more rows
            rows_now, _ = _find_rows_local(driver)
            count_now = len(rows_now)
            if count_now == last_count:
                stagnation_rounds += 1
            else:
                stagnation_rounds = 0
            last_count = count_now

            if stagnation_rounds >= MAX_SCROLL_ROUNDS:
                progress.update(
                    extract_task,
                    description=f"[yellow]Stagnated after {clicks_done} clicks, {len(mapping)} matched",
                    completed=clicks_done
                )
                break

            try:
                list_container = driver.find_element(By.CSS_SELECTOR, "#list")
                driver.execute_script(
                    "arguments[0].scrollTop = arguments[0].scrollHeight;", list_container
                )
            except Exception:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    return mapping


def main():
    console = Console()
    start_time = time.perf_counter()
    
    console.print(Panel.fit(
        "[bold cyan]D&D Beyond + 5e.tools Spell Scraper[/bold cyan]\n"
        f"[dim]Limit: {TEST_LIMIT_SPELLS if TEST_LIMIT_SPELLS else 'All spells'}[/dim]",
        border_style="cyan"
    ))
    
    driver = make_driver(headless=HEADLESS, user_agent=USER_AGENT)
    try:
        # Collect DDB spells
        console.print("\n[bold]Phase 1: Scraping D&D Beyond[/bold]")
        driver.get(START_URL)
        rows, pages = collect_all_listings(
            driver, start_time, limit=(TEST_LIMIT_SPELLS or None)
        )

        # Collect 5e.tools SOURCE_SHORT mapping
        console.print("\n[bold]Phase 2: Collecting SOURCE_SHORT from 5e.tools[/bold]")
        names_filter: Optional[Set[str]] = None
        if not SCRAPE_ALL_5ETOOLS:
            names_filter = {
                _norm_name(r.get("NAME", "")) for r in rows if r.get("NAME")
            }
            console.print(f"[dim]Filter: matching {len(names_filter)} unique spell names[/dim]")
        try:
            sources_map = collect_5e_tools_sources(
                driver,
                names_filter=names_filter,
                limit=(TEST_LIMIT_SPELLS or None) if not SCRAPE_ALL_5ETOOLS else None,
            )
        except Exception as e:
            console.print(f"[red]Warning: 5e.tools scraping failed: {e!r}[/red]")
            console.print("[yellow]Continuing without sources.[/yellow]")
            sources_map = {}
    finally:
        try:
            driver.quit()
        except Exception:
            pass

    if not rows:
        console.print("[red]No rows collected. Exiting.[/red]")
        sys.exit(1)

    # Post-process rows
    console.print("\n[bold]Phase 3: Post-processing data[/bold]")
    missing_source_short = 0
    for r in rows:
        # CLASSES -> JSON string array
        classes_raw = r.get("CLASSES", "") or ""
        parts = [p.strip() for p in classes_raw.split(";") if p.strip()]
        r["CLASSES"] = json.dumps(parts, ensure_ascii=False)

        # NAME_LOWER -> lowercase of exact DDB name
        r["NAME_LOWER"] = (r.get("NAME") or "").lower()

        # SOURCE_SHORT via normalized NAME match
        name_key = _norm_name(r.get("NAME", ""))
        src_short = sources_map.get(name_key, "")
        if not src_short:
            missing_source_short += 1
        r["SOURCE_SHORT"] = src_short

        # Ensure SLUG present
        if not r.get("SLUG"):
            slug = ""
            try:
                href = r.get("URL", "")
                m = re.search(r"/spells/\d+-([^/?#]+)", href)
                if m:
                    slug = m.group(1)
            except Exception:
                slug = ""
            r["SLUG"] = slug

    if missing_source_short:
        console.print(
            f"[yellow]Note: {missing_source_short} DDB rows had no matching "
            f"SOURCE_SHORT from 5e.tools (by name).[/yellow]"
        )
    
    # Ensure output directories exist
    _ensure_parent_dir(OUTPUT_FILE_URLS)
    _ensure_parent_dir(OUTPUT_FILE_DATA)

    console.print("\n[bold]Phase 4: Saving CSV files[/bold]")
    try:
        save_urls_csv(rows, OUTPUT_FILE_URLS)
        save_data_csv(rows, OUTPUT_FILE_DATA)
    except Exception as e:
        import traceback
        console.print(f"[red]ERROR saving CSVs: {e!r}[/red]")
        traceback.print_exc()
        sys.exit(2)
 
    elapsed = _format_elapsed(time.perf_counter() - start_time)
    abs_urls = os.path.abspath(OUTPUT_FILE_URLS)
    abs_data = os.path.abspath(OUTPUT_FILE_DATA)
    
    console.print(Panel.fit(
        f"[bold green]✓ Complete![/bold green]\n\n"
        f"[cyan]Time:[/cyan] {elapsed}\n"
        f"[cyan]Pages:[/cyan] {pages}\n"
        f"[cyan]Spells:[/cyan] {len(rows)}\n\n"
        f"[dim]URLs:[/dim] {abs_urls}\n"
        f"[dim]Data:[/dim] {abs_data}",
        border_style="green",
        title="Results"
    ))

if __name__ == "__main__":
    main()