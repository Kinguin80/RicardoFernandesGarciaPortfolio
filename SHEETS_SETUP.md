# Google Sheets Integration Guide

This guide explains how to connect your Google Sheets spreadsheet to your portfolio website.

## Overview

You have **two options** for syncing your Google Sheets data:

1. **Browser-based (Dynamic)** - Loads data directly from Google Sheets when the page loads
2. **Build script (Static)** - Generates a static `projects.js` file from your spreadsheet

## Option 1: Browser-based Dynamic Loading (Recommended for Development)

This method loads data directly from Google Sheets without needing to run any scripts.

### Setup Steps

1. **Publish your Google Sheet:**
   - Open: https://docs.google.com/spreadsheets/d/1SN9BdCSMNS8iGUhgiYpdrRz5cidoPJq1BH3oZ918f8Y/edit
   - Go to **File > Share > Publish to web**
   - Select the tab (e.g., "Sheet1")
   - Choose format: **CSV**
   - Click **Publish**

2. **Update your HTML:**
   
   Edit `index.html` and replace:
   ```html
   <script src="assets/projects.js"></script>
   ```
   
   With:
   ```html
   <!-- Option A: Load from Google Sheets dynamically -->
   <script src="assets/sheets-loader.js"></script>
   <!-- OR Option B: Keep static file (faster for production) -->
   <!-- <script src="assets/projects.js"></script> -->
   ```

3. **Configure the loader:**
   
   If needed, edit `assets/sheets-loader.js`:
   - Update `SHEET_ID` if different
   - Update `SHEET_NAME` to match your tab name

4. **Done!** Your website will now load data directly from Google Sheets.

### Pros & Cons

✅ **Pros:**
- No build step required
- Changes in Google Sheets appear immediately
- Good for development and testing

❌ **Cons:**
- Requires internet connection
- Slightly slower initial page load
- Google Sheets must be publicly accessible

---

## Option 2: Build Script (Recommended for Production)

This method generates a static `projects.js` file from your spreadsheet.

### Setup Steps

1. **Publish your Google Sheet:**
   - Same as Option 1, Step 1

2. **Run the build script:**
   
   ```bash
   cd utils
   node fetch-sheets-simple.js
   ```
   
   Or use npm:
   ```bash
   npm run fetch
   ```

3. **The script will generate `assets/projects.js`** with your data

4. **Keep your HTML as-is:**
   ```html
   <script src="assets/projects.js"></script>
   ```

### Pros & Cons

✅ **Pros:**
- Fast page loads (static file)
- Works offline
- Better for production sites
- Can be automated with CI/CD

❌ **Cons:**
- Requires Node.js
- Must run script to update data
- Need to rebuild after spreadsheet changes

---

## Recommended Workflow

**Development:**
- Use Option 1 (browser-based) for easy testing
- Edit spreadsheet → refresh page → see changes

**Production:**
- Use Option 2 (build script) for performance
- Run script before deploying
- Automate with GitHub Actions or similar

---

## Spreadsheet Format

Your spreadsheet should have these columns (in order):

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| Title | ✅ Yes | Artwork title | "Bleached Dreams" |
| Series | ❌ No | Series name | "Explorador" |
| Years | ❌ No | Year or range | "2021" or "2021-2023" |
| Work Type | ❌ No | Used as tags | "Drawing", "Painting" |
| Medium | ❌ No | Description | "Colored pencil, watercolor" |
| Dimensions | ❌ No | Size info | "9 x 12 in." |
| Theme | ❌ No | Used as statement | "Exploration of..." |
| Exhibited | ❌ No | Exhibition info | "Gallery Name, 2021" |
| Awards | ❌ No | Awards info | "First Prize, 2021" |

---

## Customization

### Marking Featured Works

After data is loaded, edit `assets/projects.js` (or modify the script) and set:
```javascript
featured: true
```

### Image Paths

The scripts generate default paths:
- `images/[series]/[artwork-id].jpg`
- `images/[series]/[artwork-id]-thumb.jpg`

Update the `transformRow` function in the script to match your naming convention.

### Changing Grouping

By default, artworks are grouped by series. To change this, modify the `groupBySeries` function.

---

## Troubleshooting

### "Failed to fetch" or "HTTP 404"
- ✅ Make sure your sheet is published (File > Share > Publish to web)
- ✅ Check that `SHEET_NAME` matches your tab name exactly
- ✅ Verify the sheet is publicly accessible

### "No data rows found"
- ✅ Check that your spreadsheet has a header row
- ✅ Ensure there's at least one row of data
- ✅ Verify column order matches expected format

### Data not appearing correctly
- ✅ Check browser console for errors
- ✅ Verify artwork titles are in the first column
- ✅ Make sure titles are not empty

### Node.js script errors
- ✅ Make sure Node.js is installed (`node --version`)
- ✅ Verify you're in the `utils` directory when running
- ✅ Check that the sheet ID is correct

---

## Advanced: Google Sheets API

For more advanced features (private sheets, authentication, etc.), you can use the Google Sheets API. See:
- https://developers.google.com/sheets/api
- Update `sheets-loader.js` to use the API instead of CSV export

---

## Alternative: ArchieML

You mentioned [ArchieML](https://archieml.org/). While ArchieML is great for structured text documents, for Google Sheets data, the approaches above are more suitable because:

1. **Direct integration** - No manual export/import needed
2. **Automation** - Can be automated easily
3. **Type safety** - Spreadsheet columns provide structure
4. **Easier updates** - Just edit the spreadsheet

However, if you prefer ArchieML's format, you can:
1. Export your spreadsheet to a text file
2. Format it as ArchieML
3. Use a library like `archieml` to parse it

---

## Need Help?

Check the browser console (F12) for error messages. Most issues are related to:
- Sheet not being published
- Incorrect tab name
- Missing or empty data rows
