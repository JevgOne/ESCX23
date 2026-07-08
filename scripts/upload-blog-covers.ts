import { put } from '@vercel/blob';
import { db } from '../lib/db';
import { readFileSync } from 'fs';

// Complete mapping: CZ cover image → blog article (by slug)
// EN covers are stored but not yet used (future: locale-specific covers)
const MAPPING: { file: string; slug: string; alt: string }[] = [
  // #1 — Escort Praha kompletní průvodce (návod pro turisty/nováčky)
  { file: 'EscortTuristi.webp', slug: 'escort-praha-kompletni-pruvodce', alt: 'Escort v Praze pro turisty' },
  // #2 — Jak vybrat společnici
  { file: 'JakvybratSPOLECNICI.webp', slug: 'jak-vybrat-spolecnici-praha', alt: 'Jak vybrat společnici v Praze' },
  // #3 — GFE
  { file: 'CoznamenaGFE.webp', slug: 'girlfriend-experience-gfe-praha', alt: 'Co znamená GFE' },
  // #4 — Soukromé apartmány
  { file: 'PruvodcePrivaty.webp', slug: 'soukrome-apartmany-escort-praha', alt: 'Průvodce priváty v Praze' },
  // #5 — První návštěva (diskrétní incall jak to funguje)
  { file: 'DiskretniINCALLpraha.webp', slug: 'prvni-navsteva-escort-agentury', alt: 'Diskrétní incall v Praze jak to funguje' },
  // #6 — Ceny escort Praha
  { file: 'Cenyescortuvprazecoovlivnujecenu.webp', slug: 'ceny-escort-praha', alt: 'Ceny escortu v Praze co ovlivňuje cenu' },
  // #7 — Etiketa escort setkání
  { file: 'EtikaEscort.webp', slug: 'etiketa-escort-setkani', alt: 'Etika escort setkání' },
  // #8 — BDSM Praha
  { file: 'BDSMvysvetlení.webp', slug: 'bdsm-praha-pruvodce', alt: 'BDSM vysvětlení' },
  // #9 — Escort do hotelu (outcall)
  { file: 'EscortoutcallHOTELCZ.webp', slug: 'escort-do-hotelu-praha', alt: 'Outcall do hotelu v Praze' },
  // #12 — Typy společnic (jak vybrat podle typu/vzhledu)
  { file: 'JakvybratpodleTYPU.webp', slug: 'typy-spolecnic-praha', alt: 'Jak vybrat podle typu' },
  // #13 — Diskrétní setkání (NEW)
  { file: 'DiskretníIncall.webp', slug: 'diskretni-setkani-praha', alt: 'Diskrétní incall v Praze' },
  // #14 — Recenze v erotickém byznysu (NEW)
  { file: 'RecenzevERO.webp', slug: 'recenze-v-erotickem-byznysu', alt: 'Recenze v erotickém byznysu' },
  // #15 — Kalendář dostupnosti (NEW)
  { file: 'KalendardostupnostiJAKHOCIST.webp', slug: 'kalendar-dostupnosti-escort', alt: 'Kalendář dostupnosti' },
  // #16 — Tria, show, autoerotika (NEW)
  { file: 'Tria,ShowAUTOERO.webp', slug: 'tria-show-autoerotika-praha', alt: 'Tria, show a autoerotika' },
];

// Articles #10 (nocni-zivot-escort-praha) and #11 (bezpecnost-escort-setkani) have no cover images

const BASE_DIR = '/Users/zen/Desktop/ted';

async function main() {
  let uploaded = 0;
  let skipped = 0;

  for (const item of MAPPING) {
    const filePath = `${BASE_DIR}/${item.file}`;

    // Find article ID by slug
    const result = await db.execute({
      sql: 'SELECT id, cover_url FROM blog_posts WHERE slug = ?',
      args: [item.slug],
    });

    if (!result.rows.length) {
      console.log(`SKIP (article not found): ${item.slug}`);
      skipped++;
      continue;
    }

    const articleId = result.rows[0].id;
    const existingCover = result.rows[0].cover_url;

    if (existingCover) {
      console.log(`SKIP (already has cover): #${articleId} ${item.slug}`);
      skipped++;
      continue;
    }

    console.log(`Uploading ${item.file} → ${item.slug} (#${articleId})...`);

    const fileBuffer = readFileSync(filePath);
    const blob = await put(`blog/covers/${item.file}`, fileBuffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    });

    await db.execute({
      sql: 'UPDATE blog_posts SET cover_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [blob.url, articleId],
    });

    console.log(`  ✓ ${blob.url}`);
    uploaded++;
  }

  console.log(`\nDone. Uploaded ${uploaded}, skipped ${skipped}.`);

  // Verify
  const all = await db.execute(
    `SELECT id, slug, cover_url FROM blog_posts ORDER BY id`,
  );
  console.log('\nAll blog_posts covers:');
  for (const row of all.rows) {
    const hasImg = row.cover_url ? '✓' : '✗';
    console.log(`  ${hasImg} #${row.id}  ${row.slug}`);
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
