# Requirements Document

## Introduction

A FastAPI backend for an insurance platform that handles user authentication and insurance record management. The API connects to a MongoDB database (`insurance_mcp`) for user and insurance data, and integrates with an existing RAG pipeline (`doc_processing.py` + `rag_system.py`) to process and store uploaded insurance documents in Elasticsearch for vector search.

## Glossary

- **API**: The FastAPI application serving all HTTP endpoints
- **Auth_Service**: The component responsible for user signup and signin logic
- **User**: A registered account stored in the `users` MongoDB collection
- **Insurance_Service**: The component responsible for managing insurance records
- **Insurance_Record**: A document in the `user_insurance` collection with fields `userid` and `insurance_obtained`
- **Insurance_Entry**: A single insurance item within `insurance_obtained`, containing `insurance_name` and `insurance_date`
- **Doc_Processor**: The `process_and_store_document` function from `doc_processing.py`
- **RAG_System**: The `RAGSystem` class from `rag_system.py` used for Elasticsearch-backed vector storage
- **JWT**: JSON Web Token used for stateless authentication
- **MongoDB**: The primary database (`insurance_mcp`) accessed via `MONGO_URI` from the `.env` file

---

## Requirements

### Requirement 1: Project Structure

**User Story:** As a developer, I want a well-organized project structure, so that the codebase is maintainable and scalable.

#### Acceptance Criteria

1. THE API SHALL organize code into separate modules: `routes/`, `models/`, and `database/`
2. THE API SHALL load environment variables from a `.env` file at startup
3. THE API SHALL expose a single entry point via `main.py`
4. IF the `MONGO_URI` environment variable is missing at startup, THEN THE API SHALL raise a configuration error and exit

---

### Requirement 2: Database Connection

**User Story:** As a developer, I want a managed MongoDB connection, so that all routes share a single database client.

#### Acceptance Criteria

1. THE API SHALL connect to MongoDB using the `MONGO_URI` value from the `.env` file
2. THE API SHALL use the database named `insurance_mcp`
3. THE API SHALL expose a `users` collection and a `user_insurance` collection to route handlers
4. IF the MongoDB connection fails at startup, THEN THE API SHALL log the error and raise an exception

---

### Requirement 3: User Signup

**User Story:** As a new user, I want to register an account, so that I can access the insurance platform.

#### Acceptance Criteria

1. WHEN a `POST /signup` request is received with `username`, `email`, and `password`, THE Auth_Service SHALL create a new User in the `users` collection
2. THE Auth_Service SHALL store passwords as bcrypt hashes, never as plaintext
3. IF a `POST /signup` request is received with an `email` that already exists in the `users` collection, THEN THE Auth_Service SHALL return HTTP 400 with a descriptive error message
4. WHEN a User is successfully created, THE Auth_Service SHALL return HTTP 201 with the new user's `id` and `username`

---

### Requirement 4: User Signin

**User Story:** As a registered user, I want to sign in, so that I can receive an access token for authenticated requests.

#### Acceptance Criteria

1. WHEN a `POST /signin` request is received with `email` and `password`, THE Auth_Service SHALL verify the credentials against the `users` collection
2. WHEN credentials are valid, THE Auth_Service SHALL return HTTP 200 with a signed JWT access token
3. IF the `email` is not found in the `users` collection, THEN THE Auth_Service SHALL return HTTP 401 with a descriptive error message
4. IF the `password` does not match the stored hash, THEN THE Auth_Service SHALL return HTTP 401 with a descriptive error message
5. THE Auth_Service SHALL sign JWT tokens using a secret key loaded from the `.env` file

---

### Requirement 5: Retrieve Insurance Records

**User Story:** As an authenticated user, I want to retrieve my insurance records, so that I can view all insurance policies I have obtained.

#### Acceptance Criteria

1. WHEN a `GET /insurance-obtained` request is received with a valid JWT, THE Insurance_Service SHALL return the `insurance_obtained` list for the authenticated User from the `user_insurance` collection
2. IF no Insurance_Record exists for the authenticated User, THEN THE Insurance_Service SHALL return an empty list with HTTP 200
3. IF the JWT is missing or invalid on a `GET /insurance-obtained` request, THEN THE Insurance_Service SHALL return HTTP 401

---

### Requirement 6: Create Insurance Record Entry

**User Story:** As an authenticated user, I want to manually add an insurance entry, so that I can record a policy without uploading a document.

#### Acceptance Criteria

1. WHEN a `POST /insurance-obtained` request is received with a valid JWT and a body containing `insurance_name` and `insurance_date`, THE Insurance_Service SHALL append a new Insurance_Entry to the authenticated User's `insurance_obtained` list in the `user_insurance` collection
2. IF no Insurance_Record exists for the authenticated User, THEN THE Insurance_Service SHALL create a new Insurance_Record before appending the Insurance_Entry
3. WHEN the Insurance_Entry is successfully saved, THE Insurance_Service SHALL return HTTP 201 with the updated Insurance_Record
4. IF the JWT is missing or invalid on a `POST /insurance-obtained` request, THEN THE Insurance_Service SHALL return HTTP 401

---

### Requirement 7: Upload and Process Insurance Document

**User Story:** As an authenticated user, I want to upload an insurance document, so that its contents are extracted and stored for search.

#### Acceptance Criteria

1. WHEN a `POST /add-insurance` request is received with a valid JWT, an `insurance_name` field, and a file upload, THE Insurance_Service SHALL save the uploaded file to a temporary location on disk
2. WHEN the file is saved, THE Insurance_Service SHALL call `Doc_Processor` with the saved file path to extract, chunk, and index the document into Elasticsearch via the RAG_System
3. WHEN `Doc_Processor` returns `True`, THE Insurance_Service SHALL append a new Insurance_Entry (with `insurance_name` and the current date as `insurance_date`) to the authenticated User's Insurance_Record in the `user_insurance` collection
4. IF `Doc_Processor` returns `False`, THEN THE Insurance_Service SHALL return HTTP 422 with an error message indicating the document could not be processed
5. THE Insurance_Service SHALL delete the temporary file after `Doc_Processor` completes, regardless of success or failure
6. IF the uploaded file format is not one of `.pdf`, `.docx`, `.pptx`, or `.txt`, THEN THE Insurance_Service SHALL return HTTP 415 without calling `Doc_Processor`
7. IF the JWT is missing or invalid on a `POST /add-insurance` request, THEN THE Insurance_Service SHALL return HTTP 401

---

### Requirement 8: Data Models

**User Story:** As a developer, I want well-defined Pydantic models, so that request and response payloads are validated automatically.

#### Acceptance Criteria

1. THE API SHALL define a `UserSignup` model with fields: `username` (string), `email` (string), `password` (string)
2. THE API SHALL define a `UserSignin` model with fields: `email` (string), `password` (string)
3. THE API SHALL define an `InsuranceEntry` model with fields: `insurance_name` (string), `insurance_date` (string)
4. THE API SHALL define an `InsuranceRecord` model with fields: `userid` (string), `insurance_obtained` (list of `InsuranceEntry`)
5. IF a request body is missing a required field, THEN THE API SHALL return HTTP 422 with a validation error describing the missing field
