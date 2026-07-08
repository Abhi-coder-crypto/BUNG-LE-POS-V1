import { MongoClient, Db, Collection, Document } from 'mongodb';

// Name of the shared customers database on the same cluster
const CUSTOMERS_DB_NAME = 'customersdb';

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    if (this.client && this.db) {
      return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();

      // Always use "POS" as the database name so POS data is isolated
      // from any other databases (e.g. "Orders") on the same cluster.
      this.db = this.client.db('POS');

      console.log(`✅ Connected to MongoDB database: POS`);
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection<T extends Document = Document>(name: string): Collection<T> {
    return this.getDatabase().collection<T>(name);
  }

  /**
   * Returns a collection from the shared `customersdb` database on the same
   * cluster. The MongoClient is already connected; we just switch databases.
   */
  getCustomersCollection<T extends Document = Document>(name: string): Collection<T> {
    if (!this.client) throw new Error('Database not connected. Call connect() first.');
    return this.client.db(CUSTOMERS_DB_NAME).collection<T>(name);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }
}

export const mongodb = new MongoDBService();
