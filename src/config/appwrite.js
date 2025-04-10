import { Client, Account, Databases } from 'appwrite';

// Initialize the Appwrite client
const client = new Client();

// Set the endpoint and project ID
client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize the Account service
const account = new Account(client);

// Initialize the Databases service
const databases = new Databases(client);

// Constants
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const DOUBTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_DOUBTS_COLLECTION_ID;
const SUBFOLDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SUBFOLDERS_COLLECTION_ID;
const USER_METADATA_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_METADATA_COLLECTION_ID;

// Export the account service
export {
  account,
  databases,
  DATABASE_ID,
  DOUBTS_COLLECTION_ID,
  SUBFOLDERS_COLLECTION_ID,
  USER_METADATA_COLLECTION_ID
};
export default client; 

