"""Tests for the edit checker. Run: python -m pytest -q scripts/cms/test_check_edit.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_edit import check  # noqa: E402

GOOD = {
    "url": "/research-and-talks/brightonseo-san-diego-2026",
    "title": "brightonSEO San Diego 2026: Talk Recap",
    "description": "My brightonSEO San Diego 2026 talk and a thank-you to the 74 people behind it: 1,638 reactions across 27 LinkedIn posts, the video, photos and slides.",
    "h1": "brightonSEO 2026",
    "canonical": "/research-and-talks/brightonseo-san-diego-2026",
    "robots": "index, follow",
}


def test_a_clean_edit_passes():
    assert check(GOOD) == {"block": [], "warn": []}


def test_em_dash_blocks_anywhere_including_the_note():
    assert check({**GOOD, "title": "brightonSEO — recap"})["block"]
    assert check({**GOOD, "note": "match it — exactly"})["block"]


def test_angle_brackets_block():
    assert check({**GOOD, "h1": "<script>x</script>"})["block"]


def test_off_site_or_protocol_relative_canonical_blocks():
    assert check({**GOOD, "canonical": "https://example.com/page"})["block"]
    assert check({**GOOD, "canonical": "//example.com/page"})["block"]
    assert not check({**GOOD, "canonical": "https://venkatapagadala.com/guides"})["block"]


def test_unknown_robots_value_blocks():
    assert check({**GOOD, "robots": "noarchive"})["block"]


def test_empty_title_blocks_but_long_title_only_warns():
    assert check({**GOOD, "title": "   "})["block"]
    r = check({**GOOD, "title": "x" * 61})
    assert not r["block"] and r["warn"]


def test_description_outside_140_to_160_warns():
    r = check({**GOOD, "description": "Too short."})
    assert not r["block"] and r["warn"]
