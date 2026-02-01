// Works page functionality
(function(){
    const $ = (sel, root=document) => root.querySelector(sel);
    const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

    // Helper function to slugify (same as in sheets-loader)
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // Projects array (series) - for catalog
    let projects = Array.isArray(window.PROJECTS) ? window.PROJECTS.slice() : [];
    // Artworks array (individual pieces) - for selected works
    let artworks = Array.isArray(window.ARTWORKS) ? window.ARTWORKS.slice() : [];
    
    // Function to update projects and artworks from window
    function updateProjects() {
        if (Array.isArray(window.PROJECTS) && window.PROJECTS.length > 0) {
            projects = window.PROJECTS.slice();
        }
        if (Array.isArray(window.ARTWORKS) && window.ARTWORKS.length > 0) {
            artworks = window.ARTWORKS.slice();
        }
        // Re-render if works page is active
        if (typeof renderAll === 'function') {
            renderAll();
        }
        if (typeof renderChips === 'function') {
            renderChips();
        }
    }
    
    const state = {
        activeTags: new Set(),
        search: "",
        sort: "featured"
    };

    const chipsEl = $("#filterChips");
    const bentoEl = $("#selectedWorks");
    const catalogEl = $("#projectsCatalog");
    const searchEl = $("#worksSearch");
    const sortEl = $("#worksSort");
    const clearEl = $("#worksClear");

    function uniqueTags(){
        const set = new Set();
        // Get tags from both artworks and series
        artworks.forEach(a => (a.tags||[]).forEach(t => set.add(t)));
        projects.forEach(p => (p.tags||[]).forEach(t => set.add(t)));
        const preferred = ["Photography","Print","Screenprint","Sculpture","3D","Drawing","Painting","Design","Graphic Design","Data","System"];
        const rest = Array.from(set).filter(t => !preferred.includes(t)).sort((a,b)=>a.localeCompare(b));
        return preferred.filter(t => set.has(t)).concat(rest);
    }

    function renderChips(){
        if (!chipsEl) return;
        const tags = uniqueTags();
        chipsEl.innerHTML = "";
        tags.forEach(tag => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chip";
            btn.textContent = tag;
            btn.setAttribute("aria-pressed", state.activeTags.has(tag) ? "true" : "false");
            btn.addEventListener("click", () => {
                if(state.activeTags.has(tag)) state.activeTags.delete(tag);
                else state.activeTags.add(tag);
                renderAll();
            });
            chipsEl.appendChild(btn);
        });
    }

    function matchesFilters(p){
        const s = state.search.trim().toLowerCase();
        const tagOk = state.activeTags.size === 0 || (p.tags||[]).some(t => state.activeTags.has(t));
        const searchOk = !s || (
            (p.title||"").toLowerCase().includes(s) ||
            (p.blurb||"").toLowerCase().includes(s) ||
            (p.statement||"").toLowerCase().includes(s) ||
            (p.tags||[]).join(" ").toLowerCase().includes(s)
        );
        return tagOk && searchOk;
    }

    function yearKey(p){
        const m = String(p.years||"").match(/(19|20)\d{2}/);
        return m ? parseInt(m[0],10) : 0;
    }

    function sortProjects(list){
        const v = state.sort;
        const a = list.slice();
        if(v === "featured"){
            a.sort((p,q) => {
                const fp = p.featured ? 0 : 1;
                const fq = q.featured ? 0 : 1;
                if(fp !== fq) return fp - fq;
                return (yearKey(q) - yearKey(p)) || (p.title||"").localeCompare(q.title||"");
            });
        }else if(v === "newest"){
            a.sort((p,q) => (yearKey(q) - yearKey(p)) || (p.title||"").localeCompare(q.title||""));
        }else if(v === "oldest"){
            a.sort((p,q) => (yearKey(p) - yearKey(q)) || (p.title||"").localeCompare(q.title||""));
        }else if(v === "az"){
            a.sort((p,q) => (p.title||"").localeCompare(q.title||""));
        }
        return a;
    }

    function makeTags(tags){
        const wrap = document.createElement("div");
        wrap.className = "item-tags";
        (tags||[]).slice(0,4).forEach(t => {
            const span = document.createElement("span");
            span.className = "tag";
            span.textContent = t;
            wrap.appendChild(span);
        });
        return wrap;
    }

    function renderBento(list){
        if (!bentoEl) return;
        // Use the provided list (which should already be filtered and sorted)
        const featured = list.filter(p => p.featured);
        const picks = (featured.length ? featured : list).slice(0,8);

        const sizes = ["size-l","size-m","size-s","size-xs","size-s","size-m","size-xs","size-s"];
        bentoEl.innerHTML = "";

        picks.forEach((p, i) => {
            const tile = document.createElement("article");
            tile.className = `bento-tile ${sizes[i % sizes.length]}`;
            tile.tabIndex = 0;
            tile.setAttribute("role","button");
            tile.setAttribute("aria-label", `Open ${p.title}`);

            const inner = document.createElement("div");
            inner.className = "tile-inner";

            const title = document.createElement("div");
            title.className = "tile-title";
            title.textContent = p.title;

            const meta = document.createElement("div");
            meta.className = "tile-meta";
            meta.textContent = `${p.years || ""}`;

            const tagRow = document.createElement("div");
            tagRow.style.display = "flex";
            tagRow.style.gap = "8px";
            tagRow.style.flexWrap = "wrap";
            (p.tags||[]).slice(0,3).forEach(t => {
                const span = document.createElement("span");
                span.className = "tag";
                span.textContent = t;
                tagRow.appendChild(span);
            });

            inner.appendChild(title);
            inner.appendChild(meta);
            inner.appendChild(tagRow);
            tile.appendChild(inner);

            // Click handler for artworks in selected works - open individual artwork page
            tile.addEventListener("click", () => {
                // Open the individual artwork page directly
                if (p.id && typeof window.openArtwork === 'function') {
                    window.openArtwork(p.id, 0);
                } else if (p.id) {
                    console.warn('openArtwork function not available');
                } else {
                    console.warn('Artwork has no ID:', p);
                }
            });
            tile.addEventListener("keydown", (e) => {
                if(e.key === "Enter" || e.key === " "){
                    e.preventDefault();
                    if (p.id && typeof window.openArtwork === 'function') {
                        window.openArtwork(p.id, 0);
                    }
                }
            });

            bentoEl.appendChild(tile);
        });
    }

    function renderCatalog(list){
        if (!catalogEl) return;
        catalogEl.innerHTML = "";

        if(list.length === 0){
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.innerHTML = `<h3>No matches</h3><p>Try clearing filters or searching different keywords.</p>`;
            catalogEl.appendChild(empty);
            return;
        }

        list.forEach(p => {
            const item = document.createElement("article");
            item.className = "project-item";
            item.tabIndex = 0;
            item.setAttribute("role","button");
            item.setAttribute("aria-label", `Open ${p.title}`);

            const thumb = document.createElement("div");
            thumb.className = "project-thumb";
            const t = document.createElement("div");
            t.className = "thumb-title";
            t.textContent = p.title;
            thumb.appendChild(t);

            const main = document.createElement("div");
            main.className = "project-main";

            const h = document.createElement("h4");
            h.className = "project-title";
            h.textContent = p.title;

            const sub = document.createElement("div");
            sub.className = "project-sub";
            sub.textContent = `${p.years || ""}`;

            const blurb = document.createElement("p");
            blurb.className = "project-blurb";
            blurb.textContent = p.blurb || "";

            main.appendChild(h);
            main.appendChild(sub);
            main.appendChild(makeTags(p.tags));
            main.appendChild(blurb);

            item.appendChild(thumb);
            item.appendChild(main);

            item.addEventListener("click", () => openProject(p.id));
            item.addEventListener("keydown", (e) => {
                if(e.key === "Enter" || e.key === " "){
                    e.preventDefault();
                    openProject(p.id);
                }
            });

            catalogEl.appendChild(item);
        });
        
        // Assign brushstrokes to newly created elements
        if (typeof window.assignBrushstrokes === 'function') {
            setTimeout(() => {
                window.assignBrushstrokes();
            }, 100);
        }
    }

    function renderAll(){
        if (!chipsEl || !bentoEl || !catalogEl) return;
        
        // Update chip aria state
        $$(".chip", chipsEl).forEach(btn => {
            const tag = btn.textContent;
            btn.setAttribute("aria-pressed", state.activeTags.has(tag) ? "true" : "false");
        });

        // Filter and sort artworks for selected works
        const filteredArtworks = artworks.filter(matchesFilters);
        const sortedArtworks = sortProjects(filteredArtworks);
        
        // Filter and sort series for catalog
        const filteredProjects = projects.filter(matchesFilters);
        const sortedProjects = sortProjects(filteredProjects);

        renderBento(sortedArtworks);
        renderCatalog(sortedProjects);
    }

    function openProject(id){
        // Navigate to series page
        if (typeof window.openSeries === 'function') {
            window.openSeries(id);
        } else if (typeof openSeries === 'function') {
            openSeries(id);
        } else {
            console.error('openSeries function not found');
        }
    }

    // Initialize only when works page is active
    function initWorks(){
        if (!chipsEl || !bentoEl || !catalogEl || !searchEl || !sortEl || !clearEl) return;
        
        // Update projects before initializing
        updateProjects();
        
        // Check if we have projects
        if (projects.length === 0) {
            console.warn('⚠️ Works page: No projects available yet. Waiting for data...');
            // Try again in a moment
            setTimeout(initWorks, 500);
            return;
        }

        renderChips();

        searchEl.addEventListener("input", () => {
            state.search = searchEl.value;
            renderAll();
        });

        sortEl.addEventListener("change", () => {
            state.sort = sortEl.value;
            renderAll();
        });

        clearEl.addEventListener("click", () => {
            state.activeTags.clear();
            state.search = "";
            state.sort = "featured";
            searchEl.value = "";
            sortEl.value = "featured";
            renderChips();
            renderAll();
        });

        renderAll();
    }

    // Check if works page is active and initialize
    function checkAndInit(){
        const worksPage = $("#works");
        if (worksPage && worksPage.classList.contains("active")) {
            // Only initialize once
            if (!worksPage.dataset.initialized) {
                initWorks();
                worksPage.dataset.initialized = "true";
            }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkAndInit();
            
            // Watch for page changes
            const observer = new MutationObserver(() => {
                checkAndInit();
            });
            
            const worksPage = $("#works");
            if (worksPage) {
                observer.observe(worksPage, { attributes: true, attributeFilter: ['class'] });
            }
        });
    
    // Assign brushstrokes to newly created elements
    if (typeof window.assignBrushstrokes === 'function') {
        setTimeout(() => {
            window.assignBrushstrokes();
        }, 100);
    }
    } else {
        checkAndInit();
        
        // Watch for page changes
        const worksPage = $("#works");
        if (worksPage) {
            const observer = new MutationObserver(() => {
                checkAndInit();
            });
            observer.observe(worksPage, { attributes: true, attributeFilter: ['class'] });
        }
    }

    // Listen for custom event when works page is activated
    window.addEventListener('worksPageActivated', () => {
        checkAndInit();
    });
    
    // Listen for sheets data loaded event
    window.addEventListener('sheetsDataLoaded', (event) => {
        console.log('📦 Works page: Sheets data loaded, updating projects...');
        updateProjects();
        // Re-initialize if works page is active
        checkAndInit();
    });

    // Also listen to navigation button clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-button[data-page="works"]')) {
            setTimeout(() => {
                updateProjects();
                checkAndInit();
            }, 100);
        }
    });
    
    // Also check periodically if projects become available (fallback)
    let checkInterval = setInterval(() => {
        if (Array.isArray(window.PROJECTS) && window.PROJECTS.length > 0 && projects.length === 0) {
            console.log('📦 Works page: Projects detected, updating...');
            updateProjects();
            clearInterval(checkInterval);
        }
    }, 500);
    
    // Clear interval after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
})();

