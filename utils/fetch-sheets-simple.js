/**
 * Simple Google Sheets Data Fetcher (No Auth Required)
 * 
 * This script fetches data from a published Google Sheet and transforms it
 * into the format used by your portfolio website.
 * 
 * Prerequisites:
 *   1. Publish your Google Sheet to the web:
 *      - File > Share > Publish to web
 *      - Select the tab (e.g., "Sheet1")
 *      - Format: CSV
 *      - Click "Publish"
 *   2. Update the SHEET_ID and SHEET_NAME constants below
 * 
 * Usage:
 *   node utils/fetch-sheets-simple.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration - UPDATE THESE VALUES
const SHEET_ID = '1SN9BdCSMNS8iGUhgiYpdrRz5cidoPJq1BH3oZ918f8Y';
const SHEET_NAME = 'Sheet1'; // The name of your tab
const OUTPUT_FILE = path.join(__dirname, '../assets/projects.js');

// Google Sheets CSV export URL (public, no auth needed)
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

/**
 * Fetch data from Google Sheets
 */
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    return fetchCSV(redirectUrl).then(resolve).catch(reject);
                }
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            
            let data = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                resolve(data);
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.end();
    });
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
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

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
 * Extract year range from years string
 */
function parseYears(yearsStr) {
    if (!yearsStr) return '';
    const match = yearsStr.toString().match(/(\d{4})/);
    return match ? match[0] : yearsStr.toString().trim();
}

/**
 * Transform a single row from the spreadsheet into a project object
 */
function transformRow(row) {
    const [title, series, years, workType, medium, dimensions, theme, exhibited, awards] = row;
    
    // Skip empty rows
    if (!title || title.trim() === '' || title.trim().toLowerCase() === 'title') {
        return null;
    }
    
    // Generate ID from title
    const id = slugify(title);
    
    // Determine tags from Work Type
    const tags = workType ? [workType.trim()] : [];
    
    // Parse years
    const yearsStr = years ? parseYears(years.toString()) : '';
    
    // Build the project object
    const project = {
        id: id,
        title: title.trim(),
        years: yearsStr,
        tags: tags,
        featured: false, // You can add a column for this or manually edit
        blurb: medium ? `${workType || 'Artwork'} created using ${medium}` : '',
    };
    
    // Add series if available
    if (series && series.trim()) {
        project.series = series.trim();
    }
    
    // Add theme as statement if available
    if (theme && theme.trim()) {
        project.statement = theme.trim();
    }
    
    // Add dimensions if available
    if (dimensions && dimensions.trim()) {
        project.dimensions = dimensions.trim();
    }
    
    // Add exhibited info if available
    if (exhibited && exhibited.trim()) {
        project.exhibited = exhibited.trim();
    }
    
    // Add awards if available
    if (awards && awards.trim()) {
        project.awards = awards.trim();
    }
    
    // Image path convention: images/[series]/[id].jpg
    const imageBasePath = series ? slugify(series) : 'artworks';
    project.thumbnail = `images/${imageBasePath}/${id}-thumb.jpg`;
    project.images = [`images/${imageBasePath}/${id}.jpg`];
    
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
            // Get all unique tags from artworks in this series
            const seriesArtworks = artworks.filter(a => (a.series || 'Other Works') === seriesName);
            const allTags = [...new Set(seriesArtworks.flatMap(a => a.tags || []))];
            
            // Get year range
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
 * Main function
 */
async function main() {
    try {
        console.log('📥 Fetching data from Google Sheets...');
        console.log(`   URL: ${SHEET_URL}`);
        
        // Fetch CSV data
        const csvText = await fetchCSV(SHEET_URL);
        
        // Parse CSV
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('No data rows found in spreadsheet');
        }
        
        // Parse headers (first line)
        const headers = parseCSVLine(lines[0]);
        console.log(`   Found columns: ${headers.join(', ')}`);
        
        // Parse data rows
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length > 0 && row[0] && row[0].trim()) {
                rows.push(row);
            }
        }
        
        console.log(`   Found ${rows.length} artwork entries`);
        
        // Transform rows to artworks
        const artworks = rows
            .map(row => transformRow(row))
            .filter(artwork => artwork !== null);
        
        console.log(`   Transformed ${artworks.length} artworks`);
        
        // Group by series
        const projects = groupBySeries(artworks);
        
        console.log(`   Grouped into ${projects.length} series/projects`);
        
        // Generate JavaScript code
        const timestamp = new Date().toISOString();
        const jsContent = `// Project data for the portfolio
// Auto-generated from Google Sheets on ${timestamp}
// To update: Run 'node utils/fetch-sheets-simple.js'
//
// Source: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit

window.PROJECTS = ${JSON.stringify(projects, null, 2)};

// Individual artworks are also available as:
window.ARTWORKS = ${JSON.stringify(artworks, null, 2)};
`;
        
        // Write to file
        fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf8');
        
        console.log(`✅ Successfully generated ${OUTPUT_FILE}`);
        console.log(`   Created ${projects.length} series/projects`);
        console.log(`   Created ${artworks.length} individual artworks`);
        console.log(`\n💡 Tip: You can mark featured works by editing the 'featured' property in the generated file.`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, transformRow, groupBySeries };
