export type RunData = {
	levelName: string;
	levelSide: string;
	type: "Vanilla" | "Modded";
	attemptType: "Wings Golden" | "Normal" | "Golden Attempt";
	clearTime: number; // In milliseconds
	deaths: number;
	dashes: number;
	jumps: number;
	berriesAchieved: number;
	status: "Completed" | "Goldenberry completed" | "Attempted" | "PB";
	iconPath: string;
	iconData?: string;
};
