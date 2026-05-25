# Implementation Plan: Tourist-Commerce Experience Improvements

## Overview

This implementation plan breaks down the 10 tourist-commerce experience improvements into specific, actionable tasks. The plan follows the priority order established in the design document, with high-priority features implemented first.

**Implementation Approach:**
- Phase 1: Core enhancements (service icons, status, QR codes)
- Phase 2: Engagement features (ratings, special offers, chat)
- Phase 3: Advanced features (routes, notifications, heat map)
- Each feature includes implementation tasks and optional testing tasks
- Testing tasks marked with `*` can be skipped for MVP

---

## Tasks

### Phase 1: Core Enhancements (High Priority)

#### 1. Enhanced Pauta Ficha with Service Icons

- [ ] 1.1 Create service icons data structure and mapping
  - Define service icon mapping object with common services
  - Create generic icon fallback for unmapped services
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.2 Implement ServiceIcons UI component
  - Create component to render service icons with tooltips
  - Add accessibility attributes (alt text, aria-labels)
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 1.3 Integrate service icons into Pauta Ficha
  - Add service icons section to services list
  - Ensure icons appear next to service text
  - _Requirements: 1.1, 1.2_

- [ ]* 1.4 Write property test for service icons display
  - **Property 1: Service Icons Display Consistency**
  - **Validates: Requirements 1.1, 1.2, 1.4**
  - Test that all services have icons and tooltips

- [ ]* 1.5 Write property test for service icon accessibility
  - **Property 2: Service Icon Accessibility**
  - **Validates: Requirements 1.5**
  - Test that all icons have appropriate alt text

- [ ]* 1.6 Write property test for generic icon fallback
  - **Property 3: Generic Icon Fallback**
  - **Validates: Requirements 1.3**
  - Test that missing icons use generic fallback

#### 2. Real-Time Open/Closed Status

- [ ] 2.1 Create operating hours data structure
  - Extend existing `horario` field with structured data
  - Define TimeRange and OperatingHours interfaces
  - _Requirements: 9.2_

- [ ] 2.2 Implement StatusCalculator service
  - Create service to calculate open/closed status
  - Implement next opening time calculation
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 2.3 Create status display UI component
  - Implement visual indicators (color, icon)
  - Add "Hours not specified" fallback
  - _Requirements: 9.1, 9.3, 9.5_

- [ ] 2.4 Integrate status into commerce displays
  - Add status badge to Pauta Ficha
  - Add status to search results and listings
  - _Requirements: 9.1_

- [ ]* 2.5 Write property test for status calculation
  - **Property 20: Open/Closed Status Accuracy**
  - **Validates: Requirements 9.1, 9.2**
  - Test status calculation for various time scenarios

- [ ]* 2.6 Write property test for missing hours handling
  - **Property 21: Status Display for Missing Hours**
  - **Validates: Requirements 9.3**
  - Test fallback behavior for missing hours

#### 3. Individual QR Codes per Commerce

- [ ] 3.1 Integrate QR code generation library
  - Add qrcode.js or similar library
  - Configure for high-contrast generation
  - _Requirements: 7.4_

- [ ] 3.2 Create QRCodeGenerator service
  - Implement QR code generation for commerce URLs
  - Add error handling for generation failures
  - _Requirements: 7.1, 7.2_

- [ ] 3.3 Implement QR code display UI
  - Add QR code to Pauta Ficha
  - Include commerce name and description context
  - _Requirements: 7.1, 7.5_

- [ ] 3.4 Implement QR code scanning behavior
  - Create scanner component
  - Link to commerce information page on scan
  - _Requirements: 7.3_

- [ ]* 3.5 Write property test for QR code encoding
  - **Property 16: QR Code Encoding Accuracy**
  - **Validates: Requirements 7.2**
  - Test that QR codes encode correct URLs

#### 4. Service Type Sub-filters

- [ ] 4.1 Extend commerce data structure with service types
  - Add `serviceTypes` array to pautas.json
  - Define standard service type categories
  - _Requirements: 2.2_

