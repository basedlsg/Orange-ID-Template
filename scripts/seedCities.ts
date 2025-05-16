import { db } from '../server/db'; // Assuming db connection setup is in server/db
import { cities } from '../shared/schema'; // Assuming your Drizzle schema for cities is here
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

// Define an interface for the expected CSV row structure
interface CityCsvRow {
  city: string;
  city_ascii: string;
  lat: string; // PapaParse will read numbers as strings by default
  lng: string;
  country: string;
  iso2: string;
  iso3: string;
  admin_name: string; // Can be useful for timezone lookup later
  capital: string;
  population: string;
  id: string; // From CSV, may or may not be used as DB primary key
}

// Define an interface for the data to be inserted into the database
interface CityInsertData {
  name: string;
  cityAscii?: string | null; // Match schema, can be null
  country: string;
  latitude: number;
  longitude: number;
  timezoneStr: string; // Match schema field name
  population?: number | null;
  adminName?: string | null; // Match schema, can be null
  iso2?: string | null; // Match schema, can be null
  iso3?: string | null; // Match schema, can be null
  capital?: string | null; // Match schema, can be null
}

const BATCH_SIZE = 500;

async function seedCities() {
  console.log('Starting to seed cities...');

  const csvFilePath = path.join(process.cwd(), 'data', 'worldcities.csv');

  try {
    if (!fs.existsSync(csvFilePath)) {
      console.error(`Error: CSV file not found at ${csvFilePath}`);
      console.error('Please download worldcities.csv and place it in the ./data/ directory.');
      return;
    }

    const csvFileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    console.log('Successfully read CSV file.');

    const parseResult = Papa.parse<CityCsvRow>(csvFileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('Errors encountered while parsing CSV:');
      parseResult.errors.forEach(error => console.error(`- Row: ${error.row}, Code: ${error.code}, Message: ${error.message}`));
      return;
    }

    const parsedCities = parseResult.data;
    console.log(`Successfully parsed ${parsedCities.length} cities from CSV.`);

    const totalBatches = Math.ceil(parsedCities.length / BATCH_SIZE);
    console.log(`Preparing to process in ${totalBatches} batches of size ${BATCH_SIZE}.`);

    for (let i = 0; i < parsedCities.length; i += BATCH_SIZE) {
      const batch = parsedCities.slice(i, i + BATCH_SIZE);
      const citiesToInsert: CityInsertData[] = batch.map(city => {
        const latitude = parseFloat(city.lat);
        const longitude = parseFloat(city.lng);
        const population = parseInt(city.population, 10);

        // Always use 'UTC' as the timezone string since the CSV doesn't provide a reliable IANA timezone.
        const tzStr = 'UTC';

        return {
          name: city.city_ascii || city.city, // Prefer ascii name
          cityAscii: city.city_ascii || null,
          country: city.country,
          latitude: isNaN(latitude) ? 0 : latitude, 
          longitude: isNaN(longitude) ? 0 : longitude,
          timezoneStr: tzStr, // Use the determined timezone string
          population: isNaN(population) ? null : population,
          adminName: city.admin_name || null,
          iso2: city.iso2 || null,
          iso3: city.iso3 || null,
          capital: city.capital || null,
        };
      }).filter(city => {
          return city.name && city.name.trim() !== '' && 
                 !isNaN(city.latitude) && !isNaN(city.longitude) &&
                 city.timezoneStr && city.timezoneStr.trim() !== ''; // Ensure timezoneStr is valid
      });

      if (citiesToInsert.length > 0) {
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches}: Prepared ${citiesToInsert.length} cities for insertion. First city: ${citiesToInsert[0].name}`);
        // Database insertion logic will go here in the next step
        // For example: await db.insert(cities).values(citiesToInsert).onConflictDoNothing(); // or .onConflictUpdate(...)
        try {
          console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
          await db.insert(cities).values(citiesToInsert).onConflictDoNothing();
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted successfully.`);
        } catch (dbError) {
          console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, dbError);
          // Decide if you want to stop the whole process or continue with the next batch
        }
      } else {
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches}: No valid cities to insert in this batch.`);
      }
    }

  } catch (error) {
    console.error('Failed to seed cities:', error);
  }
}

seedCities().then(() => {
  console.log('City seeding process finished.');
  // Optionally, you might want to close the DB connection if your db setup requires it
  // e.g., if (db && typeof (db as any).end === 'function') { (db as any).end(); }
}).catch(error => {
  console.error('Unhandled error in city seeding process:', error);
  process.exit(1);
}); 