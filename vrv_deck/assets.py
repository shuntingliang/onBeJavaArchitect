from PIL import Image, ImageEnhance
import numpy as np

INK = (27, 43, 43)


def crop_watermark(img, keep_h=0.90):
    w, h = img.size
    return img.crop((0, 0, w, int(h * keep_h)))


def center_crop_ratio(img, ratio):
    w, h = img.size
    if w / h > ratio:
        nw = int(h * ratio)
        x0 = (w - nw) // 2
        return img.crop((x0, 0, x0 + nw, h))
    nh = int(w / ratio)
    y0 = (h - nh) // 2
    return img.crop((0, y0, w, y0 + nh))


# ---------- 方案页大图：3:2 ----------
sol = Image.open("assets/roof_solution2.jpg").convert("RGB")
sol = crop_watermark(sol, 0.90)
sol = center_crop_ratio(sol, 1.5)
sol = sol.resize((2400, 1600), Image.LANCZOS)
sol = ImageEnhance.Color(sol).enhance(1.02)
sol.save("assets/solution_2400x1600.jpg", quality=92)

# ---------- 封面：16:9 + 左侧渐变压暗 ----------
cov = Image.open("assets/roof_problem.jpg").convert("RGB")
cov = crop_watermark(cov, 0.90)
cov = center_crop_ratio(cov, 16 / 9)
cov = cov.resize((2400, 1350), Image.LANCZOS)

base = np.asarray(cov).astype(np.float32)
h, w, _ = base.shape
x = np.arange(w) / w
# 左侧 36% 保持近实色，36%–75% 之间平滑过渡到透明
alpha = np.where(
    x < 0.36,
    0.94,
    0.94 * np.clip(1 - (x - 0.36) / 0.39, 0, 1) ** 1.2,
)
alpha = alpha[None, :, None]
overlay = np.array(INK, dtype=np.float32)[None, None, :]
out = base * (1 - alpha) + overlay * alpha
out = np.clip(out, 0, 255).astype(np.uint8)
Image.fromarray(out).save("assets/cover_2400x1350.jpg", quality=92)

print("done", sol.size, cov.size)
