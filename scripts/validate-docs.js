#!/usr/bin/env node

/**
 * Documentation Link Validator
 * Checks all markdown files for broken internal links after documentation restructure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// Files that should exist after restructure
const expectedFiles = [
  'README.md',
  'docs/setup-and-configuration.md',
  'docs/tools-reference.md',
  'docs/usage-examples.md', 
  'docs/testing.md',
  'docs/troubleshooting.md',
  'docs/development.md'
];

// Files that should be removed
const removedFiles = [
  'docs/installation.md',
  'docs/configuration.md',
  'docs/security.md',
  'docs/authentication.md'
];

function findMarkdownFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findMarkdownFiles(fullPath, files);
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function extractLinks(content) {
  // Match markdown links: [text](link)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, text, url] = match;
    
    // Only check internal markdown links
    if (url.endsWith('.md') || url.includes('.md#')) {
      links.push({
        text: text,
        url: url,
        fullMatch: fullMatch
      });
    }
  }
  
  return links;
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const links = extractLinks(content);
  const issues = [];
  
  for (const link of links) {
    let targetPath = link.url;
    
    // Handle anchors
    if (targetPath.includes('#')) {
      targetPath = targetPath.split('#')[0];
    }
    
    // Convert relative path to absolute
    const baseDir = path.dirname(filePath);
    const absolutePath = path.resolve(baseDir, targetPath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      issues.push({
        type: 'missing_file',
        link: link,
        targetPath: absolutePath
      });
    }
  }
  
  return issues;
}

function main() {
  console.log('🔍 Validating documentation links after restructure...\n');
  
  // Check expected files exist
  console.log('📁 Checking expected files...');
  let allExpectedExist = true;
  
  for (const file of expectedFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      allExpectedExist = false;
    }
  }
  
  // Check removed files are gone
  console.log('\n🗑️  Checking removed files...');
  let allRemovedGone = true;
  
  for (const file of removedFiles) {
    const fullPath = path.join(projectRoot, file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file} - removed`);
    } else {
      console.log(`  ⚠️  ${file} - still exists`);
      allRemovedGone = false;
    }
  }
  
  // Validate all markdown file links
  console.log('\n🔗 Validating internal links...');
  const markdownFiles = findMarkdownFiles(projectRoot);
  let totalIssues = 0;
  
  for (const file of markdownFiles) {
    const relativePath = path.relative(projectRoot, file);
    const issues = validateFile(file);
    
    if (issues.length === 0) {
      console.log(`  ✅ ${relativePath}`);
    } else {
      console.log(`  ❌ ${relativePath} - ${issues.length} broken link(s)`);
      for (const issue of issues) {
        console.log(`    • "${issue.link.text}" -> ${issue.link.url}`);
      }
      totalIssues += issues.length;
    }
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`  • Expected files: ${allExpectedExist ? '✅ All present' : '❌ Some missing'}`);
  console.log(`  • Removed files: ${allRemovedGone ? '✅ All removed' : '⚠️ Some remain'}`);
  console.log(`  • Broken links: ${totalIssues === 0 ? '✅ None found' : `❌ ${totalIssues} found`}`);
  
  if (allExpectedExist && allRemovedGone && totalIssues === 0) {
    console.log('\n🎉 Documentation restructure validation successful!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Documentation restructure needs attention.');
    process.exit(1);
  }
}

main();
