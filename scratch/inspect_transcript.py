transcript_path = r"C:\Users\Usuario\.gemini\antigravity-ide\brain\d3f77da9-f4ae-468e-a0e2-df297a4870af\.system_generated\logs\transcript_full.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f, open("scratch/chat_html.txt", "w", encoding="utf-8") as out:
    found = 0
    for line in f:
        if "stChatMessage" in line:
            idx = line.find("stChatMessage")
            snippet = line[max(0, idx - 400): min(len(line), idx + 1200)]
            clean_snippet = snippet.replace('\\"', '"').replace('\\/', '/').replace('\\n', '\n')
            out.write(f"--- Coincidencia {found} ---\n")
            out.write(clean_snippet + "\n\n")
            found += 1
            if found > 4:
                break
print("Listo. Revisa scratch/chat_html.txt")
