import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { topologyData } from './data';
import type { TopologyResponse } from './types';

export const useTopologyQuery = (
    options?: Omit<
        UseQueryOptions<TopologyResponse, Error>,
        'queryKey' | 'queryFn'
    >
) => {
    return useQuery<TopologyResponse, Error>({
        queryKey: ['topology'],
        queryFn: topologyData.getAll,
        staleTime: Infinity,
        gcTime: 60 * 60 * 1000,
        retry: 2,
        ...options,
    });
};