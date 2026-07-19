<script lang="ts">
import { onMount } from 'svelte';
import { fade, fly } from 'svelte/transition';

type Props = {
	onClose?: () => void;
	commands: CommandCenterCommand[];
};

let { onClose = () => {}, commands }: Props = $props();

export type CommandCenterCommand = {
	id: string;
	title: string;
	description: string;
	category: 'Navigation' | 'Actions' | 'Celeste';
	shortcut?: string;
	action: () => void;
};

let searchQuery = $state('');
let selectedIndex = $state(0);
let inputEl = $state<HTMLInputElement | null>(null);
const filteredCommands = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();
	if (!query) return commands;
	return commands.filter(
		(cmd) => cmd.title.toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query) || cmd.category.toLowerCase().includes(query),
	);
});

// Reset selection when search query changes
$effect(() => {
	if (searchQuery !== undefined) {
		selectedIndex = 0;
	}
});

onMount(() => {
	inputEl?.focus();
});

function handleBackdropClick() {
	onClose();
}

function scrollToSelected() {
	setTimeout(() => {
		const activeEl = document.querySelector('.command-item.active');
		if (activeEl) {
			activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}, 10);
}

function handleKeyDown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		event.preventDefault();
		onClose();
	} else if (event.key === 'ArrowDown') {
		event.preventDefault();
		if (filteredCommands.length > 0) {
			selectedIndex = (selectedIndex + 1) % filteredCommands.length;
			scrollToSelected();
		}
	} else if (event.key === 'ArrowUp') {
		event.preventDefault();
		if (filteredCommands.length > 0) {
			selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
			scrollToSelected();
		}
	} else if (event.key === 'Enter') {
		event.preventDefault();
		const activeCmd = filteredCommands[selectedIndex];
		if (activeCmd) {
			activeCmd.action();
		}
	}
}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article transition:fade={{ duration: 150 }} class="root-container" onclick={handleBackdropClick} onkeydown={handleKeyDown} tabindex="0">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div transition:fly={{ y: 15, duration: 200 }} class="command-center-modal" onclick={(e) => e.stopPropagation()} role="presentation" aria-label="Command Center">
		<header class="search-header">
			<input
				bind:this={inputEl}
				bind:value={searchQuery}
				type="text"
				name="search"
				class="search-input"
				placeholder="Search commands, boards, sandbox pages..."
				autocomplete="off"
				spellcheck="false"
			/>
			
			<span class="esc-badge">ESC</span>
		</header>

		<div class="results-container">
			{#if filteredCommands.length > 0}
				<div class="commands-list">
					{#each filteredCommands as cmd, i}
						<!-- Render category header when category changes -->
						{#if i === 0 || filteredCommands[i - 1].category !== cmd.category}
							<div class="category-header">{cmd.category}</div>
						{/if}
						
						<!-- svelte-ignore a11y_mouse_events_have_key_events -->
						<button
							class="command-item {selectedIndex === i ? 'active' : ''}"
							onclick={cmd.action}
							onmouseover={() => { selectedIndex = i; }}
						>
							<div class="item-left">
								<div class="item-meta">
									<span class="item-title">{cmd.title}</span>
									<span class="item-desc">{cmd.description}</span>
								</div>
							</div>
							
							{#if cmd.shortcut}
								<div class="item-shortcut">
									{#each cmd.shortcut.split(' + ') as key}
										<kbd class="key-cap">{key}</kbd>
									{/each}
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{:else}
				<div class="empty-state">
					<p class="empty-title">No commands found</p>
					<p class="empty-desc">Try searching for other terms like 'canvas', 'dev', or 'reset'.</p>
				</div>
			{/if}
		</div>

		<footer class="command-center-footer">
			<div class="footer-legend">
				<span class="legend-item"><kbd class="kbd-mini">↑↓</kbd> Navigate</span>
				<span class="legend-item"><kbd class="kbd-mini">↵</kbd> Select</span>
			</div>
			<div class="footer-count">
				{filteredCommands.length} {filteredCommands.length === 1 ? 'command' : 'commands'} found
			</div>
		</footer>
	</div>
</article>

<style>
	/* ponytail: simplified flat grey colors for minimalist aesthetics */
	/* ponytail: simplified nested CSS hierarchies utilizing native browser nesting */
	.root-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 9999;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 12vh;
		outline: none;

		.command-center-modal {
			width: 650px;
			max-width: 90vw;
			background: #18181c;
			border: 1px solid #2d2d30;
			border-radius: 12px;
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
			overflow: hidden;
			display: flex;
			flex-direction: column;
			font-family: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

			.search-header {
				display: flex;
				align-items: center;
				padding: 14px 18px;
				border-bottom: 1px solid #2d2d30;
				gap: 12px;
				position: relative;

				.search-input {
					flex: 1;
					background: transparent;
					border: none;
					outline: none;
					color: #ffffff;
					font-size: 15px;
					font-weight: 500;
					padding: 2px 0;
					font-family: inherit;

					&::placeholder {
						color: #555558;
					}
				}

				.esc-badge {
					font-size: 9px;
					font-weight: 700;
					background: #242427;
					color: #727276;
					border: 1px solid #36363a;
					padding: 2px 5px;
					border-radius: 4px;
					letter-spacing: 0.5px;
				}
			}

			.results-container {
				max-height: 350px;
				overflow-y: auto;
				scrollbar-width: thin;
				scrollbar-color: #2d2d30 transparent;

				&::-webkit-scrollbar {
					width: 6px;
				}

				&::-webkit-scrollbar-track {
					background: transparent;
				}

				&::-webkit-scrollbar-thumb {
					background: #2d2d30;
					border-radius: 99px;
				}

				.commands-list {
					display: flex;
					flex-direction: column;
					padding: 6px;

					.category-header {
						font-family: var(--font-montserrat), inherit;
						font-size: 9px;
						font-weight: 700;
						color: #727276;
						letter-spacing: 1px;
						text-transform: uppercase;
						padding: 10px 12px 4px;
					}

					.command-item {
						display: flex;
						align-items: center;
						justify-content: space-between;
						width: 100%;
						background: transparent;
						border: none;
						border-left: 3px solid transparent;
						outline: none;
						padding: 8px 12px;
						border-radius: 6px;
						cursor: pointer;
						text-align: left;
						transition: background 0.12s, border-left-color 0.12s, transform 0.12s;
						gap: 12px;

						&.active {
							background: #242427;
							border-left-color: #a1a1a6;
							transform: translateX(1px);

							.item-title {
								color: #ffffff;
							}

							.item-desc {
								color: #a1a1a6;
							}

							.key-cap {
								background: #36363a;
								color: #ffffff;
								border-color: #48484c;
							}
						}

						.item-left {
							display: flex;
							align-items: center;
							flex: 1;

							.item-meta {
								display: flex;
								flex-direction: column;
								gap: 1px;

								.item-title {
									font-size: 13px;
									font-weight: 600;
									color: #e1e1e6;
									transition: color 0.12s ease;
								}

								.item-desc {
									font-size: 11px;
									color: #727276;
									transition: color 0.12s ease;
								}
							}
						}

						.item-shortcut {
							display: flex;
							gap: 3px;

							.key-cap {
								font-family: inherit;
								font-size: 9px;
								font-weight: 600;
								background: #1e1e21;
								color: #727276;
								border: 1px solid #2d2d30;
								padding: 1px 5px;
								border-radius: 3px;
								box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
							}
						}
					}
				}

				.empty-state {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 30px 15px;
					text-align: center;
					color: #727276;

					.empty-title {
						font-size: 13px;
						font-weight: 600;
						color: #e1e1e6;
						margin: 0 0 2px 0;
					}

					.empty-desc {
						font-size: 11px;
						color: #555558;
						max-width: 250px;
						margin: 0;
					}
				}
			}

			.command-center-footer {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 10px 18px;
				background: #121214;
				border-top: 1px solid #2d2d30;
				font-size: 10px;
				color: #555558;

				.footer-legend {
					display: flex;
					gap: 12px;

					.legend-item {
						display: flex;
						align-items: center;
						gap: 4px;
					}
				}

				.kbd-mini {
					background: #1e1e21;
					border: 1px solid #2d2d30;
					color: #727276;
					padding: 1px 3px;
					border-radius: 2px;
					font-weight: 600;
				}
			}
		}
	}
</style>
