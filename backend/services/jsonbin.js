const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.JSONBIN_API_KEY;
const USERS_BIN = process.env.JSONBIN_USERS_BIN;
const QUESTIONS_BIN = process.env.JSONBIN_QUESTIONS_BIN;
const RESULTS_BIN = process.env.JSONBIN_RESULTS_BIN;

const useMock = !API_KEY || !USERS_BIN || !QUESTIONS_BIN || !RESULTS_BIN;

if (useMock) {
    console.log("⚠️ JSONBin credentials missing. Using in-memory mock database.");
}

const mockDataPath = path.join(__dirname, '..', 'mockData.json');

let mockDb = {
    users: { users: [], admin: {} },
    questions: { questions: [] },
    results: { teams: [] }
};

// Initialize mock DB
if (useMock) {
    if (fs.existsSync(mockDataPath)) {
        mockDb = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    } else {
        // Generate 15 teams
        for (let i = 1; i <= 15; i++) {
            const teamId = `TEAM${i.toString().padStart(2, '0')}`;
            mockDb.users.users.push({
                username: teamId,
                password: `${teamId}@123`,
                role: "team",
                active: true
            });
            mockDb.results.teams.push({
                teamId: teamId,
                loginTime: null,
                securityActive: false,
                assignedQuestion: null,
                answer: null,
                submittedAt: null,
                status: "NOT_STARTED", // NOT_STARTED, ACTIVE, SUBMITTED, DISQUALIFIED, COMPLETED
                violations: [],
                disqualified: false
            });
        }
        mockDb.users.admin = {
            username: "ADMIN",
            password: "ADMINVEC@123",
            role: "admin"
        };
        
        const questionTitles = [
            "Star Pattern Printing", "Second Largest Element", "Factorial of a Number",
            "Sort an Array Without Built-in Functions", "Palindrome", "Check Vowels and Consonants",
            "Reverse Words in a String", "Fibonacci", "Count the Number of Digits in an Integer",
            "Find Repeating Numbers in an Array", "Perfect Number", "Armstrong Number",
            "Row With Maximum Sum", "Transpose a Matrix", "Check if Two Arrays Are Equal"
        ];
        
        questionTitles.forEach((title, idx) => {
            mockDb.questions.questions.push({
                id: idx + 1,
                title: title,
                description: `Write a program to solve: ${title}`,
                difficulty: "Medium",
                inputFormat: "Standard input",
                outputFormat: "Standard output",
                constraints: "Time limit: 1s",
                sampleInput: "Sample Input",
                sampleOutput: "Sample Output",
                expectedConcept: "Basic Programming",
                active: true
            });
        });
        
        fs.writeFileSync(mockDataPath, JSON.stringify(mockDb, null, 2));
    }
}

const getHeaders = () => ({
    'X-Master-Key': API_KEY,
    'Content-Type': 'application/json'
});

async function getBin(binId, type) {
    if (useMock) {
        return mockDb[type];
    }
    try {
        const response = await axios.get(`https://api.jsonbin.io/v3/b/${binId}/latest`, { headers: getHeaders() });
        return response.data.record;
    } catch (error) {
        console.error(`Error fetching bin ${binId}:`, error.message);
        return null;
    }
}

async function updateBin(binId, data, type) {
    if (useMock) {
        mockDb[type] = data;
        fs.writeFileSync(mockDataPath, JSON.stringify(mockDb, null, 2));
        return data;
    }
    try {
        const response = await axios.put(`https://api.jsonbin.io/v3/b/${binId}`, data, { headers: getHeaders() });
        return response.data.record;
    } catch (error) {
        console.error(`Error updating bin ${binId}:`, error.message);
        return null;
    }
}

module.exports = {
    getUsers: () => getBin(USERS_BIN, 'users'),
    updateUsers: (data) => updateBin(USERS_BIN, data, 'users'),
    getQuestions: () => getBin(QUESTIONS_BIN, 'questions'),
    updateQuestions: (data) => updateBin(QUESTIONS_BIN, data, 'questions'),
    getResults: () => getBin(RESULTS_BIN, 'results'),
    updateResults: (data) => updateBin(RESULTS_BIN, data, 'results')
};
