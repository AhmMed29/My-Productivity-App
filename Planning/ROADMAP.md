# My Productivity App - Development Roadmap

## STRICT WORKING RULES (THE "ONE-BY-ONE" PROTOCOL):
1. INITIALIZATION: First, copy the entire project into the `worktree` to isolate modifications.
2. ISOLATION: Work on EXACTLY ONE sub-task at a time from the roadmap.
3. NO COLLATERAL DAMAGE: Never modify a file or logic outside the scope of the current sub-task.
4. BACKWARD COMPATIBILITY: Database migrations must not delete or corrupt existing user data.
5. PAUSE AND REPORT: After completing a sub-task, TEST it, then STOP. Report to user.
6. DO NOT PROCEED to the next sub-task until user says "Yes, move to the next."

---

## TASK 0: Project Setup & Analysis 🔍

### Subtask 0.1: Create Git Worktree
- Create a new worktree branch: `git worktree add ../my-productivity-app-v2 feature/major-refactor`
- Copy all files to new worktree
- Initialize git in new location
- ✅ Checkpoint: Confirm both versions run independently

### Subtask 0.2: Full Code Audit
- Read and document every function in main.js
- Map all IPC channels (main ↔️ renderer)
- List all database queries in database.js
- Document all CSS classes in index.html
- Chart all event listeners in JS files
- ✅ Checkpoint: Create a markdown file with complete documentation

### Subtask 0.3: Database Schema Documentation
- Export current database schema to SQL
- Document migration history (v1 → v3)
- List all indexes and constraints
- Map relationships between tables
- ✅ Checkpoint: Schema diagram ready for review

---

## TASK 1: Sidebar Redesign 🎨

### Subtask 1.1: HTML Structure Update
- Create new sidebar container: `<div id="sidebar-container">`
- Add collapsed state (icons only) structure
- Add expanded state (icons + text) structure
- Keep existing navigation buttons functional
- ✅ Test: Clicking sidebar buttons still switches pages

### Subtask 1.2: CSS Styling
- Style collapsed sidebar (60px width)
- Style expanded sidebar (220px width)
- Add smooth transitions (0.3s ease)
- Style icons (SVG or Font Awesome)
- Add hover effects for expansion trigger
- ✅ Test: Sidebar expands on hover, collapses on mouse leave

### Subtask 1.3: JavaScript Interaction
- Add event listener for sidebar hover
- Toggle expanded class on hover
- Maintain active page indicator
- Ensure RTL compatibility for Arabic
- ✅ Test: Navigation works in both EN and AR modes

### Subtask 1.4: Label Text Implementation
- Add labels: "Pomodoro", "Habits", "Goals", "Statistics", "Settings"
- Position text beside icons
- Hide text in collapsed state
- Show text in expanded state
- Apply correct font (SF-Pro/SF-Arabic)
- ✅ Test: Text appears smoothly, correct font applied

---

## TASK 2: Goals Page - Foundation 🎯

### Subtask 2.1: Database Schema - Goals Table
- Create migration v4 with goals table and goal_progress table
- Test migration on a copy of database
- ✅ Test: Run migration, check tables created, rollback works

### Subtask 2.2: Auto-Create Tag for Goal
- Modify createGoal() to auto-create tag with goal's name and color
- Link tag to goal in goals.tagId
- ✅ Test: Create goal → tag appears in tags list automatically

### Subtask 2.3: Goals Page UI - HTML
- Create new page section: `<div id="goals-page" class="page">`
- Add "Add New Goal" button
- Create goals grid container
- Design single goal card template
- ✅ Test: Page shows when clicking "Goals" in sidebar

### Subtask 2.4: Goal Card Design
- Card: Goal name, Progress circle, Date range, Edit/Delete icons
- Apply rounded corners, subtle shadow, color-coded border
- ✅ Test: Card displays correctly in both languages

### Subtask 2.5: Add Goal Modal
- Create #add-goal-modal with form fields
- Calculate endDate automatically from startDate + duration
- Save button calls window.api.createGoal()
- ✅ Test: Modal opens, form validates, goal saves to DB

---

## TASK 3: Goals-Tasks Integration 🔗

### Subtask 3.1: Modify Sessions to Track Goal Progress
- When session completed with a tag, check if tag is linked to a goal
- Calculate daily progress based on goal duration
- Update goal_progress table
- ✅ Test: Complete session with goal tag → goal progress updates

### Subtask 3.2: Daily Progress Calculation Logic
- Formula: dailyTarget = totalGoalDays / duration
- todayProgress = sessionsWithGoalTag.focusMinutes / (dailyTarget * 25)
- ✅ Test: 3-month goal → each day adds ~0.33% if on track

### Subtask 3.3: Goal Progress Circle UI
- Render SVG circle in goal card
- Calculate stroke-dashoffset based on total progress
- ✅ Test: Progress updates when sessions completed

