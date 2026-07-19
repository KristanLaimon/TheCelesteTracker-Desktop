<div class="loading-container">
	<div class="spinner"></div>
	<p>Loading Celeste Tracker...</p>
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background-color: #05070f;
		color: #f1f5f9;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(241, 245, 249, 0.1);
		border-left-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
