import type { TopologyNode } from './types';

export interface NodePosition {
    x: number;
    y: number;
}

export const PORT_SIZE = 34;
export const PORT_GAP = 10;
export const SWITCH_PADDING = 20;
export const CONTEXT_PADDING = 28;
export const TITLE_OFFSET = 22;

export interface BoxSize {
    width: number;
    height: number;
}

export function groupByParent(nodes: TopologyNode[]): Map<string, TopologyNode[]> {
    const map = new Map<string, TopologyNode[]>();
    for (const node of nodes) {
        if (!node.parent) continue;
        const parentId = String(node.parent);
        const list = map.get(parentId) ?? [];
        list.push(node);
        map.set(parentId, list);
    }
    return map;
}

function gridSize(count: number, cols: number): { cols: number; rows: number } {
    const c = Math.max(1, Math.min(cols, count || 1));
    return { cols: c, rows: Math.max(1, Math.ceil(count / c)) };
}

function layoutGrid(
    count: number,
    cols: number,
    cellW: number,
    cellH: number,
    gap: number,
    originX: number,
    originY: number,
): { positions: NodePosition[]; width: number; height: number } {
    const { cols: c, rows } = gridSize(count, cols);
    const positions: NodePosition[] = [];

    for (let i = 0; i < count; i++) {
        const col = i % c;
        const row = Math.floor(i / c);
        positions.push({
            x: originX + col * (cellW + gap) + cellW / 2,
            y: originY + row * (cellH + gap) + cellH / 2,
        });
    }

    const width = count === 0 ? cellW + originX * 2 : originX * 2 + c * cellW + (c - 1) * gap;
    const height = count === 0 ? cellH + originY * 2 : originY * 2 + rows * cellH + (rows - 1) * gap;
    return { positions, width, height };
}

export function layoutSwitch(
    ports: TopologyNode[],
    positions: Map<string, NodePosition>,
): BoxSize {
    const portCols = Math.min(4, Math.max(1, ports.length));
    const {
        positions: portPos,
        width: portsW,
        height: portsH,
    } = layoutGrid(
        ports.length,
        portCols,
        PORT_SIZE,
        PORT_SIZE,
        PORT_GAP,
        SWITCH_PADDING,
        SWITCH_PADDING + TITLE_OFFSET,
    );

    ports.forEach((port, i) => {
        if (portPos[i]) {
            positions.set(String(port.id), portPos[i]);
        }
    });

    const width = Math.max(portsW + SWITCH_PADDING, 120);
    const height = Math.max(portsH + SWITCH_PADDING + TITLE_OFFSET, 90);
    return { width, height };
}

export function getContexts(nodes: TopologyNode[]): TopologyNode[] {
    return nodes.filter((n) => !n.parent && n.type === 'context');
}
