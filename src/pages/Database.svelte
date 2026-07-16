<script lang="ts">
  import CTDB from "../db/index";
  import { get } from "../libs/DI";
  import { onMount } from "svelte";

  const db = get(CTDB);

  onMount(async () => {
    const res = await db.Campaigns.GetAll();
    console.log(res);
  });
</script>

<p>Hola</p>
