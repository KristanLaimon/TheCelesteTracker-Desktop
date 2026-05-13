<script lang="ts">
  import IconDelete from '~icons/material-symbols/delete';
  import IconEdit from '~icons/material-symbols/edit';
  import IconMap from '~icons/material-symbols/map';
  import defaultLevelLogo from '../../../assets/level_logo_moddedleveldefault.png';

  interface Collection {
    id: number;
    userId: number;
    name: string;
  }

  interface Props {
    collection: Collection;
    previewIcons?: string[];
    onEdit: (col: Collection) => void;
    onDelete: (id: number) => void;
  }

  let { collection, previewIcons = [], onEdit, onDelete }: Props = $props();

  const placeholderIcons = Array.from({ length: 18 }, () => defaultLevelLogo.src);
  const backgroundIcons = $derived(previewIcons.length > 0 ? previewIcons : placeholderIcons);
</script>

<div class="relative group h-56 rounded-2xl bg-zinc-950 border border-outline-muted overflow-hidden hover:border-orange-400/50 transition-all">
  <div class="absolute inset-0 p-3 opacity-25 group-hover:opacity-40 transition-opacity">
    <div class="grid grid-cols-6 gap-2 rotate-6 scale-110">
      {#each [...backgroundIcons, ...backgroundIcons].slice(0, 36) as icon, index (index)}
        <div class="aspect-square rounded-lg bg-white/5 border border-white/5 p-1">
          <img src={icon} alt="" class="w-full h-full object-contain" />
        </div>
      {/each}
    </div>
  </div>
  <div class="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/30"></div>
  <div class="absolute inset-0 bg-linear-to-r from-zinc-950/80 via-transparent to-transparent"></div>

  <a href={`/collections/detail?id=${collection.id}`} class="relative z-10 flex flex-col justify-end h-full p-6">
    <div class="w-11 h-11 rounded-xl bg-orange-400/15 border border-orange-400/25 text-orange-300 flex items-center justify-center mb-4">
      <IconMap class="text-2xl" />
    </div>
    <h3 class="text-2xl font-headline font-black text-white tracking-tight mb-1 truncate">{collection.name}</h3>
    <p class="text-zinc-500 text-sm font-medium">{previewIcons.length} chapter icons indexed</p>
  </a>

  <div class="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onclick={(e) => { e.preventDefault(); onEdit(collection); }}
      class="p-2 rounded-lg bg-zinc-950/80 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
      aria-label="Edit Collection"
    >
      <IconEdit />
    </button>
    <button
      onclick={(e) => { e.preventDefault(); onDelete(collection.id); }}
      class="p-2 rounded-lg bg-zinc-950/80 border border-white/10 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
      aria-label="Delete Collection"
    >
      <IconDelete />
    </button>
  </div>
</div>
