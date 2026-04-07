# Google Docs Resume Template — Formatting Spec

> Formatting reference for the .docx resume renderer

---

## Page Setup

| Property | Value |
|---|---|
| **Paper size** | Letter (21.6 cm x 27.9 cm) |
| **Orientation** | Portrait |
| **Page colour** | White |
| **Top margin** | 0.51 cm |
| **Bottom margin** | 0.51 cm |
| **Left margin** | 1.02 cm |
| **Right margin** | 1.02 cm |

---

## Global Settings

| Property | Value |
|---|---|
| **Font family** | Work Sans (entire document) |
| **Line spacing** | 1.15 |
| **Paragraph spacing (before)** | 0 pts |
| **Paragraph spacing (after)** | 0 pts |
| **Text colour (default)** | Black (#000000) |
| **Accent colour (green)** | #34a853 |

---

## Element Formatting

### Name (Header)
- **Font:** Work Sans
- **Size:** 25pt
- **Weight:** Bold
- **Style:** Small caps (all caps with larger first letters visually)
- **Colour:** Black
- **Alignment:** Center

### Contact Info (below name)
- **Layout:** Two-column — left side (Email, Phone) and right side (LinkedIn, Address)
- **Labels** ("Email me:", "Call me:", "LinkedIn:", "Address:"):
  - Font: Work Sans, 10pt, Bold
  - Colour: Green (#34a853)
- **Values** (email address, phone number, etc.):
  - Font: Work Sans, 10pt, Bold
  - Colour: Black
- **LinkedIn URL:** Standard link styling (blue/underlined)
- **Separator:** Horizontal line below contact info block

### Section Headers ("PROFESSIONAL EXPERIENCE", "EDUCATION", "SKILLS & INTERESTS")
- **Font:** Work Sans
- **Size:** 11pt
- **Weight:** Bold
- **Colour:** Green (#34a853)
- **Case:** ALL CAPS
- **Alignment:** Left

### Job Title Line
- **Format:** `Company – Role Title; Location` ← left-aligned | `Date Range` ← right-aligned (tab stop)
- **Company & Role** (before semicolon):
  - Font: Work Sans, 10pt, Bold
  - Colour: Black
- **Location** (after semicolon):
  - Font: Work Sans, 10pt, Regular (not bold)
  - Colour: Black
- **Date Range** (right-aligned):
  - Font: Work Sans, 10pt, Italic
  - Colour: Black

### Bullet Points (job descriptions)
- **Font:** Work Sans
- **Size:** 9pt
- **Weight:** Regular
- **Colour:** Black
- **Bullet style:** Filled circle (●)
- **Indent:** Standard list indent (~1 cm from left margin)

### Education Section
- **Institution/Degree line:**
  - Font: Work Sans, 10pt, Bold, Black
  - Format: `Institution | Degree` | Location | Date
- **Sub-bullets** (exchange program, research, etc.):
  - Font: Work Sans, 9pt, Regular/Italic, Black

### Skills & Interests Section
- **Category labels** ("Interests:", "Languages:", "Technical:"):
  - Font: Work Sans, 9pt, Bold, Black
- **Content** (after label):
  - Font: Work Sans, 9pt, Regular, Black
- **Layout:** Inline, comma-separated values

---

## Layout Structure

```
┌──────────────────────────────────────────┐
│              JANE DOE                    │  ← 25pt, Bold, Small Caps, Center
│                                          │
│  Email me: ...        LinkedIn: ...      │  ← 10pt, Green labels + Black values
│  Call me: ...         Address: ...       │
│  ─────────────────────────────────────── │  ← Horizontal rule
│                                          │
│  PROFESSIONAL EXPERIENCE                 │  ← 11pt, Bold, Green, ALL CAPS
│                                          │
│  Company – Role; Location    Date Range  │  ← 10pt, Bold/Regular/Italic
│    ● Bullet point text here              │  ← 9pt, Regular
│    ● Another bullet point                │
│                                          │
│  Company – Role; Location    Date Range  │
│    ● Bullet point text here              │
│                                          │
│  ─────────────────────────────────────── │  ← (implied section break)
│                                          │
│  EDUCATION                               │  ← 11pt, Bold, Green, ALL CAPS
│  Institution | Degree | Location | Date  │  ← 10pt, Bold
│    ● Sub-detail                          │  ← 9pt, Regular/Italic
│                                          │
│  ─────────────────────────────────────── │
│                                          │
│  SKILLS & INTERESTS                      │  ← 11pt, Bold, Green, ALL CAPS
│  Label: comma-separated values           │  ← 9pt, Bold label + Regular values
│                                          │
└──────────────────────────────────────────┘
```

---

## Notes

- Document is 2 pages (current legacy content)
- Target: 1–2 pages depending on role and experience depth
- The job title line uses a right-aligned tab stop to push dates to the right margin
- Horizontal rules separate the header from content, and between major sections
- No summary/objective section in the current template (can be added)
- Bullet lists have no extra paragraph spacing — tight vertical layout
