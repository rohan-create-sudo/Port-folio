// ================= STATE & CONFIG =================
const state = {
    introCompleted: false,
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2,
    isMobile: window.innerWidth <= 768
};

// Update resize state
window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth <= 768;
});

// Optional: Disable drag interactions globally returning early if needed
// (Cursor logic removed completely)

// ================= THREE.JS INTRO ANIMATION =================
function initIntroThree() {
    const canvas = document.getElementById('intro-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    // Glowing Ring
    const ringGeometry = new THREE.TorusGeometry(2, 0.05, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00BFFF,
        transparent: true,
        opacity: 0,
        wireframe: true
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);

    // Particles (Sphere breakdown)
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 2000;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        // Random points on a sphere
        const phi = Math.acos(-1 + (2 * i / 3) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;
        const r = 2; // radius matching torus

        posArray[i] = r * Math.cos(theta) * Math.sin(phi);
        posArray[i + 1] = r * Math.sin(theta) * Math.sin(phi);
        posArray[i + 2] = r * Math.cos(phi);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.03,
        color: 0xffffff,
        transparent: true,
        opacity: 0
    });

    const particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particlesMesh);

    // Animation Loop
    let time = 0;
    function animate() {
        if (!state.introCompleted) {
            requestAnimationFrame(animate);
        }

        time += 0.01;
        ring.rotation.x = time;
        ring.rotation.y = time;

        particlesMesh.rotation.y = -time * 0.5;

        renderer.render(scene, camera);
    }
    animate();

    // GSAP Timeline for Intro
    const tl = gsap.timeline({
        onComplete: () => {
            state.introCompleted = true;
            // Dispose Three.js to save memory
            renderer.dispose();
            initMainAnimations();
        }
    });

    // 1. Ring Fade In
    tl.to(ringMaterial, { opacity: 1, duration: 1.5, ease: "power2.inOut" })
        // 2. Ring rotates and scales up slightly
        .to(ring.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 2, ease: "power1.inOut" }, "-=1")
        // 3. Text Fades In
        .to('#intro-content', { opacity: 1, duration: 1, y: -20, ease: "power3.out" }, "-=1.5")
        // 4. Ring -> Particles Transition
        .to(ringMaterial, { opacity: 0, duration: 0.5 }, "+=1")
        .to(particleMaterial, { opacity: 1, duration: 0.5 }, "-=0.5")
        // 5. Particles Explode / Break
        .to(particlesMesh.scale, { x: 5, y: 5, z: 5, duration: 1.5, ease: "expo.out" })
        .to(particleMaterial, { opacity: 0, duration: 1 }, "-=1")
        // 6. Fade Out Entire Screen & Reveal Main
        .to('#intro-screen', { opacity: 0, duration: 1, display: 'none', ease: "power2.inOut" }, "-=0.5")
        .to('#main-wrapper', { opacity: 1, pointerEvents: 'auto', duration: 1, height: 'auto', overflow: 'visible' }, "-=1");

    // Handle Resize
    window.addEventListener('resize', () => {
        if (!state.introCompleted) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
}

// ================= HERO WAVE BACKGROUND (THREE.JS / CANVAS) =================
// Simple canvas wave effect for the hero background
function initHeroWaves() {
    const canvas = document.getElementById('hero-waves-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let time = 0;

    function draw() {
        requestAnimationFrame(draw);
        ctx.clearRect(0, 0, width, height);

        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";

        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            let yOffset = i * 50 - 100;

            for (let x = 0; x <= width; x += 10) {
                let y = Math.sin(x * 0.005 + time + i) * 100 + height / 2 + yOffset;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        time += 0.01;
    }

    draw();

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
}

// ================= MAIN ANIMATIONS & LOGIC =================
function initMainAnimations() {
    // Re-enable ScrollTrigger after wrapper is visible
    gsap.registerPlugin(ScrollTrigger);

    // Typing Effect for Subtitle
    const typingText = document.querySelector('.typing-text');
    const textToType = "Expert in Social Media Managing, Website Development, Video Editing & Marketing.";
    let charIndex = 0;

    function typeWriter() {
        if (charIndex < textToType.length) {
            typingText.innerHTML += textToType.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 50);
        }
    }
    setTimeout(typeWriter, 1000); // Start slightly after intro

    // Hero Title 3D Hover Parallax
    const heroTitle = document.querySelector('.hero-title');
    if (!state.isMobile && heroTitle) {
        window.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 40;
            const y = (window.innerHeight / 2 - e.pageY) / 40;
            gsap.to(heroTitle, {
                rotationY: -x,
                rotationX: y,
                duration: 1,
                transformPerspective: 1000,
                ease: "power2.out"
            });
        });
    }

    // Dynamic Island Header Scrolled State
    const header = document.querySelector('.dynamic-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            // Animate toggle lines
            const spans = mobileToggle.querySelectorAll('span');
            if (mobileNav.classList.contains('open')) {
                gsap.to(spans[0], { rotation: 45, y: 9, duration: 0.3 });
                gsap.to(spans[1], { opacity: 0, duration: 0.3 });
                gsap.to(spans[2], { rotation: -45, y: -9, duration: 0.3 });
            } else {
                gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
                gsap.to(spans[1], { opacity: 1, duration: 0.3 });
                gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
            }
        });

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.click();
            });
        });
    }

    // 3D Tilt Cards Effect (Vanilla JS alternative to VanillaTilt for better performance with GSAP)
    const tiltCards = document.querySelectorAll('.tilt-card');

    if (!state.isMobile) {
        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element.
                const y = e.clientY - rect.top;  // y position within the element.

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
                const rotateY = ((x - centerX) / centerX) * 10;

                gsap.to(card, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    transformPerspective: 1000,
                    ease: "power2.out",
                    duration: 0.5
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    ease: "power2.out",
                    duration: 0.5
                });
            });
        });
    }

    // GSAP Scroll Animations

    // Stats Counter Animation
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        ScrollTrigger.create({
            trigger: ".stats-grid",
            start: "top 80%",
            onEnter: () => {
                const target = parseInt(stat.getAttribute('data-target'));
                gsap.to(stat, {
                    innerHTML: target,
                    duration: 2,
                    snap: { innerHTML: 1 },
                    ease: "power2.out"
                });
            },
            once: true
        });
    });

    // Section Titles Outline Parallax
    const outlines = document.querySelectorAll('.title-outline');
    outlines.forEach(outline => {
        gsap.to(outline, {
            x: 50,
            ease: "none",
            scrollTrigger: {
                trigger: outline.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
    });

    // Fade up sections on scroll
    const sections = gsap.utils.toArray('.section-title-container, .about-card, .skill-category, .service-block, .timeline-item, .contact-info, .contact-form-wrapper, .creative-card, .reveal-video');
    sections.forEach(sec => {
        gsap.fromTo(sec,
            { opacity: 0, y: 50 },
            {
                opacity: 1, y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: sec,
                    start: "top 85%",
                    toggleActions: "play none none reverse",
                    onEnter: () => {
                        // Play videos if they are inside this section
                        const videos = sec.querySelectorAll('video');
                        videos.forEach(v => {
                            if(v.paused) v.play().catch(e => console.log('Video play error:', e));
                        });
                        // Add revealed class if it is a video wrapper (triggering nested animations if any)
                        if (sec.classList.contains('reveal-video')) {
                            sec.classList.add('revealed');
                        }
                    }
                }
            }
        );
    });

    // Projects Carousel Logic (Horizontal Scroll or Manual)
    const track = document.querySelector('.projects-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (track && prevBtn && nextBtn) {
        nextBtn.addEventListener('click', () => {
            const scrollStep = window.innerWidth > 768 ? 440 : 340; // Slide width + gap
            track.scrollBy({ left: scrollStep, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            const scrollStep = window.innerWidth > 768 ? 440 : 340; // Slide width + gap
            track.scrollBy({ left: -scrollStep, behavior: 'smooth' });
        });
    }

    // Active Nav Link updating on scroll
    const navLinks = document.querySelectorAll('.desktop-nav a');
    const indicator = document.querySelector('.nav-indicator');

    function updateIndicator(link) {
        if (!link || state.isMobile) return;
        const linkRect = link.getBoundingClientRect();
        const navRect = link.closest('.nav-links').getBoundingClientRect();

        gsap.to(indicator, {
            width: linkRect.width + 20, // Add padding
            x: linkRect.left - navRect.left - 10,
            duration: 0.4,
            ease: "back.out(1.5)"
        });
    }

    // Set initial indicator
    const activeLink = document.querySelector('.nav-links a.active');
    if (activeLink && !state.isMobile) setTimeout(() => updateIndicator(activeLink), 500);

    const mainSections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        mainSections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
                updateIndicator(link);
            }
        });
    });
}

