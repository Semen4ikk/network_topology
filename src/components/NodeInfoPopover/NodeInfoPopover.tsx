import {
    formatNodeState,
    getStateClassName,
    type NodePopoverContent,
} from '@/features/buildNodePopoverContent';
import styles from './NodeInfoPopover.module.css';
import { IoClose } from 'react-icons/io5';

type NodeInfoPopoverProps = {
    content: NodePopoverContent;
    x: number;
    y: number;
    onClose: () => void;
};

const TYPE_LABELS: Record<NodePopoverContent['type'], string> = {
    context: 'Контекст',
    switch: 'Свитч',
    port: 'Порт',
};

function StateBadge({ state }: { state: string }) {
    return (
        <span
            className={`${styles.stateBadge} ${styles[getStateClassName(state)]}`}
        >
            {formatNodeState(state)}
        </span>
    );
}

function PortRow({ label, state }: { label: string; state: string }) {
    return (
        <li className={styles.portRow}>
            <span className={styles.portLabel}>{label}</span>
            <StateBadge state={state} />
        </li>
    );
}

export function NodeInfoPopover({ content, x, y, onClose }: NodeInfoPopoverProps) {
    return (
        <>
            <button type="button" className={styles.backdrop} aria-label="Закрыть" onClick={onClose}/>
            <div className={styles.popover} style={{ left: x, top: y }} role="dialog" aria-label={`Информация: ${content.label}`}>
                <div className={styles.header}>
                    <span className={styles.type}>{TYPE_LABELS[content.type]}</span>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <IoClose />
                    </button>
                </div>

                <div className={styles.titleRow}>
                    <p className={styles.nodeTitle}>{content.label}</p>
                    {content.type !== 'port' && (
                        <StateBadge state={content.state} />
                    )}
                </div>

                {content.type === 'port' && (
                    <div className={styles.portOnly}>
                        <span className={styles.metaLabel}>Статус</span>
                        <StateBadge state={content.state} />
                    </div>
                )}

                {content.type === 'switch' && (
                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>Порты</h4>
                        {content.ports.length === 0 ? (
                            <p className={styles.empty}>Нет портов</p>
                        ) : (
                            <ul className={styles.list}>
                                {content.ports.map((port) => (
                                    <PortRow
                                        key={port.id}
                                        label={port.label}
                                        state={port.state}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                {content.type === 'context' && (
                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>Свитчи и порты</h4>
                        {content.switches.length === 0 ? (
                            <p className={styles.empty}>Нет свитчей</p>
                        ) : (
                            <ul className={styles.switchList}>
                                {content.switches.map((sw) => (
                                    <li key={sw.id} className={styles.switchBlock}>
                                        <div className={styles.switchHeader}>
                                            <p className={styles.switchName}>
                                                {sw.label}
                                            </p>
                                            <StateBadge state={sw.state} />
                                        </div>
                                        {sw.ports.length === 0 ? (
                                            <p className={styles.emptyNested}>
                                                Нет портов
                                            </p>
                                        ) : (
                                            <ul className={styles.list}>
                                                {sw.ports.map((port) => (
                                                    <PortRow
                                                        key={port.id}
                                                        label={port.label}
                                                        state={port.state}
                                                    />
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}
            </div>
        </>
    );
}
