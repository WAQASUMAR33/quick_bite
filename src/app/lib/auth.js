import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function authMiddleware(handler) {
  return async (request, ...args) => {
    try {
      // Get Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid Authorization header' },
          { status: 401 }
        );
      }

      // Extract token
      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach admin data to request
      request.admin = decoded;

      // Call the handler
      return await handler(request, ...args);
    } catch (error) {
      console.error('Authentication error:', error.name, error.message);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}