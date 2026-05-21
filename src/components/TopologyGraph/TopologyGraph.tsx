'use client';

import {useRef} from "react";
import cytoscape, { Core} from 'cytoscape';
import styles from "./TopologyGraph.module.css";
import {useTopologyQuery} from "@/entities/TopologyData/query";
export function TopologyGraph(){
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);
    const { data, isLoading, isError, error } = useTopologyQuery();

    if (isLoading) return <div>Загрузка...</div>;
    if (isError) return <div>Ошибка: {error?.message}</div>;
    if (!data) return null;
    return(
        <>
            <div ref={containerRef} className={styles.topologyGraphContainer} />
            <h2>Узлы: {data.nodes.length}</h2>
            <h2>Связи: {data.connections.length}</h2>

        </>
    )
}