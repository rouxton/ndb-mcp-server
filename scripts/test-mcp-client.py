#!/usr/bin/env python3
"""
MCP Server Test Client

This script provides a simple way to test the NDB MCP Server
by sending JSON-RPC messages and displaying responses.

Usage:
    python scripts/test-mcp-client.py
"""

import json
import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional

def load_env_file():
    """Load environment variables from .env file if it exists"""
    env_path = Path.cwd() / '.env'
    
    if env_path.exists():
        print(f"ℹ️  Loading configuration from .env file...")
        
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, _, value = line.partition('=')
                    key = key.strip()
                    value = value.strip()
                    
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    
                    # Only set if not already in environment
                    if key not in os.environ:
                        os.environ[key] = value
        
        print("✅ Environment variables loaded from .env file")
    else:
        print("ℹ️  No .env file found, using system environment variables")

class MCPTestClient:
    def __init__(self, server_command: list, env: Dict[str, str] = None):
        """Initialize MCP test client
        
        Args:
            server_command: Command to start the MCP server
            env: Environment variables for the server
        """
        self.server_command = server_command
        self.env = env or {}
        self.process = None
        
    def start_server(self):
        """Start the MCP server process"""
        # Merge environment variables
        server_env = os.environ.copy()
        server_env.update(self.env)
        
        self.process = subprocess.Popen(
            self.server_command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=server_env
        )
        print(f"✅ Started MCP server: {' '.join(self.server_command)}")
        
    def send_request(self, method: str, params: Dict[str, Any] = None, request_id: int = 1) -> Optional[Dict]:
        """Send JSON-RPC request to server
        
        Args:
            method: RPC method name
            params: Method parameters
            request_id: Request ID
            
        Returns:
            Response dictionary or None if error
        """
        if not self.process:
            print("❌ Server not started")
            return None
            
        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method
        }
        
        if params:
            request["params"] = params
            
        try:
            # Send request
            request_json = json.dumps(request) + "\n"
            self.process.stdin.write(request_json)
            self.process.stdin.flush()
            
            # Read response
            response_line = self.process.stdout.readline()
            if response_line:
                return json.loads(response_line.strip())
            else:
                print("❌ No response from server")
                return None
                
        except Exception as e:
            print(f"❌ Error sending request: {e}")
            return None
    
    def stop_server(self):
        """Stop the MCP server"""
        if self.process:
            self.process.terminate()
            self.process.wait()
            print("🛑 Server stopped")

