# Image Performance Testing Guide

## Quick Test in Browser

1. **Open your portfolio in the browser**
2. **Open Developer Console** (F12 or Cmd+Option+I)
3. **Paste this code** in the console:

```javascript
// Test a specific image
testImagePerformance("assets/images/vanished-spaces-banished-faces/vanished-spaces-banished-faces-page-1", 5)
```

This will test both JPEG and WebP versions 5 times each and show you which is faster.

## Understanding the Results

- **Load time** = Time from request to fully loaded (in milliseconds)
- **Lower is better**
- The test accounts for network variability by running multiple iterations

## Does the Fallback System Slow Things Down?

**Short answer: Minimally, if at all.**

The fallback system:
1. Tries JPEG first (immediate)
2. Only tries WebP if JPEG fails (rare)
3. Adds ~1-2ms overhead for the error handler

**The real question:** Is the file size difference worth it?

## File Size Comparison

Check your actual file sizes:
- WebP files: Usually 25-35% smaller
- JPEG files: Usually larger but may load faster due to browser optimization

## Recommendation

**Option 1: Use only JPEG** (simplest, fastest)
- Remove fallback system
- Just use `.jpg` files
- Fastest loading, no overhead

**Option 2: Use only WebP** (smallest files)
- Remove fallback system  
- Just use `.webp` files
- Smaller files = faster downloads

**Option 3: Keep fallback** (most flexible)
- Current system
- Works with either format
- Small overhead (~1-2ms)

## How to Switch to Single Format

If you want to simplify and remove the fallback:

1. **Update `sheets-loader.js`** to generate paths with extension:
   ```javascript
   project.thumbnail = `assets/images/${imageBasePath}/${id}.jpg`;
   ```

2. **Remove the image loader** or simplify it to just load directly

3. **Result:** Faster, simpler, but less flexible

## Testing Multiple Images

```javascript
// Test multiple images
const images = [
    "assets/images/vanished-spaces-banished-faces/vanished-spaces-banished-faces-page-1",
    "assets/images/explorador/bleached-dreams"
];

images.forEach(img => {
    testImagePerformance(img, 3);
});
```
