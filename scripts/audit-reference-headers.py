"""Read JU from rendered reference PNGs by exact glyph pixels, never from engine output.

Requires Pillow. The original rendered header is preserved in per-year contact sheets.
Unknown glyphs stop the audit; no OCR approximation or guessed result is accepted.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
LABELS = ['陰', '陽', '1', '2', '3', '4', '5', '6', '7', '8', '9']
TEMPLATE = ROOT / 'docs/reference-20261024/ju-header-templates.png'


def classify_regions(regions):
    templates = Image.open(TEMPLATE).convert('RGB')
    result = []
    for patch, indexes in zip(regions, [range(2), range(2, 11)]):
        glyph = Image.new('RGB', (28, 28), 'white')
        glyph.paste(patch.convert('RGB'), (0, 0))
        matches = [LABELS[i] for i in indexes if ImageChops.difference(glyph, templates.crop((i*28, 0, i*28+28, 28))).getbbox() is None]
        if len(matches) != 1:
            raise ValueError(f'Unknown/ambiguous reference glyph: {matches}')
        result.append(matches[0])
    return ''.join(result)


def classify(image):
    return classify_regions([image.crop(box) for box in [(91,157,116,185),(119,157,147,185)]])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('directory', type=Path, nargs='?')
    parser.add_argument('--verify-sheets', type=Path, help='Verify retained reference glyphs against results.json')
    args = parser.parse_args()
    if args.verify_sheets:
        rows = json.loads(args.verify_sheets.read_text())
        for row in rows:
            image=Image.open(args.verify_sheets.parent / row['sheet'])
            x,y=(row['sheet_index']%2)*700,(row['sheet_index']//2)*100
            value=classify_regions([image.crop((x+91,y+61,x+116,y+89)),image.crop((x+119,y+61,x+147,y+89))])
            if value != row['reference_ju']:
                raise ValueError(f"Sheet mismatch: {row['id']} {value} != {row['reference_ju']}")
        print(json.dumps({'verified_reference_headers':len(rows),'pixel_matching':'exact'}))
        return
    if not args.directory:
        parser.error('Provide a capture directory or --verify-sheets')
    folder = args.directory
    expected = json.loads((folder / 'expected.json').read_text())
    after_path = folder / 'expected-after.json'
    after = json.loads(after_path.read_text()) if after_path.exists() else None
    plan = {row['id']: row for row in json.loads((folder / 'plan.json').read_text())}
    rows = []
    for path in sorted(folder.glob('*.b64')):
        key = path.stem
        if key not in plan:
            continue
        png = folder / (key + '.png')
        if not png.exists():
            png.write_bytes(base64.b64decode(path.read_text().strip(), validate=True))
        image = Image.open(png)
        if image.size != (700, 1000):
            raise ValueError(f'Unexpected reference dimensions: {key} {image.size}')
        reference = classify(image)
        row = {**plan[key], 'reference_ju': reference, 'engine_ju': expected[key],
               'match': reference == expected[key], 'reference_png_sha256': hashlib.sha256(png.read_bytes()).hexdigest()}
        if after is not None:
            row.update(engine_after_ju=after[key], match_after=reference == after[key])
        rows.append(row)

    groups=[(f'headers-{year}.png',[r for r in rows if r['year']==year and r['kind']=='daily']) for year in sorted({r['year'] for r in rows if r['kind']=='daily'})]
    groups.append(('boundaries.png',[r for r in rows if r['kind']!='daily']))
    for name, group in groups:
        if not group:
            continue
        sheet = Image.new('RGB', (1400, ((len(group)+1)//2)*100), 'white')
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(group):
            x, y = (i%2)*700, (i//2)*100
            image = Image.open(folder / (row['id'] + '.png')).convert('RGB')
            draw.text((x+20, y+2), row['id'], fill='black')
            sheet.paste(image.crop((0,30,700,66)), (x,y+20))
            sheet.paste(image.crop((0,156,700,188)), (x,y+60))
            row['sheet'] = name
            row['sheet_index'] = i
        red,green,blue=sheet.split()
        if ImageChops.difference(red,green).getbbox() or ImageChops.difference(red,blue).getbbox():
            raise ValueError('Unexpected color in retained reference header')
        sheet.convert('L').save(folder / name)

    (folder / 'results.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'checked': len(rows), 'planned': len(plan),
                      'mismatches': [{k:r[k] for k in ['id','reference_ju','engine_ju']} for r in rows if not r['match']],
                      'candidate_mismatches': [{k:r[k] for k in ['id','reference_ju','engine_after_ju']} for r in rows if after is not None and not r['match_after']]}, ensure_ascii=False))


if __name__ == '__main__':
    main()
