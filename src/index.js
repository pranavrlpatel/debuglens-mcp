#!/usr/bin/env node

/**
 * DebugLens MCP Server
 * 
 * A Model Context Protocol server that provides AI code validation capabilities.
 * This server exposes tools for validating AI-generated code against repository context.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { validateCode } = require("./validator.js");

/**
 * Main server initialization and execution
 */
async function main() {
  try {
    // Create MCP server instance
    const server = new Server(
      {
        name: "debuglens",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    /**
     * Handler for listing available tools
     * Returns the list of tools this server provides
     */
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "validate_ai_code",
            description: "Validates AI-generated code against repository context. Analyzes the code for potential issues, compatibility with existing codebase, and best practices.",
            inputSchema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "The AI generated code to validate",
                },
                repo_path: {
                  type: "string",
                  description: "Path to the repository folder for context analysis",
                },
              },
              required: ["code", "repo_path"],
            },
          },
        ],
      };
    });

    /**
     * Handler for tool execution
     * Processes tool calls and returns results
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Validate tool name
        if (name !== "validate_ai_code") {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Validate required arguments
        if (!args || typeof args !== "object") {
          throw new Error("Invalid arguments: expected an object");
        }

        const { code, repo_path } = args;

        // Validate code parameter
        if (!code || typeof code !== "string") {
          throw new Error("Invalid 'code' parameter: must be a non-empty string");
        }

        // Validate repo_path parameter
        if (!repo_path || typeof repo_path !== "string") {
          throw new Error("Invalid 'repo_path' parameter: must be a non-empty string");
        }

        // Log the validation request (to stderr for debugging)
        console.error(`[DebugLens] Validating code against repository: ${repo_path}`);
        console.error(`[DebugLens] Code length: ${code.length} characters`);

        // Perform validation using the validator module
        const validationResult = await validateCode(code, repo_path);
        
        // Add metadata to the result
        const enrichedResult = {
          status: validationResult.issues.some(i => i.severity === 'critical') ? "error" : "success",
          message: "Code validation completed",
          timestamp: new Date().toISOString(),
          code_length: code.length,
          repo_path: repo_path,
          ...validationResult
        };

        // Return successful response
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(enrichedResult, null, 2),
            },
          ],
        };
      } catch (error) {
        // Handle tool execution errors
        console.error(`[DebugLens] Tool execution error: ${error.message}`);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "error",
                message: error.message,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });

    /**
     * Set up stdio transport for communication
     */
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);

    console.error("[DebugLens] Server started successfully");
    console.error("[DebugLens] Listening for requests via stdio...");

  } catch (error) {
    // Handle server initialization errors
    console.error(`[DebugLens] Fatal error during server initialization: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * Ensures clean exit on termination signals
 */
function setupShutdownHandlers() {
  const shutdown = (signal) => {
    console.error(`[DebugLens] Received ${signal}, shutting down gracefully...`);
    process.exit(0);
  };

  // Handle termination signals
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    console.error("[DebugLens] Uncaught exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("[DebugLens] Unhandled rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
}

// Set up shutdown handlers
setupShutdownHandlers();

// Start the server
main().catch((error) => {
  console.error("[DebugLens] Unhandled error in main:", error);
  process.exit(1);
});

// Made with Bob
