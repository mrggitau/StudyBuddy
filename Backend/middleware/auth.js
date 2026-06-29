// This checks if the student has a valid JWT token before allowing access
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Get the token from the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ 
            message: 'Access denied. No token provided.' 
        });
    }

    try {
        // Verify the token using the secret key from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (err) {
        res.status(401).json({ 
            message: 'Invalid token.' 
        });
    }
};