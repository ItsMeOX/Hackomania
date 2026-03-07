'use client';

import { ClaimSource } from '@/types/types';
import styles from './detail.module.css';
import { useState } from 'react';
import Image from 'next/image';
import { getIconAndName } from '@/app/utils/claimSource';
import Comment from '@/components/listingdetail/Comment';
import Link from 'next/link';

const INIT_DATA = {
  id: 2,
  title:
    'BREAKING: Iran Launches Secret Missile Strike on U.S. Base – Media Ordered Not to Report',
  sourceType: ClaimSource.X,
  sourceUrl: '.',
  imgUrl: '/ai_war.png',
  time: new Date(),
  aiSummary:
    'This headline is suspicious because it makes a major military claim without citing any credible sources or official reports. In similar viral posts, videos claiming to show Iranian jets attacking U.S. ships were later found to be footage from military simulation video games rather than real combat. Additionally, some clips used in these claims show outdated WWII-era ships and aircraft, which would not ...',
  credibility: '',
  transparency: '',
  score: 0,
  comments: [
    {
      user: { id: 1, name: 'Tristan' },
      comment: 'my comment!',
      supportingEvidence: null,
      userDescription: null,
    },
    {
      user: { id: 1, name: 'Tristan' },
      comment: null,
      supportingEvidence: 'my evidence',
      userDescription: 'my user description',
    },
    {
      user: { id: 1, name: 'Tristan' },
      comment: 'my comment!',
      supportingEvidence: null,
      userDescription: 'my sole user description',
    },
  ],
};

export default function DetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState(INIT_DATA);
  const { icon: srcIcon, name: srcName } = getIconAndName(data.sourceType);

  return (
    <div className={styles.container}>
      <Link className={styles.backButton} href='/listing'>
        <Image src='/back.svg' alt='back' width={20} height={20} />
        <span>back</span>
      </Link>
      <span className={styles.title}>{data.title}</span>
      <Image
        className={styles.thumbnail}
        src={data.imgUrl}
        alt='thumbnail'
        width={1200}
        height={400}
        // fill
        // style={{ objectFit: 'cover' }}
      />
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Information section</span>
        <div className={styles.srcWrapper}>
          <Image src={srcIcon} alt='src icon' width={30} height={30} />
          <span>{srcName}</span>
        </div>
      </div>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>
          Why our AI thinks this is misleading
        </span>
        <span>{data.aiSummary}</span>
      </div>
      <div className={styles.section}>
        <span className={styles.sectionTitle}>Discussion section</span>
        <div className={styles.commentSection}>
          {data.comments.map((comment, i) => (
            <Comment
              comment={comment.comment ?? ''}
              userDesc={comment.userDescription ?? ''}
              supportEvidence={comment.supportingEvidence ?? ''}
              username={comment.user.name}
              key={`comment-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
