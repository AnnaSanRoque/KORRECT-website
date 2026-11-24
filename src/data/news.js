// News articles shown on the Home page and the News page.
// To add an article, copy one object, give it a new unique `slug`, and put it at the top.
// image: put the picture in  public/news/  and write its path here (for example '/news/update-v103.jpg').
//        Leave it out, or if the file is missing, a drawn icon is shown instead.
// body blocks: { type: 'p' | 'h' | 'list', text | items }

export const NEWS_CATEGORIES = ['All', 'Updates', 'Guides', 'Announcements'];

export const NEWS = [
  {
    slug: 'korrect-v1-0-3-now-available',
    image: '/news/update-v103.png',
    category: 'Updates',
    date: '2026-11-14',
    readTime: '2 min read',
    motif: 'download',
    title: 'KORRECT v1.0.3 is now available',
    summary:
      'The latest build of the KORRECT simulation can be downloaded from this website by any registered rider.',
    body: [
      { type: 'p', text: 'Version 1.0.3 of the KORRECT mobile simulation is now available for Android. Registered riders can download it straight from the website after signing in.' },
      { type: 'h', text: 'What is new?' },
      { type: 'list', items: [
        'New NPC looks and cars to make the simulation more realistic.',
        'Interact button removed and changed with a more intuitive interface.',
        'Better Tutorial levels to help new riders learn the basics of safe riding.',
        'New missions and challenges to test your skills and improve your riding.',
        'Improved Main Menu, UI and added new SFX to make the game more immersive.'
      ] },
      { type: 'p', text: 'Your progress, stars and records are tied to your account, so signing in with the same account keeps everything in one place.' },
    ],
  },
  {
    slug: 'rider-ranks-explained',
    image: '/news/rider-ranks.jpg',
    category: 'Updates',
    date: '2026-10-24',
    readTime: '2 min read',
    motif: 'rank',
    title: 'Rider Ranks: show how far you have come',
    summary: 'Collect stars from every mission and climb from Learner to the top of the leaderboard.',
    body: [
      { type: 'p', text: 'Every mission you finish awards stars based on how cleanly you rode. Those stars add up to your Rider Rank, which is shown on your account and on the leaderboard.' },
      { type: 'p', text: 'Ranks are not about speed. A calm, rule-abiding run will always beat a fast, reckless one, because violations cost you points and points decide your stars.' },
      { type: 'h', text: 'Tips for ranking up' },
      { type: 'list', items: [
        'Replay missions to improve your best star rating.',
        'Read the feedback at the end of each run. It tells you exactly where points were lost.',
        'Focus on a clean run first, then on a faster one.',
      ] },
    ],
  },
  {
    slug: 'violations-explained',
    image: '/news/violations.png',
    category: 'Guides',
    date: '2026-10-15',
    readTime: '3 min read',
    motif: 'warning',
    title: 'Violations explained: what costs you points',
    summary: 'Overspeeding, counterflowing and illegal overtaking are some of the habits KORRECT teaches you to spot.',
    body: [
      { type: 'p', text: 'KORRECT tracks unsafe riding behaviors during every mission. Each violation reduces your points, and every violation is recorded so you can review it later in your account stats.' },
      { type: 'h', text: 'Violations' },
      { type: 'list', items: [
        'Counterflow: riding against the direction of traffic.',
        'Illegal overtaking: passing where it is not allowed or not safe.',
        'Improper lane change: changing lanes without signaling or ensuring it is safe to do so.',
        'Sidewalk driving: riding on sidewalks or pedestrian walkways.',
        'Beating the red light: entering an intersection after the traffic signal has turned red.',
        'Speeding: riding faster than the posted limit for the road.',
        'Reckless driving: operating a vehicle with willful disregard for the safety of persons or property.',
        'Incorrect headlight usage: failing to use headlights when required or using high beams improperly.',
        'Improper helmet: riding without a standard, properly fastened protective helmet.',
        'Improper footwear: operating a motorcycle without closed-toe, protective footwear.'
      ] },
      { type: 'p', text: 'The goal is not to memorize a list. It is to build the habit of checking your speed, your lane and your surroundings before you act.' },
    ],
  },
  {
    slug: 'time-and-traffic-conditions',
    image: '/news/weather.jpg',
    category: 'Updates',
    date: '2026-10-06',
    readTime: '2 min read',
    motif: 'time',
    title: 'Changing time and traffic conditions',
    summary: 'Missions now include dynamic time and traffic scenarios so you can practice adjusting how you ride.',
    body: [
      { type: 'p', text: 'Real roads are never the same twice. KORRECT missions include dynamic time and traffic scenarios that ask you to adapt, slow down and ride defensively.' },
      { type: 'p', text: 'Different times of day, reduces visibility specially at night and heavier traffic all change what a safe ride looks like. Practice them here, in a controlled virtual environment, before you meet them for real.' },
    ],
  },
  {
    slug: 'new-version-1-0-4-released',
    image: '/news/weatherver1.0.4.jpg',
    category: 'Updates',
    date: '2026-11-24',
    readTime: '2 min read',
    motif: 'download',
    title: 'Newest Version 1.0.4 Released',
    summary: 'The latest build of the KORRECT simulation can be downloaded from this website by any registered rider.',
    body: [
      { type: 'p', text: 'The newest version of KORRECT includes several improvements and bug fixes.' },
      { type: 'p', text: 'Different levels, each with unique challenges and environments to test your riding skills.' },
    ],
  },
];

export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });