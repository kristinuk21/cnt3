// ProgressBarRoot.jsx
// Root component for progress bar rendering

(function() {
  /**
   * ProgressBarRoot - Root component that handles rendering all progress bars
   */
  window.ProgressBarRoot = function ProgressBarRoot() {
    return (
      <div id="progressBars">
        <HomeProgressBar onClick={() => window.app.getController('progress').handleDaysProgressClick()} />
        <TodayProgressBar onClick={() => window.app.getController('progress').handleHoursProgressClick()} />
        <TasksProgressBar onClick={() => window.applicationController.taskController.showTasksModal()} />
      </div>
    );
  };

  // Setup global render function using React 18 createRoot API
  let progressRoot = null;
  
  window.renderProgressBars = function() {
    const container = document.getElementById('progressContainer');
    if (container) {
      if (!progressRoot) {
        progressRoot = ReactDOM.createRoot(container);
      }
      progressRoot.render(<ProgressBarRoot />);
    }
  };
})();
