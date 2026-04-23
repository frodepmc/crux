#!/usr/bin/env python3
"""Procesa las fotos del equipo: mantiene aspecto 9:16 original, solo resize.

Exporta WebP + JPEG a 2 anchos: 450 y 900 (@1x y @2x retina).

Fuente: PNG 1080×1920 en la raíz del repo.
Destino: assets/images/equipo/<slug>-<width>.{webp,jpeg}

Slug map:
  Marc.png    → marc
  Pedro.png   → pedro
  Alvaro.png  → alvaro
  Encargado del Departamento de Operaciones y comercial.png → javi
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / 'assets' / 'images' / 'equipo'
OUT_DIR.mkdir(parents=True, exist_ok=True)

SOURCES = {
    'marc':   'Marc.png',
    'pedro':  'Pedro.png',
    'alvaro': 'Alvaro.png',
    'javi':   'Encargado del Departamento de Operaciones y comercial.png',
}

TARGET_WIDTHS = [450, 900]   # @1x y @2x retina
WEBP_QUALITY = 82
JPEG_QUALITY = 85


def main() -> None:
    print(f'Output dir: {OUT_DIR}')
    for slug, src_name in SOURCES.items():
        src = ROOT / src_name
        if not src.exists():
            print(f'  [SKIP] {src_name} not found')
            continue

        img = Image.open(src).convert('RGB')
        w, h = img.size
        aspect = h / w
        print(f'  {slug}: source {img.size} (aspect {w}:{h})')

        for target_w in TARGET_WIDTHS:
            target_h = round(target_w * aspect)
            resized = img.resize((target_w, target_h), Image.LANCZOS)

            webp_path = OUT_DIR / f'{slug}-{target_w}.webp'
            jpeg_path = OUT_DIR / f'{slug}-{target_w}.jpeg'

            resized.save(webp_path, format='WEBP',
                         quality=WEBP_QUALITY, method=6)
            resized.save(jpeg_path, format='JPEG',
                         quality=JPEG_QUALITY, progressive=True, optimize=True)

            print(f'    {webp_path.name} ({target_w}×{target_h}): '
                  f'{webp_path.stat().st_size // 1024} KB')
            print(f'    {jpeg_path.name} ({target_w}×{target_h}): '
                  f'{jpeg_path.stat().st_size // 1024} KB')

    print('Done.')


if __name__ == '__main__':
    main()
