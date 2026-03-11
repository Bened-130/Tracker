// deploy.js - Complete Automated Deployment Script for SchoolVibe AI Tracker

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
    try {
        return execSync(command, { 
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options 
        });
    } catch (error) {
        if (!options.ignoreError) {
            throw error;
        }
        return error.stdout;
    }
}

// Check if Vercel CLI is installed
function checkVercelCLI() {
    log('\n🔍 Checking Vercel CLI...', 'cyan');
    try {
        exec('vercel --version', { silent: true });
        log('✅ Vercel CLI is installed', 'green');
        return true;
    } catch {
        log('❌ Vercel CLI not found. Installing...', 'yellow');
        try {
            exec('npm i -g vercel');
            log('✅ Vercel CLI installed successfully', 'green');
            return true;
        } catch (error) {
            log('❌ Failed to install Vercel CLI. Please run: npm i -g vercel', 'red');
            return false;
        }
    }
}

// Check if user is logged in to Vercel
function checkVercelLogin() {
    log('\n🔍 Checking Vercel login...', 'cyan');
    try {
        exec('vercel whoami', { silent: true });
        log('✅ Logged in to Vercel', 'green');
        return true;
    } catch {
        log('❌ Not logged in. Please run: vercel login', 'yellow');
        exec('vercel login');
        return true;
    }
}

// Create backend vercel.json
function createBackendConfig() {
    log('\n📁 Creating backend configuration...', 'cyan');
    
    const backendConfig = {
        version: 2,
        builds: [
            {
                src: 'server.js',
                use: '@vercel/node'
            }
        ],
        routes: [
            {
                src: '/(.*)',
                dest: 'server.js'
            }
        ]
    };

    const backendPath = path.join(__dirname, 'backend', 'vercel.json');
    fs.writeFileSync(backendPath, JSON.stringify(backendConfig, null, 2));
    log('✅ Created backend/vercel.json', 'green');
}

// Create frontend vercel.json
function createFrontendConfig() {
    log('\n📁 Creating frontend configuration...', 'cyan');
    
    const frontendConfig = {
        version: 2,
        buildCommand: null,
        outputDirectory: '.',
        framework: null,
        routes: [
            {
                src: '/js/(.*)',
                dest: '/js/$1'
            },
            {
                src: '/css/(.*)',
                dest: '/css/$1'
            },
            {
                src: '/pages/(.*)',
                dest: '/pages/$1'
            },
            {
                src: '/(.*)',
                dest: '/index.html'
            }
        ]
    };

    const frontendPath = path.join(__dirname, 'frontend', 'vercel.json');
    fs.writeFileSync(frontendPath, JSON.stringify(frontendConfig, null, 2));
    log('✅ Created frontend/vercel.json', 'green');
}

// Update frontend API URL
function updateFrontendAPI(backendURL) {
    log('\n📝 Updating frontend API URL...', 'cyan');
    
    const apiPath = path.join(__dirname, 'frontend', 'js', 'api.js');
    let apiContent = fs.readFileSync(apiPath, 'utf8');
    
    // Replace the API_BASE_URL line
    const newURL = `const API_BASE_URL = '${backendURL}/api';`;
    apiContent = apiContent.replace(/const API_BASE_URL = .+;/, newURL);
    
    fs.writeFileSync(apiPath, apiContent);
    log(`✅ Updated API URL to: ${backendURL}/api`, 'green');
}

