import Link from 'next/link';
import styles from './header.module.css';

export default function Header() {
  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <Link href='/' className={styles.logo}>
          Fact<span style={{ color: '#3c5ae1' }}>Guard</span>
        </Link>
        <div className={styles.pageNavs}>
          <div className={styles.pageNav}>
            <Link href='/report'>Report</Link>
          </div>
          <div className={styles.pageNav}>
            <Link href='/listing'>Forum</Link>
          </div>
        </div>
        <div className={styles.sepLine} />
        <button className={styles.button}>
          <Link href='/auth/register'>Sign up</Link>
        </button>
      </div>
    </div>
  );
}
