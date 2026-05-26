# Design Document: Tourist Assistant Chatbot

## Overview

This document outlines the design for a friendly tourist assistant chatbot for the Armenia 2026 Map project. The chatbot will serve as a virtual guide for tourists exploring Armenia, Quindío, Colombia, providing information about tourist attractions, commerce, gastronomy, and services. The chatbot will be integrated with the existing Leaflet-based map interface and leverage the current JSON data structure.

### Key Design Principles

1. **Regional Character**: The chatbot will embody Quindiano culture with warmth, hospitality, and local pride
2. **Seamless Integration**: The chatbot will integrate cleanly with the existing map interface without disrupting user experience
3. **Data-Driven**: The chatbot will use the same data sources (pois.json, pautas.json) as the existing map code
4. **Accessibility**: The chatbot will follow WCAG guidelines for keyboard navigation, screen reader support, and color contrast
5. **Performance**: The chatbot will load quickly and respond promptly to user queries

## Architecture

The chatbot will be implemented as a modular JavaScript component that integrates with the existing map application. The architecture follows a clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Chatbot Interface                       │
│  (Chat Window, Message Input, Visual Avatar)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Chatbot Logic                           │
│  (Message Processing, Response Generation, State Mgmt)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  (POI Data, Pautas Data, Cache, Map Integration)            │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

```
chatbot/
├── chatbot.js          # Main chatbot logic and initialization
├── interface.js        # UI components and DOM manipulation
├── data.js             # Data loading and caching
├── responses.js        # Response templates and generation
├── map-integration.js  # Map interaction and synchronization
└── accessibility.js    # Accessibility features and ARIA support
```

## Components and Interfaces

### 1. Chatbot Character (Identity)

#### Name: "Turu" (or "Turu" - derived from "Turista" with Quindiano charm)

**Personality Traits:**
- Warm and welcoming (like a local friend)
- Knowledgeable about Armenia and Quindío
- Patient and helpful
- Enthusiastic about local culture and attractions
- Uses friendly, approachable Spanish with Quindiano flavor

