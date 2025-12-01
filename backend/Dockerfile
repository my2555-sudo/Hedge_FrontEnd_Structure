FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (for building some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
 && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
# NOTE: We assume the build context is the Hedge_FrontEnd_Structure directory
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Environment variables
ENV PORT=8000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

# Expose the FastAPI port
EXPOSE 8000

# Start the FastAPI app with Uvicorn
# IMPORTANT: The app is defined in backend/main.py as `app`
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

