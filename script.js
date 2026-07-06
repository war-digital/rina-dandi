// ==============================================
// 1. GLOBAL INITIALIZATION & GUEST NAME PARSING
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    // Extract Guest Name from URL (?to=Name)
    const urlParams = new URLSearchParams(window.location.search);
    let guestName = urlParams.get('to');
    
    if (guestName) {
        // Sanitize and format guest name (e.g. replace + or %20 with space)
        guestName = decodeURIComponent(guestName.replace(/\+/g, ' '));
        document.getElementById('guest-name').textContent = guestName;
    } else {
        document.getElementById('guest-name').textContent = 'Tamu Undangan';
    }

    // Start slideshow for Cover 2
    initSlideshow();

    // Start slide-to-unlock gesture for Cover 1
    initSliderUnlock();

    // Load initial wishes and set up RSVP listener
    initRSVP();

    // Initialize Countdown Timer
    initCountdown();

    // Initialize Lightbox Gallery
    initLightbox();

    // Initialize Scroll Animations
    initScrollAnimations();
    
    // Setup Invitation Open Button
    initOpenButton();

    // Setup Music Controls
    initMusicControls();
});

// ==============================================
// 2. SLIDE-TO-UNLOCK LOGIC (COVER 1 -> COVER 2)
// ==============================================
function initSliderUnlock() {
    const container = document.getElementById('slider-container');
    const handle = document.getElementById('slider-handle');
    const bg = container.querySelector('.slider-bg');
    
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    
    // Calculate boundaries
    const getLimits = () => {
        const containerWidth = container.clientWidth;
        const handleWidth = handle.clientWidth;
        return containerWidth - handleWidth - 8; // 8px for padding/margins
    };

    // Drag handlers
    const startDrag = (e) => {
        isDragging = true;
        startX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
        handle.style.transition = 'none';
        bg.style.transition = 'none';
    };

    const drag = (e) => {
        if (!isDragging) return;
        if (e.type === 'touchmove' && e.cancelable) {
            e.preventDefault();
        }
        
        const clientX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
        const limit = getLimits();
        
        let deltaX = clientX - startX;
        
        // Boundaries
        if (deltaX < 0) deltaX = 0;
        if (deltaX > limit) deltaX = limit;
        
        currentX = deltaX;
        handle.style.left = (deltaX + 4) + 'px'; // 4px initial offset
        bg.style.width = (deltaX + 22) + 'px'; // width behind handle
        
        // Unlock if dragged more than 95%
        if (deltaX >= limit * 0.95) {
            unlock();
        }
    };

    const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        
        const limit = getLimits();
        
        // If not unlocked, bounce back
        if (currentX < limit * 0.95) {
            handle.style.transition = 'left 0.3s ease';
            bg.style.transition = 'width 0.3s ease';
            handle.style.left = '4px';
            bg.style.width = '0px';
            currentX = 0;
        }
    };

    const unlock = () => {
        isDragging = false;
        
        // Complete visual feedback
        const limit = getLimits();
        handle.style.left = (limit + 4) + 'px';
        bg.style.width = '100%';
        
        // Play click transition
        setTimeout(() => {
            const coverOne = document.getElementById('cover-one');
            const coverTwo = document.getElementById('cover-two');
            
            coverOne.classList.remove('active');
            coverTwo.classList.add('active');
            
            // Clean up event listeners
            removeListeners();
        }, 150);
    };

    // Add Listeners
    handle.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDrag);

    handle.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    function removeListeners() {
        handle.removeEventListener('mousedown', startDrag);
        window.removeEventListener('mousemove', drag);
        window.removeEventListener('mouseup', stopDrag);
        handle.removeEventListener('touchstart', startDrag);
        window.removeEventListener('touchmove', drag);
        window.removeEventListener('touchend', stopDrag);
    }
}

