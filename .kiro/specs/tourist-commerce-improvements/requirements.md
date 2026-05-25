# Requirements Document

## Introduction

This document outlines the requirements for enhancing the connection between tourists and commercial services in the Armenia 2026 Map. The improvements aim to transform the map from a simple directory into an interactive, personalized tourism companion that helps visitors discover, engage with, and benefit from local commerce while exploring Armenia, Quindío.

The 10 improvements focus on making commercial information more accessible, actionable, and valuable to tourists, while providing businesses with better tools to connect with potential customers.

## Glossary

- **Armenia 2026 Map**: The digital tourism map of Armenia, Quindío, Colombia, featuring points of interest and commercial services
- **Tourist**: A visitor to Armenia who uses the map to explore attractions, services, and commerce
- **Commerce**: A business establishment (restaurant, shop, service provider) listed in the map with a "Pauta Ficha" profile
- **Pauta Ficha**: The detailed information page for a commercial establishment, including services, contact information, and business details
- **QR Code**: A scannable code that links to a specific commerce's information page
- **Push Notification**: A system message sent to the user's device even when the app is not actively open
- **Live Chat**: Real-time text communication between tourists and commerce representatives
- **Heat Map**: A visual representation of tourist traffic density across different areas

## Requirements

### Requirement 1: Enhanced Pauta Ficha with Service Icons

**User Story:** As a tourist, I want to see service icons in the Pauta Ficha, so that I can quickly understand what services a commerce offers without reading detailed descriptions.

#### Acceptance Criteria

1. WHEN a Pauta Ficha is opened, THE Map SHALL display service icons next to each service listed in the "Servicios" section
2. EACH service icon SHALL be clearly associated with its corresponding service text
3. WHERE a service has no appropriate icon, THE Map SHALL use a generic service icon
4. WHEN hovering over a service icon, THE Map SHALL display a tooltip with the service name
5. FOR ALL service icons, THE Map SHALL ensure they are accessible with appropriate alt text for screen readers

### Requirement 2: Sub-filters by Service Type for Commercial Category

**User Story:** As a tourist looking for specific services, I want to filter commercial establishments by service type, so that I can quickly find businesses that offer what I need.

#### Acceptance Criteria

1. WHEN the commercial category filter is selected, THE Map SHALL display sub-filter options for service types
2. THE Map SHALL provide at least the following sub-filter categories: Restaurants, Cafes, Hotels, Shopping, Services, Entertainment
3. WHERE a user selects one or more sub-filters, THE Map SHALL display only commercial establishments matching those service types
4. WHEN no commercial establishments match the selected sub-filters, THE Map SHALL display a message indicating no results were found
5. THE Map SHALL allow users to combine category filters with service type sub-filters
6. WHERE the commercial category is selected but no specific sub-filters are chosen, THE Map SHALL display all commercial establishments
7. THE Map SHALL allow users to select sub-filters even when the options are not yet visible

### Requirement 3: Reviews and Ratings System (1-5 Stars)

**User Story:** As a tourist, I want to see reviews and ratings for commercial establishments, so that I can make informed decisions based on other visitors' experiences.

#### Acceptance Criteria

1. WHEN a Pauta Ficha is opened, THE Map SHALL display the average rating (1-5 stars) if ratings exist
2. WHERE ratings exist, THE Map SHALL display the number of reviews alongside the average rating
3. WHEN a user has not rated a commerce, THE Map SHALL display a "Rate this business" option
4. WHERE a user has previously rated a commerce, THE Map SHALL display their current rating and allow modification
5. FOR ALL ratings, THE Map SHALL store them anonymously and associate them with the commerce ID only
6. WHEN displaying ratings, THE Map SHALL use a consistent 5-star visual representation

### Requirement 4: Special Offers/Promotions for Tourists

**User Story:** As a tourist, I want to see special offers and promotions for commercial establishments, so that I can take advantage of discounts and special deals during my visit.

#### Acceptance Criteria

1. WHEN a Pauta Ficha includes a special offer, THE Map SHALL display a prominent "Special Offer" badge or banner
2. THE Map SHALL display the offer details (discount percentage, specific offer, validity period) in the Pauta Ficha
3. WHERE a commerce has an active special offer, THE Map SHALL highlight it in search results and category listings
4. WHEN displaying special offers, THE Map SHALL include the expiration date or validity period
5. FOR all special offers, THE Map SHALL verify they are currently valid before displaying them

### Requirement 5: Optimized Tour Routes Including Commercial Stops

**User Story:** As a tourist planning my day, I want optimized tour routes that include commercial stops, so that I can efficiently explore and support local businesses.

#### Acceptance Criteria

1. WHEN a user selects multiple points of interest, THE Map SHALL suggest route options that include commercial stops
2. THE Map SHALL calculate route optimization based on proximity, category relevance, and user preferences
3. WHERE route optimization includes commercial stops, THE Map SHALL display estimated time and distance for each segment
4. FOR all suggested routes, THE Map SHALL allow users to customize the order of stops
5. WHEN a route is selected, THE Map SHALL provide turn-by-turn navigation instructions

### Requirement 6: Push Notifications When Near a Commerce

**User Story:** As a tourist exploring the city, I want push notifications when I'm near a commerce that matches my interests, so that I can discover opportunities without actively searching.

#### Acceptance Criteria

