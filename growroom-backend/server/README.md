# Grow Room Dashboard Server

This is the backend server for the Grow Room Dashboard application. It is built using Node.js and TypeScript, and it interacts with a MySQL database to manage and control multiple grow rooms.

## Project Structure

- **src/**: Contains the source code for the server.
  - **controllers/**: Contains the controllers that handle incoming requests and responses.
  - **routes/**: Contains the routing configuration for the API endpoints.
  - **services/**: Contains the business logic for interacting with the database and controlling the grow rooms.
  - **db/**: Contains the database connection configuration.
  - **models/**: Contains the data models for the grow rooms and sensors.
  - **migrations/**: Contains documentation and scripts for database migrations.
  - **types/**: Contains TypeScript types and interfaces used throughout the backend application.

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the server directory:
   ```
   cd growroom-dashboard/server
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Configure the database connection in the `.env` file based on the `.env.example`.

5. Run the server:
   ```
   npm start
   ```

## API Endpoints

The server exposes various API endpoints for managing grow rooms and their sensor data. Refer to the routes defined in `src/routes/rooms.ts` for detailed information on available endpoints.

## Database

The server uses MySQL as the database. The schema can be found in the `sql/schema.sql` file, and initial data can be seeded using the `sql/seed.sql` file.

## License

This project is licensed under the MIT License.