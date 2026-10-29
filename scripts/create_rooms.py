
rooms = []

# Floors 3–10: 11 rooms per floor
for floor in range(3, 11):
    for room in range(1, 12):
        rooms.append(f"{floor}{room:02d}")

# Floors 11–14: 9 rooms per floor
for floor in range(11, 15):
    for room in range(1, 10):
        rooms.append(f"{floor}{room:02d}")

# Floor 15: 7 rooms
for room in range(1, 8):
    rooms.append(f"15{room:02d}")

# Floors 16–21: 7 rooms per floor
for floor in range(16, 22):
    for room in range(1, 8):
        rooms.append(f"{floor}{room:02d}")

# Floors 22–29: 5 rooms per floor
for floor in range(22, 30):
    for room in range(1, 6):
        rooms.append(f"{floor}{room:02d}")

# Floor 32: one room
rooms.append("3200")

with open("rooms.txt", "w", encoding="utf-8") as file:
    file.write("\n".join(rooms) + "\n")

print(f"Created {len(rooms)} rooms.")
