import type { Core } from 'cytoscape';
import type { NodePosition } from '@/entities/TopologyData/layoutShared';

const STORAGE_KEY = 'topology-graph-state';
const STORAGE_VERSION = 1;

export interface SavedGraphState {
    version: number;
    nodeIds: string[];
    positions: Record<string, NodePosition>;
    zoom?: number;
    pan?: { x: number; y: number };
}

function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

export function getNodeIdsFingerprint(nodeIds: string[]): string[] {
    return [...nodeIds].sort();
}

export function isSavedStateValid(
    saved: SavedGraphState,
    currentNodeIds: string[],
): boolean {
    const savedIds = getNodeIdsFingerprint(saved.nodeIds);
    const currentIds = getNodeIdsFingerprint(currentNodeIds);
    if (savedIds.length !== currentIds.length) return false;
    return savedIds.every((id, i) => id === currentIds[i]);
}

export function hasGraphStateInStorage(currentNodeIds: string[]): boolean {
    return loadGraphSave(currentNodeIds) !== null;
}

export function loadGraphSave(
    currentNodeIds: string[],
): SavedGraphState | null {
    if (!isBrowser()) return null;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as SavedGraphState;
        if (parsed.version !== STORAGE_VERSION) return null;
        if (!isSavedStateValid(parsed, currentNodeIds)) return null;

        return parsed;
    } catch {
        return null;
    }
}

export function savedStateToPositions(
    saved: SavedGraphState,
): Map<string, NodePosition> {
    return new Map(
        Object.entries(saved.positions).map(([id, pos]) => [id, pos]),
    );
}

export function extractGraphStateFromCy(
    cy: Core,
    nodeIds: string[],
): SavedGraphState {
    const positions: Record<string, NodePosition> = {};

    cy.nodes().forEach((node) => {
        const pos = node.position();
        positions[node.id()] = { x: pos.x, y: pos.y };
    });

    const pan = cy.pan();
    return {
        version: STORAGE_VERSION,
        nodeIds: getNodeIdsFingerprint(nodeIds),
        positions,
        zoom: cy.zoom(),
        pan: { x: pan.x, y: pan.y },
    };
}

export function saveGraphStateToStorage(state: SavedGraphState): void {
    if (!isBrowser()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function saveGraphStateFromCy(cy: Core, nodeIds: string[]): void {
    saveGraphStateToStorage(extractGraphStateFromCy(cy, nodeIds));
}

export function saveGraphStateFromLayout(
    positions: Map<string, NodePosition>,
    nodeIds: string[],
    cy?: Core,
): void {
    const record: Record<string, NodePosition> = {};
    positions.forEach((pos, id) => {
        record[id] = { x: pos.x, y: pos.y };
    });

    const pan = cy?.pan();
    saveGraphStateToStorage({
        version: STORAGE_VERSION,
        nodeIds: getNodeIdsFingerprint(nodeIds),
        positions: record,
        zoom: cy?.zoom(),
        pan: pan ? { x: pan.x, y: pan.y } : undefined,
    });
}

export function clearGraphStateStorage(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEY);
}

export function applyViewportFromSaved(cy: Core, saved: SavedGraphState): void {
    if (saved.zoom !== undefined) {
        cy.zoom(saved.zoom);
    }
    if (saved.pan) {
        cy.pan(saved.pan);
    }
}
