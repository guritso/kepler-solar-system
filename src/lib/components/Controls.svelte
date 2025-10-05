<script lang="ts">
	import { Play, Pause, FastForward, Rewind, TimerReset, Tag } from 'lucide-svelte';
	import { timeScale, showTag } from '$lib/stores';

	function togglePause() {
		$timeScale = $timeScale === 0 ? 1 : 0;
	}
	function accelerate() {
		if ($timeScale < Infinity) {
			$timeScale *= 10;
		}
	}
	function decelerate() {
		$timeScale /= 10;
	}
	function resetTime() {
		$timeScale = 1;
	}
	function showtag() {
		$showTag = !$showTag;
	}
</script>

<div class="absolute bottom-2 left-2 rounded-lg text-white flex gap-2 items-center">
	<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={togglePause}>
		{#if $timeScale === 0}
			<Play />
		{:else}
			<Pause />
		{/if}
	</button>
	<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={decelerate}>
		<Rewind />
	</button>
	<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={accelerate}>
		<FastForward />
	</button>
	<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={resetTime}>
		<TimerReset />
	</button>
	<button class="bg-gray-800/50 p-2 rounded-lg cursor-pointer" onclick={showtag}>
		{#if $showTag}
			<Tag color="white" />
		{:else}
			<Tag color="gray" />
		{/if}
	</button>
</div>
