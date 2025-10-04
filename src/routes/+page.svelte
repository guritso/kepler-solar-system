<script>
	import Canvas from '$lib/components/Canvas.svelte';
	import Cordinates from '$lib/components/Cordinates.svelte';
	import Controls from '$lib/components/Controls.svelte';
	import Body from '$lib/components/Body.svelte';
</script>

<div
	class="margin-0 padding-0 overflow-hidden bg-gray-900 h-screen w-screen flex items-center justify-center"
>
	<Canvas />
	<Cordinates />
	<Controls />
	<Body />
</div>
