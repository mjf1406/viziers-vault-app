#!/usr/bin/env python3
"""
Augment existing D&D Beyond magic items data with SOURCE_SHORT from 5e.tools.

Reads stuff/data/dndbeyond-magicitems-data.csv, scrapes 5e.tools/items.html
to get SOURCE_SHORT for each item, and outputs a new CSV with all original
columns plus SOURCE_SHORT.

Extracts SOURCE_SHORT from URL fragment like:
https://5e.tools/items.html#boots%20of%20speed_xdmg -> "xdmg"

Requires: selenium, rich

Testing/Speed knobs:
 - Set TEST_LIMIT_ITEMS = 10 to only match first 10 items from CSV
"""
from __future__ import annotations

import csv
import os
import random
import re
import sys
import time
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urlsplit, unquote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import (
    StaleElementReferenceException,
    TimeoutException,
)
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeElapsedColumn
from rich.console import Console
from rich.panel import Panel

# CONFIG --------------------------------------------------------------------
INPUT_FILE = "stuff/data/dndbeyond-magicitems-data.csv"
OUTPUT_FILE = "stuff/data/magicitems-with-sources.csv"
FIVEETOOLS_URL = "https://5e.tools/items.html"

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

FIVEETOOLS_MAX_WAIT = 20  # For initial page load
FIVEETOOLS_ROW_WAIT = 3   # For individual row clicks

# Testing/Speed controls
# If > 0, stop after matching this many items from CSV
TEST_LIMIT_ITEMS = 0  # e.g., set to 10 for a quick run; 0 or None for all
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


def _norm_name(name: str) -> str:
    """Normalize a name for joining: lowercase and strip non-alphanumerics."""
    return re.sub(r"[^a-z0-9]+", "", (name or "").lower())


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


def load_ddb_items(filepath: str, limit: Optional[int] = None) -> Tuple[List[Dict[str, str]], List[str]]:
    """Load items from DDB CSV file. Returns (items, fieldnames)."""
    console = Console()
    items = []
    fieldnames = []
    
    if not os.path.exists(filepath):
        console.print(f"[red]Error: Input file not found: {filepath}[/red]")
        sys.exit(1)
    
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        for row in reader:
            items.append(row)
            if limit and len(items) >= limit:
                break
    
    console.print(f"[green]Loaded {len(items)} items from {filepath}[/green]")
    console.print(f"[dim]Fields: {', '.join(fieldnames)}[/dim]")
    return items, fieldnames

