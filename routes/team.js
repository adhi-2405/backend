const express = require('express');
const router = express.Router();
const { authenticate, requireTeam } = require('../middleware/authMiddleware');
const { getResults, updateResults, getQuestions } = require('../services/jsonbin');
const { evaluateCode } = require('../services/aiService');

router.use(authenticate);

// Get current status of a team
router.get('/:teamId', requireTeam, async (req, res) => {
    try {
        const results = await getResults();
        const teamData = results.teams.find(t => t.teamId === req.params.teamId);
        if (!teamData) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(teamData);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Assign random question to team
router.post('/:teamId/assign', requireTeam, async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const resultsData = await getResults();
        const questionsData = await getQuestions();
        
        let teamData = resultsData.teams.find(t => t.teamId === teamId);
        if (!teamData) return res.status(404).json({ error: 'Team not found' });

        if (teamData.status === 'DISQUALIFIED') {
            return res.status(403).json({ error: 'Team is disqualified' });
        }
        if (teamData.status === 'COMPLETED' || teamData.status === 'SUBMITTED') {
            return res.status(403).json({ error: 'Challenge already submitted' });
        }

        // If already assigned, just return it
        if (teamData.assignedQuestion) {
            const q = questionsData.questions.find(q => q.id === teamData.assignedQuestion);
            if (!teamData.securityActive) {
                teamData.loginTime = new Date().toISOString();
                teamData.securityActive = true;
                teamData.status = 'ACTIVE';
                await updateResults(resultsData);
            }
            return res.json({ question: q, team: teamData });
        }

        // Find assigned question IDs
        const assignedIds = resultsData.teams.map(t => t.assignedQuestion).filter(id => id !== null);
        const availableQuestions = questionsData.questions.filter(q => q.active && !assignedIds.includes(q.id));
        
        let assignedQ;
        if (availableQuestions.length > 0) {
            // Pick a random available question
            const randIndex = Math.floor(Math.random() * availableQuestions.length);
            assignedQ = availableQuestions[randIndex];
        } else {
            // If all questions are assigned (more teams than questions, or some questions inactive), pick any active question
            const allActive = questionsData.questions.filter(q => q.active);
            const randIndex = Math.floor(Math.random() * allActive.length);
            assignedQ = allActive[randIndex];
        }

        teamData.assignedQuestion = assignedQ.id;
        teamData.loginTime = new Date().toISOString();
        teamData.securityActive = true;
        teamData.status = 'ACTIVE';

        await updateResults(resultsData);

        res.json({ question: assignedQ, team: teamData });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Run code using Gemini API
router.post('/:teamId/run', requireTeam, async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { code, language } = req.body;
        
        const resultsData = await getResults();
        let teamData = resultsData.teams.find(t => t.teamId === teamId);
        
        if (!teamData) return res.status(404).json({ error: 'Team not found' });
        if (teamData.status === 'DISQUALIFIED') return res.status(403).json({ error: 'Team is disqualified' });
        if (teamData.status === 'COMPLETED' || teamData.status === 'SUBMITTED') return res.status(403).json({ error: 'Already submitted' });
        
        if (!teamData.assignedQuestion) {
            return res.status(400).json({ error: 'No question assigned yet' });
        }

        const questionsData = await getQuestions();
        const question = questionsData.questions.find(q => q.id === teamData.assignedQuestion);

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const evaluationResult = await evaluateCode(code, language, question);
        res.json(evaluationResult);

    } catch (err) {
        console.error("Error in /run route:", err);
        res.status(500).json({ error: 'Internal server error during code execution' });
    }
});

// Submit code
router.post('/:teamId/submit', requireTeam, async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { code } = req.body;
        
        const resultsData = await getResults();
        let teamData = resultsData.teams.find(t => t.teamId === teamId);
        
        if (!teamData) return res.status(404).json({ error: 'Team not found' });
        if (teamData.status === 'DISQUALIFIED') return res.status(403).json({ error: 'Team is disqualified' });
        if (teamData.status === 'COMPLETED' || teamData.status === 'SUBMITTED') return res.status(403).json({ error: 'Already submitted' });

        teamData.answer = code;
        teamData.submittedAt = new Date().toISOString();
        teamData.status = 'SUBMITTED';

        await updateResults(resultsData);

        res.json({ success: true, team: teamData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Report violation
router.post('/:teamId/violation', requireTeam, async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { event, reason } = req.body; // e.g., TAB_SWITCH, DEVTOOLS_DETECTED
        
        const resultsData = await getResults();
        let teamData = resultsData.teams.find(t => t.teamId === teamId);
        
        if (!teamData) return res.status(404).json({ error: 'Team not found' });
        if (teamData.status === 'DISQUALIFIED') return res.json({ success: true, team: teamData }); // already disqualified

        // Only disqualify if past grace period. Frontend handles grace period, but backend acts on request.
        teamData.violations.push({
            event,
            reason,
            timestamp: new Date().toISOString()
        });
        
        teamData.status = 'DISQUALIFIED';
        teamData.disqualified = true;

        await updateResults(resultsData);

        res.json({ success: true, team: teamData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
