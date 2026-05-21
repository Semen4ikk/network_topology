import styles from "./page.module.css";
import {TopologyGraph} from "@/components/TopologyGraph/TopologyGraph";

export default function Home() {
  return (
    <div className={styles.page}>
        <TopologyGraph/>
    </div>
  );
}
