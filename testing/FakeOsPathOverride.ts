// NODE.JS/BUN/DENO ONLY
import NodeJsOS from "./NodeJsOs";

export class FakeOsPathOverride extends NodeJsOS {
	constructor(private overrides: Record<string, string>) {
		super();
	}

	override async getEnv(key: string): Promise<string> {
		return this.overrides[key] ?? super.getEnv(key);
	}
}
