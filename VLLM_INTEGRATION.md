# 🚀 vLLM Integration Guide

DataLab now supports **vLLM** as a local AI processing backend, giving you full control over your AI models while maintaining data privacy and reducing costs.

## 🎯 **What is vLLM?**

vLLM is a high-performance inference engine for large language models. When integrated with DataLab, it provides:

- **🔒 Privacy**: All data processing happens locally
- **💰 Cost-Effective**: No per-token API charges
- **⚡ Performance**: Optimized inference with batching and caching
- **🎛️ Control**: Choose your own models and parameters
- **📊 Scalability**: Handle large datasets without API rate limits

## 🛠️ **Setup Guide**

### Step 1: Install vLLM

```bash
# Install vLLM (requires Python 3.8+)
pip install vllm

# For CUDA support (recommended for GPU acceleration)
pip install vllm[cuda]
```

### Step 2: Start vLLM Server

```bash
# Basic setup with Phi-3 model (recommended for data analysis)
python -m vllm.entrypoints.openai.api_server \
  --model microsoft/Phi-3-mini-4k-instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --served-model-name phi-3-mini

# Alternative: Llama 3.1 8B model (more capable, requires more memory)
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Meta-Llama-3.1-8B-Instruct \
  --host 0.0.0.0 \
  --port 8000 \
  --served-model-name llama-3.1-8b
```

### Step 3: Configure DataLab

Add to your `.env.local` file:

```env
# vLLM Configuration
VLLM_ENDPOINT_URL=http://localhost:8000
VLLM_MODEL_NAME=microsoft/Phi-3-mini-4k-instruct

# Optional: Disable other AI backends
ANTHROPIC_API_KEY=""
```

### Step 4: Verify Setup

1. Start your vLLM server
2. Start DataLab: `npm run dev`
3. Upload data and interact with agents
4. Check the console logs for "Using vLLM endpoint for data processing"

## 📋 **Supported Models**

### Recommended Models for Data Analysis

| Model | Size | Memory Required | Best For |
|-------|------|-----------------|----------|
| **Phi-3-mini-4k-instruct** | 3.8B | 8GB RAM | General data analysis, fast inference |
| **Phi-3-small-8k-instruct** | 7B | 16GB RAM | Enhanced reasoning, complex analysis |
| **Llama-3.1-8B-Instruct** | 8B | 16GB RAM | Advanced analysis, code generation |
| **Mistral-7B-Instruct** | 7B | 14GB RAM | Balanced performance and capability |

### Model Selection Guidelines

- **Phi-3-mini**: Best for quick analysis, low resource usage
- **Phi-3-small**: Good balance of capability and speed
- **Llama-3.1-8B**: Most capable, requires more resources
- **Mistral-7B**: European alternative, good multilingual support

## ⚙️ **Advanced Configuration**

### GPU Acceleration

```bash
# For NVIDIA GPUs
python -m vllm.entrypoints.openai.api_server \
  --model microsoft/Phi-3-mini-4k-instruct \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.8 \
  --host 0.0.0.0 \
  --port 8000
```

### Multiple GPU Setup

```bash
# For multi-GPU systems
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Meta-Llama-3.1-8B-Instruct \
  --tensor-parallel-size 2 \
  --host 0.0.0.0 \
  --port 8000
```

### CPU-Only Mode

```bash
# For CPU-only systems (slower but works everywhere)
python -m vllm.entrypoints.openai.api_server \
  --model microsoft/Phi-3-mini-4k-instruct \
  --device cpu \
  --host 0.0.0.0 \
  --port 8000
```

### Custom Parameters

```bash
# Fine-tuned parameters for data analysis
python -m vllm.entrypoints.openai.api_server \
  --model microsoft/Phi-3-mini-4k-instruct \
  --max-model-len 4096 \
  --max-num-batched-tokens 8192 \
  --max-num-seqs 256 \
  --host 0.0.0.0 \
  --port 8000
```

## 🔧 **DataLab Configuration Options**

### Environment Variables

