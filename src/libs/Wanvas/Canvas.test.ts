import { describe, expect, test } from 'bun:test';

// Let's copy the sanitize/validation logic we implemented in Canvas.svelte to test it directly
function sanitizeNodesForTest<T extends { id?: string; layer?: number }>(nodes: T[]): T[] {
	// First check layer values and throw error if negative
	for (const node of nodes) {
		if (node.layer !== undefined && node.layer < 0) {
			throw new Error('Layer index must be non-negative');
		}
	}

	// Calculate maximum layer index currently present on any node
	let maxLayer = -1;
	for (const node of nodes) {
		if (node.layer !== undefined && node.layer > maxLayer) {
			maxLayer = node.layer;
		}
	}

	return nodes.map((node) => {
		const id = node.id || 'mock-uuid';
		let layer = node.layer;
		if (layer === undefined) {
			maxLayer = maxLayer + 1;
			layer = maxLayer;
		}
		return { ...node, id, layer };
	});
}

function bringToTopForTest<T extends { layer?: number }>(nodes: T[], node: T): T[] {
	const maxLayer = Math.max(0, ...nodes.map((n) => n.layer ?? 0));
	if (node.layer !== maxLayer) {
		node.layer = maxLayer + 1;
	}
	return nodes;
}

describe('Canvas Layers Logic', () => {
	test('Should throw error if a node has a negative layer index', () => {
		const nodes = [{ id: '1', x: 0, y: 0, layer: -1 }];
		expect(() => sanitizeNodesForTest(nodes)).toThrow('Layer index must be non-negative');
	});

	test('Should accept positive/zero layer index', () => {
		const nodes = [
			{ id: '1', x: 0, y: 0, layer: 0 },
			{ id: '2', x: 10, y: 10, layer: 5 },
		];
		const sanitized = sanitizeNodesForTest(nodes);
		expect(sanitized[0].layer).toBe(0);
		expect(sanitized[1].layer).toBe(5);
	});

	test('Should assign progressive layers to nodes without a layer', () => {
		const nodes = [
			{ id: '1', x: 0, y: 0 },
			{ id: '2', x: 10, y: 10 },
		];
		const sanitized = sanitizeNodesForTest(nodes);
		expect(sanitized[0].layer).toBe(0);
		expect(sanitized[1].layer).toBe(1);
	});

	test('Should assign layer above max existing layer for new nodes without layer', () => {
		const nodes = [
			{ id: '1', x: 0, y: 0, layer: 5 },
			{ id: '2', x: 10, y: 10 },
		];
		const sanitized = sanitizeNodesForTest(nodes);
		expect(sanitized[0].layer).toBe(5);
		expect(sanitized[1].layer).toBe(6);
	});

	test('Should bring a clicked node to the top', () => {
		let nodes = [
			{ id: '1', x: 0, y: 0, layer: 0 },
			{ id: '2', x: 10, y: 10, layer: 1 },
			{ id: '3', x: 20, y: 20, layer: 2 },
		];
		// Click on node 2
		nodes = bringToTopForTest(nodes, nodes[1]);
		expect(nodes[1].layer).toBe(3); // should be greater than the previous max layer (2)

		// Click on node 1
		nodes = bringToTopForTest(nodes, nodes[0]);
		expect(nodes[0].layer).toBe(4); // should be greater than the new max layer (3)
	});
});
