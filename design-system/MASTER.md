# Design System Master

Source of truth for 思政理论学习考核评价系统. This file mirrors the root `DESIGN.md` and adds the GitHub `ui-ux-pro-max-skill` audit floor.

## Product Direction

- Swiss academic assessment console for learning tasks, exams, review, statistics, and governance.
- Quiet, role-first, dense bordered layouts optimized for scanning records and evidence.
- Login is the only unauthenticated surface; route guards must block all business pages before login.

## Required UX Floor

- Accessibility: skip link, visible focus-visible rings, semantic login form, autocomplete fields, readable status text, and role-aware nav labels.
- Touch & Interaction: buttons, links, inputs, and selects are at least 44px high with hover, active, disabled, and busy feedback.
- Performance: metric, table, progress, and chart areas keep stable dimensions.
- Layout/Responsive: mobile retains accessible navigation; sidebar must not disappear without replacement.
- Forms & Feedback: login validates role/account/password, errors appear near the form, and actions use disabled/loading text.
- Charts & Data: chart bars and progress rows include text labels and values; color never carries meaning alone.
- Motion: respect `prefers-reduced-motion`.

## Tokens

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

## Project Rules

- Navigation is grouped by students, teachers, admins, supervisors, and teaching researchers.
- Use tables, metrics, timelines, and bordered panels for auditability.
- Banned: pre-login metrics/sample data, emoji navigation, vague marketing headings, and hidden mobile navigation.
