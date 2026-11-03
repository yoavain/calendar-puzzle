---
name: Calendar Puzzle
description: A daily puzzle played like a real object on a quiet table.
colors:
  ink-blue: "#0550ae"
  ink-blue-deep: "#033d8b"
  ink-blue-night: "#58a6ff"
  date-marker-yellow: "#ffeb3b"
  piece-coral: "#E07A5F"
  piece-teal: "#3D9970"
  piece-chocolate: "#6B4423"
  piece-violet: "#8B5CF6"
  piece-rose: "#DB5B80"
  piece-marigold: "#E8AA14"
  piece-olive: "#8DA547"
  piece-royal-blue: "#4169E1"
  solved-green: "#1a7f37"
  solved-green-night: "#238636"
  invalid-red: "#dc3545"
  invalid-red-night: "#ff5252"
  toolbar-slate: "#5b6570"
  toolbar-slate-night: "#adb5bd"
  toolbar-orange: "#b84a00"
  toolbar-orange-night: "#ffa726"
  date-played-violet: "#7c3aed"
  medal-gold: "#FFD700"
  medal-silver: "#C0C0C0"
  medal-bronze: "#CD7F32"
  table-white: "#ffffff"
  tray-mist: "#f5f5f5"
  board-felt: "#eeeeee"
  board-edge: "#999999"
  pencil-ink: "#333333"
  table-night: "#1a1a1a"
  tray-night: "#2d2d2d"
  board-felt-night: "#333333"
  board-edge-night: "#666666"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.35
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  board: "22px"
  pill: "999px"
spacing:
  unit: "8px"
  cell: "50px"
components:
  toolbar-button-info:
    backgroundColor: "{colors.toolbar-slate}"
    textColor: "{colors.table-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "32px"
  toolbar-button-action:
    backgroundColor: "{colors.ink-blue}"
    textColor: "{colors.table-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "32px"
  toolbar-button-reset:
    backgroundColor: "{colors.toolbar-orange}"
    textColor: "{colors.table-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "32px"
  board:
    backgroundColor: "{colors.board-felt}"
    rounded: "{rounded.board}"
    padding: "50px"
  board-night:
    backgroundColor: "{colors.board-felt-night}"
    rounded: "{rounded.board}"
    padding: "50px"
  board-cell:
    backgroundColor: "{colors.table-white}"
    textColor: "{colors.pencil-ink}"
    size: "50px"
  board-cell-today:
    backgroundColor: "{colors.date-marker-yellow}"
    size: "50px"
  piece-tray:
    backgroundColor: "{colors.tray-mist}"
    rounded: "{rounded.md}"
    padding: "16px"
  piece-card:
    backgroundColor: "{colors.table-white}"
    rounded: "{rounded.md}"
    padding: "8px"
    width: "250px"
    height: "300px"
---

# Design System: Calendar Puzzle

## Overview

**Creative North Star: "The Daily Tabletop"**

Calendar Puzzle is a real puzzle on a quiet table, played once a day. The board and the eight pieces are the objects in the room, and everything else steps back so they can be handled. The mood is calm, tactile, and satisfying: an unhurried ritual where the reward is the feel of a piece landing and the board filling up.

The system is built from two layers. The object layer holds the board and pieces, which have weight, bevels, shadows, and most of the colour. The interface layer holds toolbars, trays, and dialogs, which stay flat and precise. Trays and dialogs stay neutral, while toolbar buttons use colour to show their job. Density stays moderate, because the puzzle should fill the view.

The system rejects the generic admin dashboard: a default component-library look of grey toolbars and bordered cards, with no sense of a game.

**Key Characteristics:**
- The pieces carry most of the colour, on a neutral table.
- Toolbar buttons use colour only to show what each button does.
- Today's date is the one loud mark on the board.
- Physical objects have depth, and controls do not.
- Light and dark themes use the same structure and the same piece colours.

## Colors

