// HomeProgressBar.jsx
// A simple React component for the Home progress bar section

(function() {
  /**
   * HomeProgressBar - Presentational component
   * Props:
   *   onClick: function - Click handler for the progress bar
   */
  window.HomeProgressBar = function HomeProgressBar({ onClick }) {
    // Get data from the global store
    const data = window.getProgressData()?.home || { progress: 0, endDate: '', remainingDays: 0 };
    const { progress, endDate, remainingDays } = data;
    
    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label htmlFor="daysProgress" className="form-label mb-0">Overall</label>
          <span className="text-end"><span id="homeEndDate">{endDate}</span></span>
        </div>
        <div className="progress bg-secondary rounded-pill position-relative" style={{height: '30px'}}>
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
          </div>
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
            {remainingDays} day{remainingDays === 1 ? '' : 's'} left
          </span>
        </div>
      </div>
    );
}
})();
