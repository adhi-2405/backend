const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getUsers } = require('../services/jsonbin');
const { JWT_SECRET } = require('../middleware/authMiddleware');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const data = await getUsers();
        if (!data) {
            return res.status(500).json({ error: 'Failed to connect to database' });
        }

        const teamUser = data.users.find(u => u.username === username && u.password === password && u.active);
        const adminUser = data.admin.username === username && data.admin.password === password ? data.admin : null;

        const user = adminUser || teamUser;
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
        
        return res.json({
            token,
            user: { username: user.username, role: user.role }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
