/**
 * Code Validator Module
 * 
 * Analyzes AI-generated code against repository patterns and conventions.
 * Detects issues, inconsistencies, and provides actionable suggestions.
 */

const fs = require('fs');
const path = require('path');

/**
 * Recursively reads all .js files from a directory
 * @param {string} dirPath - Directory path to scan
 * @param {Array} fileList - Accumulator for file paths
 * @returns {Array<string>} Array of .js file paths
 */
function getAllJsFiles(dirPath, fileList = []) {
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and hidden directories
          if (file !== 'node_modules' && !file.startsWith('.')) {
            getAllJsFiles(filePath, fileList);
          }
        } else if (stat.isFile() && file.endsWith('.js')) {
          fileList.push(filePath);
        }
      } catch (err) {
        console.error(`[Validator] Error accessing ${filePath}: ${err.message}`);
      }
    });
    
    return fileList;
  } catch (err) {
    console.error(`[Validator] Error reading directory ${dirPath}: ${err.message}`);
    return fileList;
  }
}

/**
 * Extracts import/require statements from code
 * @param {string} code - Source code to analyze
 * @returns {Array<string>} Array of imported libraries
 */
function extractImports(code) {
  const imports = new Set();
  
  // Match ES6 imports: import ... from 'module'
  const es6ImportRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6ImportRegex.exec(code)) !== null) {
    imports.add(match[1]);
  }
  
  // Match CommonJS requires: require('module')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(code)) !== null) {
    imports.add(match[1]);
  }
  
  return Array.from(imports);
}

/**
 * Extracts function names and their signatures from code
 * @param {string} code - Source code to analyze
 * @returns {Array<Object>} Array of function information
 */
function extractFunctions(code) {
  const functions = [];
  
  // Match function declarations: function name(params) { }
  const funcDeclRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
  let match;
  while ((match = funcDeclRegex.exec(code)) !== null) {
    functions.push({
      name: match[1],
      params: match[2].split(',').map(p => p.trim()).filter(p => p),
      type: 'declaration'
    });
  }
  
  // Match arrow functions: const name = (params) => { }
  const arrowFuncRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g;
  while ((match = arrowFuncRegex.exec(code)) !== null) {
    functions.push({
      name: match[1],
      params: match[2].split(',').map(p => p.trim()).filter(p => p),
      type: 'arrow'
    });
  }
  
  // Match method definitions: methodName(params) { }
  const methodRegex = /(\w+)\s*\(([^)]*)\)\s*\{/g;
  while ((match = methodRegex.exec(code)) !== null) {
    // Avoid duplicates from function declarations
    if (!functions.some(f => f.name === match[1])) {
      functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(p => p),
        type: 'method'
      });
    }
  }
  
  return functions;
}

/**
 * Detects naming convention used in code
 * @param {string} code - Source code to analyze
 * @returns {Object} Naming convention statistics
 */
function detectNamingConvention(code) {
  const identifiers = [];
  
  // Extract variable and function names
  const varRegex = /(?:const|let|var)\s+(\w+)/g;
  const funcRegex = /function\s+(\w+)/g;
  
  let match;
  while ((match = varRegex.exec(code)) !== null) {
    identifiers.push(match[1]);
  }
  while ((match = funcRegex.exec(code)) !== null) {
    identifiers.push(match[1]);
  }
  
  let camelCaseCount = 0;
  let snakeCaseCount = 0;
  
  identifiers.forEach(id => {
    if (/^[a-z]+([A-Z][a-z]*)*$/.test(id)) {
      camelCaseCount++;
    } else if (/^[a-z]+(_[a-z]+)*$/.test(id)) {
      snakeCaseCount++;
    }
  });
  
  return {
    camelCase: camelCaseCount,
    snake_case: snakeCaseCount,
    dominant: camelCaseCount > snakeCaseCount ? 'camelCase' : 
              snakeCaseCount > camelCaseCount ? 'snake_case' : 'mixed',
    total: identifiers.length
  };
}

/**
 * Extracts exported utilities from code
 * @param {string} code - Source code to analyze
 * @returns {Array<string>} Array of exported utility names
 */