// Deploy backend
async function deployBackend() {
    log('\n🚀 Deploying BACKEND...', 'bright');
    log('=================================', 'cyan');
    
    const backendPath = path.join(__dirname, 'backend');
    
    // Check if package.json exists
    if (!fs.existsSync(path.join(backendPath, 'package.json'))) {
        log('❌ backend/package.json not found!', 'red');
        process.exit(1);
    }
    
    // Check if server.js exists
    if (!fs.existsSync(path.join(backendPath, 'server.js'))) {
        log('❌ backend/server.js not found!', 'red');
        process.exit(1);
    }
    
    // Create vercel.json
    createBackendConfig();
    
    // Deploy
    log('\n📤 Deploying to Vercel (this may take a minute)...', 'yellow');
    
    try {
        const output = exec('vercel --prod --yes', { 
            cwd: backendPath,
            silent: true 
        });
        
        // Extract URL from output
        const urlMatch = output.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/);
        if (urlMatch) {
            const backendURL = urlMatch[1];
            log(`\n✅ Backend deployed successfully!`, 'green');
            log(`🌐 Backend URL: ${backendURL}`, 'bright');
            return backendURL;
        } else {
            // Try to get URL from vercel ls
            const lsOutput = exec('vercel ls --meta', { 
                cwd: backendPath,
                silent: true 
            });
            const lsMatch = lsOutput.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/);
            if (lsMatch) {
                return lsMatch[1];
            }
            throw new Error('Could not extract deployment URL');
        }
    } catch (error) {
        log('\n❌ Backend deployment failed', 'red');
        log(error.message, 'red');
        throw error;
    }
}

// Deploy frontend
async function deployFrontend() {
    log('\n🚀 Deploying FRONTEND...', 'bright');
    log('=================================', 'cyan');
    
    const frontendPath = path.join(__dirname, 'frontend');
    
    // Check if index.html exists
    if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
        log('❌ frontend/index.html not found!', 'red');
        process.exit(1);
    }
    
    // Create vercel.json
    createFrontendConfig();
    
    // Deploy
    log('\n📤 Deploying to Vercel...', 'yellow');
    
    try {
        const output = exec('vercel --prod --yes', { 
            cwd: frontendPath,
            silent: true 
        });
        
        const urlMatch = output.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/);
        if (urlMatch) {
            const frontendURL = urlMatch[1];
            log(`\n✅ Frontend deployed successfully!`, 'green');
            log(`🌐 Frontend URL: ${frontendURL}`, 'bright');
            return frontendURL;
        } else {
            const lsOutput = exec('vercel ls --meta', { 
                cwd: frontendPath,
                silent: true 
            });
            const lsMatch = lsOutput.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/);
            if (lsMatch) {
                return lsMatch[1];
            }
            throw new Error('Could not extract deployment URL');
        }
    } catch (error) {
        log('\n❌ Frontend deployment failed', 'red');
        log(error.message, 'red');
        throw error;
    }
}

// Set environment variables in Vercel
async function setEnvironmentVariables(backendURL, frontendURL) {
    log('\n⚙️  Setting Environment Variables...', 'cyan');
    
    const backendPath = path.join(__dirname, 'backend');
    
    // Read .env file
    const envPath = path.join(backendPath, '.env');
    let envVars = {};
    
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        });
    }
    
    // Add FRONTEND_URL
    envVars['FRONTEND_URL'] = frontendURL;
    
    log('\n📋 Please confirm your environment variables:', 'yellow');
    log(`FRONTEND_URL: ${frontendURL}`, 'cyan');
    log(`SUPABASE_URL: ${envVars['SUPABASE_URL'] || 'NOT SET - Please set manually'}`, envVars['SUPABASE_URL'] ? 'cyan' : 'red');
    log(`SUPABASE_SERVICE_KEY: ${envVars['SUPABASE_SERVICE_KEY'] ? '✓ Set' : 'NOT SET - Please set manually'}`, envVars['SUPABASE_SERVICE_KEY'] ? 'cyan' : 'red');
    
    const confirm = await question('\nDo you want to set these in Vercel now? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
        for (const [key, value] of Object.entries(envVars)) {
            if (value && !key.includes('KEY') && key !== 'SUPABASE_SERVICE_KEY') {
                try {
                    exec(`vercel env add ${key} production`, { 
                        cwd: backendPath,
                        silent: true 
                    });
                    log(`✅ Set ${key}`, 'green');
                } catch (e) {
                    log(`⚠️  Could not set ${key} automatically`, 'yellow');
                }
            }
        }
        
        log('\n⚠️  IMPORTANT: Set these sensitive variables in Vercel Dashboard:', 'yellow');
        log('1. Go to https://vercel.com/dashboard', 'cyan');
        log('2. Select your backend project', 'cyan');
        log('3. Settings → Environment Variables', 'cyan');
        log('4. Add: SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET', 'cyan');
    }
}

