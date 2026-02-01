# Adding Images to Your Portfolio

This guide explains how to add images to your portfolio website.

## Option 1: Local Image Files (Recommended)

### Folder Structure

Organize your images by series, with each artwork in its own folder:

```
assets/
  images/
    explorador/
      bleached-dreams/
        bleached-dreams.jpg
        bleached-dreams-1.jpg
        bleached-dreams-2.jpg
      reflections-of-a-prosperous-past/
        reflections-of-a-prosperous-past.jpg
        reflections-of-a-prosperous-past-1.jpg
      ...
    cognitive-dissonance/
      replaying-and-rewinding-mistakes/
        replaying-and-rewinding-mistakes.jpg
        replaying-and-rewinding-mistakes-1.jpg
        replaying-and-rewinding-mistakes-2.jpg
      the-webs-our-minds-weave/
        the-webs-our-minds-weave.jpg
        the-webs-our-minds-weave-1.jpg
        the-webs-our-minds-weave-2.jpg
      ...
    chronophobia/
      where-do-i-put-my-time/
        where-do-i-put-my-time.jpg
        where-do-i-put-my-time-1.jpg
      ...
```

### Naming Convention

The script automatically generates paths based on:
- **Series name** → series folder name (lowercase, hyphenated)
- **Artwork title** → artwork folder name (lowercase, hyphenated)
- **Image files** → artwork-id.jpg, artwork-id-1.jpg, artwork-id-2.jpg, etc.

Example:
- Title: "Replaying and Rewinding Mistakes"
- Series: "Cognitive Dissonance"
- → Path: `assets/images/cognitive-dissonance/replaying-and-rewinding-mistakes/replaying-and-rewinding-mistakes.jpg`
- → Additional images: `assets/images/cognitive-dissonance/replaying-and-rewinding-mistakes/replaying-and-rewinding-mistakes-1.jpg`, etc.

**Note:** For artworks where the title matches the series title (like "Vanished Spaces / Banished Faces"), the system also supports a flat structure for backwards compatibility.

### Image Requirements

**Main Images:**
- Format: JPG, PNG, or WebP
- Recommended: 1200px–2000px width
- Use descriptive names: `artwork-title.jpg`

**Thumbnails:**
- Format: JPG, PNG, or WebP
- Recommended: 400px–600px width (for carousel/grid)
- Naming: `artwork-title-thumb.jpg` or `artwork-title-thumbnail.jpg`

### Steps to Add Images

1. **Create series folders** in `assets/images/`:
   ```
   assets/images/explorador/
   assets/images/chronophobia/
   assets/images/technomancy/
   assets/images/cognitive-dissonance/
   etc.
   ```

2. **Create artwork folders** within each series folder:
   ```
   assets/images/cognitive-dissonance/replaying-and-rewinding-mistakes/
   assets/images/cognitive-dissonance/the-webs-our-minds-weave/
   etc.
   ```

3. **Add your images** with matching names:
   - Main image: `artwork-title.jpg`
   - Additional images: `artwork-title-1.jpg`, `artwork-title-2.jpg`, etc.
   - All images go in the artwork's folder

3. **Enable image paths** in `assets/sheets-loader.js` (see below)

---

## Option 2: Image URLs in Spreadsheet

You can also add image URLs directly in your Google Sheet by adding a new column.

### Steps

1. **Add a new column** to your spreadsheet (e.g., "Image URL" or "Thumbnail URL")

2. **Update `sheets-loader.js`** to read from that column (we can customize this)

3. **Use any image host**: Google Drive (public), Imgur, Cloudinary, etc.

---

## Enabling Images in sheets-loader.js

Once you have images ready, uncomment and customize these lines in `assets/sheets-loader.js`:

```javascript
// Around line 118-123:
const imageBasePath = series ? slugify(series) : 'artworks';
project.thumbnail = `images/${imageBasePath}/${id}-thumb.jpg`;
project.images = [`images/${imageBasePath}/${id}.jpg`];
```

### Custom Image Path Formats

**Option A: With thumbnails (recommended)**
```javascript
const imageBasePath = series ? slugify(series) : 'artworks';
project.thumbnail = `images/${imageBasePath}/${id}-thumb.jpg`;
project.images = [`images/${imageBasePath}/${id}.jpg`];
```

**Option B: Same image for thumbnail**
```javascript
const imageBasePath = series ? slugify(series) : 'artworks';
const imagePath = `images/${imageBasePath}/${id}.jpg`;
project.thumbnail = imagePath;
project.images = [imagePath];
```

**Option C: Multiple images per artwork (current structure)**
```javascript
// Current structure: assets/images/{series}/{artwork-folder}/{artwork-id}.jpg
const seriesFolder = series ? slugify(series) : 'artworks';
const artworkFolder = id;
const baseImagePath = `assets/images/${seriesFolder}/${artworkFolder}/${id}`;
project.thumbnail = baseImagePath;
project.images = [
    baseImagePath,           // Main image: {artwork-id}.jpg
    `${baseImagePath}-1`,    // Additional: {artwork-id}-1.jpg
    `${baseImagePath}-2`,    // Additional: {artwork-id}-2.jpg
    // etc.
];
```

---

## Quick Setup Script

If you have many images, you can create a helper script to organize them. Let me know if you'd like help creating one!

---

## Tips

1. **Optimize images** before uploading:
   - Use tools like ImageOptim, TinyPNG, or Squoosh
   - Aim for 80-90% quality for web
   - Keep file sizes under 500KB per image

2. **Naming tips**:
   - Use lowercase and hyphens: `my-artwork.jpg` not `My Artwork.jpg`
   - Avoid spaces and special characters
   - Be consistent: always use `-thumb.jpg` or `-thumbnail.jpg`

3. **Missing images**:
   - The site will show text placeholders if images are missing
   - No errors will appear (404s are handled gracefully)

4. **Testing**:
   - After adding images, refresh your page
   - Check browser console for any 404 errors
   - Verify images appear in carousel and works page
