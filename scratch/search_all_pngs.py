import os
import time

search_root = r"C:\Users\Usuario\.gemini"
print(f"Buscando archivos PNG recientes en: {search_root}")
recent_pngs = []

now = time.time()
for root, dirs, files in os.walk(search_root):
    for f in files:
        if f.lower().endswith(".png") or f.lower().endswith(".jpg") or f.lower().endswith(".jpeg"):
            path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(path)
                # Si fue modificado en los últimos 25 minutos
                if now - mtime < 25 * 60:
                    recent_pngs.append((path, mtime, time.strftime('%H:%M:%S', time.localtime(mtime)), os.path.getsize(path)))
            except Exception:
                pass

recent_pngs.sort(key=lambda x: x[1], reverse=True)
for path, _, mtime_str, size in recent_pngs[:15]:
    print(f"Path: {path} | Time: {mtime_str} | Size: {size} bytes")
