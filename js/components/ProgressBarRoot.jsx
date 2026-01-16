// ProgressBarRoot.jsx
// Root component for progress bar rendering

(function() {
  // Render counter to force re-renders
  let renderCount = 0;
  
  /**
   * ProgressBarRoot - Root component that handles rendering all progress bars
   */
  window.ProgressBarRoot = function ProgressBarRoot({ forceKey }) {
    return (
      <div id="progressBars" key={forceKey}>
        <HomeProgressBar onClick={() => window.app.getController('progress').handleDaysProgressClick()} />
        <TodayProgressBar onClick={() => window.app.getController('progress').handleHoursProgressClick()} />
        <TasksProgressBar onClick={() => window.applicationController.taskController.showTasksModal()} />
        {window.CountdownProgressBar && <CountdownProgressBar onClick={() => window.app.getController('modal').showCountdownModal()} />}
      </div>
    );
  };

  // Setup global render function using React 18 createRoot API
  let progressRoot = null;
  
  // Wait for all components to be available
  function waitForComponents(callback) {
    if (window.React && window.ReactDOM && window.HomeProgressBar && window.TodayProgressBar && window.TasksProgressBar && window.CountdownProgressBar) {
      callback();
    } else {
      console.log('Waiting for React components...', {
        React: !!window.React,
        ReactDOM: !!window.ReactDOM,
        HomeProgressBar: !!window.HomeProgressBar,
        TodayProgressBar: !!window.TodayProgressBar,
        TasksProgressBar: !!window.TasksProgressBar,
        CountdownProgressBar: !!window.CountdownProgressBar
      });
      setTimeout(() => waitForComponents(callback), 100);
    }
  }
  
  window.renderProgressBars = function() {
    waitForComponents(() => {
      const container = document.getElementById('progressContainer');
      if (container) {
        if (!progressRoot) {
          progressRoot = ReactDOM.createRoot(container);
        }
        renderCount++;
        progressRoot.render(<ProgressBarRoot forceKey={renderCount} />);
      }
    });
  };
})();
