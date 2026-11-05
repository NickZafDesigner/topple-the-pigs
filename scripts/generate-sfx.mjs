// Generates missing public/sfx/*.mp3 cues via ElevenLabs.
// Reads ELEVENLABS_API_KEY from the repo .env. Never prints the key.
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/sfx');
const endpoint = 'https://api.elevenlabs.io/v1/sound-generation';

const CUES = [
  { file: 'place.mp3', duration: 0.6, text: 'Single soft wooden block set onto a table, light realistic tap, playful pixel physics game foley, dry close microphone, quick decay into silence. No music, no voices.' },
  { file: 'pop.mp3', duration: 0.5, text: 'Single soft cartoon bubble pop, round and friendly, very short, quick decay into silence. No music, no voices.' },
  { file: 'del.mp3', duration: 0.6, text: 'Soft short poof of a small wooden toy vanishing, airy and light, quick decay into silence. No music, no voices.' },
  { file: 'thud.mp3', duration: 0.5, text: 'Loud close-miked single wooden crate impact, foreground and clearly audible, dry thud, quick decay into silence. Not quiet, not distant. No music, no voices.' },
  { file: 'boom.mp3', duration: 1.4, text: 'Punchy soft cartoon explosion, rounded low boom with a short airy tail, playful pixel game, not harsh, no screech, no music, no voices.' },
  { file: 'bang.mp3', duration: 0.7, text: 'Small punchy cartoon pop explosion, tight and short, soft crack then quick decay, playful, not harsh. No music, no voices.' },
  { file: 'oink.mp3', duration: 0.8, text: 'Single playful cartoon pig oink, realistic snout, cute and short, then silence. No music, no speech.' },
  { file: 'win.mp3', duration: 2.2, text: 'Short bright cheerful victory fanfare sting for a playful pixel game, soft bells and a wooden mallet, about two seconds, ends cleanly. No vocals.' },
  { file: 'boing.mp3', duration: 0.7, text: 'Single cartoon spring boing, metallic coil twang, short and bouncy, quick decay into silence. No music, no voices.' },
  { file: 'bok.mp3', duration: 0.6, text: 'Single hen cluck, realistic and cute, short, then silence. No music, no speech.' },
  { file: 'quack.mp3', duration: 0.7, text: 'Single duck quack, realistic and cute, short, then silence. No music, no speech.' },
  { file: 'freeze.mp3', duration: 0.8, text: 'Magical ice freeze, short crystalline chime with a tiny crackle, bright and soft, quick decay. No music, no voices.' },
  { file: 'thaw.mp3', duration: 0.6, text: 'Soft ice cracking as something unfreezes, gentle and short, then silence. No music, no voices.' },
  { file: 'paint.mp3', duration: 0.5, text: 'Loud close-miked wet paint splat on wood, one short clearly audible dab, foreground, quick decay into silence. Not quiet. No music, no voices.' },
  { file: 'whoosh.mp3', duration: 0.8, text: 'Loud close-miked airy whoosh of a fuse lighting, clearly audible, short, foreground, quick decay into silence. Not quiet. No music, no voices.' },
  { file: 'gulp.mp3', duration: 0.7, text: 'Cartoon swallow gulp, rounded and short, playful, then silence. No music, no voices.' },
  { file: 'no.mp3', duration: 0.6, text: 'Soft negative game buzzer, two low gentle notes, short, not harsh, then silence. No music, no voices.' },
  { file: 'splash.mp3', duration: 0.7, text: 'Single small water splash, realistic and light, short, then silence. No music, no voices.' },
  { file: 'shatter.mp3', duration: 0.9, text: 'Small pane of glass shattering, bright tinkling shards, short and not harsh, then silence. No music, no voices.' },
  { file: 'poke.mp3', duration: 0.5, text: 'Light fingertip tap on a wooden domino, dry and very short, then silence. No music, no voices.' },
  { file: 'shoot.mp3', duration: 0.9, text: 'Loud close-miked golf thwack launching a small wooden ball, punchy and clearly audible, short soft whoosh, foreground, not quiet, then silence. No music, no voices.' },
  { file: 'tick.mp3', duration: 0.5, text: 'Loud close-miked single mechanical clock tick, sharp transient, clearly audible, immediate decay into silence. Not quiet, not distant. No music, no voices.' },
  { file: 'tock.mp3', duration: 0.5, text: 'Single brighter urgent wooden clock tick, short transient, immediate decay into silence. No music, no voices.' },
  { file: 'laugh.mp3', duration: 1.3, text: 'Short cartoon pig chuckle, three cute oinky laughs, playful, ends cleanly. No music, no speech.' },
  { file: 'bleep.mp3', duration: 0.5, text: 'Single clean television censor bleep, one steady mid tone, short, not distorted. No music, no voices.' },
  { file: 'react.mp3', duration: 0.7, text: 'Surprised cartoon pig squeal, short and cute, rising then falling, then silence. No music, no speech.' },
  { file: 'quake.mp3', duration: 2.2, text: 'Low rolling earthquake rumble, soft and deep, playful game, not harsh, about two seconds, fades out. No music, no voices.' },
  { file: 'slomo.mp3', duration: 1.2, text: 'Cinematic slow-motion whoosh, soft descending braam, short and smooth, not harsh, then silence. No music, no voices.' },
  { file: 'downer.mp3', duration: 1.0, text: 'Low dramatic impact sting as a cartoon pig falls, soft thud plus a short sad horn, playful, not harsh. No vocals.' },
  { file: 'aim.mp3', duration: 0.5, text: 'Soft short ready chime, two gentle rising notes, tiny UI sound, quick decay into silence. No music bed, no voices.' },
  { file: 'charge.mp3', duration: 0.6, text: 'Short rising power-meter chime, bright and small, quick decay into silence. No music bed, no voices.' },
  { file: 'cancel.mp3', duration: 0.5, text: 'Soft descending cancel tone, gentle and very short, then silence. No music, no voices.' },
  { file: 'lose.mp3', duration: 1.2, text: 'Short playful disappointed sting, soft descending woodwind, gentle, about one second, ends cleanly. No vocals.' },
];

