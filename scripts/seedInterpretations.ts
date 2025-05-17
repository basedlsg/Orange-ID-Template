import { db } from '../server/db';
import { interpretations, InsertInterpretation } from '../shared/schema';

// Helper function to get aspect keys (e.g., for "Sun trine Moon")
function getAspectKey(planet1Name: string, planet2Name: string, aspectName: string): string {
  const sortedPlanets = [planet1Name, planet2Name].sort();
  return `${sortedPlanets[0]}_${aspectName}_${sortedPlanets[1]}`;
}

// Sample interpretations data
const interpretationsData: Array<Omit<InsertInterpretation, 'id'>> = [
  // Sun Signs - 2 examples
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
  
  // Moon Signs - 2 examples
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
  
  // Ascendant Signs - 2 examples
  { 
    elementType: 'ascendant_sign', 
    key: 'Aries', 
    textContent: 'Aries Ascendant presents a direct, energetic, and assertive demeanor to the world. First impressions are of someone confident and ready for action.' 
  },
  { 
    elementType: 'ascendant_sign', 
    key: 'Taurus', 
    textContent: 'Taurus Ascendant gives a calm, grounded, and often attractive appearance. They project stability and a love for comfort.' 
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