// App state
let capturedPhotos = [];
let totalPhotos = 0;
let currentPhotoIndex = 0;
let stream = null;
let videoElement = null;
let canvasElement = null;
let autoCaptureInterval = null;

// DOM elements
const setupScreen = document.getElementById('setup-screen');
const captureScreen = document.getElementById('capture-screen');
const galleryScreen = document.getElementById('gallery-screen');
const photoCountInput = document.getElementById('photo-count');
const startBtn = document.getElementById('start-btn');
const captureBtn = document.getElementById('capture-btn');
const doneBtn = document.getElementById('done-btn');
const showBtn = document.getElementById('show-btn');
const restartBtn = document.getElementById('restart-btn');
const captureStatus = document.getElementById('capture-status');
const currentCount = document.getElementById('current-count');
const totalCount = document.getElementById('total-count');
const photoGallery = document.getElementById('photo-gallery');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    videoElement = document.getElementById('video');
    canvasElement = document.getElementById('canvas');

    startBtn.addEventListener('click', startCapture);
    captureBtn.addEventListener('click', takePhoto);
    doneBtn.addEventListener('click', finishCapture);
    showBtn.addEventListener('click', showPhotos);
    restartBtn.addEventListener('click', restart);
});

// Start the capture process
async function startCapture() {
    totalPhotos = parseInt(photoCountInput.value);

    if (totalPhotos < 1) {
        alert('Please enter a valid number of photos (at least 1)');
        return;
    }

    currentPhotoIndex = 0;
    capturedPhotos = [];

    // Show capture screen
    showScreen('capture');

    // Request camera access
    try {
        await initializeCamera();
        captureBtn.style.display = 'none'; // Hide manual capture button
        totalCount.textContent = totalPhotos;
        currentCount.textContent = '0';

        // Start countdown before automatic capture
        await startCountdown();

        // Begin automatic photo capture
        startAutomaticCapture();
    } catch (error) {
        console.error('Error accessing camera:', error);
        captureStatus.textContent = 'Error accessing camera. Please ensure you have granted camera permissions.';
        alert('Could not access camera. Please check permissions and try again.');
    }
}

// Initialize camera with appropriate constraints
async function initializeCamera() {
    // Determine if we're on mobile/tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const constraints = {
        video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: isMobile ? { exact: "environment" } : "user"
        },
        audio: false
    };

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
        // If back camera fails on mobile, try front camera
        if (isMobile && error.name === 'OverconstrainedError') {
            constraints.video.facingMode = "user";
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
            throw error;
        }
    }

    videoElement.srcObject = stream;

    // Wait for video to be ready
    return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
            resolve();
        };
    });
}

// Countdown before starting automatic capture
async function startCountdown() {
    for (let i = 3; i > 0; i--) {
        captureStatus.textContent = `Starting in ${i}...`;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Start automatic photo capture
function startAutomaticCapture() {
    // Take first photo immediately
    takePhoto();

    // If more photos needed, set up interval
    if (totalPhotos > 1) {
        autoCaptureInterval = setInterval(() => {
            if (currentPhotoIndex < totalPhotos) {
                takePhoto();
            } else {
                clearInterval(autoCaptureInterval);
            }
        }, 1500); // 1.5 second delay between photos
    }
}

// Take a photo
function takePhoto() {
    if (!stream) {
        alert('Camera not initialized');
        return;
    }

    // Set canvas dimensions to match video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Draw the video frame to canvas
    const context = canvasElement.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Convert canvas to blob
    canvasElement.toBlob((blob) => {
        const photoData = {
            blob: blob,
            url: URL.createObjectURL(blob),
            timestamp: new Date().toISOString()
        };

        capturedPhotos.push(photoData);
        currentPhotoIndex++;
        currentCount.textContent = currentPhotoIndex;

        // Visual feedback
        captureBtn.textContent = ' Photo Captured';
        setTimeout(() => {
            captureBtn.textContent = 'Capture Photo';
        }, 500);

        // Check if we've captured all photos
        if (currentPhotoIndex >= totalPhotos) {
            captureStatus.textContent = `All ${totalPhotos} photos captured!`;
            clearInterval(autoCaptureInterval);
            // Automatically go to gallery after brief delay
            setTimeout(() => {
                finishCapture();
            }, 1000);
        } else {
            captureStatus.textContent = `Capturing photo ${currentPhotoIndex} of ${totalPhotos}...`;
        }
    }, 'image/jpeg', 0.95);
}

// Finish capture and stop camera
function finishCapture() {
    stopCamera();
    showScreen('gallery');
    // Don't display photos automatically - user must click "Show Photos"
    photoGallery.innerHTML = `<p class="no-photos">You have captured ${capturedPhotos.length} photo${capturedPhotos.length !== 1 ? 's' : ''}.<br>Click "Show Photos" to view them.</p>`;
}

// Stop camera stream
function stopCamera() {
    // Clear any active capture interval
    if (autoCaptureInterval) {
        clearInterval(autoCaptureInterval);
        autoCaptureInterval = null;
    }

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    videoElement.srcObject = null;
}

// Display captured photos in gallery
function displayPhotos() {
    photoGallery.innerHTML = '';

    if (capturedPhotos.length === 0) {
        photoGallery.innerHTML = '<p class="no-photos">No photos captured yet.</p>';
        return;
    }

    capturedPhotos.forEach((photo, index) => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';

        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = `Photo ${index + 1}`;

        const downloadBtn = document.createElement('a');
        downloadBtn.href = photo.url;
        downloadBtn.download = `photo_${index + 1}_${Date.now()}.jpg`;
        downloadBtn.className = 'btn btn-download';
        downloadBtn.textContent = `Download Photo ${index + 1}`;

        photoCard.appendChild(img);
        photoCard.appendChild(downloadBtn);
        photoGallery.appendChild(photoCard);
    });
}

// Show photos (when clicking show button)
function showPhotos() {
    displayPhotos();
}

// Restart the app
function restart() {
    // Clear any active capture interval
    if (autoCaptureInterval) {
        clearInterval(autoCaptureInterval);
        autoCaptureInterval = null;
    }

    // Clean up old photo URLs
    capturedPhotos.forEach(photo => {
        URL.revokeObjectURL(photo.url);
    });

    capturedPhotos = [];
    currentPhotoIndex = 0;
    totalPhotos = 0;

    captureBtn.disabled = true;
    captureBtn.style.display = 'inline-block'; // Reset button visibility
    doneBtn.style.display = 'none';
    photoGallery.innerHTML = '';

    showScreen('setup');
}

// Show specific screen
function showScreen(screenName) {
    setupScreen.classList.remove('active');
    captureScreen.classList.remove('active');
    galleryScreen.classList.remove('active');

    switch (screenName) {
        case 'setup':
            setupScreen.classList.add('active');
            break;
        case 'capture':
            captureScreen.classList.add('active');
            break;
        case 'gallery':
            galleryScreen.classList.add('active');
            break;
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopCamera();
    capturedPhotos.forEach(photo => {
        URL.revokeObjectURL(photo.url);
    });
});
