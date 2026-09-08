const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'arjun_nma_super_secret_jwt_key_2026_skillup', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'arjun_nma_super_secret_jwt_key_2026_skillup');
};

module.exports = { generateToken, verifyToken };
