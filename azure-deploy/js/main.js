// Main JavaScript file for Upington Mainz website
// Handles GSAP animations, form submissions, and interactive elements

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Initialize GSAP animations
    initializeAnimations();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize forms
    initializeForms();
    
    // Initialize particles animation
    initializeParticles();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize carousel
    initializeCarousel();
}

// GSAP Animations
function initializeAnimations() {
    if (typeof gsap === 'undefined') return;
    
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero text reveal animation
    const heroAnimateElements = document.querySelectorAll('.hero-animate');
    if (heroAnimateElements.length > 0) {
        gsap.fromTo(heroAnimateElements, {
            y: 40,
            opacity: 0
        }, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.08,
            delay: 0.5,
            ease: "power2.out"
        });
    }
    
    // Animate cards on scroll
    const cards = document.querySelectorAll('.bg-white, .rounded-2xl');
    if (cards.length > 0) {
        gsap.fromTo(cards, {
            y: 40,
            opacity: 0
        }, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            scrollTrigger: {
                trigger: cards[0],
                start: 'top 80%',
                toggleActions: "play none none reverse"
            }
        });
    }
    
    // Animated blob effects
    animateBlobs();
    
    // Parallax effects for mobile performance
    if (window.innerWidth > 768) {
        initializeParallax();
    }
}

// Animated background blobs
function animateBlobs() {
    const blobs = document.querySelectorAll('.animated-blob');
    
    blobs.forEach((blob, index) => {
        gsap.to(blob, {
            x: "random(-100, 100)",
            y: "random(-100, 100)",
            rotation: "random(-360, 360)",
            scale: "random(0.8, 1.2)",
            duration: "random(6, 12)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * 2
        });
    });
}

// Parallax effects
function initializeParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');
    
    parallaxElements.forEach(element => {
        gsap.to(element, {
            yPercent: -50,
            ease: "none",
            scrollTrigger: {
                trigger: element,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });
}

// Particles animation
function initializeParticles() {
    const animatedBg = document.getElementById('animated-bg');
    if (!animatedBg) return;
    
    // Create floating particles
    const particleCount = window.innerWidth > 768 ? 50 : 25; // Fewer particles on mobile
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(animatedBg);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random positioning
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    // Random animation duration
    const duration = Math.random() * 20 + 10; // 10-30 seconds
    
    container.appendChild(particle);
    
    // Animate particle
    gsap.to(particle, {
        x: "random(-200, 200)",
        y: "random(-200, 200)",
        opacity: "random(0.1, 0.8)",
        duration: duration,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isHidden = mobileMenu.classList.contains('hidden');
            
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
                gsap.fromTo(mobileMenu, {
                    opacity: 0,
                    y: -10
                }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            } else {
                gsap.to(mobileMenu, {
                    opacity: 0,
                    y: -10,
                    duration: 0.3,
                    ease: "power2.in",
                    onComplete: function() {
                        mobileMenu.classList.add('hidden');
                    }
                });
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
                if (!mobileMenu.classList.contains('hidden')) {
                    gsap.to(mobileMenu, {
                        opacity: 0,
                        y: -10,
                        duration: 0.3,
                        ease: "power2.in",
                        onComplete: function() {
                            mobileMenu.classList.add('hidden');
                        }
                    });
                }
            }
        });
    }
}

// Form handling
function initializeForms() {
    // Appointment form
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentSubmission);
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
    
    // Add input focus animations
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            gsap.to(this, {
                scale: 1.02,
                duration: 0.2,
                ease: "power2.out"
            });
        });
        
        input.addEventListener('blur', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
            });
        });
    });
}