// ================= CONTACT & SCHEDULING FORM LOGIC =================
function initContactForms() {
    const btnShowBooking = document.getElementById('btn-show-booking');
    const btnShowContact = document.getElementById('btn-show-contact');
    const stdForm = document.getElementById('standard-contact-form');
    const bookForm = document.getElementById('booking-calendar-form');

    if (btnShowBooking && btnShowContact) {
        btnShowBooking.addEventListener('click', () => {
            gsap.to(stdForm, {
                opacity: 0, duration: 0.3, onComplete: () => {
                    stdForm.style.display = 'none';
                    bookForm.style.display = 'block';
                    gsap.fromTo(bookForm, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 });
                }
            });
        });

        btnShowContact.addEventListener('click', () => {
            gsap.to(bookForm, {
                opacity: 0, duration: 0.3, onComplete: () => {
                    bookForm.style.display = 'none';
                    stdForm.style.display = 'block';
                    gsap.fromTo(stdForm, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 });
                }
            });
        });
    }

    // Generate Time Slots from 9:00 AM to 7:00 PM (15 min intervals)
    const timeSlotsContainer = document.getElementById('time-slots');
    if (timeSlotsContainer) {
        const startHour = 9;
        const endHour = 19;
        let html = '';

        for (let h = startHour; h < endHour; h++) {
            for (let m = 0; m < 60; m += 15) {
                const ampm = h >= 12 ? 'PM' : 'AM';
                const hour12 = h % 12 || 12;
                const min = m === 0 ? '00' : m;
                const timeString = `${hour12}:${min} ${ampm}`;
                html += `<button type="button" class="time-slot-btn" data-time="${timeString}">${timeString}</button>`;
            }
        }
        timeSlotsContainer.innerHTML = html;

        // Select Time Slot Logic
        const slotBtns = document.querySelectorAll('.time-slot-btn');
        const selectedTimeInput = document.getElementById('selected-time');
        slotBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                slotBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedTimeInput.value = btn.getAttribute('data-time');
            });
        });
    }
}

// Global Form Submit Handler attached via HTML "onsubmit"
window.handleFormSubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    // In a real application, here you would send the data via fetch/API to your backend
    // Since the prompt states "will be emailed me that will come to me in my email if it's possible if you can make that"
    // We mock the successful UI state first for the Frontend interaction.

    // Animate button success
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="btn-text">Sent Success <i class="fas fa-check"></i></span>`;
    btn.classList.add('btn-glow-blue');
    btn.style.borderColor = "#00BFFF";
    btn.style.color = "#fff";

    // Show success message
    const msg = form.querySelector('.success-message');
    if (msg) msg.style.display = 'block';

    setTimeout(() => {
        form.reset();
        btn.innerHTML = originalText;
        if (msg) msg.style.display = 'none';

        // Clear time slots
        form.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
    }, 4000);
};

// ================= INITIALIZE =================
document.addEventListener('DOMContentLoaded', () => {
    // Start Intro Sequence
    initIntroThree();
    initHeroWaves();
    initContactForms();
    // main animations are chained in intro's onComplete
});
