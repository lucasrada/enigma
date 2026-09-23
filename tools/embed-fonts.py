#!/usr/bin/env python3
"""Subset the two web fonts and embed them in enigma.html as base64 @font-face rules.

Keeps the page self-contained (no runtime requests). Rewrites the block between
`/* fonts:begin */` and `/* fonts:end */`.

  pip install fonttools brotli
  python3 tools/embed-fonts.py

Fonts (both free to embed):
  * Barlow Semi Condensed, Jeremy Tribby, SIL Open Font License 1.1
  * Special Elite, Astigmatic, Apache License 2.0
"""
import base64, io, pathlib, re, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / 'enigma.html'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
UNICODES = ('U+0020-007E,U+00A0,U+00A7,U+00B0,U+00B7,U+00C4,U+00D6,U+00DC,U+00DF,'
            'U+00E4,U+00F6,U+00FC,U+00D7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,'
            'U+201E,U+2026,U+2022')
FACES = [
    ('Barlow Semi Condensed', 'Barlow+Semi+Condensed:wght@400;500;600', ['400', '500', '600']),
    ('Special Elite', 'Special+Elite', ['400']),
]


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req) as r:
        return r.read()


def latin_urls(spec):
    css = fetch(f'https://fonts.googleapis.com/css2?family={spec}&display=swap').decode()
    out = {}
    for sub, body in re.findall(r'/\* (\S+) \*/\s*@font-face \{(.*?)\}', css, re.S):
        if sub == 'latin':
            out[re.search(r'font-weight: (\d+)', body).group(1)] = re.search(r'url\((.*?)\)', body).group(1)
    return out


def subset_woff2(data):
    font = TTFont(io.BytesIO(data))
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'tnum', 'lnum']
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = 'woff2'
    font.save(buf)
    return buf.getvalue()


def main():
    rules = []
    for family, spec, weights in FACES:
        urls = latin_urls(spec)
        for w in weights:
            data = subset_woff2(fetch(urls[w]))
            b64 = base64.b64encode(data).decode()
            rules.append(f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{w};"
                         f"font-display:block;src:url(data:font/woff2;base64,{b64}) format('woff2')}}")
            print(f'{family} {w}: {len(data)} bytes')
    html = HTML.read_text()
    block = '/* fonts:begin */\n' + '\n'.join(rules) + '\n/* fonts:end */'
    html, n = re.subn(r'/\* fonts:begin \*/.*?/\* fonts:end \*/', lambda _: block, html, flags=re.S)
    if n != 1:
        raise SystemExit('enigma.html has no fonts:begin/fonts:end block')
    HTML.write_text(html)
    print('Embedded into', HTML)


if __name__ == '__main__':
    main()