### Subtask 3.4: Task Popup - Show Goal Linkage
- When tag selected, check if linked to a goal
- Show small badge: "Linked to: [Goal Name]"
- ✅ Test: Select goal tag → badge appears

---

## TASK 4: Modern Pomodoro Design ⏱️

### Subtask 4.1: Analyze Reference Design
- Open all files in Pomo modern design/ folder
- Document circle animation, button interaction, color scheme, typography
- ✅ Checkpoint: Design analysis document ready

### Subtask 4.2: Update SVG Circle Design
- Replace current SVG circle with new design (thicker stroke, gradient, glow)
- Keep updateTimer() function working
- ✅ Test: Timer counts down correctly with new circle

### Subtask 4.3: Make Circle Interactive (Clickable)
- Add click event to SVG circle element
- Clicking circle = Start/Pause/Resume
- Keep existing buttons as fallback
- ✅ Test: Click circle to start timer, click again to pause

### Subtask 4.4: Center Time Display Styling
- Apply new font to timer display (64px, font-weight: 300)
- ✅ Test: Time displays clearly in both EN/AR

### Subtask 4.5: Color Transitions
- Idle: Gray, Active: Blue gradient, Break: Green gradient
- Smooth transitions (1s ease)
- ✅ Test: Colors change smoothly during timer states

---

## TASK 5: Apple Fonts Integration 🔤

### Subtask 5.1: Font Files Setup
- Check fonts in Fonts/ folder
- Add @font-face declarations in <style> of index.html
- ✅ Test: Fonts load without errors

### Subtask 5.2: Apply SF-Pro to English UI
- 5.2.1: Sidebar & Navigation
- 5.2.2: Pomodoro Page
- 5.2.3: Habits Page
- 5.2.4: Goals Page
- 5.2.5: Settings & Modals

### Subtask 5.3: Apply SF-Arabic to Arabic UI
- 5.3.1-5.3.5: Same structure for Arabic

### Subtask 5.4: RTL Adjustments
- Sidebar, Settings, Buttons, Modals: RTL for Arabic
- Keep LTR: Pomodoro circle, Habits table, Goals grid, Stats graphs
- ✅ Test: Switch language → correct direction applied

---

## TASK 6: Statistics Overhaul 📊

### Subtask 6.1: Design Stats Page Layout
- Create #statistics-page with time period selector and 3 graph cards
- ✅ Test: Page shows when clicking "Statistics"

### Subtask 6.2: Data Aggregation Functions
- Create DB queries for habits, pomodoro, tasks by period
- ✅ Test: Queries return correct data

### Subtask 6.3: Graph Rendering (Canvas or SVG)
- Draw axes, plot dots, connecting lines
- ✅ Test: Graph renders correctly

### Subtask 6.4: Interactive Graph Features
- Hover tooltips, click for details, zoom
- ✅ Test: Interactions work smoothly

### Subtask 6.5: Period Selector Logic
- Add Today/Week/Month/Year buttons
- Clicking re-fetches data and redraws graph
- ✅ Test: Switching periods updates graphs

---

## TASK 7: Data Integrity & Backward Compatibility 🛡️

### Subtask 7.1: Migration Testing Suite
- Create test databases with old schema versions
- Run all migrations (v1 → v4)
- ✅ Test: Old data survives all migrations

### Subtask 7.2: Add Migration for Goals (v4)
- Write migration script in database.js
- Test on copy of production DB
- ✅ Test: Migration runs once, doesn't repeat

### Subtask 7.3: Validate All DB Operations
- Test all CRUD operations
- ✅ Test: No data loss or corruption

---

## TASK 8: Code Testing & QA ✅

### Subtask 8.1: Manual Testing Checklist
- Pomodoro, Habits, Goals, Settings, Statistics
- ✅ Checkpoint: All features work as expected

### Subtask 8.2: Cross-Language Testing
- Test all features in English and Arabic
- Check RTL alignment and font rendering
- ✅ Test: App works perfectly in both languages

### Subtask 8.3: Edge Cases Testing
- Empty database, old data, missing fields, invalid inputs
- ✅ Test: App handles edge cases gracefully

---

## TASK 9: Build & Deployment 📦

### Subtask 9.1: Prepare for Build
- Update package.json, configure electron-builder, app icon

### Subtask 9.2: Test Build on Clean System
- Build .exe, install on fresh machine, test all features

### Subtask 9.3: Create Installer
- Use electron-builder to create installer

### Subtask 9.4: Final Release Checklist
- Version, changelog, tests, no console errors

---

## Design Principles:
- Maintain consistent design across all components
- Preserve existing data when adding features
- Test all interactions
- Use EN font: Spectral, Use AR font: Noto_Sans_Arabic (from Fonts/ folder)
- RTL only for: sidebar, settings, buttons, popups
- LTR for: pages, tables, Pomodoro (only font changes for AR)
