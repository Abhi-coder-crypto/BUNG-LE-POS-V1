import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

const seedData = JSON.parse(fs.readFileSync('/tmp/items_with_images.json', 'utf-8'));

async function seedDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system');
  
  try {
    await client.connect();
    const db = client.db();
    const inventoryCollection = db.collection('inventory');
    
    // Clear existing items
    await inventoryCollection.deleteMany({});
    console.log('Cleared existing inventory items');
    
    // Insert new items
    const result = await inventoryCollection.insertMany(seedData);
    console.log(`✓ Inserted ${result.insertedCount} inventory items`);
    
    // Print summary by category
    const summary = await inventoryCollection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\nInventory Summary by Category:');
    summary.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} items`);
    });
    
  } finally {
    await client.close();
  }
}

seedDatabase().catch(console.error);
