import type {
    TopologyConnection,
    TopologyNode,
    TopologyResponse,
} from '@/entities/TopologyData/types';

const VALID_NODE_TYPES = new Set(['context', 'switch', 'port']);
const VALID_NODE_STATES = new Set(['ok', 'warning', 'error', 'unknown']);
const VALID_CONNECTION_TYPES = new Set(['line', 'arrow', 'dashed', 'arrowed']);

export function normalizeId(id: string | number): string {
    return String(id);
}

function isValidNode(node: TopologyNode): boolean {
    const id = normalizeId(node.id);
    if (!id) return false;
    if (!VALID_NODE_TYPES.has(String(node.type))) return false;
    return VALID_NODE_STATES.has(String(node.state));

}

function isValidConnection(connection: TopologyConnection): boolean {
    if (!VALID_CONNECTION_TYPES.has(String(connection.type))) return false;
    const source = normalizeId(connection.source);
    const target = normalizeId(connection.target);
    if (!source || !target) return false;
    return source !== target;

}

export function filterTopology(data: TopologyResponse): TopologyResponse {
    const nodes = data.nodes.filter(isValidNode).map((node) => ({
        ...node,
        id: normalizeId(node.id),
        parent: node.parent ? normalizeId(node.parent) : undefined,
    }));

    const nodeIds = new Set(nodes.map((node) => node.id));

    const nodesWithValidParent = nodes.filter((node) => {
        if (!node.parent) return true;
        return nodeIds.has(node.parent) && node.parent !== node.id;
    });

    const validNodeIds = new Set(nodesWithValidParent.map((node) => node.id));

    const connections = data.connections
        .filter(isValidConnection)
        .map((connection) => ({
            ...connection,
            source: normalizeId(connection.source),
            target: normalizeId(connection.target),
        }))
        .filter(
            (connection) =>
                validNodeIds.has(connection.source) &&
                validNodeIds.has(connection.target),
        );

    return { nodes: nodesWithValidParent, connections };
}
