// Portfolio content, unchanged from the live site.

export type Game = { n: string; i?: string; c: string; k: string; tag: [string, string]; d: string; s: string; l: [string, string][] };
export const GAMES: Game[] = [
  { n: "KidSage Colorbook", i: "kidsage-colorbook.jpg", c: "#fbbf24", k: "KC", tag: ["Coloring game", "iOS & Android"], d: "My latest game at DarkMatter: a coloring book for kids in the KidSage series. I built the whole game mechanism and how it all works, and led development.", s: "Unity, C#", l: [["App Store", "https://apps.apple.com/app/kidsage-colorbook/id6775496904"], ["Google Play", "https://play.google.com/store/apps/details?id=com.Darkmatter.Colorbook"]] },
  { n: "KidSage", i: "kidsage.jpg", c: "#5eead4", k: "KS", tag: ["Learning game", "iOS & Android"], d: "A learning game for kids where a friendly yeti, Tashi, helps a village by solving shape and math quests. I built the quest, inventory and shop systems, the animation and sound, and the UI/UX.", s: "Unity, C#, Figma, Miro", l: [["App Store", "https://apps.apple.com/us/app/kidsage/id6736458717"], ["Google Play", "https://play.google.com/store/apps/details?id=com.Darkmatter.kidsage"]] },
  { n: "Spell-Splatter", i: "spell-splatter.jpg", c: "#c084fc", k: "SS", tag: ["Spelling game", "WebGL"], d: "Shoot balloons carrying letters to spell the answer. I came up with the idea and designed the game and its balloon-pop and goo-splat animations.", s: "Unity, C#, WebGL", l: [["Danson games", "https://site.chimpvine.com"]] },
  { n: "Frog Jump", i: "frog-jump.jpg", c: "#4ade80", k: "FJ", tag: ["Learning game", "WebGL"], d: "A web game where you hop a frog onto the leaf with the correct answer. I built the frog movement, animation, sound and a day-night cycle.", s: "Unity, C#, WebGL", l: [["Danson games", "https://site.chimpvine.com"]] },
  { n: "Vidhya's Adventure", c: "#fb923c", k: "VA", tag: ["Farming narrative", "Nepali culture"], d: "A farming game with a narrative about Nepali culture. I developed the farming mechanics and tool interactions.", s: "Unity, C#, Figma", l: [] },
  { n: "Nimble Noggins", c: "#f472b6", k: "NN", tag: ["Toddler mini games", "Mobile"], d: "A toddler-friendly collection of mini games. I made about 8 of them, including drawing, coloring, counting and matching.", s: "Unity, C#, Mobile", l: [["Google Play", "https://play.google.com/store/apps/details?id=com.neodigitalnp.koollearninggames"]] },
  { n: "Ludo Super", c: "#60a5fa", k: "LS", tag: ["Board game", "Android"], d: "Digital Ludo with pawn pathing, dice rolling and animation, a random number generator and board selection menus.", s: "Unity, C#, Android", l: [["Google Play", "https://play.google.com/store/apps/details?id=com.neodigitalnp.ludoonline"]] },
  { n: "2 Player Football", c: "#86efac", k: "2P", tag: ["Local multiplayer", "Android"], d: "A quick local two-player football game for mobile.", s: "Unity, C#, Android", l: [["Google Play", "https://play.google.com/store/apps/details?id=com.neodigitalnp.minifootball"]] },
  { n: "Super World Saga", i: "super-world-saga.jpg", c: "#ffb703", k: "SW", tag: ["Platform runner", "Android"], d: "A free platform runner with a jetpack twist. My first published game: gameplay, game design, level design and testing.", s: "Unity, C#, Android", l: [["Full playthrough on YouTube", "https://www.youtube.com/watch?v=6bCW7ueh8qU"]] },
  { n: "Rally Racer", c: "#f87171", k: "RR", tag: ["Racing prototype", "Open source"], d: "A racing game prototype with source code on GitHub.", s: "Unity, C#", l: [["Source on GitHub", "https://github.com/shrayash1/Rally-Racer"]] },
  { n: "Bot Runner", c: "#94a3b8", k: "BR", tag: ["Endless runner", "Desktop build"], d: "An endless runner you can try as a downloadable build.", s: "Unity, C#", l: [["Download build", "https://drive.google.com/file/d/1W56Yp-u8T3AsY9tYaU-vVLTNzuc3iCVC/view?usp=sharing"]] },
];

