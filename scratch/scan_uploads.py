import os
import time

temp_dir = r"C:\Users\Usuario\.gemini\antigravity-ide\brain\d3f77da9-f4ae-468e-a0e2-df297a4870af\.tempmediaStorage"
print("Listado de archivos recientes:")
files = []
for f in os.listdir(temp_dir):
    path = os.path.join(temp_dir, f)
    mtime = os.path.getmtime(path)
    # Convertir mtime a formato legible
    mtime_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
    size = os.path.getsize(path)
    files.append((f, mtime, mtime_str, size))

# Ordenar por mtime descendente
files.sort(key=lambda x: x[1], reverse=True)
for f, _, mtime_str, size in files[:10]:
    print(f"File: {f} | Modified: {mtime_str} | Size: {size} bytes")
