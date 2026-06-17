.PHONY: front front-android front-android-emulator front-ios back clean npm-clean npm_clean fclean install

ANDROID_HOME ?= $(HOME)/Library/Android/sdk
ANDROID_SDK_ROOT ?= $(ANDROID_HOME)
ANDROID_AVD ?= Medium_Phone_API_36.1
ADB ?= $(ANDROID_HOME)/platform-tools/adb
JAVA_HOME ?= $(HOME)/.jdk/jdk-21.0.8/jdk-21.0.8+9/Contents/Home
export ANDROID_HOME
export ANDROID_SDK_ROOT
export JAVA_HOME
export PATH := $(JAVA_HOME)/bin:$(ANDROID_HOME)/platform-tools:$(ANDROID_HOME)/emulator:$(ANDROID_HOME)/cmdline-tools/latest/bin:$(PATH)

# Run frontend (Expo app)
front:
	@echo "Starting Frontend..."
	cd app && npm run dev

# Install and run the Android development build
front-android:
	@echo "Installing Android development build..."
	cd app && npm run android:dev-build

# Start the Android emulator used for local development
front-android-emulator:
	@echo "Starting Android emulator ($(ANDROID_AVD))..."
	@if $(ADB) devices | grep -q '^emulator-.*device'; then \
		echo "Android emulator is already running."; \
	else \
		$(ANDROID_HOME)/emulator/emulator -avd $(ANDROID_AVD); \
	fi

# Install and run the iOS development build
front-ios:
	@echo "Installing iOS development build..."
	cd app && npm run ios:dev-build

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
