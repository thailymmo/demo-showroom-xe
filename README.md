# AXIOM One — showroom xe điện

Xe điện dựng bằng code (three.js), đổi màu sơn, camera đi vòng theo cuộn, thông số, cấu hình giá

Trang mẫu của TLHUB. Nội dung, số liệu và tên thương hiệu là dữ liệu mẫu; ảnh sinh bằng SDXL-Turbo (không có người, không có chữ).

```
npm install
npm run dev
npm run build    # ra thư mục dist (tĩnh)
npm start        # chạy bản build
```

Công nghệ: Vite, three.js, GSAP + ScrollTrigger, Lenis.

## Ghi nguồn
- Mô hình xe **"Car Concept"**: nguồn gốc *Free Concept Car 004* của Unity Fan (CC0), tối ưu hoá và chuyển glTF bởi Eric Chadwick, Darmstadt Graphics Group / Khronos Group (glTF-Sample-Assets), giấy phép **CC BY 4.0**. Logo Khronos nằm ngoài giấy phép (biển số đã được ẩn).
- HDRI `photo_studio_loft_hall` (Sergej Majboroda), Poly Haven, **CC0**.
- Ảnh concept xe, ảnh khoang lái và các khối 3D "Phòng thiết kế AI" do AI sinh (Stable Diffusion XL, Hunyuan3D-2 mini); ảnh render và video xe chạy dựng bằng Blender Cycles.
- Tên thương hiệu "AXIOM", nội dung và số liệu là dữ liệu mẫu. Trang mẫu do TLHUB thiết kế.
