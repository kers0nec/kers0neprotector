FROM golang:1.22-alpine

WORKDIR /app

# Copy source
COPY . .

# Build Go binary
RUN go build -o kers0neprotector

# Install Node for worker.js
RUN apk add --no-cache nodejs npm

# Expose port
EXPOSE 10000

# Run both
CMD ./kers0neprotector & node worker.js
