// The crew, the jobs and the things the crew can discover. Facts here are checked against NASA pages (see the "Mission Facts" sheet).

export const CREW = [
  { id: 'sci', name: 'Lily', role: 'Scientist', ico: 'flask', col: 0xa6f0cf, jobs: ['beep', 'rock'] },
  { id: 'eng', name: 'Omar', role: 'Engineer', ico: 'wrench', col: 0x7ec8ff, jobs: ['bag', 'plant'] },
  { id: 'pil', name: 'Jun', role: 'Pilot', ico: 'airplane-tilt', col: 0xffa94d, jobs: ['quake'] }
];
export const JOB: Record<string, string> = { beep: 'sci', rock: 'sci', bag: 'eng', plant: 'eng', quake: 'pil' };
export const crewById = (id: string) => CREW.find((c) => c.id === id)!;

// seen = NASA already knows this (Apollo, LCROSS...). study = NASA is still working it out.
export interface Disco { id: string; name: string; term: string; ic: string; tag: 'seen' | 'study'; fact: string; src: string; url: string }
export const DISCO: Disco[] = [
  { id: 'hi1', name: 'Light rock', term: 'Anorthosite', ic: 'mountains', tag: 'seen', fact: 'Pale rock from the Moon’s first crust. The oldest highland rocks are over 4 billion years old.', src: 'Apollo samples, Open University Virtual Microscope', url: 'https://www.virtualmicroscope.org/content/apollo-17' },
  { id: 'hi2', name: 'Crash rock', term: 'Breccia', ic: 'cube', tag: 'seen', fact: 'Broken bits of older rock, welded together when space rocks crashed into the Moon.', src: 'Apollo 14 samples, Open University Virtual Microscope', url: 'https://virtualmicroscope.org/content/apollo-14' },
  { id: 'ma1', name: 'Dark rock', term: 'Basalt', ic: 'fire', tag: 'seen', fact: 'Rock from old lava. The dark plains you see from Earth are filled with it.', src: 'Apollo samples, Open University Virtual Microscope', url: 'https://www.virtualmicroscope.org/content/apollo-17' },
  { id: 'ma2', name: 'Moon dust', term: 'Regolith', ic: 'stack', tag: 'seen', fact: 'Crushed rock and dust cover the Moon. It is what we pile on roofs.', src: 'Apollo 12 samples, Open University Virtual Microscope', url: 'https://virtualmicroscope.org/content/apollo-12' },
  { id: 'cr1', name: 'Ice', term: 'Water ice', ic: 'snowflake', tag: 'study', fact: 'NASA’s LCROSS found water in a dark south pole crater in 2009. How much, and where, is still being studied.', src: 'NASA LCROSS', url: 'https://science.nasa.gov/mission/lcross/' },
  { id: 'cr2', name: 'Frozen gases', term: 'Volatiles', ic: 'drop', tag: 'study', fact: 'Dark craters are cold enough to trap other frozen gases too. NASA is still studying them.', src: 'NASA JPL on LRO and LCROSS', url: 'https://www.jpl.nasa.gov/news/lunar-impact-may-impact-lunar-science-for-years-to-come/' },
  { id: 'q1', name: 'Moonquake', term: 'Moonquake', ic: 'waveform', tag: 'seen', fact: 'Apollo sensors left on the Moon felt moonquakes. Earth’s pull helps cause them.', src: 'Astronomy: Apollo science packages', url: 'https://www.astronomy.com/space-exploration/what-did-the-apollo-astronauts-leave-behind/' },
  { id: 'q2', name: 'Moon bell', term: 'Ringing', ic: 'speaker-high', tag: 'seen', fact: 'When NASA crashed a lander part into the Moon, the Moon rang like a bell for nearly an hour.', src: 'Astronomy: Apollo science packages', url: 'https://www.astronomy.com/space-exploration/what-did-the-apollo-astronauts-leave-behind/' },
  { id: 'q3', name: 'Inside', term: 'Core', ic: 'planet', tag: 'study', fact: 'Apollo data points to a crust, a mantle and a small core. What the inside is really like is still being studied.', src: 'Temblor: Apollo 11 moonquakes', url: 'https://temblor.net/?p=9213' }
];
export const discoById = (id: string) => DISCO.find((d) => d.id === id)!;

// Where Lily can look. Each place gives two finds.
export const SITES = [
  { id: 'hi', name: 'Highlands', ic: 'mountains', col: 0xe9e4d4, finds: ['hi1', 'hi2'] },
  { id: 'ma', name: 'Plains', ic: 'fire', col: 0xb7a58a, finds: ['ma1', 'ma2'] },
  { id: 'cr', name: 'Dark crater', ic: 'snowflake', col: 0x9fd8ff, finds: ['cr1', 'cr2'] }
];
export const QUAKE_FINDS = ['q1', 'q2', 'q3'];
export const SCIENCE_GOAL = 4; // discoveries needed for the science star
