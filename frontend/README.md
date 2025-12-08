# Questionnaire Platform - Frontend

React TypeScript frontend for the questionnaire platform.

## Requirements

- Node.js 20+
- npm or yarn

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The frontend runs on `http://localhost:3000`

The development server includes a proxy that forwards `/api` requests to `http://localhost:8080` (backend).

## Build

```bash
npm run build
```

This creates a production build in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Features

### Citizen UI
- Login/Registration
- Wizard interface for morning and evening questionnaires
- Conditional logic support
- Time pickers, sliders, numeric inputs
- Automatic sleep parameter calculation display

### Advisor UI
- Login
- Overview of citizens and their responses
- Sleep parameter visualization with charts
- Evening questionnaire editor with drag-and-drop
- Conditional logic builder
- Morning questionnaire read-only view
- User management (assign advisors to citizens)

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **@dnd-kit** - Drag-and-drop functionality
- **Recharts** - Chart library for sleep parameter visualization
- **i18next** - Internationalization (Danish/English)

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── context/        # React contexts (Auth, Language, Theme, Toast)
│   ├── services/       # API service layer
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── i18n/           # Internationalization configuration
│   └── App.tsx         # Main app component
├── public/             # Static assets
└── package.json
```

## Environment Variables

For production builds, you can configure the API URL using environment variables:

Create a `.env.production` file:
```env
VITE_API_URL=http://your-server-ip/api
```

## Internationalization

The application supports both Danish and English. The language can be toggled using the language selector in the UI.

Language files are located in `src/i18n/locales/`:
- `da.json` - Danish translations
- `en.json` - English translations

## Styling

The application uses CSS modules for component-specific styling. Global styles are defined in `src/index.css`.

## Browser Support

The application is tested and works in:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