function extractExportedUtilities(code) {
  const exports = new Set();
  
  // Match module.exports = { ... }
  const moduleExportsRegex = /module\.exports\s*=\s*\{([^}]+)\}/g;
  let match;
  while ((match = moduleExportsRegex.exec(code)) !== null) {
    const items = match[1].split(',');
    items.forEach(item => {
      const name = item.trim().split(':')[0].trim();
      if (name) exports.add(name);
    });
  }
  
  // Match exports.name = ...
  const exportsRegex = /exports\.(\w+)\s*=/g;
  while ((match = exportsRegex.exec(code)) !== null) {
    exports.add(match[1]);
  }
  
  // Match export { name }
  const es6ExportRegex = /export\s+\{([^}]+)\}/g;
  while ((match = es6ExportRegex.exec(code)) !== null) {
    const items = match[1].split(',');
    items.forEach(item => {
      const name = item.trim().split(/\s+as\s+/)[0].trim();
      if (name) exports.add(name);
    });
  }
  
  // Match export function name
  const exportFuncRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  while ((match = exportFuncRegex.exec(code)) !== null) {
    exports.add(match[1]);
  }
  
  return Array.from(exports);
}

/**
 * Checks if code has error handling patterns
 * @param {string} code - Source code to analyze
 * @returns {Object} Error handling statistics
 */
function checkErrorHandling(code) {
  const hasTryCatch = /try\s*\{[\s\S]*?\}\s*catch/.test(code);
  const hasErrorChecks = /if\s*\(\s*error\s*\)/.test(code) || /if\s*\(\s*err\s*\)/.test(code);
  const hasThrows = /throw\s+new\s+Error/.test(code);
  
  return {
    hasTryCatch,
    hasErrorChecks,
    hasThrows,
    score: (hasTryCatch ? 1 : 0) + (hasErrorChecks ? 1 : 0) + (hasThrows ? 1 : 0)
  };
}
/**
 * Checks code for performance issues and anti-patterns
 * @param {string} code - Source code to analyze
 * @returns {Array<Object>} Array of performance issues found
 */
