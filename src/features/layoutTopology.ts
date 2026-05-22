import type { Core } from 'cytoscape';
import type { TopologyNode, TopologyResponse } from '@/entities/TopologyData/types';
import {CONTEXT_PADDING, TITLE_OFFSET, getContexts, groupByParent, layoutSwitch, type BoxSize, type NodePosition} from '@/entities/TopologyData/layoutShared';

const CONTEXT_RECT_GAP = 64;
const SWITCH_ROW_GAP = 24;
const CONTEXT_COMPOUND_MARGIN = 48;

export interface TopologyGrid {
    cols: number;
    rows: number;
}

export interface RectangleLayoutResult {
    contextCount: number;
    grid: TopologyGrid;
    positions: Map<string, NodePosition>;
}

export function getContextCount(data: TopologyResponse): number {
    return getContexts(data.nodes).length;
}

export function getTopologyGrid(count: number): TopologyGrid {
    if (count <= 0) return { cols: 0, rows: 0 };
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return { cols, rows };
}

function inflateContextSize(size: BoxSize): BoxSize {
    return {
        width: size.width + CONTEXT_COMPOUND_MARGIN,
        height: size.height + CONTEXT_COMPOUND_MARGIN,
    };
}

function layoutContextSwitchesRow(
    switches: TopologyNode[],
    childrenByParent: Map<string, TopologyNode[]>,
    positions: Map<string, NodePosition>,
): BoxSize {
    let cursorX = CONTEXT_PADDING;
    const rowY = CONTEXT_PADDING + TITLE_OFFSET;
    let maxSwitchHeight = 0;

    for (const sw of switches) {
        const ports = childrenByParent.get(String(sw.id)) ?? [];
        const switchSize = layoutSwitch(ports, positions);

        positions.set(String(sw.id), {
            x: cursorX + switchSize.width / 2,
            y: rowY + switchSize.height / 2,
        });

        cursorX += switchSize.width + SWITCH_ROW_GAP;
        maxSwitchHeight = Math.max(maxSwitchHeight, switchSize.height);
    }

    const width = Math.max(
        switches.length > 0 ? cursorX - SWITCH_ROW_GAP + CONTEXT_PADDING : 220,
        220,
    );
    const height = Math.max(
        maxSwitchHeight + CONTEXT_PADDING * 2 + TITLE_OFFSET,
        160,
    );

    return { width, height };
}

function buildColumnWidths(contextSizes: BoxSize[], grid: TopologyGrid, contextCount: number): number[] {
    const colWidths = Array.from({ length: grid.cols }, () => 0);
    for (let i = 0; i < contextCount; i++) {
        const col = i % grid.cols;
        const size = inflateContextSize(contextSizes[i]);
        colWidths[col] = Math.max(colWidths[col], size.width);
    }

    return colWidths;
}

function buildRowHeights(contextSizes: BoxSize[], grid: TopologyGrid, contextCount: number): number[] {
    const rowHeights = Array.from({ length: grid.rows }, () => 0);
    for (let i = 0; i < contextCount; i++) {
        const row = Math.floor(i / grid.cols);
        const size = inflateContextSize(contextSizes[i]);
        rowHeights[row] = Math.max(rowHeights[row], size.height);
    }

    return rowHeights;
}

export function computeRectangleLayout(data: TopologyResponse): RectangleLayoutResult {
    const positions = new Map<string, NodePosition>();
    const childrenByParent = groupByParent(data.nodes);
    const contexts = getContexts(data.nodes);
    const contextCount = contexts.length;
    const grid = getTopologyGrid(contextCount);
    const contextSizes: BoxSize[] = contexts.map((context) => {
        const switches = childrenByParent.get(String(context.id)) ?? [];
        return layoutContextSwitchesRow(switches, childrenByParent, positions);
    });
    const colWidths = buildColumnWidths(contextSizes, grid, contextCount);
    const rowHeights = buildRowHeights(contextSizes, grid, contextCount);
    const colOffset: number[] = [CONTEXT_RECT_GAP];
    for (let c = 1; c < grid.cols; c++) {
        colOffset[c] = colOffset[c - 1] + colWidths[c - 1] + CONTEXT_RECT_GAP;
    }
    const rowOffset: number[] = [CONTEXT_RECT_GAP];

    for (let r = 1; r < grid.rows; r++) {
        rowOffset[r] = rowOffset[r - 1] + rowHeights[r - 1] + CONTEXT_RECT_GAP;
    }

    for (let i = 0; i < contextCount; i++) {
        const context = contexts[i];
        const col = i % grid.cols;
        const row = Math.floor(i / grid.cols);
        const size = inflateContextSize(contextSizes[i]);
        positions.set(String(context.id), {
            x: colOffset[col] + size.width / 2,
            y: rowOffset[row] + size.height / 2,
        });
    }

    return { contextCount, grid, positions };
}

function applyPositionsInOrder(cy: Core, data: TopologyResponse, positions: Map<string, NodePosition>): void {
    const portIds = data.nodes
        .filter((n) => n.type === 'port')
        .map((n) => String(n.id));
    const switchIds = data.nodes
        .filter((n) => n.type === 'switch')
        .map((n) => String(n.id));
    const contextIds = getContexts(data.nodes).map((n) => String(n.id));

    const applyIds = (ids: string[]) => {
        for (const id of ids) {
            const pos = positions.get(id);
            if (!pos) continue;
            const node = cy.getElementById(id);
            if (node.nonempty()) {
                node.position({ x: pos.x, y: pos.y });
            }
        }
    };
    cy.startBatch();
    applyIds(portIds);
    applyIds(switchIds);
    applyIds(contextIds);
    cy.endBatch();
}

let layoutCacheKey = '';
let layoutCache: RectangleLayoutResult | null = null;

export function clearRectangleLayoutCache(): void {
    layoutCacheKey = '';
    layoutCache = null;
}

function getLayoutCacheKey(data: TopologyResponse): string {
    return data.nodes.map((n) => `${n.id}:${n.parent ?? ''}`).sort().join('|');
}

export function getRectangleLayout(data: TopologyResponse): RectangleLayoutResult {
    const key = getLayoutCacheKey(data);
    if (layoutCache && layoutCacheKey === key) {
        return {
            ...layoutCache,
            positions: new Map(layoutCache.positions),
        };
    }

    const result = computeRectangleLayout(data);
    layoutCacheKey = key;
    layoutCache = {
        ...result,
        positions: new Map(result.positions),
    };

    return {
        ...result,
        positions: new Map(result.positions),
    };
}

export function applyRectangleLayoutToCy(cy: Core, data: TopologyResponse): RectangleLayoutResult {
    const result = getRectangleLayout(data);
    applyPositionsInOrder(cy, data, result.positions);
    return result;
}
