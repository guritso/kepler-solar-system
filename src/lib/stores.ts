import { writable } from 'svelte/store';
import { createBodies } from '$lib/bodies';
import type { Body } from '$lib/bodies';
import { AU_TO_SIM } from './constants';

export const coordinates = writable({ x: 0, y: 0, z: 1, mx: 0, my: 0 });
export const bodies = writable<Body[]>(createBodies()); // Fresh initial
export const selectedBody = writable<Body | null>(null);
export const simulationTime = writable<number>(0);
export const timeScale = writable<number>(1);
export const showTag = writable<boolean>(true);
export const resetTime = writable<boolean>(false);
export const showOrbits = writable<boolean>(true);
export const showDwarf = writable<boolean>(false);
export const showComets = writable<boolean>(false);
export const showAsteroids = writable<boolean>(false);

export function resetBodies() {
	bodies.set(createBodies()); // Fresh bodies (initial pos + empty trails)
}