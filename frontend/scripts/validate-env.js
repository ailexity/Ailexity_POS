#!/usr/bin/env node
// Validate environment variables before production build

const requiredEnvVars = ['VITE_API_URL'];

let hasErrors = false;

console.log('🔍 Validating environment variables for production build...\n');

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.error(`❌ ERROR: ${varName} is not set!`);
        hasErrors = true;
    } else {
        console.log(`✅ ${varName} = ${value}`);
    }
});

if (hasErrors) {
    console.error('\n❌ Build validation failed!');
    console.error('\nCreate frontend/.env with required variables:');
    console.error('  VITE_API_URL=/api  (for production with nginx)');
    console.error('  VITE_API_URL=http://localhost:8000  (for local dev)');
    process.exit(1);
}

console.log('\n✅ Environment validation passed!\n');