- [ ] 4.2 Implement ServiceTypeFilters UI component
  - Create sub-filter options for service types
  - Implement filter logic for commerce selection
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4.3 Integrate sub-filters with category filters
  - Enable combination of category and service type filters
  - Handle default state when no sub-filters selected
  - _Requirements: 2.5, 2.6_

- [ ] 4.4 Implement empty state handling
  - Display "no results found" message when no matches
  - _Requirements: 2.4_

- [ ]* 4.5 Write property test for filter combination logic
  - **Property 5: Filter Combination Logic**
  - **Validates: Requirements 2.3, 2.5, 2.6**
  - Test filtering with various filter combinations

- [ ]* 4.6 Write property test for empty state handling
  - **Property 6: Empty State Handling**
  - **Validates: Requirements 2.4**
  - Test empty state when no matches found

---

### Phase 2: Engagement Features (Medium Priority)

#### 5. Reviews and Ratings System

- [ ] 5.1 Create ratings data structure
  - Create new `ratings.json` file
  - Define Rating interface with anonymous user ID
  - _Requirements: 3.5_

- [ ] 5.2 Implement RatingsDisplay UI component
  - Create star rating display (1-5 stars)
  - Add review count display
  - _Requirements: 3.1, 3.2, 3.6_

- [ ] 5.3 Implement rating input UI
  - Create star selector for new ratings
  - Add modification option for existing ratings
  - _Requirements: 3.3, 3.4_

- [ ] 5.4 Implement rating storage service
  - Create service to save ratings
  - Ensure anonymous storage (commerce ID only)
  - _Requirements: 3.5_

- [ ] 5.5 Calculate and display average ratings
  - Implement average calculation logic
  - Handle edge case of no ratings
  - _Requirements: 3.1, 3.2_

- [ ]* 5.6 Write property test for rating display accuracy
  - **Property 7: Rating Display Accuracy**
  - **Validates: Requirements 3.1, 3.2**
  - Test average calculation and display

- [ ]* 5.7 Write property test for rating storage anonymity
  - **Property 8: Rating Storage Anonymity**
  - **Validates: Requirements 3.5**
  - Test that ratings are stored anonymously

#### 6. Special Offers/Promotions

- [ ] 6.1 Create special offers data structure
  - Add optional `specialOffer` object to commerce entries
  - Define SpecialOffer interface with validation fields
  - _Requirements: 4.5_

- [ ] 6.2 Implement SpecialOfferBadge UI component
  - Create prominent badge display
  - Add offer details display (discount, validity)
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 6.3 Implement offer validation logic
  - Check validity based on current date
  - Handle expired offers gracefully
  - _Requirements: 4.5_

- [ ] 6.4 Implement special offer highlighting
  - Add highlight to search results
  - Add highlight to category listings
  - _Requirements: 4.3_

- [ ]* 6.5 Write property test for special offer validation
  - **Property 9: Special Offer Validation**
  - **Validates: Requirements 4.5**
  - Test offer validity checking

- [ ]* 6.6 Write property test for special offer highlighting
  - **Property 10: Special Offer Highlighting**
  - **Validates: Requirements 4.3**
  - Test highlighting of active offers

#### 7. In-App Live Chat

- [ ] 7.1 Create chat message data structure
  - Define ChatMessage interface
  - Define ChatSession interface
  - _Requirements: 8.4_

- [ ] 7.2 Implement LiveChat UI component
  - Create chat interface with message history
  - Add real-time update display
  - _Requirements: 8.1, 8.2_

- [ ] 7.3 Implement message sending and delivery
  - Create message sending functionality
  - Add delivery confirmation and status indicators
  - _Requirements: 8.5_

- [ ] 7.4 Implement alternative contact fallback
  - Add email/phone fallback for missing chat config
  - _Requirements: 8.3_

- [ ]* 7.5 Write property test for chat connection
  - **Property 18: Live Chat Connection**
  - **Validates: Requirements 8.1, 8.2**
  - Test chat connection establishment

- [ ]* 7.6 Write property test for message delivery confirmation
  - **Property 19: Message Delivery Confirmation**
  - **Validates: Requirements 8.5**
  - Test delivery confirmation and status indicators

