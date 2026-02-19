document.addEventListener('DOMContentLoaded', () => {
    
    // 1. STATE MANAGEMENT
    let currentColumn = parseInt(localStorage.getItem('currentColumn')) || 0;
    const columns = document.querySelectorAll('.column');
    
    let storedRows = JSON.parse(localStorage.getItem('rowIndices'));
    let rowIndices = (storedRows && storedRows.length === columns.length) ? storedRows : new Array(columns.length).fill(0);

    const debounceTime = 400; 
    let isScrolling = false;
    let isLightboxOpen = false;

    // 2. LIGHTBOX LOGIC
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    document.querySelectorAll('.project-img').forEach(img => {
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightbox.classList.add('active');
            isLightboxOpen = true;
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        setTimeout(() => { isLightboxOpen = false; }, 300);
    }

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) closeLightbox();
    });

    // 3. CAROUSEL LOGIC
    function initCarousels() {
        const carousels = document.querySelectorAll('.carousel-wrapper');
        
        carousels.forEach(wrapper => {
            const container = wrapper.querySelector('.visual-container');
            const prevBtn = wrapper.querySelector('.carousel-btn.prev');
            const nextBtn = wrapper.querySelector('.carousel-btn.next');
            const images = container.querySelectorAll('.project-img');
            
            if (images.length <= 1) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                return;
            }

            let autoScrollInterval;

            const scrollNext = () => {
                if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } 
                else {
                    container.scrollBy({ left: container.clientWidth * 0.95, behavior: 'smooth' });
                }
            };

            const scrollPrev = () => {
                if (container.scrollLeft <= 10) {
                    container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
                } 
                else {
                    container.scrollBy({ left: -(container.clientWidth * 0.95), behavior: 'smooth' });
                }
            };

            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                scrollPrev();
                resetAutoScroll();
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                scrollNext();
                resetAutoScroll();
            });

            const startAutoScroll = () => {
                clearInterval(autoScrollInterval); 
                autoScrollInterval = setInterval(scrollNext, 3500); 
            };

            const resetAutoScroll = () => {
                startAutoScroll();
            };

            wrapper.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
            wrapper.addEventListener('mouseleave', () => {
                if (!isLightboxOpen) startAutoScroll();
            });

            startAutoScroll();
        });
    }

    // 4. MINIMAP LOGIC
    function initMinimap() {
        const mapContainer = document.getElementById('minimap');
        mapContainer.innerHTML = '';

        columns.forEach((col, colIndex) => {
            const mapCol = document.createElement('div');
            mapCol.className = 'map-col';

            const slideCount = col.querySelectorAll('.slide').length;

            for (let i = 0; i < slideCount; i++) {
                const dot = document.createElement('div');
                dot.className = 'map-dot';
                dot.id = `dot-${colIndex}-${i}`;
                
                dot.addEventListener('click', () => {
                    if (isLightboxOpen) return;
                    currentColumn = colIndex;
                    rowIndices[currentColumn] = i;
                    updatePosition();
                });

                mapCol.appendChild(dot);
            }
            mapContainer.appendChild(mapCol);
        });
        
        updateMinimap(true);
    }

    function updateMinimap(isInitial = false) {
        document.querySelectorAll('.map-dot').forEach(dot => dot.classList.remove('active'));

        const activeRow = rowIndices[currentColumn];
        const activeDot = document.getElementById(`dot-${currentColumn}-${activeRow}`);
        if (activeDot) activeDot.classList.add('active');

        const mapCols = document.querySelectorAll('.map-col');
        
        mapCols.forEach((mapCol, colIndex) => {
            if(isInitial) mapCol.classList.add('no-transition');

            const rowIndex = rowIndices[colIndex];
            const stepSize = 20;
            
            mapCol.style.transform = `translateY(-${stepSize * rowIndex}px)`;

            if(isInitial) {
                void mapCol.offsetHeight; 
                mapCol.classList.remove('no-transition');
            }
        });
    }

    // 5. CORE NAVIGATION LOGIC
    function updatePosition(isInitial = false) {
        localStorage.setItem('currentColumn', currentColumn);
        localStorage.setItem('rowIndices', JSON.stringify(rowIndices));

        const world = document.getElementById('world');
        const activeCol = document.getElementById(`col-${currentColumn}`);

        if (isInitial) {
            world.classList.add('no-transition');
            columns.forEach((col, index) => {
                col.classList.add('no-transition');
                col.style.transform = `translateY(-${rowIndices[index] * 100}vh)`;
            });
        }

        world.style.transform = `translateX(-${currentColumn * 100}vw)`;
        
        if (!isInitial) {
            activeCol.style.transform = `translateY(-${rowIndices[currentColumn] * 100}vh)`;
        }

        updateMinimap(isInitial);

        if (isInitial) {
            void world.offsetHeight;
            world.classList.remove('no-transition');
            columns.forEach(col => col.classList.remove('no-transition'));
        }
    }

    function handleInput(direction) {
        if (isScrolling || isLightboxOpen) return;

        const activeCol = document.getElementById(`col-${currentColumn}`);
        const maxRows = activeCol.querySelectorAll('.slide').length - 1;
        let didMove = false;

        if (direction === 'RIGHT') {
            if (currentColumn < columns.length - 1) currentColumn++;
            else currentColumn = 0;
            didMove = true;
        } 
        else if (direction === 'LEFT') {
            if (currentColumn > 0) currentColumn--;
            else currentColumn = columns.length - 1;
            didMove = true;
        }
        else if (direction === 'DOWN') {
            if (rowIndices[currentColumn] < maxRows) rowIndices[currentColumn]++;
            else rowIndices[currentColumn] = 0;
            didMove = true;
        } 
        else if (direction === 'UP') {
            if (rowIndices[currentColumn] > 0) rowIndices[currentColumn]--;
            else rowIndices[currentColumn] = maxRows;
            didMove = true;
        }

        if (didMove) {
            isScrolling = true;
            updatePosition();
            setTimeout(() => isScrolling = false, debounceTime);
        }
    }

    // 6. EVENT LISTENERS
    window.addEventListener('wheel', (e) => {
        if (isLightboxOpen || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.ctrlKey) return;
        if (Math.abs(e.deltaY) < 20) return;

        if (e.shiftKey) {
            e.deltaY > 0 ? handleInput('RIGHT') : handleInput('LEFT');
        } 
        else {
            e.deltaY > 0 ? handleInput('DOWN') : handleInput('UP');
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isLightboxOpen) {
            closeLightbox();
            return;
        }
        if (isLightboxOpen) return;

        switch(e.key) {
            case 'ArrowRight': case 'd': case 'D': handleInput('RIGHT'); break;
            case 'ArrowLeft': case 'a': case 'A': handleInput('LEFT'); break;
            case 'ArrowDown': case 's': case 'S': handleInput('DOWN'); break;
            case 'ArrowUp': case 'w': case 'W': handleInput('UP'); break;
        }
    });

    let touchStartX = 0;
    let touchStartY = 0;

    window.addEventListener('touchstart', (e) => {
        if (isLightboxOpen) return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    window.addEventListener('touchend', (e) => {
        if (isLightboxOpen) return;
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (e.target.classList.contains('project-img') || e.target.closest('.visual-container')) return; 

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 50) diffX < 0 ? handleInput('RIGHT') : handleInput('LEFT');
        } 
        else {
            if (Math.abs(diffY) > 50) diffY < 0 ? handleInput('DOWN') : handleInput('UP');
        }
    }, {passive: true});

    document.getElementById("right").onclick = () => handleInput('RIGHT');
    document.getElementById("left").onclick = () => handleInput('LEFT');
    document.getElementById("down").onclick = () => handleInput('DOWN');
    document.getElementById("up").onclick = () => handleInput('UP');

    // --- 7. INITIALIZATION ---
    initMinimap();
    initCarousels();
    updatePosition(true);
});