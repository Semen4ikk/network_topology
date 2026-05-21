import { api } from '@/shared/axios/axios';
import type { TopologyResponse } from './types';

export const topologyData = {
    getAll: async (): Promise<TopologyResponse> => {
        const { data } = await api.get<TopologyResponse>('/api/topology');
        return data;
    },
};