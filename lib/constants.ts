// Page dimensions (twips: 1 inch = 1440 twips, 1 cm ~ 567 twips)
export const LETTER_WIDTH = 12240; // 8.5 inches
export const LETTER_HEIGHT = 15840; // 11 inches

// Margins: 0.51cm top/bottom, 1.02cm left/right
export const MARGIN_TOP_BOTTOM = Math.round(0.51 * 567); // ~289 twips
export const MARGIN_LEFT_RIGHT = Math.round(1.02 * 567); // ~578 twips

// Font sizes (half-points: 1pt = 2 half-points)
export const NAME_SIZE = 50; // 25pt
export const SECTION_HEADER_SIZE = 22; // 11pt
export const JOB_TITLE_SIZE = 20; // 10pt
export const CONTACT_SIZE = 20; // 10pt
export const BULLET_SIZE = 18; // 9pt
export const SKILLS_SIZE = 18; // 9pt

// Colors (hex without #)
export const GREEN = "34a853";
export const BLACK = "000000";

// Font family
export const FONT = "Work Sans";

// Line spacing: 1.15 in 240ths of a line
export const LINE_SPACING = 276;

// Right tab stop position (page width minus both margins)
export const RIGHT_TAB_POSITION = LETTER_WIDTH - 2 * MARGIN_LEFT_RIGHT;
