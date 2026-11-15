// The "Mission Facts" page: plain HTML so it can be read, scrolled and searched. It holds the proof for every part of the game.
import { CONFIG } from './config';
declare const NSData: any, NS: any;
const D = () => NSData;
const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (d: string) => { if (!d) return ''; const p = d.split('-'); return MONTHS[+p[1] - 1] + ' ' + +p[2] + ', ' + p[0]; };
const link = (u: string, t: string) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`;

let donki: any;
export function openGrownups(tonight: any, level: string) {
  const el = document.getElementById('overlay')!, body = document.getElementById('overlayBody')!;
  const F = D().SEED_FACTS, nights = (tonight ? [tonight] : []).concat(D().SAVED_NIGHTS);
  const proof = D().PROOF.map((p: any) => `<section class="pf"><h4>${esc(p.part)} <span class="tag ${p.tag === 'REAL' ? 'REAL' : p.tag === 'MADE UP' ? 'MADE' : ''}">${p.tag}</span></h4><p>${esc(p.real)}</p><p class="fine">${p.links.map((l: any) => link(l[1], l[0])).join(' · ')}</p><p class="fine">Simplified: ${esc(p.simple)}</p></section>`).join('');
  const nightsHtml = nights.map((n: any, i: number) => `<li><b>${n.live ? 'Night 1, today' : 'Saved night'}:</b> ${fmtDate(n.date)} — ${n.size ? 'storm level S' + n.size + (n.size === 3 ? ' or stronger' : '') : 'no storm'} <span class="src ${n.live ? 'live' : ''}">${n.live ? 'REAL · fetched today' : 'REAL · saved'}</span><span class="fine"> ${esc(n.note)}</span></li>`).join('');
  const dk = donki;
  body.innerHTML = `<h2>${esc(CONFIG.text.facts)} <small>what is real, and where it comes from</small></h2>
  <p class="fine">Level now: ${esc(NS.LEVELS[level].label)}. ${level === 'easy' ? 'Easy: 6 hearts, 10 air, readings stay on the rooms.' : level === 'hard' ? 'Hard: 5 hearts, 8 air, no hints, readings fade after 8 seconds.' : 'Medium: 5 hearts, 9 air, readings stay for the day.'} Nothing else changes between levels.</p>
  <h3>Proof, part by part</h3><p class="fine">REAL = taken straight from NASA or NOAA data. BASED ON REAL = a real idea, simplified. MADE UP = a game choice. The story (a Moon base, the last keeper’s seeds, your crew Lily, Omar and Jun) is made up; the rules and the Moon facts under it are real.</p>${proof}
  <h3>The storm nights are real</h3><p>Each night’s Sun storm is the real NOAA radiation-storm level for a real date. Night 1 is today’s live Sun. The other six nights are drawn at random from these saved real nights, so the storms come on different nights every game.</p><ul>${nightsHtml}</ul>
  <p class="fine">${tonight === undefined ? 'Still checking today’s Sun…' : tonight ? 'Night 1 uses today’s live reading.' : 'Today’s live reading could not be reached, so Night 1 uses a saved real night. Saved data is never shown as today’s.'}${dk ? ` NASA DONKI lists ${dk.count} solar particle storm${dk.count === 1 ? '' : 's'} in the last 30 days (fetched ${dk.fetched}).` : dk === null ? ' NASA DONKI could not be reached just now.' : ''}</p>
  <h3>Which data we used, and why</h3><ul>
  <li><b>NOAA GOES proton flux</b> (${link(D().PROTONS_URL, 'live 7-day feed')}): today’s radiation-storm level for Night 1. S1 starts at 10 pfu, S2 at 100, S3 at 1,000.</li>
  <li><b>NASA DONKI</b> (${link('https://api.nasa.gov/', 'api.nasa.gov')}): the list of recent solar particle storms, shown above as a cross-check.</li>
  <li><b>September 2017 storms</b>: Nights 2–7. ${D().SAVED_SOURCES.map((s: any) => link(s.u, s.t)).join('; ')}.</li>
  <li><b>NASA Open Science Data Repository (OSDR)</b>: ${link(F.healthy.url, 'OSD-522')}, ${link(F.droopy.url, 'OSD-658')}, ${link(F.hurt.url, 'OSD-210')}, ${link(F.dirt.url, 'OSD-476')}.</li>
  <li><b>NASA Moon Base</b>: near the Moon’s south pole.</li>
  <li><b>Apollo samples and seismometers, NASA LCROSS and LRO</b>: the rocks, moonquakes and ice you can find. Each find in the Moon book says if NASA has seen it or is still studying it, and links its source.</li></ul>
  <h3>Pictures and icons</h3><ul>
  <li>Opening picture: “A Breathtaking Earthset from Orion”, Artemis II crew, April 6, 2026 (${link('https://images.nasa.gov/details/art002e021278', 'NASA art002e021278')}).</li>
  <li>Sun: NASA Solar Dynamics Observatory, AIA 171 (${link('https://sdo.gsfc.nasa.gov/data/', 'sdo.gsfc.nasa.gov')}). It is a picture of the Sun, not of each night’s date.</li>
  <li>Earth and Moon: NASA Blue Marble 2012 and NASA “Full Moon”.</li>
  <li>Icons: ${link('https://phosphoricons.com', 'Phosphor Icons')}, MIT licence. Font: Lexend, Open Font License. Built with Phaser (MIT). The domes, the keeper and all animation are drawn in code.</li></ul>
  <h3>Real measurements</h3><p class="fine"><b>Radiation dose</b> is how much of the rays a body soaks up, measured in microsieverts (μSv).</p><ul>${D().REAL_NUMBERS.map((n: any) => `<li><b>${esc(n.where)}:</b> ${esc(n.value)}<span class="fine"> — ${esc(n.note)}. ${link(n.url, n.src)}</span></li>`).join('')}</ul>
  <h3>How the game keeps it simple</h3><ul><li>True to life: rays never stop on the Moon; storms are rare; dirt blocks storm rays well and the always-there rays poorly; plants make air; crews build a shelter when a radiation alarm sounds.</li>
  <li>A <b>beep</b> is one ray getting in. Roofs with 0–4 loads of dirt let in ${NS.COSMIC.join(', ')} always-there rays, plus ${NS.STORM_MULT.join(', ')} per storm level. These are simple counts, not measured doses.</li>
  <li>Time is squeezed: seven nights, one load of dirt standing for a thick layer, a 5-second storm alarm instead of about an hour, and plants that make air faster than real ones.</li></ul>
  <p class="fine">Made for the NASA Space Apps Challenge 2026, “Junior Astronaut Mission Trainer”. Code written with help from Claude, an AI assistant made by Anthropic. NASA does not endorse this game.</p>
  <button class="close" id="ovClose">Close</button>`;
  el.hidden = false;
  const close = () => { el.hidden = true; document.removeEventListener('keydown', onKey); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  document.getElementById('ovClose')!.onclick = close; (document.getElementById('ovClose') as HTMLElement).focus({ preventScroll: true }); body.parentElement!.scrollTop = 0;
  if (donki === undefined) D().loadDonkiSEP().then((d: any) => { donki = d; if (!el.hidden) openGrownups(tonight, level); });
}


// The "How to play" page, opened by the ? button.
export function openHowTo(onHint: () => void) {
  const el = document.getElementById('overlay')!, body = document.getElementById('overlayBody')!;
  body.innerHTML = `<h2>How to play</h2>
  <p><b>Mission:</b> manage your crew. Keep them safe for ${NS.DAYS} nights, and find out what the Moon is made of.</p>
  <h3>Each day</h3>
  <p class="fine">You have ${NS.POWER_PER_DAY} power each day. Every tool costs 1 power. When it runs out, go to bed.</p>
  <ul>
  <li><b>Check:</b> tap Check, then a room. Beeps = space rays getting in. Fewer beeps is safer.</li>
  <li><b>Dirt:</b> dig Moon dirt onto a roof (1 bag a day). More dirt blocks more rays, and it blocks Sun-storm rays best.</li>
  <li><b>Seeds:</b> plant in a safe room (up to 2 trays a room, 6 in all). Each healthy tray makes air.</li>
  <li><b>Rock:</b> pick a place, then say Yes or No to sending a crew member. Whatever they find goes in the Moon book, and you send it to NASA.</li>
  <li><b>Quake:</b> your pilot sets a sensor that listens for moonquakes.</li>
  <li><b>Sleep:</b> pick the safest room and end the day.</li></ul>
  <h3>Each night</h3>
  <ul>
  <li>Rays hit your roof. 0 to 3 beeps is safe, 4 to 7 costs 1 heart, 8 or more costs 2 hearts.</li>
  <li>The crew uses ${NS.AIR_PER_NIGHT} air a night. Plants that stay healthy make more.</li>
  <li><b>Storm alarm:</b> on a storm night, tap your safest room before the timer runs out. Running costs 1 air.</li>
  <li>Going outside on a storm night is risky.</li></ul>
  <h3>Stars</h3>
  <ul><li>Keep at least 1 heart. Find the safest room. Solve the seed mystery: one room started with no dirt, and the seeds there died. Collect Moon finds for the science star.</li></ul>
  <p class="fine">Stuck? Tap <b>Show next step</b>. Tap the Sun, the Earth or the top bar for more info.</p>
  <div class="row"><button class="close" id="ovHint">Show next step</button> <button class="close alt" id="ovClose">Close</button></div>`;
  el.hidden = false;
  const close = () => { el.hidden = true; document.removeEventListener('keydown', onKey); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  document.getElementById('ovClose')!.onclick = close;
  document.getElementById('ovHint')!.onclick = () => { close(); onHint(); };
  (document.getElementById('ovHint') as HTMLElement).focus({ preventScroll: true }); body.parentElement!.scrollTop = 0;
}
