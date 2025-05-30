function checkOrientation() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const orientationMessage = document.getElementById('orientation-message');
    
    if (!isMobile) {
        // Jika bukan perangkat mobile, sembunyikan pesan orientasi
        if (orientationMessage) {
            orientationMessage.style.display = 'none';
        }
        return;
    }

    // Hanya tampilkan pesan orientasi untuk perangkat mobile
    if (window.innerHeight > window.innerWidth) {
        if (orientationMessage) {
            orientationMessage.style.display = 'flex';
        }
    } else {
        if (orientationMessage) {
            orientationMessage.style.display = 'none';
        }
    }
}

// Panggil saat halaman dimuat
window.addEventListener('load', checkOrientation);
// Panggil saat orientasi berubah
window.addEventListener('resize', checkOrientation);
