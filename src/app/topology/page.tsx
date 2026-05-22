'use client';

import { useRef } from 'react';
import styles from './page.module.css';
import {
    TopologyGraph,
    type TopologyGraphHandle,
} from '@/components/TopologyGraph/TopologyGraph';
import { TopologySearch } from '@/components/TopologySearch/TopologySearch';

export default function Home() {
    const graphRef = useRef<TopologyGraphHandle>(null);

    const handleReset = () => {
        graphRef.current?.resetAndRedraw();
    };

    return (
        <div className={styles.page}>
            <section className={styles.actions}>
                <button
                    type="button"
                    className={styles.layoutBtn}
                    onClick={handleReset}
                >
                    Сбросить и перерисовать
                </button>
                <TopologySearch graphRef={graphRef} />
            </section>
            <TopologyGraph ref={graphRef} />
        </div>
    );
}
