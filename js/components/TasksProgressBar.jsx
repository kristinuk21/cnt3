/**
 * TasksProgressBar Component
 * Displays a progress bar for task completion with interactive functionality
 */
function TasksProgressBar({ onClick }) {
    // Get data from the global store
    const data = window.getProgressData()?.tasks || { total: 0, completed: 0, remaining: 0, percentage: 0 };
    const { total, completed, remaining, percentage } = data;

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    let displayText = `${completed}/${total} tasks`;
    let barClass = "progress-bar bg-info text-dark progress-bar-striped progress-bar-animated rounded-pill d-flex align-items-center";
    
    if (percentage === 100 && total > 0) {
        displayText = "All tasks completed";
        barClass = "progress-bar bg-success text-dark rounded-pill d-flex align-items-center";
    }

    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="tasksProgress" className="form-label mb-0">Tasks</label>
                <span className="text-end">{total}</span>
            </div>
            <div className="progress bg-secondary rounded-pill position-relative" style={{height: '30px', cursor: 'pointer'}} onClick={handleClick}>
                <div
                    id="tasksProgress"
                    className={barClass}
                    role="progressbar"
                    style={{width: `${percentage}%`, minWidth: '40px'}}
                    aria-valuenow={percentage}
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