<script lang="ts">
type Props = {
	number: string;
	title: string;
	status: 'completed' | 'progress' | 'locked';
	berries: string;
	cassette: string;
	heart: string;
};

let { number, title, status, berries, cassette, heart }: Props = $props();
</script>

<div class="node-card">
  <!-- 'drag-handle' class enables dragging via this element if dragHandleClass="drag-handle" is passed to the Canvas -->
  <div class="node-header chap-{status === 'completed' ? '1' : status === 'progress' ? '2' : '3'} drag-handle">
    <div class="header-main">
      <span class="chap-num">{number}</span>
      <h3>{title}</h3>
    </div>
    {#if status === 'completed'}
      <span class="badge badge-completed">Completed</span>
    {:else if status === 'progress'}
      <span class="badge badge-progress">In Progress</span>
    {:else}
      <span class="badge badge-locked">Locked</span>
    {/if}
  </div>
  <div class="node-body">
    <div class="stat-row">
      <span>Strawberries</span>
      <strong>{berries}</strong>
    </div>
    <div class="stat-row">
      <span>Cassette</span>
      <strong class={cassette === 'Found' ? 'text-green' : 'text-dim'}>{cassette}</strong>
    </div>
    <div class="stat-row">
      <span>Crystal Heart</span>
      <strong class={heart === 'Blue' ? 'text-blue' : 'text-dim'}>{heart}</strong>
    </div>
  </div>
  <div class="node-footer">
    <button class="node-btn interactive" onclick={() => alert(`Inspecting ${title}`)}>Inspect Chapter</button>
  </div>
</div>

<style>
  /* Node Card Styles */
  .node-card {
    width: 260px;
    background: rgba(30, 30, 32, 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    color: #e0e0e0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    transition: border-color 0.25s, transform 0.2s, box-shadow 0.25s;
  }

  .node-card:hover {
    border-color: rgba(147, 51, 234, 0.4);
    box-shadow: 0 15px 35px rgba(147, 51, 234, 0.15);
  }

  .node-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    cursor: move; /* Drag handle cursor */
  }

  .node-header::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 40px;
    height: 2px;
  }

  .node-header.chap-1::after { background: #3b82f6; }
  .node-header.chap-2::after { background: #eab308; }
  .node-header.chap-3::after { background: #ef4444; }

  .header-main {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .chap-num {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.3);
  }

  .node-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .badge {
    align-self: flex-start;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-completed {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .badge-progress {
    background: rgba(234, 179, 8, 0.15);
    color: #facc15;
    border: 1px solid rgba(234, 179, 8, 0.2);
  }

  .badge-locked {
    background: rgba(156, 163, 175, 0.1);
    color: #9ca3af;
    border: 1px solid rgba(156, 163, 175, 0.15);
  }

  .node-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-row span {
    color: #9ca3af;
  }

  .text-green { color: #4ade80; }
  .text-blue { color: #60a5fa; }
  .text-dim { color: #6b7280; }

  .node-footer {
    padding: 12px 16px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .node-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    transition: background 0.15s, border-color 0.15s;
  }

  .node-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .node-btn:active {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
