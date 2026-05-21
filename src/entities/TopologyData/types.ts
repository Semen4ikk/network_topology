export type NodeState = 'ok' | 'warning' | 'error' | 'unknown' | (string & {}) | number;
export type NodeType = 'context' | 'switch' | 'port' | (string & {});

export interface TopologyNode {
    id: string | number;
    label: string;
    type: NodeType;
    state: NodeState;
    parent?: string;
}

export type ConnectionType = 'line' | 'arrow' | 'dashed' | 'arrowed' | (string & {}) | number;

export interface TopologyConnection {
    id: string;
    source: string | number;
    target: string | number;
    type: ConnectionType;
}

export interface TopologyResponse {
    nodes: TopologyNode[];
    connections: TopologyConnection[];
}