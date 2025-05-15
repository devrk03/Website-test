/**
 * Parallax Chronicles Website
 * A high-performance, interactive website with scroll-based video animation
 * 
 * Features:
 * - Frame-by-frame scroll animation
 * - Image preloading for smooth performance
 * - Interactive photo gallery with fullscreen viewing
 * - Smooth scrolling navigation
 * - Responsive design for all devices
 * - Parallax effects and animations
 */

/**
 * Preloader for loading all images before displaying the website
 */
class Preloader {
    constructor() {
        this.preloader = document.getElementById('preloader');
        this.progressText = document.querySelector('.loading-progress');
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.imageAssets = [
            'Logo1.png',
            'photos/background1.png',
            'photos/photo1.png',
            'photos/photo2.png',
            'photos/photo3.png',
            'photos/photo4.png'
        ];
        
        // Add all video frames (1-47) to the preload list
        for (let i = 1; i <= 47; i++) {
            this.imageAssets.push(`Video1/Frame${i}.jpeg`);
        }
        
        this.totalAssets = this.imageAssets.length;
    }
    
    /**
     * Initialize the preloader
     */
    init() {
        this.loadAssets();
        return this; // Enable method chaining
    }
    
    /**
     * Load all assets and track progress
     */
    loadAssets() {
        if (this.totalAssets === 0) {
            this.hidePreloader();
            return;
        }
        
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                
                img.onload = () => {
                    this.loadedAssets++;
                    this.updateProgress();
                    resolve(img);
                };
                
                img.onerror = (err) => {
                    console.error(`Failed to load image: ${src}`);
                    this.loadedAssets++;
                    this.updateProgress();
                    // Resolve anyway to continue loading other assets
                    resolve(null);
                };
            });
        };
        
        // Load all images concurrently but limit concurrent requests
        const batchSize = 5;
        const loadBatch = async (startIndex) => {
            const batch = [];
            const endIndex = Math.min(startIndex + batchSize, this.imageAssets.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                batch.push(loadImage(this.imageAssets[i]));
            }
            
            await Promise.all(batch);
            
            if (endIndex < this.imageAssets.length) {
                // Load next batch
                await loadBatch(endIndex);
            } else {
                // All assets loaded
                setTimeout(() => {
                    this.hidePreloader();
                }, 500);
            }
        };
        
        // Start loading the first batch
        loadBatch(0);
        
        // Fallback in case some assets fail to load
        setTimeout(() => {
            if (this.preloader.style.opacity !== '0') {
                console.warn('Preloader timeout - forcing hide after 10 seconds');
                this.hidePreloader();
            }
        }, 10000);
    }
    
    /**
     * Update the progress indicator
     */
    updateProgress() {
        const progress = Math.round((this.loadedAssets / this.totalAssets) * 100);
        this.progressText.textContent = `${progress}%`;
    }
    
    /**
     * Hide the preloader with a fade-out animation
     */
    hidePreloader() {
        this.preloader.style.opacity = '0';
        this.preloader.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            this.preloader.style.display = 'none';
            document.body.style.overflow = 'visible';
            
            // Initialize other components after preloader is hidden
            this.initWebsite();
        }, 500);
    }
    
    /**
     * Initialize website components after preloading
     */
    initWebsite() {
        // Initialize ScrollAnimation
        const scrollAnimation = new ScrollAnimation().init();
        
        // Initialize Gallery
        const gallery = new Gallery().init();
        
        // Initialize Navigation
        const navigation = new Navigation().init();
        
        // Initialize observers for animations
        this.initObservers();
    }
    
    /**
     * Initialize IntersectionObserver for scroll-triggered animations
     */
    initObservers() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const handleIntersect = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Once the animation has triggered, stop observing
                    observer.unobserve(entry.target);
                }
            });
        };
        
        const observer = new IntersectionObserver(handleIntersect, observerOptions);
        
        // Observe elements that should animate on scroll
        document.querySelectorAll('.character-section, .gallery-item').forEach(el => {
            observer.observe(el);
        });
    }
}

/**
 * Handles frame-by-frame animation based on scroll position
 */
class ScrollAnimation {
    constructor() {
        this.frameContainer = document.querySelector('.frame-container');
        this.videoSection = document.querySelector('.video-frames-section');
        this.videoOverlay = document.querySelector('.video-overlay');
        this.characterSection = document.querySelector('.character-section');
        this.totalFrames = 47;
        this.frames = [];
        this.currentFrame = 0;
        this.scrollHeight = 0;
        this.navBar = document.querySelector('.nav');
        this.scrollProgress = document.querySelector('.scroll-progress');
        this.lastScrollTop = 0; // Track last scroll position for direction
        this.requestId = null; // For requestAnimationFrame
        this.isScrolling = false;
    }
    
