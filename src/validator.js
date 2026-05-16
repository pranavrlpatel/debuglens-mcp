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

module.exports = {
  validateCode,
  // Export helper functions for testing
  getAllJsFiles,
  extractImports,
  extractFunctions,
  detectNamingConvention,
  extractExportedUtilities,
  checkErrorHandling
};

// Made with Bob
