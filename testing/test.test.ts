import { test } from 'bun:test';
import Celeste from '../src/libs/Celeste';
import { GetDependency } from './setup';

test('Getting all installed mods', async () => {
	GetDependency(Celeste);
});