def test_basic_functionality():
    """Test basic MCP server functionality"""
    print("🧪 Testing NDB MCP Server\n")
    
    # Load .env file first
    load_env_file()
    
    # Server configuration using loaded environment variables
    server_command = ["node", "dist/index.js"]
    server_env = {
        "NDB_BASE_URL": os.getenv("NDB_BASE_URL", "https://your-ndb-server.com"),
        "NDB_USERNAME": os.getenv("NDB_USERNAME", "admin"),
        "NDB_PASSWORD": os.getenv("NDB_PASSWORD", "password"),
        "NDB_VERIFY_SSL": os.getenv("NDB_VERIFY_SSL", "true")
    }
    
    # Display configuration (hide password)
    print("📋 Configuration:")
    print(f"   NDB_BASE_URL: {server_env['NDB_BASE_URL']}")
    print(f"   NDB_USERNAME: {server_env['NDB_USERNAME']}")
    print(f"   NDB_PASSWORD: {'*' * len(server_env['NDB_PASSWORD'])}")
    print(f"   NDB_VERIFY_SSL: {server_env['NDB_VERIFY_SSL']}")
    print()
    
    client = MCPTestClient(server_command, server_env)
    
    try:
        # Start server
        client.start_server()
        
        # Test 1: List available tools
        print("🔧 Test 1: List available tools")
        response = client.send_request("tools/list")
        if response and "result" in response:
            tools = response["result"]["tools"]
            print(f"✅ Found {len(tools)} tools:")
            for tool in tools[:5]:  # Show first 5 tools
                print(f"   - {tool['name']}: {tool['description'][:60]}...")
            if len(tools) > 5:
                print(f"   ... and {len(tools) - 5} more tools")
        else:
            print("❌ Failed to list tools")
            print(f"Response: {response}")
        
        print()
        
        # Test 2: Call a simple tool
        print("🔧 Test 2: Call ndb_list_databases tool")
        response = client.send_request("tools/call", {
            "name": "ndb_list_databases",
            "arguments": {}
        })
        
        if response and "result" in response:
            content = response["result"]["content"]
            if content and len(content) > 0:
                print("✅ Database list retrieved successfully")
                print(f"   Response type: {content[0].get('type', 'unknown')}")
                if content[0].get("type") == "text":
                    text_content = content[0].get("text", "")
                    lines = text_content.split('\n')[:3]  # First 3 lines
                    for line in lines:
                        if line.strip():
                            print(f"   {line}")
            else:
                print("⚠️  Empty response from database list")
        else:
            print("❌ Failed to call ndb_list_databases")
            print(f"Response: {response}")
        
        print()
        
        # Test 3: Call tool with parameters
        print("🔧 Test 3: Call ndb_list_clusters tool")
        response = client.send_request("tools/call", {
            "name": "ndb_list_clusters", 
            "arguments": {}
        })
        
        if response and "result" in response:
            print("✅ Cluster list retrieved successfully")
        else:
            print("❌ Failed to call ndb_list_clusters")
            print(f"Response: {response}")
            
        print()
        
        # Test 4: Test error handling
        print("🔧 Test 4: Test error handling with invalid tool")
        response = client.send_request("tools/call", {
            "name": "invalid_tool_name",
            "arguments": {}
        })
        
        if response and "error" in response:
            print("✅ Error handling works correctly")
            print(f"   Error: {response['error']['message']}")
        else:
            print("⚠️  Unexpected response for invalid tool")
            
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
    finally:
        client.stop_server()

def test_connection_only():
    """Test only the NDB connection without MCP calls"""
    print("🔗 Testing NDB Connection Only\n")
    
    # Load .env file first
    load_env_file()
    
    # Run the connection test script
    try:
        result = subprocess.run(
            ["node", "scripts/test-connection.js"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        print("📊 Connection Test Results:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Stderr output:")
            print(result.stderr)
            
        if result.returncode == 0:
            print("✅ Connection test passed")
        else:
            print("❌ Connection test failed")
            
    except subprocess.TimeoutExpired:
        print("❌ Connection test timed out")
    except FileNotFoundError:
        print("❌ Connection test script not found. Run 'npm run build' first.")
    except Exception as e:
        print(f"❌ Connection test error: {e}")

def main():
    """Main test function"""
    print("🚀 NDB MCP Server Test Suite\n")
    
    # Check if built files exist
    if not os.path.exists("dist/index.js"):
        print("❌ Server not built. Run 'npm run build' first.")
        sys.exit(1)
    
    # Load .env file first
    load_env_file()
    
    # Check environment variables
    required_vars = ["NDB_BASE_URL", "NDB_USERNAME", "NDB_PASSWORD"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set them in your .env file or environment")
        sys.exit(1)
    
    # Menu for test selection
    print("Select test type:")
    print("1. Full MCP functionality test")
    print("2. NDB connection test only")
    print("3. Both tests")
    
    try:
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == "1":
            test_basic_functionality()
        elif choice == "2":
            test_connection_only()
        elif choice == "3":
            test_connection_only()
            print("\n" + "="*50 + "\n")
            test_basic_functionality()
        else:
            print("❌ Invalid choice")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Testing cancelled by user")
    except Exception as e:
        print(f"❌ Testing failed: {e}")

if __name__ == "__main__":
    main()
