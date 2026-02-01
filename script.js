// Navigation state
let navigationHistory = [];
let pageDataCache = {}; // Store data for series/artwork pages to restore on back navigation

// Helper function to slugify (for matching series)
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Page Navigation
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            navigateToPage(targetPage, true);
        });
    });

    // Handle browser back/forward (e.g. backspace key, browser back button)
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            const pageId = event.state.page;
            // Sync navigation stack: pop until current top matches the state we navigated to
            while (navigationHistory.length > 1 && navigationHistory[navigationHistory.length - 1] !== pageId) {
                navigationHistory.pop();
            }
            if (navigationHistory.length === 0 || navigationHistory[navigationHistory.length - 1] !== pageId) {
                navigationHistory.push(pageId);
            }
            navigateToPage(pageId, false);
            // Restore content for series/artwork (it was cleared when we navigated away)
            if (pageId === 'series' && pageDataCache.series) {
                renderSeriesPage(pageDataCache.series);
            } else if (pageId === 'artwork' && pageDataCache.artwork) {
                renderArtworkPage(pageDataCache.artwork.project, pageDataCache.artwork.imageIndex);
            }
        }
    });

    // Set initial active state
    const homeButton = document.querySelector('[data-page="home"]');
    const homePage = document.getElementById('home');
    if (homeButton && homePage) {
        homeButton.classList.add('active');
        homePage.classList.add('active');
    }

    // Initialize home carousel (will wait for data)
    initHomeCarousel();
    
    // Setup Quick Mini Portfolio button (uses images from mini-portfolio folder)
    setupMiniPortfolioButton();
    
    // Also listen for sheets data loaded event and reinitialize carousel
    window.addEventListener('sheetsDataLoaded', () => {
        initHomeCarousel();
        // Initialize penguin animations after carousel is recreated
        setTimeout(() => {
            initPenguinAnimations();
        }, 200);
    });
    
    // Initialize penguin animations after carousel is created
    setTimeout(() => {
        initPenguinAnimations();
    }, 200);
});

// Navigate to a page
function navigateToPage(pageId, addToHistory = true) {
    // Close mini portfolio overlay if open
    const overlay = document.getElementById('miniPortfolioOverlay');
    if (overlay && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mini-portfolio-open');
        document.body.style.overflow = '';
    }
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');

    // Remove active class from all buttons and pages
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // First, clear content from pages that are currently active (being hidden)
    pages.forEach(page => {
        if (page.classList.contains('active') && page.id !== pageId) {
            if (page.id === 'series') {
                const seriesContent = page.querySelector('#seriesContent');
                if (seriesContent) seriesContent.innerHTML = '';
            } else if (page.id === 'artwork') {
                const artworkContent = page.querySelector('#artworkContent');
                if (artworkContent) artworkContent.innerHTML = '';
            }
        }
    });
    
    // Then remove active class from all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Add active class to target page
    const targetPageElement = document.getElementById(pageId);
    if (targetPageElement) {
        targetPageElement.classList.add('active');
        
        // Update body class for series/artwork pages to reduce line opacity
        document.body.classList.remove('series-page', 'artwork-page');
        if (pageId === 'series') {
            document.body.classList.add('series-page');
        } else if (pageId === 'artwork') {
            document.body.classList.add('artwork-page');
        }
        
        // Update nav button if it's a main page
        const navButton = document.querySelector(`[data-page="${pageId}"]`);
        if (navButton) {
            navButton.classList.add('active');
        }

        // Trigger works page initialization if needed
        if (pageId === 'works' && typeof window !== 'undefined') {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('worksPageActivated'));
            }, 100);
        }

        // Add to history
        if (addToHistory) {
            navigationHistory.push(pageId);
            window.history.pushState({ page: pageId }, '', `#${pageId}`);
        }
    }
}

// Navigate back
function navigateBack() {
    if (navigationHistory.length > 1) {
        navigationHistory.pop(); // Remove current page
        const previousPage = navigationHistory[navigationHistory.length - 1];
        
        // Restore content for series or artwork pages
        if (previousPage === 'series' && pageDataCache.series) {
            renderSeriesPage(pageDataCache.series);
        } else if (previousPage === 'artwork' && pageDataCache.artwork) {
            renderArtworkPage(pageDataCache.artwork.project, pageDataCache.artwork.imageIndex);
        }
        
        navigateToPage(previousPage, false);
        window.history.back();
    } else {
        // Go to home if no history
        navigateToPage('home', true);
    }
}

// Animate penguins by cycling through frames
function initPenguinAnimations() {
    const penguins = document.querySelectorAll('.penguin');
    if (penguins.length === 0) {
        // Retry if penguins aren't created yet
        setTimeout(initPenguinAnimations, 100);
        return;
    }
    
    const frames = [
        'assets/Penguinwalk-1.png',
        'assets/Penguinwalk-2.png',
        'assets/Penguinwalk-3.png'
    ];
    
    // Animation speed in milliseconds (higher = slower)
    const ANIMATION_SPEED = 200; // Change this value to adjust speed
    
    // Give each penguin a different starting frame and animation offset
    penguins.forEach((penguin, index) => {
        // Different starting frame for each penguin to desync them
        let currentFrame = index % frames.length;
        penguin.style.backgroundImage = `url('${frames[currentFrame]}')`;
        
        // Each penguin has its own interval with a different delay to desync them
        const delay = index * (ANIMATION_SPEED / 3); // Stagger by 1/3 of animation speed
        
        setTimeout(() => {
            const intervalId = setInterval(() => {
                currentFrame = (currentFrame + 1) % frames.length;
                penguin.style.backgroundImage = `url('${frames[currentFrame]}')`;
            }, ANIMATION_SPEED);
            
            // Store interval ID on penguin element for potential cleanup
            penguin.dataset.intervalId = intervalId;
        }, delay);
    });
}

