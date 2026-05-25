import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

const db = createClient({ url: `file:${dbPath}` });

const result = await db.execute({
  sql: `UPDATE girl_photos
        SET url = 'https://picsum.photos/seed/' || id || '/600/750'
        WHERE url LIKE '%public.blob.vercel-storage.com%'
           OR url IS NULL
           OR url = ''`,
  args: [],
});

console.log(`Updated ${result.rowsAffected} photo URLs to picsum.photos`);

const check = await db.execute({
  sql: `SELECT COUNT(*) AS cnt FROM girl_photos WHERE url LIKE '%picsum%'`,
  args: [],
});
console.log(`Picsum URLs in DB: ${check.rows[0].cnt}`);

const broken = await db.execute({
  sql: `SELECT COUNT(*) AS cnt FROM girl_photos WHERE url LIKE '%vercel-storage%'`,
  args: [],
});
console.log(`Remaining broken (vercel-storage) URLs: ${broken.rows[0].cnt}`);
