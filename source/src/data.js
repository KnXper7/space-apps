/* Moon Detective: Night Shift — real data, sources and the live space-weather loader.
   Storm size in the game = the real NOAA radiation-storm scale for that night:
   0 = no storm (under 10 pfu), 1 = S1, 2 = S2, 3 = S3 or stronger. (pfu = protons of 10 MeV or more, per cm2 per second per steradian.) */
(function (root) {
  'use strict';

  // Get a free key at https://api.nasa.gov and paste it here. DEMO_KEY runs out after a few requests.
  var NASA_API_KEY = 'DEMO_KEY';

  // SAVED real nights (never shown as "today"). September 2017 radiation storms, from NOAA SWPC reports.
  var SAVED_NIGHTS = [
    { date: '2017-09-04', size: 0, note: 'No storm level listed in NOAA’s alert table for this day. The first listed storm level was the next day.' },
    { date: '2017-09-05', size: 2, note: 'S2 in NOAA’s alert table.' },
    { date: '2017-09-06', size: 2, note: 'S2 in NOAA’s alert table. The day of the X9.3 solar flare.' },
    { date: '2017-09-08', size: 2, note: 'S2 in NOAA’s alert table.' },
    { date: '2017-09-10', size: 3, note: 'S3 in NOAA’s alert table, after the X8.2 flare (peak 15:35 UT). The first storm since 2012 strong enough to raise radiation at ground level.' }
  ];
  var SAVED_SOURCES = [
    { t: 'NOAA SWPC alert table in Redmon et al. 2018 (Table 1)', u: 'https://repository.library.noaa.gov/view/noaa/21802' },
    { t: 'NASA: “September 2017’s Intense Solar Activity Viewed From Space”', u: 'https://www.nasa.gov/feature/goddard/2017/september-2017s-intense-solar-activity-viewed-from-space' },
    { t: 'Redmon et al. 2018, Space Weather, “September 2017’s Geoeffective Space Weather”', u: 'https://doi.org/10.1029/2018SW001897' }
  ];
  var PROTONS_URL = 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-7-day.json';

  function sizeFromFlux(pfu) { return pfu >= 1000 ? 3 : pfu >= 100 ? 2 : pfu >= 10 ? 1 : 0; }
  function getJSON(url, ms) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 12000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function clock() { return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }

  // Today's real radiation-storm level from the GOES satellite. Resolves to null if it cannot be reached.
  function loadTonight() {
    var today = new Date().toISOString().slice(0, 10);
    return getJSON(PROTONS_URL).then(function (rows) {
      if (!Array.isArray(rows) || !rows.length) throw new Error('unexpected reply');
      var max = -1;
      rows.forEach(function (x) { if (x.energy === '>=10 MeV' && x.time_tag && x.time_tag.slice(0, 10) === today && x.flux > max) max = x.flux; });
      if (max < 0) throw new Error('no data for today');
      return { date: today, size: sizeFromFlux(max), pfu: max, live: true, fetched: clock(),
               note: 'Highest proton flux so far today: ' + (max < 10 ? max.toFixed(2) : Math.round(max)) + ' pfu (NOAA GOES satellite), fetched ' + clock() + '.' };
    }).catch(function () { return null; });
  }
  // NASA DONKI's list of solar particle storms (SEP) in the last 30 days. Resolves to null if it cannot be reached.
  function loadDonkiSEP() {
    var end = new Date(), start = new Date(end.getTime() - 30 * 864e5), d = function (x) { return x.toISOString().slice(0, 10); };
    return getJSON('https://api.nasa.gov/DONKI/SEP?startDate=' + d(start) + '&endDate=' + d(end) + '&api_key=' + NASA_API_KEY, 8000).then(function (j) {
      if (!Array.isArray(j)) throw new Error('unexpected reply');
      return { count: j.length, latest: j.length ? j[j.length - 1].eventTime : null, fetched: clock() };
    }).catch(function () { return null; });
  }
  // Night 1 is today's real Sun when we can reach it. The other nights are real nights from the September 2017 storms.
  // Night 1 is today's real Sun when we can reach it. The other six nights are drawn at random from the saved real nights,
  // so the storms come on different nights each game (a real night can come up twice).
  var NIGHTS_PER_GAME = 7;
  function buildNights(tonight) {
    var pool = [];
    while (pool.length < NIGHTS_PER_GAME) {
      var bag = JSON.parse(JSON.stringify(SAVED_NIGHTS));
      for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
      if (pool.length && bag[0].date === pool[pool.length - 1].date) bag.push(bag.shift());
      pool = pool.concat(bag);
    }
    var nights = pool.slice(0, NIGHTS_PER_GAME);
    if (tonight) nights[0] = tonight;
    return nights;
  }

  // ---- curated facts (saved, each with a source), in kid words -----------------------------------------
  var OSDR = 'https://osdr.nasa.gov/bio/repo/data/studies/';
  var SEED_FACTS = {
    healthy: { text: 'Real plants have grown on the Space Station!', src: 'NASA study OSD-522', url: OSDR + 'OSD-522' },
    droopy:  { text: 'Scientists blasted baby plants with lab-made space rays. The plants had to work hard to fix themselves.', src: 'NASA study OSD-658', url: OSDR + 'OSD-658' },
    hurt:    { text: 'Seeds rode a balloon high up, where space rays are strong. Fewer of them sprouted.', src: 'NASA study OSD-210', url: OSDR + 'OSD-210' },
    dirt:    { text: 'Plants really grew in Moon dirt from Apollo. Slowly!', src: 'NASA study OSD-476', url: OSDR + 'OSD-476' }
  };
  var REAL_NUMBERS = [
    { where: 'Moon surface', value: '1,369 μSv each day', note: 'about 2.6 times the Space Station’s deep-space-ray dose (523 μSv/day) and about 200 times Earth’s surface. No Sun storm happened during the measurement',
      src: 'LND instrument on the Chang’e 4 lander (Zhang et al. 2020, Science Advances). Not NASA data.', url: 'https://doi.org/10.1126/sciadv.aaz1334' },
    { where: 'Inside the Space Station (same weeks)', value: '731 μSv each day', note: '523 from deep-space rays plus 208 from particles in the South Atlantic Anomaly. Earth’s magnetic field still helps up there',
      src: 'Same paper (Zhang et al. 2020).', url: 'https://doi.org/10.1126/sciadv.aaz1334' },
    { where: 'Mars surface', value: '640 μSv each day (0.64 mSv)', note: 'Mars has a thin atmosphere that blocks a little',
      src: 'NASA Curiosity rover, RAD instrument (Hassler et al. 2014, Science).', url: 'https://doi.org/10.1126/science.1244797' },
    { where: 'Inside NASA’s Orion “storm shelter”', value: 'at most 150 mSv from a large Sun storm', note: 'the limit the shelter is designed to hold; no signs of acute radiation sickness are expected at that dose',
      src: 'Artemis I results (DLR / NASA; George et al. 2024, Nature).', url: 'https://www.dlr.de/en/latest/news/2024/orion-spacecraft-radiation-protection-tested-initial-findings-from-artemis-i-moon-mission' }
  ];

  // ---- proof, part by part: what in the game is real, where it comes from, and what we simplified ----------
  // tag: REAL = taken straight from NASA/NOAA data; BASED ON REAL = a real idea, simplified; MADE UP = a game choice.
  var PROOF = [
    { part: 'Sun storms', tag: 'REAL', real: 'Each night’s storm size is NOAA’s real radiation-storm level (S1 starts at 10 pfu, S2 at 100, S3 at 1,000 protons of 10 MeV or more). Night 1 is read live from the GOES satellite. The other six nights are picked at random from five real September 2017 nights (none, S2, S2, S2, S3), so storms come on different nights every game.',
      links: [['NOAA SWPC radiation storms', 'https://www.swpc.noaa.gov/phenomena/solar-radiation-storm'], ['live GOES feed', PROTONS_URL], ['NOAA alert table, Redmon et al. 2018', 'https://repository.library.noaa.gov/view/noaa/21802'], ['NASA on Sept 2017', 'https://www.nasa.gov/feature/goddard/2017/september-2017s-intense-solar-activity-viewed-from-space']],
      simple: 'GOES measures near Earth. We use it as the storm size at the Moon, which is about the same distance from the Sun.' },
    { part: 'Two kinds of rays', tag: 'BASED ON REAL', real: 'Space rays that are always there (cosmic rays), plus extra rays during Sun storms. NASA says shielding works for Sun-storm particles, but cosmic rays are much harder to stop. That is why thick dirt helps a lot on storm nights and only a little on quiet ones.',
      links: [['NASA: Artemis I radiation research', 'https://www.nasa.gov/general/artemis-i-space-radiation-research-to-help-moon-mars-explorers/']],
      simple: 'The ray counts per room are simple game numbers, not measured doses.' },
    { part: 'The beeper', tag: 'BASED ON REAL', real: 'Orion carries NASA radiation sensors called HERA (six in Artemis II). They sit in different spots, read how much radiation gets through, and sound a warning.',
      links: [['NASA: Orion radiation protection', 'https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/'], ['NASA: Artemis I instruments', 'https://www.nasa.gov/general/artemis-i-space-radiation-research-to-help-moon-mars-explorers/']],
      simple: 'One beep = one ray getting in. It is a count a child can do, not a radiation dose.' },
    { part: 'Moon dirt on the roof', tag: 'BASED ON REAL', real: 'Engineers study piling Moon dirt (regolith) over habitats to block radiation. NASA’s JPL ARMOR concept uses an arch of regolith about 3 meters thick.',
      links: [['NASA Tech Briefs: JPL ARMOR', 'https://www.techbriefs.com/component/content/article/15262-npo-47686'], ['Akisheva & Gourinat 2021', 'https://doi.org/10.3390/app11093853']],
      simple: 'One load of dirt in the game stands for a thick layer. Real roofs need meters of it.' },
    { part: 'Digging', tag: 'BASED ON REAL', real: 'NASA’s RASSOR is a lightweight robot with two spinning scoop drums that digs Moon dirt, because low gravity makes normal digging hard.',
      links: [['NASA: RASSOR', 'https://www.nasa.gov/directorates/stmd/help-nasa-design-a-robot-to-dig-on-the-moon/']],
      simple: 'The keeper digs by hand in five taps. Real digging would be done by robots.' },
    { part: 'Storm alarm', tag: 'BASED ON REAL', real: 'On Orion, HERA warns the crew, and they build a shelter from stowage bags in about an hour, then may stay in it up to 24 hours. Orion’s shelter keeps the dose from a large storm to 150 mSv or less.',
      links: [['NASA: Orion radiation protection', 'https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/'], ['DLR: Artemis I findings', 'https://www.dlr.de/en/latest/news/2024/orion-spacecraft-radiation-protection-tested-initial-findings-from-artemis-i-moon-mission']],
      simple: 'The game gives you 5 seconds, and running to another room costs 1 air. Both are game choices.' },
    { part: 'Plants and air', tag: 'BASED ON REAL', real: 'NASA research treats plants as part of future life support: they can make food and oxygen and remove carbon dioxide. Astronauts have grown real plants on the Space Station.',
      links: [['NASA research review, Johnson et al. 2021', 'https://doi.org/10.3389/fspas.2021.734343'], ['NASA study OSD-522', OSDR + 'OSD-522']],
      simple: 'Plants in the game make air much faster than real ones. On the Station today, plants are mostly for fresh food.' },
    { part: 'The seed mystery', tag: 'BASED ON REAL', real: 'NASA-funded studies found that space-type radiation stresses plants, that seeds flown high on a balloon sprouted less, and that plants grew slowly in real Apollo Moon dirt.',
      links: [['OSD-658: lab-made space rays', OSDR + 'OSD-658'], ['OSD-210: balloon seeds', OSDR + 'OSD-210'], ['OSD-476: Apollo Moon dirt', OSDR + 'OSD-476'], ['NASA: plants in lunar soil', 'https://www.nasa.gov/humans-in-space/scientists-grow-plants-in-lunar-soil/']],
      simple: 'The “last keeper” and the room where the seeds died are a made-up story. The science behind it is real.' },
    { part: 'The three rooms', tag: 'BASED ON REAL', real: 'NASA is planning a Moon Base near the Moon’s south pole. A published layout for NASA’s Foundation Surface Habitat has a sleeping area, a biology lab and a geology lab, so the game’s three rooms are Quarters, Bio Lab and Geo Lab.',
      links: [['NASA: Moon Base systems', 'https://www.nasa.gov/moonbase-systems/'], ['Inside the Foundation Surface Habitat (Burke et al. 2022 layout)', 'https://www.americaspace.com/2024/01/13/living-on-the-moon-inside-artemis-foundation-habitat/']],
      simple: 'In the real plan these areas share one building, and the base is spread over a large area. The game gives each room its own roof so you can compare them. The letters A, B and C are ours.' },
    { part: 'Your mission: what is the Moon made of?', tag: 'BASED ON REAL', real: 'NASA is still working out parts of what the Moon is made of: how much water ice hides in dark craters, and what the inside is like. Apollo astronauts brought back rocks and left seismometers that listened until 1977.',
      links: [['NASA LCROSS', 'https://science.nasa.gov/mission/lcross/'], ['Astronomy: what Apollo left behind', 'https://www.astronomy.com/space-exploration/what-did-the-apollo-astronauts-leave-behind/']],
      simple: 'You are not graded right or wrong on the unknown parts. They are marked “NASA is still studying this”. Your science star is for how much you find and send.' },
    { part: 'The crew and the Commander', tag: 'BASED ON REAL', real: 'Moon crews are small teams with jobs: a Pilot, a Flight Engineer who keeps air and power running, and a Science and Medical Officer who runs experiments and watches radiation health. The Commander decides who does what and keeps talking with Mission Control on Earth.',
      links: [],
      simple: 'Lily, Omar and Jun are made-up names, and the jobs are simplified to fit the tools. Real crews share many jobs.' },
    { part: 'Rocks and dust', tag: 'BASED ON REAL', real: 'Apollo astronauts brought back pale highland rock (anorthosite), dark lava rock (basalt) from the plains, Moon dust (regolith) and crash-welded rock (breccia).',
      links: [['Apollo 17 samples', 'https://www.virtualmicroscope.org/content/apollo-17'], ['Apollo 14 samples', 'https://virtualmicroscope.org/content/apollo-14'], ['Apollo 12 samples', 'https://virtualmicroscope.org/content/apollo-12']],
      simple: 'Real Apollo samples came from six landing sites, not from near the south pole. In the game every place gives two finds.' },
    { part: 'Ice in dark craters', tag: 'REAL', real: 'NASA’s LCROSS crashed a rocket stage into Cabeus crater near the south pole in 2009 and found water in the debris. LCROSS and LRO also found that dark craters are cold enough to trap other frozen gases.',
      links: [['NASA LCROSS', 'https://science.nasa.gov/mission/lcross/'], ['NASA JPL: LRO and LCROSS results', 'https://www.jpl.nasa.gov/news/lunar-impact-may-impact-lunar-science-for-years-to-come/']],
      simple: 'In the game any dark crater has ice. In real life NASA is still mapping where it is and how much.' },
    { part: 'The moonquake sensor', tag: 'BASED ON REAL', real: 'Apollo 12, 14, 15 and 16 left seismometers that felt moonquakes until 1977. The Moon rang like a bell after a lander part was crashed into it. Apollo data point to a crust, a mantle and a small core.',
      links: [['Astronomy: what Apollo left behind', 'https://www.astronomy.com/space-exploration/what-did-the-apollo-astronauts-leave-behind/'], ['Temblor: Apollo 11 moonquakes', 'https://temblor.net/?p=9213']],
      simple: 'Real sensors listened for years. In the game one sensor tells you something new on each of your first three nights.' },
    { part: 'Talking to Earth', tag: 'BASED ON REAL', real: 'Radio travels at the speed of light, so a message from the Moon reaches Earth in about 1.3 seconds (the Moon is about 384,000 km away).',
      links: [],
      simple: 'When you tap Send, the signal takes 1.3 seconds to fly to Earth. Mars is much farther, so its delay is minutes.' },
    { part: 'Going outside in a storm', tag: 'MADE UP', real: 'On a big-storm night, sending a crew member outside costs 1 heart. NASA’s worry about radiation outside the habitat is real, but this exact rule is ours.',
      links: [],
      simple: 'It teaches “no choice is free”: a rock sample is worth finding, and it is not free.' },
    { part: 'Air, power, hearts, seven nights', tag: 'MADE UP', real: 'These are game rules that make you choose. A lunar day lasts about 14 Earth days; a game “night” is a rest, not a lunar night.',
      links: [['NASA: a lunar day is about 14 Earth days', 'https://www.nasa.gov/?p=995114']],
      simple: 'The numbers (air −2 a night, 3 power a day, 7 nights, 1 power and 1 air for a rock trip) are ours.' }
  ];

  root.NSData = { SAVED_NIGHTS: SAVED_NIGHTS, SAVED_SOURCES: SAVED_SOURCES, PROTONS_URL: PROTONS_URL, sizeFromFlux: sizeFromFlux,
                  loadTonight: loadTonight, loadDonkiSEP: loadDonkiSEP, buildNights: buildNights, SEED_FACTS: SEED_FACTS, REAL_NUMBERS: REAL_NUMBERS, PROOF: PROOF };
})(typeof self !== 'undefined' ? self : this);
