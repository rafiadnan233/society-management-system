const fs = require('fs');

const files = [
  'src/pages/Complaints.tsx',
  'src/pages/Reports.tsx',
  'src/pages/Flats.tsx',
  'src/pages/Staff.tsx',
  'src/pages/Members.tsx',
  'src/pages/Expenses.tsx',
  'src/pages/Construction.tsx',
  'src/pages/Visitors.tsx',
  'src/pages/Payments.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Notices.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Using regex to remove the <button> that has onClick containing window.print
    // Need to handle React syntax carefully.
    content = content.replace(/<button\b[^>]*?onClick=\{\s*\(\)\s*=>\s*\{\s*window\.focus\(\);\s*window\.print\(\);\s*\}\s*\}[^]*?<\/button>\s*?/g, '');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
  }
});