// Handle appointment form submission
function handleAppointmentSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {};
    
    // Collect form data
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Validate required fields
    const requiredFields = ['fullName', 'phone', 'city', 'state', 'postalCode', 'county', 'meetingType', 'appointmentType', 'consent'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
        showFormError('Please fill in all required fields.');
        return;
    }
    
    // Simulate form submission (in production, send to server)
    showFormLoading();
    
    setTimeout(() => {
        // Store in localStorage for demo purposes
        const submissions = JSON.parse(localStorage.getItem('appointmentSubmissions') || '[]');
        submissions.push({
            ...data,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
        localStorage.setItem('appointmentSubmissions', JSON.stringify(submissions));
        
        // Show success message
        showFormSuccess();
        event.target.reset();
    }, 2000);
}

// Handle contact form submission
function handleContactSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Simulate submission
    showFormLoading();
    
    setTimeout(() => {
        const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
        submissions.push({
            ...data,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
        localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
        
        showFormSuccess();
        event.target.reset();
    }, 2000);
}

// Form feedback functions
function showFormLoading() {
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.disabled = true;
        button.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i>Submitting...';
        lucide.createIcons();
    });
}

function showFormSuccess() {
    const formSuccess = document.getElementById('form-success');
    if (formSuccess) {
        formSuccess.classList.remove('hidden');
        gsap.fromTo(formSuccess, {
            opacity: 0,
            y: 20
        }, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
        });
        
        // Scroll to success message
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            gsap.to(formSuccess, {
                opacity: 0,
                y: -20,
                duration: 0.5,
                ease: "power2.in",
                onComplete: function() {
                    formSuccess.classList.add('hidden');
                }
            });
        }, 5000);
    }
    
    // Reset submit buttons
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.textContent;
    });
}

