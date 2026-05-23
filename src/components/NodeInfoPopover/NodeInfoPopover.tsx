import {formatNodeState, getStateClassName, type NodePopoverContent} from '@/features/buildNodePopoverContent';
import styles from './NodeInfoPopover.module.css';
import {IoClose} from "react-icons/io5";

type NodeInfoPopoverProps = {
    content: NodePopoverContent;
    x: number;
    y: number;
    onClose: () => void;
};

function PortRow({ label, state }: { label: string; state: string }) {
    return (
        <li className={styles.portRow}>
            <span className={styles.portLabel}>{label}</span>
            <span className={`${styles.stateBadge} ${styles[getStateClassName(state)]}`}>
                {formatNodeState(state)}
            </span>
        </li>
    );
}

export function NodeInfoPopover({ content, x, y, onClose }: NodeInfoPopoverProps) {

    return (
        <>
            <button type="button" className={styles.backdrop} aria-label="Закрыть" onClick={onClose}/>
            <div className={styles.popover} style={{ left: x, top: y }} role="dialog" aria-label={`Информация: ${content.label}`}>
                <div className={styles.header}>
                    <span className={styles.type}>{content.label}</span>
                    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
                        <IoClose />
                    </button>
                </div>
                {content.type === 'port' && (
                    <div className={styles.portOnly}>
                        <span className={styles.metaLabel}>Статус</span>
                        <span className={`${styles.stateBadge} ${styles[getStateClassName(content.state)]}`}>
                            {formatNodeState(content.state)}
                        </span>
                    </div>
                )}
                {content.type === 'switch' && (
                    <section className={styles.section}>
                        {content.ports.length === 0 ? (
                            <p className={styles.empty}>Нет портов</p>
                        ) : (
                            <ul className={styles.list}>
                                {content.ports.map((port) => (
                                    <PortRow key={port.id} label={port.label} state={port.state}/>
                                ))}
                            </ul>
                        )}
                    </section>
                )}
                {content.type === 'context' && (
                    <section className={styles.section}>
                        <h4 className={styles.sectionTitle}>Свитчи</h4>
                        {content.switches.length === 0 ? (
                            <p className={styles.empty}>Нет свитчей</p>
                        ) : (
                            <ul className={styles.switchList}>
                                {content.switches.map((sw) => (
                                    <li key={sw.id} className={styles.switchBlock}>
                                        <p className={styles.switchName}>{sw.label}</p>
                                        {sw.ports.length === 0 ? (
                                            <p className={styles.emptyNested}>Нет портов</p>
                                        ) : (
                                            <ul className={styles.list}>
                                                {sw.ports.map((port) => (
                                                    <PortRow key={port.id} label={port.label} state={port.state}/>
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