// Helper function to create carousel items
function createCarouselItems(carousel, projects) {
    // Penguin position: distance in px from the image edges (change these to move penguins)
    const PENGUIN_INSET = -30;      // horizontal: distance from left/right edge of image
    const PENGUIN_BOTTOM_INSET = 10; // vertical: distance from bottom of image

    // Create placeholder boxes for each featured work
    projects.forEach((project, index) => {
        const box = document.createElement('div');
        box.className = 'carousel-item';
        box.setAttribute('data-project-id', project.id);
        
        // Create image or placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'carousel-placeholder';
        
        // Only try to load image if thumbnail path exists
        if (project.thumbnail) {
            // Use actual image if available with WebP/JPEG fallback
            const img = document.createElement('img');
            img.alt = project.title || 'Artwork';
            img.loading = 'lazy';
            // Image height is fixed at 200px, width adapts to aspect ratio
            img.style.height = '200px';
            img.style.width = 'auto';
            img.style.maxWidth = '100%';
            img.style.display = 'block';
            
            // Function to position penguins based on image size
            const positionPenguins = () => {
                // Wait a frame for layout to settle
                requestAnimationFrame(() => {
                    const placeholderRect = placeholder.getBoundingClientRect();
                    const boxRect = box.getBoundingClientRect();
                    
                    // Calculate image position relative to box
                    const placeholderLeft = placeholderRect.left - boxRect.left;
                    const placeholderRight = boxRect.right - placeholderRect.right;
                    const placeholderBottom = boxRect.bottom - boxRect.top;
                    
                    // Position penguins at the edges of the placeholder/image
                    penguinLeft.style.left = `${placeholderLeft + PENGUIN_INSET}px`;
                    penguinLeft.style.bottom = `${boxRect.height - placeholderBottom + PENGUIN_BOTTOM_INSET}px`;
                    penguinRight.style.right = `${placeholderRight + PENGUIN_INSET}px`;
                    penguinRight.style.bottom = `${boxRect.height - placeholderBottom + PENGUIN_BOTTOM_INSET}px`;
                });
            };
            
            // Function to update placeholder width based on image aspect ratio
            const updatePlaceholderWidth = () => {
                if (img.complete && img.naturalWidth && img.naturalHeight) {
                    // Calculate width based on fixed height (200px) and image aspect ratio
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    const calculatedWidth = 200 * aspectRatio;
                    // Constrain to min/max
                    const finalWidth = Math.max(150, Math.min(380, calculatedWidth));
                    placeholder.style.width = `${finalWidth}px`;
                }
            };
            
            // Set initial placeholder width (will be updated when image loads)
            placeholder.style.width = '300px'; // Default width until image loads
            
            // Try paths in order (base path first, then _0001 etc.) so both simple names (monkey-bars.jpg) and numbered (artwork_0001.jpg) work
            const pathsToTry = (project.images && project.images.length) ? project.images : (project.thumbnail ? [project.thumbnail] : []);
            let pathIndex = 0;
            function tryNextPath() {
                if (pathIndex >= pathsToTry.length) {
                    img.style.display = 'none';
                    if (!placeholder.textContent) placeholder.textContent = project.title || 'Artwork';
                    return;
                }
                const basePath = pathsToTry[pathIndex++];
                if (typeof window.loadImageWithFallback === 'function') {
                    window.loadImageWithFallback(basePath, img,
                        tryNextPath,
                        function() {
                            updatePlaceholderWidth();
                            positionPenguins();
                        }
                    );
                } else {
                    img.src = basePath.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '') + '.jpg';
                    img.onerror = tryNextPath;
                    img.onload = function() {
                        updatePlaceholderWidth();
                        positionPenguins();
                    };
                }
            }
            if (pathsToTry.length) tryNextPath();
            else {
                img.style.display = 'none';
                if (!placeholder.textContent) placeholder.textContent = project.title || 'Artwork';
            }
            
            // Don't overwrite img.onload - loadImageWithFallback uses it to remove .image-loading and show the image (opacity 1). Our onLoad callback above handles updatePlaceholderWidth/positionPenguins.
            
            // Also update on window resize (debounced)
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    updatePlaceholderWidth();
                    positionPenguins();
                }, 100);
            };
            window.addEventListener('resize', handleResize);
            
            placeholder.appendChild(img);
        } else {
            // No image path - show text placeholder
            placeholder.textContent = project.title || 'Artwork';
        }
        
        // Add penguin animations
        const penguinLeft = document.createElement('div');
        penguinLeft.className = 'penguin penguin-left animating';
        const penguinRight = document.createElement('div');
        penguinRight.className = 'penguin penguin-right animating';
        
        box.appendChild(placeholder);
        box.appendChild(penguinLeft);
        box.appendChild(penguinRight);
        
        // Add click handler to navigate to artwork page
        box.style.cursor = 'pointer';
        box.addEventListener('click', () => {
            // Open the individual artwork page directly
            if (project.id) {
                window.openArtwork(project.id, 0);
            } else {
                console.warn('Artwork has no ID:', project);
            }
        });
        
        carousel.appendChild(box);
    });

    // Duplicate items for seamless loop
    projects.forEach((project, index) => {
        const box = document.createElement('div');
        box.className = 'carousel-item';
        box.setAttribute('data-project-id', project.id);
        
        const placeholder = document.createElement('div');
        placeholder.className = 'carousel-placeholder';
        
        if (project.thumbnail || (project.images && project.images.length)) {
            const img = document.createElement('img');
            img.alt = project.title;
            img.loading = 'lazy';
            img.style.display = 'block';
            
            // Function to update placeholder width based on image aspect ratio
            const updatePlaceholderWidth = () => {
                if (img.complete && img.naturalWidth && img.naturalHeight) {
                    // Calculate width based on fixed height (200px) and image aspect ratio
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    const calculatedWidth = 200 * aspectRatio;
                    // Constrain to min/max
                    const finalWidth = Math.max(150, Math.min(380, calculatedWidth));
                    placeholder.style.width = `${finalWidth}px`;
                }
            };
            
            // Function to position penguins based on image size
            const positionPenguins = () => {
                requestAnimationFrame(() => {
                    const placeholderRect = placeholder.getBoundingClientRect();
                    const boxRect = box.getBoundingClientRect();
                    
                    // Calculate image position relative to box
                    const placeholderLeft = placeholderRect.left - boxRect.left;
                    const placeholderRight = boxRect.right - placeholderRect.right;
                    const placeholderBottom = boxRect.bottom - boxRect.top;
                    
                    // Position penguins at the edges of the placeholder/image
                    penguinLeft.style.left = `${placeholderLeft + PENGUIN_INSET}px`;
                    penguinLeft.style.bottom = `${boxRect.height - placeholderBottom + PENGUIN_BOTTOM_INSET}px`;
                    penguinRight.style.right = `${placeholderRight + PENGUIN_INSET}px`;
                    penguinRight.style.bottom = `${boxRect.height - placeholderBottom + PENGUIN_BOTTOM_INSET}px`;
                });
            };
            
            // Also update on window resize (debounced)
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    updatePlaceholderWidth();
                    positionPenguins();
                }, 100);
            };
            window.addEventListener('resize', handleResize);
            
            const pathsToTryDup = (project.images && project.images.length) ? project.images : (project.thumbnail ? [project.thumbnail] : []);
            let pathIndexDup = 0;
            function tryNextPathDup() {
                if (pathIndexDup >= pathsToTryDup.length) {
                    img.style.display = 'none';
                    if (!placeholder.textContent) placeholder.textContent = project.title || 'Artwork';
                    return;
                }
                const basePath = pathsToTryDup[pathIndexDup++];
                if (typeof window.loadImageWithFallback === 'function') {
                    window.loadImageWithFallback(basePath, img, tryNextPathDup, function() {
                        updatePlaceholderWidth();
                        positionPenguins();
                    });
                } else {
                    img.src = basePath.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '') + '.jpg';
                    img.onerror = tryNextPathDup;
                }
            }
            if (pathsToTryDup.length) {
                placeholder.style.width = '300px';
                tryNextPathDup();
            } else {
                img.style.display = 'none';
                placeholder.textContent = project.title || 'Artwork';
            }
            placeholder.appendChild(img);
        } else {
            placeholder.textContent = project.title || 'Artwork';
        }
        
        const penguinLeft = document.createElement('div');
        penguinLeft.className = 'penguin penguin-left animating';
        const penguinRight = document.createElement('div');
        penguinRight.className = 'penguin penguin-right animating';
        
        box.appendChild(placeholder);
        box.appendChild(penguinLeft);
        box.appendChild(penguinRight);
        
        box.style.cursor = 'pointer';
        box.addEventListener('click', () => {
            if (project.id) {
                window.openArtwork(project.id, 0);
            } else {
                console.warn('Artwork has no ID:', project);
            }
        });
        
        carousel.appendChild(box);
    });
}

