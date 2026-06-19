# TASK-011 Blog Audit

**Datum:** 2026-05-29  
**Kontrolor:** kontrolor

---

## 1. Co aktuálně funguje

### Frontend pages:
- `/[locale]/blog/page.tsx` — blog listing, funkční, volá `getBlogPosts()`, zobrazuje empty state pokud nejsou data
- `/[locale]/blog/[slug]/page.tsx` — blog detail, volá `getBlogPostBySlug()`, vrací `notFound()` pokud článek neexistuje
- Oba mají `revalidate = 3600` (ISR, ok pro blog)
- i18n překlady pro `blog` namespace existují v cs.json (a pravděpodobně en/de/uk)
- OG image pro blog: `app/[locale]/blog/opengraph-image.tsx` existuje
- Structured data (Article schema) v detail stránce

### Queries (lib/queries.ts):
- `getBlogPosts(limit, offset)` — try/catch, vrací `[]` pokud tabulka neexistuje
- `getBlogPostBySlug(slug)` — try/catch, vrací `null` pokud tabulka neexistuje

---

## 2. Co chybí / není hotové

### DB:
- **Tabulka `blog_posts` neexistuje** v lokální DB ani v secretstory exportu
- Build warning: `[blog] getBlogPosts failed — SQLITE_ERROR: no such table: blog_posts`
- Blog byl v CLAUDE.md označen jako "sprint 4+" — zatím záměrně přeskočen

### Admin:
- **Žádná admin stránka pro správu článků** — `/admin/blog` neexistuje
- Chybí: seznam článků, editor (WYSIWYG nebo Markdown), kategorie/tagy, preview

### Mockupy:
- **Žádný mockup pro blog** — v `mockups/` není blog.html ani _combined.html blog sekce

### Schema (odhadované potřebné sloupce):
```sql
CREATE TABLE blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'draft', -- draft|published
  author TEXT DEFAULT 'LovelyGirls Praha',
  cover_url TEXT,
  -- Multi-language
  title_cs TEXT, title_en TEXT, title_de TEXT, title_uk TEXT,
  excerpt_cs TEXT, excerpt_en TEXT, excerpt_de TEXT, excerpt_uk TEXT,
  content_cs TEXT, content_en TEXT, content_de TEXT, content_uk TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
*Pozn.: Queries teď čtou sloupce `title`, `excerpt`, `content` (bez locale suffix) — bude potřeba rozšíření při implementaci.*

---

## 3. Stav dle CLAUDE.md

Dle `CLAUDE.md` sekce "Implementační pořadí":
- Blog je v **Sprint 4 (Admin panel)** nebo pozdějším sprintu
- `blog_posts`, `blog_tags`, `blog_post_tags` patří mezi záměrně přeskočené tabulky v Sprint 1

---

## Závěr

Blog frontend pages jsou skeletálně připraveny (stránky existují, graceful fallback). Nic ale nefunguje end-to-end protože:
1. Tabulka `blog_posts` neexistuje
2. Žádná admin UI pro správu obsahu
3. Queries předpokládají jiné sloupce než bude finální schema

**Doporučení:** Blog implementovat jako samostatný sprint (sprint 4+) zahrnující DB schema, seed, admin editor a případně Markdown renderer.
