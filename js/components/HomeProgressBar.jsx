// HomeProgressBar.jsx
// A simple React component for the Home progress bar section

/**
 * HomeProgressBar - Presentational component
 * Props:
 *   progress: number (0-100)
 *   endDate: string
 *   remainingDays: number
 *   onClick: function
 */
function HomeProgressBar({ progress, endDate, remainingDays, onClick }) {
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label htmlFor="daysProgress" className="form-label mb-0">Overall</label>
        <span className="text-end"><span id="homeEndDate">{endDate}</span></span>
      </div>
      <div className="progress bg-secondary rounded-pill" style={{height: '30px'}}>
        <div
          id="daysProgress"
          className="progress-bar bg-info text-dark progress-bar-striped progress-bar-animated rounded-pill d-flex justify-content-center align-items-center"
          role="progressbar"
          style={{width: `${progress}%`, minWidth: '40px', cursor: 'pointer'}}
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
          onClick={onClick}
        >
          {remainingDays} day{remainingDays === 1 ? '' : 's'} left
        </div>
      </div>
    </div>
  );
}

