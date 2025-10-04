
import type { Category } from '../../types/category';
import config from '../../lib/config'

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


const stockImageUrlPrefix = `${config.apiUrl}/stock`

export const stockImages = (urlPrefix: string): StockImage[] => {
    return [
        {
            url: `${urlPrefix}/food-currywurst-1.webp`,
            tags: [
                "street food",
                "food",
                "currywurst",
                "restaurant",
                "night",
                "sausage",
                "fast food",
                "wurst"
            ],
        },
        {
            url: `${urlPrefix}/food-bbq-1.webp`,
            tags: [
                "street food",
                "food",
                "bbq",
                "barbecue",
                "grill",
                "outdoor",
                "meat",
                "wurst",
                "cooking",
                "grilling"
            ],
        },
        {
            url: `${urlPrefix}/food-burger-1.webp`,
            tags: [
                "street food",
                "food",
                "burger",
                "restaurant",
                "fast food",
                "beef",
                "cheese",
                "bun",
                "outdoor",
                "fries"
            ],
        },
        {
            url: `${urlPrefix}/food-doner-1.webp`,
            tags: [
                "street food",
                "food",
                "doner",
                "restaurant",
                "fast food",
                "meat",
                "bread",
                "doner",
                "döner",
                "kebab",
                "shawarma"
            ],

        },
        {
            url: `${urlPrefix}/cafe-1.webp`,
            tags: [
                "cafe",
                "café",
                "coffee",
                "food",
                "sweet",
                "drink",
                "dessert",
                "morning",
                "breakfast",
                "latte",
            ],
        },
        {
            url: `${urlPrefix}/cafe-3.webp`,
            tags: [
                "cafe",
                "café",
                "coffee",
                "drink",
                "morning",
                "breakfast",
                "latte",
                "espresso",
                "to go",
                "takeaway"
            ],
        },
        {
            url: `${urlPrefix}/cafe-4.webp`,
            tags: [
                "cafe",
                "café",
                "coffee",
                "drink",
                "morning",
                "breakfast",
                "latte",
                "espresso",
                "talking",
                "friends",
                "meeting",
                "people",

            ],
        },
        {
            url: `${urlPrefix}/beer-garden-1.webp`,
            tags: [
                "beer",
                "garden",
                "outdoor",
                "drinks",
                "friends",
                "summer",
                "relaxation",
                "socializing",
                "meeting",
                "party",
                "celebration",
                "nightlife",
                "pub",
                "night"
            ],
        },
        {
            url: `${urlPrefix}/beer-garden-2.webp`,
            tags: [
                "beer",
                "garden",
                "outdoor",
                "drinks",
                "friends",
                "summer",
                "relaxation",
                "socializing",
                "meeting",
                "party",
                "celebration",
                "pub",
            ],
        },
        {
            url: `${urlPrefix}/beer-garden-3.webp`,
            tags: [
                "beer",
                "garden",
                "outdoor",
                "drinks",
                "friends",
                "summer",
                "relaxation",
                "socializing",
            ],
        },
        {
            url: `${urlPrefix}/beer-smoking-1.webp`,
            tags: [
                "beer",
                "outdoor",
                "morning",
                "relaxation",
                "smoking",
                "cigarette",
                "break",
                "chill",
            ],
        },
        {
            url: `${urlPrefix}/beer-fire-1.webp`,
            tags: [
                "beer",
                "fire",
                "outdoor",
                "relaxation",
                "smoking",
                "chill",
                "tempelhof",
                "bbq",
                "barbecue",
                "grill",
                "campfire",
                "bonfire",
                "night",
                "sunset"
            ],
        },
        {
            url: `${urlPrefix}/wine-bar-1.webp`,
            tags: [
                "wine",
                "bar",
                "pub",
                "indoor",
                "drink",
                "red wine",
                "white wine",
                "glass",
                "night",
                "restaurant",
                "celebration",
                "nightlife",
            ],
        },
        {
            url: `${urlPrefix}/wine-bar-2.webp`,
            tags: [
                "bar",
                "pub",
                "wine",
                "indoor",
                "drink",
                "red wine",
                "white wine",
                "glass",
                "night",
                "restaurant",
                "celebration",
                "nightlife",
                "people",
                "friends",
                "meeting",
                "talking",
                "socializing",
            ],
        },
        {
            url: `${urlPrefix}/coctail-bar-1.webp`,
            tags: [
                "bar",
                "pub",
                "cocktail",
                "indoor",
                "drink",
                "glass",

            ]
        },
        {
            url: `${urlPrefix}/coctail-bar-2.webp`,
            tags: [
                "bar",
                "pub",
                "cocktail",
                "indoor",
                "drink",
                "glass",
                "alkohol",
                "night",
                "nightlife",

            ]
        },
        {
            url: `${urlPrefix}/music-party-1.webp`,
            tags: [
                "music",
                "party",
                "concert",
                "festival",
                "dance",
                "dj",
                "crowd",
                "night",
                "lights",
                "people",
                "rave",
                "techno",
                "open air",
            ]
        },
        {
            url: `${urlPrefix}/music-party-2.webp`,
            tags: [
                "music",
                "party",
                "concert",
                "festival",
                "dance",
                "dj",
                "crowd",
                "night",
                "lights",
                "people",
                "rave",
                "techno",
                "open air",
            ]
        },
        {
            url: `${urlPrefix}/music-retro-1.webp`,
            tags: [
                "music",
                "cassette",
                "retro",
                "vintage",
                "tape",
                "old school",
                "analog",
                "recording",
                "mixtape",
                "nostalgia",
            ]
        },
        {
            url: `${urlPrefix}/music-guitar-1.webp`,
            tags: [
                "music",
                "guitar",
                "instrument",
                "strings",
                "musician",
                "playing",
                "chill",
                "relaxation",
                "acoustic",
                "amateur",
                "hobby",
                "practice",
                "song",
            ]
        },
        {
            url: `${urlPrefix}/music-classical-1.webp`,
            tags: [
                "music",
                "classical",
                "instrument",
                "piano",
                "grand piano",
                "strings",
                "musician",
                "playing",
                "relaxation",
            ]
        },
        {
            url: `${urlPrefix}/music-jazz-1.webp`,
            tags: [
                "music",
                "jazz",
                "instrument",
                "saxophone",
                "trumpet",
                "double bass",
                "drums",
                "improvisation",
                "performance",
                "live",
                "night",
                "nightlife",
                "chill"
            ]
        },
        {
            url: `${urlPrefix}/music-karaoke-1.webp`,
            tags: [
                "music",
                "karaoke",
                "singing",
                "performance",
                "microphone",
                "stage",
                "crowd",
                "night",
                "nightlife",
                "entertainment"
            ]
        },
        {
            url: `${urlPrefix}/comedy-standup-1.webp`,
            tags: [
                "comedy",
                "stand-up",
                "performance",
                "microphone",
                "stage",
                "crowd",
                "entertainment"
            ]
        },
        {
            url: `${urlPrefix}/comedy-standup-1.webp`,
            tags: [
                "comedy",
                "stand-up",
                "performance",
                "microphone",
                "stage",
                "crowd",
                "entertainment"
            ]
        },
        {
            url: `${urlPrefix}/gallery-paintings-1.webp`,
            tags: [
                "art",
                "paintings",
                "gallery",
                "exhibition",
                "color",
                "canvas",
                "brush",
                "creative",
                "artist",
                "abstract",
                "museum",
            ]
        },
        {
            url: `${urlPrefix}/gallery-paintings-2.webp`,
            tags: [
                "art",
                "paintings",
                "gallery",
                "exhibition",
                "color",
                "canvas",
                "brush",
                "creative",
                "artist",
                "museum",
                "statue",
                "sculpture",
            ]
        },
        {
            url: `${urlPrefix}/street-art-1.webp`,
            tags: [
                "art",
                "street art",
                "paintings",
                "urban",
                "color",
                "creative",
                "artist",
                "buy"
            ]
        },
        {
            url: `${urlPrefix}/street-art-2.webp`,
            tags: [
                "art",
                "street art",
                "urban",
                "color",
                "creative",
                "artist",
                "graffiti",
                "mural",
                "open air",

            ]
        },
        {
            url: `${urlPrefix}/street-art-3.webp`,
            tags: [
                "art",
                "street art",
                "urban",
                "color",
                "creative",
                "artist",
                "graffiti",
                "mural",
                "open air",
                "wall",
                "berlin wall",
                "east side gallery",

            ]
        },
        {
            url: `${urlPrefix}/diy-workshop-1.webp`,
            tags: [
                "diy",
                "workshop",
                "craft",
                "hands-on",
                "creative",
                "learning",
                "skills",
                "community",
                "art",
                "design",
                "woodwork",
                "woodworking",
                "wood"
            ]
        },
        {
            url: `${urlPrefix}/diy-workshop-2.webp`,
            tags: [
                "diy",
                "workshop",
                "craft",
                "hands-on",
                "creative",
                "learning",
                "skills",
                "community",
                "art",
                "design",
                "knitting",
                "yarn",
                "crochet",
                "sewing",
                "cloth",
                "fabric"
            ]
        },
        {
            url: `${urlPrefix}/diy-workshop-3.webp`,
            tags: [
                "diy",
                "workshop",
                "craft",
                "hands-on",
                "creative",
                "learning",
                "skills",
                "community",
                "art",
                "design",
                "painting",
                "pottery",
                "ceramics",
                "clay",
            ]
        },
        {
            url: `${urlPrefix}/movie-cinema-1.webp`,
            tags: [
                "movie",
                "cinema",
                "film",
                "theater",
                "screen",
                "drama",
                "action",
                "comedy",
                "thriller",
                "blockbuster"
            ]
        },
        {
            url: `${urlPrefix}/movie-friends-1.webp`,
            tags: [
                "movie",
                "film",
                "friends",
                "watching",
                "popcorn",
                "socializing",
            ]
        },
        {
            url: `${urlPrefix}/tempelhof-1.webp`,
            tags: [
                "tempelhof",
                "tempelhof field",
                "tempelhofer Feld"
            ]
        },
        {
            url: `${urlPrefix}/tempelhof-2.webp`,
            tags: [
                "tempelhof",
                "tempelhof field",
                "tempelhofer Feld"
            ]
        },
        {
            url: `${urlPrefix}/biking-relax-1.webp`,
            tags: [
                "biking",
                "relaxation",
                "outdoor",
                "nature",
                "exercise",
                "friends",
            ]
        },
        {
            url: `${urlPrefix}/biking-fast-1.webp`,
            tags: [
                "biking",
                "fast",
                "outdoor",
                "nature",
                "exercise",
                "friends",
            ]
        },
        {
            url: `${urlPrefix}/park-yoga-1.webp`,
            tags: [
                "yoga",
                "park",
                "outdoor",
                "nature",
                "exercise",
                "relaxation",
                "meditation",
            ]
        },
        {
            url: `${urlPrefix}/flea-market-1.webp`,
            tags: [
                "flea market",
                "shopping",
                "local",
                "community",
                "outdoor",
                "vendors",
                "antiques",
                "bargains",
                "clothes",
            ]
        },
        {
            url: `${urlPrefix}/flea-market-2.webp`,
            tags: [
                "flea market",
                "shopping",
                "local",
                "community",
                "outdoor",
                "vendors",
                "antiques",
                "bargains",
                "cameras",
            ]
        },
        {
            url: `${urlPrefix}/club-1.webp`,
            tags: [
                "club",
                "nightlife",
                "music",
                "dancing",
                "friends",
                "party",
                "techno",
                "dj",
                "lights",
            ]
        },
        {
            url: `${urlPrefix}/club-small-1.webp`,
            tags: [
                "club",
                "nightlife",
                "music",
                "dancing",
                "friends",
                "party",
                "bar",
                "pub",
                "festival",

            ]
        },
        {
            url: `${urlPrefix}/club-festival-1.webp`,
            tags: [
                "club",
                "nightlife",
                "music",
                "dancing",
                "friends",
                "party",
                "bar",
                "pub",
                "festival",

            ]
        },
        {
            url: `${urlPrefix}/club-techno-1.webp`,
            tags: [
                "club",
                "nightlife",
                "music",
                "dancing",
                "friends",
                "party",
                "techno",
                "dj",
                "lights",
                "rave"
            ]
        },
        {
            url: `${urlPrefix}/club-tresor-1.webp`,
            tags: [
                "club",
                "nightlife",
                "tresor",
                "techno",
                "hard techno",
                "underground",
            ]
        },
        {
            url: `${urlPrefix}/club-sisyphos-1.webp`,
            tags: [
                "sisyphos"
            ]
        },
        {
            url: `${urlPrefix}/club-underground-1.webp`,
            tags: [
                "underground",
                "club",
                "nightlife",
                "music",
                "dancing",
                "rave",
                "techno",
                "hard techno",
            ]
        },
        {
            url: `${urlPrefix}/club-underground-2.webp`,
            tags: [
                "underground",
                "club",
                "nightlife",
                "music",
                "dancing",
                "rave",
                "techno",
                "hard techno",
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
            ]
        },
        {
            url: `${urlPrefix}/-1.webp`,
            tags: [
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
    // Split category names into individual words
    const searchTerms = categories
        .flatMap(c => c.name.toLowerCase().split(/\s+/));

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

        let matchedDirectly = false;
        for (const searchWord of searchQuery.toLowerCase().split(/\s+/)) {
            if (img.tags.includes(searchWord)) {
                matches.direct.push(img.url);
                seenUrls.add(img.url);
                matchedDirectly = true;
                break;
            }
        }
        if (matchedDirectly) continue;

        const matchCount = searchTerms.reduce(
            (count, term) => count + (img.tags.includes(term) ? 1 : 0),
            0
        );

        if (matchCount >= 4) {
            matches.match4.push(img.url);
        } else if (matchCount === 3) {
            matches.match3.push(img.url);
        } else if (matchCount === 2) {
            matches.match2.push(img.url);
        } else if (matchCount === 1) {
            matches.match1.push(img.url);
        }
    }
    
    let allImages = [
        ...shuffle(matches.direct, seed),
        ...shuffle(matches.match4, seed),
        ...shuffle(matches.match3, seed),
        ...shuffle(matches.match2, seed),
        ...shuffle(matches.match1, seed),
    ];
    if (allImages.length >= 12){
        allImages = allImages.splice(0, 12)
    }
    return allImages
};