/**
 * scripts/setup-appwrite.js
 *
 * Initializes all Appwrite collections, attributes, indexes,
 * and storage buckets for the Sports Graphics Platform.
 *
 * Safe to re-run — skips resources that already exist.
 *
 * Usage:
 *   node scripts/setup-appwrite.js
 *
 * Requires env vars:
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY  (needs databases.write + storage.write scope)
 */

import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';
import { config } from '../src/config.js';

// ─── Client ─────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(config.appwrite.endpoint)
  .setProject(config.appwrite.projectId)
  .setKey(config.appwrite.apiKey);

const databases = new Databases(client);
const storage   = new Storage(client);

const DB_ID = 'sports-graphics';

// ─── Helpers ────────────────────────────────────────────────────

async function createDatabaseIfNeeded() {
  try {
    await databases.get(DB_ID);
    console.log(`  ✓ Database '${DB_ID}' already exists`);
  } catch {
    await databases.create(DB_ID, 'Sports Graphics Platform');
    console.log(`  + Created database '${DB_ID}'`);
  }
}

async function createCollection(id, name, permissions = []) {
  try {
    await databases.getCollection(DB_ID, id);
    console.log(`  ✓ Collection '${id}' already exists`);
    return false; // already existed
  } catch {
    await databases.createCollection(DB_ID, id, name, permissions);
    console.log(`  + Created collection '${id}'`);
    return true; // newly created
  }
}

async function createAttr(type, collectionId, key, opts = {}) {
  try {
    switch (type) {
      case 'string':
        await databases.createStringAttribute(DB_ID, collectionId, key,
          opts.size || 255, opts.required || false, opts.default, opts.array || false);
        break;
      case 'boolean':
        await databases.createBooleanAttribute(DB_ID, collectionId, key,
          opts.required || false, opts.default, opts.array || false);
        break;
      case 'integer':
        await databases.createIntegerAttribute(DB_ID, collectionId, key,
          opts.required || false, opts.min, opts.max, opts.default, opts.array || false);
        break;
      case 'float':
        await databases.createFloatAttribute(DB_ID, collectionId, key,
          opts.required || false, opts.min, opts.max, opts.default, opts.array || false);
        break;
      case 'datetime':
        await databases.createDatetimeAttribute(DB_ID, collectionId, key,
          opts.required || false, opts.default, opts.array || false);
        break;
      case 'enum':
        await databases.createEnumAttribute(DB_ID, collectionId, key,
          opts.elements, opts.required || false, opts.default, opts.array || false);
        break;
      case 'json':
        // Appwrite stores complex objects as string JSON
        await databases.createStringAttribute(DB_ID, collectionId, key,
          opts.size || 65535, opts.required || false, null, false);
        break;
    }
    console.log(`    + Attribute '${key}' (${type})`);
  } catch (err) {
    if (err?.code === 409) {
      console.log(`    ✓ Attribute '${key}' already exists`);
    } else {
      throw err;
    }
  }
  // Appwrite requires a short pause between attribute creation calls
  await sleep(500);
}

async function createIndex(collectionId, key, type, attributes, orders = []) {
  try {
    await databases.createIndex(DB_ID, collectionId, key, type, attributes, orders);
    console.log(`    + Index '${key}'`);
  } catch (err) {
    if (err?.code === 409) {
      console.log(`    ✓ Index '${key}' already exists`);
    } else {
      throw err;
    }
  }
  await sleep(300);
}