// Save deployment info
function saveDeploymentInfo(backendURL, frontendURL) {
    const info = {
        deployedAt: new Date().toISOString(),
        backendURL,
        frontendURL,
        apiEndpoint: `${backendURL}/api`,
        healthCheck: `${backendURL}/health`
    };
    
    fs.writeFileSync('deployment-info.json', JSON.stringify(info, null, 2));
    
    log('\n💾 Deployment info saved to deployment-info.json', 'green');
}

// Main deployment function
async function main() {
    log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🎓 SchoolVibe AI Tracker - Automated Deployment          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`, 'bright');

    // Pre-flight checks
    if (!checkVercelCLI()) {
        process.exit(1);
    }
    
    if (!checkVercelLogin()) {
        process.exit(1);
    }
    
    // Check project structure
    log('\n📁 Checking project structure...', 'cyan');
    
    const requiredPaths = [
        'backend/server.js',
        'backend/package.json',
        'frontend/index.html',
        'frontend/js/api.js'
    ];
    
    for (const p of requiredPaths) {
        if (!fs.existsSync(path.join(__dirname, p))) {
            log(`❌ Missing: ${p}`, 'red');
            process.exit(1);
        }
    }
    log('✅ Project structure looks good', 'green');
    
    // Confirm deployment
    log('\n📋 This script will:', 'yellow');
    log('   1. Deploy BACKEND to Vercel', 'cyan');
    log('   2. Update frontend API URL with backend URL', 'cyan');
    log('   3. Deploy FRONTEND to Vercel', 'cyan');
    log('   4. Save deployment information', 'cyan');
    
    const proceed = await question('\n🚀 Proceed with deployment? (y/n): ');
    
    if (proceed.toLowerCase() !== 'y') {
        log('Deployment cancelled', 'yellow');
        process.exit(0);
    }
    
    try {
        // Step 1: Deploy Backend
        const backendURL = await deployBackend();
        
        // Step 2: Update Frontend API
        updateFrontendAPI(backendURL);
        
        // Step 3: Deploy Frontend
        const frontendURL = await deployFrontend();
        
        // Step 4: Set Environment Variables
        await setEnvironmentVariables(backendURL, frontendURL);
        
        // Step 5: Save Info
        saveDeploymentInfo(backendURL, frontendURL);
        
        // Success!
        log('\n' + '='.repeat(60), 'green');
        log('🎉 DEPLOYMENT SUCCESSFUL!', 'bright');
        log('='.repeat(60), 'green');
        log('\n📊 Your Application:', 'bright');
        log(`   🌐 Frontend: ${frontendURL}`, 'cyan');
        log(`   🔌 Backend:  ${backendURL}`, 'cyan');
        log(`   📡 API:      ${backendURL}/api`, 'cyan');
        log(`   ✅ Health:   ${backendURL}/health`, 'cyan');
        log('\n📋 Next Steps:', 'yellow');
        log('   1. Visit your frontend URL to test', 'cyan');
        log('   2. Check health endpoint to verify backend', 'cyan');
        log('   3. Set environment variables in Vercel Dashboard if not done', 'cyan');
        log('   4. Configure Supabase database (run SQL files)', 'cyan');
        log('\n💾 Deployment info saved to: deployment-info.json', 'green');
        
    } catch (error) {
        log('\n❌ Deployment failed', 'red');
        log(error.message, 'red');
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run main
main();