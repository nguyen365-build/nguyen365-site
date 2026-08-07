"""Generate the 1200x630 Open Graph card served at /og.png.

Run: python scripts/make-og.py
Rerun this whenever the name/headline in src/data/profile.ts changes.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = (16, 20, 25)
INK = (233, 236, 240)
DIM = (163, 173, 186)
ACCENT = (92, 200, 168)
RULE = (38, 46, 57)

OUT = Path(__file__).resolve().parent.parent / "public" / "og.png"

FONT_DIR = Path("C:/Windows/Fonts")
CANDIDATES = {
    "bold": ["segoeuib.ttf", "arialbd.ttf"],
    "regular": ["segoeui.ttf", "arial.ttf"],
    "mono": ["consola.ttf", "cour.ttf"],
}


def load(kind: str, size: int) -> ImageFont.FreeTypeFont:
    for name in CANDIDATES[kind]:
        path = FONT_DIR / name
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size)


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# Accent rule down the left edge.
d.rectangle([0, 0, 10, H], fill=ACCENT)

pad_x = 84
y = 96

# Eyebrow.
d.text((pad_x, y), "DIGITAL BANKING & PAYMENTS ENGINEERING", font=load("mono", 22), fill=ACCENT)
y += 62

# Name.
d.text((pad_x, y), "Minh Nguyen", font=load("bold", 92), fill=INK)
y += 118

# Headline.
d.text((pad_x, y), "Senior .NET/Cloud Engineer", font=load("regular", 40), fill=DIM)
y += 78

d.line([pad_x, y, W - pad_x, y], fill=RULE, width=2)
y += 44

# Proof line, the part that actually earns the click.
for line in (
    "SAML SSO  ·  Plaid ACH verification  ·  Fiserv wallet provisioning",
    "Live core conversion: DataSafe → Jack Henry Symitar",
):
    d.text((pad_x, y), line, font=load("regular", 31), fill=DIM)
    y += 48

d.text((pad_x, H - 78), "nguyen365.com", font=load("mono", 27), fill=ACCENT)

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes)")
