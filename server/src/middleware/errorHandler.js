const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log השגיאה
  console.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const message = 'כתובת מייל או שם משתמש כבר קיימים במערכת';
    error = {
      message,
      statusCode: 400,
      type: 'DuplicateField'
    };
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400,
      type: 'ValidationError'
    };
  }

  // MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'המשאב לא נמצא';
    error = {
      message,
      statusCode: 404,
      type: 'NotFound'
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'טוקן אימות לא תקין';
    error = {
      message,
      statusCode: 401,
      type: 'AuthenticationError'
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'טוקן אימות פג תוקף';
    error = {
      message,
      statusCode: 401,
      type: 'AuthenticationError'
    };
  }

  // Email connection errors
  if (err.message && err.message.includes('IMAP')) {
    error = {
      message: 'שגיאה בחיבור לשרת IMAP',
      statusCode: 400,
      type: 'EmailConnectionError',
      details: err.message
    };
  }

  if (err.message && err.message.includes('SMTP')) {
    error = {
      message: 'שגיאה בחיבור לשרת SMTP',
      statusCode: 400,
      type: 'EmailConnectionError',
      details: err.message
    };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = {
      message: 'יותר מדי בקשות - נסה שוב מאוחר יותר',
      statusCode: 429,
      type: 'RateLimitError'
    };
  }

  // Default server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'שגיאה פנימית בשרת';
  const type = error.type || 'InternalServerError';

  // Response structure
  const response = {
    success: false,
    error: {
      type,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error.details
      })
    },
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(statusCode).json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`הנתיב ${req.originalUrl} לא נמצא`);
  error.statusCode = 404;
  error.type = 'NotFound';
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound
}; 