// CountdownProgressBar.jsx
// React component for a countdown to a user-provided target date

(function() {
  /**
   * CountdownProgressBar - Presentational component
   * Props:
   *   onClick: function - Click handler for the progress bar
   */
  window.CountdownProgressBar = function CountdownProgressBar({ onClick }) {
    // Get data directly from services to avoid caching issues
    const app = window.applicationController || window.app;
    let data = { 
      daysRemaining: 0, 
      targetDate: null,
      targetDateFormatted: '',
      label: 'Countdown',
      progress: 0,
      hasTarget: false
    };
    
    if (app?.services?.progressCalculation) {
      data = app.services.progressCalculation.getCountdownProgressData();
    }
    
    const { daysRemaining, targetDateFormatted, label, progress, hasTarget } = data;

    let displayText = hasTarget 
      ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`
      : 'Click to set target date';
    
    let barClass = "progress-bar bg-warning text-dark progress-bar-striped progress-bar-animated rounded-pill d-flex align-items-center";
    
    if (!hasTarget) {
      barClass = "progress-bar bg-secondary text-light rounded-pill d-flex align-items-center";
    } else if (daysRemaining <= 0) {
      displayText = "Target date reached!";
      barClass = "progress-bar bg-success text-dark rounded-pill d-flex align-items-center";
    } else if (daysRemaining <= 7) {
      barClass = "progress-bar bg-danger text-light progress-bar-striped progress-bar-animated rounded-pill d-flex align-items-center";
    }

    return (
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label htmlFor="countdownProgress" className="form-label mb-0">{label || 'Countdown'}</label>
          <span className="text-end">{hasTarget ? targetDateFormatted : 'Not set'}</span>
        </div>
        <div className="progress bg-secondary rounded-pill position-relative" style={{height: '30px', cursor: 'pointer'}} onClick={onClick}>
          <div
            id="countdownProgress"
            className={barClass}
            role="progressbar"
            style={{width: `${hasTarget ? progress : 100}%`, minWidth: '40px'}}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
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
              color: hasTarget ? '#212529' : '#e9ecef',
              fontWeight: 500
            }}
          >
            {displayText}
          </span>
        </div>
      </div>
    );
  };
})();
