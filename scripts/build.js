#!/usr/bin/env node

/**
 * Build script for tyron.js package
 * This script handles the complete build process including:
 * - Cleaning previous builds
 * - TypeScript compilation
 * - Copying additional files
 * - Running linting
 * - Formatting code
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`)
}

function execCommand(command, description) {
    try {
        log(`\n${colors.cyan}🔄 ${description}...${colors.reset}`)
        execSync(command, { stdio: 'inherit', cwd: process.cwd() })
        log(
            `${colors.green}✅ ${description} completed successfully${colors.reset}`
        )
        return true
    } catch (error) {
        log(`${colors.red}❌ ${description} failed:${colors.reset}`, colors.red)
        log(error.message, colors.red)
        return false
    }
}

function checkFileExists(filePath) {
    return fs.existsSync(path.join(process.cwd(), filePath))
}

async function buildPackage() {
    log(
        `${colors.bright}${colors.magenta}🚀 Starting tyron.js build process...${colors.reset}`
    )

    const startTime = Date.now()

    // Check if required files exist
    const requiredFiles = ['package.json', 'tsconfig.json', '.eslintrc']

    log(`${colors.blue}📋 Checking required files...${colors.reset}`)
    for (const file of requiredFiles) {
        if (checkFileExists(file)) {
            log(`${colors.green}✓${colors.reset} ${file}`)
        } else {
            log(`${colors.red}✗${colors.reset} ${file} - Missing!`)
            log(
                `${colors.red}Build aborted due to missing required files.${colors.reset}`
            )
            process.exit(1)
        }
    }

    // Step 1: Clean previous builds
    if (!execCommand('npm run clean', 'Cleaning previous builds')) {
        process.exit(1)
    }

    // Step 2: Run linting
    if (!execCommand('npm run lint', 'Running ESLint')) {
        log(
            `${colors.yellow}⚠️  Linting found issues. Attempting to auto-fix...${colors.reset}`
        )
        if (!execCommand('npm run lint:fix', 'Auto-fixing linting issues')) {
            log(
                `${colors.red}❌ Auto-fix failed. Please fix linting issues manually.${colors.reset}`
            )
            process.exit(1)
        }
    }

    // Step 3: Format code
    if (!execCommand('npm run format', 'Formatting code with Prettier')) {
        log(
            `${colors.yellow}⚠️  Code formatting failed, but continuing with build...${colors.reset}`
        )
    }

    // Step 4: TypeScript compilation
    if (!execCommand('npm run build:tsc', 'Compiling TypeScript')) {
        log(`${colors.red}❌ TypeScript compilation failed.${colors.reset}`)
        process.exit(1)
    }

    // Step 5: Copy and modify package.json for dist
    log(
        `${colors.cyan}🔄 Preparing package.json for distribution...${colors.reset}`
    )
    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
        )

        // Update the main field to point to index.js instead of dist/index.js
        packageJson.main = 'index.js'

        // Remove scripts that are only needed for development
        delete packageJson.scripts
        delete packageJson.devDependencies

        // Write the modified package.json to dist
        fs.writeFileSync(
            path.join(process.cwd(), 'dist', 'package.json'),
            JSON.stringify(packageJson, null, 2)
        )
        log(
            `${colors.green}✅ package.json prepared for distribution${colors.reset}`
        )
    } catch (error) {
        log(
            `${colors.red}❌ Failed to prepare package.json:${colors.reset}`,
            colors.red
        )
        log(error.message, colors.red)
        process.exit(1)
    }

    // Step 6: Copy LICENSE file
    log(`${colors.cyan}🔄 Copying LICENSE file...${colors.reset}`)
    try {
        fs.copyFileSync(
            path.join(process.cwd(), 'LICENSE'),
            path.join(process.cwd(), 'dist', 'LICENSE')
        )
        log(`${colors.green}✅ LICENSE file copied${colors.reset}`)
    } catch (error) {
        log(
            `${colors.yellow}⚠️  Failed to copy LICENSE, but continuing...${colors.reset}`
        )
    }

    // Step 7: Verify build output
    log(`${colors.blue}🔍 Verifying build output...${colors.reset}`)
    const distFiles = [
        'dist/index.js',
        'dist/index.d.ts',
        'dist/index.js.map',
        'dist/index.d.ts.map',
    ]

    let buildComplete = true
    for (const file of distFiles) {
        if (checkFileExists(file)) {
            log(`${colors.green}✓${colors.reset} ${file}`)
        } else {
            log(`${colors.red}✗${colors.reset} ${file} - Missing!`)
            buildComplete = false
        }
    }

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    if (buildComplete) {
        log(
            `\n${colors.bright}${colors.green}🎉 Build completed successfully!${colors.reset}`
        )
        log(`${colors.green}📦 Package built in ${duration}s${colors.reset}`)
        log(`${colors.blue}📁 Output directory: dist/${colors.reset}`)

        // Show build summary
        log(`\n${colors.bright}${colors.cyan}📊 Build Summary:${colors.reset}`)
        log(`${colors.cyan}• TypeScript files compiled${colors.reset}`)
        log(`${colors.cyan}• Declaration files generated${colors.reset}`)
        log(`${colors.cyan}• Source maps created${colors.reset}`)
        log(`${colors.cyan}• Package files copied${colors.reset}`)

        log(`\n${colors.bright}${colors.yellow}📝 Next steps:${colors.reset}`)
        log(
            `${colors.yellow}• Publish to npm: npm run run tyron${colors.reset}`
        )
    } else {
        log(`\n${colors.red}❌ Build completed with errors!${colors.reset}`)
        log(`${colors.red}Please check the missing files above.${colors.reset}`)
        process.exit(1)
    }
}

// Handle command line arguments
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
    log(`${colors.bright}${colors.cyan}tyron.js Build Script${colors.reset}\n`)
    log(`${colors.cyan}Usage: node scripts/build.js [options]${colors.reset}\n`)
    log(`${colors.cyan}Options:${colors.reset}`)
    log(`${colors.cyan}  --help, -h     Show this help message${colors.reset}`)
    log(
        `${colors.cyan}  --clean-only   Only clean the build directory${colors.reset}`
    )
    log(`${colors.cyan}  --no-lint      Skip linting step${colors.reset}`)
    log(`${colors.cyan}  --no-format    Skip code formatting${colors.reset}\n`)
    log(`${colors.cyan}Examples:${colors.reset}`)
    log(`${colors.cyan}  node scripts/build.js${colors.reset}`)
    log(`${colors.cyan}  node scripts/build.js --no-lint${colors.reset}`)
    log(`${colors.cyan}  node scripts/build.js --clean-only${colors.reset}`)
    process.exit(0)
}

if (args.includes('--clean-only')) {
    log(`${colors.cyan}🧹 Cleaning build directory...${colors.reset}`)
    execCommand('npm run clean', 'Cleaning build directory')
    process.exit(0)
}

// Run the build process
buildPackage().catch((error) => {
    log(`${colors.red}💥 Build script failed:${colors.reset}`, colors.red)
    log(error.message, colors.red)
    process.exit(1)
})
