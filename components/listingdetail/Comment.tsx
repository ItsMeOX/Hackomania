import styles from './comment.module.css';

export default function Comment({
  username,
  comment,
  userDesc,
  supportEvidence,
}: {
  username: string;
  comment: string;
  userDesc: string;
  supportEvidence: string;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.userSection}>
        <div className={styles.profilePic}>{username[0]}</div>
        <span className={styles.username}>{username}</span>
        <span className={styles.time}>1 hour ago</span>
      </div>
      <div className={styles.commentSection}>
        <div className={styles.indent} />
        <div className={styles.comments}>
          {comment && (
            <div className={styles.row}>
              <span className={styles.label}>Comment:</span>
              <span className={styles.comment}>{comment}</span>
            </div>
          )}

          {userDesc && (
            <div className={styles.row}>
              <span className={styles.label}>User Description:</span>
              <span className={styles.comment}>{userDesc}</span>
            </div>
          )}

          {supportEvidence && (
            <div className={styles.row}>
              <span className={styles.label}>Supporting Evidence:</span>
              <span className={styles.comment}>{supportEvidence}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
