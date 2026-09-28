import fs from 'fs';
import path from 'path';

const TOKEN = process.argv[2];
const REPO_OWNER = "Karthi2007-keyan";
const REPO_NAME = "Safeway-3dDashboard";
const ROOT_DIR = process.cwd();

if (!TOKEN) {
  console.error("Please provide GitHub PAT Token");
  process.exit(1);
}

// Recursively get all files to upload
function getFiles(dirPath) {
  let results = [];
  const list = fs.readdirSync(dirPath);
  list.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    // Skip git, node_modules, dist, and temporary scripts
    if (
      relativePath.startsWith('.git') ||
      relativePath.startsWith('node_modules') ||
      relativePath.startsWith('dist') ||
      relativePath.endsWith('.js') && relativePath.includes('git_')
    ) {
      return;
    }

    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      results.push({ fullPath, relativePath });
    }
  });
  return results;
}

async function getExistingSha(filePath) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'SafeWay-Uploader'
      }
    });
    if (res.status === 200) {
      const data = await res.json();
      return data.sha;
    }
  } catch (e) {}
  return null;
}

async function uploadFile({ fullPath, relativePath }) {
  const content = fs.readFileSync(fullPath);
  const base64Content = content.toString('base64');
  const existingSha = await getExistingSha(relativePath);

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${relativePath}`;
  const body = {
    message: `Add ${relativePath}`,
    content: base64Content,
    branch: 'main'
  };
  if (existingSha) {
    body.sha = existingSha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SafeWay-Uploader'
    },
    body: JSON.stringify(body)
  });

  if (response.ok) {
    console.log(`[SUCCESS] Uploaded: ${relativePath}`);
    return true;
  } else {
    const errText = await response.text();
    console.error(`[ERROR] Failed to upload ${relativePath}:`, errText);
    return false;
  }
}

async function main() {
  const files = getFiles(ROOT_DIR);
  console.log(`Found ${files.length} project files to upload to ${REPO_OWNER}/${REPO_NAME}...`);

  for (let i = 0; i < files.length; i++) {
    console.log(`[${i + 1}/${files.length}] Uploading ${files[i].relativePath}...`);
    await uploadFile(files[i]);
  }

  console.log("\nALL FILES UPLOADED SUCCESSFULLY TO GITHUB!");
}

main().catch(console.error);
