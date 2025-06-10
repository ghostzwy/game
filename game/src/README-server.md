# Cara Menjalankan Server Lokal

**1. Dengan Python (paling mudah, jika sudah ada Python):**
- Buka terminal/cmd di folder `c:\Users\danan\Downloads\New folder\game\src`
- Jalankan:
  ```
  python -m http.server 8000
  ```
- Buka browser dan akses:  
  http://localhost:8000/html/index.html

---

**2. Dengan Node.js (pakai http-server):**
- Install dulu (sekali saja):
  ```
  npm install -g http-server
  ```
- Jalankan di folder project:
  ```
  http-server
  ```
- Buka browser dan akses:  
  http://localhost:8080/html/index.html

---

**3. Dengan Live Server (VSCode extension):**
- Klik kanan file `index.html` → "Open with Live Server"

---

**Catatan:**
- Jangan buka file HTML langsung dengan double-click (file:///...), karena fetch, import, dan audio/video sering gagal.
- Pastikan semua asset (audio, gambar, js, css) path-nya benar relatif terhadap root server.