    /**
     * Initialize the scroll animation
     */
    init() {
        this.createFrames();
        this.setupFrameContainer();
        this.setupEventListeners();
        return this; // Enable method chaining
    }
    
    /**
     * Create image elements for all frames
     */
    createFrames() {
        // Create and append all frame images
        for (let i = 1; i <= this.totalFrames; i++) {
            const img = document.createElement('img');
            img.src = `Video1/Frame${i}.jpeg`;
            img.alt = `Frame ${i}`;
            img.classList.add('frame-transition');
            
            // Make first frame visible by default
            if (i === 1) {
                img.classList.add('active');
            }
            
            this.frameContainer.appendChild(img);
            this.frames.push(img);
        }
    }
    
    /**
     * Set up the frame container and calculate scroll heights
     */
    setupFrameContainer() {
        // Set the height of the video section to create enough scroll space
        this.scrollHeight = window.innerHeight * 2.5; // Adjust multiplier as needed
        this.videoSection.style.height = `${this.scrollHeight}px`;
    }
    
    /**
     * Set up scroll and resize event listeners
     */
    setupEventListeners() {
        // Handle scroll with requestAnimationFrame for performance
        window.addEventListener('scroll', () => {
            this.isScrolling = true;
            if (!this.requestId) {
                this.requestId = requestAnimationFrame(this.handleScroll.bind(this));
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initial calculation
        this.handleResize();
    }
    
    /**
     * Handle window resize event
     */
    handleResize() {
        // Recalculate scroll height
        this.scrollHeight = window.innerHeight * 2.5;
        this.videoSection.style.height = `${this.scrollHeight}px`;
        
        // Update frame display
        this.updateFrame(this.currentFrame);
    }
    
    /**
     * Handle scroll event with performance optimization
     */
    handleScroll() {
        if (this.isScrolling) {
            // Update scroll progress indicator
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            this.scrollProgress.style.width = `${scrollPercent}%`;
            
            // Add frosted glass effect to navbar when scrolled
            if (window.scrollY > 50) {
                this.navBar.classList.add('frosted-glass');
            } else {
                this.navBar.classList.remove('frosted-glass');
            }
            
            // Get the scroll direction
            const scrollDirection = window.scrollY > this.lastScrollTop ? 'down' : 'up';
            this.lastScrollTop = window.scrollY;
            
            // Calculate which frame to show based on scroll position
            const videoSectionTop = this.videoSection.offsetTop;
            const scrollPositionInVideoSection = window.scrollY - videoSectionTop;
            
            // Only process if we're in the video section
            if (scrollPositionInVideoSection >= 0) {
                // Calculate the frame index based on scroll position
                const frameIndex = Math.min(
                    Math.floor((scrollPositionInVideoSection / this.scrollHeight) * this.totalFrames),
                    this.totalFrames - 1
                );
                
                // Only update if the frame has changed
                if (frameIndex !== this.currentFrame && frameIndex >= 0 && frameIndex < this.totalFrames) {
                    this.updateFrame(frameIndex);
                }
                
                // Fade in the overlay gradually as we approach the end
                const overlayOpacity = Math.max(0, (frameIndex - (this.totalFrames * 0.6)) / (this.totalFrames * 0.4));
                this.videoOverlay.style.opacity = overlayOpacity.toString();
                
                // Add visible class to character section near the end of frames
                if (frameIndex > this.totalFrames * 0.8) {
                    this.characterSection.classList.add('visible');
                }
            }
            
            this.isScrolling = false;
            this.requestId = null;
        } else {
            // Continue animation frame if there are any pending updates
            this.requestId = requestAnimationFrame(this.handleScroll.bind(this));
        }
    }
    
    /**
     * Update the active frame
     * @param {number} frameIndex - Index of the frame to show
     */
    updateFrame(frameIndex) {
        // Remove active class from current frame
        this.frames[this.currentFrame].classList.remove('active');
        
        // Update current frame index
        this.currentFrame = frameIndex;
        
        // Add active class to new frame
        this.frames[this.currentFrame].classList.add('active');
    }
}

/**
 * Handles the photo gallery functionality
 */
class Gallery {
    constructor() {
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.fullscreenViewer = document.getElementById('fullscreen-viewer');
        this.fullscreenImage = document.getElementById('fullscreen-image');
        this.closeBtn = document.querySelector('.close-btn');
        this.body = document.body;
    }
    
    /**
     * Initialize the gallery functionality
     */
    init() {
        // Set up click events for gallery items
        this.galleryItems.forEach(item => {
            item.addEventListener('click', () => this.openFullscreen(item));
        });
        
        // Set up close button
        this.closeBtn.addEventListener('click', this.closeFullscreen.bind(this));
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.fullscreenViewer.classList.contains('active')) {
                this.closeFullscreen();
            }
        });
        
        // Close on click outside image
        this.fullscreenViewer.addEventListener('click', (e) => {
            if (e.target === this.fullscreenViewer) {
                this.closeFullscreen();
            }
        });
        
        // Add animation delay to gallery items
        this.setupGalleryItemAnimations();
        
        return this; // Enable method chaining
    }
    
