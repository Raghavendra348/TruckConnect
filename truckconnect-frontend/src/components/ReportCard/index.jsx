import React from 'react';
import StatusBadge from '../StatusBadge';
import Button from '../Button';
import { formatDate } from '../../utils/formatters';
import './index.css';

const ReportCard = ({ report, onViewDetails }) => {
  if (!report) return null;

  return (
    <div className="report-card">
      <div className="report-card-header">
        <div className="report-id-group">
          <span className="report-id">Report #{report.id}</span>
          <span className="report-type-badge">{report.report_type || 'General Issue'}</span>
        </div>
        <StatusBadge status={report.status || 'under_review'} />
      </div>

      <div className="report-card-body">
        <p className="report-desc">{report.description || 'No description provided.'}</p>
        <div className="report-meta">
          <span>Submitted on: {formatDate(report.created_at)}</span>
          {report.trip_id && <span>Trip: #{report.trip_id}</span>}
        </div>
      </div>

      {onViewDetails && (
        <div className="report-card-footer">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(report)}>
            View Report Details
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportCard;
