import { writable } from 'svelte/store';
import { bodies as staticBodies } from '$lib/bodies';
import type { Body } from '$lib/bodies';

export const coordinates = writable({ x: 0, y: 0, z: 1, mx: 0, my: 0 });
export const bodies = writable<Body[]>([...staticBodies]);
export const selectedBody = writable<Body | null>(null);
export const simulationTime = writable<number>(0);
export const timeScale = writable<number>(1);
export const showTag = writable<boolean>(true);
export const resetTime = writable<boolean>(false);