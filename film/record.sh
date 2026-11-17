#!/usr/bin/env bash
# Quay video trang AXIOM thật. Chạy trên server: ./film/record.sh
# Cần: node >= 20, ffmpeg. Có GPU NVIDIA + thư viện đồ hoạ thì đặt GPU=1 để nhanh hơn nhiều.
# Biến tuỳ chỉnh: WIDTH HEIGHT FPS SCALE LITE GPU WORKERS PORT
set -e
cd "$(dirname "$0")/.."
export WIDTH=${WIDTH:-1920} HEIGHT=${HEIGHT:-1080} FPS=${FPS:-15} SCALE=${SCALE:-1} OUT=${OUT:-film/frames}
WORKERS=${WORKERS:-4}; PORT=${PORT:-4173}; export URL=http://127.0.0.1:$PORT
[ -d node_modules ] || npm install --no-audit --no-fund
npm run build
mkdir -p dist/video && ffmpeg -y -loglevel error -i dist/video/drive.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -an dist/video/drive.webm
(cd film && [ -d node_modules ] || npm install --no-audit --no-fund && npx playwright install --with-deps chromium)
npx vite preview --port $PORT --host 127.0.0.1 --strictPort >/dev/null 2>&1 &
SRV=$!; trap "kill $SRV 2>/dev/null" EXIT; sleep 3
rm -rf "$OUT"; mkdir -p "$OUT"
( cd film && for w in $(seq 0 $((WORKERS-1))); do OUT="../$OUT" node tour.mjs $w $WORKERS 0 & done; wait )
OUTV=film/axiom-website.mp4
ffmpeg -y -loglevel error -framerate $FPS -i "$OUT/%04d.jpg" -vf "scale=1920:1080:flags=lanczos,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,format=yuv420p" -c:v libx264 -preset slow -crf 18 -movflags +faststart -an $OUTV
echo "xong: $OUTV"
