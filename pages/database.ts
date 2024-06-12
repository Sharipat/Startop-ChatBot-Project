
// database.ts
import { MongoClient } from 'mongodb';

const uri = process.env.NEXT_MONGODB_URI || 'mongodb://localhost:27017'; // Use environment variable for production
const client = new MongoClient(uri);

let cachedDb: any = null; // Cache the database connection

export async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db('startop'); // Replace with your database name
    cachedDb = db; // Cache the database
    return db;
  } catch (e) {
    console.error(e);
    throw e; // Rethrow the error for handling in your component
  } 
}

// database.ts for connecting to MongoDB database in Next.js