import { describe, expect, test } from "bun:test";
import { AsyncLazy } from "../../src/libs/AsyncLazy";

describe("AsyncLazy", () => {
	test("should evaluate lazily on first get call", async () => {
		let executionCount = 0;
		const lazy = new AsyncLazy(async () => {
			executionCount++;
			return "hello world";
		});

		expect(executionCount).toBe(0);
		expect(lazy.isReady()).toBe(false);

		const result = await lazy.get();
		expect(result).toBe("hello world");
		expect(executionCount).toBe(1);
		expect(lazy.isReady()).toBe(true);
	});

	test("should reuse resolved promise on subsequent calls", async () => {
		let executionCount = 0;
		const lazy = new AsyncLazy(async () => {
			executionCount++;
			return { data: 42 };
		});

		const res1 = await lazy.get();
		const res2 = await lazy.get();
		const res3 = await lazy.get();

		expect(res1).toBe(res2);
		expect(res2).toBe(res3);
		expect(executionCount).toBe(1);
	});

	test("should coalesce 50 concurrent requests so factory runs only once", async () => {
		let executionCount = 0;
		const lazy = new AsyncLazy(async () => {
			executionCount++;
			await new Promise((resolve) => setTimeout(resolve, 20));
			return `computed-${executionCount}`;
		});

		// Fire 50 concurrent calls
		const promises = Array.from({ length: 50 }, () => lazy.get());
		const results = await Promise.all(promises);

		expect(executionCount).toBe(1);
		for (const val of results) {
			expect(val).toBe("computed-1");
		}
	});

	test("should forward arguments to the factory function", async () => {
		let receivedArgs: { filter: string } | undefined;
		const lazy = new AsyncLazy(async (args?: { filter: string }) => {
			receivedArgs = args;
			return `filtered:${args?.filter}`;
		});

		const res = await lazy.get({ filter: "active" });
		expect(res).toBe("filtered:active");
		expect(receivedArgs).toEqual({ filter: "active" });
	});

	test("should force refresh when forceRefresh option is provided", async () => {
		let executionCount = 0;
		const lazy = new AsyncLazy(async () => {
			executionCount++;
			return `version-${executionCount}`;
		});

		const val1 = await lazy.get();
		expect(val1).toBe("version-1");

		const val2 = await lazy.get({ forceRefresh: true });
		expect(val2).toBe("version-2");
		expect(executionCount).toBe(2);

		const val3 = await lazy.get();
		expect(val3).toBe("version-2");
		expect(executionCount).toBe(2);
	});

	test("should reset cached promise when reset() is called", async () => {
		let executionCount = 0;
		const lazy = new AsyncLazy(async () => {
			executionCount++;
			return executionCount;
		});

		await lazy.get();
		expect(lazy.isReady()).toBe(true);

		lazy.reset();
		expect(lazy.isReady()).toBe(false);

		const val = await lazy.get();
		expect(val).toBe(2);
		expect(executionCount).toBe(2);
	});

	test("should reset cached promise on rejection by default", async () => {
		let executionCount = 0;
		const lazy = new AsyncLazy(async () => {
			executionCount++;
			if (executionCount === 1) {
				throw new Error("Transient Failure");
			}
			return "Recovered Success";
		});

		expect(lazy.get()).rejects.toThrow("Transient Failure");
		await new Promise((resolve) => setTimeout(resolve, 5));

		expect(lazy.isReady()).toBe(false);

		const recovered = await lazy.get();
		expect(recovered).toBe("Recovered Success");
		expect(executionCount).toBe(2);
	});
});
