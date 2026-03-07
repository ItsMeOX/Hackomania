'use client';

import TextInput from '@/components/report/TextInput';
import styles from './report.module.css';
import { useState } from 'react';
import MultipleChoiceInput from '@/components/report/MultipleChoiceInput';
import { ClaimSource } from '@/types/types';
import AreaTextInput from '@/components/report/AreaTextInput';

export default function ReportPage() {
  const claimSourceOptions = Object.values(ClaimSource).map((v) => ({
    label: v,
    value: v,
  }));

  const [reportData, setReportData] = useState({
    url: '',
    title: '',
    platform: { label: '', value: '' },
    reason: '',
    evidence: '',
  });

  function handleInputURL(url: string) {
    setReportData((prev) => ({ ...prev, url }));
  }
  function handleInputTitle(title: string) {
    setReportData((prev) => ({ ...prev, title }));
  }
  function handleInputPlatform(option: { label: string; value: string }) {
    setReportData((prev) => ({ ...prev, platform: option }));
  }
  function handleInputReason(reason: string) {
    setReportData((prev) => ({ ...prev, reason }));
  }
  function handleInputEvidence(evidence: string) {
    setReportData((prev) => ({ ...prev, evidence }));
  }

  function handleSubmit() {
    // TODO
  }

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <span className={styles.title}>
          Submit Report of Suspicious Information
        </span>
        <div className={styles.form}>
          <TextInput
            title='Source URL'
            iconUrl='/link.svg'
            onInput={handleInputURL}
            placeholder='https://example.com/article...'
            required={true}
          />
          <TextInput
            title='Claim or Headline'
            iconUrl='/document.svg'
            onInput={handleInputTitle}
            placeholder='Paste or type the false claim...'
            required={true}
          />
          <MultipleChoiceInput
            title='Platform Seen On'
            data={claimSourceOptions}
            selectedOption={reportData.platform}
            onInput={handleInputPlatform}
            placeholder='Select platform source'
            required={false}
          />
          <AreaTextInput
            title='Why do you think this is false?'
            onInput={handleInputReason}
            placeholder='Paste or type the false claim...'
            required={true}
          />
          <AreaTextInput
            title='Supporting Evidence'
            onInput={handleInputEvidence}
            placeholder='Links to credible sources that contradict this claim...'
            required={true}
            minHeight='150px'
          />
          <div className={styles.submitSection}>
            <button className={styles.submitButton} onClick={handleSubmit}>
              Submit
            </button>
            <span>
              By submitting this report, you agree that the information may be
              shared publicly on our forum page.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
