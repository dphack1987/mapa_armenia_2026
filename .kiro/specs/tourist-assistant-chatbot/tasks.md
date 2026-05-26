# Implementation Plan: Turu - Tourist Assistant Chatbot

## Overview

This implementation plan breaks down the Turu chatbot into specific, actionable tasks. The chatbot will be implemented as a modular JavaScript component that integrates with the existing map application. Tasks are organized in dependency order, with testing tasks marked as optional (`*`).

## Tasks

- [ ] 1. Set up project structure and core files
  - Create `chatbot/` directory structure
  - Create `chatbot/chatbot.js` - main initialization and state management
  - Create `chatbot/interface.js` - UI components and DOM manipulation
  - Create `chatbot/data.js` - data loading and caching
  - Create `chatbot/responses.js` - response templates and generation
  - Create `chatbot/map-integration.js` - map interaction and synchronization
  - Create `chatbot/accessibility.js` - accessibility features and ARIA support
  - Create `chatbot/styles/chatbot.css` - chatbot-specific styles
  - _Requirements: 7.1, 7.2, 7.3, 10.1, 10.2, 10.3_

- [ ] 2. Implement core data layer
  - [ ] 2.1 Create data loading module (`chatbot/data.js`)
    - Implement `loadData()` function to fetch pois.json and pautas.json
    - Implement caching mechanism with lastUpdated timestamp
    - Handle network errors gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.3_
  
  - [ ] 2.2 Create data cache structure
    - Implement `dataCache` object with pois, pautas, and lastUpdated properties
    - Implement `clearCache()` function for data refresh
    - _Requirements: 9.5_

- [ ] 3. Implement chatbot character and identity
  - [ ] 3.1 Create character configuration (`chatbot/chatbot.js`)
    - Define Turu character name and role
    - Define personality traits (warm, hospitable, Quindiano pride)
    - Define visual representation (avatar icon, color scheme)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [ ] 3.2 Implement greeting responses
    - Create `greetingTemplates` array with multiple greeting options
    - Implement `getRandomGreeting()` function
    - Implement `showWelcomeMessage()` function
    - _Requirements: 1.4, 5.1_

- [ ] 4. Implement response generation system
  - [ ] 4.1 Create response templates (`chatbot/responses.js`)
    - Implement `responseTemplates` object with all response categories
    - Implement location info template with pauta support
    - Implement recommendation template with category support
    - Implement map integration template
    - Implement error handling templates
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.3_
  
  - [ ] 4.2 Implement response generation logic
    - Create `generateResponse()` function
    - Implement query parsing and intent detection
    - Implement context-aware response selection
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Implement chat interface UI components
  - [ ] 5.1 Create chat toggle button
    - Implement floating bottom-right button with Turu avatar
    - Add pulsing animation for new messages
    - Add ARIA label "Chat con Turu, asistente turístico"
    - _Requirements: 2.1, 8.1_
  
  - [ ] 5.2 Create chat window structure
    - Implement header with Turu avatar, name, and status
    - Implement messages area (scrollable)
    - Implement input area with send button
    - Add close/minimize button
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 5.3 Implement message rendering
    - Create `renderMessage()` function for user messages
    - Create `renderTuruMessage()` function for Turu responses
    - Add timestamps to messages
    - Implement message bubbles with proper styling
    - _Requirements: 2.2, 8.4_

- [ ] 6. Implement map integration
  - [ ] 6.1 Create map integration module (`chatbot/map-integration.js`)
    - Implement `highlightLocation()` function
    - Implement `centerOnLocation()` function
    - Implement `getNearbyLocations()` function
    - Implement `getLocationsInCategory()` function
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 6.2 Implement location highlighting
    - Add marker bounce animation
    - Auto-open POI popup on highlight
    - _Requirements: 6.2_

- [ ] 7. Implement accessibility features
  - [ ] 7.1 Create accessibility module (`chatbot/accessibility.js`)
    - Implement ARIA labels for all interactive elements
    - Implement keyboard navigation (Tab, Enter, Escape)
    - Implement focus management
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ] 7.2 Implement screen reader support
    - Add live region for chat updates
    - Implement proper semantic markup
    - Add role attributes to chat elements
    - _Requirements: 8.2_

- [ ] 8. Implement interaction patterns
  - [ ] 8.1 Implement conversation state management
    - Create `chatbotState` object with isOpen, isMinimized, messages, etc.
    - Implement `sendMessage()` function
    - Implement `receiveMessage()` function
    - _Requirements: 5.4, 5.5_
  
  - [ ] 8.2 Implement inactivity monitoring
    - Implement inactivity timer (5 minutes)
    - Implement check-in message after inactivity
    - Reset timer on user activity
    - _Requirements: 5.5_

