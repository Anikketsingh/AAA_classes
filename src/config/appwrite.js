import { Client, Account, Databases } from 'appwrite';

// Initialize the Appwrite client
const client = new Client();

// Set the endpoint and project ID
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67e34314002ff216be44');

// Initialize the Account service
const account = new Account(client);

// Initialize the Databases service
const databases = new Databases(client);

// Constants
const DATABASE_ID = '67e58913001aa82af861'; // Your actual database ID
const DOUBTS_COLLECTION_ID = '67e5f8bf002522bb1b3a';
const SUBFOLDERS_COLLECTION_ID = '67eda5a5001a7d00e677'; // Replace with your actual subfolder collection ID

// Export the account service
export { account, databases, DATABASE_ID, DOUBTS_COLLECTION_ID, SUBFOLDERS_COLLECTION_ID };
export default client; 

