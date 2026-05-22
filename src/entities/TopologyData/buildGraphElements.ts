import type cytoscape from 'cytoscape';
import type { TopologyResponse } from './types';
import type { NodePosition } from './layoutShared';

const STATE_COLORS: Record<string, string> = {
    ok: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    unknown: '#94a3b8',
};

export function buildGraphElements(
    data: TopologyResponse,
    savedPositions?: Map<string, NodePosition> | null,
): cytoscape.ElementDefinition[] {
    const nodeElements: cytoscape.ElementDefinition[] = data.nodes.map(
        (node) => {
            const id = String(node.id);
            const position = savedPositions?.get(id);

            return {
                data: {
                    id,
                    label: node.label,
                    type: node.type,
                    state: String(node.state),
                    parent: node.parent,
                    color: STATE_COLORS[String(node.state)] ?? '#94a3b8',
                },
                ...(position ? { position } : {}),
            };
        },
    );

    const edgeElements: cytoscape.ElementDefinition[] = data.connections.map(
        (connection) => ({
            data: {
                id: connection.id,
                source: String(connection.source),
                target: String(connection.target),
                connectionType: String(connection.type),
            },
        }),
    );

    return [...nodeElements, ...edgeElements];
}

export const graphStyles = [
    {
        selector: 'node',
        style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '11px',
            'text-wrap': 'ellipsis',
            'text-max-width': '70px',
            color: '#fff',
            'text-outline-width': 2,
            'text-outline-color': '#0f172a',
            'background-color': 'data(color)',
            width: '36px',
            height: '36px',
            'border-width': 2,
            'border-color': '#0f172a',
            'border-opacity': 0.25,
            'z-index': 10,
        },
    },
    {
        selector: 'node[type = "context"]',
        style: {
            shape: 'round-rectangle',
            width: '72px',
            height: '48px',
            'font-size': '12px',
            'font-weight': 'bold',
        },
    },
    {
        selector: 'node[type = "switch"]',
        style: {
            shape: 'round-rectangle',
            width: '52px',
            height: '40px',
            'font-size': '10px',
        },
    },
    {
        selector: 'node[type = "port"]',
        style: {
            shape: 'ellipse',
            width: '34px',
            height: '34px',
            'font-size': '10px',
        },
    },
    {
        selector: ':parent',
        style: {
            'background-opacity': 0.08,
            'background-color': '#cbd5e1',
            'border-width': 2,
            'border-color': '#94a3b8',
            'border-style': 'dashed',
            padding: '24px',
            'text-valign': 'top',
            'text-halign': 'center',
            'font-size': '12px',
            'font-weight': 'bold',
            color: '#1e293b',
            'text-outline-width': 0,
            'text-margin-y': -6,
        },
    },
    {
        selector: 'edge',
        style: {
            width: 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'curve-style': 'unbundled-bezier',
            'control-point-distances': 40,
            'control-point-weights': 0.5,
            'arrow-scale': 1,
            opacity: 0.85,
            'z-index': 0,
        },
    },
    {
        selector: 'edge[connectionType = "line"]',
        style: {
            'target-arrow-shape': 'none',
        },
    },
    {
        selector:
            'edge[connectionType = "arrow"], edge[connectionType = "arrowed"]',
        style: {
            'target-arrow-shape': 'triangle',
        },
    },
    {
        selector: 'edge[connectionType = "dashed"]',
        style: {
            'line-style': 'dashed',
            'target-arrow-shape': 'none',
        },
    },
] as cytoscape.StylesheetStyle[];
