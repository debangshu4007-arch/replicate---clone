# ModelHub - AI Model Platform

A production-ready web application for browsing and running AI models via the Replicate API. Built with Next.js 15, TypeScript, and Tailwind CSS.

![ModelHub Screenshot](./screenshot.png)

## Features

- **Model Browser**: Browse all available Replicate models with search and filtering
  - Grid and list view modes
  - Filter by modality (Image, Video, Audio, Text)
  - Search by name, owner, or description
  - View model details, run counts, and versions

- **Dynamic Prediction Runner**: Auto-generated forms based on model schemas
  - Text inputs, textareas, sliders, dropdowns
  - File uploads (image, video, audio)
  - Boolean switches
  - JSON/array inputs
  - Real-time validation

- **Real-time Status**: Live prediction status updates
  - Automatic polling for running predictions
  - Status indicators (starting, processing, succeeded, failed)
  - Prediction logs display
  - Output rendering (images, videos, audio, text, JSON)

- **Prediction History**: Track and manage past runs
  - View all predictions with thumbnails
  - Re-run predictions with one click
  - Clone and edit previous inputs
  - Delete individual or all predictions

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Replicate API
- **Deployment**: Vercel-compatible

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Replicate API token ([Get one here](https://replicate.com/account/api-tokens))

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd replicate-clone
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your API token** (see detailed instructions below)

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Setup (IMPORTANT)

### Getting Your Replicate API Token

1. Go to [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. Sign in or create an account
3. Click "Create token" and copy it

### Setting Up the Token

> ⚠️ **IMPORTANT**: The `.env.example` file is a **template only**. Never put your real token there - it's committed to git!

#### Windows (Command Prompt)
```cmd
copy .env.example .env.local
notepad .env.local
```

#### Windows (PowerShell)
```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

#### Mac / Linux
```bash
cp .env.example .env.local
nano .env.local    # or: code .env.local
```

Then replace `your_token_here` with your actual token:
```
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### ⚠️ Hidden Files Warning

Many code editors **hide dotfiles by default**. If you can't see `.env.local`:

- **VS Code**: Check Settings → `files.exclude` 
- **File Explorer (Windows)**: View → Show → Hidden items
- **Finder (Mac)**: Press `Cmd + Shift + .` to toggle hidden files
- **Terminal**: Use `ls -la` (Mac/Linux) or `dir /a` (Windows)

### Verifying Configuration

You can check if your token is configured by visiting:
```
http://localhost:3000/api/health
```

This will return:
```json
{
  "status": "healthy",
  "replicateConfigured": true,
  "timestamp": "..."
}
```

If not configured, it will show setup instructions.

---

## 📁 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `REPLICATE_API_TOKEN` | Your Replicate API token | Yes |
| `REPLICATE_API_KEY` | Alternative name (fallback) | No |
| `NEXT_PUBLIC_BASE_URL` | Base URL for production | No |

---

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── collections/      # Collections endpoint
│   │   ├── health/           # Health check endpoint
│   │   ├── models/           # Models endpoints
│   │   └── predictions/      # Predictions endpoints
│   ├── models/[owner]/[name] # Model detail page
│   ├── predictions/          # Prediction history page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (model browser)
│
├── components/               # React components
│   ├── layout/               # Layout components
│   ├── models/               # Model-related components
│   ├── predictions/          # Prediction components
│   └── ui/                   # Base UI components
│
├── lib/                      # Utility libraries
│   ├── config.ts             # Centralized configuration
│   ├── replicate.ts          # Replicate API client
│   ├── schema-parser.ts      # Schema to form parser
│   ├── store.ts              # In-memory prediction store
│   └── utils.ts              # Utility functions
│
├── types/                    # TypeScript types
│   └── index.ts              # All type definitions
│
└── public/                   # Static assets
```

## API Routes

### Health Check
- `GET /api/health` - Check API configuration status

### Models

- `GET /api/models` - List all models
  - `?featured=true` - Sort by popularity
  - `?collection=<slug>` - Get collection models
  - `?cursor=<cursor>` - Pagination

- `GET /api/models/[owner]/[name]` - Get model details with versions

### Predictions

- `GET /api/predictions` - List predictions
  - `?local=true` - Get from local store
  - `?status=<status>` - Filter by status

- `POST /api/predictions` - Create prediction
  ```json
  {
    "modelOwner": "stability-ai",
    "modelName": "sdxl",
    "input": { "prompt": "A photo of a cat" }
  }
  ```

- `GET /api/predictions/[id]` - Get prediction status

- `POST /api/predictions/[id]?action=cancel` - Cancel prediction

- `DELETE /api/predictions/[id]` - Delete from local store

- `DELETE /api/predictions` - Clear all local predictions

### Collections

- `GET /api/collections` - List available collections

---

## 🔧 Troubleshooting

### "Missing Replicate API token" Error

**Cause**: The `.env.local` file is missing or doesn't contain a valid token.

**Fix**:
1. Make sure `.env.local` exists in the project root
2. Verify it contains `REPLICATE_API_TOKEN=r8_...`
3. Restart the development server after changing env files

### "Failed to fetch models" Error

**Cause**: Could be a network issue or invalid token.

**Fix**:
1. Check `/api/health` to see if the token is configured
2. Verify your token is valid at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
3. Check the terminal/console for detailed error messages

### Can't See .env.local in Editor

**Cause**: Your editor hides dotfiles by default.

**Fix**: See "Hidden Files Warning" section above.

---

## Production Build

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REPLICATE_API_TOKEN` | Your Replicate API token | Yes |

## Usage Examples

### Running an Image Generation Model

1. Navigate to the home page
2. Search for "stable-diffusion" or "flux"
3. Click on a model to view details
4. Enter your prompt in the input field
5. Adjust optional parameters (steps, guidance scale, etc.)
6. Click "Run Model"
7. Wait for the prediction to complete
8. Download or view the generated image

### Running a Text Model

1. Find a language model (e.g., "llama")
2. Enter your prompt
3. Adjust temperature, max tokens, etc.
4. Run and view the text output

### Viewing Prediction History

1. Click "History" in the navigation
2. View all past predictions
3. Click "Run Again" to re-run with same inputs
4. Click "Clone" to edit inputs before running

## Extending the Platform

### Adding Authentication

The codebase is prepared for adding authentication:

1. Add your auth provider (NextAuth, Clerk, etc.)
2. Protect API routes in `app/api/`
3. Add user context to predictions

### Adding Billing

1. Track usage in the prediction store
2. Add pricing information to model display
3. Integrate with Stripe or similar

### Adding Custom Workflows

1. Create workflow definitions
2. Chain multiple model calls
3. Store workflow results

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add `REPLICATE_API_TOKEN` environment variable
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Node.js:
- AWS Amplify
- Google Cloud Run
- Railway
- Render

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- [Replicate](https://replicate.com) for the AI model API
- [Next.js](https://nextjs.org) for the framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Lucide](https://lucide.dev) for icons
