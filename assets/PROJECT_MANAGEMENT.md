# Portfolio Project Management Guide

## Recommended Workflow

### Option 1: Direct Editing (Simplest) ✅ **RECOMMENDED**
Edit `assets/projects.js` directly when adding/updating projects.

**✅ Works perfectly for tagging and searchability!** The search/filter system automatically:
- Extracts all unique tags from your projects
- Creates filter chips for each tag
- Searches through titles, blurbs, statements, AND tags
- Filters projects when you click tag chips

**No difference between JS and JSON for searchability** - both work identically. The format doesn't matter, only the data structure.

### Option 2: Spreadsheet → JSON (If you prefer spreadsheets)
1. Use Google Sheets or Excel
2. Export as CSV
3. Convert to JSON using an online tool or script
4. Copy into `assets/projects.js`

### Option 3: JSON File (Cleaner separation)
Keep projects in `assets/projects.json` and load it dynamically.

---

## Project Structure

Each project should have this structure:

```javascript
{
  id: "unique-project-id",           // URL-friendly (lowercase, hyphens)
  title: "Project Title",
  years: "2024–2025",                 // Year range or single year
  tags: ["Photography", "Print"],     // Array of tags
  featured: true,                      // true = appears in carousel
  blurb: "Short description",          // One-line description
  statement: "Longer statement...",    // Full project statement
  process: [                           // Array of process steps
    "Step 1",
    "Step 2"
  ],
  context: [                           // Array of context notes
    "Exhibition info",
    "Additional details"
  ],
  // NEW: Image fields
  thumbnail: "images/technomancy/thumbnail.jpg",      // For carousel/grid
  images: [                            // Array of images for project page
    "images/technomancy/image1.jpg",
    "images/technomancy/image2.jpg"
  ]
}
```

---

## Image Organization

### Folder Structure
```
assets/
  images/
    technomancy/
      thumbnail.jpg    (300x200px recommended for carousel)
      image1.jpg
      image2.jpg
      ...
    vanished-spaces/
      thumbnail.jpg
      image1.jpg
      ...
```

### Image Guidelines
- **Thumbnails**: 300x200px (or 3:2 aspect ratio) for carousel
- **Project images**: Any size, but keep file sizes reasonable (< 500KB each)
- **Formats**: JPG for photos, PNG for graphics with transparency
- **Naming**: Use lowercase, hyphens (e.g., `technomancy-01.jpg`)

---

## Quick Add Template

Copy this template when adding a new project:

```javascript
{
  id: "project-name",
  title: "Project Title",
  years: "2024",
  tags: ["Tag1", "Tag2"],
  featured: false,
  blurb: "One sentence description",
  statement: "Full project statement here...",
  process: [
    "Process step 1",
    "Process step 2"
  ],
  context: [
    "Context note 1"
  ],
  thumbnail: "images/project-name/thumbnail.jpg",
  images: [
    "images/project-name/image1.jpg",
    "images/project-name/image2.jpg"
  ]
}
```

---

## Tips

1. **Keep IDs unique**: Use lowercase, hyphens (e.g., `my-new-project`)
2. **Featured projects**: Only mark 8-10 as `featured: true` (for carousel)
3. **Tags**: Be consistent (use same tag names across projects)
   - Tags are automatically searchable and filterable
   - Use common tags like: "Photography", "Print", "Screenprint", "Sculpture", "3D", "Drawing", "Painting", "Design", "Graphic Design", "Data", "System"
   - You can add custom tags too - they'll appear in the filter chips automatically
4. **Images**: Always add thumbnail first, then add to images array
5. **Backup**: Keep a backup of `projects.js` before major updates

## How Search & Filtering Works

The Works page has built-in search and filtering:

- **Tag Filtering**: Click any tag chip to filter projects by that tag. Click again to deselect.
- **Search Bar**: Searches through:
  - Project titles
  - Blurbs (short descriptions)
  - Statements (full descriptions)
  - **Tags** (so you can search by tag name too!)
- **Sorting**: Sort by Featured, Newest, Oldest, or A-Z
- **Clear**: Reset all filters and search

**Example**: If you tag a project with `["Photography", "Print"]`, users can:
- Click the "Photography" chip to see all photography projects
- Type "photography" in the search bar to find it
- Combine tag filters with search for precise results

