// TodayProgressBar.jsx
// React component for the Today progress bar section


/**
 * TodayProgressBar - Presentational component
 * Props:
 *   progress: number (0-100)
 *   remainingHours: number
 *   remainingMinutes: number
 *   endTime: string
 *   isAfterHours: boolean
 *   isBeforeHours: boolean
 *   onClick: function
 */
function TodayProgressBar({ progress, remainingHours, remainingMinutes, endTime, isAfterHours, isBeforeHours, onClick }) {
  let displayText = `${remainingHours}h ${remainingMinutes}m left`;
  let barClass = "progress-bar bg-success text-dark progress-bar-striped progress-bar-animated rounded-pill d-flex align-items-center";
  
  if (isAfterHours) {
    displayText = "Day completed";
    barClass = "progress-bar bg-info text-dark rounded-pill d-flex align-items-center";
  } else if (isBeforeHours) {
    displayText = `${remainingHours}h ${remainingMinutes}m until start`;
    barClass = "progress-bar bg-warning text-dark rounded-pill d-flex align-items-center";
  }

  return (
    <div className="mb-4" onClick={onClick}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label htmlFor="hoursProgress" className="form-label mb-0">Today</label>
        <span className="text-end"><span id="homeEndTime">{endTime}</span></span>
      </div>
      <div className="progress bg-secondary rounded-pill position-relative" style={{height: '30px'}}>
        <div
          id="hoursProgress"
          className={barClass}
          role="progressbar"
          style={{width: `${progress}%`, minWidth: '40px', cursor: 'pointer'}}
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: '#212529',
            fontWeight: 500
          }}
        >
         {displayText}
        </span>
      </div>
    </div>
  );
}

