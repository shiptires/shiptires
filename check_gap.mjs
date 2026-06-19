import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

const local = new Database('D:/SHIP.TIRES/ship_tires.db');
const db = createClient({
  url: 'libsql://shiptires-cryptoshah.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEyMzY2MTMsImlkIjoiMDE5ZWI5ZjgtMDgwMS03MmRiLTk5NGQtYTFlZmM0YzNlNTQ0IiwicmlkIjoiMjVhYjViZTctNjc2ZS00ZjVmLTgxMDUtYTAwODFjMzQ4YWY5In0.CK8eWDTMQxbQS2xBLRRvkTvdJDy35d97-t0zhlH1ZxXEBGiYsD_AXXFjpYXhGPNB22MJAVzA9dAkzXRWadwaDg'
});

const brands = ['ADVANTA','BFGOODRICH','BRIDGESTONE','CONTINENTAL','COOPER','DUNLOP','FALKEN','FIRESTONE','GENERAL','GOODYEAR','HANKOOK','HOOSIER','KENDA','KUMHO','LAUFENN','MAXXIS','MICHELIN','MICKEY THOMPSON','NANKANG','NEXEN','NITTO','NOKIAN','PIRELLI','POWER KING','RADAR','RANGE FINDER','RIKEN','SUMITOMO','TOYO','UNIROYAL','VITOUR','VOGUE','VREDESTEIN','YOKOHAMA'];
const ph = brands.map(() => '?').join(',');

// Get all Turso IDs
const r = await db.execute('SELECT id FROM tires');
const tursoIds = new Set(r.rows.map(row => Number(row.id)));
console.log('Turso IDs loaded:', tursoIds.size);

const localRows = local.prepare(`SELECT id, make_name, model_name, season, utqg, category, warranty, weight, thumbnail_url FROM tires WHERE UPPER(make_name) IN (${ph})`).all(brands);

const missing = localRows.filter(row => !tursoIds.has(row.id));
console.log('In local but not Turso:', missing.length);
console.log();

let retreads = 0, bare = 0, good = 0;
for (const m of missing) {
  if (m.model_name && (/Pre-Mold|Retread|Precure|Recap/i.test(m.model_name))) {
    retreads++;
  } else if (!m.season && !m.utqg && !m.category && !m.warranty && !m.weight) {
    bare++;
  } else {
    good++;
  }
}
console.log('Retreads (dont want):', retreads);
console.log('Bare/discontinued (no data):', bare);
console.log('Good (have some data):', good);
console.log();

const goodOnes = missing.filter(m => {
  if (m.model_name && /Pre-Mold|Retread|Precure|Recap/i.test(m.model_name)) return false;
  if (!m.season && !m.utqg && !m.category && !m.warranty && !m.weight) return false;
  return true;
});
console.log('=== Sample GOOD missing tires ===');
goodOnes.slice(0, 20).forEach(g => console.log(g.make_name, g.model_name, '| season:', g.season, '| utqg:', g.utqg));
console.log();

const bareOnes = missing.filter(m => {
  if (m.model_name && /Pre-Mold|Retread|Precure|Recap/i.test(m.model_name)) return false;
  return !m.season && !m.utqg && !m.category && !m.warranty && !m.weight;
});
console.log('=== Sample BARE missing tires (discontinued?) ===');
bareOnes.slice(0, 20).forEach(g => console.log(g.make_name, g.model_name, g.thumbnail_url ? 'HAS IMG' : 'NO IMG'));

process.exit(0);
