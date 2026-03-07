/**
 * Comment content can be either:
 * - A plain string (regular comment)
 * - A JSON string of ReportCommentContent (when the comment is created from a user report)
 */
export type ReportCommentContent = {
  type: "report";
  headline: string;
  reportDescription: string;
  supportingEvidence: string | null;
};

export function buildReportCommentContent(payload: {
  headline: string;
  reportDescription: string;
  supportingEvidence: string | null;
}): string {
  const content: ReportCommentContent = {
    type: "report",
    headline: payload.headline,
    reportDescription: payload.reportDescription,
    supportingEvidence: payload.supportingEvidence,
  };
  return JSON.stringify(content);
}
