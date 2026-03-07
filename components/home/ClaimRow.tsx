import Image from 'next/image';
import styles from './claimrow.module.css';
import { ClaimSource, PopularClaim, Post } from '@/types/types';
import { getIconAndName } from '@/app/utils/claimSource';

export default function ClaimRow({ imgUrl, posts, title }: PopularClaim) {
  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <Image src={imgUrl} alt='claim title' width={100} height={200} />
        <span className={styles.claimTitle}>{title}</span>
        <div className={styles.claimMetadata}>
          6 hours • 110 related reports
        </div>
      </div>
      <div className={styles.postsSection}>
        {posts.map((post, i) => {
          const { icon: srcIcon, name: srcName } = getIconAndName(
            post.sourceType,
          );
          return (
            <div className={styles.postRow} key={`popular-post-${i}`}>
              <div className={styles.postSrc}>
                <Image src={srcIcon} alt='src icon' width={16} height={16} />
                <span>{srcName}</span>
              </div>
              <div className={styles.postTitle}>{post.title}</div>
              <div className={styles.postTime}>6 hours</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
