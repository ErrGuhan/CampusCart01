import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product';
import { AuthenticatedRequest } from '../middleware/auth';

export class ProductController {
  /**
   * Get products feed with high-performance Cursor-Based Pagination
   * GET /api/products?limit=20&cursor=...&category=...&campusSector=...
   */
  public static async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const cursor = req.query.cursor as string; // ISO date string or composite cursor
      const category = req.query.category as string;
      const campusSector = req.query.campusSector as string;
      const condition = req.query.condition as string;

      // Base query for active, approved marketplace listings
      const query: any = { status: 'active' };

      if (category && category !== 'All') {
        query.category = category;
      }

      if (campusSector) {
        query.campusSector = campusSector;
      }

      if (condition) {
        query.condition = condition;
      }

      // Apply cursor filter for infinite scrolling feed
      if (cursor) {
        try {
          const cursorDate = new Date(cursor);
          if (!isNaN(cursorDate.getTime())) {
            query.createdAt = { $lt: cursorDate };
          }
        } catch {}
      }

      // Query with compound index matching: { campusId: 1, category: 1, createdAt: -1 }
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1) // Fetch 1 extra item to determine next cursor
        .populate('sellerId', 'displayName username trustScore isVerified avatarUrl department');

      const hasNextPage = products.length > limit;
      const items = hasNextPage ? products.slice(0, limit) : products;
      const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

      res.status(200).json({
        success: true,
        data: items,
        pagination: {
          hasNextPage,
          nextCursor,
          count: items.length,
        },
      });
    } catch (err: any) {
      console.error('[Product Controller] Error fetching products:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve products feed.',
      });
    }
  }

  /**
   * MongoDB 2dsphere Spatial Radius Search
   * GET /api/products/nearby?lng=79.1559&lat=12.9692&radiusKm=3
   */
  public static async getNearbyProducts(req: Request, res: Response): Promise<void> {
    try {
      const lng = parseFloat(req.query.lng as string);
      const lat = parseFloat(req.query.lat as string);
      const radiusKm = parseFloat(req.query.radiusKm as string) || 5; // Default 5 km campus radius
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

      if (isNaN(lng) || isNaN(lat)) {
        res.status(400).json({
          success: false,
          error: 'Valid longitude (lng) and latitude (lat) query parameters are required.',
        });
        return;
      }

      // Convert radius in kilometers to radians (Earth radius approx 6,378.1 km)
      const radiusRadians = radiusKm / 6378.1;

      const nearbyProducts = await Product.find({
        status: 'active',
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radiusRadians],
          },
        },
      })
        .limit(limit)
        .populate('sellerId', 'displayName username trustScore isVerified avatarUrl department')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        center: { lng, lat, radiusKm },
        count: nearbyProducts.length,
        data: nearbyProducts,
      });
    } catch (err: any) {
      console.error('[Product Controller] Spatial Query Error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to execute geospatial search query.',
      });
    }
  }

  /**
   * Get single product by ID
   */
  public static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid product ID format.' });
        return;
      }

      const product = await Product.findById(id).populate(
        'sellerId',
        'displayName username trustScore isVerified avatarUrl department email'
      );

      if (!product) {
        res.status(404).json({ success: false, error: 'Product not found.' });
        return;
      }

      // Increment view count asynchronously
      Product.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } }).exec();

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Error fetching product.' });
    }
  }

  /**
   * Create new product listing (requires authentication)
   */
  public static async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized.' });
        return;
      }

      const {
        title,
        description,
        price,
        originalPrice,
        category,
        images,
        campusSector,
        pickupLocation,
        condition,
        coordinates,
      } = req.body;

      if (!title || !description || price === undefined || !category || !images?.length) {
        res.status(400).json({
          success: false,
          error: 'Title, description, price, category, and at least 1 image are required.',
        });
        return;
      }

      const [lng, lat] = Array.isArray(coordinates) && coordinates.length === 2
        ? coordinates
        : [79.1559, 12.9692];

      const product = new Product({
        title,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        category,
        images,
        sellerId: req.user.userId,
        campusSector: campusSector || 'Central Campus',
        pickupLocation: pickupLocation || 'Student Center Lobby',
        condition: condition || 'Like New',
        status: req.user.role === 'admin' ? 'active' : 'pending_approval',
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      });

      await product.save();

      res.status(201).json({
        success: true,
        message: 'Product listed successfully.',
        data: product,
      });
    } catch (err: any) {
      console.error('[Product Controller] Create Product Error:', err);
      res.status(500).json({ success: false, error: 'Failed to create product listing.' });
    }
  }
}
