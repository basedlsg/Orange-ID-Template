import { db } from '../server/db';
import { interpretations } from '../shared/schema';

// Simplified interpretation data for the most essential planet-sign combinations
const planetSignInterpretations = [
  // Sun in Capricorn
  {
    elementType: 'planet_in_sign',
    key: 'Sun_Capricorn',
    textContent: 'Sun in Capricorn indicates a personality driven by ambition, discipline, and responsibility. You approach life with determination and value structure and tradition. Your methodical nature helps you excel in long-term goals.'
  },
  // Moon in Capricorn
  {
    elementType: 'planet_in_sign',
    key: 'Moon_Capricorn',
    textContent: 'Moon in Capricorn shapes your emotional nature toward practicality and self-control. You process feelings through a pragmatic lens, seeking security through achievement and structure.'
  },
  // Mercury in Sagittarius
  {
    elementType: 'planet_in_sign',
    key: 'Mercury_Sagittarius',
    textContent: 'Mercury in Sagittarius gives you an expansive, optimistic thinking style. Your mind seeks the bigger picture and philosophical truths. You communicate with enthusiasm and think in broad concepts.'
  },
  // Venus in Aquarius
  {
    elementType: 'planet_in_sign',
    key: 'Venus_Aquarius',
    textContent: 'Venus in Aquarius shapes your approach to relationships with originality and intellectual connection. You value freedom and unconventional expressions of affection.'
  },
  // Mars in Taurus
  {
    elementType: 'planet_in_sign',
    key: 'Mars_Taurus',
    textContent: 'Mars in Taurus directs your energy with determination and steadiness. You pursue goals with persistence and prefer a methodical approach rather than impulsive action.'
  },
  // Jupiter in Scorpio
  {
    elementType: 'planet_in_sign',
    key: 'Jupiter_Scorpio',
    textContent: 'Jupiter in Scorpio expands your capacity for emotional depth and transformation. You seek growth through intense experiences and can find opportunity in challenging situations.'
  },
  // Saturn in Leo
  {
    elementType: 'planet_in_sign',
    key: 'Saturn_Leo',
    textContent: 'Saturn in Leo brings structure to your creative expression and leadership abilities. You may face challenges requiring self-confidence, developing authentic personal power through overcoming limitations.'
  },
  // Uranus in Pisces
  {
    elementType: 'planet_in_sign',
    key: 'Uranus_Pisces',
    textContent: 'Uranus in Pisces brings sudden inspiration and unconventional approaches to compassion. You may experience flashes of intuition or participate in innovative forms of spirituality.'
  },
  // Neptune in Aquarius
  {
    elementType: 'planet_in_sign',
    key: 'Neptune_Aquarius',
    textContent: 'Neptune in Aquarius dissolves boundaries in social structures. You may be drawn to humanitarian causes, finding spiritual connection through group endeavors and innovation.'
  },
  // Pluto in Sagittarius
  {
    elementType: 'planet_in_sign',
    key: 'Pluto_Sagittarius',
    textContent: 'Pluto in Sagittarius represents transformation in beliefs and cultural perspectives. You may feel compelled to seek truth beyond cultural boundaries, questioning established doctrines.'
  },
  // Ascendant in Libra
  {
    elementType: 'ascendant_sign',
    key: 'Libra',
    textContent: 'Libra Ascendant presents a harmonious, diplomatic, and charming first impression. You come across as fair-minded and socially graceful, with a natural ability to put others at ease.'
  },
  // Midheaven (MC) in Cancer
  {
    elementType: 'midheaven_sign',
    key: 'Cancer',
    textContent: 'Cancer Midheaven suggests a career path that involves nurturing and protecting others. You may excel in fields where emotional intelligence, caregiving and creating security are valued.'
  }
];

async function seedPlanetInterpretations() {
  console.log('Starting to seed planet-sign interpretations...');
  
  try {
    // Insert interpretations with conflict handling
    const result = await db.insert(interpretations)
      .values(planetSignInterpretations)
      .onConflictDoNothing();
    
    console.log(`Successfully inserted ${planetSignInterpretations.length} planet-sign interpretations`);
    return result;
  } catch (error) {
    console.error('Error seeding interpretations:', error);
    throw error;
  }
}

// Execute the seed function
seedPlanetInterpretations()
  .then(() => {
    console.log('Planet interpretation seeding completed successfully');
  })
  .catch((error) => {
    console.error('Failed to seed interpretations:', error);
  })
  .finally(() => {
    console.log('Seed script finished');
  });