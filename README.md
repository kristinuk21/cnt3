# Progress Tracker# Progress Tracker



A web-based progress tracking application for managing work hours, breaks, and daily progress. Built with vanilla JavaScript, React components, and Bootstrap for a responsive, professional interface.A web-based progress tracking application for managing work hours, breaks, and daily progress.



## ✨ Features## Features



- **📈 Daily Progress Tracking**: Visual progress bars showing work completion- Track daily work progress

- **⏰ Early Start Support**: Begin work before default 10:00 AM start time- Early start support

- **☕ Break Management**: Track break durations with start/end functionality- Break management

- **📊 Progress Visualization**: Daily and overall period progress bars- Daily and overall progress visualization

- **📝 Activity Logging**: Comprehensive activity and event tracking- Activity logging

- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

- **💾 Local Storage**: SQLite database for persistent data storage## Project Structure



## 🚀 Getting Started```

cnt3/

### Prerequisites├── assets/             # External libraries and dependencies

- Modern web browser (Chrome, Firefox, Safari, Edge)├── css/               # Custom CSS styles

- Local web server (optional but recommended)├── js/                # JavaScript source code

│   ├── components/    # React components

### Installation│   ├── controllers/   # Application controllers

1. Clone the repository:│   └── services/      # Core services

   ```bash└── index.html         # Main application entry point

   git clone <repository-url>```

   cd cnt3

   ```## Core Components



2. Open `index.html` in your web browser, or serve it with a local web server:### Controllers

   ```bash- **ApplicationController**: Main application coordinator

   # Using Python- **ButtonController**: Handles button interactions

   python -m http.server 8000- **ModalController**: Manages modal dialogs

   - **ProgressController**: Handles progress calculations

   # Using Node.js (http-server)- **TabController**: Manages tab interactions

   npx http-server

   ### Services

   # Using PHP- **DatabaseService**: SQLite database operations

   php -S localhost:8000- **DateCalculationService**: Date-related calculations

   ```- **ProgressCalculationService**: Progress tracking logic

- **UIService**: UI updates and rendering

3. Navigate to `http://localhost:8000` (if using a server) or open `index.html` directly- **NotificationService**: User notifications

- **EventService**: Event handling

## 📁 Project Structure- **UtilsService**: Utility functions



```### UI Components

cnt3/- **HomeProgressBar**: Overall progress visualization

├── assets/                 # External libraries and dependencies- **TodayProgressBar**: Daily progress visualization

│   ├── bootstrap.min.css   # Bootstrap CSS framework

│   ├── bootstrap.bundle.min.js # Bootstrap JavaScript## Getting Started

│   ├── react.development.js    # React library

│   ├── react-dom.development.js # React DOM1. Clone the repository

│   ├── babel.min.js        # Babel transpiler for JSX2. Open index.html in a modern web browser

│   ├── sql-wasm.js         # SQLite WebAssembly3. Start tracking your progress!

│   └── sql-wasm.wasm       # SQLite WebAssembly binary

├── css/## Features

│   └── custom.css          # Custom styles and theme

├── js/### Early Start

│   ├── components/         # React components- Start your workday before the default 10:00 AM start time

│   │   ├── HomeProgressBar.jsx    # Overall progress component- System adjusts daily calculations accordingly

│   │   ├── TodayProgressBar.jsx   # Daily progress component

│   │   └── ProgressBarRoot.jsx    # Root progress component### Break Management

│   ├── controllers/        # MVC Controllers- Track break durations

│   │   ├── ApplicationController.js # Main app controller- Start and end breaks

│   │   ├── ButtonController.js     # Button interactions- View break history

│   │   ├── ModalController.js      # Modal management

│   │   ├── ProgressController.js   # Progress calculations### Progress Tracking

│   │   └── TabController.js        # Tab navigation- Visual progress bars

│   ├── services/           # Core business logic- Remaining time calculations

│   │   ├── DatabaseService.js      # SQLite operations- Daily and overall period progress

│   │   ├── DateCalculationService.js # Date utilities

│   │   ├── EventService.js         # Event handling### Activity Logging

│   │   ├── NotificationService.js  # User notifications- Track all actions and events

│   │   ├── ProgressCalculationService.js # Progress logic- View detailed activity history

│   │   ├── UIService.js           # UI updates- Reset logs as needed
│   │   └── UtilsService.js        # Utility functions
│   ├── config.js           # Application configuration
│   ├── constants.js        # Application constants
│   ├── main.js            # Application entry point
│   └── progressBarHelpers.js # Progress bar utilities
├── index.html             # Main application entry point
├── README.md             # This file
├── project.json          # Project metadata and documentation
└── .gitignore           # Git ignore rules
```