async function createBucket(id, name, permissions = [], opts = {}) {
  try {
    await storage.getBucket(id);
    console.log(`  ✓ Bucket '${id}' already exists`);
  } catch {
    await storage.createBucket(id, name, permissions, opts.fileSecurity || false,
      opts.enabled !== false, opts.maxFileSize, opts.allowedFileExtensions,
      opts.compression, opts.encryption !== false, opts.antivirus !== false);
    console.log(`  + Created bucket '${id}'`);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Collections ─────────────────────────────────────────────────

async function setupCustomers() {
  console.log('\ncustomers');
  await createCollection('customers', 'Customers', [
    Permission.read(Role.users()),
    Permission.write(Role.users()),
  ]);

  await createAttr('string',   'customers', 'name',         { required: true, size: 100 });
  await createAttr('string',   'customers', 'email',        { required: true, size: 255 });
  await createAttr('string',   'customers', 'phone',        { size: 30 });
  await createAttr('string',   'customers', 'school',       { size: 200 });
  await createAttr('string',   'customers', 'sport',        { size: 50 });
  await createAttr('json',     'customers', 'orderHistory', {});
  await createAttr('datetime', 'customers', 'createdAt',    { required: true });

  await createIndex('customers', 'idx_email',  'unique', ['email']);
  await createIndex('customers', 'idx_school', 'key',    ['school']);
}

async function setupOrders() {
  console.log('\norders');
  const ORDER_STATES = [
    'PENDING_PAYMENT', 'IN_PRODUCTION', 'PENDING_PROOF_REVIEW',
    'PROOF_REVISION_REQUESTED', 'PROOF_APPROVED', 'PENDING_FINAL_PAYMENT',
    'PAID_IN_FULL', 'FULFILLMENT', 'DELIVERED', 'DISPUTED',
  ];

  await createCollection('orders', 'Orders');

  await createAttr('string',   'orders', 'customerId',       { required: true });
  await createAttr('string',   'orders', 'teamId',           { required: true });
  await createAttr('enum',     'orders', 'state',            {  elements: ORDER_STATES, default: 'PENDING_PAYMENT' });
  await createAttr('integer',  'orders', 'depositAmount',    {});
  await createAttr('string',   'orders', 'depositIntentId',  { size: 100 });
  await createAttr('datetime', 'orders', 'depositPaidAt',    {});
  await createAttr('integer',  'orders', 'balanceAmount',    {});
  await createAttr('string',   'orders', 'balanceIntentId',  { size: 100 });
  await createAttr('datetime', 'orders', 'balancePaidAt',    {});
  await createAttr('string',   'orders', 'currency',         { size: 10, default: 'usd' });
  await createAttr('json',     'orders', 'proofLog',         {});
  await createAttr('json',     'orders', 'deliveryLog',      {});
  await createAttr('json',     'orders', 'fulfillment',      {});
  await createAttr('string',   'orders', 'parentStoreId',    { size: 100 });
  await createAttr('datetime', 'orders', 'createdAt',        { required: true });
  await createAttr('datetime', 'orders', 'updatedAt',        { required: true });

  await createIndex('orders', 'idx_customer', 'key',    ['customerId']);
  await createIndex('orders', 'idx_state',    'key',    ['state']);
  await createIndex('orders', 'idx_created',  'key',    ['createdAt'], ['DESC']);
}

async function setupTeams() {
  console.log('\nteams');
  await createCollection('teams', 'Teams');

  await createAttr('string',   'teams', 'customerId',  { required: true });
  await createAttr('string',   'teams', 'brandId',     { required: true, size: 100 });
  await createAttr('string',   'teams', 'teamName',    { required: true, size: 200 });
  await createAttr('string',   'teams', 'school',      { size: 200 });
  await createAttr('string',   'teams', 'sport',       { size: 50 });
  await createAttr('string',   'teams', 'season',      { size: 50 });
  await createAttr('json',     'teams', 'teamJson',    { size: 65535 });
  await createAttr('datetime', 'teams', 'createdAt',   { required: true });

  await createIndex('teams', 'idx_customer', 'key', ['customerId']);
  await createIndex('teams', 'idx_brand',    'key', ['brandId']);
}

async function setupPlayers() {
  console.log('\nplayers');
  await createCollection('players', 'Players');

  await createAttr('string',   'players', 'teamId',      { required: true });
  await createAttr('string',   'players', 'orderId',     { required: true });
  await createAttr('string',   'players', 'firstName',   { required: true, size: 100 });
  await createAttr('string',   'players', 'lastName',    { required: true, size: 100 });
  await createAttr('string',   'players', 'slug',        { required: true, size: 150 });
  await createAttr('string',   'players', 'number',      { size: 10 });
  await createAttr('string',   'players', 'position',    { size: 100 });
  await createAttr('string',   'players', 'year',        { size: 50 });
  await createAttr('json',     'players', 'photo',       {});
  await createAttr('json',     'players', 'stats',       {});
  await createAttr('datetime', 'players', 'createdAt',   { required: true });

  await createIndex('players', 'idx_team',  'key', ['teamId']);
  await createIndex('players', 'idx_order', 'key', ['orderId']);
}

async function setupConsentLogs() {
  console.log('\nconsent_logs  (permanent — never delete records)');
  await createCollection('consent_logs', 'Consent Logs');

  await createAttr('string',   'consent_logs', 'playerId',          { required: true });
  await createAttr('string',   'consent_logs', 'orderId',           { required: true });
  await createAttr('boolean',  'consent_logs', 'backgroundRemoval', { default: false });
  await createAttr('boolean',  'consent_logs', 'colorAdjustment',   { default: false });
  await createAttr('boolean',  'consent_logs', 'poseAdjustment',    { default: false });
  await createAttr('boolean',  'consent_logs', 'aiMotion',          { default: false });
  await createAttr('boolean',  'consent_logs', 'marketingUse',      { default: false });
  await createAttr('string',   'consent_logs', 'signedBy',          { required: true });
  await createAttr('datetime', 'consent_logs', 'timestamp',         { required: true });
  await createAttr('string',   'consent_logs', 'ipAddress',         { size: 128 });
  await createAttr('string',   'consent_logs', 'userAgent',         { size: 512 });
  await createAttr('string',   'consent_logs', 'orderVersion',      { size: 20 });
  await createAttr('string',   'consent_logs', 'legalText',         { size: 65535 });

  await createIndex('consent_logs', 'idx_player', 'key', ['playerId']);
  await createIndex('consent_logs', 'idx_order',  'key', ['orderId']);
}

async function setupProofApprovals() {
  console.log('\nproof_approvals  (permanent — never delete records)');
  await createCollection('proof_approvals', 'Proof Approvals');

  await createAttr('string',   'proof_approvals', 'orderId',    { required: true });
  await createAttr('integer',  'proof_approvals', 'version',    { required: true });
  await createAttr('string',   'proof_approvals', 'action',     { required: true, size: 50 });
  await createAttr('string',   'proof_approvals', 'approvedBy', { required: true });
  await createAttr('datetime', 'proof_approvals', 'timestamp',  { required: true });
  await createAttr('string',   'proof_approvals', 'ipAddress',  { size: 128 });
  await createAttr('string',   'proof_approvals', 'notes',      { size: 2000 });

  await createIndex('proof_approvals', 'idx_order', 'key', ['orderId']);
}

async function setupFinancialRecords() {
  console.log('\nfinancial_records  (7-year retention)');
  await createCollection('financial_records', 'Financial Records');

  await createAttr('string',   'financial_records', 'orderId',         { required: true });
  await createAttr('string',   'financial_records', 'stripeEventId',   { size: 100 });
  await createAttr('string',   'financial_records', 'stripeIntentId',  { size: 100 });
  await createAttr('string',   'financial_records', 'paymentStage',    { size: 20 });
  await createAttr('string',   'financial_records', 'status',          { size: 50 });
  await createAttr('integer',  'financial_records', 'gross',           {});
  await createAttr('integer',  'financial_records', 'stripeFee',       {});
  await createAttr('integer',  'financial_records', 'fulfillmentCost', {});
  await createAttr('integer',  'financial_records', 'profit',          {});
  await createAttr('string',   'financial_records', 'currency',        { size: 10, default: 'usd' });
  await createAttr('string',   'financial_records', 'fulfillmentRef',  { size: 200 });
  await createAttr('datetime', 'financial_records', 'timestamp',       { required: true });

  await createIndex('financial_records', 'idx_order',     'key',  ['orderId']);
  await createIndex('financial_records', 'idx_timestamp', 'key',  ['timestamp'], ['DESC']);
}

async function setupParentOrders() {
  console.log('\nparent_orders');
  const PARENT_ORDER_STATES = ['PENDING_PAYMENT', 'PROCESSING', 'FULFILLED', 'DELIVERED'];

  await createCollection('parent_orders', 'Parent Orders');

  await createAttr('string',   'parent_orders', 'teamOrderId', { required: true });
  await createAttr('string',   'parent_orders', 'parentId',    { required: true });
  await createAttr('string',   'parent_orders', 'playerId',    { required: true });
  await createAttr('enum',     'parent_orders', 'state',       { elements: PARENT_ORDER_STATES, default: 'PENDING_PAYMENT' });
  await createAttr('json',     'parent_orders', 'products',    {});
  await createAttr('json',     'parent_orders', 'shipping',    {});
  await createAttr('string',   'parent_orders', 'stripeId',    { size: 100 });
  await createAttr('integer',  'parent_orders', 'totalAmount', {});
  await createAttr('string',   'parent_orders', 'fulfillRef',  { size: 200 });
  await createAttr('datetime', 'parent_orders', 'createdAt',   { required: true });
  await createAttr('datetime', 'parent_orders', 'updatedAt',   { required: true });

  await createIndex('parent_orders', 'idx_team_order', 'key', ['teamOrderId']);
  await createIndex('parent_orders', 'idx_parent',     'key', ['parentId']);
}

async function setupBrands() {
  console.log('\nbrands');
  await createCollection('brands', 'Brands');

  await createAttr('string',  'brands', 'slug',        { required: true, size: 100 });
  await createAttr('string',  'brands', 'name',        { required: true, size: 200 });
  await createAttr('string',  'brands', 'description', { size: 500 });
  await createAttr('boolean', 'brands', 'active',      { default: false });
  await createAttr('json',    'brands', 'sports',      {});
  await createAttr('json',    'brands', 'tokenSchema', {});

  await createIndex('brands', 'idx_slug',   'unique', ['slug']);
  await createIndex('brands', 'idx_active', 'key',    ['active']);
}

// ─── Storage Buckets ─────────────────────────────────────────────
//
// DEV (Appwrite Cloud free tier): 1 bucket limit per project.
// All four logical storage areas are consolidated into a single
// 'assets' bucket. File IDs are prefixed to segregate areas:
//
//   uploads__[orderId]__[playerId]__[filename]   customer photo uploads
//   proofs__[orderId]__[assetId]                 watermarked proof assets
//   finals__[orderId]__[filename]                final deliverables
//   previews__[teamSlug]__[playerId]             parent store previews
//
// Access control is enforced by API route authentication, not bucket
// permissions (same security model, different enforcement layer).
//
// PROD (self-hosted VPS): No bucket limit. Run with --env=prod flag
// to create the full 4-bucket architecture instead.
//
//   node scripts/setup-appwrite.js --env=prod

const isProd = process.argv.includes('--env=prod');

async function setupBuckets() {
  console.log('\nStorage Buckets');

  if (isProd) {
    console.log('  Mode: production (4 buckets)');
    await setupBucketsProd();
  } else {
    console.log('  Mode: development (1 consolidated bucket — free tier)');
    console.log('  File ID prefixes: uploads__ | proofs__ | finals__ | previews__');
    await setupBucketsDev();
  }
}

async function setupBucketsDev() {
  // Single consolidated bucket for all asset types
  await createBucket('assets', 'Assets', [], {
    // Max file size covers the largest asset type (video finals)
    maxFileSize: 50000000,             // 50MB
    allowedFileExtensions: [
      'jpg', 'jpeg', 'png', 'webp',      // photos + previews
      'mp4', 'webm',                     // video proofs + finals
      'pdf', 'zip',                      // print finals + delivery zips
    ],
    encryption: true,
    antivirus: true,
  });
}

async function setupBucketsProd() {
  // Customer photo uploads — pipeline service account access only
  await createBucket('uploads', 'Customer Uploads', [], {
    maxFileSize: 50000000,               // 50MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    encryption: true,
    antivirus: true,
  });

  // Watermarked proof assets — signed URL access, 15min expiry
  await createBucket('proofs', 'Proof Assets', [], {
    maxFileSize: 50000000,              // 500MB (video proofs)
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'mp4', 'webm'],
    encryption: true,
  });

  // Final deliverables — single-use download, 48hr expiry
  await createBucket('finals', 'Final Assets', [], {
    maxFileSize: 50000000,             // 50MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'mp4', 'pdf', 'zip'],
    encryption: true,
  });

  // Parent store product preview mockups — authenticated session access
  await createBucket('previews', 'Store Previews', [], {
    maxFileSize: 10485760,               // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    encryption: true,
  });
}

// ─── Run ─────────────────────────────────────────────────────────

async function main() {
  console.log('=== Sports Graphics Platform — Appwrite Setup ===\n');
  console.log(`Endpoint:   ${config.appwrite.endpoint}`);
  console.log(`Project ID: ${config.appwrite.projectId}`);
  console.log('');

  try {
    console.log('Database');
    await createDatabaseIfNeeded();

    await setupCustomers();
    await setupOrders();
    await setupTeams();
    await setupPlayers();
    await setupConsentLogs();
    await setupProofApprovals();
    await setupFinancialRecords();
    await setupParentOrders();
    await setupBrands();
    await setupBuckets();

    console.log('\n=== Setup complete ===\n');
    console.log('Next steps:');
    console.log('  1. Verify collections in the Appwrite console');
    console.log('  2. Seed the brands collection with active brand entries');
    console.log('     node scripts/seed-brands.js');
    console.log('  3. Start development:');
    console.log('     npm run dev\n');

  } catch (err) {
    console.error('\n✗ Setup failed:', err.message);
    if (err?.response) console.error('  Appwrite response:', err.response);
    process.exit(1);
  }
}

main();