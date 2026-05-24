import { groupByParent } from '@/entities/TopologyData/layoutShared';
import type { TopologyNode, TopologyResponse } from '@/entities/TopologyData/types';

export interface PopoverPortInfo {
    id: string;
    label: string;
    state: string;
}

export interface PopoverSwitchInfo {
    id: string;
    label: string;
    state: string;
    ports: PopoverPortInfo[];
}

export type NodePopoverContent =
    | {
          type: 'context';
          label: string;
          state: string;
          switches: PopoverSwitchInfo[];
      }
    | {
          type: 'switch';
          label: string;
          state: string;
          ports: PopoverPortInfo[];
      }
    | {
          type: 'port';
          label: string;
          state: string;
      };

export function formatNodeState(state: string | number): string {
    const key = String(state).toLowerCase();
    const labels: Record<string, string> = {
        ok: 'OK',
        warning: 'Warning',
        error: 'Error',
        unknown: 'Unknown',
    };
    return labels[key] ?? String(state);
}

export function getStateClassName(state: string | number): string {
    const key = String(state).toLowerCase();
    if (key === 'ok' || key === 'warning' || key === 'error' || key === 'unknown') {
        return key;
    }
    return 'unknown';
}

function toPortInfo(port: TopologyNode): PopoverPortInfo {
    return {
        id: String(port.id),
        label: port.label,
        state: String(port.state),
    };
}

function toSwitchInfo(
    sw: TopologyNode,
    childrenByParent: Map<string, TopologyNode[]>,
): PopoverSwitchInfo {
    return {
        id: String(sw.id),
        label: sw.label,
        state: String(sw.state),
        ports: (childrenByParent.get(String(sw.id)) ?? []).map(toPortInfo),
    };
}

export function buildNodePopoverContent(
    data: TopologyResponse,
    nodeId: string,
): NodePopoverContent | null {
    const node = data.nodes.find((n) => String(n.id) === nodeId);
    if (!node) return null;

    const childrenByParent = groupByParent(data.nodes);
    const nodeType = String(node.type);

    if (nodeType === 'context') {
        const switches = childrenByParent.get(String(node.id)) ?? [];
        return {
            type: 'context',
            label: node.label,
            state: String(node.state),
            switches: switches.map((sw) => toSwitchInfo(sw, childrenByParent)),
        };
    }

    if (nodeType === 'switch') {
        const ports = childrenByParent.get(String(node.id)) ?? [];
        return {
            type: 'switch',
            label: node.label,
            state: String(node.state),
            ports: ports.map(toPortInfo),
        };
    }

    if (nodeType === 'port') {
        return {
            type: 'port',
            label: node.label,
            state: String(node.state),
        };
    }

    return null;
}
