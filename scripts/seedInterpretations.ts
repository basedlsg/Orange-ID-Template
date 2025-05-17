import { db } from '../server/db';
import { interpretations, InsertInterpretation } from '../shared/schema';

const BATCH_SIZE = 50;

const sunSignInterpretations: Array<Omit<InsertInterpretation, 'id'>> = [
  { elementType: 'sun_sign', key: 'Aries', textContent: 'Sun in Aries individuals are pioneering, courageous, and energetic. They are natural leaders but can sometimes be impulsive.' },
  { elementType: 'sun_sign', key: 'Taurus', textContent: 'Sun in Taurus individuals are practical, reliable, and appreciate the finer things in life. They are known for their determination and can be stubborn.' },
  { elementType: 'sun_sign', key: 'Gemini', textContent: 'Sun in Gemini individuals are communicative, curious, and versatile. They are intellectually inclined and enjoy variety but can sometimes be scattered.' },
  // Add more for other Sun signs...
  { elementType: 'sun_sign', key: 'Cancer', textContent: 'Sun in Cancer individuals are nurturing, sensitive, and protective. They value home and family deeply but can be moody.' },
  { elementType: 'sun_sign', key: 'Leo', textContent: 'Sun in Leo individuals are confident, generous, and charismatic. They enjoy being the center of attention and have a flair for the dramatic.' },
  { elementType: 'sun_sign', key: 'Virgo', textContent: 'Sun in Virgo individuals are analytical, meticulous, and service-oriented. They have a keen eye for detail and strive for perfection.' },
  { elementType: 'sun_sign', key: 'Libra', textContent: 'Sun in Libra individuals are diplomatic, charming, and seek balance. They value relationships and harmony but can be indecisive.' },
  { elementType: 'sun_sign', key: 'Scorpio', textContent: 'Sun in Scorpio individuals are intense, passionate, and perceptive. They are resourceful and determined but can be secretive.' },
  { elementType: 'sun_sign', key: 'Sagittarius', textContent: 'Sun in Sagittarius individuals are optimistic, adventurous, and philosophical. They love freedom and exploration but can be restless.' },
  { elementType: 'sun_sign', key: 'Capricorn', textContent: 'Sun in Capricorn individuals are disciplined, ambitious, and practical. They are responsible and goal-oriented but can be reserved.' },
  { elementType: 'sun_sign', key: 'Aquarius', textContent: 'Sun in Aquarius individuals are independent, innovative, and humanitarian. They are forward-thinking and original but can be detached.' },
  { elementType: 'sun_sign', key: 'Pisces', textContent: 'Sun in Pisces individuals are compassionate, imaginative, and intuitive. They are artistic and empathetic but can be escapist.' },
];

const moonSignInterpretations: Array<Omit<InsertInterpretation, 'id'>> = [
  { elementType: 'moon_sign', key: 'Aries', textContent: 'Moon in Aries individuals react quickly and emotionally. They have a need for independence in their emotional expression.' },
  { elementType: 'moon_sign', key: 'Taurus', textContent: 'Moon in Taurus individuals seek emotional security and comfort. They are calm and steady in their feelings but dislike change.' },
  { elementType: 'moon_sign', key: 'Gemini', textContent: 'Moon in Gemini individuals need variety and communication in their emotional life. They may rationalize their feelings.' },
  // Add more for other Moon signs...
];

const ascendantSignInterpretations: Array<Omit<InsertInterpretation, 'id'>> = [
  { elementType: 'ascendant_sign', key: '.*', textContent: 'Aries Ascendant presents a direct, energetic, and assertive demeanor to the world. First impressions are of someone confident and ready for action.' },
  { elementType: 'ascendant_sign', key: '.*', textContent: 'Taurus Ascendant gives a calm, grounded, and often attractive appearance. They project stability and a love for comfort.' },
  { elementType: 'ascendant_sign', key: '.*', textContent: 'Gemini Ascendant appears curious, communicative, and restless. They are often perceived as witty and youthful.' },
  // Add more for other Ascendant signs...
];

const planetInSignInterpretations: Array<Omit<InsertInterpretation, 'id'>> = [
  // Mars
  { elementType: 'planet_in_sign', key: '.*', textContent: 'Mars in Aries: Direct, assertive, and courageous energy. A go-getter who tackles challenges head-on.' },
  { elementType: 'planet_in_sign', key: '.*', textContent: 'Mars in Taurus: Persistent, determined, and sensual energy. Works steadily towards material goals.' },
  { elementType: 'planet_in_sign', key: '.*', textContent: 'Mars in Gemini: Mentally agile and versatile energy. Expresses drive through communication and varied activities.' },
  // Venus
  { elementType: 'planet_in_sign', key: '.*', textContent: 'Venus in Aries: Passionate and assertive in love. Values independence in relationships.' },
  { elementType: 'planet_in_sign', key: '.*', textContent: 'Venus in Taurus: Sensual and appreciates comfort and security in love. Values loyalty and stability.' },
  { elementType: 'planet_in_sign', key: '.*', textContent: 'Venus in Gemini: Seeks variety and mental stimulation in love. Values communication and wit.' },
  // Mercury
  { elementType: 'planet_in_sign', key: '.*', textContent: 'Mercury in Pisces: Communicates with intuition and empathy. Thinks in abstract and imaginative ways.' },
  // Add more examples for other planets and signs...
];