function loadKey() {
  const text = readFileSync(resolve(root, '.env'), 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    if (t.slice(0, i).trim() !== 'ELEVENLABS_API_KEY') continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    return v;
  }
  return '';
}

function redact(s, key) {
  let out = String(s);
  if (key) out = out.split(key).join('[redacted]');
  return out.replace(/sk_[A-Za-z0-9]+/g, '[redacted]');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function looksLikeMpeg(buf) {
  if (buf.length < 4) return false;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

async function generateOne(key, cue) {
  const dest = resolve(outDir, cue.file);
  if (existsSync(dest) && statSync(dest).size > 500) {
    console.log('skip ' + cue.file);
    return 'skip';
  }
  let attempt = 0;
  for (;;) {
    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cue.text,
          duration_seconds: cue.duration,
          prompt_influence: 0.4,
        }),
      });
    } catch (err) {
      console.error('request failed for ' + cue.file + ': ' + redact(err && err.message ? err.message : err, key));
      process.exit(1);
    }
    if (res.status === 429) {
      attempt += 1;
      const body = redact(await res.text(), key);
      if (attempt > 6) {
        console.error('HTTP 429 ' + body);
        process.exit(1);
      }
      const ra = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(ra) && ra > 0 ? Math.max(1000, ra * 1000) : Math.min(30000, 2000 * 2 ** (attempt - 1));
      console.log('429 on ' + cue.file + ', waiting ' + wait + 'ms');
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      console.error('HTTP ' + res.status + ' ' + redact(await res.text(), key));
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!looksLikeMpeg(buf) || buf.length < 500) {
      const preview = redact(buf.subarray(0, 500).toString('utf8'), key);
      console.error('HTTP ' + res.status + ' but response was not audio for ' + cue.file + ' (' + buf.length + ' bytes): ' + preview);
      process.exit(1);
    }
    const tmp = dest + '.part';
    writeFileSync(tmp, buf);
    renameSync(tmp, dest);
    console.log('wrote ' + cue.file + ' ' + buf.length + ' bytes');
    return 'ok';
  }
}

const key = loadKey();
if (!key) {
  console.error('ELEVENLABS_API_KEY missing from .env');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
let wrote = 0;
let skipped = 0;
for (const cue of CUES) {
  const part = resolve(outDir, cue.file + '.part');
  if (existsSync(part)) {
    try { unlinkSync(part); } catch (_) { /* ignore */ }
  }
  const result = await generateOne(key, cue);
  if (result === 'ok') wrote += 1;
  else skipped += 1;
  await sleep(350);
}
console.log('done wrote=' + wrote + ' skipped=' + skipped);
