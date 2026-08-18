const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'code_the_output_secret_2026';

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: 'Admin access required' });
    }
};

const requireTeam = (req, res, next) => {
    if (req.user && req.user.role === 'team') {
        // also check if the teamId in URL matches the token (if route has :teamId)
        if (req.params.teamId && req.params.teamId !== req.user.username) {
            return res.status(403).json({ error: 'Access forbidden to this team data' });
        }
        next();
    } else {
        return res.status(403).json({ error: 'Team access required' });
    }
};

module.exports = { authenticate, requireAdmin, requireTeam, JWT_SECRET };
