# Development Guide

## Commands
- **Frontend Dev**: `npm run dev` - Starts Vite dev server
- **Frontend Build**: `npm run build` - Creates production build
- **Frontend Preview**: `npm run preview` - Preview production build
- **Backend Start**: `npm start` - Runs Node.js server
- **Backend Dev**: `npm run dev` - Runs server with Nodemon

## Code Style
- **Components**: Use functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Files**: JSX files for React components, JS files for utilities
- **Imports**: Group by type/origin, use path aliases (`@/` for `./src`)
- **Styling**: Use Tailwind CSS utility classes
- **Error Handling**: Try/catch with specific error codes on backend

## Structure
- **Frontend**: React + Vite with Tailwind CSS
- **Backend**: Express.js with MongoDB (Mongoose)
- **API**: Use axios for external API calls
- **Validation**: Express-validator for backend validation
- **Responses**: Proper status codes with JSON payloads