// ==============================================
// 3. COVER 2 SLIDESHOW LOGIC
// ==============================================
function initSlideshow() {
    const slides = document.querySelectorAll('.slideshow-container .slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000); // Transitions every 4 seconds
}

// ==============================================
// 3.1 MAIN BACKGROUND SLIDESHOW LOGIC
// ==============================================
let mainSlideshowInterval = null;

function startMainSlideshow() {
    const slides = document.querySelectorAll('#main-bg-slideshow .main-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    if (mainSlideshowInterval) clearInterval(mainSlideshowInterval);
    
    mainSlideshowInterval = setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 2500); // 2.5 seconds (fast but smooth transition)
}

// ==============================================
// 4. BUKA UNDANGAN BUTTON LOGIC (COVER 2 -> MAIN)
// ==============================================
function initOpenButton() {
    const btn = document.getElementById('btn-open-invitation');
    const audio = document.getElementById('wedding-audio');
    const coverTwo = document.getElementById('cover-two');
    const mainContent = document.getElementById('main-invitation');
    const musicDisc = document.getElementById('music-disc');
    const musicContainer = document.getElementById('music-player-container');

    btn.addEventListener('click', () => {
        // 1. Play Background Music with legacy browser promise checks
        if (audio) {
            const playPromise = audio.play();
            if (playPromise !== undefined && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    if (musicContainer) {
                        musicContainer.classList.add('animate-rotate-slow');
                        musicContainer.classList.remove('paused');
                    }
                }).catch(err => {
                    console.log("Autoplay was blocked or audio failed to load: ", err);
                });
            } else {
                // Fallback for legacy webviews that return undefined for play()
                if (musicContainer) {
                    musicContainer.classList.add('animate-rotate-slow');
                    musicContainer.classList.remove('paused');
                }
            }
        }

        // Start Main Background Slideshow
        startMainSlideshow();

        // 2. Hide Cover 2 with sliding transition
        coverTwo.classList.remove('active');
        
        // 3. Show main content
        mainContent.classList.remove('hidden');
        
        // Force reflow and add visible class for transition
        setTimeout(() => {
            mainContent.classList.add('visible');
            
            // Trigger entry animations for the main hero section
            const mainHero = document.getElementById('main-hero');
            if (mainHero) {
                mainHero.classList.add('hero-active');
            }
            
            // Trigger check for elements visible on start
            triggerScrollCheck();
        }, 50);
    });
}

// ==============================================
// 5. MUSIC PLAYER CONTROLLER
// ==============================================
function initMusicControls() {
    const musicBtn = document.getElementById('music-player-container');
    const audio = document.getElementById('wedding-audio');
    if (!musicBtn || !audio) return;

    musicBtn.addEventListener('click', () => {
        if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined && typeof playPromise.then === 'function') {
                playPromise.catch(err => console.log("Audio play failed: ", err));
            }
            musicBtn.classList.remove('paused');
        } else {
            audio.pause();
            musicBtn.classList.add('paused');
        }
    });
}

// ==============================================
// 6. COUNTDOWN TIMER
// ==============================================
function initCountdown() {
    // Target date: Sunday, 19 July 2026 09:00:00 WIB
    const targetDate = new Date('2026-07-19T09:00:00+07:00').getTime();

    const updateTimer = () => {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            clearInterval(timerInterval);
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        // Pad numbers with leading zero
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    };

    // Run once initially, then every second
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}

// ==============================================
// 7. LIGHTBOX GALLERY
// ==============================================
function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const overlay = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            lightboxImg.src = img.src;
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Lock scrolling
        });
    });

    const closeLightbox = () => {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto'; // Unlock scrolling
    };

    closeBtn.addEventListener('click', closeLightbox);
    
    // Close on clicking outside the image
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === closeBtn) {
            closeLightbox();
        }
    });

    // Close on ESC key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.style.display === 'block') {
            closeLightbox();
        }
    });
}