function showFormError(message) {
    // Create or update error message
    let errorDiv = document.getElementById('form-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'form-error';
        errorDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-4 mt-4';
        
        const form = document.querySelector('form');
        if (form) {
            form.appendChild(errorDiv);
        }
    }
    
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i data-lucide="alert-circle" class="w-5 h-5 text-red-600 mr-3"></i>
            <p class="text-red-800">${message}</p>
        </div>
    `;
    
    errorDiv.classList.remove('hidden');
    lucide.createIcons();
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }, 5000);
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                event.preventDefault();
                
                const offsetTop = target.offsetTop - 80; // Account for fixed header
                
                gsap.to(window, {
                    duration: 1,
                    scrollTo: { y: offsetTop, autoKill: false },
                    ease: "power2.inOut"
                });
            }
        });
    });
}

// Carousel functionality for Solutions Grid
function initializeCarousel() {
    const carousel = document.querySelector('.carousel-container');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    
    if (slides.length === 0) return;
    
    let currentGroup = 0;
    const totalGroups = 2; // We have 2 groups: Group 1 (first 3 cards) and Group 2 (last 2 cards)
    
    // Initialize carousel state
    updateCarousel();
    
    // Indicator event listeners (optional - allows manual control)
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentGroup = index;
            updateCarousel();
            resetAutoPlay(); // Reset the timer when user manually changes slide
        });
    });
    
    // Auto-play functionality - advance every 6 seconds
    let autoPlayInterval;
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            currentGroup = (currentGroup + 1) % totalGroups;
            updateCarousel();
        }, 6000); // Change slide every 6 seconds - gives users time to read
    }
    
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    }
    
    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }
    
    // Start auto-play
    startAutoPlay();
    
    // Pause auto-play on hover, resume on leave
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    
    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay(); // Stop auto-play during touch interaction
    });
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay(); // Resume auto-play after touch interaction
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next group
                currentGroup = (currentGroup + 1) % totalGroups;
            } else {
                // Swipe right - previous group
                currentGroup = (currentGroup - 1 + totalGroups) % totalGroups;
            }
            updateCarousel();
        }
    }
    
    // Update carousel display
    function updateCarousel() {
        // Calculate the offset for the current group
        // We have 5 cards total: [Medicare, Life, Family, Annuities, Ancillary]
        // Group 0: show cards 0-2 (Medicare, Life, Family)
        // Group 1: show cards 2-4 (Family, Annuities, Ancillary) - overlap Family for continuity
        let offset;
        if (currentGroup === 0) {
            offset = 0; // Show first 3 cards starting from position 0
        } else {
            // Move to show cards starting from position 2 (Family card)
            // Since each card is ~33.33% width, move 2 cards = 66.67%
            offset = -66.67; // This should show Family, Annuities, Ancillary
        }
        
        // Move the carousel track
        const track = carousel.querySelector('.carousel-track');
        if (track) {
            if (typeof gsap !== 'undefined') {
                // Use GSAP for smooth animation if available
                gsap.to(track, {
                    duration: 0.5,
                    x: `${offset}%`,
                    ease: "power2.inOut"
                });
            } else {
                // Fallback to CSS transform
                track.style.transform = `translateX(${offset}%)`;
                track.style.transition = 'transform 0.5s ease-in-out';
            }
        }
        
        // Update active indicator
        indicators.forEach((indicator, index) => {
            if (index === currentGroup) {
                indicator.classList.add('bg-blue-600');
                indicator.classList.remove('bg-gray-300');
            } else {
                indicator.classList.add('bg-gray-300');
                indicator.classList.remove('bg-blue-600');
            }
        });
    }
    
    // Keyboard navigation (optional)
    document.addEventListener('keydown', (e) => {
        // Only handle keys if carousel is in viewport
        const rect = carousel.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                currentGroup = (currentGroup - 1 + totalGroups) % totalGroups;
                updateCarousel();
                resetAutoPlay();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                currentGroup = (currentGroup + 1) % totalGroups;
                updateCarousel();
                resetAutoPlay();
            }
        }
    });
}

// FAQ functionality (for pages that have FAQs)
function initializeFAQ() {
    const faqButtons = document.querySelectorAll('.faq-button');
    
    faqButtons.forEach(button => {
        button.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('[data-lucide="chevron-down"]');
            const isOpen = !content.classList.contains('hidden');
            
            // Close all other FAQs
            faqButtons.forEach(otherButton => {
                if (otherButton !== this) {
                    const otherContent = otherButton.nextElementSibling;
                    const otherIcon = otherButton.querySelector('[data-lucide="chevron-down"]');
                    
                    if (!otherContent.classList.contains('hidden')) {
                        gsap.to(otherContent, {
                            height: 0,
                            opacity: 0,
                            duration: 0.3,
                            ease: "power2.inOut",
                            onComplete: function() {
                                otherContent.classList.add('hidden');
                                otherContent.style.height = 'auto';
                            }
                        });
                        
                        gsap.to(otherIcon, {
                            rotation: 0,
                            duration: 0.3,
                            ease: "power2.inOut"
                        });
                    }
                }
            });
            
            // Toggle current FAQ
            if (isOpen) {
                gsap.to(content, {
                    height: 0,
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.inOut",
                    onComplete: function() {
                        content.classList.add('hidden');
                        content.style.height = 'auto';
                    }
                });
                
                gsap.to(icon, {
                    rotation: 0,
                    duration: 0.3,
                    ease: "power2.inOut"
                });
            } else {
                content.classList.remove('hidden');
                const contentHeight = content.scrollHeight;
                
                gsap.fromTo(content, {
                    height: 0,
                    opacity: 0
                }, {
                    height: contentHeight,
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.inOut",
                    onComplete: function() {
                        content.style.height = 'auto';
                    }
                });
                
                gsap.to(icon, {
                    rotation: 180,
                    duration: 0.3,
                    ease: "power2.inOut"
                });
            }
        });
    });
}

// Performance optimization: Reduce animations on low-end devices
function checkPerformance() {
    // Simple performance check
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
        document.body.offsetHeight; // Force reflow
    }
    const end = performance.now();
    
    // If operation takes more than 50ms, reduce animations
    if (end - start > 50) {
        document.body.classList.add('reduced-motion');
        // Disable some heavy animations only if ScrollTrigger is available
        if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.config) {
            ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });
        }
    }
}

// Initialize performance check
if (typeof performance !== 'undefined') {
    checkPerformance();
}

// Export functions for use in other scripts
window.UpingtonMainz = {
    initializeFAQ,
    showFormSuccess,
    showFormError,
    showFormLoading,
    initializeCarousel
};
