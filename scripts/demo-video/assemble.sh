#!/usr/bin/env bash
# Viikkoraha demo-video assemble — lisää selostusääni raakavideoon
#
# Tarvitaan: ffmpeg
# Syöte:    ~/Downloads/viikkoraha-demo-raw.mov    (sinun nauhoitus)
# Tuloste:  scripts/demo-video/viikkoraha-demo-final.mp4
#
# Askeleet:
# 1. Luo 1.5s hiljaisuusklippi
# 2. Kokoa selostusklipit + hiljaisuudet yhdeksi raidaksi
# 3. Mixaa selostus videon päälle, alkuperäinen ääni 20% taustalla

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAW="${1:-$HOME/Downloads/viikkoraha-demo-raw.mov}"
OUT="$SCRIPT_DIR/viikkoraha-demo-final.mp4"
WORK="$SCRIPT_DIR/.work"
mkdir -p "$WORK"

if [ ! -f "$RAW" ]; then
    echo "❌ Raakavideota ei löydy: $RAW"
    echo "   Nauhoita video ohjeen mukaan: $SCRIPT_DIR/MANUAL_RECORDING.md"
    exit 1
fi

echo "═══ 1. LUO HILJAISUUSKLIPPI ═══"

SILENCE="$WORK/silence.m4a"
ffmpeg -y -f lavfi -i "anullsrc=r=24000:cl=mono" -t 1.5 -c:a aac -b:a 64k "$SILENCE" 2>/dev/null

echo "═══ 2. KOKOA SELOSTUSRAITA ═══"

CLIPS=(
    voice_01_intro.ogg
    voice_02_oauth.ogg
    voice_03_profile.ogg
    voice_04_drive.ogg
    voice_05_spreadsheets.ogg
    voice_06_booking.ogg
    voice_07_dashboard.ogg
    voice_08_conclusion.ogg
)

CONCAT_FILE="$WORK/clips.txt"
rm -f "$CONCAT_FILE"

for clip in "${CLIPS[@]}"; do
    fp="$VOICE_DIR/$clip"  # Hmm, should be SCRIPT_DIR
    fp="$SCRIPT_DIR/$clip"
    if [ -f "$fp" ]; then
        echo "file '$fp'" >> "$CONCAT_FILE"
        echo "file '$SILENCE'" >> "$CONCAT_FILE"
    fi
done

ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" \
    -c:a aac -b:a 128k "$WORK/narration.m4a" 2>/dev/null

NARRATION_DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$WORK/narration.m4a" 2>/dev/null)
echo "   Selostusraidan kesto: ${NARRATION_DUR}s"

echo ""
echo "═══ 3. YHDISTÄ VIDEO + SELOSTUS ═══"

RAW_DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$RAW" 2>/dev/null)
echo "   Raakavideo: ${RAW_DURATION}s"

# Selostusraita päälle, alkuperäinen ääni 20% taustalla
ffmpeg -y -i "$RAW" -i "$WORK/narration.m4a" \
    -filter_complex "\
        [0:a]volume=0.20[bg];\
        [bg][1:a]amix=inputs=2:duration=first:dropout_transition=2[narrated];\
        [0:v]scale='min(1920,iw)':-2[vout]\
    " \
    -map "[vout]" -map "[narrated]" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    "$OUT" 2>/dev/null

echo ""
echo "✅ Valmis: $OUT"
echo "   Kesto: $(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUT")s"
echo ""
echo "   Lataa YouTubeen (unlisted): $OUT"