1. WHEN a user enables location-based notifications, THE Map SHALL monitor their proximity to commercial establishments
2. WHERE a user is within 500 meters of a commerce matching their interests, THE Map SHALL send a push notification
3. THE Map SHALL allow users to configure notification preferences (distance threshold, categories of interest)
4. WHEN sending a notification, THE Map SHALL include the commerce name, category, and a brief description
5. FOR all push notifications, THE Map SHALL provide an option to view details or dismiss without opening

### Requirement 7: Individual QR Codes per Commerce

**User Story:** As a tourist, I want to scan individual QR codes for commercial establishments, so that I can quickly access their information and contact them.

#### Acceptance Criteria

1. WHEN a user views a Pauta Ficha, THE Map SHALL display a unique QR code for that commerce
2. THE QR code SHALL encode a URL linking directly to the commerce's information page
3. WHEN the QR code is scanned, THE Map SHALL open the commerce's information page in the app or browser
4. FOR all QR codes, THE Map SHALL ensure they are high-contrast and scannable in various lighting conditions
5. WHEN displaying QR codes, THE Map SHALL include the commerce name and a brief description for context

### Requirement 8: In-App Live Chat

**User Story:** As a tourist, I want to chat directly with commercial establishments through the app, so that I can ask questions and get immediate responses.

#### Acceptance Criteria

1. WHEN a user opens the live chat feature, THE Map SHALL establish a connection to the commerce's messaging system
2. THE Map SHALL display a chat interface with message history and real-time updates
3. WHERE a commerce has not configured live chat, THE Map SHALL provide an alternative contact method (email, phone)
4. FOR all chat messages, THE Map SHALL store them temporarily and associate them with the correct commerce
5. WHEN a message is sent, THE Map SHALL provide delivery confirmation and status indicators

### Requirement 9: Real-Time Open/Closed Status

**User Story:** As a tourist, I want to know if commercial establishments are currently open or closed, so that I can plan my visits efficiently.

#### Acceptance Criteria

1. WHEN displaying commerce information, THE Map SHALL show the current open/closed status
2. THE Map SHALL calculate status based on the current time and the commerce's operating hours
3. WHERE operating hours are not available, THE Map SHALL display "Hours not specified" instead of guessing
4. WHEN a commerce is closed, THE Map SHALL display the next opening time if available
5. FOR all status displays, THE Map SHALL provide a visual indicator (color, icon) for quick recognition

### Requirement 10: Heat Map of Tourist Traffic

**User Story:** As a tourist, I want to see a heat map of tourist traffic, so that I can understand which areas are popular and avoid crowded times.

#### Acceptance Criteria

1. WHEN the heat map layer is enabled, THE Map SHALL display a visual representation of tourist traffic density
2. THE Map SHALL use color gradients to indicate traffic levels (low to high)
3. WHERE data is insufficient, THE Map SHALL display a message indicating limited data coverage and prevent enabling the layer when no visual representation can be displayed
4. FOR all heat map visualizations, THE Map SHALL provide a legend explaining the color scale
5. WHEN displaying the heat map, THE Map SHALL allow users to select different time periods (current hour, today, this week)

## Technical Considerations

### Data Structure Extensions

The following data structure extensions are needed to support the new features:

1. **Commerce Service Types**: Add a `serviceTypes` array to commerce entries in `pautas.json`
2. **Ratings Data**: Create a new `ratings.json` file to store anonymous ratings with structure:
   ```json
   {
     "commerceId": "string",
     "userId": "string (anonymous hash)",
     "rating": 1-5,
     "review": "string (optional)",
     "timestamp": "ISO 8601 string"
   }
   ```
3. **Special Offers**: Add optional `specialOffer` object to commerce entries:
   ```json
   {
     "title": "string",
     "description": "string",
     "discount": "percentage or amount",
     "validFrom": "ISO 8601 string",
     "validTo": "ISO 8601 string"
   }
   ```
4. **Operating Hours**: Extend existing `horario` field with structured data for real-time status calculation

### Implementation Priorities

1. **High Priority** (Core functionality):
   - Requirement 1: Enhanced Pauta Ficha with service icons
   - Requirement 9: Real-time open/closed status
   - Requirement 7: Individual QR codes per commerce

2. **Medium Priority** (User engagement):
   - Requirement 3: Reviews and ratings system
   - Requirement 4: Special offers/promotions
   - Requirement 8: In-app live chat

3. **Lower Priority** (Advanced features):
   - Requirement 2: Sub-filters by service type
   - Requirement 5: Optimized tour routes
   - Requirement 6: Push notifications
   - Requirement 10: Heat map of tourist traffic

### Technical Constraints

1. **Performance**: All new features must maintain the current app's performance standards (under 2-second load times)
2. **Offline Support**: Core features should work offline where possible; data should be cached locally
3. **Privacy**: User ratings and chat messages must be handled with appropriate privacy controls
4. **Compatibility**: All features must work on both desktop and mobile browsers
5. **Scalability**: The data structure should support future expansion without major refactoring

## Assumptions

1. Users will have access to modern smartphones or tablets with GPS and internet connectivity
2. Most commercial establishments will have basic contact information available
3. Users are willing to share anonymous location data for personalized recommendations
4. The existing data structure can be extended without breaking current functionality
5. Push notifications will require users to opt-in and may have platform-specific limitations

## Future Enhancements

1. Integration with payment systems for in-app purchases
2. Language translation for international tourists
3. Audio guides and augmented reality features
4. Social sharing and review posting capabilities
5. Business analytics dashboard for commerce owners