const planetInHouseInterpretations: Array<Omit<InsertInterpretation, 'id'>> = [
  // Sun in Houses
  { elementType: 'planet_in_house', key: '.*', textContent: 'Sun in 1st House: Strong sense of self, direct self-expression. A natural leader, focused on personal identity and initiative.' },
  { elementType: 'planet_in_house', key: '.*', textContent: 'Sun in 7th House: Focus on partnerships and relationships. Seeks identity through connection with others and values harmony.' },
  // Moon in Houses
  { elementType: 'planet_in_house', key: '.*', textContent: 'Moon in 4th House: Deep emotional connection to home and family. Needs a secure and nurturing private life.' },
  { elementType: 'planet_in_house', key: '.*', textContent: 'Moon in 10th House: Emotional need for public recognition and achievement. Career may be emotionally driven or involve caring for others.' },
  // Mars in Houses
  { elementType: 'planet_in_house', key: '.*', textContent: 'Mars in 5th House: Expresses energy through creative pursuits, romance, and recreation. Competitive and passionate in self-expression.' },
  // Add more examples...
];

const aspectInterpretations: Array<Omit<InsertInterpretation, 'id'>> = [
  {
    elementType: 'aspect',
    // Key: Alphabetize planet names, then join with aspect name. e.g., Moon_Trine_Sun
    key: ['Moon', 'Sun'].sort().join('_') + '_Trine', // Becomes Moon_Sun_Trine - let's adjust key format
    text: 'Sun Trine Moon: Harmonious emotions and self-expression. Inner self and outer personality work well together, leading to ease and natural confidence.'
  },
  {
    elementType: 'aspect',
    key: ['Mars', 'Venus'].sort().join('_') + '_Square', // Becomes Mars_Venus_Square
    text: 'Venus Square Mars: Tension between love/desire and action/assertion. Can create passionate attractions but also conflicts in relationships if not managed.'
  },
  {
    elementType: 'aspect',
    key: ['Jupiter', 'Saturn'].sort().join('_') + '_Conjunction', // Becomes Jupiter_Saturn_Conjunction
    text: 'Jupiter Conjunct Saturn: A significant aspect blending expansion with restriction. Can indicate a measured, patient approach to growth and building lasting structures.'
  },
  // Add more examples...
];

// Helper function to generate aspect keys consistently
function getAspectKey(planet1Name: string, planet2Name: string, aspectName: string): string {
  const sortedPlanets = [planet1Name, planet2Name].sort();
  // Standardize aspect name for key (e.g., remove spaces, consistent case if needed)
  const standardizedAspectName = aspectName.replace(/\s+/g, '_'); // Example: 'Trine' becomes 'Trine'
  return `${sortedPlanets[0]}_${standardizedAspectName}_${sortedPlanets[1]}`;
}

// Re-generating example keys with the helper for clarity and consistency (though seeder will use predefined keys)
const exampleAspectsData = [
    { p1: 'Sun', p2: 'Moon', aspect: 'Trine', text: 'Sun Trine Moon: Harmonious emotions and self-expression. Inner self and outer personality work well together, leading to ease and natural confidence.'},
    { p1: 'Venus', p2: 'Mars', aspect: 'Square', text: 'Venus Square Mars: Tension between love/desire and action/assertion. Can create passionate attractions but also conflicts in relationships if not managed.'},
    { p1: 'Jupiter', p2: 'Saturn', aspect: 'Conjunction', text: 'Jupiter Conjunct Saturn: A significant aspect blending expansion with restriction. Can indicate a measured, patient approach to growth and building lasting structures.'},
    { p1: 'Mercury', p2: 'Uranus', aspect: 'Sextile', text: 'Mercury Sextile Uranus: Quick, innovative thinking and communication. Original ideas and insights come easily.'}
];

const generatedAspectInterpretations: Array<Omit<InsertInterpretation, 'id'>> = exampleAspectsData.map(item => ({
    elementType: 'aspect',
    key: getAspectKey(item.p1, item.p2, item.aspect),
    text: item.text
}));

async function seedInterpretations() {
  console.log('Starting to seed interpretations...');

  const allInterpretations = [
    ...sunSignInterpretations,
    ...moonSignInterpretations,
    ...ascendantSignInterpretations,
    ...planetInSignInterpretations,
    ...planetInHouseInterpretations,
    ...generatedAspectInterpretations, // Use the generated ones
  ];

  if (allInterpretations.length === 0) {
    console.log('No interpretations to seed.');
    return;
  }

  const totalBatches = Math.ceil(allInterpretations.length / BATCH_SIZE);
  console.log(`Preparing to process ${allInterpretations.length} interpretations in ${totalBatches} batches of size ${BATCH_SIZE}.`);

  for (let i = 0; i < allInterpretations.length; i += BATCH_SIZE) {
    const batch = allInterpretations.slice(i, i + BATCH_SIZE);
    
    try {
      console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches}...`);
      await db.insert(interpretations).values(batch as InsertInterpretation[]).onConflictDoNothing(); 
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted successfully.`);
    } catch (dbError) {
      console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, dbError);
    }
  }

  console.log('Interpretation seeding finished.');
}

seedInterpretations()
  .catch(console.error)
  .finally(() => {
    console.log('Seed interpretations script finished.');
    // If your db connection needs to be closed explicitly, do it here.
    // e.g., if (db && typeof db.close === 'function') { db.close(); }
  }); 