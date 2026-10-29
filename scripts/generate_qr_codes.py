#!/usr/bin/env python3
"""Generate QR PNGs and SQL for room tokens. Use only after editing rooms.txt."""
import argparse, csv, hashlib, secrets, pathlib, urllib.parse

def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"

parser = argparse.ArgumentParser()
parser.add_argument("--base-url", required=True, help="Base URL, e.g. https://guest.example.com")
parser.add_argument("--rooms-file", default="scripts/rooms.txt")
parser.add_argument("--output-dir", default="generated-qr")
args = parser.parse_args()

try:
    import qrcode
except ImportError:
    raise SystemExit("Install QR dependency: python -m pip install qrcode[pil]")

rooms = [line.strip() for line in pathlib.Path(args.rooms_file).read_text().splitlines()
         if line.strip() and not line.strip().startswith("#")]
if len(set(rooms)) != len(rooms):
    raise SystemExit("Duplicate room numbers found. Fix rooms.txt first.")
if not rooms:
    raise SystemExit("No room numbers found.")

out = pathlib.Path(args.output_dir)
out.mkdir(parents=True, exist_ok=True)
base = args.base_url.rstrip("/")
csv_path = out / "room_tokens.csv"
sql_path = out / "seed_rooms.sql"

with csv_path.open("w", newline="", encoding="utf-8") as f_csv, sql_path.open("w", encoding="utf-8") as f_sql:
    writer = csv.writer(f_csv)
    writer.writerow(["room_number", "raw_token", "guest_url"])
    f_sql.write("-- Review this file before running in Supabase SQL Editor.\n")
    f_sql.write("-- Tokens are sensitive; keep this file private and delete raw-token CSV after QR printing.\n")
    for room in rooms:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        url = f"{base}/guest/{urllib.parse.quote(token, safe='')}"
        image = qrcode.make(url)
        image.save(out / f"room-{room}.png")
        writer.writerow([room, token, url])
        f_sql.write(
            "insert into public.rooms (room_number, is_active, qr_token_hash) "
            f"values ({sql_quote(room)}, true, {sql_quote(token_hash)}) "
            "on conflict (room_number) do update set "
            "qr_token_hash = excluded.qr_token_hash, is_active = true, updated_at = now();\n"
        )
print(f"Generated {len(rooms)} QR codes in {out.resolve()}")
print(f"SQL: {sql_path.resolve()}")
print(f"Sensitive token CSV: {csv_path.resolve()}")