    /**
     * Set up staggered animations for gallery items
     */
    setupGalleryItemAnimations() {
        this.galleryItems.forEach((item, index) => {
            // Add transition delay for staggered effect
            item.style.transitionDelay = `${index * 0.1}s`;
        });
    }
    
    /**
     * Open fullscreen image viewer
     * @param {HTMLElement} item - The gallery item that was clicked
     */
    openFullscreen(item) {
        const imgSrc = item.getAttribute('data-img');
        
        // Set image source
        this.fullscreenImage.src = imgSrc;
        
        // Show fullscreen viewer
        this.fullscreenViewer.classList.add('active');
        
        // Prevent body scrolling
        this.body.style.overflow = 'hidden';
    }
    
    /**
     * Close fullscreen image viewer
     */
    closeFullscreen() {
        // Hide fullscreen viewer
        this.fullscreenViewer.classList.remove('active');
        
        // Re-enable body scrolling
        this.body.style.overflow = 'auto';
        
        // Clear image source after transition
        setTimeout(() => {
            this.fullscreenImage.src = '';
        }, 300);
    }
}

/**
 * Handles navigation functionality
 */
class Navigation {
    constructor() {
        this.navToggle = document.querySelector('.nav-toggle');
        this.navLinks = document.querySelector('.nav-links');
        this.navLinkItems = document.querySelectorAll('.nav-link');
        this.nav = document.querySelector('.nav');
    }
    
    /**
     * Initialize the navigation functionality
     */
    init() {
        this.setupMobileMenu();
        this.setupSmoothScroll();
        return this; // Enable method chaining
    }
    
    /**
     * Set up mobile menu toggle
     */
    setupMobileMenu() {
        // Toggle mobile menu
        this.navToggle.addEventListener('click', () => {
            this.navLinks.classList.toggle('active');
            this.navToggle.classList.toggle('active');
        });
        
        // Close mobile menu when clicking a link
        this.navLinkItems.forEach(link => {
            link.addEventListener('click', () => {
                this.navLinks.classList.remove('active');
                this.navToggle.classList.remove('active');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-links') && !e.target.closest('.nav-toggle') && this.navLinks.classList.contains('active')) {
                this.navLinks.classList.remove('active');
                this.navToggle.classList.remove('active');
            }
        });
        
        // Handle resize to reset menu state on larger screens
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.navLinks.classList.contains('active')) {
                this.navLinks.classList.remove('active');
                this.navToggle.classList.remove('active');
            }
        });
    }
    
    /**
     * Set up smooth scrolling for navigation links
     */
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = anchor.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Offset for navigation bar height
                    const navHeight = this.nav.offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
                    
                    // Smooth scroll to target
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

/**
 * Utility functions
 */
const utils = {
    /**
     * Check if an element is in the viewport
     * @param {HTMLElement} element - The element to check
     * @param {number} offset - Optional offset value
     * @returns {boolean} True if element is in viewport
     */
    isElementInViewport: (element, offset = 0) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight + offset) &&
            rect.bottom >= (0 - offset) &&
            rect.left <= (window.innerWidth + offset) &&
            rect.right >= (0 - offset)
        );
    },
    
    /**
     * Throttle a function to limit how often it can run
     * @param {Function} func - The function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Generate a random number between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random number
     */
    randomNumber: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    
    /**
     * Convert hex color to rgba
     * @param {string} hex - Hex color code
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} RGBA color string
     */
    hexToRgba: (hex, alpha = 1) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

// Initialize the website
document.addEventListener('DOMContentLoaded', () => {
    const preloader = new Preloader().init();
});
