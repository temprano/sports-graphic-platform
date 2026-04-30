/**
 * components-1-customer-web/app/api/orders/create/route.ts
 *
 * POST /api/orders/create
 *
 * Creates a new order with uploaded photos.
 * Workflow:
 * 1. Validate request data
 * 2. Upload photos to Appwrite private bucket
 * 3. Create order document in database
 * 4. Queue process-photos job
 * 5. Return order ID
 */

import { NextRequest, NextResponse } from 'next/server';

// TODO: Import actual dependencies once configured
// import { appwriteClient } from '@/lib/appwrite/client';
// import { createOrderDocument } from '@/lib/appwrite/orders';
// import { uploadOrderPhotos } from '@/lib/storage';
// import { queuePhotoProcessing } from '@/lib/queue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ─── Validate request ──────────────────────────────────────────
    if (!body.brandId || !body.players || !body.photos) {
      return NextResponse.json(
        {
          error: 'Missing required fields: brandId, players, photos',
        },
        { status: 400 }
      );
    }

    if (body.players.length === 0) {
      return NextResponse.json(
        {
          error: 'At least one player is required',
        },
        { status: 400 }
      );
    }

    // ─── Validate all required photos are present ──────────────────
    const photos = body.photos;
    for (const playerId of Object.keys(photos)) {
      const playerPhotos = photos[playerId];
      for (const poseId of Object.keys(playerPhotos)) {
        if (!playerPhotos[poseId].file) {
          return NextResponse.json(
            {
              error: `Missing photo for player ${playerId}, pose ${poseId}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // ─── Create order document in database ─────────────────────────
    // const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    //
    // const orderData = {
    //   id: orderId,
    //   brandId: body.brandId,
    //   players: body.players,
    //   photos: body.photos,
    //   status: 'IN_PRODUCTION',
    //   createdAt: Date.now(),
    //   updatedAt: Date.now(),
    // };
    //
    // await createOrderDocument(orderId, orderData);

    // ─── Upload photos to Appwrite private bucket ──────────────────
    // const uploadedPhotos = await uploadOrderPhotos(orderId, body.photos);

    // ─── Queue photo processing job ────────────────────────────────
    // await queuePhotoProcessing({
    //   orderId,
    //   brandId: body.brandId,
    //   players: body.players,
    //   photoLocations: uploadedPhotos,
    // });

    // Mock response for now
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json(
      {
        success: true,
        orderId,
        status: 'IN_PRODUCTION',
        message: 'Order created successfully. Photos are being processed.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);

    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