**Visual Representation:**
- Avatar icon: A friendly, stylized character wearing a "ruana" (traditional Quindiano garment)
- Color scheme: Green (representing the region's natural beauty) with gold accents
- Animation: Subtle breathing animation when idle, nodding when listening

#### Character Concept Details

```
Name: Turu
Role: Tourist Assistant & Cultural Ambassador
Origin: Armenia, Quindío, Colombia
Personality: Caliente, amable, orgulloso de su tierra
Appearance: Stylized character with ruana, warm smile, friendly eyes
Voice: Friendly, conversational, with Quindiano Spanish inflection
```

### 2. Chat Interface

#### Layout and Positioning

```
┌─────────────────────────────────────────────────────────────┐
│  Map Application                                            │
│                                                             │
│  [Chat Toggle Button]  ← Floating bottom-right corner      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Chat Window (collapsible)                          │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  Header: Turu Avatar + Name + Status         │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │  Messages Area (scrollable)                  │  │   │
│  │  │  [User Message]                              │  │   │
│  │  │  [Turu Response]                             │  │   │
│  │  │  ...                                         │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │  Input Area with Send Button                 │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Interface Elements

1. **Chat Toggle Button**
   - Position: Bottom-right corner (16px from edges)
   - Appearance: Circular button with Turu avatar
   - Animation: Pulsing when new messages available
   - Accessibility: ARIA label "Chat con Turu, asistente turístico"

2. **Chat Window Header**
   - Turu avatar (circular, 48px)
   - Name: "Turu"
   - Status: "En línea" (green indicator)
   - Close/Minimize button (X icon)

3. **Messages Area**
   - Scrollable container
   - User messages: Right-aligned, green bubble
   - Turu messages: Left-aligned, white bubble with green border
   - Timestamps: Small, gray text below messages

4. **Input Area**
   - Text input field
   - Send button (paper plane icon)
   - Quick action buttons (optional): Map, Categories, Favorites

### 3. Data Integration

#### Data Sources

The chatbot will use the same data sources as the existing map code:

1. **POI Data** (`data/pois.json`)
   - Tourist attractions
   - Commercial establishments
   - Gastronomic venues

2. **Pautas Data** (`data/pautas.json`)
   - Advertising sponsors
   - Business listings with contact information

#### Data Loading Strategy

```javascript
// Data loading with caching
const dataCache = {
  pois: null,
  pautas: null,
  lastUpdated: null
};

async function loadData() {
  try {
    const [pois, pautas] = await Promise.all([
      fetch('data/pois.json').then(r => r.json()),
      fetch('data/pautas.json').then(r => r.json())
    ]);
    
    dataCache.pois = pois;
    dataCache.pautas = pautas;
    dataCache.lastUpdated = Date.now();
    
    return { pois, pautas };
  } catch (error) {
    console.error('Error loading chatbot data:', error);
    throw error;
  }
}
```

#### Data Structure Mapping

```javascript
// POI structure (from pois.json)
{
  id: "plaza-bolivar",
  name: "Plaza de Bolívar",
  category: "turistico",
  lat: 4.5358,
  lng: -75.6725,
  address: "Carreras 13–14, calles 20–21",
  description: "Corazón histórico de la ciudad...",
  pautaId: null,
  telefono: null,
  horario: null
}

// Pauta structure (from pautas.json)
{
  id: "anatolia",
  nombre: "Anatolia",
  categoria: "Gastronómico",
  imagen: "pautas publicitarias/anatolia.png",
  poiId: "anatolia",
  slogan: "Un encuentro de sabores en Quindío",
  direccion: "Carrera 19 # 35N-79...",
  telefono: "311 701 1653",
  whatsapp: "573117011653",
  horario: "Lun–Sáb 12:00 m. – 8:00 p. m.",
  ficha: { ... }
}
```

### 4. Response Generation

#### Response Categories

1. **Greeting Responses**
   - Initial greeting when chat opens
   - Follow-up greetings after inactivity

2. **Information Responses**
   - Location details (name, category, description, address)
   - Contact information (phone, WhatsApp)
   - Operating hours
   - Directions

3. **Recommendation Responses**
   - Category-based recommendations
   - Location-based recommendations
   - Personalized suggestions

4. **Map Integration Responses**
   - Location highlighting
   - Map centering
   - Nearby locations

5. **Error Handling Responses**
   - Unrecognized queries
   - Data unavailable
   - Technical issues

#### Response Templates

```javascript
const responseTemplates = {
  greeting: [
    "¡Hola! Soy Turu, tu asistente turístico en Armenia. ¿En qué puedo ayudarte hoy?",
    "¡Bienvenido! Soy Turu. Estoy aquí para mostrarte lo mejor de Armenia y el Quindío.",
    "¡Hola! ¿Listo para explorar Armenia? Soy Turu y te ayudaré a encontrar lo que buscas."
  ],
  
  locationInfo: (poi, pauta) => {
    const contactInfo = pauta 
      ? `Teléfono: ${pauta.telefono}\n${pauta.whatsapp ? `WhatsApp: ${pauta.whatsapp}\n` : ''}`
      : poi.telefono ? `Teléfono: ${poi.telefono}\n` : '';
    
    return `📍 ${poi.name}\n\n${poi.description}\n\n${poi.address ? `📍 Dirección: ${poi.address}\n` : ''}${contactInfo}${poi.horario ? `🕒 Horario: ${poi.horario}\n` : ''}`;
  },
  
  recommendation: (category, pois) => {
    const recommendations = pois.slice(0, 3).map(p => `• ${p.name}`).join('\n');
    return `Aquí tienes algunas recomendaciones en la categoría ${CATEGORY_LABELS[category]}:\n\n${recommendations}\n\n¿Quieres que te muestre más opciones o que las veamos en el mapa?`;
  },
  
  mapIntegration: (poi) => {
    return `¡Claro! Te muestro ${poi.name} en el mapa. ¿Te gustaría que centremos el mapa en esta ubicación?`;
  },
  
  error: [
    "Lo siento, no entendí esa pregunta. ¿Podrías reformularla o darme más detalles?",
    "Interesante pregunta. Si me das más contexto, puedo intentar ayudarte mejor.",
    "No tengo esa información específica en este momento, pero puedo ayudarte a buscar algo relacionado."
  ]
};
```

### 5. Map Integration

#### Integration Points

1. **Location Highlighting**
   - When user clicks a location in chat, highlight the corresponding POI marker
   - Open the POI popup automatically

2. **Map Centering**
   - When user selects a location from chat suggestions, center the map on that location
   - Zoom to appropriate level (16 for specific locations)

3. **Context-Aware Responses**
   - When user asks about "nearby" locations, use current map view bounds
   - When user asks about locations in a specific area, use map context

#### Map Integration API

```javascript
// Map integration module
const mapIntegration = {
  highlightLocation(poiId) {
    const marker = markerById.get(poiId);
    if (marker) {
      marker.openPopup();
      marker.bounce(); // Custom animation
    }
  },
  
  centerOnLocation(poiId) {
    const poi = poisData.find(p => p.id === poiId);
    if (poi) {
      map.setView([poi.lat, poi.lng], 16, { animate: true });
    }
  },
  
  getNearbyLocations() {
    const bounds = map.getBounds();
    return poisData.filter(poi => 
      bounds.contains([poi.lat, poi.lng])
    );
  },
  
  getLocationsInCategory(category) {
    return poisData.filter(poi => poi.category === category);
  }
};
```

## Data Models

### Chatbot State

```javascript
const chatbotState = {
  isOpen: false,
  isMinimized: false,
  messages: [],
  user: {
    name: null,
    preferences: {
      categories: ['turistico', 'comercial', 'gastronomico'],
      language: 'es'
    }
  },
  mapContext: {
    bounds: null,
    center: null,
    zoom: null
  },
  lastActivity: Date.now(),
  inactivityTimeout: 300000, // 5 minutes
  cache: {
    pois: null,
    pautas: null,
    lastUpdated: null
  }
};
```

### Message Model

```javascript
const messageModel = {
  id: string,           // Unique identifier
  sender: 'user' | 'turu',
  text: string,         // Message content
  timestamp: number,    // Unix timestamp
  type: 'text' | 'location' | 'recommendation' | 'map-action',
  data: object | null   // Additional data (e.g., location coordinates)
};
```

### User Preference Model

```javascript
const userPreferences = {
  categories: ['turistico', 'comercial', 'gastronomico'], // Default categories
  language: 'es',                                        // Default language
  showImages: true,                                      // Show pauta images
  autoCenterMap: true,                                   // Auto-center map on selections
  responseTime: 'normal' | 'fast'                        // Response speed preference
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Character Identity Consistency

*For any* user interaction, the chatbot shall consistently identify itself as "Turu" with the role of "asistente turístico" and maintain its Quindiano personality throughout the conversation.

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 2: Data Source Synchronization

*For any* POI or pauta entry, if the entry exists in the map's data source (pois.json or pautas.json), the chatbot shall provide the same information as the map interface, and any updates to the data files shall be reflected in the chatbot's responses.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: Location Information Completeness

*For any* location query, when the chatbot provides information about a specific location, it shall include the location's name, category, description, and address (if available), and shall include contact information (phone, WhatsApp) for pautas.

**Validates: Requirements 4.1, 4.3**

### Property 4: Map Integration Reversibility

*For any* location selection from chat suggestions, the chatbot shall center the map on that location, and the user shall be able to return to the previous map view by navigating back or selecting another location.

**Validates: Requirements 6.3**

### Property 5: Accessibility Keyboard Navigation

*For any* interactive element in the chat interface, the element shall be fully navigable using keyboard navigation (Tab, Enter, Escape) without requiring a mouse.

**Validates: Requirements 8.1**

### Property 6: Message Response Time

*For any* standard query (under 50 words), the chatbot shall respond within 1 second of receiving the message, measured from message submission to message display.

**Validates: Requirements 9.2**

### Property 7: Error Handling Gracefulness

*For any* query that the chatbot cannot answer with available data, the chatbot shall respond with a helpful message that acknowledges the limitation and suggests alternative approaches or related information.

**Validates: Requirements 5.3**

### Property 8: Inactivity Check-in Consistency

*For any* user who has been inactive for 5 minutes or more, the chatbot shall send exactly one friendly check-in message, and shall not send additional check-in messages until another period of inactivity occurs.

**Validates: Requirements 5.5**

## Error Handling

### Error Categories

1. **Data Loading Errors**
   - Network failures when loading pois.json or pautas.json
   - Invalid JSON format
   - Missing required fields

2. **User Input Errors**
   - Empty messages
   - Messages that cannot be understood
   - Messages that exceed length limits

3. **Map Integration Errors**
   - Map not initialized
   - Location not found
   - Map view changes during operations

4. **Performance Errors**
   - Slow network connections
   - Large data sets
   - Memory constraints

### Error Handling Strategy

```javascript
// Error handling module
const errorHandler = {
  handleDataError(error) {
    console.error('Data loading error:', error);
    return {
      type: 'error',
      message: 'No pude cargar la información de los lugares. Por favor, verifica tu conexión a internet.',
      retry: true
    };
  },
  
  handleInputError(error) {
    console.warn('Input error:', error);
    return {
      type: 'warning',
      message: 'Por favor, escribe una pregunta o seleccióna una opción.',
      retry: true
    };
  },
  
  handleMapError(error) {
    console.error('Map integration error:', error);
    return {
      type: 'error',
      message: 'Hubo un problema con el mapa. Puedo seguir ayudándote sin mostrar en el mapa.',
      continue: true
    };
  },
  
  handlePerformanceError(error) {
    console.warn('Performance issue:', error);
    return {
      type: 'info',
      message: 'Parece que la conexión es lenta. Estoy trabajando en tu solicitud.',
      patience: true
    };
  }
};
```

### Error Recovery

1. **Automatic Retry**: For transient errors (network issues), automatically retry up to 3 times
2. **User Notification**: Inform users about errors and provide clear recovery options
3. **Graceful Degradation**: Continue providing basic functionality even when some features fail
4. **Logging**: Log errors for debugging while keeping user-facing messages simple

## Testing Strategy

### Dual Testing Approach

**Unit Tests**: Verify specific examples, edge cases, and error conditions
**Property Tests**: Verify universal properties across all inputs (when applicable)

Together: Comprehensive coverage (unit tests catch concrete bugs, property tests verify general correctness)

### Property-Based Testing

Property-based testing will be used for the following properties:

1. **Character Identity Consistency** (Property 1)
   - Test that all responses maintain consistent identity
   - Generate random conversation paths and verify identity consistency

2. **Data Source Synchronization** (Property 2)
   - Test that chatbot data matches map data
   - Generate random POI/pauta entries and verify chatbot responses

3. **Location Information Completeness** (Property 3)
   - Test that all location queries return complete information
   - Generate random location queries and verify response completeness

4. **Accessibility Keyboard Navigation** (Property 5)
   - Test that all interactive elements are keyboard accessible
   - Generate random keyboard interaction sequences

5. **Error Handling Gracefulness** (Property 7)
   - Test that all error conditions are handled gracefully
   - Generate random error scenarios and verify error responses

### Unit Testing

Unit tests will be used for:

1. **Response Template Validation**
   - Test that all response templates are properly formatted
   - Test that templates handle edge cases (null values, empty strings)

2. **Data Loading**
   - Test that data loads correctly from JSON files
   - Test error handling for network failures

3. **Message Processing**
   - Test that messages are processed correctly
   - Test that responses are generated correctly

4. **Map Integration**
   - Test that map integration functions work correctly
   - Test error handling for map operations

### Integration Testing

Integration tests will be used for:

1. **End-to-End Chat Flow**
   - Test complete chat conversations
   - Test various user scenarios

2. **Map Integration**
   - Test chatbot-map interactions
   - Test location highlighting and centering

3. **Data Synchronization**
   - Test that data updates are reflected in chatbot
   - Test caching behavior

### Test Configuration

- **Property Tests**: Minimum 100 iterations per property
- **Unit Tests**: 100% coverage for core functions
- **Integration Tests**: Cover all major user scenarios

### Tagging Convention

Each property-based test will be tagged with:

```
**Feature: tourist-assistant-chatbot, Property {number}: {property_text}**
```

Example:

```
**Feature: tourist-assistant-chatbot, Property 1: Character Identity Consistency**
```

## Implementation Notes

### Tech Stack

- **Language**: JavaScript (ES6+)
- **Framework**: Vanilla JavaScript (no external dependencies beyond Leaflet)
- **Styling**: CSS3 with CSS variables
- **Data Format**: JSON (existing pois.json, pautas.json)

### File Structure

```
chatbot/
├── chatbot.js          # Main chatbot logic and initialization
├── interface.js        # UI components and DOM manipulation
├── data.js             # Data loading and caching
├── responses.js        # Response templates and generation
├── map-integration.js  # Map interaction and synchronization
├── accessibility.js    # Accessibility features and ARIA support
└── styles/
    └── chatbot.css     # Chatbot-specific styles
```

### Initialization Sequence

```javascript
async function initChatbot() {
  try {
    // Load data
    const { pois, pautas } = await loadData();
    
    // Initialize state
    chatbotState.cache.pois = pois;
    chatbotState.cache.pautas = pautas;
    
    // Initialize UI
    initChatInterface();
    initMapIntegration();
    initAccessibility();
    
    // Show welcome message
    showWelcomeMessage();
    
    // Start inactivity monitoring
    startInactivityMonitor();
    
    console.log('Chatbot initialized successfully');
  } catch (error) {
    console.error('Failed to initialize chatbot:', error);
    showError('No pude iniciar el asistente turístico. Por favor, recarga la página.');
  }
}
```

### Performance Considerations

1. **Caching**: Cache loaded data to avoid repeated network requests
2. **Lazy Loading**: Load non-critical resources on demand
3. **Debouncing**: Debounce rapid user inputs
4. **Optimization**: Optimize DOM manipulations with batch updates

### Accessibility Features

1. **Keyboard Navigation**: Full keyboard navigation for all interactive elements
2. **ARIA Labels**: Proper ARIA labels for screen readers
3. **Color Contrast**: Sufficient color contrast for readability
4. **Text Resizing**: Support for text resizing without breaking layout
5. **Focus Management**: Proper focus management for modal dialogs

### Internationalization

The chatbot will be designed with internationalization in mind:

1. **Language Support**: Easy to add new languages
2. **Text Direction**: Support for RTL languages
3. **Date/Time**: Localized date/time formatting

## Future Enhancements

1. **Voice Input**: Support for voice queries
2. **Image Recognition**: Visual search capabilities
3. **Personalization**: User preferences and history
4. **Multi-language**: Support for additional languages
5. **Offline Mode**: Cache data for offline use
6. **Analytics**: Usage analytics and insights
