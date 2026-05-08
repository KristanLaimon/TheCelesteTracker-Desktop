<script lang="ts">
  import IconFolder from '~icons/material-symbols/folder';
  import IconDelete from '~icons/material-symbols/delete';
  import IconEdit from '~icons/material-symbols/edit';

  interface Collection {
    id: number;
    userId: number;
    name: string;
  }

  interface Props {
    collection: Collection;
    onEdit: (col: Collection) => void;
    onDelete: (id: number) => void;
  }

  let { collection, onEdit, onDelete }: Props = $props();
</script>

<div class="relative group h-48 rounded-2xl bg-surface/40 border border-outline-muted overflow-hidden hover:border-primary/50 hover:bg-surface-high/60 transition-all">
  <a href={`/collections/detail?id=${collection.id}`} class="flex flex-col h-full p-6">
    <IconFolder class="text-4xl text-orange-400 mb-4" />
    <h3 class="text-xl font-bold text-white mb-1">{collection.name}</h3>
    <p class="text-zinc-500 text-sm">Custom Level Set</p>
  </a>

  <!-- Actions -->
  <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onclick={(e) => { e.preventDefault(); onEdit(collection); }}
      class="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
      aria-label="Edit Collection"
    >
      <IconEdit />
    </button>
    <button
      onclick={(e) => { e.preventDefault(); onDelete(collection.id); }}
      class="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors"
      aria-label="Delete Collection"
    >
      <IconDelete />
    </button>
  </div>
</div>
