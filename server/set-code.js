// Usage: npm run set-code -- <creator-id> [code]   (generates a code if omitted)
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { hashCode } = require('./auth');

const file = process.env.CREATORS_FILE || path.join(__dirname, 'data', 'creators.json');
const [id, provided] = process.argv.slice(2);
const creators = JSON.parse(fs.readFileSync(file, 'utf8'));
const creator = creators.find((c) => c.id === id);
if (!creator) {
  console.error('Unknown creator id. Available: ' + creators.map((c) => c.id).join(', '));
  process.exit(1);
}
const code = provided || crypto.randomBytes(6).toString('base64url');
creator.codeHash = hashCode(code);
fs.writeFileSync(file, JSON.stringify(creators, null, 2) + '\n');
console.log(`Login code for ${creator.name}: ${code}`);
console.log('Send this to the creator privately; only a hash is stored.');
