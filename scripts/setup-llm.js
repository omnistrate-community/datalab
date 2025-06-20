#!/usr/bin/env node

/**
 * Setup script for DataLab LLM integration
 * This script helps configure the OpenAI API key for real LLM processing
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function updateEnvFile(apiKey) {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = `# Claude (Anthropic) API Configuration
ANTHROPIC_API_KEY=${apiKey}

# Note: Keep your API key secure and never commit it to version control
# Get your API key from: https://console.anthropic.com/
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Successfully updated .env.local with your Anthropic API key');
    console.log('🔐 Your API key is now configured for Claude LLM processing');
    console.log('🚀 You can now run: npm run dev');
  } catch (error) {
    console.error('❌ Error updating .env.local:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('🤖 DataLab AI Setup');
  console.log('===================');
  console.log();
  console.log('DataLab supports multiple AI processing backends:');
  console.log('• Claude (Anthropic) - Cloud-based AI with high capability');
  console.log('• vLLM - Local AI server for privacy and cost control');
  console.log('• Local Processing - Intelligent fallback (always available)');
  console.log();
  console.log('This script configures Claude. For vLLM setup, run: npm run setup-vllm');
  console.log();
  console.log('To get a Claude API key:');
  console.log('1. Visit https://console.anthropic.com/');
  console.log('2. Create a new API key');
  console.log('3. Copy the key and paste it below');
  console.log();

  rl.question('Enter your Anthropic API key (or press Enter to skip): ', (apiKey) => {
    apiKey = apiKey.trim();
    
    if (!apiKey) {
      console.log('⚠️  No API key provided. The app will use local processing fallback.');
      console.log('🔧 You can configure this later by editing .env.local');
    } else if (!apiKey.startsWith('sk-ant-')) {
      console.log('❌ Invalid API key format. Anthropic keys should start with "sk-ant-"');
      process.exit(1);
    } else {
      updateEnvFile(apiKey);
    }
    
    rl.close();
  });
}

if (require.main === module) {
  main();
}
