# Google Sheets to Portfolio Sync

This utility syncs your Google Sheets artwork data with your portfolio website.

## Quick Start

1. **Publish your Google Sheet to the web:**
   - Open your spreadsheet: https://docs.google.com/spreadsheets/d/1SN9BdCSMNS8iGUhgiYpdrRz5cidoPJq1BH3oZ918f8Y/edit
   - Go to **File > Share > Publish to web**
   - Select the tab (e.g., "Sheet1")
   - Choose format: **CSV**
   - Click **Publish**

2. **Update the configuration:**
   - Open `fetch-sheets-simple.js`
   - Verify the `SHEET_ID` (already set to your sheet)
   - Update `SHEET_NAME` if your tab has a different name

3. **Run the script:**
   ```bash
   cd utils
   node fetch-sheets-simple.js
   ```

   Or use npm:
   ```bash
   npm run fetch
   ```

4. **The script will:**
   - Fetch data from your Google Sheet
   - Transform it into the portfolio format
   - Generate `assets/projects.js` with your artwork data

## How It Works

The script:
1. Fetches CSV data from your published Google Sheet (no authentication required)
2. Parses each row as an artwork entry
3. Groups artworks by series
4. Transforms the data into the `window.PROJECTS` format used by your website
5. Generates `assets/projects.js`

## Spreadsheet Format

Your spreadsheet should have columns:
- **Title** - Artwork title
- **Series** - Series name (optional)
- **Years** - Year or year range (e.g., "2021" or "2021-2023")
- **Work Type** - Used as tags (e.g., "Drawing", "Painting", "Photography")
- **Medium** - Description of medium used
- **Dimensions** - Size information (optional)
- **Theme** - Used as statement/description (optional)
- **Exhibited** - Exhibition information (optional)
- **Awards** - Awards information (optional)

## Customization

### Marking Featured Works

After running the script, edit `assets/projects.js` and set `featured: true` for works you want to highlight.

### Image Paths

The script generates default image paths:
- `images/[series]/[artwork-id].jpg`
- `images/[series]/[artwork-id]-thumb.jpg`

Update the `transformRow` function in `fetch-sheets-simple.js` to match your image naming convention.

### Grouping Behavior

By default, artworks are grouped by series. To change this, modify the `groupBySeries` function.

## Alternative: Google Sheets API

For more advanced features (authentication, real-time sync, etc.), see the Google Sheets API documentation:
https://developers.google.com/sheets/api

## Troubleshooting

**Error: "HTTP 404" or "No data rows found"**
- Make sure your sheet is published to the web (File > Share > Publish to web)
- Check that `SHEET_NAME` matches your tab name exactly

**Error: "Failed to fetch"**
- Check your internet connection
- Verify the `SHEET_ID` is correct
- Make sure the sheet is publicly accessible

**Data not appearing correctly**
- Check that your spreadsheet has a header row
- Verify column order matches the expected format
- Ensure artwork titles are in the first column