---

### Phase 3: Advanced Features (Lower Priority)

#### 8. Optimized Tour Routes Including Commercial Stops

- [ ] 8.1 Create route data structures
  - Define RouteStop and RouteOption interfaces
  - _Requirements: 5.1_

- [ ] 8.2 Implement RouteOptimizer service
  - Create optimization algorithm based on proximity
  - Include category relevance and user preferences
  - _Requirements: 5.1, 5.2_

- [ ] 8.3 Implement route segment metrics
  - Calculate estimated time and distance for segments
  - _Requirements: 5.3_

- [ ] 8.4 Implement route customization UI
  - Add drag-and-drop reorder for stops
  - _Requirements: 5.4_

- [ ] 8.5 Implement turn-by-turn navigation
  - Integrate with navigation API
  - Create turn-by-turn instructions display
  - _Requirements: 5.5_

- [ ]* 8.6 Write property test for route optimization
  - **Property 11: Route Optimization Accuracy**
  - **Validates: Requirements 5.1, 5.2**
  - Test route optimization with various POI combinations

- [ ]* 8.7 Write property test for route segment metrics
  - **Property 12: Route Segment Metrics**
  - **Validates: Requirements 5.3**
  - Test time and distance calculation

#### 9. Push Notifications When Near a Commerce

- [ ] 9.1 Create notification preference data structure
  - Define NotificationPreference interface
  - _Requirements: 6.3_

- [ ] 9.2 Implement NotificationService
  - Create proximity checking logic
  - Implement notification sending
  - _Requirements: 6.1, 6.2_

- [ ] 9.3 Implement notification configuration UI
  - Create settings panel for preferences
  - Add distance threshold and category selection
  - _Requirements: 6.3_

- [ ] 9.4 Implement notification display
  - Create notification card UI
  - Add action buttons (view, dismiss)
  - _Requirements: 6.5_

- [ ]* 9.5 Write property test for proximity notification
  - **Property 14: Proximity Notification Trigger**
  - **Validates: Requirements 6.2**
  - Test notification trigger at various distances

- [ ]* 9.6 Write property test for notification content
  - **Property 15: Notification Content Completeness**
  - **Validates: Requirements 6.4**
  - Test notification includes required information

#### 10. Heat Map of Tourist Traffic

- [ ] 10.1 Create traffic data structure
  - Define TrafficPoint and TrafficAggregation interfaces
  - _Requirements: 10.1_

- [ ] 10.2 Implement HeatMapLayer UI component
  - Create heat map visualization
  - Add color gradient for traffic levels
  - _Requirements: 10.1, 10.2_

- [ ] 10.3 Implement data sufficiency check
  - Check for sufficient traffic data
  - Display message when data is insufficient
  - _Requirements: 10.3_

- [ ] 10.4 Implement legend display
  - Create color scale legend
  - _Requirements: 10.4_

- [ ] 10.5 Implement time period selection
  - Add dropdown for time period selection
  - Implement data loading for different periods
  - _Requirements: 10.5_

- [ ]* 10.6 Write property test for heat map data requirements
  - **Property 23: Heat Map Data Requirements**
  - **Validates: Requirements 10.3**
  - Test data sufficiency check

- [ ]* 10.7 Write property test for heat map legend
  - **Property 24: Heat Map Legend Availability**
  - **Validates: Requirements 10.4**
  - Test legend display

---

### Integration and Data Migration Tasks

#### 11. Data Migration and Integration

- [ ] 11.1 Extend pautas.json with new fields
  - Add serviceTypes array to existing commerce entries
  - Add specialOffer object where applicable
  - Add operatingHours structured data
  - _Requirements: Technical Considerations_

- [ ] 11.2 Create ratings.json file
  - Initialize empty ratings structure
  - Set up data loading in map.js
  - _Requirements: Technical Considerations_

- [ ] 11.3 Create specialOffers.json file
  - Initialize empty special offers structure
  - Set up data loading in map.js
  - _Requirements: Technical Considerations_

