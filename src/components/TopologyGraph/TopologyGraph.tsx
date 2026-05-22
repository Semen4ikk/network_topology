'use client';

import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef} from 'react';
import cytoscape, { type Core } from 'cytoscape';
import styles from './TopologyGraph.module.css';
import { useTopologyQuery } from '@/entities/TopologyData/query';
import { filterTopology } from '@/features/filterTopology';
import {applyRectangleLayoutToCy, clearRectangleLayoutCache, getContextCount} from '@/features/layoutTopology';
import {buildGraphElements, graphStyles} from '@/entities/TopologyData/buildGraphElements';
import {clearGraphStateStorage, hasGraphStateInStorage, loadGraphSave, savedStateToPositions} from '@/features/graphSaveStorage';
import { useGraphState } from '@/entities/TopologyData/hooks/useGraphState';

const FIT_PADDING = 48;

function fitGraph(cy: Core) {
    cy.resize();
    cy.fit(undefined, FIT_PADDING);
    const zoom = cy.zoom();
    if (zoom > 2) {
        cy.zoom(2);
        cy.center();
    }
}

export type TopologyGraphHandle = {
    resetAndRedraw: () => { contextCount: number };
};

export const TopologyGraph = forwardRef<TopologyGraphHandle>(
    function TopologyGraph(_, ref) {
        const containerRef = useRef<HTMLDivElement>(null);
        const cyRef = useRef<Core | null>(null);
        const resizeObserverRef = useRef<ResizeObserver | null>(null);
        const dataRef = useRef<ReturnType<typeof filterTopology> | null>(null);
        const restoredFromStorageRef = useRef(false);
        const { data, isLoading, isError, error } = useTopologyQuery();
        const { bindCy, unbindCy, saveFromLayout, runLayout } = useGraphState();

        const handleFit = useCallback(() => {
            if (cyRef.current) fitGraph(cyRef.current);
        }, []);

        const handleZoomIn = useCallback(() => {
            const cy = cyRef.current;
            if (!cy) return;
            cy.zoom({
                level: Math.min(cy.zoom() * 1.25, cy.maxZoom()),
                renderedPosition: {
                    x: cy.width() / 2,
                    y: cy.height() / 2,
                   },
            });
        }, []);

        const handleZoomOut = useCallback(() => {
            const cy = cyRef.current;
            if (!cy) return;
            cy.zoom({
                level: Math.max(cy.zoom() / 1.25, cy.minZoom()),
                renderedPosition: {
                    x: cy.width() / 2,
                    y: cy.height() / 2,
                },
            });
        }, []);

        const drawFreshLayout = useCallback(
            (cy: Core, filtered: ReturnType<typeof filterTopology>) => {
                runLayout(() => {
                    const layout = applyRectangleLayoutToCy(cy, filtered);
                    fitGraph(cy);
                    saveFromLayout(layout, cy);
                });
            },
            [runLayout, saveFromLayout],
        );

        const mountGraph = useCallback(
            (filtered: ReturnType<typeof filterTopology>, useStorage: boolean) => {
                if (!containerRef.current) return;

                const nodeIds = filtered.nodes.map((n) => String(n.id));
                const hasSaved = useStorage && hasGraphStateInStorage(nodeIds);
                restoredFromStorageRef.current = hasSaved;

                const savedPositions = hasSaved
                    ? savedStateToPositions(loadGraphSave(nodeIds)!)
                    : null;

                const elements = buildGraphElements(filtered, savedPositions);

                resizeObserverRef.current?.disconnect();
                cyRef.current?.destroy();
                unbindCy();

                const cy = cytoscape({
                    container: containerRef.current,
                    elements,
                    style: graphStyles,
                    wheelSensitivity: 0.25,
                    minZoom: 0.15,
                    maxZoom: 4,
                    boxSelectionEnabled: false,
                    layout: { name: 'preset' },
                });

                cyRef.current = cy;

                bindCy(cy, nodeIds, {
                    onRestoredFromStorage: () => {
                        restoredFromStorageRef.current = true;
                    },
                });

                requestAnimationFrame(() => {
                    cy.resize();
                    if (!hasSaved) {
                        drawFreshLayout(cy, filtered);
                    }
                });

                const observer = new ResizeObserver(() => {
                    if (!cyRef.current || restoredFromStorageRef.current) return;
                    fitGraph(cyRef.current);
                });
                observer.observe(containerRef.current);
                resizeObserverRef.current = observer;
            },
            [bindCy, unbindCy, drawFreshLayout],
        );

        const resetAndRedraw = useCallback(() => {
            const filtered = dataRef.current;
            if (!filtered) {
                return { contextCount: 0 };
            }

            clearGraphStateStorage();
            clearRectangleLayoutCache();
            mountGraph(filtered, false);

            return { contextCount: getContextCount(filtered) };
        }, [mountGraph]);

        useImperativeHandle(ref, () => ({ resetAndRedraw }), [resetAndRedraw]);

        useEffect(() => {
            if (!data) return;

            const filtered = filterTopology(data);
            dataRef.current = filtered;
            mountGraph(filtered, true);

            return () => {
                resizeObserverRef.current?.disconnect();
                unbindCy();
                cyRef.current?.destroy();
                cyRef.current = null;
            };
        }, [data, mountGraph, unbindCy]);

        if (isLoading) return <div>Загрузка...</div>;
        if (isError) return <div>Ошибка: {error?.message}</div>;
        if (!data) return null;

        const filtered = filterTopology(data);
        const contextCount = getContextCount(filtered);

        return (
            <div className={styles.wrapper}>
                <div className={styles.graphPanel}>
                    <div className={styles.toolbar}>
                        <button
                            type="button"
                            className={styles.toolBtn}
                            onClick={handleZoomIn}
                            title="Увеличить"
                        >
                            +
                        </button>
                        <button
                            type="button"
                            className={styles.toolBtn}
                            onClick={handleZoomOut}
                            title="Уменьшить"
                        >
                            −
                        </button>
                        <button
                            type="button"
                            className={styles.toolBtn}
                            onClick={handleFit}
                            title="Маштабировать топологию"
                        >
                            Маштабировать
                        </button>
                    </div>
                    <div
                        ref={containerRef}
                        className={styles.topologyGraphContainer}
                    />
                </div>
                <div className={styles.stats}>
                    <span>Узлы: {filtered.nodes.length}</span>
                    <span>Связи: {filtered.connections.length}</span>
                    <span>Контекстов: {contextCount}</span>
                </div>
            </div>
        );
    },
);
