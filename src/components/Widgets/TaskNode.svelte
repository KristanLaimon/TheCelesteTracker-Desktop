<script lang="ts">
  type Task = {
    id: string;
    text: string;
    completed: boolean;
  };

  // Props
  type Props = {
    title?: string;
  };

  let { title = "Modding Tasks" }: Props = $props();

  // Reactive state inside the Svelte component
  let tasks = $state<Task[]>([
    { id: "1", text: "Download Celeste tools", completed: true },
    { id: "2", text: "Configure Everest map builder", completed: false },
    { id: "3", text: "Test dash trigger triggers", completed: false }
  ]);
  
  let newTaskText = $state("");

  function addTask() {
    if (!newTaskText.trim()) return;
    tasks.push({
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    });
    newTaskText = "";
  }

  function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
  }
</script>

<div class="task-node">
  <div class="task-header drag-handle">
    <h4>{title}</h4>
  </div>
  <div class="task-body">
    <div class="input-row">
      <!-- 'interactive' class ensures we can type in input without dragging canvas -->
      <input
        type="text"
        bind:value={newTaskText}
        placeholder="Add task..."
        class="interactive task-input"
        onkeydown={(e) => e.key === "Enter" && addTask()}
      />
      <button class="interactive add-btn" onclick={addTask}>Add</button>
    </div>

    <ul class="task-list">
      {#each tasks as task (task.id)}
        <li class="task-item">
          <!-- 'interactive' class or stopPropagation ensures we can check checkbox -->
          <input
            type="checkbox"
            checked={task.completed}
            class="interactive checkbox"
            onchange={() => toggleTask(task.id)}
          />
          <span class="task-text" class:completed={task.completed}>{task.text}</span>
        </li>
      {/each}
    </ul>
  </div>
  <div class="task-footer">
    <button class="interactive clear-btn" onclick={clearCompleted}>Clear Done</button>
  </div>
</div>

<style>
  .task-node {
    width: 250px;
    height: 100%;
    min-height: 220px;
    background: rgba(24, 24, 28, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .task-header {
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(147, 51, 234, 0.1);
    cursor: move;
  }

  .task-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #c084fc;
  }

  .task-body {
    padding: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }

  .input-row {
    display: flex;
    gap: 6px;
  }

  .task-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 6px 10px;
    color: #ffffff;
    font-size: 12px;
    outline: none;
  }

  .task-input:focus {
    border-color: #a855f7;
  }

  .add-btn {
    background: #a855f7;
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  }

  .add-btn:hover {
    background: #c084fc;
  }

  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 120px;
    overflow-y: auto;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .checkbox {
    width: 14px;
    height: 14px;
    cursor: pointer;
  }

  .task-text.completed {
    text-decoration: line-through;
    color: #6b7280;
  }

  .task-footer {
    padding: 8px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .clear-btn {
    width: 100%;
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    color: #9ca3af;
    padding: 6px;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .clear-btn:hover {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.3);
  }
</style>
