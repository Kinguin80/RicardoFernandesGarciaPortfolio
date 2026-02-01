/**
 * Google Sheets Data Loader (Browser-based)
 * 
 * This script loads data directly from your Google Sheets spreadsheet
 * and populates the portfolio without needing to run Node.js scripts.
 * 
 * Setup:
 *   1. Publish your Google Sheet to the web (File > Share > Publish to web > CSV)
 *   2. Update the SHEET_ID and SHEET_NAME constants below
 *   3. Include this script before script.js in your HTML
 * 
 * Usage:
 *   <script src="assets/sheets-loader.js"></script>
 *   <script src="script.js"></script>
 */

(function() {
    'use strict';
    
    // Configuration - Direct CSV URL from published Google Sheet
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6epXik9wR62Z5qlvxzDpxqCMA8Mxit7suwWtTwRBLi0MRysxoGIT0ikcv4_8hYBJ-R36Qy1m4cKRX/pub?gid=0&single=true&output=csv';
    
    /**
     * Create a slug from a string
     */
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    /**
     * Parse CSV line handling quoted values
     */
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Push current value (even if empty) and reset
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Push the last value
        result.push(current.trim());
        
        // Ensure we always return at least 11 columns (for empty rows; 9+10=link, 11=Made in Collaboration with)
        while (result.length < 11) {
            result.push('');
        }
        
        return result;
    }
    
    /**
     * Extract year from years string
     */
    function parseYears(yearsStr) {
        if (!yearsStr) return '';
        const match = yearsStr.toString().match(/(\d{4})/);
        return match ? match[0] : yearsStr.toString().trim();
    }
    
    /**
     * Transform a single row into a project object
     * @param {string[]} row - CSV row values
     * @param {Object} col - Column indices (from header); falls back to 0-10 if not provided
     */
    function transformRow(row, col) {
        if (!col) col = { title: 0, series: 1, years: 2, workType: 3, medium: 4, dimensions: 5, theme: 6, exhibited: 7, awards: 8, link: 9, madeInCollaborationWith: 10 };
        const get = (i) => (row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : '');
        const title = get(col.title);
        const series = get(col.series);
        const years = get(col.years);
        const workType = get(col.workType);
        const medium = get(col.medium);
        const dimensions = get(col.dimensions);
        const theme = get(col.theme);
        const exhibited = get(col.exhibited);
        const awards = get(col.awards);
        const link = get(col.link);
        const madeInCollaborationWith = get(col.madeInCollaborationWith);
        const collaborators = (col.collaborators >= 0 ? get(col.collaborators) : '') || madeInCollaborationWith;
        const selectedWorkVal = (col.selectedWork >= 0 ? get(col.selectedWork) : '').toUpperCase();
        const selectedWork = selectedWorkVal === 'Y';
        
        // Skip empty rows or header
        if (!title || title === '' || title.toLowerCase() === 'title') {
            return null;
        }
        
        const id = slugify(title);
        const tags = workType ? [workType] : [];
        const yearsStr = years ? parseYears(years) : '';
        
        const project = {
            id: id,
            title: title,
            years: yearsStr,
            tags: tags,
            featured: false,
            blurb: medium ? `${workType || 'Artwork'}${workType && medium ? ' created using ' : ''}${medium}` : '',
        };
        
        // Only add properties if they have values
        if (series) {
            project.series = series;
        }
        
        if (theme) {
            project.statement = theme;
        }
        
        if (dimensions) {
            project.dimensions = dimensions;
        }
        
        if (medium) {
            project.medium = medium;
        }
        
        if (workType) {
            project.workType = workType;
        }
        
        if (exhibited) {
            project.exhibited = exhibited;
        }
        
        if (awards) {
            project.awards = awards;
        }
        
        if (link) {
            project.link = link;
        }
        
        if (madeInCollaborationWith) {
            project.madeInCollaborationWith = madeInCollaborationWith;
        }
        if (collaborators) {
            project.collaborators = collaborators;
        }
        
        if (selectedWork) {
            project.selectedWork = true;
        }
        
        // Image paths - automatically generated (supports WebP/JPEG fallback)
        // Structure: assets/images/{series-folder}/{artwork-folder}/{artwork-id}.jpg
        // If no series: assets/images/artworks/{artwork-folder}/{artwork-id}.jpg
        // STANDARDIZED: All folders use slugified names (lowercase, no spaces, URL-safe)
        // Each artwork gets its own folder within the series folder
        const seriesFolder = series ? slugify(series) : 'artworks';
        const artworkFolder = id; // Artwork ID is already slugified, so folder name matches
        const baseImagePath = `assets/images/${seriesFolder}/${artworkFolder}/${id}`;
        
        // Check if artwork title matches series title (like "vanished-spaces-banished-faces")
        // For vanished-spaces, artwork IDs are like "vanished-spaces-banished-faces-page-1"
        const seriesSlug = series ? slugify(series) : '';
        const titleMatchesSeries = seriesSlug === id || (seriesSlug && id.startsWith(seriesSlug + '-page-'));
        
        // Build array of possible image paths
        const imagePaths = [];
        
        if (titleMatchesSeries) {
            // Special case: artwork title matches series or starts with series-page-
            // Structure: assets/images/{series}/page-{n}/page-{n}.jpg (nested folders)
            // The artwork ID is like "vanished-spaces-banished-faces-page-1", but folder is just "page-1"
            // Extract the page number from the artwork ID
            const pageMatch = id.match(/page-(\d+)$/);
            if (pageMatch) {
                const pageNum = pageMatch[1];
                // Try nested folder structure: page-{n}/page-{n}.jpg (this is the correct structure)
                const nestedPath = `assets/images/${seriesFolder}/page-${pageNum}/page-${pageNum}`;
                imagePaths.push(nestedPath);
            } else if (seriesSlug === id) {
                // Artwork ID exactly matches series (no page number) - try all pages
                for (let i = 1; i <= 20; i++) {
                    const nestedPath = `assets/images/${seriesFolder}/page-${i}/page-${i}`;
                    imagePaths.push(nestedPath);
                }
            }
            
            // Also try flat structure as fallback
            const flatPath = `assets/images/${seriesFolder}/${id}`;
            imagePaths.push(flatPath);
            for (let i = 1; i <= 20; i++) {
                imagePaths.push(`${flatPath}-page-${i}`); // vanished-spaces-banished-faces-page-1.jpg
                imagePaths.push(`${flatPath}-${i}`);       // vanished-spaces-banished-faces-1.jpg
            }
        } else {
            // Normal case: nested structure using slugified folder names
            // Also try underscore version of the ID (some files use underscores instead of hyphens)
            const idWithUnderscores = id.replace(/-/g, '_');
            const baseImagePathUnderscore = `assets/images/${seriesFolder}/${artworkFolder}/${idWithUnderscores}`;
            
            // Put base paths first so thumbnails work for series that use simple names (e.g. windows-and-waves: monkey-bars.jpg)
            imagePaths.push(baseImagePath);
            imagePaths.push(baseImagePathUnderscore);
            // Then add numbered variants (e.g. freshman: _0001; postermania: -0001; modern-ruins: _0001)
            for (let i = 1; i <= 20; i++) {
                imagePaths.push(`${baseImagePath}_${String(i).padStart(4, '0')}`);
                imagePaths.push(`${baseImagePathUnderscore}_${String(i).padStart(4, '0')}`);
                imagePaths.push(`${baseImagePath}-${String(i).padStart(4, '0')}`); // postermania: anastasia-0001.jpg
                imagePaths.push(`${baseImagePath}_${i}`);
                imagePaths.push(`${baseImagePathUnderscore}_${i}`);
                imagePaths.push(`${baseImagePath}-${i}`);
            }
        }
        
        // Use first image as thumbnail (no separate thumbnail needed)
        // The thumbnail will be the first valid image from the images array
        project.thumbnail = imagePaths.length > 0 ? imagePaths[0] : '';
        // Store image paths - actual existence will be checked when loading
        project.images = imagePaths;
        
        return project;
    }
    
    /**
     * Group artworks by series
     */
    function groupBySeries(artworks) {
        const seriesMap = new Map();
        
        artworks.forEach(artwork => {
            const seriesName = artwork.series || 'Other Works';
            
            if (!seriesMap.has(seriesName)) {
                const seriesArtworks = artworks.filter(a => (a.series || 'Other Works') === seriesName);
                const allTags = [...new Set(seriesArtworks.flatMap(a => a.tags || []))];
                
                const years = seriesArtworks
                    .map(a => a.years)
                    .filter(y => y)
                    .sort((a, b) => {
                        const yearA = parseInt(a.match(/\d{4}/)?.[0] || '0');
                        const yearB = parseInt(b.match(/\d{4}/)?.[0] || '0');
                        return yearA - yearB;
                    });
                
                const yearRange = years.length > 0 
                    ? years.length === 1 
                        ? years[0] 
                        : `${years[0]}–${years[years.length - 1]}`
                    : '';
                
                seriesMap.set(seriesName, {
                    id: slugify(seriesName),
                    title: seriesName,
                    years: yearRange,
                    tags: allTags,
                    featured: seriesArtworks.some(a => a.featured),
                    blurb: seriesArtworks.length > 1 
                        ? `A series of ${seriesArtworks.length} artworks${yearRange ? ` (${yearRange})` : ''}`
                        : seriesArtworks[0].blurb || '',
                    statement: seriesArtworks[0].statement || '',
                    images: seriesArtworks.flatMap(a => a.images || []).filter(img => img),
                    artworks: []
                });
            }
            
            seriesMap.get(seriesName).artworks.push(artwork);
        });
        
        return Array.from(seriesMap.values());
    }
    
    /**
     * Load data from Google Sheets
     */
    async function loadFromSheets() {
        try {
            console.log('📥 Loading data from Google Sheets...');
            
            const response = await fetch(SHEET_URL);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusMessage}`);
            }
            
            const csvText = await response.text();
            const lines = csvText.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                throw new Error('No data rows found in spreadsheet');
            }
            
            // Parse headers and build column index map (so column order doesn't matter)
            const headers = parseCSVLine(lines[0]).map(h => (h || '').trim().toLowerCase());
            const col = (name) => {
                const i = headers.findIndex(h => (h || '').indexOf(name) !== -1);
                return i >= 0 ? i : -1;
            };
            const colExact = (name) => {
                const i = headers.findIndex(h => (h || '').trim() === name);
                return i >= 0 ? i : -1;
            };
            const columnIndices = {
                title: 0,
                series: col('series') >= 0 ? col('series') : 1,
                years: col('year') >= 0 ? col('year') : 2,
                workType: col('work type') >= 0 ? col('work type') : 3,
                medium: col('medium') >= 0 ? col('medium') : 4,
                dimensions: col('dimension') >= 0 ? col('dimension') : 5,
                theme: col('theme') >= 0 ? col('theme') : 6,
                exhibited: col('exhibit') >= 0 ? col('exhibit') : 7,
                awards: col('award') >= 0 ? col('award') : 8,
                link: colExact('link') >= 0 ? colExact('link') : (col('link') >= 0 ? col('link') : col('url') >= 0 ? col('url') : 9),
                madeInCollaborationWith: col('collaboration') >= 0 ? col('collaboration') : (colExact('made in collaboration with') >= 0 ? colExact('made in collaboration with') : 10),
                collaborators: col('collaborator') >= 0 ? col('collaborator') : -1,
                selectedWork: col('selected work') >= 0 ? col('selected work') : -1
            };
            if (columnIndices.collaborators < 0) columnIndices.collaborators = columnIndices.madeInCollaborationWith;
            console.log(`   Found columns: ${headers.join(', ')}`);
            
            // Parse data rows - filter out completely empty rows
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line === '') continue;
                const row = parseCSVLine(line);
                if (row.length > 0 && row[0] && row[0].trim() && row[0].trim().toLowerCase() !== 'title') {
                    rows.push(row);
                }
            }
            
            console.log(`   Found ${rows.length} artwork entries`);
            
            // Transform rows to artworks (pass column indices so Link / Collaboration work in any column)
            const artworks = rows
                .map(row => transformRow(row, columnIndices))
                .filter(artwork => artwork !== null);
            
            console.log(`   Transformed ${artworks.length} artworks`);
            
            // Group by series
            const projects = groupBySeries(artworks);
            
            console.log(`   Grouped into ${projects.length} series/projects`);
            
            // Set global PROJECTS variable
            window.PROJECTS = projects;
            window.ARTWORKS = artworks;
            
            console.log('✅ Data loaded successfully');
            
            // Dispatch event to notify other scripts
            window.dispatchEvent(new CustomEvent('sheetsDataLoaded', {
                detail: { projects, artworks }
            }));
            
        } catch (error) {
            console.error('❌ Error loading data from Google Sheets:', error);
            console.error('   Falling back to static projects.js');
            
            // If loading fails and PROJECTS is not defined, wait for static file
            if (!window.PROJECTS) {
                console.warn('   Waiting for static projects.js to load...');
            }
        }
    }
    
    // Load data when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFromSheets);
    } else {
        loadFromSheets();
    }
})();
