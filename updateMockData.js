const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, 'mockData.json');
const mockDb = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

mockDb.questions.questions.forEach(q => {
    q.hiddenInput1 = q.hiddenInput;
    q.hiddenOutput1 = q.hiddenOutput;
    
    // Determine hiddenInput2 and hiddenOutput2 based on question id
    switch(q.id) {
        case 1: // Star Pattern Printing
            q.hiddenInput2 = "3";
            q.hiddenOutput2 = "*\n**\n***";
            break;
        case 2: // Second Largest Element
            q.hiddenInput2 = "4\n10 10 5 8";
            q.hiddenOutput2 = "8";
            break;
        case 3: // Reverse Words in a Sentence
            q.hiddenInput2 = "I love programming";
            q.hiddenOutput2 = "programming love I";
            break;
        case 4: // Prime Number Checker
            q.hiddenInput2 = "21";
            q.hiddenOutput2 = "NOT PRIME";
            break;
        case 5: // Fibonacci Series Sum
            q.hiddenInput2 = "4";
            q.hiddenOutput2 = "4";
            break;
        case 6: // Palindrome String
            q.hiddenInput2 = "hello";
            q.hiddenOutput2 = "NOT PALINDROME";
            break;
        case 7: // Array Left Rotation
            q.hiddenInput2 = "4 1\n1 2 3 4";
            q.hiddenOutput2 = "2 3 4 1";
            break;
        case 8: // Count Vowels and Consonants
            q.hiddenInput2 = "hello";
            q.hiddenOutput2 = "Vowels: 2, Consonants: 3";
            break;
        case 9: // Sum of Digits Single Digit
            q.hiddenInput2 = "38";
            q.hiddenOutput2 = "2";
            break;
        case 10: // Find Missing Number
            q.hiddenInput2 = "3\n1 3 4";
            q.hiddenOutput2 = "2";
            break;
        case 11: // Anagram Check
            q.hiddenInput2 = "hello world";
            q.hiddenOutput2 = "NOT ANAGRAM";
            break;
        case 12: // Matrix Transpose
            q.hiddenInput2 = "2 2\n1 2\n3 4";
            q.hiddenOutput2 = "1 3\n2 4";
            break;
        case 13: // Longest Word in String
            q.hiddenInput2 = "a bb ccc dddd";
            q.hiddenOutput2 = "dddd";
            break;
        case 14: // Factorial Calculation
            q.hiddenInput2 = "4";
            q.hiddenOutput2 = "24";
            break;
        case 15: // Check Armstrong Number
            q.hiddenInput2 = "123";
            q.hiddenOutput2 = "NOT ARMSTRONG";
            break;
        default:
            q.hiddenInput2 = q.hiddenInput;
            q.hiddenOutput2 = q.hiddenOutput;
    }
    
    delete q.hiddenInput;
    delete q.hiddenOutput;
});

fs.writeFileSync(mockDataPath, JSON.stringify(mockDb, null, 2));
console.log("Updated mockData.json");
