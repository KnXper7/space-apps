/* Moon Detective: Night Shift — game rules (no DOM). Works in the browser and in node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Beeps = rays that get into a room, counted in a simple way (not measured doses). Index = Moon-dirt bags on the roof (0-4).
  var COSMIC = [4, 3, 3, 2, 2];     // always-there rays: dirt helps a little
  var STORM_MULT = [3, 2, 1, 0, 0]; // sun-storm rays: dirt helps a LOT
  var MAX_DIRT = 4, DAYS = 7, POWER_PER_DAY = 3, POWER_CAP = 5, AIR_PER_NIGHT = 2, MAX_TRAYS = 6, TRAYS_PER_ROOM = 2;

  var LEVELS = {
    easy:   { label: 'Easy',   hearts: 6, air: 10, readings: 'always', hints: true },
    normal: { label: 'Medium', hearts: 5, air: 9,  readings: 'day',    hints: true },
    hard:   { label: 'Hard',   hearts: 5, air: 8,  readings: 'fade',   hints: false }
  };

  var TOOLS = {
    beep:  { name: 'Beep-o-meter',   power: 1, air: 0, unlockDay: 1 },
    bag:   { name: 'Moon-dirt bag',  power: 1, air: 1, unlockDay: 1 },
    plant: { name: 'Seeds',          power: 1, air: 0, unlockDay: 2 }
  };

  // Storm size per night comes from data.js: the real NOAA radiation-storm scale (0 none, 1 = S1, 2 = S2, 3 = S3+).
  function classToSize(cls) {
    var c = (cls || '').charAt(0).toUpperCase();
    return c === 'X' ? 3 : c === 'M' ? 2 : c === 'C' ? 1 : 0;
  }
  function nightLevel(dirt, flareSize) {
    var d = Math.max(0, Math.min(MAX_DIRT, dirt));
    return COSMIC[d] + flareSize * STORM_MULT[d];
  }
  function face(units) { return units <= 3 ? 'safe' : units <= 7 ? 'careful' : 'ouch'; }

  function shuffle(a, rng) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function newGame(opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var lv = LEVELS[opts.level] ? opts.level : 'normal';
    // One room starts with NO dirt (where the seeds died). Which room, and how much dirt the others have, changes every game.
    var bare = Math.floor(rng() * 3);
    var dirt = [0, 1, 2].map(function (i) { return i === bare ? 0 : 1 + Math.floor(rng() * 3); });
    return {
      level: lv, day: 1, phase: 'day',
      power: POWER_PER_DAY, air: LEVELS[lv].air, airMax: 10, hearts: LEVELS[lv].hearts,
      rooms: ['A', 'B', 'C'].map(function (id, i) { return { id: id, dirt: dirt[i], startDirt: dirt[i], bags: 0 }; }),
      flares: (opts.flares || []).slice(0, DAYS),
      trays: [], nights: [], toolsUsed: 0, bagToday: false, lensToday: false
    };
  }

  function room(s, id) { for (var i = 0; i < s.rooms.length; i++) if (s.rooms[i].id === id) return s.rooms[i]; return null; }
  function flareTonight(s) { var f = s.flares[s.day - 1]; return f ? f.size : 0; }
  function liveTrays(s) { return s.trays; } // plants never die in a night: rays slow them down, a safe night lets them recover

  function canUse(s, tool, roomId) {
    var t = TOOLS[tool];
    if (!t) return { ok: false, why: 'No such tool.' };
    if (s.phase !== 'day') return { ok: false, why: 'Not right now.' };
    if (s.day < t.unlockDay) return { ok: false, code: 'locked', why: 'This unlocks on Day ' + t.unlockDay + '.' };
    if (s.power < t.power) return { ok: false, code: 'power', why: 'Not enough power cells. Time for bed?' };
    if (s.air < t.air) return { ok: false, code: 'air', why: 'Not enough air to go outside.' };
    if (tool === 'lens' && s.lensToday) return { ok: false, code: 'lensOn', why: 'The Lens is already on today.' };
    if (tool === 'bag') {
      if (s.bagToday) return { ok: false, code: 'bagDay', why: 'The digger robot is charging. One bag a day!' };
      if (roomId && room(s, roomId).dirt >= MAX_DIRT) return { ok: false, code: 'roofFull', why: 'That roof is full.' };
    }
    if (tool === 'plant' && liveTrays(s).length >= MAX_TRAYS) return { ok: false, code: 'trays', why: 'All seed trays are in use.' };
    if (tool === 'plant' && roomId && liveTrays(s).filter(function (t) { return t.room === roomId; }).length >= TRAYS_PER_ROOM) return { ok: false, code: 'roomTrays', why: 'That room already has two trays.' };
    return { ok: true };
  }
  function pay(s, tool) { s.power -= TOOLS[tool].power; s.air -= TOOLS[tool].air; s.toolsUsed++; }

  function beep(s, roomId) {
    var c = canUse(s, 'beep', roomId); if (!c.ok) return c;
    pay(s, 'beep');
    var u = nightLevel(room(s, roomId).dirt, 0);
    return { ok: true, kind: 'beep', day: s.day, room: roomId, units: u, face: face(u) };
  }
  function lensReadings(s) {
    var f = flareTonight(s);
    return s.rooms.map(function (r) {
      var u = nightLevel(r.dirt, f);
      return { kind: 'lens', day: s.day, room: r.id, units: u, face: face(u) };
    });
  }
  function lens(s) {
    var c = canUse(s, 'lens'); if (!c.ok) return c;
    pay(s, 'lens'); s.lensToday = true;
    return { ok: true, kind: 'lens', readings: lensReadings(s) };
  }
  function bag(s, roomId) {
    var c = canUse(s, 'bag', roomId); if (!c.ok) return c;
    pay(s, 'bag'); s.bagToday = true;
    var r = room(s, roomId); r.dirt++; r.bags++;
    return { ok: true, kind: 'bag', room: roomId };
  }
  function plant(s, roomId) {
    var c = canUse(s, 'plant', roomId); if (!c.ok) return c;
    pay(s, 'plant');
    s.trays.push({ room: roomId, plantedDay: s.day, state: 'sprout' });
    return { ok: true, kind: 'plant', room: roomId };
  }

  // shelterId (optional): when the storm alarm goes, you may run to another room. The run costs 1 air (airlock).
  function sleep(s, roomId, shelterId) {
    if (s.phase !== 'day') return { ok: false, why: 'Not right now.' };
    var dashed = !!shelterId && shelterId !== roomId && s.air >= 1;
    if (dashed) s.air -= 1;
    var f = flareTonight(s), r = room(s, dashed ? shelterId : roomId);
    var u = nightLevel(r.dirt, f), fc = face(u), lost = 0;
    var res = { ok: true, kind: 'night', day: s.day, room: r.id, slept: roomId, dashed: dashed, units: u, face: fc, flare: f, base: nightLevel(r.dirt, 0), storm: u - nightLevel(r.dirt, 0),
                airShort: false, heartsLost: 0, trays: [], airGain: 0 };
    if (s.air >= AIR_PER_NIGHT) s.air -= AIR_PER_NIGHT; else { s.air = 0; res.airShort = true; lost += 1; }
    lost += fc === 'careful' ? 1 : fc === 'ouch' ? 2 : 0;
    liveTrays(s).forEach(function (t) {
      var tf = face(nightLevel(room(s, t.room).dirt, f));
      t.state = tf === 'safe' ? 'healthy' : tf === 'careful' ? 'droopy' : 'hurt';
      if (t.state === 'healthy') res.airGain++;
      res.trays.push({ room: t.room, state: t.state });
    });
    res.heartsLost = lost;
    s.hearts = Math.max(0, s.hearts - lost);
    s.air = Math.min(s.airMax, s.air + res.airGain);
    s.nights.push(res);
    s.day++; s.bagToday = false; s.lensToday = false;
    if (s.hearts <= 0) s.phase = 'rescued';
    else if (s.day > DAYS) s.phase = 'report';
    else { s.phase = 'day'; s.power = Math.min(POWER_CAP, s.power + POWER_PER_DAY); }
    return res;
  }

  function answerKey(s) {
    var best = Math.max.apply(null, s.rooms.map(function (r) { return r.dirt; }));
    return {
      crewRooms: s.rooms.filter(function (r) { return r.dirt === best; }).map(function (r) { return r.id; }),
      mysteryRoom: s.rooms.filter(function (r) { return r.startDirt === 0; })[0].id,
      why: 'rays'
    };
  }
  // answers: { crewRoom:'A', mysteryRoom:'B', why:'rays'|'cold'|'water'|'poison' }
  function finish(s, answers) {
    var key = answerKey(s);
    var stars = { survived: s.hearts > 0,
                  safest: key.crewRooms.indexOf(answers.crewRoom) >= 0,
                  mystery: answers.mysteryRoom === key.mysteryRoom && answers.why === key.why };
    s.phase = 'end';
    return { stars: stars, count: (stars.survived ? 1 : 0) + (stars.safest ? 1 : 0) + (stars.mystery ? 1 : 0), key: key };
  }

  return { COSMIC: COSMIC, STORM_MULT: STORM_MULT, MAX_DIRT: MAX_DIRT, DAYS: DAYS, POWER_CAP: POWER_CAP,
           POWER_PER_DAY: POWER_PER_DAY, AIR_PER_NIGHT: AIR_PER_NIGHT, MAX_TRAYS: MAX_TRAYS, TRAYS_PER_ROOM: TRAYS_PER_ROOM,
           LEVELS: LEVELS, TOOLS: TOOLS, classToSize: classToSize, nightLevel: nightLevel, face: face,
           newGame: newGame, room: room, flareTonight: flareTonight, liveTrays: liveTrays, canUse: canUse,
           beep: beep, lens: lens, lensReadings: lensReadings, bag: bag, plant: plant, sleep: sleep,
           answerKey: answerKey, finish: finish };
});
