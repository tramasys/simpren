import { writable } from 'svelte/store';

// Store for node states: { [nodeId]: { isObsticle, state } }
export const nodeStates = writable({});

// Store for edge states: { [edgeId]: { type, state } }
export const edgeStates = writable({});

// Store for vehicle parameters: { timeToTraverse, timeWithBarrier }
export const vehicleParameters = writable({
	timeToTraverse: 1.0,
	timeWithBarrier: 2.0
});

// Store for selected endpoint (one of 'A', 'B', 'C')
export const selectedEndpoint = writable('A');
