"""Independently reread the nine retained reference header fields; no engine input."""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
folder = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'docs/period-expanded-20261024'
spec = importlib.util.spec_from_file_location('ju_headers', ROOT / 'scripts/audit-reference-headers.py')
ju_headers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ju_headers)
atlas = Image.open(folder / 'header-templates.webp').convert('RGB')
labels = {}
for item in json.loads((folder / 'header-templates.json').read_text()):
    group = item.get('group', item['field'])
    patch = atlas.crop(item['template_box'])
    key = (group, hashlib.sha256(patch.tobytes()).hexdigest())
    if key in labels and labels[key] != item['label']:
        raise ValueError('Ambiguous template')
    labels[key] = item['label']

boxes = {'xun': (91,187,147,215), 'fu': (91,217,119,245),
         'star': (91,247,147,275), 'door': (391,247,447,275),
         'empty': (391,187,447,215), 'horse': (391,217,419,245)}
rows = json.loads((folder / 'results.json').read_text())
for row in rows:
    sheet = Image.open(folder / row['sheet']).convert('RGB')
    x, y = row['sheet_index'] % 2 * 700, row['sheet_index'] // 2 * 300
    im = sheet.crop((x,y,x+700,y+280))
    observed = {'ju': ju_headers.classify(im)}
    def read(group, box):
        key = (group, hashlib.sha256(im.crop(box).tobytes()).hexdigest())
        if key not in labels:
            raise ValueError(f"Unknown reference glyph: {row['id']} {group}")
        return labels[key]
    for field, box in boxes.items():
        observed[field] = read(field, box)
    for field, x0 in [('bazi_y',91), ('bazi_m',161)]:
        observed[field] = read('gan',(x0,97,x0+28,125)) + read('zhi',(x0,127,x0+28,155))
    if observed != row['reference']:
        raise ValueError(f"Reference mismatch: {row['id']} {observed}")
print(json.dumps({'reference_charts_reread': len(rows), 'fields': len(rows)*9,
                  'pixel_matching': 'exact', 'engine_used': False}))
