<script lang="ts">
    import type { Component } from "svelte";

    let { 
        href = "/", 
        icon: Icon, 
        title, 
        description, 
        disabled = false, 
        hoverColor = "gray" 
    }: { 
        href?: string; 
        icon: Component; 
        title: string; 
        description: string; 
        disabled?: boolean;
        hoverColor?: string;
    } = $props();

    const hoverClasses: Record<string, string> = {
        orange: "hover:border-orange-400/50",
        blue: "hover:border-blue-400/50",
        gray: "hover:border-white/20"
    };
</script>

<a 
    class="bg-hub-card-bg border border-hub-outline p-6 rounded-2xl transition-all group {disabled ? 'opacity-40 cursor-auto' : 'hover:scale-[1.02] cursor-pointer ' + hoverClasses[hoverColor]}" 
    href={disabled ? undefined : href}
>
    <Icon class="text-3xl mb-4 block group-hover:scale-110 transition-transform" />
    <h3 class="font-headline font-bold text-white text-lg">{title}</h3>
    <p class="text-xs text-zinc-500 mt-1">{description}</p>
</a>
