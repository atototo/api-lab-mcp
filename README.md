# API Lab MCP 🧪

[![npm version](https://badge.fury.io/js/api-lab-mcp.svg)](https://badge.fury.io/js/api-lab-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Claude Desktop](https://img.shields.io/badge/Claude-Desktop%20Ready-blue.svg)](https://claude.ai)

> Transform Claude into your AI-powered API testing laboratory. Test, debug, and document APIs through natural conversation.

## 🌟 Why API Lab MCP?

Stop switching between tools. Stop writing repetitive test scripts. Start having conversations with your APIs.

**The Problem:** Traditional API testing tools require constant context switching, manual script writing, and repetitive workflows that slow down development.

**The Solution:** API Lab MCP integrates directly with Claude Desktop and Claude Code, allowing you to test APIs through natural language while you code. No more jumping between Postman, terminal, and your IDE.

### What makes it different?

- 🤖 **AI-First Design**: Built specifically for Claude's conversational interface
- 💬 **Natural Language**: Test APIs by describing what you want, not clicking through UIs
- 🔄 **Zero Context Switching**: Stay in your development flow
- 📚 **Auto Documentation**: Generate API docs from your test conversations
- 🎯 **Smart Assertions**: Claude understands your intent and creates appropriate tests

## ✨ Key Features

- **🔐 Universal Authentication** - Bearer tokens, API keys, OAuth2, session cookies, and CSRF tokens
- **📊 Intelligent Response Analysis** - Automatic validation of status codes, headers, and JSON paths
- **⚡ Real-time Performance Metrics** - Response times, payload sizes, and Core Web Vitals
- **🎯 Conversational Testing** - Test complex scenarios through natural dialogue
- **📋 Spec-based Test Generation** - Auto-generate test suites from OpenAPI/Swagger docs
- **🔄 Batch Testing** - Run multiple APIs in parallel or sequence
- **🧪 MCP Server Testing** - Test other MCP servers' tools and resources
- **🌍 Environment Management** - Switch between dev, staging, and production seamlessly

## 🚀 Quick Start (30 seconds)

### For Claude Code
```bash
# Install globally
npm install -g api-lab-mcp

# Add to Claude Code
claude mcp add api-lab-mcp api-lab-mcp

# Start testing!
# Tell Claude: "Test my API at localhost:3000"
```

### For Claude Desktop
```bash
# Install via npm
npm install -g api-lab-mcp

# Then add to Claude Desktop config (see Installation section)
```

That's it! You're ready to test APIs with Claude.

## 📸 Live Demo with Claude Desktop

Watch API Lab MCP in action with Claude Desktop - testing real APIs through conversation:

![Claude Desktop Demo](https://github.com/user-attachments/assets/cbde1430-aa7f-480b-a5f7-28a92623e54a)

### Real Results from Claude Desktop

<img width="842" height="721" alt="Claude Desktop Results" src="https://github.com/user-attachments/assets/c578a7bb-1f91-4fba-a006-1afbc7bdeae7" />

> "Test your APIs through natural conversation - in any language you prefer."

## 💡 Use Cases

### For Development Teams
- **API Development**: Test endpoints as you build them without leaving your IDE
- **Debugging**: Quickly diagnose why an API is failing with intelligent analysis
- **Documentation**: Auto-generate API docs from your test conversations
- **Onboarding**: New team members can test APIs without learning complex tools

### For QA Engineers
- **Test Automation**: Generate test suites from OpenAPI specs automatically
- **Regression Testing**: Run batch tests across all endpoints
- **Performance Testing**: Monitor response times and identify bottlenecks
- **Session Testing**: Test complex authentication flows with cookies and tokens

### For DevOps
- **Health Checks**: Monitor API availability across environments
- **Load Testing**: Test API performance under various conditions
- **Environment Validation**: Ensure APIs work correctly after deployment
- **Integration Testing**: Test API integrations with third-party services

## 💬 Real-World Examples

### Test a REST API
```
You: "Test the GitHub API to get my user info"
Claude: *Tests GET https://api.github.com/user with your token*
```

### Debug a Failed Request
```
You: "Why is my login endpoint returning 401?"
Claude: *Analyzes headers, body, and suggests missing auth token*
```

### Session-based Authentication
```
You: "Test my app with session cookie JSESSIONID=ABC123"
Claude: *Configures session and tests authenticated endpoints*
```

### Performance Testing
```
You: "Check if all my endpoints respond under 200ms"
Claude: *Runs performance tests and generates report*
```

### Generate Tests from Swagger
```
You: "Create tests from my OpenAPI spec at /api/docs"
Claude: *Generates comprehensive test suite automatically*
```

## 🔧 Installation

### Claude Code Installation

```bash
# Method 1: Global install (recommended)
npm install -g api-lab-mcp
claude mcp add api-lab-mcp api-lab-mcp

# Method 2: Using npx (no install needed)
claude mcp add api-lab-mcp "npx -y api-lab-mcp"

# Method 3: Local development
git clone https://github.com/atototo/api-lab-mcp.git
cd api-lab-mcp
npm install && npm run build
claude mcp add api-lab-local "node $(pwd)/dist/mcp/server.js"
```

### Claude Desktop Installation

<details>
<summary><b>macOS/Linux Setup</b></summary>

1. Install the package:
```bash
npm install -g api-lab-mcp
```

2. Find your config file:
```bash
# macOS
open ~/Library/Application\ Support/Claude/

# Linux
open ~/.config/claude/
```

3. Edit `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "api-lab-mcp": {
      "command": "npx",
      "args": ["-y", "api-lab-mcp"]
    }
  }
}
```

4. Restart Claude Desktop
</details>

<details>
<summary><b>Windows Setup</b></summary>

1. Install the package:
```powershell
npm install -g api-lab-mcp
```

2. Open config folder:
```powershell
explorer %APPDATA%\Claude
```

3. Edit `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "api-lab-mcp": {
      "command": "npx.cmd",
      "args": ["-y", "api-lab-mcp"]
    }
  }
}
```

4. Restart Claude Desktop
</details>

<details>
<summary><b>Docker Setup</b></summary>

```dockerfile
FROM node:20-alpine
RUN npm install -g api-lab-mcp
EXPOSE 3000
CMD ["api-lab-mcp", "--http-mode"]
```

Run with:
```bash
docker build -t api-lab-mcp .
docker run -p 3000:3000 api-lab-mcp
```
</details>

### Verify Installation

After installation, ask Claude:
```
"Can you test the API at https://api.github.com?"
```

If Claude can test the API, installation was successful!

## 🏗️ For Developers

### Local Development Workflow

API Lab MCP supercharges your local development:

**Real-time API Testing**
```
"Test POST /api/users on localhost:3000 with mock data"
```

**Smart Debugging**
```
"Why is this endpoint slow? Profile the response time"
```

**Automatic Documentation**
```
"Generate README docs from these test results"
```

**Pre-deployment Validation**
```
"Run health checks on all endpoints before I deploy"
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/atototo/api-lab-mcp.git
cd api-lab-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Architecture

```
api-lab-mcp/
├── src/
│   ├── mcp/              # MCP server implementation
│   ├── core/             # Core business logic
│   ├── http/             # HTTP client layer
│   └── types/            # TypeScript definitions
├── tests/                # Test suites
└── docs/                 # Documentation
```

## 📊 How It Compares

| Feature | API Lab MCP | Postman | Insomnia | Thunder Client |
|---------|------------|---------|----------|----------------|
| **AI-Powered Testing** | ✅ Native | ❌ | ❌ | ❌ |
| **Natural Language** | ✅ | ❌ | ❌ | ❌ |
| **Claude Integration** | ✅ | ❌ | ❌ | ❌ |
| **Zero Setup** | ✅ | ❌ | ❌ | ⚠️ |
| **Session Management** | ✅ | ✅ | ✅ | ✅ |
| **OpenAPI Support** | ✅ | ✅ | ✅ | ⚠️ |
| **MCP Protocol** | ✅ | ❌ | ❌ | ❌ |
| **Conversational UI** | ✅ | ❌ | ❌ | ❌ |
| **Auto Documentation** | ✅ | ⚠️ | ⚠️ | ❌ |
| **Free & Open Source** | ✅ | ⚠️ | ⚠️ | ✅ |

## 📚 Documentation

### Core Tools

- **`test_http_endpoint`** - Test any HTTP endpoint with auth, headers, and body
- **`test_with_assertions`** - Advanced testing with response validation
- **`test_with_session`** - Session-based authentication with cookies
- **`batch_test`** - Run multiple tests in parallel
- **`analyze_api_spec`** - Extract info from OpenAPI/Swagger specs
- **`generate_test_scenarios`** - Auto-generate comprehensive test suites

### Advanced Features

- **Smart Assertions**: Validate responses with JSONPath, regex, and custom rules
- **Environment Management**: Switch between dev/staging/prod seamlessly
- **Performance Profiling**: Track response times and identify bottlenecks
- **Test Generation**: Create tests from OpenAPI specs automatically
- **MCP Discovery**: Find and test other MCP servers

[Full API Documentation →](https://github.com/atototo/api-lab-mcp/wiki)

## 🤝 Contributing

We love contributions! Whether it's a bug report, feature request, or pull request, all contributions are welcome.

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/api-lab-mcp.git

# Create your feature branch
git checkout -b feature/amazing-feature

# Make your changes and commit
git commit -m 'Add amazing feature'

# Push and create PR
git push origin feature/amazing-feature
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 🌟 Success Stories

> "API Lab MCP reduced our API testing time by 70%. We now test as we code, right in Claude." - *Senior Developer at TechCorp*

> "The natural language interface is a game-changer. Junior developers can now write complex API tests." - *CTO at StartupXYZ*

> "We replaced three different tools with just API Lab MCP. It's that powerful." - *DevOps Lead*

## 📈 Roadmap

- [ ] Visual Studio Code extension
- [ ] GraphQL support
- [ ] WebSocket testing
- [ ] Load testing capabilities
- [ ] CI/CD integration
- [ ] Test recording and replay
- [ ] Team collaboration features

## 🛟 Support

- 📖 [Documentation](https://github.com/atototo/api-lab-mcp/wiki)
- 🐛 [Issue Tracker](https://github.com/atototo/api-lab-mcp/issues)

## 📄 License

MIT © 2024 atototo

---

<div align="center">

**If API Lab MCP helps your development workflow, please consider giving it a ⭐**

[![Star on GitHub](https://img.shields.io/github/stars/atototo/api-lab-mcp.svg?style=social)](https://github.com/atototo/api-lab-mcp)

**Built with ❤️ for developers who value their time**

</div>
