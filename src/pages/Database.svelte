<script lang="ts">
import { onMount } from 'svelte';
import CTDB from '../db/index';
import { get } from '../libs/DI';
import { Log_Info } from '../libs/Logger';

const db = get(CTDB);

onMount(async () => {
	const res = await db.Campaigns.GetAll();
	Log_Info(res);
});
</script>

<p>Hola</p>
