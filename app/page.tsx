import Image from 'next/image';
import styles from './home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.gradient} />
      <div className={styles.bannerSection}>
        <div className={styles.title}>
          Don't Let <span style={{ color: '#3C5AE1' }}>Misinformation</span>{' '}
          <br />
          Win the Narrative
        </div>
        <div className={styles.subtitle}>
          We track, verify, and debunk false claims in real-time so you can
          navigate the information landscape with confidence.
        </div>
        <button className={styles.verifyButton}>
          <Image src='/search.svg' alt='search' width={18} height={18} />
          Verify a Claim
        </button>
      </div>
    </div>
  );
}
