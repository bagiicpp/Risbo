FROM oven/bun:1-alpine

WORKDIR /app

# Copy the package files (including bun.lock for exact versions)
COPY package.json bun.lock ./
RUN bun install

# Copy the rest of the frontend code
COPY . .

EXPOSE 5173

# Run Vite using bun
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]