// Open series page (make globally accessible)
window.openSeries = function(projectId) {
    if (!window.PROJECTS) {
        console.warn('⚠️ window.PROJECTS not available');
        return;
    }
    
    const project = window.PROJECTS.find(p => p.id === projectId);
    if (!project) {
        console.warn('⚠️ Series not found with id:', projectId);
        if (window.PROJECTS.length > 0) {
            console.log('Available series:', window.PROJECTS.map(p => ({ id: p.id, title: p.title })));
        }
        return;
    }

    // Store data for back navigation
    pageDataCache.series = project;
    // Render series page
    renderSeriesPage(project);
    navigateToPage('series', true);
};

// Keep local reference for backwards compatibility
const openSeries = window.openSeries;

// Open artwork page (make globally accessible)
window.openArtwork = function(artworkId, imageIndex = 0) {
    // First try to find in ARTWORKS array (individual artworks)
    if (window.ARTWORKS && window.ARTWORKS.length > 0) {
        const artwork = window.ARTWORKS.find(a => a.id === artworkId);
        if (artwork) {
            // Create a project-like object for the artwork viewer
            const tempProject = {
                id: artwork.id,
                title: artwork.title,
                years: artwork.years,
                tags: artwork.tags,
                images: artwork.images || (artwork.thumbnail ? [artwork.thumbnail] : []),
                thumbnail: artwork.thumbnail,
                blurb: artwork.blurb,
                statement: artwork.statement,
                series: artwork.series,
                workType: artwork.workType,
                medium: artwork.medium,
                dimensions: artwork.dimensions,
                exhibited: artwork.exhibited,
                awards: artwork.awards,
                link: artwork.link,
                madeInCollaborationWith: artwork.madeInCollaborationWith,
                collaborators: artwork.collaborators
            };
            // Store data for back navigation
            pageDataCache.artwork = { project: tempProject, imageIndex: imageIndex };
            renderArtworkPage(tempProject, imageIndex);
            navigateToPage('artwork', true);
            return;
        }
    }
    
    // Fallback: try to find in PROJECTS (series)
    if (window.PROJECTS) {
        const project = window.PROJECTS.find(p => p.id === artworkId);
        if (project && project.images && project.images[imageIndex]) {
            // Store data for back navigation
            pageDataCache.artwork = { project: project, imageIndex: imageIndex };
            renderArtworkPage(project, imageIndex);
            navigateToPage('artwork', true);
            return;
        }
    }
    
    console.warn('⚠️ Artwork not found with id:', artworkId);
};

// Keep local reference for backwards compatibility
const openArtwork = window.openArtwork;

// Open artwork from series (when clicking artwork in series page)
window.openArtworkFromSeries = function(seriesId, artworkId, artworkIndex) {
    // Just use the artwork ID to open it directly
    if (artworkId && typeof window.openArtwork === 'function') {
        window.openArtwork(artworkId, 0);
    } else {
        // Fallback to old method
        if (!window.PROJECTS || !window.ARTWORKS) return;
        
        const series = window.PROJECTS.find(p => p.id === seriesId);
        if (!series || !series.artworks) return;
        
        const artwork = series.artworks[artworkIndex];
        if (!artwork) return;
        
        // Create a temporary project object for the artwork viewer
        const tempProject = {
            id: artwork.id || artworkId,
            title: artwork.title || series.title,
            years: artwork.years || series.years,
            tags: artwork.tags || series.tags,
            images: artwork.images || (artwork.thumbnail ? [artwork.thumbnail] : []),
            thumbnail: artwork.thumbnail,
            blurb: artwork.blurb || series.blurb,
            statement: artwork.statement || series.statement,
            series: artwork.series || series.title,
            workType: artwork.workType,
            medium: artwork.medium,
            dimensions: artwork.dimensions,
            exhibited: artwork.exhibited,
            awards: artwork.awards,
            link: artwork.link,
            madeInCollaborationWith: artwork.madeInCollaborationWith,
            collaborators: artwork.collaborators
        };
        
        // Store data for back navigation
        pageDataCache.artwork = { project: tempProject, imageIndex: 0 };
    // Render artwork page
        renderArtworkPage(tempProject, 0);
    navigateToPage('artwork', true);
}
};

