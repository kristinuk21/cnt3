# Progress Tracker

A web-based application for tracking daily and overall progress with break management functionality.

## Project Structure

```
progressTracker/
├── index.html                      # Main HTML file
├── assets/                         # Third-party assets and libraries
│   ├── babel.min.js               # Babel transpiler
│   ├── bootstrap.bundle.min.js    # Bootstrap framework
│   ├── bootstrap.min.css          # Bootstrap styles
│   ├── react.development.js       # React library
│   ├── react-dom.development.js   # React DOM
│   ├── sql-wasm.js               # SQLite WebAssembly
│   └── sql-wasm.wasm             # SQLite WebAssembly binary
├── css/
│   └── custom.css                 # Custom application styles
└── js/
    ├── constants.js               # Application constants and enums
    ├── config.js                  # Configuration values
    ├── main.js                    # Application entry point
    ├── progressBarHelpers.js      # React progress bar helpers
    ├── components/                # React components
    │   ├── HomeProgressBar.jsx    # Overall progress component
    │   └── TodayProgressBar.jsx   # Daily progress component
    ├── controllers/               # MVC Controllers
    │   ├── ApplicationController.js   # Main application controller
    │   ├── ButtonController.js       # Button interaction handler
    │   ├── ModalController.js        # Modal management
    │   ├── ProgressController.js     # Progress bar interactions
    │   └── TabController.js          # Tab navigation
    └── services/                  # Business logic services
        ├── DatabaseService.js         # SQLite database operations
        ├── DateCalculationService.js  # Date and time calculations
        ├── EventService.js            # Event handling
        ├── NotificationService.js     # Toast notifications
        ├── ProgressCalculationService.js # Progress calculations
        ├── UIService.js               # UI rendering and updates
        └── UtilsService.js            # Common utilities
```

## Architecture

The application follows **SOLID principles** and **MVC pattern**:

### Services (Business Logic)
- **DatabaseService**: Manages SQLite database operations
- **DateCalculationService**: Handles date/time calculations 
- **ProgressCalculationService**: Centralizes progress calculations (eliminates duplication)
- **NotificationService**: Manages user notifications
- **UIService**: Handles DOM updates and rendering
- **EventService**: Manages event listeners
- **UtilsService**: Common utility functions

### Controllers (Application Logic)
- **ApplicationController**: Main orchestration and dependency injection
- **ProgressController**: Handles progress bar interactions
- **TabController**: Manages tab navigation
- **ButtonController**: Handles button clicks
- **ModalController**: Manages modal dialogs

### Components (Presentation)
- **HomeProgressBar**: React component for overall progress
- **TodayProgressBar**: React component for daily progress

## Key Features

### SOLID Principles Applied

1. **Single Responsibility Principle (SRP)**
   - Each service has one clear responsibility
   - Controllers handle specific UI interactions
   - Components are purely presentational

2. **Open/Closed Principle (OCP)**
   - Services can be extended without modification
   - New notification types can be added easily
   - Progress calculations are extensible

3. **Liskov Substitution Principle (LSP)**
   - Services implement consistent interfaces
   - Components accept well-defined props

4. **Interface Segregation Principle (ISP)**
   - Services expose only necessary methods
   - Dependencies are injected rather than hard-coded

5. **Dependency Inversion Principle (DIP)**
   - High-level modules depend on abstractions
   - ApplicationController orchestrates dependencies
   - Services are loosely coupled

### DRY Principles Applied

- **Centralized Configuration**: All constants in `config.js` and `constants.js`
- **Unified Progress Calculations**: `ProgressCalculationService` eliminates duplication
- **Reusable Utilities**: Common functions in `UtilsService`
- **Shared Styles**: Organized CSS with utility classes
- **Consistent Notifications**: Single `NotificationService` for all alerts

### Maintainability Features

- **Clear Separation of Concerns**: Business logic, UI, and data access are separate
- **Dependency Injection**: Services are injected rather than hard-coded
- **Consistent Naming**: Clear, descriptive names throughout
- **Comprehensive Comments**: JSDoc-style documentation
- **Modular Structure**: Easy to modify individual components
- **Error Handling**: Graceful error handling throughout

## Development

### Adding New Features

1. **New Service**: Create in `js/services/` following existing patterns
2. **New Controller**: Create in `js/controllers/` for UI interactions
3. **New Component**: Create React components in `js/components/`
4. **Dependencies**: Add to ApplicationController's service initialization

### Configuration

- **Working Hours**: Modify `CONFIG.WORKING_HOURS` in `config.js`
- **UI Settings**: Update `CONFIG.UI` values
- **Messages**: Add new messages to `CONFIG.MESSAGES`

### Styling

- **Custom Styles**: Add to `css/custom.css`
- **Responsive Design**: Mobile-first approach with media queries
- **Utility Classes**: Use Bootstrap and custom utility classes

## Browser Support

- Modern browsers with ES6+ support
- WebAssembly support required for SQLite
- Local storage support required for persistence

## Dependencies

- **Bootstrap 5**: UI framework
- **React 18**: Component rendering
- **SQLite WebAssembly**: Client-side database
- **Babel**: JSX transpilation
