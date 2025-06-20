#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupVLLM() {
  console.log('🚀 DataLab vLLM Setup');
  console.log('=====================');
  console.log('');
  console.log('This script will configure vLLM integration for DataLab.');
  console.log('vLLM allows you to run AI models locally for enhanced data processing.');
  console.log('');

  // Check if user wants to proceed
  const proceed = await question('Would you like to configure vLLM? (y/N): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    console.log('Setup cancelled.');
    rl.close();
    return;
  }

  console.log('');
  console.log('📝 Configuration Options:');
  console.log('');

  // Get vLLM endpoint URL
  const defaultEndpoint = 'http://localhost:8000';
  const endpoint = await question(`Enter vLLM endpoint URL [${defaultEndpoint}]: `);
  const vllmEndpoint = endpoint.trim() || defaultEndpoint;

  // Get model name
  const defaultModel = 'microsoft/Phi-3-mini-4k-instruct';
  console.log('');
  console.log('Available models:');
  console.log('1. microsoft/Phi-3-mini-4k-instruct (3.8B - Fast, efficient)');
  console.log('2. microsoft/Phi-3-small-8k-instruct (7B - Better reasoning)');
  console.log('3. meta-llama/Meta-Llama-3.1-8B-Instruct (8B - Most capable)');
  console.log('4. mistralai/Mistral-7B-Instruct-v0.3 (7B - Multilingual)');
  console.log('5. Custom model name');
  console.log('');

  const modelChoice = await question('Select model (1-5) [1]: ');
  let modelName = defaultModel;

  switch (modelChoice.trim()) {
    case '2':
      modelName = 'microsoft/Phi-3-small-8k-instruct';
      break;
    case '3':
      modelName = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
      break;
    case '4':
      modelName = 'mistralai/Mistral-7B-Instruct-v0.3';
      break;
    case '5':
      modelName = await question('Enter custom model name: ');
      break;
    default:
      modelName = defaultModel;
  }

  // Check for existing .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove existing vLLM configuration
  const lines = envContent.split('\n').filter(line => 
    !line.startsWith('VLLM_ENDPOINT_URL=') && 
    !line.startsWith('VLLM_MODEL_NAME=') &&
    !line.startsWith('# vLLM')
  );

  // Add vLLM configuration
  lines.push('');
  lines.push('# vLLM Endpoint Configuration (Alternative to Claude)');
  lines.push('# If VLLM_ENDPOINT_URL is set, it will be used instead of Claude');
  lines.push(`VLLM_ENDPOINT_URL="${vllmEndpoint}"`);
  lines.push(`VLLM_MODEL_NAME="${modelName}"`);

  // Write updated configuration
  fs.writeFileSync(envPath, lines.join('\n'));

  console.log('');
  console.log('✅ vLLM configuration saved!');
  console.log('');
  console.log('📋 Configuration Summary:');
  console.log(`   Endpoint: ${vllmEndpoint}`);
  console.log(`   Model: ${modelName}`);
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('');
  console.log('1. Install vLLM (if not already installed):');
  console.log('   pip install vllm');
  console.log('');
  console.log('2. Start vLLM server:');
  console.log(`   python -m vllm.entrypoints.openai.api_server \\`);
  console.log(`     --model ${modelName} \\`);
  console.log(`     --host 0.0.0.0 \\`);
  console.log(`     --port ${new URL(vllmEndpoint).port || '8000'}`);
  console.log('');
  console.log('3. Start DataLab:');
  console.log('   npm run dev');
  console.log('');
  console.log('📖 For detailed setup instructions, see: VLLM_INTEGRATION.md');
  console.log('');
  console.log('🎉 Your vLLM integration is now configured!');

  rl.close();
}

// Handle Ctrl+C
rl.on('SIGINT', () => {
  console.log('\n\nSetup interrupted.');
  process.exit(0);
});

// Run setup
setupVLLM().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
});
