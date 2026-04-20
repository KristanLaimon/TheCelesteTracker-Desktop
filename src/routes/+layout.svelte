<script lang="ts">
    import { onMount, type Snippet } from "svelte";
    import gsap from "gsap";
    import '../app.css';

    // == Components ==
    import GlobalHeader from '$lib/components/global/Header.svelte';
    import GlobalFooter from '$lib/components/global/Footer.svelte';

    // == Assets ==
    import strawberry from "$lib/assets/strawberry.gif";
    import strawberrywings from "$lib/assets/strawberry_wings.gif";

    // == Props ==
    let { children } = $props() as { children: Snippet<[]> };

    // == State ==
    let isLoading = $state(true);
    let suspensivePoints = $state<string[]>([]);
    let currentStrawberryImg = $state(strawberry);
    
    // Default size is 'size-50' (200px), will change on flight
    let strawberrySize = $state("size-50"); 

    onMount(() => {
        // 1. Loading Dots Interval
        const timer = setInterval(() => {
            if (suspensivePoints.length >= 3) {
                suspensivePoints = [];
            } else {
                suspensivePoints = [...suspensivePoints, "."];
            }
        }, 750);

        // 2. Continuous Parallax (Mountains)
        gsap.to(".mtn-back", { y: -15, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".mtn-mid", { y: -30, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".mtn-front", { y: -50, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

        // 3. Idle Floating Animation
        const floatTl = gsap.to("#strawberry-loading", {
            x: 10,
            y: 5,
            rotation: 3,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // 4. Exit Sequence Function
        const triggerExit = () => {
            clearInterval(timer);
            floatTl.kill(); // Stop the idle bobbing

            // == START THE TRANSITION ==
            // 1. Swap image and increase size
            currentStrawberryImg = strawberrywings;
            strawberrySize = "size-60 -mb-12"; // Make it bigger (288px) instantly

            const exitTl = gsap.timeline({
                onComplete: () => {
                    isLoading = false;
                }
            });

            // 2. Animate flight and scale slightly more during flight
            exitTl
                .to("#strawberry-loading", { 
                    y: -window.innerHeight - 300, // Fly high off screen
                    scale: 1.1, // Slight extra 'oomph' during acceleration
                    duration: 1.5, 
                    ease: "power2.in" 
                })
                .to(".loading-container", { 
                    opacity: 0, 
                    duration: 0.6 
                }, "-=0.8"); // Overlap fade with flight
        };

        // 5. DOM Event Handling
        if (document.readyState === 'complete') {
            // Tiny delay just so the load feels human-readable
            setTimeout(triggerExit, 500);
        } else {
            window.addEventListener('load', triggerExit);
        }

        return () => {
            clearInterval(timer);
            window.removeEventListener('load', triggerExit);
        };
    });
</script>

<div class="min-h-screen text-white bg-zinc-950 flex flex-col">
    <GlobalHeader />
    
    {#if isLoading}
        {@render LoadingScreen()}
    {/if}

    <main class="grow relative">
        {@render children()}
    </main>

    <div class="h-18"></div>
    <GlobalFooter height="2.5rem" />
</div>

{#snippet LoadingScreen()}
    <div class="loading-container fixed inset-0 z-100 bg-zinc-900 flex justify-center items-center overflow-hidden">
        
        <div class="absolute inset-0 pointer-events-none">
            <div class="mtn-back absolute bottom-[-5%] w-full h-[60%] bg-zinc-800/40" style="clip-path: polygon(0% 100%, 20% 40%, 45% 70%, 75% 30%, 100% 100%);"></div>
            <div class="mtn-mid absolute bottom-[-10%] w-full h-[50%] bg-zinc-800/60" style="clip-path: polygon(0% 100%, 15% 50%, 35% 30%, 60% 60%, 85% 40%, 100% 100%);"></div>
            <div class="mtn-front absolute bottom-[-15%] w-full h-[40%] bg-zinc-800" style="clip-path: polygon(0% 100%, 30% 40%, 50% 70%, 75% 30%, 100% 100%);"></div>
        </div>

        <div class="relative z-10 text-center">
            <img 
                id="strawberry-loading" 
                src={currentStrawberryImg} 
                alt="strawberry" 
                class="{strawberrySize} object-cover mx-auto" 
            />
            <h1 class="text-center text-4xl mt-6 ">
                Loading{suspensivePoints.join("")}
            </h1>
        </div>
    </div>
{/snippet}

<style>
    /* Prevent body scroll during animation */
    :global(body) {
        overflow-x: hidden;
    }
</style>