def collect_5e_tools_sources(
    driver,
    names_filter: Set[str],
) -> Dict[str, str]:
    """
    Visit 5e.tools/items.html and extract name + source from list rows.
    No clicking needed - everything is in the href and first span.
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
        
        load_task = progress.add_task("[cyan]Loading 5e.tools/items.html...", total=None)
        
        driver.get(FIVEETOOLS_URL)
        time.sleep(2)

        try:
            WebDriverWait(driver, FIVEETOOLS_MAX_WAIT).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            WebDriverWait(driver, FIVEETOOLS_MAX_WAIT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.list.list--stats.magic.ele-magic"))
            )
        except TimeoutException:
            console.print("[yellow]Warning: 5e.tools did not load fully.")
            return mapping

        _dismiss_5etools_overlays(driver)

        # Scroll to load all items
        progress.update(load_task, description="[cyan]Loading all items...")
        last_count = 0
        stagnation = 0
        while stagnation < 3:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(0.5)
            rows = driver.find_elements(By.CSS_SELECTOR, "div.list.list--stats.magic.ele-magic a.lst__row-inner")
            if len(rows) == last_count:
                stagnation += 1
            else:
                stagnation = 0
                progress.update(load_task, description=f"[cyan]Loading... ({len(rows)} items)")
            last_count = len(rows)
        
        rows = driver.find_elements(By.CSS_SELECTOR, "div.list.list--stats.magic.ele-magic a.lst__row-inner")
        progress.remove_task(load_task)
        
        extract_task = progress.add_task(
            f"[cyan]Extracting sources...",
            total=len(rows)
        )
        
        for idx, row in enumerate(rows):
            try:
                # Extract name from first span
                name_span = row.find_element(By.CSS_SELECTOR, "span.bold, span.ve-col-3-5")
                name = _clean(name_span.text)
                
                # Extract source from href
                href = row.get_attribute("href") or ""
                frag = urlsplit(href).fragment or ""
                frag = unquote(frag)
                
                main_part = re.split(r"[,&]", frag)[0]
                source_short = ""
                if "_" in main_part:
                    source_short = main_part.rsplit("_", 1)[1].lower()

                if name and source_short:
                    key = _norm_name(name)
                    if key not in mapping and key in names_filter:
                        mapping[key] = source_short
                
                progress.update(
                    extract_task,
                    completed=idx + 1,
                    description=f"[cyan]Matched: {len(mapping)}/{len(names_filter)} | Current: {name[:30]}"
                )
                
            except Exception:
                continue
        
        progress.update(extract_task, description=f"[green]Complete! Matched {len(mapping)}/{len(names_filter)}")

    return mapping

def main():
    console = Console()
    start_time = time.perf_counter()
    
    console.print(Panel.fit(
        "[bold cyan]5e.tools Magic Items Source Augmentation[/bold cyan]\n"
        f"[dim]Input: {INPUT_FILE}[/dim]\n"
        f"[dim]Limit: {TEST_LIMIT_ITEMS if TEST_LIMIT_ITEMS else 'All items'}[/dim]",
        border_style="cyan"
    ))
    
    # Load existing DDB data
    console.print("\n[bold]Phase 1: Loading D&D Beyond data[/bold]")
    items, fieldnames = load_ddb_items(INPUT_FILE, limit=(TEST_LIMIT_ITEMS or None))
    
    if not items:
        console.print("[red]No items loaded. Exiting.[/red]")
        sys.exit(1)
    
    # Build filter set of normalized names
    names_filter = {_norm_name(item.get("NAME", "")) for item in items if item.get("NAME")}
    console.print(f"[dim]Created filter for {len(names_filter)} unique item names[/dim]")
    
    # Scrape 5e.tools for SOURCE_SHORT
    console.print("\n[bold]Phase 2: Collecting SOURCE_SHORT from 5e.tools[/bold]")
    driver = make_driver(headless=HEADLESS, user_agent=USER_AGENT)
    try:
        sources_map = collect_5e_tools_sources(driver, names_filter)
    except Exception as e:
        console.print(f"[red]Warning: 5e.tools scraping failed: {e!r}[/red]")
        console.print("[yellow]Continuing without sources.[/yellow]")
        sources_map = {}
    finally:
        try:
            driver.quit()
        except Exception:
            pass
    
    # Augment items with SOURCE_SHORT
    console.print("\n[bold]Phase 3: Post-processing data[/bold]")
    missing_source_short = 0
    for item in items:
        name = item.get("NAME", "")
        name_key = _norm_name(name)
        src_short = sources_map.get(name_key, "")
        if not src_short:
            missing_source_short += 1
        item["SOURCE_SHORT"] = src_short
    
    if missing_source_short:
        console.print(
            f"[yellow]Note: {missing_source_short}/{len(items)} items had no matching "
            f"SOURCE_SHORT from 5e.tools (by name).[/yellow]"
        )
    else:
        console.print(f"[green]All {len(items)} items matched successfully![/green]")
    
    # Save output CSV with all original fields + SOURCE_SHORT
    console.print("\n[bold]Phase 4: Saving CSV file[/bold]")
    _ensure_parent_dir(OUTPUT_FILE)
    
    # Add SOURCE_SHORT to fieldnames if not already present
    output_fieldnames = list(fieldnames)
    if "SOURCE_SHORT" not in output_fieldnames:
        output_fieldnames.append("SOURCE_SHORT")
    
    try:
        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=output_fieldnames)
            writer.writeheader()
            for item in items:
                writer.writerow(item)
    except Exception as e:
        import traceback
        console.print(f"[red]ERROR saving CSV: {e!r}[/red]")
        traceback.print_exc()
        sys.exit(2)
    
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    elapsed_sec = elapsed_ms / 1000
    mins = int(elapsed_sec // 60)
    secs = int(elapsed_sec % 60)
    ms = elapsed_ms % 1000
    elapsed_str = f"{mins:02d}:{secs:02d}:{ms:03d}"
    
    abs_output = os.path.abspath(OUTPUT_FILE)
    matched = len(items) - missing_source_short
    
    console.print(Panel.fit(
        f"[bold green]✓ Complete![/bold green]\n\n"
        f"[cyan]Time:[/cyan] {elapsed_str}\n"
        f"[cyan]Items:[/cyan] {len(items)}\n"
        f"[cyan]Matched:[/cyan] {matched}/{len(items)}\n\n"
        f"[dim]Output:[/dim] {abs_output}",
        border_style="green",
        title="Results"
    ))


if __name__ == "__main__":
    main()