export type Art = { f: string; t: string; k: string; u: string; a: string };
export const ART: Art[] = [
  { f: "art-04.jpg", t: "Leather jacket portrait", k: "Digital art", u: "p/CE9D_GqATIV/", a: "Vector-style digital portrait of a woman with dark hair in a black leather jacket, against a background of printed text" },
  { f: "art-09.jpg", t: "Krishna in watercolour", k: "Paintings", u: "p/CBQXbGznids/", a: "Watercolour painting of Lord Krishna in blue with a golden peacock-feather turban, playing a bamboo flute" },
  { f: "art-10.jpg", t: "Denim & bandana", k: "Digital art", u: "p/CApOpwkgy0g/", a: "Vector portrait of a woman in a denim jacket and blue bandana holding a glass, over a chalk-doodle background" },
  { f: "art-06.jpg", t: "Buddha at sunset", k: "Paintings", u: "p/CEeHg9unQx5/", a: "Painting on wooden planks of a seated Buddha silhouette against a glowing orange sun on a deep red background" },
  { f: "art-11.jpg", t: "Shearling jacket portrait", k: "Digital art", u: "p/CAQBJpLj4Mg/", a: "Vector portrait of a man in round sunglasses and a brown shearling jacket on a turquoise background with orange swirls" },
  { f: "art-03.jpg", t: "Sunset elephants", k: "Painted decor", u: "p/CGHZDoUHZQM/", a: "Hand-painted plate showing an elephant and its calf in silhouette against a red and yellow sunset" },
  { f: "art-12.jpg", t: "Aviators portrait", k: "Digital art", u: "p/CAMtgdrjEgc/", a: "Vector portrait of a man in aviator sunglasses and a pink shirt on a yellow and blue striped background" },
  { f: "art-01.jpg", t: "Happy Janmashtami", k: "Digital art", u: "reel/DNer_BFOPpF/", a: "Digital illustration of Lord Krishna with a peacock-feather crown and flute, with Happy Krishna Janmashtami lettering" },
  { f: "art-05.jpg", t: "Mickey & Minnie bottles", k: "Painted decor", u: "p/CEg_6WPHIjG/", a: "Two glass bottles hand-painted as Minnie Mouse with a polka-dot bow and Mickey Mouse with ears and buttons" },
  { f: "art-02.jpg", t: "Floral plate", k: "Painted decor", u: "p/CGHk6qtH-Z8/", a: "Bright blue hand-painted plate decorated with pink flowers and leaves" },
  { f: "art-07.jpg", t: "Love is life", k: "Painted decor", u: "p/CEeGYwEHC_1/", a: "Yellow hand-painted wooden wall hanging with hummingbirds and branches above a small sign reading Love is life" },
  { f: "art-08.jpg", t: "Krishna sketch", k: "Sketches", u: "reel/CBQnAVAgQHD/", a: "Pencil sketch in progress of Lord Krishna playing the flute" },
];
export const ART_KINDS = ["All", "Digital art", "Paintings", "Painted decor", "Sketches"];

// [label, background, text colour, shape, x %, y %, rotation]
export const STACK: [string, string, string, string, number, number, number][] = [
  ["Unity", "#111", "#fff", "", 18, 24, -8], ["C#", "#8b5cf6", "#fff", "circle", 40, 20, 6], ["Unreal", "#0f172a", "#fff", "round", 70, 22, -4],
  ["C++", "#2563eb", "#fff", "circle", 86, 46, 10], ["Java", "#f59e0b", "#1a1a1a", "", 16, 56, 5], ["Python", "#facc15", "#1d4ed8", "round", 36, 74, -6],
  ["Photon", "#ef4444", "#fff", "", 62, 80, 8], ["Netcode", "#10b981", "#04201b", "round", 84, 78, -10], ["WebGL", "#e2553d", "#fff", "", 30, 42, 3],
  ["Figma", "#f472b6", "#1a1a1a", "circle", 66, 50, -7], ["Miro", "#ffd02f", "#1a1a1a", "round", 50, 30, 12], ["GitHub", "#1e2233", "#fff", "", 12, 86, -3], ["Trello", "#0ea5e9", "#fff", "round", 88, 14, 5],
];
