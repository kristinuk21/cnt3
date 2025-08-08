// ProgressBarRoot.jsx
// Root component for progress bar rendering

(function() {
  /**
   * ProgressBarRoot - Root component that handles rendering both progress bars
   */
  window.ProgressBarRoot = function ProgressBarRoot() {
    return (
      <div id="progressBars">
        <HomeProgressBar onClick={() => window.app.getController('progress').handleDaysProgressClick()} />
        <TodayProgressBar onClick={() => window.app.getController('progress').handleHoursProgressClick()} />
      </div>
    );
  };

  // Setup global render function
  window.renderProgressBars = function() {
    const container = document.getElementById('progressContainer');
    if (container) {
      ReactDOM.render(<ProgressBarRoot />, container);
    }
  };
})();
