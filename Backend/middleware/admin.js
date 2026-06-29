// This checks if the logged-in user has admin privileges
module.exports = (req, res, next) => {
    
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Admin access required. You do not have permission to view this page.' 
        });
    }
    next(); 
};