- [ ] 11.4 Create trafficPoints.json file
  - Initialize empty traffic data structure
  - Set up data loading in map.js
  - _Requirements: Technical Considerations_

- [ ] 11.5 Update map.js to load new data files
  - Add data loading for ratings, special offers, traffic
  - Merge new data with existing commerce data
  - _Requirements: Technical Considerations_

- [ ] 11.6 Update CSS for new UI components
  - Add styles for service icons
  - Add styles for status indicators
  - Add styles for QR codes
  - Add styles for ratings display
  - Add styles for special offer badges
  - Add styles for chat interface
  - Add styles for heat map layer
  - _Requirements: Technical Considerations_

#### 12. Testing and Quality Assurance

- [ ] 12.1 Set up testing framework
  - Configure Jest for unit testing
  - Configure fast-check for property-based testing
  - Configure Cypress for integration testing
  - _Requirements: Testing Strategy_

- [ ] 12.2 Write unit tests for all services
  - Test StatusCalculator service
  - Test RatingService service
  - Test NotificationService service
  - Test RouteOptimizer service
  - _Requirements: Testing Strategy_

- [ ] 12.3 Write integration tests for user flows
  - Test Pauta Ficha with service icons
  - Test filtering with service types
  - Test rating submission flow
  - Test special offer display
  - Test chat flow
  - Test route optimization
  - Test notification flow
  - Test QR code scanning
  - Test heat map display
  - _Requirements: Testing Strategy_

- [ ] 12.4 Performance testing
  - Verify load times under 2 seconds
  - Test with large datasets
  - Test offline functionality
  - _Requirements: Technical Considerations_

#### 13. Documentation

- [ ] 13.1 Update README.md with new features
  - Document new features and capabilities
  - Add screenshots of new UI components
  - _Requirements: Documentation_

- [ ] 13.2 Create API documentation
  - Document new data structures
  - Document new service interfaces
  - _Requirements: Documentation_

- [ ] 13.3 Create user guide
  - Document how to use new features
  - Include screenshots and examples
  - _Requirements: Documentation_

- [ ] 13.4 Create developer documentation
  - Document code structure and architecture
  - Document new components and services
  - _Requirements: Documentation_

---

### Checkpoints

- [ ] 14. Checkpoint 1 - Phase 1 Complete
  - Ensure all Phase 1 features are implemented and tested
  - Verify backward compatibility with existing functionality
  - Ask the user if questions arise.

- [ ] 15. Checkpoint 2 - Phase 2 Complete
  - Ensure all Phase 2 features are implemented and tested
  - Verify ratings and chat features work correctly
  - Ask the user if questions arise.

- [ ] 16. Checkpoint 3 - All Features Complete
  - Ensure all features are implemented and tested
  - Verify performance requirements are met
  - Verify all documentation is complete
  - Ask the user if questions arise.

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1.1", "1.2", "2.1", "3.1", "4.1", "5.1", "6.1", "7.1", "8.1", "9.1", "10.1", "11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "12.1"]
    },
    {
      "wave": 2,
      "tasks": ["1.3", "2.2", "2.3", "3.2", "3.3", "4.2", "4.3", "4.4", "5.2", "5.3", "5.4", "5.5", "6.2", "6.3", "6.4", "7.2", "7.3", "7.4", "8.2", "8.3", "8.4", "8.5", "9.2", "9.3", "9.4", "10.2", "10.3", "10.4", "10.5", "12.2", "12.3"]
    },
    {
      "wave": 3,
      "tasks": ["1.4", "1.5", "1.6", "2.4", "2.5", "2.6", "3.4", "3.5", "4.5", "4.6", "5.6", "5.7", "6.5", "6.6", "7.5", "7.6", "8.6", "8.7", "9.5", "9.6", "10.6", "10.7", "12.4", "13.1", "13.2", "13.3", "13.4"]
    },
    {
      "wave": 4,
      "tasks": ["14", "15", "16"]
    }
  ]
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- All features must maintain backward compatibility with existing functionality
- Performance requirements (under 2-second load times) must be verified
- Accessibility requirements must be met for all UI components