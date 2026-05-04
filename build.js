const fs = require('fs');
const apiKey = process.env.GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY_HERE';
fs.writeFileSync('config.js', `const API_KEY = '${apiKey}';\n`);
console.log('✅ config.js created');