- [ ] 9. Implement main chatbot initialization
  - [ ] 9.1 Create main initialization function
    - Implement `initChatbot()` function
    - Load data before initializing UI
    - Show welcome message after initialization
    - Start inactivity monitor
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10. Implement error handling
  - [ ] 10.1 Create error handling module
    - Implement `handleDataError()` function
    - Implement `handleInputError()` function
    - Implement `handleMapError()` function
    - Implement `handlePerformanceError()` function
    - _Requirements: 5.3, 9.4_

- [ ] 11. Create CSS styles
  - [ ] 11.1 Create chatbot styles (`chatbot/styles/chatbot.css`)
    - Style chat toggle button with Turu avatar
    - Style chat window with proper positioning
    - Style message bubbles (user vs Turu)
    - Style header with status indicator
    - Style input area with send button
    - Add animations for idle and new messages
    - Ensure sufficient color contrast (WCAG)
    - _Requirements: 8.3, 8.4_

- [ ] 12. Integration and testing
  - [ ] 12.1 Integrate with existing map initialization
    - Call `initChatbot()` after map initialization
    - Ensure no conflicts with existing map functionality
    - _Requirements: 7.4, 7.5_
  
  - [ ] 12.2 Test data synchronization
    - Verify chatbot uses same data as map
    - Test data updates are reflected in chatbot
    - _Requirements: 3.5, 10.1, 10.2_

- [ ]* 13. Write property tests for correctness properties
  - [ ]* 13.1 Write property test for Character Identity Consistency
    - **Property 1: Character Identity Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.5**
    - Test that all responses maintain consistent identity
    - Generate random conversation paths and verify identity consistency
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ]* 13.2 Write property test for Data Source Synchronization
    - **Property 2: Data Source Synchronization**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Test that chatbot data matches map data
    - Generate random POI/pauta entries and verify chatbot responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 13.3 Write property test for Location Information Completeness
    - **Property 3: Location Information Completeness**
    - **Validates: Requirements 4.1, 4.3**
    - Test that all location queries return complete information
    - Generate random location queries and verify response completeness
    - _Requirements: 4.1, 4.3_
  
  - [ ]* 13.4 Write property test for Accessibility Keyboard Navigation
    - **Property 5: Accessibility Keyboard Navigation**
    - **Validates: Requirements 8.1**
    - Test that all interactive elements are keyboard accessible
    - Generate random keyboard interaction sequences
    - _Requirements: 8.1_
  
  - [ ]* 13.5 Write property test for Error Handling Gracefulness
    - **Property 7: Error Handling Gracefulness**
    - **Validates: Requirements 5.3**
    - Test that all error conditions are handled gracefully
    - Generate random error scenarios and verify error responses
    - _Requirements: 5.3_

