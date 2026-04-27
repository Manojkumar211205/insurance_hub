# Implementation Plan: Insurance API Backend

## Overview

Incremental implementation of the FastAPI backend with MongoDB, JWT auth, and RAG document processing integration. Each task builds on the previous, ending with full wiring.

## Tasks

- [x] 1. Set up project structure and environment
  - Create directories: `routes/`, `models/`, `database/`, `auth/`, `tests/`
  - Create `__init__.py` in each package directory
  - Add `python-dotenv`, `fastapi`, `uvicorn`, `python-jose[cryptography]`, `bcrypt`, `pymongo`, `motor`, `hypothesis`, `pytest`, `httpx`, `mongomock` to `requirements.txt`
  - Create `tests/conftest.py` with Hypothesis profile (`max_examples=100`) and `TestClient` fixture using `mongomock`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Implement Pydantic models
  - [x] 2.1 Create `models/schemas.py` with `UserSignup`, `UserSignin`, `InsuranceEntry`, `InsuranceRecord`
    - All fields required strings; `InsuranceRecord.insurance_obtained` is `list[InsuranceEntry]`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Write property test for Pydantic model validation
    - **Property 10: Missing required fields return HTTP 422**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
    - Generate requests with random missing fields for each model; assert `ValidationError` is raised
    - Tag: `# Feature: insurance-api-backend, Property 10: Missing required fields return HTTP 422`

- [ ] 3. Implement database connection
  - [x] 3.1 Create `database/db.py` with `get_db()`, `get_users_collection()`, `get_insurance_collection()`
    - Load `MONGO_URI` from env; raise `RuntimeError` if absent
    - Use `insurance_mcp` database, `users` and `user_insurance` collections
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Write unit tests for database module
    - Test `RuntimeError` raised when `MONGO_URI` is missing (patch env)
    - Test correct database name (`insurance_mcp`) and collection names
    - _Requirements: 1.4, 2.2, 2.3_

- [ ] 4. Implement JWT utilities
  - [x] 4.1 Create `auth/dependencies.py` with `create_access_token(data)` and `get_current_user(token)`
    - Load `JWT_SECRET`, `JWT_ALGORITHM` (default `HS256`), `ACCESS_TOKEN_EXPIRE_MINUTES` (default `60`) from env
    - `get_current_user` raises `HTTPException(401)` on missing/invalid/expired token
    - Use `python-jose` for encoding/decoding; `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="signin")`
    - _Requirements: 4.5, 5.3, 6.4, 7.7_

  - [x] 4.2 Write unit tests for JWT utilities
    - Test token is signed with correct secret and contains correct `sub`
    - Test expired token raises 401
    - _Requirements: 4.5_

  - [x] 4.3 Write property test for invalid JWT rejection
    - **Property 7: Protected endpoints reject missing or invalid JWTs**
    - **Validates: Requirements 5.3, 6.4, 7.7**
    - Generate random malformed/empty/expired token strings; hit each protected endpoint; assert 401
    - Tag: `# Feature: insurance-api-backend, Property 7: Protected endpoints reject missing or invalid JWTs`

- [ ] 5. Implement auth routes
  - [x] 5.1 Create `routes/auth.py` with `POST /signup` and `POST /signin`
    - Signup: hash password with `bcrypt`, insert into `users`, return 201 with `id` and `username`
    - Signup: return 400 if email already exists
    - Signin: verify email exists and `bcrypt.checkpw` passes; return 200 with JWT; else 401
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

  - [x] 5.2 Write property test for signup creates retrievable user
    - **Property 1: Signup creates a retrievable user**
    - **Validates: Requirements 3.1, 3.4**
    - Generate random `(username, email, password)` → POST /signup → assert 201 + user in DB
    - Tag: `# Feature: insurance-api-backend, Property 1: Signup creates a retrievable user`

  - [ ] 5.3 Write property test for password hashing
    - **Property 2: Passwords are never stored as plaintext**
    - **Validates: Requirements 3.2**
    - Generate random passwords → signup → assert stored value != plaintext and `bcrypt.checkpw` returns True
    - Tag: `# Feature: insurance-api-backend, Property 2: Passwords are never stored as plaintext`

  - [ ] 5.4 Write property test for duplicate email rejection
    - **Property 3: Duplicate email signup is rejected**
    - **Validates: Requirements 3.3**
    - Generate random email → signup twice → assert second call returns 400
    - Tag: `# Feature: insurance-api-backend, Property 3: Duplicate email signup is rejected`

  - [ ] 5.5 Write property test for valid credentials produce a verifiable JWT
    - **Property 4: Valid credentials produce a verifiable JWT**
    - **Validates: Requirements 4.1, 4.2, 4.5**
    - Generate random user → signup → signin with correct creds → assert 200 + JWT decodes with correct `sub`
    - Tag: `# Feature: insurance-api-backend, Property 4: Valid credentials produce a verifiable JWT`

  - [ ] 5.6 Write property test for invalid credentials rejection
    - **Property 5: Invalid credentials are rejected with 401**
    - **Validates: Requirements 4.3, 4.4**
    - Generate random non-existent email or wrong password → POST /signin → assert 401
    - Tag: `# Feature: insurance-api-backend, Property 5: Invalid credentials are rejected with 401`

