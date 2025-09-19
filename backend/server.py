from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

# AI agents
from ai_agents.agents import AgentConfig, SearchAgent, ChatAgent


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AI agents init
agent_config = AgentConfig()
search_agent: Optional[SearchAgent] = None
chat_agent: Optional[ChatAgent] = None

# Main app
app = FastAPI(title="AI Agents API", description="Minimal AI Agents API with LangGraph and MCP support")

# API router
api_router = APIRouter(prefix="/api")


# Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Car models
class Car(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    photo: str  # Base64 encoded image
    hot_votes: int = Field(default=0)
    not_votes: int = Field(default=0)
    total_votes: int = Field(default=0)
    score: float = Field(default=0.0)  # hot_votes / total_votes
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CarUpload(BaseModel):
    photo: str  # Base64 encoded image

class Vote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    car_id: str
    is_hot: bool  # True for "Hot", False for "Not"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class VoteRequest(BaseModel):
    car_id: str
    is_hot: bool

class CarResponse(BaseModel):
    id: str
    photo: str
    hot_votes: int
    not_votes: int
    total_votes: int
    score: float


# AI agent models
class ChatRequest(BaseModel):
    message: str
    agent_type: str = "chat"  # "chat" or "search"
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    success: bool
    response: str
    agent_type: str
    capabilities: List[str]
    metadata: dict = Field(default_factory=dict)
    error: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    max_results: int = 5


class SearchResponse(BaseModel):
    success: bool
    query: str
    summary: str
    search_results: Optional[dict] = None
    sources_count: int
    error: Optional[str] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Car endpoints
@api_router.post("/cars/upload", response_model=CarResponse)
async def upload_car(car_upload: CarUpload):
    """Upload a new car photo"""
    car_data = Car(photo=car_upload.photo)
    car_dict = car_data.dict()
    await db.cars.insert_one(car_dict)

    return CarResponse(**car_dict)

@api_router.get("/cars/random", response_model=CarResponse)
async def get_random_car():
    """Get a random car for voting"""
    pipeline = [{"$sample": {"size": 1}}]
    cars = await db.cars.aggregate(pipeline).to_list(1)

    if not cars:
        raise HTTPException(status_code=404, detail="No cars available")

    return CarResponse(**cars[0])

@api_router.post("/cars/vote")
async def vote_on_car(vote_request: VoteRequest):
    """Vote on a car (Hot or Not)"""
    # Record the vote
    vote_data = Vote(car_id=vote_request.car_id, is_hot=vote_request.is_hot)
    await db.votes.insert_one(vote_data.dict())

    # Update car statistics
    car = await db.cars.find_one({"id": vote_request.car_id})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    # Update vote counts
    if vote_request.is_hot:
        car["hot_votes"] += 1
    else:
        car["not_votes"] += 1

    car["total_votes"] = car["hot_votes"] + car["not_votes"]
    car["score"] = car["hot_votes"] / car["total_votes"] if car["total_votes"] > 0 else 0.0

    # Update in database
    await db.cars.update_one(
        {"id": vote_request.car_id},
        {"$set": {
            "hot_votes": car["hot_votes"],
            "not_votes": car["not_votes"],
            "total_votes": car["total_votes"],
            "score": car["score"]
        }}
    )

    return {"success": True, "message": "Vote recorded"}

@api_router.get("/cars/leaderboard", response_model=List[CarResponse])
async def get_leaderboard(limit: int = 10):
    """Get top cars leaderboard"""
    cars = await db.cars.find().sort("score", -1).limit(limit).to_list(limit)
    return [CarResponse(**car) for car in cars]


# AI agent routes
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    # Chat with AI agent
    global search_agent, chat_agent
    
    try:
        # Init agents if needed
        if request.agent_type == "search" and search_agent is None:
            search_agent = SearchAgent(agent_config)
            
        elif request.agent_type == "chat" and chat_agent is None:
            chat_agent = ChatAgent(agent_config)
        
        # Select agent
        agent = search_agent if request.agent_type == "search" else chat_agent
        
        if agent is None:
            raise HTTPException(status_code=500, detail="Failed to initialize agent")
        
        # Execute agent
        response = await agent.execute(request.message)
        
        return ChatResponse(
            success=response.success,
            response=response.content,
            agent_type=request.agent_type,
            capabilities=agent.get_capabilities(),
            metadata=response.metadata,
            error=response.error
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return ChatResponse(
            success=False,
            response="",
            agent_type=request.agent_type,
            capabilities=[],
            error=str(e)
        )


@api_router.post("/search", response_model=SearchResponse)
async def search_and_summarize(request: SearchRequest):
    # Web search with AI summary
    global search_agent
    
    try:
        # Init search agent if needed
        if search_agent is None:
            search_agent = SearchAgent(agent_config)
        
        # Search with agent
        search_prompt = f"Search for information about: {request.query}. Provide a comprehensive summary with key findings."
        result = await search_agent.execute(search_prompt, use_tools=True)
        
        if result.success:
            return SearchResponse(
                success=True,
                query=request.query,
                summary=result.content,
                search_results=result.metadata,
                sources_count=result.metadata.get("tools_used", 0)
            )
        else:
            return SearchResponse(
                success=False,
                query=request.query,
                summary="",
                sources_count=0,
                error=result.error
            )
            
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        return SearchResponse(
            success=False,
            query=request.query,
            summary="",
            sources_count=0,
            error=str(e)
        )


@api_router.get("/agents/capabilities")
async def get_agent_capabilities():
    # Get agent capabilities
    try:
        capabilities = {
            "search_agent": SearchAgent(agent_config).get_capabilities(),
            "chat_agent": ChatAgent(agent_config).get_capabilities()
        }
        return {
            "success": True,
            "capabilities": capabilities
        }
    except Exception as e:
        logger.error(f"Error getting capabilities: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging config
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Initialize agents on startup
    global search_agent, chat_agent
    logger.info("Starting AI Agents API...")
    
    # Lazy agent init for faster startup
    logger.info("AI Agents API ready!")


@app.on_event("shutdown")
async def shutdown_db_client():
    # Cleanup on shutdown
    global search_agent, chat_agent
    
    # Close MCP
    if search_agent and search_agent.mcp_client:
        # MCP cleanup automatic
        pass
    
    client.close()
    logger.info("AI Agents API shutdown complete.")