The palette is a neutral table with eight saturated pieces, one yellow date marker, and three toolbar colours that each mean one job.

### Primary
- **Ink Blue** (`ink-blue`, night variant `ink-blue-night`): Focus rings, keyboard cursor, drag-over feedback, and primary actions, including the toolbar buttons that act on the puzzle. It is an interface signal and never decorates the board.

### Secondary
- **Date Marker Yellow** (`date-marker-yellow`): Today's month and day cells only, in both themes, with near-black ink.

### Tertiary
- **The Piece Set** (Coral, Teal, Chocolate, Violet, Rose, Marigold, Olive, Royal Blue): One fixed colour per piece, identical in both themes. The year mosaic bands through the same colours, lightened slightly.
- **Status** (`solved-green`, `invalid-red`, and their night variants): Success and failed-drop feedback.
- **Medals** (`medal-gold`, `medal-silver`, `medal-bronze`): Rank and hint tokens. These stay the same in both themes.
- **Toolbar Slate** (`toolbar-slate`, night variant `toolbar-slate-night`): Toolbar buttons about the game: Help, Report Bug, Statistics, and Share.
- **Toolbar Orange** (`toolbar-orange`, night variant `toolbar-orange-night`): The Reset button only.
- **Date Played Violet** (`date-played-violet`): The date button when the current date has been started but not solved.

### Neutral
- **Table White / Table Night** (`table-white`, `table-night`): Page background and empty board cells.
- **Tray Mist / Tray Night** (`tray-mist`, `tray-night`): Piece tray and toolbars.
- **Board Felt** (`board-felt`, `board-felt-night`): The board surface around the cells.
- **Board Edge** (`board-edge`, `board-edge-night`): The board rim and cell lines.
- **Pencil Ink** (`pencil-ink`): Primary text in light mode. Dark mode uses white.

### Named Rules
**The Pieces Own the Colour Rule.** Saturated colour belongs to the pieces and the date marker. The one exception is toolbar buttons, which use colour to show their job. Every other interface surface stays neutral.

**The Colour Means a Job Rule.** On the toolbar, slate means information about the game, blue means an action on the puzzle, and orange means Reset. A button with no fill is disabled. The date button is the one exception, because its colour shows the date's status: blue when not started, violet when started, green when solved. The admin-only Solution button stays green.

**The One Marker Rule.** Date Marker Yellow always means today, and nothing else uses it.

## Typography

**Display Font:** the Calendar Puzzle pixel wordmark, an image asset rather than a typeface.
**Body Font:** the native system stack, from `-apple-system` to `sans-serif`.

**Character:** The block-built wordmark supplies the personality, and the system stack stays invisible so that it feels native on every device.

### Hierarchy
- **Headline** (600, 1.5rem, 1.35): Dialog titles and major headings.
- **Title** (600, 1.25rem, 1.5): Section headings inside dialogs and panels.
- **Body** (400, 1rem, 1.5): Help text and dialog content.
- **Label** (500, 0.875rem, 1.5): Buttons and toolbar actions, in sentence case and never uppercase.
- **Caption** (400, 0.75rem, 1.5): Small supporting text.
- **Board labels** (bold, inherits the scaled cell size): Months and days inside board cells.

Font sizes step through `theme.game.fontSize` on a 4px scale around a 16px root. Numbers that update, such as the token balance, use tabular figures.

## Layout

The app has three purpose-built layouts: desktop, mobile portrait, and mobile landscape.

- **Desktop:** A centred column with toolbar, wordmark, progress bar, board, then a 4 x 2 piece tray with a maximum width of 1080px. The whole game is designed at a 1200 x 1350 baseline and scaled by transform to fit the viewport.
- **Mobile portrait:** Toolbar and progress bar on top, the board in the middle, and a one-piece carousel with its controls below.
- **Mobile landscape:** The same parts rearranged around a short viewport.

The board is built on a 50px cell with no gap, and its padding is one cell. Other spacing uses the MUI 8px unit through `theme.spacing()`.

