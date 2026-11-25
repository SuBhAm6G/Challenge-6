import type { IndoorAction } from '../domain/indoor/types.ts';

/**
 * Curated evidence-based indoor air quality actions.
 * Explicitly excludes ozone generators, unverified ionizers, salt lamps, and plant-based PM removal myths.
 */
export const INDOOR_ACTION_LIBRARY: readonly IndoorAction[] = [
  {
    id: 'indoor-stop-burning',
    category: 'source_control',
    title: 'Pause indoor incense, mosquito coils, and candles during smog days',
    whatToDo:
      'Switch from burning agarbatti, dhoop, or mosquito coils indoors to electric liquid vaporizers/nets or unscented routines while outdoor air is Poor or worse.',
    whyItHelps:
      'Burning biomass sticks and coils indoors releases high bursts of PM2.5 and ultrafine particles directly inside rooms where air exchange is already restricted.',
    whenRelevant:
      'Whenever indoor burning sources are active, especially on Poor to Severe outdoor days.',
    costEffort: 'Zero cost / immediate habit shift',
    evidenceIds: ['epa-air-cleaners', 'who-aqg-2021'],
    limitations:
      'Reduces indoor particle generation; does not remove outdoor smoke already inside.',
    safetyNote:
      'If using electric mosquito repellents, keep basic room airflow safe for sleeping occupants.',
    confidence: 'high',
    priority: 'high',
  },
  {
    id: 'indoor-kitchen-exhaust',
    category: 'source_control',
    title: 'Run kitchen exhaust fan or chimney & cover pans while cooking',
    whatToDo:
      'Turn on the kitchen exhaust fan or chimney before igniting gas, use lids on simmering pots, and crack a nearby kitchen window briefly if frying.',
    whyItHelps:
      'High-heat Indian tadka, frying, and gas combustion create sharp indoor PM2.5 and NO₂ spikes that linger across adjacent living rooms.',
    whenRelevant: 'Every cooking session, especially with gas or biomass.',
    costEffort: 'Zero cost (uses existing exhaust) / low effort',
    evidenceIds: ['epa-air-cleaners', 'who-aqg-2021'],
    limitations:
      'If there is no mechanical exhaust and outdoor AQI is Severe, ventilate briefly from the kitchen side only while keeping bedroom doors closed.',
    safetyNote:
      'NEVER block kitchen air supply or run gas stoves in a completely sealed kitchen—carbon monoxide and NO₂ can build up dangerously.',
    confidence: 'high',
    priority: 'high',
  },
  {
    id: 'indoor-wet-mop',
    category: 'source_control',
    title: 'Wet-mop floors and damp-wipe surfaces instead of dry sweeping',
    whatToDo:
      'Replace dry brooming (jhadu) or feather dusting with damp mopping and damp microfiber cloth wiping.',
    whyItHelps:
      'Dry sweeping kicks settled coarse PM10 and fine dust back into breathing height for hours.',
    whenRelevant: 'Daily household cleaning, especially during dry winter smog episodes.',
    costEffort: 'Zero cost',
    evidenceIds: ['epa-cleaner-room'],
    limitations: 'Controls settled dust re-suspension; does not filter airborne smoke particles.',
    safetyNote: 'Allow floors to dry safely to prevent slips for older adults and children.',
    confidence: 'high',
    priority: 'medium',
  },
  {
    id: 'indoor-door-sealing',
    category: 'ventilation',
    title: 'Reduce outdoor smoke infiltration through main gaps during peak hours',
    whatToDo:
      'Place rolled towels or simple weather-stripping under exterior door gaps and keep balcony doors latched during morning and late-evening smog peaks.',
    whyItHelps:
      'Slows down infiltration of outdoor PM2.5 during temperature inversions when outdoor air is substantially worse than indoor air.',
    whenRelevant: 'When outdoor AQI is Poor, Very Poor, or Severe.',
    costEffort: 'Zero cost (towel) to low cost (door sweep)',
    evidenceIds: ['epa-cleaner-room'],
    limitations:
      'Reduces passive drafts; does not create an airtight seal and must be paired with safe ventilation checks.',
    safetyNote:
      'Do NOT seal rooms containing unvented gas geysers, space heaters, or cooking stoves. Always maintain safe oxygen & CO ventilation.',
    confidence: 'moderate',
    priority: 'high',
  },
  {
    id: 'indoor-cleaner-room',
    category: 'cleaner_room',
    title: 'Set up one designated Cleaner-Air Room for sleeping and vulnerable members',
    whatToDo:
      'Choose one bedroom with fewer exterior gaps, keep indoor burning out, close doors during peak smog hours, and run your HEPA purifier there if available.',
    whyItHelps:
      'Concentrating filtration and source control in one room provides cleaner sleeping hours without needing expensive whole-home equipment.',
    whenRelevant:
      'Very Poor or Severe AQI episodes, or households with children, older adults, or respiratory sensitivity.',
    costEffort: 'Zero to low effort',
    evidenceIds: ['epa-cleaner-room', 'epa-air-cleaners'],
    limitations:
      'Effectiveness depends on keeping doors closed, avoiding indoor sources inside that room, and matching purifier CADR to room size.',
    safetyNote:
      'Watch indoor temperature and stuffiness; open briefly during the cleanest afternoon window so fresh air exchanges safely.',
    confidence: 'high',
    priority: 'high',
  },
  {
    id: 'indoor-hepa-placement',
    category: 'filtration',
    title: 'Position HEPA purifier centrally & match CADR to room area',
    whatToDo:
      'Place the purifier away from walls/curtains, close doors to the room, run continuously on medium/auto (rather than 1 hour before bed), and check pre-filter dust weekly.',
    whyItHelps:
      'True HEPA (H13/H14) mechanical filtration captures airborne fine particles without generating harmful ozone.',
    whenRelevant: 'When the household already owns or plans to use a portable air purifier.',
    costEffort: 'Ongoing electricity & periodic filter cleaning/replacement',
    evidenceIds: ['epa-air-cleaners', 'epa-ozone-caution'],
    limitations:
      'Cannot fix heavy ongoing indoor smoke if windows stay wide open or incense burns next to the unit. Does not filter gases unless equipped with substantial activated carbon.',
    safetyNote:
      'Strictly avoid ozone generators or unverified "ionizer/plasma" modes—switch ionizer features OFF if your unit has an optional toggle.',
    confidence: 'high',
    priority: 'medium',
  },
  {
    id: 'indoor-no-ozone-myth',
    category: 'filtration',
    title: 'Skip unproven air-cleaning gadgets and myths',
    whatToDo:
      'Avoid ozone generators, Himalayan salt lamps, boiling water/steam, or relying on potted plants as particulate filters.',
    whyItHelps:
      'Ozone generators actively irritate lungs, and plants/salt lamps have negligible real-world PM2.5 removal in normal home airflow—spending budget on source control or a mechanical HEPA filter is far safer.',
    whenRelevant: 'Whenever evaluating low-cost indoor air hacks or purchases.',
    costEffort: 'Saves wasted money',
    evidenceIds: ['epa-ozone-caution', 'epa-air-cleaners'],
    limitations: 'Educational guardrail to prevent harmful or ineffective purchases.',
    safetyNote:
      'US EPA explicitly warns against using ozone-generating devices in occupied spaces.',
    confidence: 'high',
    priority: 'standard',
  },
];
