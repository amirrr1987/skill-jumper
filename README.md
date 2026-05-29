# Stair Gun

**Mr Gun–style** zigzag stair duel shooter — improved: no ads, fair gun shop, combos, bosses, and headshots.

Face one enemy at a time on the stairs. Your **aim line oscillates** automatically. **Tap when it lines up** — miss and they fire back instantly.

## Play

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build
```

Upload `dist/` to any static host (`base: './'`).

## Controls

- **Tap** — fire when the red aim line hits the enemy (head = double damage & coins)
- **Armory** — buy/equip guns between runs (guaranteed unlocks, no loot-box tricks)

## vs Mr Gun (original)

| Feature | Mr Gun | Stair Gun |
|---------|--------|-----------|
| Core mechanic | Oscillating aim + tap | Same |
| Miss | Instant death | Same (+ return-fire animation) |
| Ads | Heavy | None |
| Gun rewards | Buggy blacklist RNG | Clear coin prices |
| Extras | — | Combos, enemy types, bosses, 8 weapons |

## Guns

| Gun | Price | Special |
|-----|-------|---------|
| Pistol | Free | Balanced starter |
| SMG | 250 | Fast follow-up shots on bosses |
| Shotgun | 600 | Wide hit window |
| Rifle | 1200 | Strong vs armored |
| Sniper | 2500 | Forgiving aim + damage |
| Laser | 5000 | Fast, precise |
| Cannon | 9000 | Boss-breaker |
| Dual Elite | 15000 | Twin spread |

## Enemies

- **Grunt** — 1 HP
- **Runner** — faster swaying aim
- **Armored** — 2 HP
- **Elite** — 3 HP, bonus coins
- **Boss** — every 5 kills, multi-HP bar

## Stack

Vite + TypeScript (strict) + Phaser 4. No external assets — Graphics primitives + Web Audio.
