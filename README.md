# קישורים לפרויקטים

אתר קישורים לכל הפרויקטים. בנוי ב-Vue 3, TypeScript ו-Vite, כמו `shavit-dashboard`.

## הרצה

```bash
npm install
npm run dev
```

## איפה משנים מה

- `src/data/projects.ts`: הרשימה של הפרויקטים והקישורים. להוספה או לעריכה של פרויקט משנים רק כאן.
- `src/components/ProjectCard.vue`: העיצוב של הכרטיס והכפתורים.
- `src/views/HomeView.vue`: העמוד הראשי.
- `src/styles/main.css`: צבעים, פונט ורקע.
- `src/router.ts`: הנתיבים של האתר. עמודים חדשים נוספים כאן.

## פרסום

כל דחיפה ל-`main` בונה ומפרסמת את האתר ל-GitHub Pages דרך `.github/workflows/deploy.yml`.
