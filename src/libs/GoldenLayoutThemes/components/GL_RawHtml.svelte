<script lang="ts">
import DOMPurify from 'dompurify';

let { htmlContent = '<p>Empty content....</p>' } = $props<{ htmlContent?: string }>();

const htmlPurified = $derived(DOMPurify.sanitize(htmlContent));
</script>

<div class="h-full overflow-y-auto text-slate-100 flex flex-col gap-4">
  {@html htmlPurified}
</div>
