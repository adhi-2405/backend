const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { getResults, updateResults, getQuestions, updateQuestions, getUsers } = require('../services/jsonbin');

router.use(authenticate);
router.use(requireAdmin);

// Get all teams (for dashboard)
router.get('/teams', async (req, res) => {
    try {
        const results = await getResults();
        const questions = await getQuestions();
        const users = await getUsers();
        
        // merge with question titles for easy display
        const augmentedTeams = results.teams.map(t => {
            let qTitle = 'None';
            if (t.assignedQuestion) {
                const q = questions.questions.find(q => q.id === t.assignedQuestion);
                if (q) qTitle = q.title;
            }
            return {
                ...t,
                questionTitle: qTitle
            };
        });

        res.json(augmentedTeams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset event
router.post('/reset', async (req, res) => {
    try {
        const results = await getResults();
        
        results.teams.forEach(t => {
            t.loginTime = null;
            t.securityActive = false;
            t.assignedQuestion = null;
            t.answer = null;
            t.submittedAt = null;
            t.status = "NOT_STARTED";
            t.violations = [];
            t.disqualified = false;
        });

        await updateResults(results);
        res.json({ success: true, message: 'Event reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset a specific team
router.post('/reset/:teamId', async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const results = await getResults();
        
        let teamData = results.teams.find(t => t.teamId === teamId);
        if (!teamData) return res.status(404).json({ error: 'Team not found' });
        
        teamData.loginTime = null;
        teamData.securityActive = false;
        teamData.assignedQuestion = null;
        teamData.answer = null;
        teamData.submittedAt = null;
        teamData.status = "NOT_STARTED";
        teamData.violations = [];
        teamData.disqualified = false;

        await updateResults(results);
        res.json({ success: true, message: `Team ${teamId} reset successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Questions management
router.get('/questions', async (req, res) => {
    try {
        const questions = await getQuestions();
        res.json(questions.questions);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get detailed team view
router.get('/team/:teamId', async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const results = await getResults();
        const teamData = results.teams.find(t => t.teamId === teamId);
        if (!teamData) return res.status(404).json({ error: 'Team not found' });
        
        const questions = await getQuestions();
        let qTitle = 'None';
        if (teamData.assignedQuestion) {
            const q = questions.questions.find(q => q.id === teamData.assignedQuestion);
            if (q) qTitle = q.title;
        }

        res.json({ ...teamData, questionTitle: qTitle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
