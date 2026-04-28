/**
 * src/appwrite/client.js
 *
 * Shared Appwrite client instance. Import this wherever you need
 * to interact with Appwrite — never instantiate Client() directly.
 *
 * Usage:
 *   import { databases, storage, client } from '../appwrite/client.js';
 */

import { Client, Databases, Storage, Users } from 'node-appwrite';
import { config } from '../config.js';

const client = new Client()
  .setEndpoint(config.appwrite.endpoint)
  .setProject(config.appwrite.projectId)
  .setKey(config.appwrite.apiKey);

export const databases = new Databases(client);
export const storage   = new Storage(client);
export const users     = new Users(client);
export { client };