## 🔧 Architecture

### Design Patterns
- **MVC (Model-View-Controller)**: Clear separation of concerns
- **Service Layer**: Business logic encapsulation
- **Single Responsibility**: Each class/file has one purpose
- **Dependency Injection**: Services are injected into controllers

### Core Components

#### Controllers
- **ApplicationController**: Main application coordinator and entry point
- **ButtonController**: Handles all button interactions and states
- **ModalController**: Manages modal dialogs and their content
- **ProgressController**: Coordinates progress calculations and updates
- **TabController**: Manages tab navigation and content switching

#### Services
- **DatabaseService**: SQLite database operations and data persistence
- **DateCalculationService**: Date-related calculations and working day logic
- **ProgressCalculationService**: Progress tracking and time calculations
- **UIService**: UI updates, rendering, and DOM manipulation
- **NotificationService**: User notifications and feedback
- **EventService**: Application event handling and coordination
- **UtilsService**: Utility functions and common operations

#### UI Components (React)
- **HomeProgressBar**: Overall progress visualization with period information
- **TodayProgressBar**: Daily progress with break and time information
- **ProgressBarRoot**: Root component that orchestrates progress displays

## 🎯 Core Features

### Working Hours
- **Default Schedule**: 10:00 AM - 6:00 PM (8 hours)
- **Working Days**: Monday - Friday
- **Early Start**: Begin before 10:00 AM with automatic adjustment
- **Break Tracking**: Extends workday duration automatically

### Progress Calculation
- **Daily Progress**: Based on 8-hour workday with break adjustments
- **Period Progress**: Tracks progress between 10th and 25th of each month
- **Real-time Updates**: Progress bars update every second
- **Working Day Detection**: Automatically detects weekends and holidays

### Data Storage
- **SQLite Database**: Local browser storage using WebAssembly
- **Persistent Data**: Early starts, breaks, and logs stored locally
- **Data Reset**: Option to clear today's data or all logs

## 🔄 Usage

1. **Starting Work**
   - Application automatically tracks when you start (10:00 AM default)
   - Use "Start Early" to begin before 10:00 AM
   - Progress bars will reflect your actual start time

2. **Taking Breaks**
   - Click "Start Break" to begin a break period
   - Click "End Break" to resume work
   - Break time extends your workday accordingly

3. **Viewing Progress**
   - **Overall Progress**: Shows progress for current period (10th-25th)
   - **Today Progress**: Shows daily work progress with time remaining
   - Click progress bars to see detailed modal information

4. **Activity Logs**
   - View all actions in the "Logs" tab
   - See break history, early starts, and other activities
   - Reset logs when needed

## 🛠️ Development

### Code Quality
- Clean, documented code following SOLID principles
- Modular architecture with clear separation of concerns
- Error handling and logging throughout
- Consistent naming conventions and structure

### Browser Compatibility
- Modern browsers supporting ES6+ features
- WebAssembly support required for SQLite
- Responsive design for mobile and desktop

### Future Enhancements
- [ ] Add ESLint for code quality enforcement
- [ ] Implement unit testing with Jest or Mocha
- [ ] Consider TypeScript migration for type safety
- [ ] Add build process for production optimization
- [ ] Implement service worker for offline functionality
- [ ] Add data export/import functionality

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.