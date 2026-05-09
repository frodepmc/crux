"""
Generate optimized background variants (WebP 1600/960 + JPEG 1600 fallback)
matching the existing convention in assets/images/.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "assets"
OUT_DIR = ROOT / "assets" / "images"

TARGET_RATIO = 1600 / 1067  # ≈ 1.5 (matches existing services-bg)
WEBP_QUALITY = 82
JPEG_QUALITY = 84


def crop_to_ratio(im: Image.Image, ratio: float, vertical_anchor: float = 0.5) -> Image.Image:
    """Crop the image to the target aspect ratio.

    vertical_anchor: 0.0 = keep top, 0.5 = center, 1.0 = keep bottom.
    """
    w, h = im.size
    src_ratio = w / h
    if src_ratio > ratio:
        # Too wide → trim sides (centered).
        new_w = int(round(h * ratio))
        x0 = (w - new_w) // 2
        return im.crop((x0, 0, x0 + new_w, h))
    # Too tall → trim top/bottom according to anchor.
    new_h = int(round(w / ratio))
    max_y0 = h - new_h
    y0 = int(round(max_y0 * vertical_anchor))
    return im.crop((0, y0, w, y0 + new_h))


def export(im: Image.Image, base: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1600 WebP
    im_1600 = im.resize((1600, 1067), Image.LANCZOS)
    im_1600.save(OUT_DIR / f"{base}-1600.webp", "WEBP", quality=WEBP_QUALITY, method=6)

    # 960 WebP
    im_960 = im.resize((960, 640), Image.LANCZOS)
    im_960.save(OUT_DIR / f"{base}-960.webp", "WEBP", quality=WEBP_QUALITY, method=6)

    # 1600 JPEG fallback
    im_1600.save(
        OUT_DIR / f"{base}-fallback.jpeg",
        "JPEG",
        quality=JPEG_QUALITY,
        optimize=True,
        progressive=True,
    )


def process(src_name: str, out_base: str, vertical_anchor: float) -> None:
    src = SRC_DIR / src_name
    print(f"-> {src_name}  (anchor={vertical_anchor})")
    im = Image.open(src).convert("RGB")
    cropped = crop_to_ratio(im, TARGET_RATIO, vertical_anchor=vertical_anchor)
    export(cropped, out_base)
    for suffix in ("-1600.webp", "-960.webp", "-fallback.jpeg"):
        out_path = OUT_DIR / f"{out_base}{suffix}"
        kb = out_path.stat().st_size / 1024
        print(f"   {out_path.name}: {kb:.1f} KB")


if __name__ == "__main__":
    # asesoria banner: kunj-parekh dune. Anchor toward center so the white sky
    # stays on top half (where the banner copy lives) and the dark dune anchors
    # the bottom edge.
    process(
        "kunj-parekh-H69EgivmCjE-unsplash.jpg.jpeg",
        "asesoria-bg",
        vertical_anchor=0.55,
    )

    # closing CTA: jocelyn-morales architecture. Center crop preserves the
    # bright/dark vertical division across the frame.
    process(
        "jocelyn-morales-w3yScu-ED0Y-unsplash.jpg.jpeg",
        "cta-bg",
        vertical_anchor=0.5,
    )
