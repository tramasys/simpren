import { nodeStates, edgeStates } from './stores.js';
import { fixedEdges } from './graphStructure.js';
import { get } from 'svelte/store';

export async function runAlgorithm(algorithmName, startNodeId, endpoint, vehicleParams, animationMs) {
	console.log('Running algorithm:', algorithmName);

	const algorithms = {
		'A*': runAStarAlgorithm,
		'D*': runDStarAlgorithm,
		'D*Lite': runDStarLiteAlgorithm,
	};

	const algorithm = algorithms[algorithmName];

	if (!algorithm) {
		throw new Error(`Algorithm ${algorithmName} not found`);
	}

	await algorithm(startNodeId, endpoint, vehicleParams, animationMs);
}

async function runAStarAlgorithm(startNodeId, goalNodeId, vehicleParams, animationMs) {
	console.log(`Running A* algorithm from ${startNodeId} to ${goalNodeId}`);
	await simulateAlgorithm(startNodeId, goalNodeId, vehicleParams, animationMs);
}


async function runDStarAlgorithm(startNodeId, goalNodeId, vehicleParams, animationMs) {
	console.log(`Running D* algorithm from ${startNodeId} to ${goalNodeId}`);
	await simulateAlgorithm(startNodeId, goalNodeId, vehicleParams, animationMs);
}


async function runDStarLiteAlgorithm(startNodeId, goalNodeId, vehicleParams, animationMs) {
	console.log(`Running D*Lite algorithm from ${startNodeId} to ${goalNodeId}`);
	await simulateAlgorithm(startNodeId, goalNodeId, vehicleParams, animationMs);
}

async function simulateAlgorithm(startNodeId, goalNodeId, vehicleParams, animationMs) {
	let queue = [startNodeId];
	let visitedNodes = new Set();
	let cameFrom = {};

	// Mark start node as 'probed'
	nodeStates.update((states) => ({
		...states,
		[startNodeId]: {
			...(states[startNodeId] || {}),
			explState: 'probed',
		},
	}));

	while (queue.length > 0) {
		const currentNodeId = queue.shift();

		// Mark node as 'visited'
		nodeStates.update((states) => ({
			...states,
			[currentNodeId]: {
				...(states[currentNodeId] || {}),
				explState: 'visited',
			},
		}));
		visitedNodes.add(currentNodeId);

		// Mark edge from parent to current node as 'visited'
		if (cameFrom[currentNodeId]) {
			const parentId = cameFrom[currentNodeId];
			const edgeId = getEdgeId(parentId, currentNodeId);
			edgeStates.update((states) => ({
				...states,
				[edgeId]: {
					...(states[edgeId] || {}),
					explState: 'visited',
				},
			}));
		}

		await delay(animationMs);

		if (currentNodeId === goalNodeId) {
			// Mark goal node as 'finished'
			nodeStates.update((states) => ({
				...states,
				[currentNodeId]: {
					...(states[currentNodeId] || {}),
					explState: 'finished',
				},
			}));
			console.log('Reached goal node.');
			await highlightPath(cameFrom, currentNodeId, vehicleParams);
			return;
		}

		const neighbors = getNeighbors(currentNodeId);
		for (const neighborId of neighbors) {
			const neighborState = get(nodeStates)[neighborId];
			const neighborExplState = neighborState?.explState;

			if (
				!visitedNodes.has(neighborId) &&
				neighborExplState !== 'probed' &&
				neighborExplState !== 'restricted'
			) {
				// Mark neighbor as 'probed'
				nodeStates.update((states) => ({
					...states,
					[neighborId]: {
						...(states[neighborId] || {}),
						explState: 'probed',
					},
				}));

				// Mark edge as 'probed'
				const edgeId = getEdgeId(currentNodeId, neighborId);
				edgeStates.update((states) => ({
					...states,
					[edgeId]: {
						...(states[edgeId] || {}),
						explState: 'probed',
					},
				}));

				queue.push(neighborId);
				cameFrom[neighborId] = currentNodeId;

				await delay(animationMs);
			}
		}
	}

	console.log('Goal not reachable from the start node.');
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNeighbors(nodeId) {
	const neighbors = [];
	const currentEdgeStates = get(edgeStates);
	const currentNodeStates = get(nodeStates);

	for (const edge of fixedEdges) {
		const isDashed = currentEdgeStates[edge.id]?.type === 'dashed';
		if (isDashed) {
			continue;
		}

		let neighborId = null;
		if (edge.from === nodeId) {
			neighborId = edge.to;
		} else if (edge.to === nodeId) {
			neighborId = edge.from;
		}

		if (neighborId) {
			const isObstacle = currentNodeStates[neighborId]?.isObstacle;
			if (isObstacle) {
				markNodeAndEdgesRestricted(neighborId);
				continue;
			}

			neighbors.push(neighborId);
		}
	}
	return neighbors;
}

function markNodeAndEdgesRestricted(nodeId) {
	nodeStates.update((states) => ({
		...states,
		[nodeId]: {
			...(states[nodeId] || {}),
			explState: 'restricted',
		},
	}));

	const connectedEdges = fixedEdges.filter(
		(edge) => edge.from === nodeId || edge.to === nodeId
	);

	edgeStates.update((states) => {
		const newStates = { ...states };
		for (const edge of connectedEdges) {
			newStates[edge.id] = {
				...(newStates[edge.id] || {}),
				explState: 'restricted',
			};
		}
		return newStates;
	});
}

function getEdgeId(fromId, toId) {
	for (const edge of fixedEdges) {
		if (
			(edge.from === fromId && edge.to === toId) ||
			(edge.from === toId && edge.to === fromId)
		) {
			return edge.id;
		}
	}
	return null;
}

async function highlightPath(cameFrom, currentNodeId, vehicleParams) {
	let path = [currentNodeId];
	while (currentNodeId in cameFrom) {
		currentNodeId = cameFrom[currentNodeId];
		path.unshift(currentNodeId);
	}

	let totalTime = 0;

	for (let i = 1; i < path.length; i++) {
		const fromNodeId = path[i - 1];
		const toNodeId = path[i];
		const edgeId = getEdgeId(fromNodeId, toNodeId);
		const edgeState = get(edgeStates)[edgeId];
		const traversalTime =
			edgeState.type === 'barrier'
				? vehicleParams.timeWithBarrier
				: vehicleParams.timeToTraverse;
		totalTime += traversalTime;
	}

	console.log(`Total traversal time: ${totalTime} units`);
}
