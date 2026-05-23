'use client';

import { useState, type RefObject, type KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {getSearchErrorMessage, searchNodeByLabelFromCache} from '@/features/searchNodeByLabel';
import type { TopologyGraphHandle } from '@/components/TopologyGraph/TopologyGraph';
import styles from './TopologySearch.module.css';
import {IoSearch} from "react-icons/io5";

type TopologySearchProps = {
    graphRef: RefObject<TopologyGraphHandle | null>;
};

export function TopologySearch({ graphRef }: TopologySearchProps) {
    const queryClient = useQueryClient();
    const [label, setLabel] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const handleSearch = () => {
        const result = searchNodeByLabelFromCache(queryClient, label);

        if (!result.ok) {
            setIsError(true);
            setMessage(getSearchErrorMessage(result.reason));
            return;
        }

        const focused = graphRef.current?.focusOnNode(
            result.nodeId,
            result.position,
        );

        if (!focused) {
            setIsError(true);
            setMessage('Граф ещё не готов');
            return;
        }
        setIsError(false);
        setMessage(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.searchRow}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Напиши название"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button type="button" className={styles.findBtn} onClick={handleSearch}>
                    <IoSearch />
                </button>
            </div>
            {message && (<p className={styles.messageError}>{message}</p>)}
        </div>
    );
}
