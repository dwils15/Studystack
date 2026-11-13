#!/usr/bin/env python3
"""Rebuild decks/index.json from valid deck JSON files (Python standard library only)."""
import json
from pathlib import Path
folder = Path(__file__).resolve().parents[1] / "decks"
entries = []
for path in sorted(folder.glob("*.json")):
    if path.name == "index.json":
        continue
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        cards = data if isinstance(data, list) else data.get("cards", data.get("flashcards", []))
        if not isinstance(cards, list) or not cards:
            print(f"Skipping {path.name}: no cards")
            continue
        valid = any(isinstance(c, dict) and (c.get("front") or c.get("q") or c.get("question")) and (c.get("back") or c.get("a") or c.get("answer")) for c in cards)
        if not valid:
            print(f"Skipping {path.name}: no valid question/answer pairs")
            continue
        title = path.stem.replace("-", " ").title() if isinstance(data, list) else str(data.get("title") or data.get("name") or path.stem)
        entries.append({"title": title, "file": path.name})
    except (ValueError, UnicodeError, AttributeError) as exc:
        print(f"Skipping {path.name}: {exc}")
content = json.dumps({"decks": entries}, indent=2, ensure_ascii=False) + "\n"
index = folder / "index.json"
if not index.exists() or index.read_text(encoding="utf-8") != content:
    index.write_text(content, encoding="utf-8")
    print(f"Updated catalog: {len(entries)} decks")
else:
    print("Catalog already current")
