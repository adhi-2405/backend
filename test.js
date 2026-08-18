require('dotenv').config();
const { evaluateCode } = require('./services/aiService');
evaluateCode('console.log("Hello World")', 'javascript', {
  title: 'Test',
  description: '',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  sampleInput: '',
  sampleOutput: 'Hello World',
  hiddenInput1: '',
  hiddenOutput1: 'Hello World',
  hiddenInput2: '',
  hiddenOutput2: 'Hello World'
}).then(console.log).catch(console.error);
