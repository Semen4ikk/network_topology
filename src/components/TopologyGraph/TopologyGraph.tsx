'use client';

import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,} from 'react';
import cytoscape, {type Core, type EventObjectNode} from 'cytoscape';
import styles from './TopologyGraph.module.css';
import {useTopologyQuery} from '@/entities/TopologyData/query';
import {filterTopology} from '@/features/filterTopology';
import type {NodePopoverContent} from '@/features/buildNodePopoverContent';
import {buildNodePopoverContent} from '@/features/buildNodePopoverContent';
import {NodeInfoPopover} from '@/components/NodeInfoPopover/NodeInfoPopover';
import {applyRectangleLayoutToCy, clearRectangleLayoutCache, getContextCount,} from '@/features/layoutTopology';
import {buildGraphElements, graphStyles} from '@/entities/TopologyData/buildGraphElements';
import {
    clearGraphStateStorage,
    hasGraphStateInStorage,
    loadGraphSave,
    savedStateToPositions
} from '@/features/graphSaveStorage';
import {useGraphState} from '@/entities/TopologyData/hooks/useGraphState';
import {MdCenterFocusStrong} from 'react-icons/md';
import {FaMinus, FaPlus} from 'react-icons/fa';
import type {NodePosition} from '@/entities/TopologyData/layoutShared';

const FIT_PADDING = 48;
const FOCUS_ZOOM = 1.5;

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
    focusOnNode: (nodeId: string, position: NodePosition) => boolean;
};

export const TopologyGraph = forwardRef<TopologyGraphHandle>(
    function TopologyGraph(_, ref) {
        const containerRef = useRef<HTMLDivElement>(null);
        const cyRef = useRef<Core | null>(null);
        const resizeObserverRef = useRef<ResizeObserver | null>(null);
        const cyEventsCleanupRef = useRef<(() => void) | null>(null);
        const dataRef = useRef<ReturnType<typeof filterTopology> | null>(null);
        const restoredFromStorageRef = useRef(false);
        const onNodeShiftTapRef = useRef<
            ((evt: EventObjectNode) => void) | null
        >(null);
        const { data, isLoading, isError, error } = useTopologyQuery();
        const { bindCy, unbindCy, saveFromLayout, runLayout } = useGraphState();
        const [popover, setPopover] = useState<{
            content: NodePopoverContent;
            x: number;
            y: number;
        } | null>(null);

        const closePopover = useCallback(() => setPopover(null), []);

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

        onNodeShiftTapRef.current = useCallback((evt: EventObjectNode) => {
            const filtered = dataRef.current;
            const panel = containerRef.current?.parentElement;
            if (!filtered || !panel) return;

            const nodeId = evt.target.id();
            const content = buildNodePopoverContent(filtered, nodeId);
            if (!content) return;

            const panelRect = panel.getBoundingClientRect();
            const x = evt.originalEvent.clientX - panelRect.left;
            const y = evt.originalEvent.clientY - panelRect.top;

            setPopover({content, x, y});
        }, []);

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
                cyEventsCleanupRef.current?.();
                cyEventsCleanupRef.current = null;
                cyRef.current?.destroy();
                unbindCy();

                const cy = cytoscape({
                    container: containerRef.current,
                    elements,
                    style: graphStyles,
                    wheelSensitivity: 0.35, //TODO хз мб добавить настройки для зума
                    minZoom: 0.15,
                    maxZoom: 4,
                    boxSelectionEnabled: false,
                    layout: { name: 'preset' },
                });

                cyRef.current = cy;

                const onNodeTap = (evt: EventObjectNode) => {
                    if (evt.originalEvent.shiftKey) {
                        onNodeShiftTapRef.current?.(evt);
                        return;
                    }
                    closePopover();
                };

                const onBackgroundTap = (evt: { target: Core }) => {
                    if (evt.target === cy) {
                        closePopover();
                    }
                };

                cy.on('tap', 'node', onNodeTap);
                cy.on('tap', onBackgroundTap);

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

                cyEventsCleanupRef.current = () => {
                    cy.removeListener('tap', 'node', onNodeTap);
                    cy.removeListener('tap', onBackgroundTap);
                };
            },
            [bindCy, unbindCy, drawFreshLayout, closePopover],
        );

        const resetAndRedraw = useCallback(() => {
            const filtered = dataRef.current;
            if (!filtered) {
                return { contextCount: 0 };
            }

            clearGraphStateStorage();
            clearRectangleLayoutCache();
            closePopover();
            mountGraph(filtered, false);

            return { contextCount: getContextCount(filtered) };
        }, [mountGraph, closePopover]);

        const focusOnNode = useCallback(
            (nodeId: string, _position: NodePosition) => {
                const cy = cyRef.current;
                if (!cy) return false;

                const node = cy.getElementById(nodeId);
                if (!node.nonempty()) return false;

                const zoom = Math.min(
                    Math.max(FOCUS_ZOOM, cy.minZoom()),
                    cy.maxZoom(),
                );

                cy.animate(
                    {
                        center: { eles: node },
                        zoom,
                    },
                    { duration: 280 },
                );

                cy.nodes().unselect();
                node.select();

                return true;
            },
            [],
        );

        useImperativeHandle(
            ref,
            () => ({ resetAndRedraw, focusOnNode }),
            [resetAndRedraw, focusOnNode],
        );

        useEffect(() => {
            if (!data) return;

            const filtered = filterTopology(data);
            dataRef.current = filtered;
            mountGraph(filtered, true);

            const onKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') closePopover();
            };
            window.addEventListener('keydown', onKeyDown);

            return () => {
                window.removeEventListener('keydown', onKeyDown);
                closePopover();
                resizeObserverRef.current?.disconnect();
                cyEventsCleanupRef.current?.();
                cyEventsCleanupRef.current = null;
                unbindCy();
                cyRef.current?.destroy();
                cyRef.current = null;
            };
        }, [data, mountGraph, unbindCy, closePopover]);

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
                        ><FaPlus />
                        </button>
                        <button
                            type="button"
                            className={styles.toolBtn}
                            onClick={handleZoomOut}
                            title="Уменьшить"
                        >
                            <FaMinus />
                        </button>
                        <button
                            type="button"
                            className={styles.toolBtn}
                            onClick={handleFit}
                            title="Маштабировать топологию"
                        >
                            <MdCenterFocusStrong />
                        </button>
                    </div>
                    <div
                        ref={containerRef}
                        className={styles.topologyGraphContainer}
                    />
                    {popover && (
                        <NodeInfoPopover
                            content={popover.content}
                            x={popover.x}
                            y={popover.y}
                            onClose={closePopover}
                        />
                    )}
                </div>
                <div className={styles.stats}>
                    <span>Узлы: {filtered.nodes.length}</span>
                    <span>Связи: {filtered.connections.length}</span>
                    <span>Контекстов: {contextCount}</span>
                    <span className={styles.statusOk}>Статус: ok</span>
                    <span className={styles.statusWarning}>Статус: warning</span>
                    <span className={styles.statusError}>Статус: error</span>
                </div>
            </div>
        );
    },
);
