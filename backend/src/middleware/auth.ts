import { Request, Response, NextFunction } from 'express';
import { APIKeyService } from '../services/api-keys';
import { APIKey } from '../models/api-types';

declare global {
  namespace Express {
    interface Request {
      apiKey?: APIKey;
      tenantId?: string;
    }
  }
}

export class AuthMiddleware {
  private apiKeyService: APIKeyService;

  constructor() {
    this.apiKeyService = new APIKeyService();
  }

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Missing or invalid authorization header',
          message: 'Please provide a valid API key using Bearer token'
        });
        return;
      }

      const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Development bypass for testing
      if (process.env.NODE_ENV === 'development' && apiKey === 'pk_live_test') {
        req.apiKey = {
          id: 'test_key',
          key: 'pk_live_test',
          tenantId: 'mvp',
          name: 'Test Key',
          permissions: ['*'],
          isActive: true,
          createdAt: Date.now(),
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerHour: 10000
          }
        };
        req.tenantId = 'mvp';
        next();
        return;
      }

      const validatedKey = await this.apiKeyService.validateAPIKey(apiKey);

      if (!validatedKey) {
        res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is invalid or has been revoked'
        });
        return;
      }

      // Attach API key and tenant info to request
      req.apiKey = validatedKey;
      req.tenantId = validatedKey.tenantId;

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        message: 'Internal server error during authentication'
      });
      return;
    }
  };

  requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.apiKey) {
        res.status(401).json({
          error: 'Authentication required'
        });
        return;
      }

      if (!this.apiKeyService.hasPermission(req.apiKey, permission)) {
        res.status(403).json({
          error: 'Insufficient permissions',
          message: `This API key does not have permission: ${permission}`
        });
        return;
      }

      next();
    };
  };

  rateLimit = (requestsPerMinute: number = 60) => {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.apiKey) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const keyId = req.apiKey.id;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const resetTime = now + windowMs;

      let requestData = requestCounts.get(keyId);

      if (!requestData || now > requestData.resetTime) {
        requestData = { count: 1, resetTime };
        requestCounts.set(keyId, requestData);
      } else {
        requestData.count++;
      }

      // Use API key's specific rate limit if available
      const limit = req.apiKey.rateLimit?.requestsPerMinute || requestsPerMinute;

      if (requestData.count > limit) {
        const remainingTime = Math.ceil((requestData.resetTime - now) / 1000);

        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${remainingTime} seconds`,
          limit,
          remaining: 0,
          resetTime: requestData.resetTime
        });
        return;
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': (limit - requestData.count).toString(),
        'X-RateLimit-Reset': Math.ceil(requestData.resetTime / 1000).toString()
      });

      next();
    };
  };
}