- [ ] 6. Checkpoint - Ensure all auth tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement insurance routes
  - [ ] 7.1 Create `routes/insurance.py` with `GET /insurance-obtained` and `POST /insurance-obtained`
    - GET: return `insurance_obtained` list for authenticated user; return empty list if no record exists
    - POST: upsert Insurance_Record, append `InsuranceEntry`; return 201 with updated record
    - Both depend on `get_current_user`
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

  - [ ] 7.2 Write property test for insurance entry round-trip
    - **Property 6: Insurance entries round-trip correctly**
    - **Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.3**
    - Generate random user + list of `InsuranceEntry` values → POST each → GET → assert all entries present in order
    - Tag: `# Feature: insurance-api-backend, Property 6: Insurance entries round-trip correctly`

- [ ] 8. Implement document upload route
  - [ ] 8.1 Add `POST /add-insurance` to `routes/insurance.py`
    - Accept `insurance_name: str = Form(...)` and `file: UploadFile = File(...)`
    - Validate file extension against `{.pdf, .docx, .pptx, .txt}`; return 415 if unsupported (do not call `Doc_Processor`)
    - Save file to temp path; call `process_and_store_document(path)` inside `try/finally` to guarantee temp file deletion
    - On `True`: append `InsuranceEntry(insurance_name, today's date)` to user's record; return 201
    - On `False`: return 422
    - Depends on `get_current_user`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 8.2 Write unit tests for document upload
    - Test `Doc_Processor` called with correct temp file path (use `unittest.mock.patch`)
    - Test `Doc_Processor` returning `False` yields HTTP 422
    - Test temp file is deleted after processing (both success and failure paths)
    - _Requirements: 7.2, 7.4, 7.5_

  - [ ] 8.3 Write property test for successful document upload appends entry
    - **Property 8: Successful document upload appends an insurance entry**
    - **Validates: Requirements 7.3, 7.5**
    - Generate random user + supported file content → mock `Doc_Processor=True` → POST /add-insurance → assert entry appended and temp file deleted
    - Tag: `# Feature: insurance-api-backend, Property 8: Successful document upload appends an insurance entry`

  - [ ] 8.4 Write property test for unsupported file type rejection
    - **Property 9: Unsupported file types are rejected before processing**
    - **Validates: Requirements 7.6**
    - Generate random unsupported extensions → POST /add-insurance → assert 415 and `Doc_Processor` never called
    - Tag: `# Feature: insurance-api-backend, Property 9: Unsupported file types are rejected before processing`

- [ ] 9. Wire everything together in `main.py`
  - [ ] 9.1 Create `main.py` that loads `.env`, validates `MONGO_URI` presence, creates `FastAPI` app, and includes both routers
    - `app.include_router(auth_router)` and `app.include_router(insurance_router)`
    - Raise `RuntimeError` at startup if `MONGO_URI` is missing
    - _Requirements: 1.2, 1.3, 1.4_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property-based tests use Hypothesis with `max_examples=100` (set via `conftest.py` profile)
- MongoDB is mocked with `mongomock` in tests; no live Atlas connection required
- `process_and_store_document` is patched via `unittest.mock.patch` in upload tests
- Each property test includes a comment tag referencing its design property number
