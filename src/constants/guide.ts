import type { Language } from '@/i18n';
import { GUIDE_ARTICLES_ID } from './guide-id';

/**
 * Offline brew guide.
 *
 * The content is written for the two grinders and the one-cup V60 workflow the
 * app supports. Numbers are starting references taken from the sources listed
 * on each article, not universal rules. Keep the wording plain and specific.
 */

export type GuideBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: { label: string; title: string; text: string }[] }
  | { type: 'table'; rows: { label: string; value: string; hint?: string }[] }
  | { type: 'note'; text: string };

export interface GuideSection {
  heading: string;
  blocks: GuideBlock[];
}

export interface GuideSource {
  label: string;
  detail: string;
}

export interface GuideArticle {
  slug: string;
  title: string;
  summary: string;
  sections: GuideSection[];
  sources: GuideSource[];
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: 'v60-basics',
    title: 'V60, step by step',
    summary: 'A repeatable one-cup recipe and the reason behind each stage.',
    sections: [
      {
        heading: 'What the V60 does',
        blocks: [
          {
            type: 'paragraph',
            text: 'The V60 is a cone, a paper filter and gravity. Water passes through the coffee bed once, so grind, pour and filter all shape the cup. It is less forgiving than a French press, but it is easier to repeat once you keep the variables still.',
          },
          {
            type: 'paragraph',
            text: 'Paper catches most oils and fine particles. That is where the clean, defined cup comes from, and why a small change in grind shows up quickly in taste.',
          },
        ],
      },
      {
        heading: 'A reliable starting point',
        blocks: [
          {
            type: 'table',
            rows: [
              { label: 'Coffee', value: '15 g' },
              { label: 'Water', value: '250 g' },
              { label: 'Ratio', value: '1:16.7' },
              {
                label: 'Grind',
                value: 'Medium-fine',
                hint: 'A little finer than table salt. Start there and let taste decide.',
              },
              {
                label: 'Water temperature',
                value: '92 to 96°C',
                hint: 'Hotter for light roasts, cooler for dark roasts.',
              },
              {
                label: 'Total time',
                value: 'About 3:00',
                hint: 'A clue, not a target. A good cup can finish earlier or later.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Brewmate’s calculator starts at 15 g and 240 g (1:16). The 250 g version above is the same method at a slightly wider ratio. Pick one as your baseline and keep it still while you dial in.',
          },
        ],
      },
      {
        heading: 'The pour',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                label: '0:00',
                title: 'Bloom',
                text: 'Pour 50 g, then swirl gently so every ground is wet. Wait until 0:45.',
              },
              {
                label: '0:45',
                title: 'First pour',
                text: 'Pour in slow circles to 100 g.',
              },
              {
                label: '1:10',
                title: 'Second pour',
                text: 'Pour to 150 g.',
              },
              {
                label: '1:30',
                title: 'Third pour',
                text: 'Pour to 200 g.',
              },
              {
                label: '1:50',
                title: 'Final pour',
                text: 'Pour to 250 g, then give the brewer one gentle swirl.',
              },
              {
                label: '2:00',
                title: 'Drawdown',
                text: 'Stop pouring and let the bed drain. Aim for a flat bed and a finish near 3:00.',
              },
            ],
          },
          {
            type: 'note',
            text: 'This structure follows James Hoffmann’s one-cup V60 method. The numbers are a reference, not a rule.',
          },
        ],
      },
      {
        heading: 'Why each stage exists',
        blocks: [
          {
            type: 'bullets',
            items: [
              'The bloom gives trapped carbon dioxide a way out, so water can reach the grounds evenly.',
              'Pulse pours add agitation, then let the bed settle. That is more even than one long pour.',
              'A gentle swirl levels the bed and keeps the water path uniform. Do not stir hard.',
              'A flat bed at the end is a useful sign that the pour was even.',
            ],
          },
        ],
      },
      {
        heading: 'If the cup is not right',
        blocks: [
          {
            type: 'paragraph',
            text: 'Change one thing at a time, starting with grind. Keep dose, water, temperature and pour timing fixed so you can tell what helped.',
          },
          {
            type: 'paragraph',
            text: 'If the cup is sour and thin, grind finer. If it is bitter and drying, grind coarser. The dial-in article has a fuller table.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'James Hoffmann, A Better 1 Cup V60 Technique',
        detail: 'Hario USA recipe notes and the 2022 video walkthrough.',
      },
      {
        label: 'Specialty Coffee Association, Golden Cup Standard',
        detail: 'Brew ratio, strength and extraction reference ranges.',
      },
    ],
  },
  {
    slug: 'dial-in-grind',
    title: 'Dial in the grind',
    summary: 'Use the cup and the drawdown to move the grind in the right direction.',
    sections: [
      {
        heading: 'Keep the baseline still',
        blocks: [
          {
            type: 'paragraph',
            text: 'Grind is the biggest lever you can change at home. Make it the only thing that moves for three brews in a row. Keep dose, water, temperature and pour schedule the same.',
          },
          {
            type: 'bullets',
            items: [
              'Write down the setting, the drawdown time and one word about the taste.',
              'Move one click, not one full rotation.',
              'Taste the cup after it has cooled a little. Very hot coffee hides sweetness and finish.',
            ],
          },
        ],
      },
      {
        heading: 'Read the cup',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Sour, thin, finishes before 2:30',
                value: 'Grind finer',
                hint: 'The water is moving through too quickly to pull enough sweetness.',
              },
              {
                label: 'Balanced, finishes 2:45 to 3:30',
                value: 'Keep the setting',
                hint: 'Time is in a useful place. Let taste decide from here.',
              },
              {
                label: 'Bitter, dry, finishes after 3:45',
                value: 'Grind coarser',
                hint: 'The bed is holding water too long, or there are too many fines.',
              },
              {
                label: 'Sour and bitter at once',
                value: 'Pour gentler first',
                hint: 'This usually points to channeling. Swirl after the bloom, keep the stream off the paper, then adjust grind.',
              },
              {
                label: 'Weak but pleasant',
                value: 'Tighten the ratio',
                hint: 'Strength is a ratio problem, not an extraction problem.',
              },
              {
                label: 'Heavy but pleasant',
                value: 'Widen the ratio',
                hint: 'Add a little water rather than changing the grind.',
              },
            ],
          },
        ],
      },
      {
        heading: 'On your grinder',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Chestnut S5 Pro',
                value: '90 clicks per rotation',
                hint: '15 microns per click. TIMEMORE lists pour-over at 5.0 to 8.0 on the dial.',
              },
              {
                label: 'Chestnut C5 Pro',
                value: '48 clicks per rotation',
                hint: '31 microns per click, 16 macro steps. TIMEMORE does not publish a pour-over range for this model.',
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'A single click on the C5 Pro is roughly twice the burr movement of a click on the S5 Pro. Move one click at a time on either grinder, then taste before moving again.',
          },
          {
            type: 'note',
            text: 'Never copy a click number from one grinder model to another. The two TIMEMORE models do not share a scale.',
          },
        ],
      },
      {
        heading: 'When to stop',
        blocks: [
          {
            type: 'paragraph',
            text: 'Stop when sweetness and finish are balanced for your taste. A cup that finishes at 3:40 and tastes clean is not a problem to fix. The clock is evidence, not a target.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'BaristaPath, How to dial in grind size for pour over',
        detail: 'Baseline method and V60 time windows.',
      },
      {
        label: 'Coffee Brew Guide, V60 recipe and troubleshooting',
        detail: 'Drawdown table and common fixes.',
      },
      {
        label: 'Salford Roasters, V60 troubleshooting without guessing',
        detail: 'The one-change-at-a-time loop.',
      },
      {
        label: 'TIMEMORE, Chestnut S5 Pro product page',
        detail: '90 clicks, 15 microns per click, pour-over reference 5.0 to 8.0.',
      },
    ],
  },
  {
    slug: 'water-and-ratio',
    title: 'Water, ratio and temperature',
    summary: 'What changes strength, what changes extraction, and what to leave alone.',
    sections: [
      {
        heading: 'Ratio sets strength',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ratio is coffee to water by weight. A tighter ratio such as 1:15 tastes heavier. A wider ratio such as 1:17 tastes lighter. It changes concentration more than it changes extraction.',
          },
          {
            type: 'table',
            rows: [
              { label: 'Typical V60 range', value: '1:15 to 1:17' },
              { label: '15 g coffee at 1:16', value: '240 g water' },
              { label: '15 g coffee at 1:16.7', value: '250 g water' },
              {
                label: 'SCA Golden Cup reference',
                value: '55 g per litre, plus or minus 10%',
                hint: 'That is roughly 1:16.6 to 1:20 by weight.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Do not use ratio to fix sour or bitter coffee. Fix extraction with grind first, then use ratio to adjust strength.',
          },
        ],
      },
      {
        heading: 'Temperature',
        blocks: [
          {
            type: 'paragraph',
            text: 'The SCA reference is 92 to 96°C at the point where water meets coffee. A kettle loses a few degrees in the air and in a cold brewer, so preheat the cone and filter.',
          },
          {
            type: 'table',
            rows: [
              {
                label: 'Light roast',
                value: '94 to 96°C',
                hint: 'Dense beans need more energy to give up sweetness.',
              },
              {
                label: 'Medium roast',
                value: '92 to 94°C',
                hint: 'A safe middle for most washed coffees.',
              },
              {
                label: 'Dark roast',
                value: '88 to 92°C',
                hint: 'Cooler water keeps roast bitterness in check.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Water quality',
        blocks: [
          {
            type: 'paragraph',
            text: 'Coffee is mostly water. Filtered water without chlorine is the simplest upgrade. Very hard water can mute acidity and make bitterness sharper. Very soft water can taste flat and empty.',
          },
          {
            type: 'bullets',
            items: [
              'The SCA water guidance puts total hardness around 50 to 175 ppm and alkalinity around 40 to 70 ppm, with a pH near 7.',
              'If your tap water is very hard, try a jug filter for one brew and compare. If sweetness appears, keep the filter.',
              'Do not use distilled water on its own. It lacks the minerals that help extraction.',
            ],
          },
        ],
      },
      {
        heading: 'What to change when',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Balanced but too weak',
                value: 'Tighten the ratio',
                hint: 'Try 1:15 or 1:15.5 before changing anything else.',
              },
              {
                label: 'Balanced but too heavy',
                value: 'Widen the ratio',
                hint: 'Try 1:17 or add 10 to 20 g of water.',
              },
              {
                label: 'Sharp and underdeveloped',
                value: 'Hotter water or finer grind',
                hint: 'Change one at a time. Grind usually has the bigger effect.',
              },
              {
                label: 'Harsh and drying',
                value: 'Cooler water or coarser grind',
                hint: 'If the drawdown is also slow, grind coarser first.',
              },
            ],
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Specialty Coffee Association, Golden Cup Standard',
        detail: '55 g per litre, 92 to 96°C, extraction 18 to 22 percent.',
      },
      {
        label: 'SCA water standards summary',
        detail: 'Hardness, alkalinity and pH guidance.',
      },
      {
        label: 'Salford Roasters, V60 troubleshooting without guessing',
        detail: 'Water quality and the order of adjustments.',
      },
    ],
  },
  {
    slug: 'taste-troubleshooting',
    title: 'Read the cup, fix one thing',
    summary: 'A short tasting vocabulary and the first change to try for each fault.',
    sections: [
      {
        heading: 'Name the problem',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Sour is sharp, prickly and unfinished. It often comes with a thin body.',
              'Bitter is drying and harsh, like over-steeped tea. It lingers in a heavy way.',
              'Weak or hollow means the cup is thin and missing sweetness. It is a strength problem before it is an extraction problem.',
              'Flat or dull means no sparkle and no sweetness. Check water, freshness and agitation before chasing grind.',
            ],
          },
        ],
      },
      {
        heading: 'The first change',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Sour and thin, fast drawdown',
                value: 'Grind finer',
                hint: 'Then keep the pour steady. Do not add a panic swirl.',
              },
              {
                label: 'Bitter and dry, slow drawdown',
                value: 'Grind coarser',
                hint: 'Pour lower and gentler. Reduce the final swirl.',
              },
              {
                label: 'Sour and bitter together',
                value: 'Fix channeling',
                hint: 'Wet the whole bed at the bloom, pour in circles and keep the stream off the paper.',
              },
              {
                label: 'Weak but pleasant',
                value: 'Tighten the ratio',
                hint: 'Try 1:15 instead of 1:16.',
              },
              {
                label: 'Papery or flat',
                value: 'Rinse the filter',
                hint: 'Also check the roast date. Stale coffee cannot be brewed back to life.',
              },
              {
                label: 'Muddy or silty',
                value: 'Agitate less',
                hint: 'Fewer pours, a softer stream and a gentler swirl.',
              },
            ],
          },
        ],
      },
      {
        heading: 'The three-brew loop',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                label: '1',
                title: 'Brew a baseline',
                text: 'Use the same dose, water, temperature and pour schedule. Write one sentence about the fault.',
              },
              {
                label: '2',
                title: 'Change the grind',
                text: 'Move one click in the direction the taste points. Brew again with everything else fixed.',
              },
              {
                label: '3',
                title: 'Adjust agitation',
                text: 'If the grind helped but did not finish the job, make the pour gentler or add one controlled swirl.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Most faults improve within three brews when only one variable moves at a time.',
          },
        ],
      },
      {
        heading: 'Common mistakes',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Changing dose, temperature and grind in the same brew. You will not know which change helped.',
              'Judging the cup while it is still very hot. Sweetness shows up as it cools.',
              'Using stale beans. Freshly ground coffee from a recently roasted bag behaves more predictably.',
              'Pouring hard into the centre. It digs a crater and pushes water through one path.',
            ],
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Salford Roasters, V60 troubleshooting without guessing',
        detail: 'Taste vocabulary and the order of adjustments.',
      },
      {
        label: 'Coffee Brew Guide, V60 troubleshooting table',
        detail: 'Symptom, likely cause and first change.',
      },
      {
        label: 'BaristaPath, How to dial in grind size for pour over',
        detail: 'Dial-in loop and time clues.',
      },
    ],
  },
  {
    slug: 'beans-and-freshness',
    title: 'Beans: rest, store, grind',
    summary: 'Why a bag tastes different in week one, week three and week eight.',
    sections: [
      {
        heading: 'Rest after roast',
        blocks: [
          {
            type: 'paragraph',
            text: 'Coffee releases carbon dioxide for days after roasting. Too much gas gets in the way of water, so a very fresh bag can taste sharp, hollow or uneven. Most roasters suggest resting filter coffee for at least five to seven days.',
          },
          {
            type: 'table',
            rows: [
              {
                label: '0 to 3 days',
                value: 'Too fresh',
                hint: 'Expect an explosive bloom and an uneven cup. Wait if you can.',
              },
              {
                label: '5 to 14 days',
                value: 'Opening window',
                hint: 'A practical start for filter. Flavour is lively but still settling.',
              },
              {
                label: '2 to 6 weeks',
                value: 'Peak window',
                hint: 'Many filter coffees taste sweetest and most complete here.',
              },
              {
                label: 'After 6 weeks',
                value: 'Declining',
                hint: 'Still drinkable, but aroma and complexity fade. Grind and ratio may need a nudge.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Roasters differ. Dark roasts usually settle faster. Anaerobic and carbonic coffees often need longer. Taste the bag across the week instead of trusting one number.',
          },
        ],
      },
      {
        heading: 'Store it well',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Keep beans in an airtight bag or container with a one-way valve if you have one.',
              'Store in a cool, dark, dry place. Heat, light and moisture speed up staling.',
              'Do not keep beans in the fridge. They pick up smells and condensation.',
              'For long storage, freeze whole beans in single-brew portions and let them thaw sealed.',
              'Grind just before brewing. Ground coffee loses aroma within minutes.',
            ],
          },
        ],
      },
      {
        heading: 'What to record',
        blocks: [
          {
            type: 'paragraph',
            text: 'A bean record is useful when it answers the questions you will ask next month. The roast date matters more than the purchase date. Process and roast level explain why two coffees need different grinds.',
          },
          {
            type: 'bullets',
            items: [
              'Roast date, so you know where the bag sits in its rest window.',
              'Process and roast level, because they change how easily coffee extracts.',
              'Origin, region and variety, so you can find the perky or heavy cup again.',
              'Tasting notes in your own words. “Brown sugar and orange peel” is more useful than a score.',
            ],
          },
        ],
      },
      {
        heading: 'The bag changes as it ages',
        blocks: [
          {
            type: 'paragraph',
            text: 'A setting that was perfect in week two may taste different in week five. Re-dial rather than assuming the old number still applies. Change one click and taste before changing anything else.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Partners Coffee, Coffee resting and degassing',
        detail: 'Rest windows for filter and espresso.',
      },
      {
        label: 'Nordic Brew Lab, Resting coffee',
        detail: 'Filter peak window and storage guidance.',
      },
      {
        label: 'Takumi Brewing Lab, Coffee freshness and storage',
        detail: 'Age phases and whole-bean storage.',
      },
    ],
  },
  {
    slug: 'pour-technique',
    title: 'Pouring that extracts evenly',
    summary: 'Low spout, slow circles, a calm bed, and one swirl at the end.',
    sections: [
      {
        heading: 'Low spout, steady stream',
        blocks: [
          {
            type: 'paragraph',
            text: 'A continuous stream from a low spout agitates the bed. A stream that breaks in the air drops its energy before it lands. Keep the spout close to the water and pour at roughly five grams per second.',
          },
          {
            type: 'paragraph',
            text: 'A gooseneck kettle makes this easier, but it is not essential. What matters is a controlled stream you can repeat.',
          },
        ],
      },
      {
        heading: 'Circles, not a jet',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Pour in slow circles from the centre outwards and back.',
              'Keep the stream off the paper. Water that runs down the filter bypasses the coffee.',
              'Do not drill into one spot. It digs a crater and creates a fast path through the bed.',
              'Leave a little room at the top of the cone. If the slurry reaches the rim, the grind may be too fine.',
            ],
          },
        ],
      },
      {
        heading: 'Bloom with a swirl',
        blocks: [
          {
            type: 'paragraph',
            text: 'Wet all the grounds, then swirl the brewer gently. The goal is to mix water and coffee, not to send grounds up the paper. A gentle swirl also helps the bed settle before the main pours.',
          },
        ],
      },
      {
        heading: 'Pulse, then let it settle',
        blocks: [
          {
            type: 'paragraph',
            text: 'Short pulses of about 50 g add agitation, then give the bed a moment to settle. That cycle is more even than one long pour, and it keeps the slurry temperature stable in a small brew.',
          },
        ],
      },
      {
        heading: 'Finish flat',
        blocks: [
          {
            type: 'paragraph',
            text: 'After the final pour, give the brewer one gentle swirl and let it drain. A flat bed is a good sign. A high ring of grounds on the paper usually means the pour reached the edge.',
          },
          {
            type: 'note',
            text: 'If the cup tastes sour and bitter at the same time, suspect channeling before you change the grind. Slow the pour and even out the bed first.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'James Hoffmann, A Better 1 Cup V60 Technique',
        detail: 'Pour height, flow rate and pulse structure.',
      },
      {
        label: 'Coffee Brew Guide, V60 recipe',
        detail: 'Bed level, paper contact and channeling signs.',
      },
    ],
  },
  {
    slug: 'grinder-calibration',
    title: 'Calibrate your TIMEMORE',
    summary: 'Find zero, set a working range, and keep notes in the grinder’s own units.',
    sections: [
      {
        heading: 'Find zero',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                label: '1',
                title: 'Start open',
                text: 'Set the dial well coarser than you need. Brush out any old grounds.',
              },
              {
                label: '2',
                title: 'Close slowly',
                text: 'Turn finer until the burrs just touch. On the S5 Pro, a slight chirp under sideways pressure is normal because the zero gap is about 0.075 mm.',
              },
              {
                label: '3',
                title: 'Back off',
                text: 'Turn one or two clicks coarser from the touch point. That is your practical zero for recording settings.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Set a working range',
        blocks: [
          {
            type: 'paragraph',
            text: 'A working range is the window that tastes good for the coffee you brew most. It is not a universal setting. Start inside the published range if there is one, brew, then move one click at a time.',
          },
          {
            type: 'steps',
            items: [
              {
                label: '1',
                title: 'Brew a baseline',
                text: 'Use a recipe you trust and change nothing else.',
              },
              {
                label: '2',
                title: 'Taste and move',
                text: 'Finer for sour and thin, coarser for bitter and dry.',
              },
              {
                label: '3',
                title: 'Record the window',
                text: 'Save the low and high ends in Brewmate so the next bag starts from somewhere real.',
              },
            ],
          },
        ],
      },
      {
        heading: 'The two Brewmate grinders',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Chestnut S5 Pro',
                value: '90 clicks, 15 µm per click',
                hint: 'Pour-over reference: 5.0 to 8.0 on the dial, or 50 to 80 clicks.',
              },
              {
                label: 'Chestnut C5 Pro',
                value: '48 clicks, 31 µm per click',
                hint: '16 macro steps per rotation. No published pour-over range, so your own notes matter more.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Brewmate never converts a setting between models. A click on one grinder is not a click on the other.',
          },
        ],
      },
      {
        heading: 'Keep the notes useful',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Write the setting in the grinder’s own unit, not in microns.',
              'Add the coffee and roast date, so you know which bag the setting belonged to.',
              'Note the taste in one or two words. “Sweet, round” is enough.',
              'When you change beans, start from the middle of your range and re-dial.',
            ],
          },
        ],
      },
    ],
    sources: [
      {
        label: 'TIMEMORE, Chestnut S5 Pro product page',
        detail: '90 clicks per rotation, 15 microns per click, pour-over reference.',
      },
      {
        label: 'TIMEMORE, Chestnut C5 Pro specifications',
        detail: '48 clicks per rotation, 31 microns per click, 16 macro steps.',
      },
      {
        label: 'BaristaPath, How to dial in grind size',
        detail: 'One-variable dial-in method.',
      },
    ],
  },
  {
    slug: 'four-six-method',
    title: 'The 4:6 method, explained',
    summary: 'Tetsu Kasuya’s five-pour framework for balancing sweetness and strength.',
    sections: [
      {
        heading: 'The idea',
        blocks: [
          {
            type: 'paragraph',
            text: 'The 4:6 method splits the water into two parts. The first 40 percent, poured in two stages, balances sweetness and acidity. The last 60 percent, poured in one to three stages, sets strength and body.',
          },
          {
            type: 'paragraph',
            text: 'It uses a coarser grind and a longer, pulse-based pour than the Hoffmann one-cup recipe. The pauses matter: each pour should finish draining before the next one starts.',
          },
        ],
      },
      {
        heading: 'Reference recipe',
        blocks: [
          {
            type: 'table',
            rows: [
              { label: 'Coffee', value: '20 g' },
              { label: 'Water', value: '300 g' },
              { label: 'Ratio', value: '1:15' },
              { label: 'Grind', value: 'Medium-coarse', hint: 'Coarser than a typical V60 starting point.' },
              { label: 'Water temperature', value: '92°C' },
              { label: 'Total time', value: 'About 3:30' },
            ],
          },
        ],
      },
      {
        heading: 'The five pours',
        blocks: [
          {
            type: 'steps',
            items: [
              { label: '0:00', title: 'First pour', text: 'Pour to 60 g.' },
              { label: '0:45', title: 'Second pour', text: 'Pour to 120 g. This completes the first 40 percent.' },
              { label: '1:30', title: 'Third pour', text: 'Pour to 180 g.' },
              { label: '2:15', title: 'Fourth pour', text: 'Pour to 240 g.' },
              { label: '3:00', title: 'Final pour', text: 'Pour to 300 g. Let it drain by about 3:30.' },
            ],
          },
        ],
      },
      {
        heading: 'Adjust the first 40 percent',
        blocks: [
          {
            type: 'bullets',
            items: [
              'First pour 40 g, second 80 g: sweeter and less acidic.',
              'First pour 60 g, second 60 g: balanced.',
              'First pour 80 g, second 40 g: brighter and more acidic.',
            ],
          },
        ],
      },
      {
        heading: 'Adjust the last 60 percent',
        blocks: [
          {
            type: 'bullets',
            items: [
              'One pour of 180 g: lighter body and a cleaner finish.',
              'Two pours of 90 g: medium strength and body.',
              'Three pours of 60 g: fuller body and a stronger cup.',
            ],
          },
        ],
      },
      {
        heading: 'Grind and timing',
        blocks: [
          {
            type: 'paragraph',
            text: 'If the bed drains too slowly, go coarser. If each pour drains before the next one is due, go finer. Keep the pour schedule fixed while you adjust the grind so the comparison is fair.',
          },
          {
            type: 'note',
            text: 'This is a framework, not a fixed recipe. Change the split, not every variable at once.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Hario Europe, Tetsu Kasuya V60 recipe',
        detail: '20 g coffee, 300 g water, five pours, 3:30 finish.',
      },
      {
        label: 'Honest Coffee Guide, 4:6 method',
        detail: 'How the 40 percent and 60 percent splits change the cup.',
      },
    ],
  },
];

export function getGuideArticles(lang: Language): GuideArticle[] {
  return lang === 'id' ? GUIDE_ARTICLES_ID : GUIDE_ARTICLES;
}

export function getGuideArticle(slug: string, lang: Language = 'en'): GuideArticle | undefined {
  return getGuideArticles(lang).find((article) => article.slug === slug);
}
