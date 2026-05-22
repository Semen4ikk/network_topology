'use client';

import { useCallback, useRef } from 'react';
import type { Core } from 'cytoscape';
import {applyViewportFromSaved, loadGraphSave, saveGraphStateFromCy, saveGraphStateFromLayout, savedStateToPositions, type SavedGraphState} from '@/features/graphSaveStorage';
import type { NodePosition } from '@/entities/TopologyData/layoutShared';
import type { RectangleLayoutResult } from '@/features/layoutTopology';

type BindCyOptions = {
    onRestoredFromStorage?: () => void;
};

export function useGraphState() {
    const nodeIdsRef = useRef<string[]>([]);
    const unbindRef = useRef<(() => void) | null>(null);
    const layoutInProgressRef = useRef(false);

    const loadPositions = useCallback(
        (nodeIds: string[]): Map<string, NodePosition> | null => {
            const saved = loadGraphSave(nodeIds);
            if (!saved) return null;
            return savedStateToPositions(saved);
        },
        [],
    );

    const loadSavedState = useCallback(
        (nodeIds: string[]): SavedGraphState | null => {
            return loadGraphSave(nodeIds);
        },
        [],
    );

    const saveFromCy = useCallback((cy: Core) => {
        if (nodeIdsRef.current.length === 0 || layoutInProgressRef.current) return;
        saveGraphStateFromCy(cy, nodeIdsRef.current);
    }, []);

    const saveFromLayout = useCallback(
        (layout: RectangleLayoutResult, cy: Core) => {
            if (nodeIdsRef.current.length === 0) return;
            saveGraphStateFromLayout(
                layout.positions,
                nodeIdsRef.current,
                cy,
            );
        },
        [],
    );

    const runLayout = useCallback((fn: () => void) => {
        layoutInProgressRef.current = true;
        try {
            fn();
        } finally {
            layoutInProgressRef.current = false;
        }
    }, []);

    const bindCy = useCallback(
        (cy: Core, nodeIds: string[], options?: BindCyOptions) => {
            unbindRef.current?.();
            nodeIdsRef.current = nodeIds;

            const persist = () => {
                if (layoutInProgressRef.current) return;
                saveGraphStateFromCy(cy, nodeIds);
            };

            cy.on('dragfree', 'node', persist);
            cy.on('pan zoom', persist);

            unbindRef.current = () => {
                cy.removeListener('dragfree', 'node', persist);
                cy.removeListener('pan zoom', persist);
            };

            const saved = loadGraphSave(nodeIds);
            if (saved) {
                applyViewportFromSaved(cy, saved);
                options?.onRestoredFromStorage?.();
            }
        },
        [],
    );

    const unbindCy = useCallback(() => {
        unbindRef.current?.();
        unbindRef.current = null;
    }, []);

    return {bindCy, unbindCy, loadPositions, loadSavedState, saveFromCy, saveFromLayout, runLayout};
}
