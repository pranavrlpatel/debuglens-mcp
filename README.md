# DebugLens — AI Code Validator powered by IBM Bob

**Automatically validate AI-generated code against your repository's patterns and conventions.**

---

## 🎯 The Problem

When developers use AI assistants like ChatGPT or Claude to generate code, the AI often:
- Uses libraries that don't exist in your project (e.g., `axios` when you use `fetch`)
- Follows different naming conventions (e.g., `snake_case` when your repo uses `camelCase`)
- Ignores existing utility functions and reinvents the wheel
- Lacks proper error handling patterns that your codebase follows

**Result:** Code that "works" but doesn't fit your project, leading to inconsistencies, technical debt, and maintenance headaches.

---

## 💡 The Solution

**DebugLens** is an MCP (Model Context Protocol) server that analyzes AI-generated code against your repository's actual patterns. It detects:

✅ **Library mismatches** — Uses libraries not found in your repo  
✅ **Naming convention violations** — Inconsistent variable/function naming  
✅ **Missing error handling** — Lacks try/catch patterns your code uses  
✅ **Duplicate utilities** — Reimplements functions that already exist  

Then provides **actionable suggestions** to fix the issues before you commit.

---

## 🤖 How IBM Bob Powers DebugLens

**IBM Bob** is an advanced AI coding assistant that integrates with MCP servers like DebugLens. When you ask Bob to generate code:

1. **Bob generates the code** based on your request
2. **DebugLens validates it** against your repository patterns
3. **Bob receives the validation results** and can automatically fix issues
4. **You get code that matches your project** from the start

This creates a feedback loop where AI-generated code is automatically aligned with your codebase standards.

---

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Install Dependencies

```bash
cd C:\Users\Pranav\debuglens-mcp
npm install
```

This installs the required MCP SDK:
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0"
  }
}
```

---

## 🔌 Connect to IBM Bob

### 1. Register the MCP Server

Create or update your `.mcp.json` file:

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

### 2. Restart IBM Bob

After registering the server, restart IBM Bob to connect to DebugLens.

### 3. Verify Connection

Bob will now have access to the `validate_ai_code` tool from DebugLens.

---

## 🚀 Usage

### Using the `validate_ai_code` Tool

When Bob generates code, you can validate it against your repository:

**Tool Parameters:**
- `code` (string) — The AI-generated code to validate
- `repo_path` (string) — Path to your repository folder

**Example Request:**

```javascript
{
  "tool": "validate_ai_code",
  "arguments": {
    "code": "const axios = require('axios');\n\nasync function create_user(user_data) {\n  const response = await axios.post('https://api.example.com/users', user_data);\n  return response.data;\n}",
    "repo_path": "C:\\Users\\Pranav\\debuglens-mcp\\sample-repo"
  }
}
```

**Example Response:**

```json
{
  "status": "success",
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
    "exported_utilities": ["isValidEmail", "handleError", "handleResponse", ...]
  },
  "suggestion": "Priority: Add proper error handling with try-catch blocks."
}
```

---

## 📁 Project Structure

```
debuglens-mcp/
├── .mcp.json                    # MCP server registration
├── package.json                 # Dependencies
├── README.md                    # This file
├── test-validation.js           # Test script
├── src/
│   ├── index.js                 # MCP server implementation (201 lines)
│   └── validator.js             # Code validation engine (429 lines)
├── sample-repo/                 # Example repository for testing
│   └── src/
│       ├── api.js               # API module (fetch, camelCase, try/catch)
│       ├── utils.js             # Utility functions (12 helpers)
│       ├── models.js            # Data models (user model)
│       └── handlers.js          # Error/response handlers
└── examples/
    ├── buggy-code.js            # AI code with 4 violations
    └── fixed-code.js            # Corrected version
```

---

## 🔄 Before & After Example

### ❌ Before (buggy-code.js)

AI-generated code with **4 violations**:

```javascript
const axios = require('axios');  // ❌ Wrong library

async function create_new_user(user_data) {  // ❌ snake_case naming
  // ❌ No try/catch error handling
  
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // ❌ Reimplements existing utility
  if (!email_regex.test(user_data.email)) {
    return { success: false, error: 'Invalid email' };
  }
  
  const response = await axios.post('https://api.example.com/users', user_data);
  return { success: true, data: response.data };
}
```

**DebugLens Detection:**
- ⚠️ Library mismatch: `axios` not found in repository
- ⚠️ Naming convention: `snake_case` vs repository's `camelCase`
- ⚠️ Missing error handling: No try/catch blocks
- ⚠️ Duplicate utility: Email validation already exists as `isValidEmail()`

---

### ✅ After (fixed-code.js)

Corrected code that **matches repository patterns**:

```javascript
const { isValidEmail } = require('../sample-repo/src/utils');  // ✅ Uses existing utility
const { handleError, handleResponse } = require('../sample-repo/src/handlers');  // ✅ Uses existing handlers

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

**Result:** Code that seamlessly integrates with your existing codebase! 🎉

---

## 🧪 Testing

Run the included test script to see DebugLens in action:

```bash
node test-validation.js
```

This validates `examples/buggy-code.js` against `sample-repo/` and shows all detected issues.

---

## 🛠️ How It Works

1. **Scans Repository** — Recursively reads all `.js` files from your repo
2. **Extracts Patterns** — Identifies imports, functions, naming conventions, utilities, and error handling
3. **Compares AI Code** — Analyzes the AI-generated code against extracted patterns
4. **Detects Issues** — Finds mismatches, violations, and missing patterns
5. **Provides Suggestions** — Returns actionable recommendations with severity levels

---

## 📊 Validation Metrics

DebugLens analyzes:
- **Libraries Used** — Import/require statements
- **Function Signatures** — Names, parameters, and types
- **Naming Conventions** — camelCase vs snake_case detection
- **Exported Utilities** — Available helper functions
- **Error Handling Patterns** — try/catch coverage and error checks

---

## 🎯 Use Cases

- **Code Review Automation** — Validate AI-generated PRs before merge
- **Onboarding** — Help new developers match team conventions
- **Refactoring** — Ensure consistency when updating code
- **CI/CD Integration** — Add validation to your pipeline
- **Learning Tool** — Understand your codebase patterns

---

## 🤝 Contributing

DebugLens is designed to be extensible. You can:
- Add new validation rules in `src/validator.js`
- Support additional languages beyond JavaScript
- Integrate with other MCP-compatible AI assistants
- Customize severity levels and suggestions

---

## 📄 License

ISC

---

## 🙏 Acknowledgments

**Built with IBM Bob** — The AI coding assistant that makes DebugLens possible.

IBM Bob's MCP integration enables seamless validation of AI-generated code, creating a powerful feedback loop that ensures code quality and consistency from the start.

---

**DebugLens** — Because AI-generated code should fit your project, not the other way around. 🔍✨