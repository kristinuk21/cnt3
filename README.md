# Progress Tracker

A web-based progress tracking application for managing work hours, breaks, and daily progress.

## Features

- Track daily work progress
- Early start support
- Break management
- Daily and overall progress visualization
- Activity logging

## Project Structure

```
cnt3/
├── assets/             # External libraries and dependencies
├── css/               # Custom CSS styles
├── js/                # JavaScript source code
│   ├── components/    # React components
│   ├── controllers/   # Application controllers
│   └── services/      # Core services
└── index.html         # Main application entry point
```

## Core Components

### Controllers
- **ApplicationController**: Main application coordinator
- **ButtonController**: Handles button interactions
- **ModalController**: Manages modal dialogs
- **ProgressController**: Handles progress calculations
- **TabController**: Manages tab interactions

### Services
- **DatabaseService**: SQLite database operations
- **DateCalculationService**: Date-related calculations
- **ProgressCalculationService**: Progress tracking logic
- **UIService**: UI updates and rendering
- **NotificationService**: User notifications
- **EventService**: Event handling
- **UtilsService**: Utility functions

### UI Components
- **HomeProgressBar**: Overall progress visualization
- **TodayProgressBar**: Daily progress visualization

## Getting Started

1. Clone the repository
2. Open index.html in a modern web browser
3. Start tracking your progress!

## Features

### Early Start
- Start your workday before the default 10:00 AM start time
- System adjusts daily calculations accordingly

### Break Management
- Track break durations
- Start and end breaks
- View break history

### Progress Tracking
- Visual progress bars
- Remaining time calculations
- Daily and overall period progress

### Activity Logging
- Track all actions and events
- View detailed activity history
- Reset logs as needed