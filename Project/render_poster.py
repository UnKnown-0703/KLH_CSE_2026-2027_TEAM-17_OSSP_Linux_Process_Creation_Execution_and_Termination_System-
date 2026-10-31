import os
import subprocess
from PIL import Image

chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
html_file = os.path.abspath('poster.html')
pdf_file = os.path.abspath('poster.pdf')
raw_png = os.path.abspath('poster_raw.png')
final_png = os.path.abspath('poster.png')

# 1. Print to PDF
print("1. Rendering high-res PDF...")
cmd_pdf = [
    chrome, '--headless', '--disable-gpu',
    f'--print-to-pdf={pdf_file}',
    '--no-pdf-header-footer',
    html_file
]
subprocess.run(cmd_pdf, capture_output=True)
print(f"PDF Generated: {os.path.getsize(pdf_file)/1024:.1f} KB")

# 2. Render high-res screenshot
print("2. Rendering high-res PNG screenshot...")
cmd_png = [
    chrome, '--headless', '--disable-gpu',
    '--window-size=1130,1750',
    '--hide-scrollbars',
    f'--screenshot={raw_png}',
    html_file
]
subprocess.run(cmd_png, capture_output=True)

# 3. Auto-crop to exact poster boundaries
if os.path.exists(raw_png):
    im = Image.open(raw_png)
    w, h = im.size
    print("Raw PNG size:", w, h)

    bg_color = im.getpixel((0, 0)) # background gray
    min_x, max_x = w, 0
    min_y, max_y = h, 0

    for y in range(0, h):
        for x in range(0, w, 2):
            pix = im.getpixel((x, y))
            if abs(pix[0] - bg_color[0]) > 10 or abs(pix[1] - bg_color[1]) > 10 or abs(pix[2] - bg_color[2]) > 10:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y

    print(f"Detected poster box: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}] -> width={max_x - min_x + 1}, height={max_y - min_y + 1}")

    crop_box = (max(0, min_x), max(0, min_y), min(w, max_x + 1), min(h, max_y + 1))
    cropped_im = im.crop(crop_box)
    cropped_im.save(final_png, quality=95)
    print(f"Final Poster PNG saved: {final_png} ({cropped_im.size[0]}x{cropped_im.size[1]})")

    if os.path.exists(raw_png):
        os.remove(raw_png)
