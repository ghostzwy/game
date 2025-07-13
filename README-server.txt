 Untuk menjalankan server lokal agar file HTML/JS/CSS bisa diakses dengan benar, gunakan salah satu cara berikut:

**1. Dengan Python (paling mudah, tidak perlu install tambahan jika sudah ada Python):**
- Buka terminal/cmd di folder `c:\Users\danan\Downloads\New folder`
- Jalankan:
  python -m http.server 8000
- Akses di browser: http://localhost:8000/dist/index.html

**2. Dengan Node.js (pakai http-server):**
- Install dulu (sekali saja):
  npm install -g http-server
- Jalankan di folder project:
  http-server
- Akses di browser: http://localhost:8080/dist/index.html

**3. Dengan Live Server (VSCode extension):**
- Klik kanan file `index.html` → "Open with Live Server"

**Catatan:**
- Jangan buka file HTML langsung dengan double-click (file:///...), karena fetch, import, dan audio/video sering gagal.
- Pastikan semua asset (audio, gambar, js, css) path-nya benar relatif terhadap root server.

