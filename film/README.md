# Quay video trang AXIOM

Quay trang web thật (chạy bản build `dist`) bằng Playwright: mỗi khung hình là một ảnh chụp trang ở thời điểm *t* của kịch bản,
rồi ghép bằng ffmpeg. Kịch bản ở `tour.mjs` (hàm theo thời gian: cuộn, đổi màu sơn, rê chuột trong buồng lái, chọn concept AI).

```
./film/record.sh                       # 1920x1080, 15 khung/giây gốc -> 30 khung/giây, ~45 giây
SCALE=0.55 ./film/record.sh            # bản ngắn ~25 giây
GPU=1 WORKERS=2 ./film/record.sh       # máy có GPU NVIDIA + thư viện EGL
LITE=1 WIDTH=1280 HEIGHT=720 ./film/record.sh   # tắt AO/bloom cho máy yếu
```

Trên máy không GPU (Chrome vẽ bằng CPU): khoảng 20 giây/khung ở 1280x720 (LITE) và 47 giây/khung đủ hiệu ứng, với 4 nhân.
Ghi chú: Kaggle không dùng được (container có GPU compute nhưng không có thư viện đồ hoạ nên Chrome vẫn vẽ bằng CPU).
