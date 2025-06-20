# DataLab - Agentic Data Processing Platform

DataLab is a modern, AI-powered data processing application built with Next.js, TypeScript, and Tailwind CSS. It provides intelligent agents for data analysis, transformation, and visualization.

## Features

### 🤖 AI-Powered Agents
- **Data Cleaning Agents**: Remove duplicates, handle missing values, normalize text
- **Analysis Agents**: Detect outliers, generate statistical summaries
- **Transformation Agents**: Data type conversion, column operations
- **Real LLM Integration**: Uses Anthropic Claude for intelligent data processing
- **Fallback Processing**: Intelligent local processing when LLM is unavailable

### 📊 Interactive Visualizations
- Bar charts, line charts, pie charts, and scatter plots
- Real-time chart generation from uploaded data
- Configurable axes and chart types

### 📁 File Support
- CSV file upload and parsing
- JSON data import
- Automatic data type detection

### 🎨 Modern UI
- Responsive design with Tailwind CSS
- Dark mode support
- Intuitive tabbed interface

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository or ensure you're in the project directory
2. Install dependencies:

```bash
npm install
```

3. Configure LLM integration (optional):

```bash
npm run setup-llm
```

This will prompt you to enter your OpenAI API key for real LLM processing. Without an API key, the app will use intelligent local processing as a fallback.

**To get an Anthropic API key:**
- Visit [https://console.anthropic.com/](https://console.anthropic.com/)
- Create a new API key
- Run the setup script and enter your key

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   └── workspace/         # Main workspace
├── components/            # React components
│   ├── FileUpload.tsx     # File upload functionality
│   ├── DataTable.tsx      # Data preview table
│   ├── AgentPanel.tsx     # AI agents interface
│   └── VisualizationPanel.tsx # Charts and graphs
└── types/                 # TypeScript type definitions
```

## Usage

1. **Upload Data**: Start by uploading a CSV or JSON file
2. **Preview Data**: View your data in the structured table
3. **Run AI Agents**: Use cleaning and analysis agents to process your data
4. **Visualize**: Create interactive charts and explore insights

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **File Processing**: Papa Parse
- **UI Components**: Radix UI

## Development Guidelines

This project follows the coding standards defined in `.github/copilot-instructions.md`. Key principles:

- Use TypeScript strictly with proper type definitions
- Follow React best practices with functional components
- Implement proper error handling and loading states
- Create reusable, maintainable components
- Use server components where appropriate for performance

## Contributing

1. Follow the established code style and patterns
2. Write proper TypeScript types
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is licensed under the MIT License.

## LLM Configuration

DataLab supports real AI processing through Anthropic's Claude models. The application provides two modes:

### 🤖 Real LLM Mode (Recommended)
When configured with an Anthropic API key, agents use Claude-3-Haiku for:
- Intelligent duplicate detection based on semantic similarity
- Smart missing value imputation strategies
- Context-aware text normalization
- Advanced outlier detection with reasoning
- Comprehensive data insights and patterns

### 🔧 Local Processing Mode (Fallback)
Without an API key, agents use intelligent local algorithms:
- Rule-based duplicate removal
- Statistical imputation (median/mode)
- Standard text normalization
- IQR-based outlier detection
- Basic statistical summaries

### Configuration Options

1. **Interactive Setup** (Recommended):
   ```bash
   npm run setup-llm
   ```

2. **Manual Configuration**:
   Create `.env.local` in the project root:
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Environment Variables**:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude processing

### API Key Security
- API keys are stored locally in `.env.local`
- Never commit API keys to version control
- The `.env.local` file is automatically ignored by Git

## Docker Deployment

DataLab can be easily deployed using Docker for both development and production environments.

### Prerequisites
- Docker
- Docker Compose (optional, for easier management)

### Quick Start with Docker

#### Production Deployment

1. **Build and run with Docker Compose** (Recommended):
```bash
# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
nano .env

# Build and start the application
docker-compose up -d
```

2. **Manual Docker build**:
```bash
# Build the image
docker build -t datalab .

# Run the container
docker run -d \
  --name datalab \
  -p 3000:3000 \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=your-super-secret-jwt-secret \
  -e ANTHROPIC_API_KEY=your-api-key \
  -v datalab_data:/app/data \
  datalab
```

#### Development with Docker

```bash
# Start development environment
docker-compose --profile dev up
```

This will start the development server with hot-reloading on port 3001.

### Environment Variables for Docker

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=file:/app/data/prisma/dev.db

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-secret-replace-in-production

# AI API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key

# Optional: OAuth providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret
```

### Docker Configuration Files

- **`Dockerfile`**: Production build with multi-stage optimization
- **`Dockerfile.dev`**: Development build with hot-reloading
- **`docker-compose.yml`**: Orchestration for both production and development
- **`.dockerignore`**: Optimizes build context and image size

### Health Checks

The container includes health checks available at `/api/health`:

```bash
# Check container health
curl http://localhost:3000/api/health
```

### Data Persistence

The SQLite database is persisted using Docker volumes:
- Production: `datalab_data` volume
- Development: `datalab_dev_data` volume

### Production Deployment Tips

1. **Use environment files**: Create production-specific `.env` files
2. **SSL/TLS**: Use a reverse proxy (nginx, traefik) for HTTPS
3. **Monitoring**: Add logging and monitoring solutions
4. **Backup**: Regularly backup the database volume
5. **Updates**: Use rolling updates for zero-downtime deployments

### Scaling and Load Balancing

For high-traffic deployments:

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  datalab:
    image: datalab:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```
