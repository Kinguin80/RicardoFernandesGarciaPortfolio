/**
 * Create image folders for each series from Google Sheets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// From your CSV data
const SERIES = [
    'Explorador',
    'Chronophobia',
    'Cognitive Dissonance',
    'Freshman',
    'Graphic Design',
    'Modern Ruins',
    'modern ruins',  // lowercase version
    'Anthropocene',
    '*/Encoded/*',
    'Technomancy',
    'Memoria',
    'Vanished Spaces/Banished Faces',
    'Postermania',
    'muralwork',
    'penguin',
    'encoded'
];

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .replace(/\//g, '-')  // Replace slashes
        .replace(/\*/g, '')   // Remove asterisks
        .replace(/-encoded-/g, 'encoded');  // Fix encoded series
}

const imagesDir = path.join(__dirname, '../assets/images');

// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('✅ Created assets/images/ directory');
}

// Create folders for each series
const createdFolders = new Set();
let createdCount = 0;

SERIES.forEach(series => {
    if (!series || series.trim() === '') {
        return;
    }
    
    const folderName = slugify(series);
    
    // Skip if already created (handles duplicates like "Modern Ruins" vs "modern ruins")
    if (createdFolders.has(folderName)) {
        return;
    }
    
    const folderPath = path.join(imagesDir, folderName);
    
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        createdFolders.add(folderName);
        createdCount++;
        console.log(`✅ Created folder: assets/images/${folderName}/`);
    } else {
        console.log(`ℹ️  Folder already exists: assets/images/${folderName}/`);
    }
});

console.log(`\n✅ Created ${createdCount} new folder(s)`);
console.log(`📁 Total unique series folders: ${createdFolders.size}`);

// List all created folders
console.log('\n📂 Series folders:');
Array.from(createdFolders).sort().forEach(folder => {
    console.log(`   - assets/images/${folder}/`);
});

console.log('\n💡 Next steps:');
console.log('   1. Add your images to these folders');
console.log('   2. Name files: artwork-title.jpg and artwork-title-thumb.jpg');
console.log('   3. Use lowercase and hyphens in filenames');
console.log('   4. Example: assets/images/explorador/bleached-dreams.jpg');
