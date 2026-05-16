# DebugLens Project Report

**Generated:** 2026-05-16  
**Project Location:** `c:/Users/Pranav/debuglens-mcp`

---

## 📋 Project Overview

**DebugLens** is an MCP (Model Context Protocol) server that validates AI-generated code against repository patterns and conventions.

- **Project Name:** DebugLens — AI Code Validator powered by IBM Bob
- **Purpose:** Automatically validate AI-generated code against repository patterns
- **Technology:** Node.js MCP Server
- **Integration:** Works with IBM Bob and other MCP-compatible AI assistants

---

## 📊 Project Statistics

Based on the README and file structure:

- **Total Source Lines:** ~630+ lines
  - `src/index.js`: 192 lines (MCP server implementation)
  - `src/validator.js`: 429 lines (validation engine)
  - `src/tools.js`: Empty file
- **Source Files:** 3 main files
- **Example Files:** 6 files (buggy-code.js, fixed-code.js, + 4 sample-repo files)
- **Configuration Files:** 4 files (package.json, .mcp.json, README.md, test-validation.js)
- **Documentation:** README.md with 312 lines

---

## 📁 File Structure

```
debuglens-mcp/
├── src/
│   ├── index.js          # MCP server (192 lines)
│   ├── validator.js      # Validation engine (429 lines)
│   └── tools.js          # Empty
├── sample-repo/src/
│   ├── api.js           # Sample API with fetch & camelCase
│   ├── utils.js         # 12 utility functions
│   ├── models.js        # Data models
│   └── handlers.js      # Error/response handlers
├── examples/
│   ├── buggy-code.js    # Code with 4 violations
│   └── fixed-code.js    # Corrected version
├── bob-report/          # Report output directory
├── .mcp.json           # MCP configuration
├── package.json        # Dependencies
├── test-validation.js  # Test script
└── README.md          # Documentation (312 lines)
```

---

## ✨ Key Features

1. **Library Mismatch Detection**
   - Identifies when AI uses libraries not in your repo
   - Example: Detects `axios` when repo uses `fetch`
   - Severity: Medium

2. **Naming Convention Validation**
   - Detects snake_case vs camelCase inconsistencies
   - Ensures code follows repository standards
   - Severity: Medium

3. **Error Handling Analysis**
   - Checks for proper try/catch patterns
   - Compares against repository error handling
   - Severity: High

4. **Duplicate Utility Detection**
   - Finds when AI reimplements existing functions
   - Suggests using existing utilities
   - Severity: Medium

5. **MCP Integration**
   - Works seamlessly with IBM Bob
   - Standard MCP protocol implementation
   - Real-time validation feedback

---

## 🔧 MCP Tool: validate_ai_code

### Tool Definition

**Name:** `validate_ai_code`

**Description:** Validates AI-generated code against repository context. Analyzes the code for potential issues, compatibility with existing codebase, and best practices.

### Parameters

- **code** (string, required)
  - The AI-generated code to validate
  - Can be any JavaScript code snippet

- **repo_path** (string, required)
  - Path to the repository folder for context analysis
  - Example: `C:\Users\Pranav\debuglens-mcp\sample-repo`

### Returns

The tool returns a JSON object containing:

```json
{
  "status": "success",
  "message": "Code validation completed",
  "timestamp": "2026-05-16T10:31:32.576Z",
  "code_length": 150,
  "repo_path": "C:\\Users\\Pranav\\debuglens-mcp\\sample-repo",
  "issues": [
    {
      "type": "library_mismatch",
      "description": "AI code uses libraries not found in repository: axios",
      "severity": "medium"
    },
    {
      "type": "naming_convention",
      "description": "AI code uses snake_case but repository predominantly uses camelCase",
      "severity": "medium"
    },
    {
      "type": "error_handling",
      "description": "AI code has less error handling compared to repository patterns",
      "severity": "high"
    }
  ],
  "patterns_found": {
    "files_analyzed": 4,
    "imports": ["./handlers", "./utils"],
    "naming_convention": "camelCase",
    "exported_utilities": ["isValidEmail", "handleError", "handleResponse"]
  },
  "suggestion": "Priority: Add proper error handling with try-catch blocks."
}
```

---

## 📦 Dependencies

- **@modelcontextprotocol/sdk**: ^1.29.0
  - Official MCP SDK for Node.js
  - Provides server and transport implementations
  - Handles protocol communication

---

## 🔍 Validation Categories

| Category | Description | Severity Levels | Example |
|----------|-------------|-----------------|---------|
| **Library Mismatch** | Uses libraries not in repo | Low, Medium, High | axios vs fetch |
| **Naming Convention** | Inconsistent naming patterns | Low, Medium | snake_case vs camelCase |
| **Error Handling** | Missing try/catch patterns | Medium, High, Critical | No error handling |
| **Duplicate Utilities** | Reimplements existing functions | Low, Medium | Custom email validator |

---

## 💡 Usage Example