// Render series page
function renderSeriesPage(project) {
    const seriesTitle = document.getElementById('seriesTitle');
    const seriesContent = document.getElementById('seriesContent');
    
    if (!seriesTitle || !seriesContent) return;

    seriesTitle.textContent = project.title;

    let html = `
        <div class="series-info">
            <div class="series-meta">
                <span class="series-years">${project.years || ''}</span>
                <div class="series-tags">
                    ${(project.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            ${project.blurb ? `<p class="series-blurb">${project.blurb}</p>` : ''}
            ${project.statement ? `<div class="series-statement"><p>${project.statement}</p></div>` : ''}
        </div>
    `;

    // Check if this is a series with artworks array
    if (project.artworks && project.artworks.length > 0) {
        html += '<div class="series-artworks-list">';
        project.artworks.forEach((artwork, index) => {
            // Use artwork's first image as thumbnail (no separate thumbnail needed)
            // Try to find the first valid image path by testing each one
            const artworkId = artwork.id || `artwork-${index}`;
            // Use first image from images array, or fallback to thumbnail
            const imageSrc = (artwork.images && artwork.images.length > 0) ? artwork.images[0] : (artwork.thumbnail || '');
            const imageBasePath = imageSrc ? imageSrc.replace(/\.(jpg|jpeg|png|webp)$/i, '') : '';
            html += `
                <article class="series-artwork-item" onclick="openArtworkFromSeries('${project.id}', '${artworkId}', ${index})">
                    ${imageBasePath ? `
                        <div class="series-artwork-image">
                            <img class="series-artwork-img" data-artwork-index="${index}" data-path="${imageBasePath}" alt="${artwork.title || 'Artwork'}" loading="lazy" />
                        </div>
                    ` : ''}
                    <div class="series-artwork-info">
                        <h3 class="series-artwork-title">${artwork.title || 'Untitled'}</h3>
                        ${artwork.years ? `<p class="series-artwork-meta">${artwork.years}</p>` : ''}
                        ${artwork.medium ? `<p class="series-artwork-meta">${artwork.medium}</p>` : ''}
                        ${artwork.dimensions ? `<p class="series-artwork-meta">${artwork.dimensions}</p>` : ''}
                        ${(artwork.tags && artwork.tags.length > 0) ? `<div class="series-artwork-tags">${artwork.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                    </div>
                </article>
            `;
        });
        html += '</div>';
        
        // Apply masonry layout after HTML is inserted
        setTimeout(() => {
            applyMasonryLayout(project.artworks.length);
        }, 100);
        
        // Load images with fallback after HTML is inserted
        // Try each artwork's images sequentially until one loads
        setTimeout(() => {
            document.querySelectorAll('.series-artwork-img').forEach((img) => {
                const artworkIndex = parseInt(img.getAttribute('data-artwork-index') || '0');
                const artwork = project.artworks[artworkIndex];
                
                if (artwork && artwork.images && artwork.images.length > 0) {
                    // Try each image path until one loads
                    let currentTry = 0;
                    const tryLoadImage = () => {
                        if (currentTry < artwork.images.length) {
                            const imagePath = artwork.images[currentTry];
                            const imageBasePath = imagePath.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
                            
                            // Create a test image to check if it exists
                            const testImg = new Image();
                            let triedJpgUpper = false;
                            let triedJpeg = false;
                            let triedJpegUpper = false;
                            let triedGif = false;
                            let triedGifUpper = false;
                            
                            testImg.onload = () => {
                                img.src = testImg.src;
                                img.onload = () => {
                                    setTimeout(() => {
                                        const itemCount = document.querySelectorAll('.series-artwork-item').length;
                                        applyMasonryLayout(itemCount);
                                    }, 50);
                                };
                            };
                            
                            testImg.onerror = () => {
                                if (!triedJpgUpper) {
                                    triedJpgUpper = true;
                                    testImg.src = imageBasePath + '.JPG';
                                } else if (!triedJpeg) {
                                    triedJpeg = true;
                                    testImg.src = imageBasePath + '.jpeg';
                                } else if (!triedJpegUpper) {
                                    triedJpegUpper = true;
                                    testImg.src = imageBasePath + '.JPEG';
                                } else if (!triedGif) {
                                    triedGif = true;
                                    testImg.src = imageBasePath + '.gif';
                                } else if (!triedGifUpper) {
                                    triedGifUpper = true;
                                    testImg.src = imageBasePath + '.GIF';
                                } else {
                                    currentTry++;
                                    if (currentTry < artwork.images.length) {
                                        tryLoadImage();
                                    }
                                }
                            };
                            
                            testImg.src = imageBasePath + '.jpg';
                        } else {
                            console.log(`⚠️ No images found for "${artwork.title}" - tried all ${artwork.images.length} paths`);
                        }
                    };
                    tryLoadImage();
                } else {
                    // Fallback: use the basePath directly
                    const basePath = img.getAttribute('data-path');
                    if (basePath) {
                        if (typeof window.loadImageWithFallback === 'function') {
                            window.loadImageWithFallback(basePath, img);
                        } else {
                            img.src = basePath + '.jpg';
                            img.onerror = () => {
                                img.src = basePath + '.JPG';
                            };
                        }
                    }
                }
            });
        }, 0);
    } else if (project.images && project.images.length > 0) {
        // Fallback to images array if artworks not available
        html += '<div class="series-artworks-list">';
        project.images.forEach((image, index) => {
            const imageBasePath = image.replace(/\.(jpg|jpeg|png|webp)$/i, '');
            html += `
                <article class="series-artwork-item" onclick="openArtwork('${project.id}', ${index})">
                    <div class="series-artwork-image">
                        <img class="series-artwork-img" data-path="${imageBasePath}" alt="${project.title} - Image ${index + 1}" loading="lazy" />
                    </div>
                    <div class="series-artwork-info">
                        <h3 class="series-artwork-title">${project.title} - Image ${index + 1}</h3>
                </div>
                </article>
            `;
        });
        html += '</div>';
        
        // Load images with fallback after HTML is inserted
        setTimeout(() => {
            document.querySelectorAll('.series-artwork-img').forEach(img => {
                const basePath = img.getAttribute('data-path');
                if (basePath) {
                    // Try to load the image, with fallback to .JPG if .jpg fails
                    if (typeof window.loadImageWithFallback === 'function') {
                        window.loadImageWithFallback(basePath, img);
    } else {
                        // Fallback: try .jpg first, then .JPG
                        const testImg = new Image();
                        testImg.onload = () => {
                            img.src = testImg.src;
                        };
                        testImg.onerror = () => {
                            testImg.src = basePath + '.JPG';
                            testImg.onerror = null;
                            testImg.onload = () => {
                                img.src = testImg.src;
                            };
                        };
                        testImg.src = basePath + '.jpg';
                    }
                }
            });
        }, 0);
    } else {
        html += '<p class="no-images">No artworks available for this series.</p>';
    }

    if (project.process && project.process.length > 0) {
        html += `
            <div class="series-process">
                <h3>Process</h3>
                <ul>
                    ${project.process.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    if (project.context && project.context.length > 0) {
        html += `
            <div class="series-context">
                <h3>Context</h3>
                <ul>
                    ${project.context.map(note => `<li>${note}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    seriesContent.innerHTML = html;
    
    // Assign brushstrokes to newly created elements
    setTimeout(() => {
        if (typeof assignBrushstrokes === 'function') {
            assignBrushstrokes();
        }
    }, 50);
}

// Normalize link to full URL (e.g. oppr.org/s/xxx -> https://oppr.org/s/xxx)
function normalizeProjectLink(link) {
    if (!link || typeof link !== 'string') return '';
    const trimmed = link.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed.replace(/^\/+/, '');
}

// Render artwork page
function renderArtworkPage(project, imageIndex) {
    const artworkTitle = document.getElementById('artworkTitle');
    const artworkContent = document.getElementById('artworkContent');
    
    if (!artworkTitle || !artworkContent) return;

    const projectLink = normalizeProjectLink(project.link);

    // Handle case where artwork has no images
    const hasImages = project.images && project.images.length > 0;
    // Use imageIndex to select initial image (default to 0 for first image)
    const initialImageIndex = (imageIndex !== undefined && imageIndex !== null) ? imageIndex : 0;
    const image = hasImages && project.images[initialImageIndex] ? project.images[initialImageIndex] : (hasImages ? project.images[0] : null);
    // Start with array length, but will be updated dynamically when thumbnails load
    const totalImages = hasImages ? project.images.length : 0;

    artworkTitle.textContent = project.title;

    let html = '';
    
    if (hasImages && image) {
        // Create image element with fallback support
        const imageBasePath = image.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
        const mainImageTag = `<img id="artwork-main-image" alt="${project.title}" class="artwork-image" data-current-index="${initialImageIndex}" />`;
        const mainImageWrap = projectLink
            ? `<a class="artwork-image-link" href="#" target="_blank" rel="noopener noreferrer" title="Open project">${mainImageTag}</a>`
            : mainImageTag;
        html = `
        <div class="artwork-viewer">
            <div class="artwork-image-container">
                    ${mainImageWrap}
                    ${totalImages > 1 ? `
                    <div class="artwork-thumbnails" id="artwork-thumbnails-container">
                        ${project.images.map((img, idx) => {
                            const thumbPath = img.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
                            // Escape single quotes in path for onclick
                            const escapedPath = thumbPath.replace(/'/g, "\\'");
                            return `<button class="artwork-thumb ${idx === initialImageIndex ? 'active' : ''}" 
                                    data-image-index="${idx}"
                                    onclick="window.switchArtworkImage(${idx}, '${escapedPath}')" 
                                    aria-label="View image ${idx + 1}">
                                    <img data-thumb-path="${thumbPath}" data-tried="0" src="${thumbPath}.jpg" alt="View ${idx + 1}" loading="lazy" 
                                         onerror="var tried=parseInt(this.dataset.tried||0); if(tried===0){this.dataset.tried='1';this.src=this.dataset.thumbPath+'.JPG';}else if(tried===1){this.dataset.tried='2';this.src=this.dataset.thumbPath+'.jpeg';}else if(tried===2){this.dataset.tried='3';this.src=this.dataset.thumbPath+'.JPEG';}else if(tried===3){this.dataset.tried='4';this.src=this.dataset.thumbPath+'.gif';this.onload=function(){window.freezeGifThumbnail(this);};}else if(tried===4){this.dataset.tried='5';this.src=this.dataset.thumbPath+'.GIF';this.onload=function(){window.freezeGifThumbnail(this);};}else{this.parentElement.setAttribute('data-hidden','true');this.parentElement.style.display='none';window.updateImageCount();}" 
                                         onload="if(this.src.toLowerCase().endsWith('.gif')){window.freezeGifThumbnail(this);}this.parentElement.removeAttribute('data-hidden');this.parentElement.style.display='block';window.updateImageCount();" />
                                </button>`;
                        }).join('')}
                    </div>
                    ` : ''}
                <div class="artwork-navigation">
                        <span></span>
                        ${totalImages > 1 ? `<span class="image-counter" id="artwork-image-counter">1 / ?</span>` : ''}
                        <span></span>
                </div>
            </div>
            <div class="artwork-info">
                    <dl class="artwork-metadata">
                        <div class="metadata-item">
                            <dt class="metadata-label">Title</dt>
                            <dd class="metadata-value artwork-title-value">${project.title}</dd>
                </div>
                        ${project.workType ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Work Type</dt>
                            <dd class="metadata-value">${project.workType}</dd>
                        </div>
                        ` : ''}
                        ${project.medium ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Medium</dt>
                            <dd class="metadata-value">${project.medium}</dd>
                        </div>
                        ` : ''}
                        ${project.years ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Date</dt>
                            <dd class="metadata-value">${project.years}</dd>
                        </div>
                        ` : ''}
                        ${project.dimensions ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Dimensions</dt>
                            <dd class="metadata-value">${project.dimensions}</dd>
                        </div>
                        ` : ''}
                        ${project.series ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Series</dt>
                            <dd class="metadata-value"><a href="#" onclick="window.openSeries('${slugify(project.series)}'); return false;">${project.series}</a></dd>
                        </div>
                        ` : ''}
                        ${project.exhibited ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Exhibited</dt>
                            <dd class="metadata-value">${project.exhibited}</dd>
                        </div>
                        ` : ''}
                        ${project.awards ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Awards</dt>
                            <dd class="metadata-value">${project.awards}</dd>
                        </div>
                        ` : ''}
                                        ${projectLink ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Link</dt>
                            <dd class="metadata-value"><a class="artwork-project-link" href="#" target="_blank" rel="noopener noreferrer">View project</a></dd>
                        </div>
                        ` : ''}
                        ${(project.collaborators || project.madeInCollaborationWith) ? `
                        <div class="metadata-item">
                            <dt class="metadata-label">Collaborators</dt>
                            <dd class="metadata-value artwork-collaborators-value">${((project.collaborators || project.madeInCollaborationWith) || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</dd>
                        </div>
                        ` : ''}
                    </dl>
                    ${project.statement ? `
                    <div class="artwork-description">
                        <p class="artwork-statement">${project.statement}</p>
                    </div>
                    ` : ''}
            </div>
        </div>
    `;
        
        // Store current artwork data for image switching
        window.currentArtworkData = {
            project: project,
            images: project.images,
            currentIndex: initialImageIndex
        };
        
        
        // Load main image with fallback after HTML is inserted
        setTimeout(() => {
            const imgElement = document.getElementById('artwork-main-image');
            if (imgElement && typeof window.loadImageWithFallback === 'function') {
                const imageBasePath = image.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
                window.loadImageWithFallback(imageBasePath, imgElement);
            } else if (imgElement) {
                imgElement.src = image;
            }
            // Set project link href (normalized to full URL) so clicks work
            if (projectLink) {
                const linkEl = artworkContent.querySelector('.artwork-image-link');
                if (linkEl) linkEl.href = projectLink;
                const metaLink = artworkContent.querySelector('.artwork-project-link');
                if (metaLink) metaLink.href = projectLink;
            }
            // Update image count after thumbnails have had time to load/fail
            setTimeout(() => {
                window.updateImageCount();
            }, 1000);
        }, 0);
    } else {
        // No image - show info only
        html = `
            <div class="artwork-viewer">
            <div class="artwork-info">
                <dl class="artwork-metadata">
                    <div class="metadata-item">
                        <dt class="metadata-label">Title</dt>
                        <dd class="metadata-value artwork-title-value">${project.title}</dd>
                    </div>
                    ${project.workType ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Work Type</dt>
                        <dd class="metadata-value">${project.workType}</dd>
                    </div>
                    ` : ''}
                    ${project.medium ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Medium</dt>
                        <dd class="metadata-value">${project.medium}</dd>
                    </div>
                    ` : ''}
                    ${project.years ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Date</dt>
                        <dd class="metadata-value">${project.years}</dd>
                    </div>
                    ` : ''}
                    ${project.dimensions ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Dimensions</dt>
                        <dd class="metadata-value">${project.dimensions}</dd>
                    </div>
                    ` : ''}
                    ${project.series ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Series</dt>
                        <dd class="metadata-value"><a href="#" onclick="window.openSeries('${slugify(project.series)}'); return false;">${project.series}</a></dd>
                    </div>
                    ` : ''}
                    ${project.exhibited ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Exhibited</dt>
                        <dd class="metadata-value">${project.exhibited}</dd>
                    </div>
                    ` : ''}
                    ${project.awards ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Awards</dt>
                        <dd class="metadata-value">${project.awards}</dd>
                    </div>
                    ` : ''}
                    ${projectLink ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Link</dt>
                        <dd class="metadata-value"><a class="artwork-project-link" href="#" target="_blank" rel="noopener noreferrer">View project</a></dd>
                    </div>
                    ` : ''}
                    ${(project.collaborators || project.madeInCollaborationWith) ? `
                    <div class="metadata-item">
                        <dt class="metadata-label">Collaborators</dt>
                        <dd class="metadata-value">${((project.collaborators || project.madeInCollaborationWith) || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</dd>
                    </div>
                    ` : ''}
                </dl>
                ${project.statement ? `
                <div class="artwork-description">
                    <p class="artwork-statement">${project.statement}</p>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    }

    artworkContent.innerHTML = html;
    
        // Set "View project" link href (for both with-image and no-image layouts)
        if (projectLink) {
            const metaLink = artworkContent.querySelector('.artwork-project-link');
            if (metaLink) metaLink.href = projectLink;
        }
    
        // Store current artwork data for image switching
        if (hasImages && image) {
            window.currentArtworkData = {
                project: project,
                images: project.images,
                currentIndex: initialImageIndex
            };
            
            // Load main image with fallback after HTML is inserted
            // Try each image path until one loads successfully
            setTimeout(() => {
                const imgElement = document.getElementById('artwork-main-image');
                if (imgElement && project.images && project.images.length > 0) {
                    let currentTry = initialImageIndex;
                    const tryLoadImage = () => {
                        if (currentTry < project.images.length) {
                            const imagePath = project.images[currentTry];
                            const imageBasePath = imagePath.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
                            
                            // Create a test image to check if it exists
                            const testImg = new Image();
                            let triedJpg = false;
                            let triedJpgUpper = false;
                            let triedGif = false;
                            let triedGifUpper = false;
                            
                            testImg.onload = () => {
                                // Image exists, load it directly (we already know the exact path that works)
                                imgElement.src = testImg.src;
                                imgElement.setAttribute('data-current-index', currentTry);
                                if (window.currentArtworkData) {
                                    window.currentArtworkData.currentIndex = currentTry;
                                }
                                window.updateImageCount(); // Update counter when main image loads
                            };
                            
                            let triedJpeg = false;
                            let triedJpegUpper = false;
                            testImg.onerror = () => {
                                if (!triedJpg) {
                                    triedJpg = true;
                                    testImg.src = imageBasePath + '.JPG';
                                } else if (!triedJpgUpper) {
                                    triedJpgUpper = true;
                                    testImg.src = imageBasePath + '.jpeg';
                                } else if (!triedJpeg) {
                                    triedJpeg = true;
                                    testImg.src = imageBasePath + '.JPEG';
                                } else if (!triedGif) {
                                    triedGif = true;
                                    testImg.src = imageBasePath + '.gif';
                                } else if (!triedGifUpper) {
                                    triedGifUpper = true;
                                    testImg.src = imageBasePath + '.GIF';
                                } else {
                                    currentTry++;
                                    tryLoadImage();
                                }
                            };

                            testImg.src = imageBasePath + '.jpg';
                        } else {
                            // No images found, hide the image element
                            if (imgElement) {
                                imgElement.style.display = 'none';
                            }
                        }
                    };
                    tryLoadImage();
                }
                
                // Update image count after a short delay to allow thumbnails to load
                setTimeout(() => {
                    window.updateImageCount();
                }, 1000);
            }, 0);
        }
    
    // Assign brushstrokes to newly created elements
    setTimeout(() => {
        if (typeof assignBrushstrokes === 'function') {
            assignBrushstrokes();
        }
    }, 50);
}

// Function to switch between images of the same artwork (thumbnail gallery)
window.switchArtworkImage = function(newIndex, imagePath) {
    if (!window.currentArtworkData) return;
    
    const imgElement = document.getElementById('artwork-main-image');
    if (!imgElement) return;
    
    // Try loading image with fallback (jpg, JPG, jpeg, JPEG, gif, GIF)
    const testImg = new Image();
    let triedJpg = false;
    let triedJpgUpper = false;
    let triedJpeg = false;
    let triedJpegUpper = false;
    let triedGif = false;
    
    testImg.onload = () => {
        imgElement.src = testImg.src;
        imgElement.setAttribute('data-current-index', newIndex);
        if (window.currentArtworkData) {
            window.currentArtworkData.currentIndex = newIndex;
        }
        document.querySelectorAll('.artwork-thumb').forEach((thumb) => {
            const thumbIndex = parseInt(thumb.getAttribute('data-image-index') || '-1');
            if (thumbIndex === newIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
        window.updateImageCount();
    };
    
    let triedGifUpper = false;
    testImg.onerror = () => {
        if (!triedJpg) {
            triedJpg = true;
            testImg.src = imagePath + '.JPG';
        } else if (!triedJpgUpper) {
            triedJpgUpper = true;
            testImg.src = imagePath + '.jpeg';
        } else if (!triedJpeg) {
            triedJpeg = true;
            testImg.src = imagePath + '.JPEG';
        } else if (!triedGif) {
            triedGif = true;
            testImg.src = imagePath + '.gif';
        } else if (!triedGifUpper) {
            triedGifUpper = true;
            testImg.src = imagePath + '.GIF';
        }
        // If all fail, image won't load
    };
    
    testImg.src = imagePath + '.jpg';
    
    // Update active thumbnail immediately (before image loads)
    document.querySelectorAll('.artwork-thumb').forEach((thumb) => {
        const thumbIndex = parseInt(thumb.getAttribute('data-image-index') || '-1');
        if (thumbIndex === newIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
};

// Get responsive number of columns based on container width
function getNumColumns(containerWidth) {
    if (containerWidth >= 1200) return 4;
    if (containerWidth >= 900) return 3;
    if (containerWidth >= 600) return 2;
    return 1;
}

// Masonry layout function - places items in 4 columns maintaining order
function applyMasonryLayout(itemCount) {
    const container = document.querySelector('.series-artworks-list');
    if (!container) return;
    
    const items = Array.from(container.querySelectorAll('.series-artwork-item'));
    if (items.length === 0) return;
    
    // Calculate column width (4 columns with gaps)
    const containerWidth = container.offsetWidth || container.parentElement.offsetWidth;
    if (!containerWidth || containerWidth === 0) {
        // Container not ready, try again later
        setTimeout(() => applyMasonryLayout(itemCount), 100);
        return;
    }
    
    const gap = 32; // 2rem = 32px
    const numColumns = getNumColumns(containerWidth); // Responsive column count
    const columnWidth = (containerWidth - (gap * (numColumns - 1))) / numColumns;
    
    // Track heights of each column
    const columnHeights = Array(numColumns).fill(0);
    
    // Position each item in the shortest column
    items.forEach((item, index) => {
        // Ensure item is visible and measurable
        item.style.opacity = '1';
        item.style.visibility = 'visible';
        item.style.display = 'flex';
        
        // Position the item first (temporarily) to get accurate measurements
        item.style.position = 'absolute';
        item.style.left = '0';
        item.style.top = '0';
        item.style.width = `${columnWidth}px`;
        
        // Force a reflow to get accurate measurements
        void item.offsetHeight;
        
        // Get current height (including image if loaded)
        // Use a minimum height to prevent items from disappearing
        const currentHeight = Math.max(item.offsetHeight || item.scrollHeight, 100);
        
        // Check if images are loaded and ensure they're visible
        const img = item.querySelector('.series-artwork-img');
        if (img) {
            img.style.opacity = '1';
        }
        
        // Find the shortest column
        const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
        
        // Now position the item in the correct column
        item.style.left = `${shortestColumn * (columnWidth + gap)}px`;
        item.style.top = `${columnHeights[shortestColumn]}px`;
        item.style.marginRight = '0';
        item.style.marginBottom = '0';
        
        columnHeights[shortestColumn] += currentHeight + gap;
    });
    
    // Set container height to accommodate all items
    const maxHeight = Math.max(...columnHeights);
    container.style.height = `${maxHeight}px`;
    container.style.position = 'relative';
}

// Re-apply masonry on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const container = document.querySelector('.series-artworks-list');
        if (container) {
            const itemCount = container.querySelectorAll('.series-artwork-item').length;
            applyMasonryLayout(itemCount);
        }
    }, 250);
});

// Re-apply masonry when images load
function reapplyMasonryOnImageLoad() {
    const container = document.querySelector('.series-artworks-list');
    if (!container) return;
    
    const items = container.querySelectorAll('.series-artwork-item');
    items.forEach(item => {
        const img = item.querySelector('.series-artwork-img');
        if (img) {
            const handleLoad = () => {
                setTimeout(() => {
                    const itemCount = container.querySelectorAll('.series-artwork-item').length;
                    applyMasonryLayout(itemCount);
                }, 50);
            };
            if (img.complete) {
                handleLoad();
            } else {
                img.addEventListener('load', handleLoad, { once: true });
            }
        }
    });
}

// Freeze GIF thumbnail to show only first frame (prevent animation)
window.freezeGifThumbnail = function(imgElement) {
    if (!imgElement || !imgElement.src) return;
    
    // Check if it's a GIF
    const src = imgElement.src.toLowerCase();
    if (!src.endsWith('.gif')) return;
    
    // Create canvas to extract first frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Replace GIF src with canvas data URL (static first frame)
        imgElement.src = canvas.toDataURL('image/png');
    };
    
    img.src = imgElement.src;
};

// Function to update the image count based on visible thumbnails
window.updateImageCount = function() {
    const thumbnailsContainer = document.getElementById('artwork-thumbnails-container');
    if (!thumbnailsContainer) return;
    
    // Get all thumb buttons and filter to only those that are visible (not hidden)
    const allThumbs = Array.from(thumbnailsContainer.querySelectorAll('.artwork-thumb'));
    const visibleThumbs = allThumbs.filter(thumb => {
        // Button is hidden if it has data-hidden attribute OR display is none
        if (thumb.hasAttribute('data-hidden')) return false;
        const computedStyle = window.getComputedStyle(thumb);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return false;
        
        // Also check if the img inside is hidden
        const img = thumb.querySelector('img');
        if (img) {
            if (img.hasAttribute('data-hidden')) return false;
            const imgStyle = window.getComputedStyle(img);
            if (imgStyle.display === 'none' || imgStyle.visibility === 'hidden') return false;
        }
        
        return true;
    });
    
    const actualCount = visibleThumbs.length;
    
    // Update the counter if it exists
    const counter = document.getElementById('artwork-image-counter');
    if (!counter) return;
    
    if (actualCount === 0) {
        counter.textContent = '';
        return;
    }
    
    // Find the active thumbnail
    let activeThumb = visibleThumbs.find(thumb => thumb.classList.contains('active'));
    
    // If no active thumbnail found, try to find by data-current-index
    if (!activeThumb) {
        const imgElement = document.getElementById('artwork-main-image');
        if (imgElement) {
            const currentIndex = parseInt(imgElement.getAttribute('data-current-index') || '-1');
            if (currentIndex >= 0) {
                activeThumb = visibleThumbs.find(thumb => {
                    const thumbIndex = parseInt(thumb.getAttribute('data-image-index') || '-1');
                    return thumbIndex === currentIndex;
                });
            }
        }
    }
    
    // Calculate position (1-based)
    let position = 1;
    if (activeThumb) {
        position = visibleThumbs.indexOf(activeThumb) + 1;
        // Safety check: if indexOf returns -1, default to 1
        if (position === 0) position = 1;
    }
    
    counter.textContent = `${position} / ${actualCount}`;
};

// Utility function to assign brushstroke SVGs to elements
function assignBrushstrokes() {
    const brushstrokes = [
        'brushstroke-30.svg',
        'brushstroke-31.svg',
        'brushstroke-32.svg',
        'brushstroke-33.svg',
        'brushstroke-34.svg',
        'brushstroke-35.svg',
        'brushstroke-36.svg'
    ];
    
    // Select all elements that should have brushstroke backgrounds (excluding home page)
    // Note: series-artwork-title and tags in series/artwork pages should NOT have brushstrokes
    const selectors = [
        '.chip',
        '.control input',
        '.control select',
        '.btn-clear',
        '.bento-tile',
        '.tag:not(.series-artwork-tags .tag):not(.artwork-tags .tag)', // Exclude tags in series/artwork pages
        '.project-item',
        '.back-button',
        '.artwork-thumbnail',
        '.nav-arrow',
        '.project-thumb',
        '.works-controls'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector + ':not(.has-brushstroke)');
        elements.forEach(element => {
            // Skip if element is inside home page
            if (element.closest('#home')) {
                return;
            }
            
            // Randomly select a brushstroke
            const randomBrushstroke = brushstrokes[Math.floor(Math.random() * brushstrokes.length)];
            // Store background properties in CSS custom properties for pseudo-element
            element.style.setProperty('--brushstroke-bg', `url('assets/${randomBrushstroke}')`);
            // For series artwork titles, stretch to match image width; for others, use contain
            if (element.classList.contains('series-artwork-title')) {
                element.style.setProperty('--brushstroke-size', '100% auto'); // Stretch horizontally to match image width exactly
            } else {
                element.style.setProperty('--brushstroke-size', 'contain'); // Use contain to show entire SVG
            }
            element.style.setProperty('--brushstroke-repeat', 'no-repeat');
            element.style.setProperty('--brushstroke-position', 'center');
            // Set text color to white
            element.style.setProperty('color', '#ffffff', 'important');
            element.style.position = 'relative';
            element.classList.add('has-brushstroke');
            
            // Force all child text elements to be white with !important
            const allChildren = element.querySelectorAll('*');
            allChildren.forEach(child => {
                // Skip images, SVGs, and paths
                if (child.tagName !== 'IMG' && child.tagName !== 'SVG' && child.tagName !== 'PATH') {
                    child.style.setProperty('color', '#ffffff', 'important');
                }
            });
            
            // Also set text content color directly on text nodes if possible
            // This ensures even text that's not wrapped in elements gets white
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            let textNode;
            while (textNode = walker.nextNode()) {
                // Wrap text nodes in spans if they're direct children
                if (textNode.parentNode === element && textNode.textContent.trim()) {
                    const span = document.createElement('span');
                    span.style.setProperty('color', '#ffffff', 'important');
                    textNode.parentNode.insertBefore(span, textNode);
                    span.appendChild(textNode);
                }
            }
        });
    });
}

// Make assignBrushstrokes globally available
window.assignBrushstrokes = assignBrushstrokes;

// Initialize brushstrokes on page load and when content is dynamically added
// Note: This is called separately from the main DOMContentLoaded handler
// to ensure it runs after other initialization
setTimeout(() => {
    if (typeof assignBrushstrokes === 'function') {
        assignBrushstrokes();
    }
}, 1000);

// Re-assign when sheets data loads (for dynamically created elements)
window.addEventListener('sheetsDataLoaded', function() {
    setTimeout(() => {
        if (typeof assignBrushstrokes === 'function') {
            assignBrushstrokes();
        }
    }, 200);
});

// Initialize home page carousel
function initHomeCarousel() {
    const carousel = document.getElementById('homeCarousel');
    const carousel2 = document.getElementById('homeCarousel2');
    
    if (!carousel || !carousel2) return;

    // Wait for projects to load if not available yet
    if (!window.PROJECTS || !Array.isArray(window.PROJECTS) || window.PROJECTS.length === 0) {
        setTimeout(initHomeCarousel, 100);
        return;
    }

    // Clear existing carousel items to avoid duplicates
    carousel.innerHTML = '';
    carousel2.innerHTML = '';

    // Use artworks (individual pieces) instead of series for carousel
    // If ARTWORKS is available, use that; otherwise fall back to PROJECTS
    let items = window.ARTWORKS || window.PROJECTS || [];
    
    // If we have series (PROJECTS), extract artworks from them for carousel
    if (window.ARTWORKS && window.ARTWORKS.length > 0) {
        items = window.ARTWORKS;
    } else if (window.PROJECTS && window.PROJECTS.length > 0) {
        // Extract artworks from series
        items = [];
        window.PROJECTS.forEach(series => {
            if (series.artworks && series.artworks.length > 0) {
                items.push(...series.artworks);
            } else {
                // If series doesn't have artworks array, use the series itself
                items.push(series);
            }
        });
    }
    
    // Filter to Selected Work = Y (from Google Sheet), fall back to featured, then all items
    const selectedItems = items.filter(p => p.selectedWork);
    const featuredItems = items.filter(p => p.featured).slice(0, 8);
    const itemsForFirst = selectedItems.length > 0
        ? selectedItems.slice(0, 8)
        : featuredItems.length > 0
            ? featuredItems
            : items.slice(0, 8);
    
    // Get different items for second carousel (from same pool as first: selected, featured, or all)
    const poolForSecond = selectedItems.length > 0 ? selectedItems : items;
    const itemsForSecond = poolForSecond
        .filter(p => !itemsForFirst.some(fp => fp.id === p.id))
        .slice(0, 8);
    
    // If not enough items for second carousel, use offset from same pool
    const itemsForSecondFinal = itemsForSecond.length >= 8 
        ? itemsForSecond 
        : poolForSecond.slice(4, 12);

    if (itemsForFirst.length === 0) {
        console.warn('⚠️ No items available for carousel');
        return;
    }
    
    // Preload first carousel images for faster display
    if (typeof window.preloadImage === 'function') {
        itemsForFirst.slice(0, 4).forEach(item => {
            if (item.thumbnail) {
                const jpegPath = item.thumbnail.replace(/\.(jpg|jpeg|png|webp)$/i, '') + '.jpg';
                // Preload JPEG (optimized for performance)
                window.preloadImage(jpegPath);
            }
        });
    }
    
    // Create items for both carousels
    createCarouselItems(carousel, itemsForFirst);
    createCarouselItems(carousel2, itemsForSecondFinal);
}

// Quick Mini Portfolio - show 3 images from mini-portfolio folder
const MINI_PORTFOLIO_IMAGES = [
    'assets/images/mini-portfolio/mini-portfolio-01.jpg',
    'assets/images/mini-portfolio/mini-portfolio-02.jpg',
    'assets/images/mini-portfolio/mini-portfolio-03.jpg'
];

// Preload mini portfolio images for instant display
const miniPortfolioPreloadedImages = [];
MINI_PORTFOLIO_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
    miniPortfolioPreloadedImages.push(img);
});

function setupMiniPortfolioButton() {
    const btn = document.getElementById('quickMiniPortfolioBtn');
    const overlay = document.getElementById('miniPortfolioOverlay');
    const closeBtn = document.getElementById('miniPortfolioClose');
    const imagesContainer = document.getElementById('miniPortfolioImages');
    
    if (!btn || !overlay || !imagesContainer) return;
    if (btn.dataset.miniPortfolioSetup === 'true') return;
    btn.dataset.miniPortfolioSetup = 'true';
    
    function openMiniPortfolio() {
        imagesContainer.innerHTML = '';
        // Use preloaded images for instant display
        miniPortfolioPreloadedImages.forEach((preloadedImg, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'mini-portfolio-img-wrap';
            const img = document.createElement('img');
            img.alt = 'Mini portfolio';
            img.src = preloadedImg.src;
            wrap.appendChild(img);
            imagesContainer.appendChild(wrap);
        });
        
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // Change nav button color only after slide animation completes (0.45s)
        setTimeout(() => {
            document.body.classList.add('mini-portfolio-open');
        }, 450);
    }
    
    function closeMiniPortfolio() {
        document.body.classList.remove('mini-portfolio-open');
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    
    btn.addEventListener('click', openMiniPortfolio);
    closeBtn.addEventListener('click', closeMiniPortfolio);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeMiniPortfolio();
        }
    });
}

