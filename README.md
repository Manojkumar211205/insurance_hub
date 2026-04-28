<div align="center">

# 🛡️ Insurance Hub

**A Raw Python Autonomous AI Agent — No LangChain, No LangGraph, No Frameworks**

Built from scratch using pure Python with MCP protocol, custom RAG pipeline, and multi-agent orchestration.

[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](#)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](#)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?logo=elasticsearch&logoColor=white)](#)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blueviolet)](#)

### 🎬 [Watch the Demo Video →](https://youtu.be/HTbAmvw2KjQ)

</div>

---

## 📊 Problem Statement

<p align="center">
  <img src="assets/problem_statement.png" alt="Insurance Management Problems" width="700"/>
</p>

Managing insurance is **broken** for most people today:

| # | Problem |
|:-:|---------|
| 1 | Many individuals hold **multiple insurance policies** (health, life, motor) from different providers — making it hard to manage in one place |
| 2 | When a real-life situation occurs (hospitalization, accident), users face **confusion deciding which policy** is most suitable |
| 3 | **No centralized system** exists to compare multiple owned policies and recommend the best option based on the situation |
| 4 | Users lack proper knowledge of **insurance terms, coverage details, and claim conditions** — leading to poor decisions |
| 5 | Insurance information is **fragmented across companies and platforms**, making it hard to access and compare |
| 6 | Reliance on **manual customer support** increases costs and delays response time |
| 7 | No system provides **real-time, personalized recommendations** based on user profile and current situation |
| 8 | No **intelligent feedback mechanism** that learns from interactions to improve suggestions over time |
| 9 | Users are **unable to maximize benefits** of policies they already own |
| 10 | There is a need for an **intelligent, centralized insurance hub** that can analyze policies, understand queries conversationally, and provide accurate recommendations |

---

## 💡 Our Solution — How Insurance Hub Solves These Problems

<p align="center">
  <img src="assets/solution_overview.png" alt="Insurance Hub Solution" width="700"/>
</p>

Insurance Hub is a **raw Python autonomous AI agent** (no LangChain, no frameworks) that solves each problem:

| Problem | How We Solve It |
|---------|----------------|
| Multiple scattered policies | **Centralized dashboard** — upload all policies to one platform, view them in user profile |
| Confusion during emergencies | **Coverage Check Agent** — compares all your policies in parallel and recommends the best one for your situation |
| No comparison system | **Multi-index RAG search** — searches across all uploaded policy documents simultaneously |
| Lack of insurance knowledge | **Conversational AI** — explains terms, coverage, and claim procedures in plain language |
| Fragmented information | **Elasticsearch hybrid search** — all policy documents indexed and searchable with BM25 + vector search |
| Manual support delays | **Autonomous agent** — instant responses 24/7, handles suggestions, claims, coverage checks autonomously |
| No personalization | **Profile-aware recommendations** — collects user profile (age, income, dependents) and tailors suggestions |
| No learning mechanism | **Persistent MongoDB memory** — remembers past conversations and builds on previous interactions |
| Underutilized benefits | **Proactive coverage analysis** — suggests which policy to claim based on your specific situation |
| Need for intelligent hub | **This is it** — MCP-orchestrated multi-agent system with RAG, guardrails, and structured logging |

---

## 🏗️ System Architecture

> **Note:** This is a **raw Python agent** — all agent logic, ReAct loops, tool orchestration, memory management, and RAG pipelines are implemented from scratch without any AI agent framework.

```mermaid
graph TB
    subgraph Client["🖥️ Frontend — React + Vite + Tailwind"]
        LOGIN["Login / Signup"]
        SETUP["Insurance Setup"]
        UPLOAD["Document Upload"]
        CHAT["AI Chat Interface"]
        PROFILE["User Profile Modal"]
    end

    subgraph API["⚡ FastAPI Backend"]
        AUTH["Auth Router<br/>/signup · /signin"]
        INS["Insurance Router<br/>/insurance-obtained<br/>/user-profile · /feedbacks<br/>/claim-requests<br/>/insurance-applications"]
        AGENT["Agent Router<br/>POST /agent/chat"]
    end

    subgraph Guards["🔒 Guardrails Layer"]
        GI["Input Filter<br/>• Injection detection<br/>• Fraud keywords<br/>• Toxic language<br/>• Out-of-scope"]
        GO["Output Filter<br/>• Over-promise replace<br/>• Hallucination redact<br/>• Disclaimer append"]
    end

    subgraph Core["🧠 Main Agent — Raw Python ReAct Loop"]
        LOOP["ReAct Controller<br/>• Parse LLM output<br/>• TOOL_CALL → call tool<br/>• REPLY → return to user<br/>• Max 5 iterations"]
        LLM["LLM Interface<br/>NVIDIA NeMo / Llama 3.3<br/>Multi-key rotation"]
        MEM["Memory Manager<br/>MongoDB: main_agent_memory"]
        LOG["Structured Logger<br/>→ logs/app.log<br/>Rotating 5MB × 5"]
    end

    subgraph MCP_Server["🔧 MCP Server — stdio JSON-RPC"]
        T1["🔍 suggest_insurance"]
        T2["📋 claim_procedure"]
        T3["⚖️ check_coverage"]
        T4["📦 fetch_user_insurance"]
        T5["💬 store_user_feedback"]
        T6["📝 store_claim_request"]
        T7["📄 new_insurance_application"]
    end

    subgraph Agents["🤖 Specialised Sub-Agents"]
        SA["Insurance Suggestion<br/>• 4-phase conversation<br/>• Profile collection<br/>• Query decomposition<br/>• Parallel RAG search"]
        CA["Claim Process<br/>• Index matching<br/>• RAG retrieval<br/>• Step formatting"]
        CC["Coverage Check<br/>• Multi-index parallel<br/>• Iterative refinement<br/>• Sufficiency evaluation"]
    end

    subgraph RAG["📄 RAG Pipeline"]
        DOC["Doc Processing<br/>PDF · DOCX · PPTX · TXT"]
        CHUNK["Text Chunking<br/>1000 chars / 200 overlap"]
        EMB["Sentence Transformers<br/>BAAI/bge-base-en-v1.5"]
    end

    subgraph Data["💾 Data Layer"]
        MONGO[("MongoDB Atlas")]
        ES[("Elasticsearch 8.x<br/>Hybrid Search")]
    end

    Client --> API
    AGENT --> GI --> LOOP
    LOOP <--> LLM
    LOOP <--> MEM
    LOOP <--> LOG
    LOOP <-->|"stdio"| MCP_Server
    LOOP --> GO
    T1 --> SA
    T2 --> CA
    T3 --> CC
    T4 & T5 & T6 & T7 --> MONGO
    SA & CA & CC --> ES
    SA & CA & CC --> LLM
    SA --> MONGO
    DOC --> CHUNK --> EMB --> ES
    INS & AUTH --> MONGO

    style Client fill:#1a1a2e,stroke:#e94560,color:#fff
    style API fill:#16213e,stroke:#0f3460,color:#fff
    style Guards fill:#2c003e,stroke:#e94560,color:#fff
    style Core fill:#0f3460,stroke:#533483,color:#fff
    style MCP_Server fill:#533483,stroke:#e94560,color:#fff
    style Agents fill:#2c003e,stroke:#e94560,color:#fff
    style RAG fill:#16213e,stroke:#533483,color:#fff
    style Data fill:#1a1a2e,stroke:#0f3460,color:#fff
```

---

## 🔄 Advanced RAG Pipeline — With Iterative Refinement & Query Decomposition

This is **not a simple retrieve-and-answer pipeline**. Our RAG system uses **query decomposition**, **iterative refinement loops**, and **sufficiency validation** to ensure high-quality answers:

```mermaid
graph TD
    subgraph Ingestion["📥 Document Ingestion (One-time)"]
        A["📄 Insurance PDF / DOCX / PPTX / TXT"] --> B["Text Extraction<br/>PyPDF2 / python-docx / python-pptx"]
        B --> C["Chunking<br/>1000 chars, 200 overlap"]
        C --> D["Embedding<br/>BAAI/bge-base-en-v1.5"]
        D --> E[("Elasticsearch Index<br/>text + dense_vector")]
    end

    subgraph QueryPhase["🔍 Query Phase — Iterative RAG Loop"]
        F["🧑 User Query"] --> G["Query Decomposition<br/>LLM generates 2-3<br/>focused sub-queries<br/>(eligibility, benefits,<br/>premium, exclusions)"]
        G --> H["Sub-Query 1"]
        G --> I["Sub-Query 2"]
        G --> J["Sub-Query 3"]

        H & I & J --> K["Parallel Hybrid Search<br/>BM25 keyword + kNN vector<br/>across multiple indexes"]
        E --> K
        K --> L["Top-K Chunks<br/>(deduplicated)"]
    end

    subgraph Validation["✅ Sufficiency Validation Loop"]
        L --> M{"Evaluator LLM:<br/>Is content sufficient<br/>to answer the query?"}
        M -->|"YES ✅"| N["Summarise per Index"]
        M -->|"NO ❌ (max 3 retries)"| O["Refine Query<br/>LLM generates improved<br/>search query"]
        O --> K
    end

    subgraph Answer["🎯 Final Answer Generation"]
        N --> P["Combine All<br/>Index Summaries"]
        P --> Q["Decision LLM<br/>+ User Profile<br/>+ Conversation History"]
        Q --> R["📋 Final Personalised<br/>Recommendation"]
    end

    style A fill:#533483,stroke:#e94560,color:#fff
    style E fill:#0f3460,stroke:#533483,color:#fff
    style F fill:#e94560,stroke:#533483,color:#fff
    style G fill:#533483,stroke:#e94560,color:#fff
    style M fill:#e94560,stroke:#0f3460,color:#fff
    style O fill:#533483,stroke:#e94560,color:#fff
    style R fill:#e94560,stroke:#533483,color:#fff
```

### RAG Techniques Used

| Technique | Where | Purpose |
|-----------|-------|---------|
| **Query Decomposition** | `insurance_suggestion_agent` | Breaks user intent into 2-3 focused sub-queries (eligibility, benefits, cost, exclusions) |
| **Parallel Multi-Index Search** | `coverage_check_agent`, `insurance_suggestion_agent` | Searches multiple insurance indexes concurrently via `ThreadPoolExecutor` |
| **Hybrid Search (BM25 + kNN)** | `rag_system.py` | Combines keyword matching with semantic vector similarity for better relevance |
| **Iterative Query Refinement** | `coverage_check_agent` | If retrieved content is insufficient, LLM generates a refined query (up to 3 retries) |
| **Sufficiency Evaluation** | `coverage_check_agent` | Evaluator LLM decides if results are good enough before proceeding |
| **Per-Index Summarisation** | `coverage_check_agent` | Each index's results are summarised before final decision |
| **Profile-Aware Context** | `insurance_suggestion_agent` | User profile (age, income, dependents) is injected into the final LLM context |

---

## 🔄 Agent Decision Flow (ReAct Loop)

```mermaid
sequenceDiagram
    participant U as 🧑 User
    participant FE as React Frontend
    participant GI as 🔒 Input Guardrail
    participant MA as 🧠 Main Agent
    participant LLM as LLM (NVIDIA)
    participant MCP as MCP Server
    participant Tool as Sub-Agent / DB
    participant GO as 🔒 Output Guardrail
    participant LOG as 📝 Logger

    U->>FE: Types message
    FE->>MA: POST /agent/chat + JWT
    MA->>LOG: Log: user message received
    MA->>GI: check_input(message)

    alt 🚫 Blocked (fraud/injection/toxic)
        GI-->>MA: blocked + canned response
        MA->>LOG: Log: input blocked (reason)
        MA-->>FE: Safe canned response
    else ✅ Allowed
        GI-->>MA: allowed
    end

    MA->>MA: Load memory from MongoDB

    loop ReAct Loop (max 5 iterations)
        MA->>LLM: Prompt + tools + history
        MA->>LOG: Log: ReAct iteration N
        LLM-->>MA: Response

        alt TOOL_CALL
            MA->>LOG: Log: tool call (name, args)
            MA->>MCP: call_tool(name, args)
            MCP->>Tool: Execute
            Tool-->>MCP: Result
            MCP-->>MA: Result text
            MA->>LOG: Log: tool result (length)
            Note over MA: Append to history, continue
        else REPLY
            MA->>GO: clean_output(reply)
            GO-->>MA: Sanitised reply
            MA->>LOG: Log: agent reply sent
            MA->>MA: Save memory
            MA-->>FE: Final reply
            FE-->>U: Display in chat
        end
    end
```

---

## 🔒 Guardrails System

The agent has **keyword-based input and output safety filters** — a fast, deterministic first layer of protection:

### Input Guardrails (block before LLM)

| Category | Action | Examples |
|----------|--------|---------|
| **Prompt Injection** | Block + safe reply | "ignore instructions", "jailbreak", "bypass rules" |
| **Fraud Intent** | Block + safe reply | "fake claim", "insurance fraud", "false documents" |
| **Toxic Language** | Block + safe reply | "stupid bot", "shut up", "useless bot" |
| **Out-of-Scope** | Block + safe reply | "movie recommendation", "hack wifi", "crypto trading" |

### Output Guardrails (sanitise after LLM)

| Layer | Action | Examples |
|-------|--------|---------|
| **Over-Promising** | Replace phrase | "guaranteed return" → "potential return" |
| **Hallucinated Offers** | Redact | "secret insurance" → "[information not verified]" |
| **Sensitive Claims** | Append disclaimer | Detects "legal advice" → adds ⚠️ disclaimer |

---

## 📝 Structured Logging

All actions are logged to both **console** and **rotating log file** (`logs/app.log`, 5 MB × 5 backups):

```
2026-04-29 01:18:33 │ INFO     │ main_agent │ chat_with_agent:121 │ Tool call | user=abc123 | tool=suggest_insurance | args={...}
2026-04-29 01:18:34 │ INFO     │ main_agent │ chat_with_agent:127 │ Tool result | tool=suggest_insurance | length=342 chars
2026-04-29 01:18:35 │ WARNING  │ guardrails.input_filter │ check_input:86 │ Input BLOCKED | reason=injection | keyword='ignore instructions'
```

| Event | Level | Module |
|-------|-------|--------|
| User message received | `INFO` | `main_agent` |
| Guardrail block | `WARNING` | `guardrails.input_filter` |
| Output sanitised | `INFO` | `guardrails.output_filter` |
| Tool call (name + args) | `INFO` | `main_agent` |
| Tool result | `INFO` / `DEBUG` | `main_agent` |
| RAG search iteration | `INFO` | `agents.*` |
| Errors (with traceback) | `ERROR` | all modules |

---

## 🤖 MCP Tools Reference

| Tool | Parameters | Purpose |
|------|-----------|---------|
| `suggest_insurance` | `user_message` | Multi-turn recommendation with profile collection & parallel RAG |
| `claim_procedure` | `user_message` | Step-by-step claim guide via RAG search |
| `check_coverage` | `index_names`, `user_query` | Compare coverage across policies with iterative refinement |
| `fetch_user_insurance` | — | Retrieve all user's policies |
| `store_user_feedback` | `rating`, `comment` | Record feedback (1-5 rating) |
| `store_claim_request` | `insurance_name`, `claim_description`, `claim_amount` | Submit claim request |
| `new_insurance_application` | `insurance_type`, `applicant_age`, `reason` | Apply for new policy |

> **Note:** `user_id` is auto-injected by the main agent — the LLM never handles it.

---

## 📂 Project Structure

```
ragworksProject/
├── main.py                      # FastAPI app entry point
├── main_agent.py                # 🧠 Core ReAct agent (raw Python, no frameworks)
├── mcp_server.py                # 🔧 MCP tool server (stdio transport)
│
├── rag/                         # 📄 RAG Pipeline
│   ├── rag_system.py            #   Elasticsearch hybrid search (BM25 + kNN)
│   ├── doc_processing.py        #   Text extraction + chunking
│   └── doc_uploader.py          #   File/directory upload utilities
│
├── agents/                      # 🤖 Specialised sub-agents
│   ├── insurance_suggestion_agent.py
│   ├── claim_process.py
│   ├── coverage_check_agent.py
│   ├── user_details.py
│   └── prompts/                 #   Centralised prompt templates
│       └── prompts.py
│
├── guardrails/                  # 🔒 Safety filters
│   ├── keywords.py              #   All keyword lists
│   ├── input_filter.py          #   Pre-LLM input checking
│   └── output_filter.py         #   Post-LLM output sanitisation
│
├── services/
│   ├── llms.py                  # NVIDIA LLM client + key rotation
│   └── logger.py                # Centralized logging config
│
├── routes/
│   ├── auth.py                  # Signup / Signin (JWT)
│   └── insurance.py             # Insurance CRUD + memory + profile
│
├── auth/
│   └── dependencies.py          # JWT token creation & validation
│
├── database/
│   └── db.py                    # MongoDB collection accessors
│
├── models/
│   └── schemas.py               # Pydantic models
│
├── logs/                        # 📝 Auto-generated log files
│   └── app.log
│
├── frontEnd/                    # 🖥️ React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── components/          #   Login, Signup, Setup, AddInsurance, Chat
│       └── services/api.ts      #   Axios + JWT interceptor
│
├── tests/
│   └── test_main_agent.py       # 18 unit tests + conversation replay
│
├── assets/                      # README images
├── requirements.txt
└── .env                         # Environment variables (not committed)
```

---

## ⚙️ Setup & Installation

### Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Python | 3.12+ | Backend |
| Node.js | 18+ | Frontend |
| MongoDB Atlas | — | Data storage |
| Elasticsearch | 8.x | RAG search |
| NVIDIA API Key(s) | — | LLM inference |

### 1. Clone & Install

```bash
git clone https://github.com/Manojkumar211205/insurance_hub.git
cd insurance_hub

# Backend
python -m venv myenv
myenv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontEnd
npm install
cd ..
```

### 2. Configure `.env`

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
nvidiaKey1=nvapi-xxxxxxxxxxxx
nvidiaKey2=nvapi-xxxxxxxxxxxx
```

### 3. Start Elasticsearch

```bash
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.12.0
```

### 4. Upload Insurance Documents

```python
from rag.doc_uploader import upload_file
upload_file("Health Insurance Research bajaj.pdf", "bajaj_health_insurance")
```

### 5. Run

```bash
# Terminal 1 — Backend
python -m uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontEnd
npm run dev
```

| Service | URL |
|---------|-----|
| Backend | `http://127.0.0.1:8000` |
| Frontend | `http://localhost:5173` |
| API Docs | `http://127.0.0.1:8000/docs` |

---

## 🔑 API Endpoints

### Authentication

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/signup` | `{username, email, password}` |
| POST | `/signin` | `{email, password}` → JWT token |

### Agent

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/agent/chat` | 🔒 | `{user_message}` |

### Insurance Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/insurance-obtained` | 🔒 | List user's policies |
| POST | `/insurance-obtained` | 🔒 | Add entry manually |
| POST | `/add-insurance` | 🔒 | Upload & process document |
| GET | `/insurance-available` | — | List all products |
| GET | `/user-profile` | 🔒 | User details + insurances |
| GET | `/feedbacks` | 🔒 | User feedbacks |
| GET | `/claim-requests` | 🔒 | User claims |
| GET | `/insurance-applications` | 🔒 | User applications |
| DELETE | `/clear-memory` | 🔒 | Clear conversation memory |

---

## 🧪 Testing

```bash
pip install pytest pytest-asyncio
python -m pytest tests/test_main_agent.py -v
```

18 unit tests covering tool calls, memory persistence, error handling, guardrails, and a full 9-turn conversation replay.

---

## 💡 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Raw Python agent (no LangChain)** | Full control over agent loop, memory, tool calls — no framework abstractions or overhead |
| **MCP protocol** | Decouples tools from agent; tools can be updated without touching agent logic |
| **ReAct loop (5 iterations)** | Multi-step reasoning with bounded execution |
| **Iterative RAG refinement** | Up to 3 retries with refined queries ensures high-quality retrieval |
| **Query decomposition** | Single user query → 2-3 focused sub-queries for better coverage |
| **Keyword guardrails** | Fast, deterministic safety layer before/after LLM |
| **Centralized prompts** | All prompts in `agents/prompts/prompts.py` for easy tuning |
| **Structured logging** | Every action logged to rotating file for debugging & audit |
| **Parallel RAG search** | `ThreadPoolExecutor` for concurrent multi-index search |
| **Auto user_id injection** | Security — LLM never sees or handles user IDs |

---

## 📊 MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `users` | User accounts |
| `user_insurance` | Purchased policies |
| `insurance_available` | Product catalog |
| `main_agent_memory` | Main agent history |
| `suggestion_memory` | Suggestion agent sessions |
| `coverage_check_memory` | Coverage agent memory |
| `user_feedbacks` | Feedback records |
| `user_claim_requests` | Claim requests |
| `insurance_applications` | New applications |

---

## 📜 License

This project is for educational and demonstration purposes.

---

<div align="center">
  <sub>Built from scratch with ❤️ — Raw Python Agent + React + FastAPI + MCP + Elasticsearch + NVIDIA LLMs</sub>
</div>