// ==============================================
// 8. RSVP & UCAPAN (LOCAL STORAGE)
// ==============================================
const defaultWishes = [
    {
        name: 'Rudi & Susi (Keluarga)',
        attendance: 'Hadir',
        wish: 'Barakallahu lakuma wa baraka alaikuma wa jamaa bainakuma fii khair. Selamat menempuh hidup baru Rina & Dandi! Semoga selalu dilimpahi sakinah, mawaddah, dan warahmah.',
        timestamp: Date.now() - 3600000 * 2 // 2 hours ago
    },
    {
        name: 'Budi Santoso',
        attendance: 'Hadir',
        wish: 'Selamat ya Dandi! Lancar-lancar sampai hari H. Bahagia selalu selamanya bersama Rina.',
        timestamp: Date.now() - 3600000 * 5 // 5 hours ago
    },
    {
        name: 'Siti Aminah',
        attendance: 'Tidak Hadir',
        wish: 'Selamat untuk kedua mempelai! Mohon maaf belum bisa hadir di hari bahagia kalian karena sedang ada tugas luar kota. Semoga dilancarkan semua acaranya dan berkah rumah tangganya.',
        timestamp: Date.now() - 3600000 * 24 // 1 day ago
    }
];

function initRSVP() {
    const form = document.getElementById('rsvp-form');
    const wishesList = document.getElementById('wishes-list');

    // Retrieve from localStorage or set defaults
    let storedWishes = JSON.parse(localStorage.getItem('wedding_wishes'));
    if (!storedWishes || storedWishes.length === 0) {
        storedWishes = defaultWishes;
        localStorage.setItem('wedding_wishes', JSON.stringify(storedWishes));
    }

    // Render wishes
    renderWishes(storedWishes);

    // Form submit listener
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('form-name');
        const attendanceInput = document.getElementById('form-attendance');
        const wishInput = document.getElementById('form-wish');

        const newWish = {
            name: nameInput.value.trim(),
            attendance: attendanceInput.value,
            wish: wishInput.value.trim(),
            timestamp: Date.now()
        };

        // Add to front of the array
        storedWishes.unshift(newWish);
        localStorage.setItem('wedding_wishes', JSON.stringify(storedWishes));

        // Re-render and reset form
        renderWishes(storedWishes);
        form.reset();

        // Highlight/scroll to the top of wishes board
        wishesList.scrollTop = 0;
    });
}

function renderWishes(wishes) {
    const container = document.getElementById('wishes-list');
    container.innerHTML = '';

    wishes.forEach(item => {
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-item';

        const statusClass = item.attendance.toLowerCase().replace(' ', '-');
        const formattedTime = formatRelativeTime(item.timestamp);

        wishCard.innerHTML = `
            <div class="wish-header">
                <span class="wish-name">${escapeHTML(item.name)}</span>
                <span class="wish-status ${statusClass}">${item.attendance}</span>
            </div>
            <p class="wish-text">${escapeHTML(item.wish)}</p>
            <div class="wish-time">${formattedTime}</div>
        `;

        container.appendChild(wishCard);
    });
}

function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ==============================================
// 9. SCROLL ANIMATIONS USING INTERSECTION OBSERVER
// ==============================================
function initScrollAnimations() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-active');
                    // Once animated, we don't need to observe it anymore
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px' // Trigger slightly before it enters fully
        });

        animateElements.forEach(el => observer.observe(el));
    } else {
        // Fallback for older browsers
        animateElements.forEach(el => el.classList.add('scroll-active'));
    }
}

// Helper to manually trigger check when opening
function triggerScrollCheck() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('scroll-active');
        }
    });
}

// ==============================================
// 10. CLIPBOARD COPY UTILITIES
// ==============================================
function copyToClipboard(elementId) {
    const textVal = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(textVal).then(() => {
        // Show temporary toast or feedback
        showToast("Nomor rekening berhasil disalin!");
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
    });
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Alamat berhasil disalin!");
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
    });
}

// Custom Toast popup creator
function showToast(message) {
    // Check if toast already exists
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        // Add toast styles dynamically
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%) translateY(20px)',
            backgroundColor: 'rgba(62, 52, 54, 0.95)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '30px',
            border: '1px solid #D4AF37',
            fontSize: '0.85rem',
            letterSpacing: '1px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: '9999',
            opacity: '0',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
        });
        document.body.appendChild(toast);
    }
    
    toast.innerText = message;
    
    // Show toast
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Hide toast after 2.5s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
}
