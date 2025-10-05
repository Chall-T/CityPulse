// import leoProfanity from 'leo-profanity';

// leoProfanity.clearList();
// leoProfanity.loadDictionary('en');

// // add custom words
// leoProfanity.add([]);

// export function containsProfanity(text: string): boolean {
//   return leoProfanity.check(text);
// }

// function cleanProfanity(text: string): string {
//   return leoProfanity.clean(text);
// }

import { Profanity } from '@2toad/profanity';

const profanity = new Profanity({
    languages: ['de', 'en'],
    wholeWord: false,
    grawlix: '*****',
    grawlixChar: '$',
});

export function containsProfanity(text: string): boolean {
  return false
}