### Step 1: Register with Bob

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "debuglens": {
      "command": "node",
      "args": [
        "C:\\Users\\Pranav\\debuglens-mcp\\src\\index.js"
      ],
      "transport": "stdio"
    }
  }
}
```

### Step 2: Restart IBM Bob

After registering, restart Bob to connect to DebugLens.

### Step 3: Use the Tool

Ask Bob to validate code:

```javascript
{
  "tool": "validate_ai_code",
  "arguments": {
    "code": "const axios = require('axios');\n\nasync function create_user(user_data) {\n  const response = await axios.post('https://api.example.com/users', user_data);\n  return response.data;\n}",
    "repo_path": "C:\\Users\\Pranav\\debuglens-mcp\\sample-repo"
  }
}
```

### Step 4: Review Results

Bob receives validation results and can automatically fix issues.

---

## 🎯 Example Validation Results

### Input Code (Buggy)

```javascript
const axios = require('axios');  // ❌ Wrong library

async function create_new_user(user_data) {  // ❌ snake_case naming
  // ❌ No try/catch error handling
  
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // ❌ Reimplements utility
  if (!email_regex.test(user_data.email)) {
    return { success: false, error: 'Invalid email' };
  }
  
  const response = await axios.post('https://api.example.com/users', user_data);
  return { success: true, data: response.data };
}
```

### Validation Output

**Issues Detected:**
- ⚠️ **Library mismatch:** axios not found (use fetch instead)
- ⚠️ **Naming convention:** snake_case detected (repository uses camelCase)
- ⚠️ **Missing error handling:** No try/catch blocks
- ⚠️ **Duplicate utility:** Email validation already exists as `isValidEmail()`

### Fixed Code

```javascript
const { isValidEmail } = require('../sample-repo/src/utils');  // ✅ Uses existing utility
const { handleError, handleResponse } = require('../sample-repo/src/handlers');  // ✅ Uses handlers

async function createNewUser(userData) {  // ✅ camelCase naming
  try {  // ✅ Proper error handling
    if (!userData.email || !isValidEmail(userData.email)) {  // ✅ Uses existing utility
      throw new Error('Valid email address is required');
    }
    
    const response = await fetch('https://api.example.com/users', {  // ✅ Uses fetch
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return handleResponse(data, response.status);  // ✅ Uses existing handler
  } catch (error) {
    return handleError(error, 'createNewUser');  // ✅ Uses existing handler
  }
}
```

---

## 🛠️ How It Works

1. **Scans Repository**
   - Recursively reads all `.js` files from your repo
   - Extracts patterns and conventions

2. **Extracts Patterns**
   - Identifies imports and dependencies
   - Detects function signatures and naming
   - Finds exported utilities
   - Analyzes error handling patterns

3. **Compares AI Code**
   - Analyzes the AI-generated code
   - Compares against extracted patterns

4. **Detects Issues**
   - Finds mismatches and violations
   - Assigns severity levels

5. **Provides Suggestions**
   - Returns actionable recommendations
   - Prioritizes by severity

---

## 🎯 Use Cases

1. **Code Review Automation**
   - Validate AI-generated PRs before merge
   - Ensure consistency across the codebase

2. **Developer Onboarding**
   - Help new developers match team conventions
   - Provide instant feedback on code style

3. **Refactoring Support**
   - Ensure consistency when updating code
   - Maintain patterns during changes

4. **CI/CD Integration**
   - Add validation to your pipeline
   - Catch issues before deployment

5. **Learning Tool**
   - Understand your codebase patterns
   - Learn best practices from existing code

---

## 📝 Testing

### Run the Test Script

```bash
node test-validation.js
```

This validates `examples/buggy-code.js` against `sample-repo/` and shows all detected issues.

### Expected Output

The test script will show:
- Files analyzed from the repository
- Patterns detected (imports, naming, utilities)
- Issues found in the buggy code
- Severity levels for each issue
- Actionable suggestions

---

## 🚀 Future Enhancements

Potential improvements for DebugLens:

1. **Multi-Language Support**
   - Extend beyond JavaScript
   - Support TypeScript, Python, etc.

2. **Custom Rules**
   - Allow users to define custom validation rules
   - Configure severity levels

3. **Report Export**
   - Generate HTML/PDF reports
   - Export validation history

4. **IDE Integration**
   - VS Code extension
   - Real-time validation in editor

5. **Team Collaboration**
   - Share validation rules across teams
   - Centralized pattern database

---

## 🤝 Contributing

DebugLens is designed to be extensible:

- **Add new validation rules** in `src/validator.js`
- **Support additional languages** beyond JavaScript
- **Integrate with other MCP-compatible AI assistants**
- **Customize severity levels and suggestions**

---

## 📄 License

ISC

---

## 🙏 Acknowledgments

**Built with IBM Bob** — The AI coding assistant that makes DebugLens possible.

IBM Bob's MCP integration enables seamless validation of AI-generated code, creating a powerful feedback loop that ensures code quality and consistency from the start.

---

## 📞 Support

For issues or questions:
- Review the README.md documentation
- Check the examples/ directory for usage patterns
- Test with the included test-validation.js script

---

**DebugLens** — Because AI-generated code should fit your project, not the other way around. 🔍✨

---

*Report generated on 2026-05-16 at 10:31:32 UTC*  
*Project Status: Fully functional MCP server ready for use with IBM Bob*