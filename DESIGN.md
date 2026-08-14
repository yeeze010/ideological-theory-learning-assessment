# Design

> Auto-generated and maintained by frontend-god-mode.
> Source of truth for typography, color, motion, layout, and component tokens.
> Read this BEFORE touching the UI in any subsequent session.

## Aesthetic Direction

Swiss academic assessment console: quiet, role-first, and optimized for scanning learning tasks, exams, reviews, and statistics.

## Dials

- DESIGN_VARIANCE: 5 / 10
- MOTION_INTENSITY: 4 / 10
- VISUAL_DENSITY: 6 / 10

## Type Stack

- Display: Helvetica Neue
- Body: Helvetica Neue, Arial, Microsoft YaHei
- Mono: tabular numerics only
- Banned: Inter as a default, emoji navigation, vague marketing headings

## Color Tokens

```css
:root {
  --surface: #fff;
  --page: #f7f7f8;
  --ink: #101216;
  --muted: #68707c;
  --line: #d7dbe0;
  --accent: #e4002b;
  --success: #087f5b;
  --warning: #b45309;
  --blue: #002fa7;
}
```

## Motion

- Buttons and links use direct 150-180ms hover/press feedback.
- No ornamental animation on assessment data.
- Reduced motion must preserve all role and table interactions.

## Layout

- Login is the only unauthenticated surface.
- Navigation is grouped by Student, Teacher, Admin, and Supervisor/Teaching Research roles.
- Tables, metrics, and timelines stay dense but bordered for auditability.

## Component Inventory

- Role login form
- Sidebar grouped navigation
- Metric grid
- Data table
- Dialog form
- Timeline and progress rows

## Project-Specific Bans

- No pre-login business metrics or sample data.
- No separate visible question-admin role in the product positioning; teachers and admins own question workflows.
- No button without visible hover, active, disabled, or success/error feedback.

## Last Updated

2026-06-26 by Worker C: re-centered the role model around students, teachers, admins, and supervisors/teaching researchers.
