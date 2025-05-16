document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const preloaderText = document.getElementById('preloader-text');
    const pageContent = document.getElementById('page-content');

    const navbar = document.getElementById('main-navbar');
    const navLinksContainer = document.querySelector('.nav-links');
    const menuToggle = document.querySelector('.navbar-menu-toggle');
    const navLinks = document.querySelectorAll('.nav-link-item');

    const heroSection = document.getElementById('hero-section');
    const videoScrollWrapper = document.getElementById('video-scroll-wrapper');
    const canvasStickyContainer = document.querySelector('.canvas-sticky-container');
    const canvas = document.getElementById('interactive-video-canvas');
    const ctx = canvas.getContext('2d');

    const characterIntroSection = document.getElementById('character-intro-section');
    const gallerySection = document.getElementById('image-gallery-section');
    const galleryImages = document.querySelectorAll('.gallery-item-image');
    const galleryWrappers = document.querySelectorAll('.gallery-image-wrapper');
    const modal = document.getElementById('fullscreen-image-modal');
    const modalImage = document.getElementById('modal-displayed-image');
    const closeModalButton = document.querySelector('.modal-close-button');

    const currentYearSpan = document.getElementById('current-year');

    const totalFrames = 47;
    const framePath = 'Video1/Frame';
    const frameExtension = '.jpeg';
    const imagesToPreload = [];
    let loadedImagesCount = 0;
    const videoFrames = [];

    let isPageLoaded = false;

    function initializeSite() {
        setupImagePaths();
        preloadAllAssets();
    }

    function setupImagePaths() {
        imagesToPreload.push('photos/background1.png');
        for (let i = 1; i <= totalFrames; i++) {
            imagesToPreload.push(`${framePath}${i}${frameExtension}`);
        }
        imagesToPreload.push('photos/photo1.png');
        imagesToPreload.push('photos/photo2.png');
        imagesToPreload.push('photos/photo3.png');
        imagesToPreload.push('photos/photo4.png');
        imagesToPreload.push('Logo1.png');
    }

    function preloadAllAssets() {
        if (imagesToPreload.length === 0) {
            assetsLoaded();
            return;
        }
        imagesToPreload.forEach(src => {
            const img = new Image();
            img.onload = assetLoaded;
            img.onerror = assetError;
            img.src = src;
            if (src.includes(framePath)) {
                videoFrames.push(img); 
            }
        });

        videoFrames.sort((a, b) => {
            const numA = parseInt(a.src.match(/Frame(\d+)\.jpeg$/)[1]);
            const numB = parseInt(b.src.match(/Frame(\d+)\.jpeg$/)[1]);
            return numA - numB;
        });
    }
    
    function assetLoaded() {
        loadedImagesCount++;
        const percentage = Math.round((loadedImagesCount / imagesToPreload.length) * 100);
        if (preloaderText) {
            preloaderText.textContent = `Loading assets... (${percentage}%)`;
        }
        if (loadedImagesCount === imagesToPreload.length) {
            assetsLoaded();
        }
    }

    function assetError(e) {
        console.error('Error loading asset:', e.target.src);
        loadedImagesCount++; 
        const percentage = Math.round((loadedImagesCount / imagesToPreload.length) * 100);
         if (preloaderText) {
            preloaderText.textContent = `Loading assets... (${percentage}%) - Some errors occurred.`;
        }
        if (loadedImagesCount === imagesToPreload.length) {
            assetsLoaded();
        }
    }
    
    function assetsLoaded() {
        isPageLoaded = true;
        if (preloader) {
             document.body.classList.add('loaded');
        }
        setupCanvas();
        setupEventListeners();
        updateScrollDependentElements();
        checkInitialVisibility();
        setGalleryImageIndices();
    }

    function setGalleryImageIndices() {
        galleryWrappers.forEach((wrapper, index) => {
            wrapper.style.setProperty('--image-index', index);
        });
    }

    function setupCanvas() {
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const desiredHeightForScrollAnimation = window.innerHeight * 5; // 5 viewports of scroll for 47 frames
        if (videoScrollWrapper) {
            videoScrollWrapper.style.height = `${desiredHeightForScrollAnimation}px`;
        }
        if (videoFrames.length > 0 && videoFrames[0].complete) {
             drawFrame(0); // Draw the first frame initially
        } else if (videoFrames.length > 0) {
            videoFrames[0].onload = () => drawFrame(0);
        }
    }

    function drawFrame(index) {
        if (!canvas || index < 0 || index >= videoFrames.length || !videoFrames[index] || !videoFrames[index].complete) {
            return;
        }
        const frame = videoFrames[index];
        const canvasAspectRatio = canvas.width / canvas.height;
        const frameAspectRatio = frame.naturalWidth / frame.naturalHeight;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspectRatio > frameAspectRatio) { // Canvas is wider than frame
            drawWidth = canvas.width;
            drawHeight = canvas.width / frameAspectRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else { // Canvas is taller or same aspect ratio
            drawHeight = canvas.height;
            drawWidth = canvas.height * frameAspectRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, offsetX, offsetY, drawWidth, drawHeight);

        const darkeningStartFrame = totalFrames - 15; // Start darkening over the last 15 frames
        const darkeningEndFrame = totalFrames - 1; // Fully dark by the last frame
        
        if (index >= darkeningStartFrame) {
            let darkness = 0;
            if (index <= darkeningEndFrame) {
                 darkness = (index - darkeningStartFrame) / (darkeningEndFrame - darkeningStartFrame);
            } else {
                darkness = 1; // Fully dark if somehow past end frame
            }
            darkness = Math.min(0.8, darkness); // Max 80% darkness
            ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    function handleScroll() {
        if (!isPageLoaded) return;
        updateNavbarAppearance();
        updateScrollDependentElements();
    }

    function updateNavbarAppearance() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        let currentSection = '';
        document.querySelectorAll('section[id], div[id="video-scroll-wrapper"]').forEach(section => {
            const sectionTop = section.offsetTop - navbar.offsetHeight - 50; // Adjusted offset
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.substring(1) === currentSection) {
                link.classList.add('active');
            } else if (currentSection === 'video-scroll-wrapper' && href && href.substring(1) === 'video-scroll-wrapper') {
                 link.classList.add('active');
            }
        });
         if (!currentSection && window.scrollY < heroSection.offsetHeight) {
            const homeLink = document.querySelector('.nav-link-item[href="#hero-section"]');
            if (homeLink) homeLink.classList.add('active');
        }
    }
    
    function updateScrollDependentElements() {
        if (!videoScrollWrapper || !canvasStickyContainer) return;

        const scrollWrapperRect = videoScrollWrapper.getBoundingClientRect();
        const stickyContainerRect = canvasStickyContainer.getBoundingClientRect();
        
        // Only animate canvas if the sticky container is visible within the scroll wrapper's influence
        if (stickyContainerRect.top <= 0 && scrollWrapperRect.bottom > 0) {
            const scrollableHeightOfWrapper = videoScrollWrapper.scrollHeight - window.innerHeight;
            const pixelsScrolledWithinWrapper = -scrollWrapperRect.top;
            let scrollFraction = pixelsScrolledWithinWrapper / scrollableHeightOfWrapper;
            scrollFraction = Math.max(0, Math.min(1, scrollFraction));

            const currentFrameIndex = Math.floor(scrollFraction * (totalFrames -1));
            requestAnimationFrame(() => drawFrame(currentFrameIndex));

            const characterRevealStart = 0.85; // Start revealing character text at 85% of video scroll
            const characterFullyRevealed = 0.98; 
            
            if (scrollFraction >= characterRevealStart) {
                characterIntroSection.classList.add('visible');
                 let opacity = (scrollFraction - characterRevealStart) / (characterFullyRevealed - characterRevealStart);
                 opacity = Math.min(1, Math.max(0, opacity));
                 characterIntroSection.style.opacity = opacity; // Fine-tune opacity based on scroll
            } else {
                characterIntroSection.classList.remove('visible');
                characterIntroSection.style.opacity = 0;
            }

        } else if (scrollWrapperRect.bottom <= 0) { // Scrolled past the video section
            requestAnimationFrame(() => drawFrame(totalFrames - 1)); // Keep last frame (dark)
            characterIntroSection.classList.add('visible');
            characterIntroSection.style.opacity = 1;
        } else if (stickyContainerRect.top > 0) { // Scrolled above video section
             requestAnimationFrame(() => drawFrame(0));
             characterIntroSection.classList.remove('visible');
             characterIntroSection.style.opacity = 0;
        }


        // Gallery reveal
        const gallerySectionTop = gallerySection.getBoundingClientRect().top;
        const triggerPointGallery = window.innerHeight * 0.7; // Reveal when 70% of it is visible

        if (gallerySectionTop < triggerPointGallery) {
            gallerySection.classList.add('visible');
        } else {
             // Optional: hide if scrolled back up, if desired
             // gallerySection.classList.remove('visible');
        }
    }

    function checkInitialVisibility() {
        // For elements that might be in view on load without scrolling
        updateScrollDependentElements(); 
    }

    function setupEventListeners() {
        window.addEventListener('scroll', throttle(handleScroll, 16)); // Throttle scroll for performance (approx 60fps)
        window.addEventListener('resize', throttle(handleResize, 100));

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                navLinksContainer.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (navLinksContainer.classList.contains('active')) {
                    navLinksContainer.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        const offsetTop = targetElement.offsetTop - (navbar.offsetHeight -1); // Adjust for fixed navbar
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });

        galleryImages.forEach(image => {
            image.addEventListener('click', () => openModal(image.src));
        });

        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeModal);
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) { // Click on overlay itself
                    closeModal();
                }
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

    function handleResize() {
        if (canvas) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        // Re-calculate scroll dependent positions or redraw current frame if needed
        updateScrollDependentElements(); 
        if (isPageLoaded && videoFrames.length > 0) {
             // Redraw current frame after resize to fit new canvas dimensions
             const scrollWrapperRect = videoScrollWrapper.getBoundingClientRect();
             if (scrollWrapperRect.bottom > 0 && scrollWrapperRect.top < window.innerHeight) { // if in view
                const scrollableHeightOfWrapper = videoScrollWrapper.scrollHeight - window.innerHeight;
                const pixelsScrolledWithinWrapper = -scrollWrapperRect.top;
                let scrollFraction = pixelsScrolledWithinWrapper / scrollableHeightOfWrapper;
                scrollFraction = Math.max(0, Math.min(1, scrollFraction));
                const currentFrameIndex = Math.floor(scrollFraction * (totalFrames - 1));
                requestAnimationFrame(() => drawFrame(currentFrameIndex));
             } else if (scrollWrapperRect.bottom <=0 ) {
                 requestAnimationFrame(() => drawFrame(totalFrames - 1));
             } else {
                 requestAnimationFrame(() => drawFrame(0));
             }
        }
    }

    function openModal(imageSrc) {
        if (modalImage) modalImage.src = imageSrc;
        if (modal) modal.classList.add('active');
        document.body.classList.add('no-scroll'); // Prevent background scroll
    }

    function closeModal() {
        if (modal) modal.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
    
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    initializeSite();
});
