import { filterTopology } from '@/features/filterTopology';
import { getNodePositionFromStorage } from '@/features/graphSaveStorage';
import type { TopologyNode, TopologyResponse } from '@/entities/TopologyData/types';
import type { NodePosition } from '@/entities/TopologyData/layoutShared';
import type { QueryClient } from '@tanstack/react-query';
import { TOPOLOGY_QUERY_KEY } from '@/entities/TopologyData/query';

export type SearchNodeErrorReason = 'empty' | 'no_data' | 'not_found' | 'no_position';

export type SearchNodeResult = {
    ok: true;
    nodeId: string;
    label: string;
    position: NodePosition;
} | {
        ok: false;
        reason: SearchNodeErrorReason;
};

export function getTopologyFromQueryCache(queryClient: QueryClient): TopologyResponse | undefined {
    return queryClient.getQueryData<TopologyResponse>(TOPOLOGY_QUERY_KEY);
}

function findNodeByLabel(
    nodes: TopologyNode[],
    labelQuery: string,
): TopologyNode | null {
    const query = labelQuery.trim().toLowerCase();
    if (!query) return null;

    const exact = nodes.find((n) => n.label.toLowerCase() === query);
    if (exact) return exact;

    return nodes.find((n) => n.label.toLowerCase().includes(query)) ?? null;
}
export function searchNodeByLabel(data: TopologyResponse | undefined, labelQuery: string): SearchNodeResult {
    if (!labelQuery.trim()) {
        return { ok: false, reason: 'empty' };
    }
    if (!data) {
        return { ok: false, reason: 'no_data' };
    }

    const filtered = filterTopology(data);
    const node = findNodeByLabel(filtered.nodes, labelQuery);

    if (!node) {
        return { ok: false, reason: 'not_found' };
    }

    const nodeId = String(node.id);
    const nodeIds = filtered.nodes.map((n) => String(n.id));
    const position = getNodePositionFromStorage(nodeId, nodeIds);

    if (!position) {
        return { ok: false, reason: 'no_position' };
    }

    return {ok: true, nodeId, label: node.label, position};
}

export function searchNodeByLabelFromCache(queryClient: QueryClient, labelQuery: string): SearchNodeResult {
    return searchNodeByLabel(getTopologyFromQueryCache(queryClient), labelQuery);
}

export function getSearchErrorMessage(reason: SearchNodeErrorReason): string {
    switch (reason) {
        case 'empty':
            return 'Введите название того что ищем';
        case 'no_data':
            return 'Топологии нет(';
        case 'not_found':
            return 'Нету такого';
        case 'no_position':
            return 'Ой, а я не знаю где это';
    }
}
