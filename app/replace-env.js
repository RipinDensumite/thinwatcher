const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const files = fs.readdirSync(distPath);

files.forEach(file => {
  const filePath = path.join(distPath, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace placeholders with actual environment variables
  const updatedContent = content
    .replace('__VITE_BACKEND_API_URL__', process.env.VITE_BACKEND_API_URL)
    .replace('__VITE_API_KEY__', process.env.VITE_API_KEY);
  
  fs.writeFileSync(filePath, updatedContent);
});