```env
# Required
VLLM_ENDPOINT_URL=http://localhost:8000

# Optional
VLLM_MODEL_NAME=microsoft/Phi-3-mini-4k-instruct  # Default model name
VLLM_TIMEOUT=30000                                 # Request timeout in ms
VLLM_MAX_TOKENS=2000                              # Max tokens per response
VLLM_TEMPERATURE=0.1                              # Temperature for consistency
```

### Docker Setup

```dockerfile
# Dockerfile.vllm
FROM vllm/vllm-openai:latest

# Pre-download model
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download('microsoft/Phi-3-mini-4k-instruct')"

# Expose port
EXPOSE 8000

# Start vLLM server
CMD ["python", "-m", "vllm.entrypoints.openai.api_server", \
     "--model", "microsoft/Phi-3-mini-4k-instruct", \
     "--host", "0.0.0.0", \
     "--port", "8000"]
```

### Docker Compose

```yaml
# docker-compose.vllm.yml
version: '3.8'
services:
  vllm:
    build:
      context: .
      dockerfile: Dockerfile.vllm
    ports:
      - "8000:8000"
    environment:
      - CUDA_VISIBLE_DEVICES=0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface

  datalab:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VLLM_ENDPOINT_URL=http://vllm:8000
      - VLLM_MODEL_NAME=microsoft/Phi-3-mini-4k-instruct
    depends_on:
      - vllm
```

## 🎪 **Agent Capabilities with vLLM**

### Enhanced Data Analysis

With vLLM integration, DataLab agents provide:

- **Intelligent Duplicate Detection**: Semantic similarity analysis
- **Smart Missing Value Handling**: Context-aware imputation strategies
- **Advanced Text Normalization**: Understanding of text patterns and context
- **Sophisticated Outlier Detection**: Reasoning about anomalies
- **Comprehensive Insights**: Natural language explanations of findings

### Example Agent Interactions

```
User: "Find duplicates in my customer data"

vLLM Agent: "I've analyzed your customer dataset and found 23 potential 
duplicates based on semantic similarity. For example, 'John Smith' and 
'J. Smith' with the same email appear to be the same person. I recommend 
merging records with >90% similarity scores."
```

## 🚨 **Troubleshooting**

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if vLLM server is running
   curl http://localhost:8000/v1/models
   ```

2. **Out of Memory**
   ```bash
   # Use smaller model or reduce batch size
   --max-num-batched-tokens 4096
   ```

3. **Slow Inference**
   ```bash
   # Enable GPU acceleration
   --tensor-parallel-size 1
   ```

4. **Model Not Found**
   ```bash
   # Pre-download the model
   python -c "from transformers import AutoTokenizer; AutoTokenizer.from_pretrained('microsoft/Phi-3-mini-4k-instruct')"
   ```

### Debug Mode

Enable debug logging in DataLab:

```env
VLLM_DEBUG=true
NODE_ENV=development
```

## 📊 **Performance Comparison**

| Backend | Speed | Privacy | Cost | Setup Complexity |
|---------|--------|---------|------|------------------|
| **vLLM** | ⚡⚡⚡ | 🔒🔒🔒 | 💰 | ⚙️⚙️⚙️ |
| **Claude** | ⚡⚡ | 🔒 | 💰💰💰 | ⚙️ |
| **Local** | ⚡ | 🔒🔒🔒 | 💰 | - |

## 🎯 **Best Practices**

1. **Model Selection**: Start with Phi-3-mini for testing, upgrade for better capability
2. **Resource Planning**: Ensure adequate GPU memory for your chosen model
3. **Monitoring**: Watch GPU utilization and memory usage
4. **Caching**: Use persistent model cache to avoid re-downloading
5. **Security**: Run vLLM on internal networks only

## 🔮 **Future Enhancements**

Planned vLLM integration improvements:

- **Model Hot-Swapping**: Switch models without restart
- **Auto-Scaling**: Dynamic model loading based on workload
- **Fine-Tuning Support**: Custom models for specific data types
- **Batch Processing**: Optimize for large dataset processing
- **Distributed Inference**: Multi-node vLLM clusters

---

**Ready to get started?** Follow the setup guide above and experience the power of local AI processing with DataLab! 🚀
