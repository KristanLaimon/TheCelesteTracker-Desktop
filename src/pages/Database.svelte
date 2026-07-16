<script lang="ts">
import CTDB from '../db/index';
import { get } from '../libs/DI';
import { Log_Info } from '../libs/Logger';

const db = get(CTDB);

async function Test() {
	const res = await db.Campaigns.GetAll();
	Log_Info(res);
}

async function GameBananaApi() {
	// const res = await ((await fetch("api.gamebanana.com/Core/Item/Data/AllowedItemTypes?format=json")).json());
	// console.log(res);
	// Log_Info(res);
	// const res = await fetch("https://api.gamebanana.com/Core/Item/Data",
	// {
	//   headers: {
	//     "Content-Type": "application/json",
	//   },
	//   body: JSON.stringify({
	//     itemType
	//   })
	// }
	// );
	// const json = await res.json();
	// Log_Info(json);
}
</script>


<button onclick={Test}>Call database</button>
<button onclick={GameBananaApi}>Game banana</button>