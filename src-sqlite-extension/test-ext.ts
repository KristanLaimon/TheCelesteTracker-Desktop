import { spawn } from "node:child_process";
import { join } from "node:path";

const EXT_PATH = join(import.meta.dir, "..", "extensions", "sqlite", "sqlite-win_x64.exe");
const DB_PATH = "TheCelesteTrackerTestDb.db";
const TEST_REQ_ID = "test-uuid-5678";

console.log("🧪 Starting SQLite Extension Integration Test...");
console.log(`📂 Testing executable: ${EXT_PATH}`);

let extensionProcess: any = null;
let wsConnection: any = null;
let testPassed = false;

// 1. Start Bun WebSocket Server
const server = Bun.serve({
	port: 0, // Pick any available port
	fetch(req, server) {
		if (server.upgrade(req)) {
			return;
		}
		return new Response("Upgrade failed", { status: 400 });
	},
	websocket: {
		open(ws) {
			console.log("🔌 Extension successfully connected to WebSocket server!");
			wsConnection = ws;

			// Send executeSql query
			const queryPayload = {
				event: "executeSql",
				data: {
					reqId: TEST_REQ_ID,
					db: DB_PATH,
					sql: "SELECT * from Campaigns;"
				}
			};

			console.log("📤 Sending test query event...");
			ws.send(JSON.stringify(queryPayload));
		},
		message(ws, message) {
			console.log(`📥 Received message from extension: ${message}`);
			try {
				const response = JSON.parse(message as string);
				
				// The response from C goes through app.broadcast:
				// { id, method: "app.broadcast", accessToken, data: { event: "sqlResult", data: { reqId, result } } }
				if (response.method === "app.broadcast" && response.data?.event === "sqlResult") {
					const payload = response.data.data;
					console.log("🔎 Parsed payload:", payload);

					if (payload.reqId === TEST_REQ_ID) {
						const result = payload.result;
						if (result && result.success && result.rows && result.rows.length > 0) {
							console.log(`✅ SQLite Version verified: ${result.rows[0].version}`);
							testPassed = true;
						} else {
							console.error("❌ SQL query result was unsuccessful or empty:", result);
						}
					} else {
						console.error(`❌ Request ID mismatch! Expected ${TEST_REQ_ID}, got ${payload.reqId}`);
					}
				}
			} catch (e) {
				console.error("❌ Failed to parse response JSON:", e);
			}

			// End the test
			cleanup();
		},
		close(ws, code, message) {
			console.log("🔌 Connection closed by extension");
		}
	}
});

const PORT = server.port;
console.log(`📡 Mock Neutralino server listening on ws://127.0.0.1:${PORT}`);

// 2. Spawn C Extension
try {
	extensionProcess = spawn(EXT_PATH, [], {
		stdio: ["pipe", "inherit", "inherit"]
	});

	extensionProcess.on("exit", (code: number) => {
		console.log(`⏹️ Extension process exited with code ${code}`);
		if (testPassed) {
			console.log("\n🎉 INTEGRATION TEST PASSED SUCCESSFULLY!\n");
			process.exit(0);
		} else {
			console.error("\n❌ INTEGRATION TEST FAILED!\n");
			process.exit(1);
		}
	});

	// Write mock config info to stdin
	const config = {
		nlPort: String(PORT),
		nlToken: "mock-token-xyz",
		nlExtensionId: "sqlite",
		nlConnectToken: "mock-connect-token-123"
	};

	console.log("📥 Writing configuration to extension stdin...");
	extensionProcess.stdin.write(JSON.stringify(config) + "\n");
} catch (error) {
	console.error("❌ Failed to spawn extension process:", error);
	server.stop();
	process.exit(1);
}

// Timeout backup to avoid hanging
const timeout = setTimeout(() => {
	console.error("⏰ Test timed out after 10 seconds!");
	cleanup();
}, 10000);

function cleanup() {
	clearTimeout(timeout);
	if (wsConnection) {
		wsConnection.close();
	}
	if (extensionProcess) {
		extensionProcess.kill();
	}
	server.stop();
}
