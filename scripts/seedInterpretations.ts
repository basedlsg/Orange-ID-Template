import { db } from '../server/db';
import { interpretations, InsertInterpretation } from '../shared/schema';

// Helper function to get aspect keys (e.g., for "Sun trine Moon")
function getAspectKey(planet1Name: string, planet2Name: string, aspectName: string): string {
  const sortedPlanets = [planet1Name, planet2Name].sort();
  return `${sortedPlanets[0]}_${aspectName}_${sortedPlanets[1]}`;
}

// Sample interpretations data
const interpretationsData: Array<Omit<InsertInterpretation, 'id'>> = [
  // Sun Signs - including the ones needed for your chart
  { 
    elementType: 'sun_sign', 
    key: 'Aries', 
    textContent: 'Sun in Aries individuals are pioneering, courageous, and energetic. They are natural leaders but can sometimes be impulsive.' 
  },
  { 
    elementType: 'sun_sign', 
    key: 'Taurus', 
    textContent: 'Sun in Taurus individuals are practical, reliable, and appreciate the finer things in life. They are known for their determination and can be stubborn.' 
  },
  { 
    elementType: 'sun_sign', 
    key: 'Capricorn', 
    textContent: 'Sun in Capricorn individuals are disciplined, responsible, and achievement-oriented. They approach life with determination and practicality, valuing tradition and hard work. Their methodical nature helps them excel in long-term endeavors, though they may sometimes appear reserved or overly serious.' 
  },
  
  // Moon Signs - including the ones needed for your chart
  { 
    elementType: 'moon_sign', 
    key: 'Aries', 
    textContent: 'Moon in Aries individuals react quickly and emotionally. They have a need for independence in their emotional expression.' 
  },
  { 
    elementType: 'moon_sign', 
    key: 'Taurus', 
    textContent: 'Moon in Taurus individuals seek emotional security and comfort. They are calm and steady in their feelings but dislike change.' 
  },
  { 
    elementType: 'moon_sign', 
    key: 'Capricorn', 
    textContent: 'Moon in Capricorn individuals process emotions with practicality and restraint. They often internalize feelings, seeking emotional security through achievement and structure. While appearing composed on the surface, they may struggle with expressing vulnerability, though they provide steadfast emotional support to those they care about.' 
  },
  
  // Ascendant Signs - including Libra and Cancer
  { 
    elementType: 'ascendant_sign', 
    key: 'Aries', 
    textContent: 'Aries Ascendant presents a direct, energetic, and assertive demeanor to the world. First impressions are of someone confident and ready for action.' 
  },
  { 
    elementType: 'ascendant_sign', 
    key: 'Taurus', 
    textContent: 'Taurus Ascendant gives a calm, grounded, and often attractive appearance. They project stability and a love for comfort.' 
  },
  { 
    elementType: 'ascendant_sign', 
    key: 'Libra', 
    textContent: 'Libra Ascendant presents a harmonious, diplomatic, and charming first impression. They often come across as fair-minded and socially graceful, with a natural ability to put others at ease. Their appearance may be balanced and aesthetically pleasing, reflecting their innate sense of proportion and beauty.' 
  },
  { 
    elementType: 'ascendant_sign', 
    key: 'Cancer', 
    textContent: 'Cancer Ascendant projects a nurturing, protective, and receptive demeanor. They often appear emotionally sensitive with an approachable quality that makes others feel safe. Their first impression tends to be caring and somewhat reserved, with intuitive understanding of others\' emotional needs.' 
  },
  
  // Planet in Sign interpretations for your chart
  {
    elementType: 'planet_in_sign',
    key: 'Sun_Capricorn',
    textContent: 'Sun in Capricorn indicates a personality driven by ambition, discipline, and a strong sense of responsibility. You approach life with practical determination and value achievement, structure, and tradition. Your methodical nature helps you excel in long-term goals, though you may sometimes appear reserved. Your strength lies in your reliability and perseverance.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Moon_Capricorn',
    textContent: 'Moon in Capricorn shapes your emotional nature toward practicality and self-control. You process feelings through a pragmatic lens, seeking emotional security through achievement and structure. While appearing composed externally, you may internalize emotions deeply. Your emotional strength comes from inner resilience and steady perseverance through challenges.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Mercury_Sagittarius',
    textContent: 'Mercury in Sagittarius gives you an expansive, optimistic thinking style. Your mind naturally seeks the bigger picture and philosophical truths. You communicate with enthusiasm and tend to think in broad concepts rather than details. Learning through experience and travel appeals to you, and you often find interest in subjects that broaden your worldview.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Venus_Aquarius',
    textContent: 'Venus in Aquarius shapes your approach to love and relationships with originality and intellectual connection. You value freedom, friendship, and unconventional expressions of affection. Attracted to unique individuals and progressive ideas, you seek partners who respect your independence. Your affections tend to be expressed through thoughtful gestures and stimulating conversation rather than traditional romance.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Mars_Taurus',
    textContent: 'Mars in Taurus directs your energy and drive with determination and steadiness. You pursue goals with remarkable persistence and prefer a methodical approach rather than impulsive action. While slow to anger, once provoked your responses can be powerful and difficult to change. Your strength lies in your endurance and ability to see things through to completion, especially when working toward material security.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Jupiter_Scorpio',
    textContent: 'Jupiter in Scorpio expands your capacity for emotional depth, transformation, and spiritual insight. You seek growth through intense experiences and can find opportunity in crisis or challenging situations. Your intuition is heightened and you may have uncanny luck in situations requiring investigation or resourcefulness. Your greatest potential for success lies in fields requiring psychological understanding, financial acumen, or healing abilities.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Saturn_Leo',
    textContent: 'Saturn in Leo brings structure and discipline to your creative expression and leadership abilities. You may face challenges in situations requiring self-confidence or recognition, developing a more authentic relationship with personal power through overcoming limitations. Though you might initially struggle with fear of inadequacy in creative pursuits, your perseverance can ultimately lead to genuine mastery and well-earned recognition.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Uranus_Pisces',
    textContent: 'Uranus in Pisces brings sudden inspiration, spiritual awakening, and unconventional approaches to compassion and universal connection. You may experience flashes of intuition or participate in innovative forms of spirituality or artistic expression. Your generation is marked by revolutionary approaches to collective healing, dissolving boundaries between different belief systems, and bringing technological innovation to fields related to spirituality, healthcare, and the arts.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Neptune_Aquarius',
    textContent: 'Neptune in Aquarius dissolves boundaries in social structures and collective ideals. Your generation experiences a blending of technology with spirituality and idealism. You may be drawn to humanitarian causes that transcend traditional limitations, finding spiritual connection through group endeavors and technological innovation. This placement suggests potential for visionary social reform and collective spiritual awakening through new forms of community.'
  },
  {
    elementType: 'planet_in_sign',
    key: 'Pluto_Sagittarius',
    textContent: 'Pluto in Sagittarius represents profound transformation in beliefs, higher education, and cultural perspectives. Your generation experiences the breakdown and regeneration of philosophical systems and international relations. You may feel compelled to seek truth that goes beyond cultural boundaries, questioning established doctrines while developing more authentic belief systems. This placement suggests potential for powerful spiritual journeys and revolutionary approaches to knowledge and cultural exchange.'
  }
];

/**
 * The seedInterpretations function inserts the sample interpretations data into the database.
 * It checks for conflicts and skips duplicates.
 */
async function seedInterpretations() {
  console.log('Starting to seed interpretations...');
  
  try {
    // Insert interpretations with conflict handling
    const result = await db.insert(interpretations)
      .values(interpretationsData)
      .onConflictDoNothing();
    
    console.log(`Successfully inserted ${interpretationsData.length} interpretations`);
    return result;
  } catch (error) {
    console.error('Error seeding interpretations:', error);
    throw error;
  }
}

// Execute the seed function
seedInterpretations()
  .then(() => {
    console.log('Interpretation seeding completed successfully');
  })
  .catch((error) => {
    console.error('Failed to seed interpretations:', error);
  })
  .finally(() => {
    console.log('Seed script finished');
  });