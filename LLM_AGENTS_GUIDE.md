# DataLab AI Agents - Real Claude Integration

## Overview

DataLab now features **real AI-powered agents** that use Anthropic's Claude models to intelligently process and analyze your data. These agents go beyond simple rule-based processing to provide sophisticated, context-aware data handling.

## How the Agents Work

### 🤖 Real LLM Mode (When Anthropic API Key is Configured)

When you provide an Anthropic API key, agents leverage **Claude-4 Opus / Sonnet** for intelligent data processing:

#### 1. **Remove Duplicates Agent**
- **What it does**: Analyzes your dataset using semantic understanding to identify duplicate records
- **LLM Processing**: 
  - Sends data sample and schema
  - Asks the LLM to identify duplicate rows based on semantic similarity, not just exact matches
  - LLM provides reasoning for why records are considered duplicates
  - Returns indices of rows to remove with detailed analysis
- **Intelligence**: Can detect duplicates even when data has minor variations, typos, or formatting differences

#### 2. **Handle Missing Values Agent**
- **What it does**: Intelligently fills missing values using context-aware strategies
- **LLM Processing**:
  - Analyzes data patterns and column relationships
  - Determines optimal imputation strategy for each column type
  - Considers domain knowledge and data distribution
  - Provides reasoning for each imputation choice
- **Intelligence**: Goes beyond basic mean/mode filling by understanding data context and relationships

#### 3. **Normalize Text Agent**
- **What it does**: Standardizes text data with intelligent formatting rules
- **LLM Processing**:
  - Analyzes text patterns and inconsistencies
  - Determines appropriate normalization rules based on content type
  - Considers domain-specific formatting requirements
  - Provides detailed transformation recommendations
- **Intelligence**: Understands context (e.g., names vs. descriptions) and applies appropriate formatting

#### 4. **Detect Outliers Agent**
- **What it does**: Identifies anomalous data points with intelligent reasoning
- **LLM Processing**:
  - Analyzes data distribution and patterns
  - Identifies outliers based on statistical and contextual criteria
  - Provides reasoning for why values are considered outliers
  - Considers domain knowledge for outlier detection
- **Intelligence**: Combines statistical methods with contextual understanding

#### 5. **Generate Summary Agent**
- **What it does**: Creates comprehensive data insights and analysis
- **LLM Processing**:
  - Analyzes overall data quality and patterns
  - Generates meaningful insights about data characteristics
  - Identifies potential data quality issues
  - Provides actionable recommendations
- **Intelligence**: Delivers human-like insights about data patterns and quality

### 🔧 Local Processing Mode (Fallback)

When no OpenAI API key is configured, agents use intelligent local algorithms:

- **Duplicates**: Exact field matching with normalized comparisons
- **Missing Values**: Statistical imputation (median for numbers, mode for categories)
- **Text Normalization**: Rule-based standardization (whitespace, capitalization)
- **Outliers**: IQR-based statistical detection
- **Summary**: Statistical analysis with basic insights

## Configuration

### Setting Up Real LLM Processing

1. **Get an Anthropic API Key**:
   - Visit [https://console.anthropic.com/](https://console.anthropic.com/)
   - Create a new API key
   - Copy the key (starts with "sk-ant-")

2. **Configure the Application**:
   ```bash
   # Option 1: Interactive setup
   npm run setup-llm
   
   # Option 2: Manual setup
   # Create .env.local file with:
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Restart the Development Server**:
   ```bash
   npm run dev
   ```

### Cost Considerations

- Only sends data samples (first 5 rows) to avoid token limits
- Low temperature (0.1) for consistent analysis

## Technical Implementation

### API Integration
- **Safety**: Automatic fallback to local processing if API fails
- **Security**: API keys stored locally, never committed to version control
- **Performance**: Optimized prompts for fast, accurate responses

### Data Handling
- **Privacy**: Only data samples sent to Anthropic (configurable)
- **Type Safety**: Full TypeScript integration with proper error handling
- **Validation**: Response parsing with fallback mechanisms
- **Error Recovery**: Graceful degradation to local processing

### Prompt Engineering
Each agent has specialized system prompts that:
- Define the specific task and expected output format
- Include relevant context about data analysis best practices
- Request structured JSON responses for consistent parsing
- Emphasize accuracy and reasoning in recommendations

## Benefits of Real LLM Integration

1. **Context Awareness**: Understands data meaning, not just structure
2. **Intelligent Reasoning**: Provides explanations for all recommendations
3. **Adaptive Processing**: Adjusts strategies based on data characteristics
4. **Domain Knowledge**: Leverages training on diverse datasets and best practices
5. **Continuous Improvement**: Benefits from ongoing model improvements

## Getting Started

1. **Without API Key**: Start using immediately with intelligent local processing
2. **With API Key**: Configure Anthropic integration for enhanced AI capabilities
3. **Test Both Modes**: Compare results between local and Claude processing
4. **Explore Agents**: Try all five agents on different types of data

The agents are designed to be helpful regardless of configuration, but truly shine when powered by real LLM capabilities!