## Elevation & Depth

Depth is reserved for things you could pick up. The board and pieces lift off the table, while toolbars, trays, and buttons stay flat and separate by tone.

### Shadow Vocabulary
- **Board rest** (`0 4px 16px rgba(0,0,0,0.10), 0 1.5px 4px rgba(0,0,0,0.08)`): The board on the table.
- **Piece rest** (`drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 1px 2px rgba(0,0,0,0.1))`): An unplaced piece.
- **Piece lifted** (`drop-shadow(0 4px 8px rgba(0,0,0,0.2)) drop-shadow(0 2px 4px rgba(0,0,0,0.12))`): A piece responding to the pointer.
- **Poster slab** (stacked 1px offsets from #2a2a2a to #111, plus a deep ambient shadow): The extruded 3D board on the `/poster` route.

### Named Rules
**The Hold It Rule.** Only an object you could hold gets a shadow or bevel. Contained buttons have elevation disabled, and shadows on controls are limited to focus rings.

## Shapes

Corners encode what an element is. The board has a deliberately large radius (22px) so it reads as a physical object, and the poster slab shares it. Trays and piece cards use gently curved corners (8px). Buttons, icon buttons, and piece cells use a tight radius (4px). The token and switch shapes use full pills. Piece silhouettes are square-celled polyomino blocks, and their cells have a subtle 135-degree bevel from light to dark.

## Components

### Buttons
- **Character:** Precise and easy to read at a glance. A solid fill says a button can be pressed, and its colour says what it does.
- **Shape:** Tight corners (4px), 32px high in the desktop toolbar, with sentence-case labels.
- **Toolbar groups:** Information, then date, hint and Solution, then moves, with wider gaps between the groups. Undo and Redo join into one pair. A narrow window wraps whole groups to a second row.
- **Disabled:** No fill and no border, with faint text only, so a disabled button can never be mistaken for an enabled one.
- **States:** Keyboard focus shows a 2px Ink Blue outline with a 2px offset. Focus ripples are off because they pulse for as long as a button holds focus, while press ripples remain.

### Cards / Containers
- **Piece tray:** A tonal panel (8px radius, 16px padding) holding the piece cards, with no shadow.
- **Piece card:** A 250 x 300px tile on the page background, holding one piece and its transform controls.

### Navigation
- **Desktop:** A single toolbar row, with the theme switch and sign-in on the left and actions on the right.
- **Mobile:** A compact toolbar with undo, redo, and reset, and a drawer behind the menu button for the remaining actions.

### Board
The signature object: a rounded felt surface with a 4px rim, holding a grid of 50px cells with 1px lines. Today's month and day are marked in yellow. A placed piece replaces its cells' lines with continuous colour and a bevel.

### Pieces
Eight polyomino blocks, each with one fixed colour. Motion gives them weight: a placed piece drops the last 12px over 480ms and flashes on contact, and an invalid drop shakes the cells and tints them red. On a win, a brightness wave crosses the board diagonally.

### Progress Bar
A pill-shaped track above the board, showing placed pieces out of eight.

## Do's and Don'ts

### Do:
- **Do** give saturated colour to the pieces and the date marker, and keep trays and dialogs neutral.
- **Do** use toolbar colour only to show a button's job: slate for information, blue for actions, orange for Reset.
- **Do** keep shadows and bevels on the board and pieces only.
- **Do** make placing a piece feel physical, through weight and contact rather than rewards.
- **Do** use theme tokens (`theme.game.radius.*`, `theme.spacing()`, `theme.palette.*`) rather than raw values, in sibling `.styled.ts` files.
- **Do** keep each piece's colour identical in both themes.

### Don't:
- **Don't** let the game look like a generic admin dashboard, with grey toolbars and bordered cards and no sense of play.
- **Don't** use Date Marker Yellow for anything except today's cells.
- **Don't** add elevation to buttons, toolbars, or trays.
- **Don't** set button labels in uppercase.
