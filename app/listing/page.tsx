'use client';

import Searchbar from '@/components/listing/Searchbar';
import styles from './listing.module.css';
import { Categories, ClaimSource, Post } from '@/types/types';
import TrendingTopicCom from '@/components/listing/TrendingTopic';
import { useState } from 'react';
import SuspiciousClaimRow from '@/components/listing/SuspiciousClaimRow';
import CategoryFilter from '@/components/listing/CategoryFilter';

const trendingTopicData: Categories[] = [
  {
    category: {
      id: 1,
      name: 'International Affairs',
      slug: 'international-affairs',
    },
    totalPostCount: 105,
    posts: [
      {
        id: 1,
        title:
          'Video shows an Iranian fighter jet destroying a U.S. warship during the Iran war',
        sourceType: ClaimSource.FACEBOOK,
        sourceUrl: '.',
        imgUrl: '/ai_war.png',
        time: new Date(),
        aiSummary: '',
        credibility: '',
        transparency: '',
        score: 0,
        comments: [],
      },
    ],
  },
  {
    category: { id: 2, name: 'Health & Medicine', slug: 'health-medicine' },
    totalPostCount: 32,
    posts: [
      {
        id: 3,
        title:
          'Video shows an Iranian fighter jet destroying a U.S. warship during the Iran war',
        sourceType: ClaimSource.FACEBOOK,
        sourceUrl: '.',
        imgUrl: '/medical_claim.png',
        time: new Date(),
        aiSummary: '',
        credibility: '',
        transparency: '',
        score: 0,
        comments: [],
      },
    ],
  },
  {
    category: {
      id: 3,
      name: 'Politics & Government',
      slug: 'politics-government',
    },
    totalPostCount: 21,
    posts: [
      {
        id: 1,
        title:
          'Video shows an Iranian fighter jet destroying a U.S. warship during the Iran war',
        sourceType: ClaimSource.FACEBOOK,
        sourceUrl: '.',
        imgUrl: '/us_iran_war.png',
        time: new Date(),
        aiSummary: '',
        credibility: '',
        transparency: '',
        score: 0,
        comments: [],
      },
      {
        id: 2,
        title:
          'Video shows an Iranian fighter jet destroying a U.S. warship during the Iran war',
        sourceType: ClaimSource.FACEBOOK,
        sourceUrl: '.',
        imgUrl: '/medical_claim.png',
        time: new Date(),
        aiSummary: '',
        credibility: '',
        transparency: '',
        score: 0,
        comments: [],
      },
      {
        id: 3,
        title:
          'Video shows an Iranian fighter jet destroying a U.S. warship during the Iran war',
        sourceType: ClaimSource.FACEBOOK,
        sourceUrl: '.',
        imgUrl: '/medical_claim.png',
        time: new Date(),
        aiSummary: '',
        credibility: '',
        transparency: '',
        score: 0,
        comments: [],
      },
    ],
  },
];

const susClaimData: Post[] = [
  {
    id: 1,
    title:
      'Video shows an Iranian fighter jet destroying a U.S. warship during the Iran war',
    sourceType: ClaimSource.FACEBOOK,
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
        user: { id: 1, name: 'Trisan' },
        comment: 'my comment!',
        supportingEvidence: null,
        userDescription: null,
      },
      {
        user: { id: 1, name: 'Trisan' },
        comment: null,
        supportingEvidence: 'my evidence',
        userDescription: 'my user description',
      },
      {
        user: { id: 1, name: 'Trisan' },
        comment: 'my comment!',
        supportingEvidence: null,
        userDescription: 'my sole user description',
      },
    ],
  },
  {
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
        user: { id: 1, name: 'Trisan' },
        comment: 'my comment!',
        supportingEvidence: null,
        userDescription: null,
      },
      {
        user: { id: 1, name: 'Trisan' },
        comment: null,
        supportingEvidence: 'my evidence',
        userDescription: 'my user description',
      },
      {
        user: { id: 1, name: 'Trisan' },
        comment: 'my comment!',
        supportingEvidence: null,
        userDescription: 'my sole user description',
      },
    ],
  },
];

const categoryTypes = [
  { label: 'Health & Medicine', value: 'Health & Medicine' },
  { label: 'Politics & Government', value: 'Politics & Government' },
  { label: 'Science & Technology', value: 'Science & Technology' },
  { label: 'Environment & Climate', value: 'Environment & Climate' },
  { label: 'Finance & Economy', value: 'Finance & Economy' },
];

export default function ListingPage() {
  const [searchString, setSearchString] = useState('');
  const [selectedCategory, setSelectedCategory] = useState({
    label: '',
    value: '',
  });
  function handleSearch(query: string) {
    setSearchString(query);
  }
  function handleSelectCategory(option: { label: string; value: string }) {
    setSelectedCategory(option);
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.title}>Browse Suspicious Claim</div>
        <div className={styles.searchSection}>
          <Searchbar text={searchString} onInput={handleSearch} />
          <CategoryFilter
            data={categoryTypes}
            selectedOption={selectedCategory}
            onInput={handleSelectCategory}
            placeholder='Select category'
          />
        </div>
        <span className={styles.sectionTitle}>Trending Topics</span>
        <div className={styles.trendSection}>
          {trendingTopicData.map((topic, i) => (
            <TrendingTopicCom
              key={`trending-topic-${i}`}
              imgUrl={topic.posts[0]?.imgUrl}
              susCount={topic.totalPostCount}
              title={topic.category.name}
              onClick={() =>
                handleSelectCategory({
                  label: topic.category.name,
                  value: topic.category.name,
                })
              }
            />
          ))}
        </div>
        <span className={styles.sectionTitle}>Recent Suspicious Claims</span>
        <div className={styles.susClaimSection}>
          {susClaimData.map((claim, i) => (
            <SuspiciousClaimRow
              key={`claim-${i}`}
              description={claim.aiSummary}
              imgUrl={claim.imgUrl}
              source={claim.sourceType}
              title={claim.title}
              commentCount={claim.comments.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