function checkPerformance(code) {
  const performanceIssues = [];
  
  // 1. Detect Nested Loops (O(n²) complexity)
  const nestedLoopRegex = /(?:for|while)\s*\([^)]*\)\s*\{[^{}]*(?:for|while)\s*\([^)]*\)\s*\{/gs;
  if (nestedLoopRegex.test(code)) {
    performanceIssues.push({
      type: 'performance',
      description: 'Nested loops detected - O(n²) complexity risk',
      severity: 'high',
      suggestion: 'Consider using hash maps, Set, or Map data structures to reduce complexity to O(n)'
    });
  }
  
  // 2. Detect Synchronous Blocking Operations
  const syncOpsRegex = /\b(readFileSync|writeFileSync|execSync)\b/g;
  const syncOpsMatches = code.match(syncOpsRegex);
  if (syncOpsMatches) {
    performanceIssues.push({
      type: 'performance',
      description: `Synchronous operation blocks the thread: ${syncOpsMatches.join(', ')}`,
      severity: 'high',
      suggestion: 'Use async alternatives: readFile, writeFile, exec with promises or callbacks'
    });
  }
  
  // 3. Detect Array Length in Loop Condition
  const arrayLengthInLoopRegex = /for\s*\([^;]*;\s*[^;]*\.length\s*[;<]/g;
  if (arrayLengthInLoopRegex.test(code)) {
    performanceIssues.push({
      type: 'performance',
      description: 'Recalculates array length on every iteration',
      severity: 'medium',
      suggestion: 'Cache array length in a variable before the loop: const len = array.length'
    });
  }
  
  // 4. Detect Missing Await on Fetch
  const fetchWithoutAwaitRegex = /(?<!await\s+)fetch\s*\(/g;
  const fetchMatches = [...code.matchAll(fetchWithoutAwaitRegex)];
  
  // Filter out cases where fetch is already awaited or returned
  const problematicFetches = fetchMatches.filter(match => {
    const beforeFetch = code.substring(Math.max(0, match.index - 20), match.index);
    const afterFetch = code.substring(match.index, Math.min(code.length, match.index + 100));
    
    // Check if it's awaited or returned
    const isAwaited = /await\s*$/.test(beforeFetch);
    const isReturned = /return\s+$/.test(beforeFetch);
    
    return !isAwaited && !isReturned;
  });
  
  if (problematicFetches.length > 0) {
    performanceIssues.push({
      type: 'performance',
      description: 'fetch() called without await - unhandled promise',
      severity: 'high',
      suggestion: 'Add await keyword before fetch() or use .then() to handle the promise'
    });
  }
  
  // 5. Detect Event Listeners Without Cleanup
  const addEventListenerRegex = /addEventListener\s*\(/g;
  const removeEventListenerRegex = /removeEventListener\s*\(/g;
  
  const addListenerMatches = code.match(addEventListenerRegex);
  const removeListenerMatches = code.match(removeEventListenerRegex);
  
  const addCount = addListenerMatches ? addListenerMatches.length : 0;
  const removeCount = removeListenerMatches ? removeListenerMatches.length : 0;
  
  if (addCount > 0 && removeCount === 0) {
    performanceIssues.push({
      type: 'performance',
      description: 'Event listener added but never removed - memory leak risk',
      severity: 'medium',
      suggestion: 'Add cleanup logic with removeEventListener in cleanup/unmount functions'
    });
  }
  
  return performanceIssues;
}


/**
 * Main validation function
 * Analyzes AI-generated code against repository patterns
 * 
 * @param {string} code - AI-generated code to validate
 * @param {string} repoPath - Path to repository folder
 * @returns {Object} Validation results with issues, patterns, and suggestions
 */
async function validateCode(code, repoPath) {
  try {
    // Validate inputs
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid code parameter: must be a non-empty string');
    }
    
    if (!repoPath || typeof repoPath !== 'string') {
      throw new Error('Invalid repo_path parameter: must be a non-empty string');
    }
    
    // Check if repo path exists
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }
    
    const stat = fs.statSync(repoPath);
    if (!stat.isDirectory()) {
      throw new Error(`Repository path is not a directory: ${repoPath}`);
    }
    
    // Get all .js files from repository
    const jsFiles = getAllJsFiles(repoPath);
    
    if (jsFiles.length === 0) {
      return {
        issues: [{
          type: 'warning',
          description: 'No JavaScript files found in repository',
          severity: 'low'
        }],
        patterns_found: {
          files_analyzed: 0,
          imports: [],
          functions: [],
          naming_convention: 'unknown',
          exported_utilities: []
        },
        suggestion: 'Unable to analyze patterns - no JavaScript files found in repository'
      };
    }
    
    // Aggregate patterns from all repository files
    const repoImports = new Set();
    const repoFunctions = [];
    const repoExports = new Set();
    let repoNamingStats = { camelCase: 0, snake_case: 0, total: 0 };
    let repoErrorHandlingScore = 0;
    
    jsFiles.forEach(filePath => {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Extract patterns
        extractImports(fileContent).forEach(imp => repoImports.add(imp));
        repoFunctions.push(...extractFunctions(fileContent));
        extractExportedUtilities(fileContent).forEach(exp => repoExports.add(exp));
        
        const naming = detectNamingConvention(fileContent);
        repoNamingStats.camelCase += naming.camelCase;
        repoNamingStats.snake_case += naming.snake_case;
        repoNamingStats.total += naming.total;
        
        const errorHandling = checkErrorHandling(fileContent);
        repoErrorHandlingScore += errorHandling.score;
      } catch (err) {
        console.error(`[Validator] Error reading file ${filePath}: ${err.message}`);
      }
    });
    
    // Determine dominant naming convention
    const dominantNaming = repoNamingStats.camelCase > repoNamingStats.snake_case ? 
      'camelCase' : repoNamingStats.snake_case > repoNamingStats.camelCase ? 
      'snake_case' : 'mixed';
    
    // Analyze AI-generated code
    const aiImports = extractImports(code);
    const aiFunctions = extractFunctions(code);
    const aiNaming = detectNamingConvention(code);
    const aiErrorHandling = checkErrorHandling(code);
    
    // Detect issues
    const issues = [];
    
    // Check for libraries used in AI code but not in repo
    const unusedLibraries = aiImports.filter(imp => !repoImports.has(imp));
    if (unusedLibraries.length > 0) {
      issues.push({
        type: 'library_mismatch',
        description: `AI code uses libraries not found in repository: ${unusedLibraries.join(', ')}`,
        severity: 'medium',
        details: unusedLibraries
      });
    }
    
    // Check for existing utilities that could be reused
    const repoFunctionNames = new Set(repoFunctions.map(f => f.name));
    const aiFunctionNames = new Set(aiFunctions.map(f => f.name));
    const potentialDuplicates = Array.from(aiFunctionNames).filter(name => 
      repoFunctionNames.has(name)
    );
    
    if (potentialDuplicates.length > 0) {
      issues.push({
        type: 'duplicate_utility',
        description: `AI code defines functions that may already exist in repository: ${potentialDuplicates.join(', ')}`,
        severity: 'low',
        details: potentialDuplicates
      });
    }
    
    // Check for naming convention violations
    if (dominantNaming !== 'mixed' && aiNaming.dominant !== dominantNaming && aiNaming.dominant !== 'mixed') {
      issues.push({
        type: 'naming_convention',
        description: `AI code uses ${aiNaming.dominant} but repository predominantly uses ${dominantNaming}`,
        severity: 'medium',
        details: {
          ai_convention: aiNaming.dominant,
          repo_convention: dominantNaming
        }
      });
    }
    
    // Check for missing error handling
    const avgRepoErrorScore = repoErrorHandlingScore / jsFiles.length;
    if (aiErrorHandling.score < avgRepoErrorScore) {
      issues.push({
        type: 'error_handling',
        description: 'AI code has less error handling compared to repository patterns',
        severity: 'high',
        details: {
          ai_score: aiErrorHandling.score,
          repo_avg_score: avgRepoErrorScore.toFixed(2),
          missing_patterns: []
        }
      });
      
      if (!aiErrorHandling.hasTryCatch && avgRepoErrorScore > 0) {
        issues[issues.length - 1].details.missing_patterns.push('try-catch blocks');
      }
      if (!aiErrorHandling.hasErrorChecks && avgRepoErrorScore > 0) {
        issues[issues.length - 1].details.missing_patterns.push('error condition checks');
      }
    }
    
    // Check for performance issues
    const performanceIssues = checkPerformance(code);
    issues.push(...performanceIssues);
    
    // Generate suggestion
    let suggestion = 'Code looks good!';
    if (issues.length > 0) {
      const highSeverity = issues.filter(i => i.severity === 'high');
      const mediumSeverity = issues.filter(i => i.severity === 'medium');
      
      if (highSeverity.length > 0) {
        suggestion = `Priority: ${highSeverity[0].description}. Add proper error handling with try-catch blocks.`;
      } else if (mediumSeverity.length > 0) {
        suggestion = `Consider: ${mediumSeverity[0].description}. Align with repository conventions.`;
      } else {
        suggestion = `Minor improvements: ${issues[0].description}`;
      }
    }
    
    // Return structured result
    return {
      issues,
      patterns_found: {
        files_analyzed: jsFiles.length,
        imports: Array.from(repoImports),
        functions: repoFunctions.slice(0, 20), // Limit to first 20 for brevity
        naming_convention: dominantNaming,
        exported_utilities: Array.from(repoExports),
        error_handling_score: avgRepoErrorScore.toFixed(2)
      },
      suggestion
    };
    
  } catch (error) {
    console.error(`[Validator] Error during validation: ${error.message}`);
    
    return {
      issues: [{
        type: 'validation_error',
        description: `Validation failed: ${error.message}`,
        severity: 'critical'
      }],
      patterns_found: {
        files_analyzed: 0,
        imports: [],
        functions: [],
        naming_convention: 'unknown',
        exported_utilities: []
      },
      suggestion: 'Fix validation errors before proceeding'
    };
  }
}

/**
 * Automatically fixes AI-generated code based on validation results
 * Applies corrections for library mismatches, naming conventions, error handling, and duplicate utilities
 *
 * @param {string} code - AI-generated code to fix
 * @param {string} repoPath - Path to repository folder
 * @returns {Object} Fix results with issues found, fixed code, and list of fixes applied
 */
async function autoFixCode(code, repoPath) {
  try {
    // Step 1: Run full validation first
    const validationResult = await validateCode(code, repoPath);
    
    if (validationResult.issues.length === 0) {
      return {
        issues_found: [],
        fixed_code: code,
        fixes_applied: ['No issues detected - code is already compliant']
      };
    }
    
    let fixedCode = code;
    const fixesApplied = [];
    const issuesFound = validationResult.issues;
    
    // Step 2: Fix library mismatches
    const libraryIssue = issuesFound.find(i => i.type === 'library_mismatch');
    if (libraryIssue && libraryIssue.details) {
      const repoImports = validationResult.patterns_found.imports;
      
      libraryIssue.details.forEach(unusedLib => {
        // Try to find similar library in repo
        const similarLib = repoImports.find(lib =>
          lib.includes(unusedLib.split('/').pop()) ||
          unusedLib.includes(lib.split('/').pop())
        );
        
        if (similarLib) {
          // Replace import statements
          const importRegex = new RegExp(`(['"])${unusedLib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
          fixedCode = fixedCode.replace(importRegex, `$1${similarLib}$1`);
          fixesApplied.push(`Replaced library '${unusedLib}' with repository library '${similarLib}'`);
        } else {
          // Remove unused import if no similar library found
          const removeImportRegex = new RegExp(`import\\s+.*?from\\s+['"]${unusedLib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?\\s*\\n?`, 'g');
          const removeRequireRegex = new RegExp(`(?:const|let|var)\\s+.*?=\\s*require\\s*\\(\\s*['"]${unusedLib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\s*\\);?\\s*\\n?`, 'g');
          
          fixedCode = fixedCode.replace(removeImportRegex, '');
          fixedCode = fixedCode.replace(removeRequireRegex, '');
          fixesApplied.push(`Removed unused library import '${unusedLib}'`);
        }
      });
    }
    
    // Step 3: Fix naming convention violations
    const namingIssue = issuesFound.find(i => i.type === 'naming_convention');
    if (namingIssue && namingIssue.details) {
      const repoConvention = namingIssue.details.repo_convention;
      
      if (repoConvention === 'camelCase') {
        // Convert snake_case to camelCase
        const snakeCaseRegex = /\b([a-z]+)_([a-z]+(?:_[a-z]+)*)\b/g;
        fixedCode = fixedCode.replace(snakeCaseRegex, (match, first, rest) => {
          const camelCased = first + rest.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
          return camelCased;
        });
        fixesApplied.push('Converted snake_case identifiers to camelCase to match repository convention');
      } else if (repoConvention === 'snake_case') {
        // Convert camelCase to snake_case
        const camelCaseRegex = /\b([a-z]+)([A-Z][a-z]+(?:[A-Z][a-z]+)*)\b/g;
        fixedCode = fixedCode.replace(camelCaseRegex, (match) => {
          return match.replace(/([A-Z])/g, '_$1').toLowerCase();
        });
        fixesApplied.push('Converted camelCase identifiers to snake_case to match repository convention');
      }
    }
    
    // Step 4: Add error handling if missing
    const errorHandlingIssue = issuesFound.find(i => i.type === 'error_handling');
    if (errorHandlingIssue) {
      const missingPatterns = errorHandlingIssue.details?.missing_patterns || [];
      
      if (missingPatterns.includes('try-catch blocks')) {
        // Wrap async functions and risky operations in try-catch
        const asyncFuncRegex = /(async\s+function\s+\w+\s*\([^)]*\)\s*\{)([\s\S]*?)(\n\})/g;
        fixedCode = fixedCode.replace(asyncFuncRegex, (match, funcStart, body, funcEnd) => {
          // Check if already has try-catch
          if (body.trim().startsWith('try')) {
            return match;
          }
          
          const indentedBody = body.split('\n').map(line => '  ' + line).join('\n');
          return `${funcStart}\n  try {${indentedBody}\n  } catch (error) {\n    console.error('Error:', error.message);\n    throw error;\n  }${funcEnd}`;
        });
        
        // Wrap arrow async functions
        const arrowAsyncRegex = /(const|let|var)\s+(\w+)\s*=\s*async\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)(\n\};?)/g;
        fixedCode = fixedCode.replace(arrowAsyncRegex, (match, varType, funcName, params, body, funcEnd) => {
          // Check if already has try-catch
          if (body.trim().startsWith('try')) {
            return match;
          }
          
          const indentedBody = body.split('\n').map(line => '  ' + line).join('\n');
          return `${varType} ${funcName} = async (${params}) => {\n  try {${indentedBody}\n  } catch (error) {\n    console.error('Error in ${funcName}:', error.message);\n    throw error;\n  }${funcEnd}`;
        });
        
        fixesApplied.push('Added try-catch error handling blocks to async functions');
      }
    }
    
    // Step 5: Replace duplicate utilities with imports from repository
    const duplicateIssue = issuesFound.find(i => i.type === 'duplicate_utility');
    if (duplicateIssue && duplicateIssue.details) {
      const repoExports = validationResult.patterns_found.exported_utilities;
      
      duplicateIssue.details.forEach(funcName => {
        if (repoExports.includes(funcName)) {
          // Remove the function definition
          const funcDefRegex = new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'g');
          const arrowFuncRegex = new RegExp(`(?:const|let|var)\\s+${funcName}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?\\n\\};?`, 'g');
          
          fixedCode = fixedCode.replace(funcDefRegex, '');
          fixedCode = fixedCode.replace(arrowFuncRegex, '');
          
          // Add import if not already present
          const hasUtilsImport = /require\s*\(\s*['"]\.\/utils['"]\s*\)/.test(fixedCode) ||
                                 /from\s+['"]\.\/utils['"]/.test(fixedCode);
          
          if (!hasUtilsImport) {
            // Add require statement at the top
            const firstLine = fixedCode.split('\n')[0];
            if (firstLine.includes('require') || firstLine.includes('import')) {
              fixedCode = `const { ${funcName} } = require('./utils');\n${fixedCode}`;
            } else {
              fixedCode = `const { ${funcName} } = require('./utils');\n\n${fixedCode}`;
            }
          } else {
            // Add to existing import
            fixedCode = fixedCode.replace(
              /const\s+\{([^}]+)\}\s*=\s*require\s*\(\s*['"]\.\/utils['"]\s*\)/,
              (match, imports) => {
                if (!imports.includes(funcName)) {
                  return `const { ${imports.trim()}, ${funcName} } = require('./utils')`;
                }
                return match;
              }
            );
          }
          
          fixesApplied.push(`Removed duplicate function '${funcName}' and imported from repository utilities`);
        }
      });
    }
    
    // Clean up extra blank lines
    fixedCode = fixedCode.replace(/\n{3,}/g, '\n\n');
    
    return {
      issues_found: issuesFound,
      fixed_code: fixedCode,
      fixes_applied: fixesApplied.length > 0 ? fixesApplied : ['No automatic fixes could be applied']
    };
    
  } catch (error) {
    console.error(`[Validator] Error during auto-fix: ${error.message}`);
    
    return {
      issues_found: [{
        type: 'auto_fix_error',
        description: `Auto-fix failed: ${error.message}`,
        severity: 'critical'
      }],
      fixed_code: code,
      fixes_applied: ['Auto-fix failed - returning original code']
    };
  }
}

module.exports = {
  validateCode,
  autoFixCode,
  // Export helper functions for testing
  getAllJsFiles,
  extractImports,
  extractFunctions,
  detectNamingConvention,
  extractExportedUtilities,
  checkErrorHandling,
  checkPerformance
};

// Made with Bob
