<script lang="ts">
	import { coordinates } from '$lib/stores';
</script>

<div class="absolute top-2 left-2 md:top-auto md:left-auto md:bottom-2 md:right-2 text-gray-400 bg-black/50 p-2 rounded-lg text-xs text-right">
	<p>{$coordinates.z.toFixed(3)}</p>
	<p>{$coordinates.mx.toFixed(2)}, {$coordinates.my.toFixed(2)}</p>
	<p>{$coordinates.x.toFixed(2)}, {$coordinates.y.toFixed(2)}</p>
</div>
