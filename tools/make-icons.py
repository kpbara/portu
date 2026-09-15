# -*- coding: utf-8 -*-
"""Regenerate the app icons from images/logo-master.png.

Not part of the build — the app has no build step. Run this by hand only when
the logo changes:

    python tools/make-icons.py

logo-master.png must be square and full-bleed: the artwork's own background
colour must run all the way into the corners. Phones apply their own rounding
(circle, squircle, rounded square, depending on the launcher), so an image with
rounded corners baked in shows slivers of whatever sits behind them. The
original generated logo had white corners for exactly this reason; they were
flood-filled with the app's ink before saving the master.
"""

from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'images', 'logo-master.png')
OUT = os.path.join(ROOT, 'icons')
INK = (27, 29, 25)          # #1B1D19, the app's ink — must match the logo ground

im = Image.open(SRC).convert('RGB')
if im.width != im.height:
    raise SystemExit('logo-master.png must be square, got %dx%d' % im.size)

os.makedirs(OUT, exist_ok=True)

# Plain icons — full bleed. iOS uses the 180 for the home screen.
for size in (180, 192, 512):
    im.resize((size, size), Image.LANCZOS).save(
        os.path.join(OUT, 'icon-%d.png' % size), optimize=True)

# Maskable — Android may crop to a circle, and the safe area is only the
# middle 80%. The waves run edge to edge, so the art is scaled to 72% and
# centred on ink; anything larger loses the ends of the waves.
S, canvas = 512, Image.new('RGB', (512, 512), INK)
inner = int(S * 0.72)
canvas.paste(im.resize((inner, inner), Image.LANCZOS),
             ((S - inner) // 2, (S - inner) // 2))
canvas.save(os.path.join(OUT, 'icon-maskable-512.png'), optimize=True)

for f in sorted(os.listdir(OUT)):
    print('  %-24s %6.1f KB' % (f, os.path.getsize(os.path.join(OUT, f)) / 1024))
