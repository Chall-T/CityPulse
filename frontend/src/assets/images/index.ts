
import type { Category } from '../../types/category';


export enum ImageTag {
    Music = 'music',
    Concert = 'concert',
    Art = 'art',
    Exhibition = 'exhibition',
    Food = 'food',
    Restaurant = 'restaurant',
    Cooking = 'cooking',
    Sports = 'sports',
    Stadium = 'stadium',
    Basketball = 'basketball',
}

export interface StockImage {
    url: string;
    tags: string[];
}


const stockImageUrlPrefix = "/src/assets/images/stock"

export const stockImages = (urlPrefix: string): StockImage[] => {
    return [
        {
            url: `${urlPrefix}/art-paper-1.jpg`,
            tags: [
                "texture",
                "art",
                "pattern",
                "new york",
                "wall",
                "color",
                "poster",
                "typography",
                "posters",
                "flyer",
                "broadway",
                "tear",
                "torn",
                "ripped",
                "wallpaper",
                "background",
                "abstract",
                "city",
                "aesthetic",
                "paper"
            ],
        },
        {
            url: `${urlPrefix}/art-paint-1.jpg`,
            tags: [
                "art",
                "color",
                "paint",
                "colour",
                "canvas",
                "brush",
                "art supplies",
                "paintbrush",
                "brushes",
                "background",
                "food",
                "painting",
                "website",
                "blog",
                "creative",
                "candy",
                "sweets",
                "arts",
                "confectionery"
            ],
        },
        {
            url: `${urlPrefix}/art-paint-2.jpg`,
            tags: [
                "background",
                "art",
                "space",
                "white",
                "white background",
                "glass",
                "artist",
                "tools",
                "jar",
                "create",
                "brush",
                "paintbrush",
                "paint brushes",
                "white space",
                "many",
                "brushes",
                "supplies",
                "art brushes",
                "work",
                "painting"
            ],
        },
        {
            url: `${urlPrefix}/art-paint-3.jpg`,
            tags: [
                "wallpaper",
                "background",
                "abstract",
                "texture",
                "modern art",
                "wall art",
                "abstract painting",
                "contemporary art",
                "acrylic paint",
                "vibrant color",
                "expressionism",
                "art",
                "painting",
                "canvas"
            ],
        },
        {
            url: `${urlPrefix}/art-colours-1.jpg`,
            tags: [
                "art",
                "diversity",
                "modern art",
                "graphics",
                "rug"
            ],
        },
        {
            url: `${urlPrefix}/art-person-1.jpg`,
            tags: [
                "background",
                "city",
                "art",
                "urban",
                "graffiti",
                "bright",
                "mural",
                "living",
                "spray",
                "vivid",
                "wallart",
                "human",
                "painting",
                "wall",
                "street",
                "drawing",
                "modern art",
                "sketch"
            ],
        },
        {
            url: `${urlPrefix}/art-digital-1.jpg`,
            tags: [
                "wallpaper",
                "abstract",
                "minimalist",
                "render",
                "minimalism",
                "simple",
                "minimal background",
                "simple wallpaper",
                "simple background",
                "asthetic",
                "planes",
                "3d art",
                "minimal art",
                "hdr",
                "rendering",
                "minimalisitc",
                "background",
                "art",
                "desktop",
                "gold"
            ],
        },
        {
            url: `${urlPrefix}/art-paint-4.jpg`,
            tags: [
                "wallpaper",
                "background",
                "abstract",
                "texture",
                "art",
                "painting",
                "design",
                "color",
                "paint",
                "colour",
                "modern art",
                "wall art",
                "abstract painting",
                "contemporary art",
                "acrylic",
                "acrylic paint",
                "contemporary",
                "vibrant color",
                "expressionism",
                "poster"
            ],
        },
        {
            url: `${urlPrefix}/dance-1.jpg`,
            tags: [
                "city",
                "girl",
                "night",
                "beauty",
                "street",
                "urban",
                "dance",
                "lights",
                "downtown",
                "human",
                "people",
                "united states",
                "ballet",
                "pub",
                "ballerina",
                "austin",
                "bar counter",
                "dance pose",
                "performer",
                "leisure activities"
            ],
        },
        {
            url: `${urlPrefix}/dance-group-1.jpg`,
            tags: [
                "human",
                "people",
                "grey",
                "dance",
                "philippines",
                "stage",
                "dance pose",
                "leisure activities",
                "cagayan de oro"
            ],
        },
        {
            url: `${urlPrefix}/gaming-room-1.jpg`,
            tags: [
                "wallpaper",
                "background",
                "dark",
                "autumn",
                "night",
                "light",
                "gaming",
                "street",
                "game",
                "neon",
                "retro",
                "machine",
                "games",
                "lightroom",
                "lights",
                "winner",
                "arcade",
                "aesthetic",
                "cyberpunk",
                "united kingdom"
            ],
        },
        {
            url: `${urlPrefix}/gaming-1.jpg`,
            tags: [
                "computer",
                "gaming",
                "game",
                "games",
                "screen",
                "challenge",
                "headphone",
                "gamer",
                "esports",
                "computer class",
                "gamers",
                "convention",
                "esport",
                "videogame",
                "videogames",
                "overwatch",
                "tournament",
                "human",
                "blue",
                "crowd"
            ],
        },
        {
            url: `${urlPrefix}/gaming-retro-1.jpg`,
            tags: [
                "computer",
                "retro",
                "computers",
                "gameboy",
                "videogame",
                "videogames",
                "game boy",
                "commodore 64",
                "retrogaming",
                "commodore",
                "wallpaper",
                "background",
                "technology",
                "aesthetic",
                "tech",
                "website",
                "gaming",
                "vintage",
                "cyberpunk",
                "game"
            ],
        },
        {
            url: `${urlPrefix}/health-walk-1.jpg`,
            tags: [
                "forest",
                "girl",
                "road",
                "autumn",
                "sun",
                "fall",
                "female",
                "grass",
                "running",
                "trees",
                "walking",
                "sunlight",
                "lady",
                "countryside",
                "runner",
                "back",
                "solitude",
                "golden leaves",
                "woman",
                "human"
            ],
        },
        {
            url: `${urlPrefix}/health-food-1.jpg`,
            tags: [
                "woman",
                "man",
                "sunset",
                "summer",
                "female",
                "friends",
                "male",
                "group",
                "outdoors",
                "friendship",
                "hug",
                "golden hour",
                "horizontal",
                "sunglass",
                "young adults",
                "standing",
                "warmth",
                "bonding",
                "backlit",
                "background"
            ],
        },
        {
            url: `${urlPrefix}/health-hike-1.jpg`,
            tags: [
                "woman",
                "man",
                "sunset",
                "summer",
                "female",
                "friends",
                "male",
                "group",
                "outdoors",
                "friendship",
                "hug",
                "golden hour",
                "horizontal",
                "sunglass",
                "young adults",
                "standing",
                "warmth",
                "bonding",
                "backlit",
                "background"
            ]
        },
        {
            url: `${urlPrefix}/music-dj-1.jpg`,
            tags: [
                "music",
                "purple",
                "hand",
                "electronic",
                "dance",
                "colors",
                "lights",
                "sound",
                "vibrant",
                "equipment",
                "switch",
                "hear",
                "spin",
                "dial",
                "switches",
                "disc jockey",
                "dials",
                "deejay",
                "background",
                "human"
            ]
        },
        {
            url: `${urlPrefix}/music-classic-1.jpg`,
            tags: [
                "music",
                "book",
                "paper",
                "grey",
                "writing",
                "inspiration",
                "indoor",
                "notes",
                "macro",
                "score",
                "notation",
                "website"
            ]
        },
        {
            url: `${urlPrefix}/music-retro-1.jpg`,
            tags: [
                "music",
                "retro",
                "new",
                "style",
                "old",
                "sound",
                "band",
                "audio",
                "voice",
                "tape",
                "blank",
                "cassette",
                "recording",
                "player",
                "analogue",
                "soundtrack",
                "wallpaper",
                "background",
                "technology",
                "art"
            ]
        },
        {
            url: `${urlPrefix}/music-sing-1.jpg`,
            tags: [
                "wallpaper",
                "man",
                "music",
                "stars",
                "concert",
                "microphone",
                "festival",
                "artist",
                "stage",
                "music background",
                "lights",
                "singer",
                "performance",
                "band",
                "song",
                "sing",
                "show",
                "perform",
                "music wallpapers",
                "people"
            ]
        },
        {
            url: `${urlPrefix}/networking-big-1.jpg`,
            tags: [
                "people",
                "school",
                "product",
                "event",
                "conference",
                "group",
                "crowd",
                "networking",
                "talking",
                "audience",
                "trade show",
                "booth",
                "sky view",
                "large crowd",
                "adult school",
                "adult student",
                "big group",
                "booths",
                "human",
                "grey"
            ]
        },
        {
            url: `${urlPrefix}/networking-small-1.jpg`,
            tags: [
                "business",
                "technology",
                "laptop",
                "team",
                "meeting",
                "friends",
                "classroom",
                "students",
                "smile",
                "communication",
                "collaboration",
                "diversity",
                "worker",
                "people working",
                "tablet",
                "laugh",
                "group discussion",
                "group project",
                "international school",
                "milennial"
            ]
        },
    ];
}

function createSeededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return () => {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash); // Returns value between 0 and 1
  };
}

const shuffle = <T>(array: T[], seed?: string): T[] => {
  const shuffledArray = [...array];
  
  if (seed) {
    const seededRandom = createSeededRandom(seed);
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
  } else {
    shuffledArray.sort(() => Math.random() - 0.5);
  }
  
  return shuffledArray;
};

export const searchStockImages = (
  searchQuery: string,
  categories: Category[],
  seed?: string,
): string[] => {
  const searchTerms = categories.map((c) => c.name.toLowerCase())
  const seenUrls = new Set<string>();

  const matches: {
    direct: string[];
    match4: string[];
    match3: string[];
    match2: string[];
    match1: string[];
  } = {
    direct: [],
    match4: [],
    match3: [],
    match2: [],
    match1: [],
  };

  for (const img of stockImages(stockImageUrlPrefix)) {
    if (seenUrls.has(img.url)) continue;

    for (const searchWord of searchQuery.toLowerCase().split(/\s+/)) {
        if (img.tags.includes(searchWord)) {
            matches.direct.push(img.url);
            seenUrls.add(img.url);
            continue;
        }
    }

    const matchCount = searchTerms.reduce(
      (count, term) => count + (img.tags.includes(term) ? 1 : 0),
      0
    );

    if (matchCount >= 4) {
      matches.match4.push(img.url);
      seenUrls.add(img.url);
    } else if (matchCount === 3) {
      matches.match3.push(img.url);
      seenUrls.add(img.url);
    } else if (matchCount === 2) {
      matches.match2.push(img.url);
      seenUrls.add(img.url);
    } else if (matchCount === 1) {
      matches.match1.push(img.url);
      seenUrls.add(img.url);
    }
  }

  return [
    ...shuffle(matches.direct, seed),
    ...shuffle(matches.match4, seed),
    ...shuffle(matches.match3, seed),
    ...shuffle(matches.match2, seed),
    ...shuffle(matches.match1, seed),
  ];
};