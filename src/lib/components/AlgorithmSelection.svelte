<script>
	import { selectedAlgorithm } from '../stores.js';
	let algorithms = ['Dijkstra', 'A*', 'D*Lite', 'Simulation'];
</script>

<div class="algorithm-selection">
	<label for="algorithm-select">Algorithm to apply:</label>
	<select id="algorithm-select" bind:value={$selectedAlgorithm}>
		{#each algorithms as algorithm}
			<option value={algorithm}>{algorithm}</option>
		{/each}
	</select>
</div>

<style>
	.algorithm-selection {
		display: flex;
		flex-direction: column;
	}

	label {
		margin-bottom: 0.5rem;
	}

	select {
		width: 100%;
		padding: 0.5rem;
		box-sizing: border-box;
	}
</style>
