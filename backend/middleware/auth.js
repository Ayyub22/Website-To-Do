const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'TaskFlowSecretDefaultKey');

      // Add user info to request
      req.user = decoded;

      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      res.status(401).json({
        success: false,
        message: 'Akses ditolak, sesi telah kadaluarsa atau tidak valid',
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak, tidak ada token',
    });
  }
};

module.exports = protect;
