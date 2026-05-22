'use client';

import { useRef} from 'react';
import styles from './page.module.css';
import {TopologyGraph,type TopologyGraphHandle} from '@/components/TopologyGraph/TopologyGraph';

export default function Home() {
    const graphRef = useRef<TopologyGraphHandle>(null);
    const handleReset = () => {
        const result = graphRef.current?.resetAndRedraw() ?? {
            contextCount: 0,
        };
        if (result.contextCount === 0) {
            return;
        }
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
            </section>
            <TopologyGraph ref={graphRef} />
        </div>
    );
}
