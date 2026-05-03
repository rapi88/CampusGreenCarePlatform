.PHONY: front back clean npm-clean npm_clean fclean install

# Run frontend (Expo app)
front:
	@echo "Starting Frontend..."
	cd app && npm start

# Run backend (Node.js server)
back:
	@echo "Starting Backend..."
	cd server && npm run dev

# Install packages for both frontend and backend
install:
	@echo "Installing frontend dependencies..."
	cd app && npm install
	@echo "Installing backend dependencies..."
	cd server && npm install

# Clean build files and caches
clean:
	@echo "Cleaning build artifacts and caches..."
	rm -rf app/.expo
	rm -rf server/dist
	
# Clean node_modules for frontend and backend
npm-clean npm_clean:
	@echo "Cleaning node_modules and package locks..."
	rm -rf app/node_modules app/package-lock.json
	rm -rf server/node_modules server/package-lock.json

# Clean everything (calls clean and npm-clean)
fclean: clean npm_clean
	@echo "Full clean completed."
