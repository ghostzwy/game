// Buat dan tambahkan style untuk pesan orientasi
const style = document.createElement('style');
style.textContent = `
.orientation-message {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: white;
    font-family: Arial, sans-serif;
}

.orientation-message p {
    font-size: 24px;
    text-align: center;
    margin: 20px;
}
`;
document.head.appendChild(style);

// Buat dan tambahkan elemen pesan orientasi
const orientationDiv = document.createElement('div');
orientationDiv.id = 'orientation-message';
orientationDiv.className = 'orientation-message';
orientationDiv.innerHTML = `
    <p>Silakan Putar Perangkat Anda</p>
`;
document.body.appendChild(orientationDiv);

function checkOrientation() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const orientationMessage = document.getElementById('orientation-message');
    
    if (!isMobile) {
        // Sembunyikan warning di desktop/laptop
        if (orientationMessage) {
            orientationMessage.style.display = 'none';
        }
        return;
    }

    // Tampilkan warning jika portrait di mobile
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

// Event listeners
window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
