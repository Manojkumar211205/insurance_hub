# Insurance Agent Frontend

A React TypeScript frontend for an insurance agent application that integrates with a FastAPI backend.

## Features

- **Authentication**: Login and signup functionality
- **Insurance Setup**: Select from available insurance policies
- **Document Upload**: Upload insurance policy documents (PDF, DOCX, PPTX, TXT)
- **AI Chat**: Interactive chat with an autonomous insurance agent

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd insurance-agent-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Integration

The frontend integrates with the following API endpoints:

### Authentication
- `POST /signup` - User registration
- `POST /signin` - User login

### Insurance Management
- `GET /insurance-available` - Get available insurance policies
- `POST /insurance-obtained` - Add insurance to user profile
- `POST /add-insurance` - Upload insurance document

### AI Agent
- `POST /agent/chat` - Chat with the autonomous agent

## Project Structure

```
src/
├── components/
│   ├── Login.tsx          # Login page
│   ├── Signup.tsx         # Signup page
│   ├── Setup.tsx          # Insurance selection page
│   ├── AddInsurance.tsx   # Document upload page
│   └── Chat.tsx           # Chat interface
├── services/
│   └── api.ts             # API service functions
├── App.tsx                # Main app component with routing
├── main.tsx               # App entry point
└── index.css              # Global styles
```

## User Flow

1. **Signup/Login**: User creates account or logs in
2. **Setup**: User selects existing insurance policies from available options
3. **Add Insurance**: User can upload insurance policy documents
4. **Chat**: User interacts with the AI insurance agent for recommendations and advice

## Configuration

Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000'; // Change to your API URL
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## License

This project is licensed under the MIT License.