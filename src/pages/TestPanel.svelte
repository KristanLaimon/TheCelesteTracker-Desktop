<script lang="ts">
  let { label = '' } = $props<{ label?: string }>();
</script>

<div class="p-6 h-full overflow-y-auto text-slate-100 flex flex-col gap-4">
  <h2 class="text-xl font-bold">Component {label}</h2>
  <p>This is test component {label}.</p>
</div>