- [ ]* 14. Write unit tests
  - [ ]* 14.1 Write unit tests for response templates
    - Test that all response templates are properly formatted
    - Test that templates handle edge cases (null values, empty strings)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 14.2 Write unit tests for data loading
    - Test that data loads correctly from JSON files
    - Test error handling for network failures
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.3_
  
  - [ ]* 14.3 Write unit tests for message processing
    - Test that messages are processed correctly
    - Test that responses are generated correctly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 14.4 Write unit tests for map integration
    - Test that map integration functions work correctly
    - Test error handling for map operations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 15. Write integration tests
  - [ ]* 15.1 Write end-to-end chat flow tests
    - Test complete chat conversations
    - Test various user scenarios
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 15.2 Write map integration tests
    - Test chatbot-map interactions
    - Test location highlighting and centering
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 15.3 Write data synchronization tests
    - Test that data updates are reflected in chatbot
    - Test caching behavior
    - _Requirements: 3.5, 10.1, 10.2_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 0,
      "name": "Foundation",
      "tasks": ["1"]
    },
    {
      "wave": 1,
      "name": "Core Data",
      "tasks": ["2.1", "2.2"]
    },
    {
      "wave": 2,
      "name": "Character & Identity",
      "tasks": ["3.1", "3.2"]
    },
    {
      "wave": 3,
      "name": "Response System",
      "tasks": ["4.1", "4.2"]
    },
    {
      "wave": 4,
      "name": "Interface",
      "tasks": ["5.1", "5.2", "5.3"]
    },
    {
      "wave": 5,
      "name": "Map Integration",
      "tasks": ["6.1", "6.2"]
    },
    {
      "wave": 6,
      "name": "Accessibility",
      "tasks": ["7.1", "7.2"]
    },
    {
      "wave": 7,
      "name": "Interactions",
      "tasks": ["8.1", "8.2"]
    },
    {
      "wave": 8,
      "name": "Main Init",
      "tasks": ["9"]
    },
    {
      "wave": 9,
      "name": "Error Handling",
      "tasks": ["10"]
    },
    {
      "wave": 10,
      "name": "Styling",
      "tasks": ["11"]
    },
    {
      "wave": 11,
      "name": "Integration",
      "tasks": ["12.1", "12.2"]
    },
    {
      "wave": 12,
      "name": "Testing - Property",
      "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5"]
    },
    {
      "wave": 13,
      "name": "Testing - Unit",
      "tasks": ["14.1", "14.2", "14.3", "14.4"]
    },
    {
      "wave": 14,
      "name": "Testing - Integration",
      "tasks": ["15.1", "15.2", "15.3"]
    },
    {
      "wave": 15,
      "name": "Final",
      "tasks": ["16"]
    }
  ],
  "dependencies": {
    "2.1": ["1"],
    "2.2": ["1"],
    "3.1": ["1"],
    "3.2": ["1"],
    "4.1": ["3.1", "3.2"],
    "4.2": ["3.1", "3.2"],
    "5.1": ["1"],
    "5.2": ["1"],
    "5.3": ["3.1", "3.2", "4.1", "4.2"],
    "6.1": ["1", "2.1", "2.2"],
    "6.2": ["1", "2.1", "2.2"],
    "7.1": ["5.1", "5.2", "5.3"],
    "7.2": ["5.1", "5.2", "5.3"],
    "8.1": ["4.1", "4.2", "5.1", "5.2", "5.3"],
    "8.2": ["4.1", "4.2", "5.1", "5.2", "5.3"],
    "9": ["2.1", "2.2", "3.1", "3.2", "4.1", "4.2", "5.1", "5.2", "5.3", "6.1", "6.2", "7.1", "7.2", "8.1", "8.2"],
    "10": ["4.1", "4.2", "6.1", "6.2", "8.1", "8.2"],
    "11": ["5.1", "5.2", "5.3", "7.1", "7.2"],
    "12.1": ["9", "10", "11"],
    "12.2": ["9", "10", "11"],
    "13.1": ["4.1", "4.2", "5.1", "5.2", "5.3", "6.1", "6.2", "7.1", "7.2", "10"],
    "13.2": ["4.1", "4.2", "5.1", "5.2", "5.3", "6.1", "6.2", "7.1", "7.2", "10"],
    "13.3": ["4.1", "4.2", "5.1", "5.2", "5.3", "6.1", "6.2", "7.1", "7.2", "10"],
    "13.4": ["4.1", "4.2", "5.1", "5.2", "5.3", "6.1", "6.2", "7.1", "7.2", "10"],
    "13.5": ["4.1", "4.2", "5.1", "5.2", "5.3", "6.1", "6.2", "7.1", "7.2", "10"],
    "14.1": ["2.1", "2.2", "4.1", "4.2", "6.1", "6.2", "10"],
    "14.2": ["2.1", "2.2", "4.1", "4.2", "6.1", "6.2", "10"],
    "14.3": ["2.1", "2.2", "4.1", "4.2", "6.1", "6.2", "10"],
    "14.4": ["2.1", "2.2", "4.1", "4.2", "6.1", "6.2", "10"],
    "15.1": ["12.1", "12.2", "13.1", "13.2", "13.3", "13.4", "13.5", "14.1", "14.2", "14.3", "14.4"],
    "15.2": ["12.1", "12.2", "13.1", "13.2", "13.3", "13.4", "13.5", "14.1", "14.2", "14.3", "14.4"],
    "15.3": ["12.1", "12.2", "13.1", "13.2", "13.3", "13.4", "13.5", "14.1", "14.2", "14.3", "14.4"],
    "16": ["12.1", "12.2", "13.1", "13.2", "13.3", "13.4", "13.5", "14.1", "14.2", "14.3", "14.4", "15.1", "15.2", "15.3"]
  }
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The chatbot will be implemented using vanilla JavaScript (ES6+) with no external dependencies beyond Leaflet
- All code will follow the existing code style and patterns in `js/map.js`