import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Marketing Automation Backend")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys and configuration
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID", "36511ec4-57c6-80a6-80ae-c10ee489a2f5")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not NOTION_API_KEY:
    logger.warning("NOTION_API_KEY is not set.")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set.")

# Configure Gemini client
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Notion API Headers
notion_headers = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# Request / Response Schemas
class GenerateHooksRequest(BaseModel):
    hook: str
    tone: str
    audience: str

class GenerateScriptRequest(BaseModel):
    projectId: str
    selectedHook: str
    hook: str
    tone: str
    audience: str

class GenerateKeyframesRequest(BaseModel):
    projectId: str
    script: str
    selectedHook: str
    hook: str
    tone: str
    audience: str

class KeyframeItem(BaseModel):
    text: str
    image: Optional[str] = None

class GenerateStoryboardRequest(BaseModel):
    projectId: str
    keyframes: List[KeyframeItem]
    script: str
    selectedHook: str
    hook: str
    tone: str
    audience: str

class GenerateVideoHookRequest(BaseModel):
    projectId: str
    storyboard: str
    keyframes: List[KeyframeItem]
    script: str
    selectedHook: str
    hook: str
    tone: str
    audience: str

class GenerateVideoSpeakRequest(BaseModel):
    projectId: str
    script: str
    storyboard: str
    keyframes: List[KeyframeItem]
    videoHookPrompt: str
    selectedHook: str
    hook: str
    tone: str
    audience: str

class EditSectionRequest(BaseModel):
    section: int
    currentContent: str
    editInstruction: str
    tone: str
    audience: str
    selectedHook: Optional[str] = None
    projectId: str


# Helper: Notion property builders
def to_rich_text_property(text: str) -> dict:
    chunks = []
    if text:
        # Notion's limit is 2000 chars per text block
        for i in range(0, len(text), 1900):
            chunks.append({
                "type": "text",
                "text": {
                    "content": text[i:i+1900]
                }
            })
    return {
        "rich_text": chunks
    }

def to_title_property(text: str) -> dict:
    return {
        "title": [
            {
                "type": "text",
                "text": {
                    "content": text or ""
                }
            }
        ]
    }

# Helper: Notion property parsers
def get_rich_text(properties: dict, name: str) -> str:
    prop = properties.get(name, {})
    if not prop:
        return ""
    rich_text = prop.get("rich_text", [])
    return "".join([t.get("plain_text", "") for t in rich_text])

def get_title(properties: dict, name: str) -> str:
    prop = properties.get(name, {})
    if not prop:
        return ""
    title_list = prop.get("title", [])
    return "".join([t.get("plain_text", "") for t in title_list])


# Helper: Gemini JSON Generation
def generate_json(prompt: str) -> dict:
    if not gemini_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server.")
    
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    try:
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# Helper: Notion Page Creator
async def create_notion_page(hook: str, tone: str, audience: str) -> str:
    if not NOTION_API_KEY:
        raise HTTPException(status_code=500, detail="NOTION_API_KEY is not configured on the server.")
    
    url = "https://api.notion.com/v1/pages"
    body = {
        "parent": { "database_id": NOTION_DATABASE_ID },
        "properties": {
            "Hooks": to_title_property(hook),
            "Tone": to_rich_text_property(tone),
            "Audience": to_rich_text_property(audience)
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, headers=notion_headers, json=body)
            r.raise_for_status()
            return r.json()["id"]
        except httpx.HTTPStatusError as e:
            logger.error(f"Notion Page Creation Error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=502, detail=f"Notion returned error: {e.response.text}")
        except Exception as e:
            logger.error(f"Notion connection error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to connect to Notion: {str(e)}")

# Helper: Notion Page Updater
async def update_notion_page(page_id: str, properties: dict):
    if not NOTION_API_KEY:
        raise HTTPException(status_code=500, detail="NOTION_API_KEY is not configured on the server.")
        
    url = f"https://api.notion.com/v1/pages/{page_id}"
    body = { "properties": properties }
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.patch(url, headers=notion_headers, json=body)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Notion Page Update Error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=502, detail=f"Notion returned error: {e.response.text}")
        except Exception as e:
            logger.error(f"Notion connection error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to connect to Notion: {str(e)}")


@app.get("/")
def root():
    return {"status": "ok", "service": "Marketing Automation Backend"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/generate-hooks")
async def generate_hooks(req: GenerateHooksRequest):
    # 1. Create a database page
    project_id = await create_notion_page(req.hook, req.tone, req.audience)
    
    # 2. Run LLM to generate 10 hooks
    prompt = f"""{req.hook} {req.tone}

Take in account the hook description, tone and audiece directed towards neatly, should not deviate from that.
GIVE ME 10 ONE LINER MARKETING HOOKS.
The marketing hook is for advertising our website https://machineavatars.com/, make it accordingly, highlight the features of the avatar rather than a plain chatbot, the analytics dashboard and whatever you see fit and that which will make us standout from our competitors. Make it a one-liner that an entrepreneur can relate to.

Return output matching this JSON schema exactly:
{{
  "marketing_hooks": ["string"]
}}
"""
    response_json = generate_json(prompt)
    hooks = response_json.get("marketing_hooks", [])
    
    # 3. Format and update page in Notion
    formatted_hooks = "\n\n".join([f"{i + 1}. {h}" for i, h in enumerate(hooks)])
    await update_notion_page(project_id, {
        "Marketing Hooks": to_rich_text_property(formatted_hooks)
    })
    
    return {
        "marketingHooks": hooks,
        "projectId": project_id
    }


@app.post("/api/generate-script")
async def generate_script(req: GenerateScriptRequest):
    prompt = f"""You are an elite short-form cinematic ad scriptwriter creating high-retention AI SaaS reels for social media.

Generate ONLY the speaking/dialogue part of a reel.

The script is specifically for:
https://machineavatars.com/

About the platform:
Machine Avatars helps businesses integrate intelligent AI avatars into their websites. These avatars can converse naturally with visitors, qualify leads, answer questions, provide product guidance, capture customer intent, and generate actionable business insights through analytics. The platform combines conversational AI, avatar-based interaction, and business automation to improve engagement and conversion rates.

Selected Hook:
{req.selectedHook}

Tone:
{req.tone}

Audience:
{req.audience}

Requirements:
- 10–15 seconds ONLY
- extremely engaging opening
- conversational, not corporate
- cinematic pacing
- social-media optimized
- short punchy lines
- emotionally intelligent
- sound premium and futuristic
- mention how the avatar improves customer interaction
- mention analytics/business intelligence subtly
- imply conversion growth and automation benefits
- should sound natural when spoken aloud
- avoid generic AI buzzwords
- avoid long explanations
- no scene directions
- no markdown
- no labels

Return ONLY the speaking script.
Return output matching this JSON schema exactly:
{{
  "script": "string"
}}
"""
    response_json = generate_json(prompt)
    script = response_json.get("script", "")
    
    # Update Notion
    await update_notion_page(req.projectId, {
        "Speaking Script Final": to_rich_text_property(script),
        "Selected One-liner": to_rich_text_property(req.selectedHook)
    })
    
    return {
        "script": script
    }


@app.post("/api/generate-keyframe-prompts")
async def generate_keyframe_prompts(req: GenerateKeyframesRequest):
    prompt = f"""You are a cinematic AI storyboard director generating only the absolutely necessary keyframes required for hyper-realistic Higgsfield AI video generation.

Your task is to create ONLY the critical cinematic anchor frames needed for motion interpolation and scene consistency.

The generated frames will later be used as visual reference points for AI video generation.

Context:
- Assets, character references, environments, clothing references, and style references will be separately provided to Higgsfield
- The generated prompts must strongly preserve asset consistency
- Character identity consistency is EXTREMELY important
- Human anatomy, facial structure, movement physics, eye direction, body posture, and cloth behavior must feel indistinguishable from real cinema footage
- Video is intended for premium vertical short-form reel content

Speaking Script:
{req.script}

Selected Hook:
{req.selectedHook}

Tone:
{req.tone}

Audience:
{req.audience}

Instructions:
- Generate ONLY the keyframes absolutely necessary for temporal continuity
- Avoid redundant frames
- Prioritize cinematic transition anchors
- Each keyframe should represent a major emotional or visual beat
- Every frame must be optimized for Higgsfield image generation
- Hyper realism is mandatory
- Human physics must remain natural and believable
- Preserve exact facial identity across all frames
- Preserve hairstyle consistency
- Preserve skin texture realism
- Preserve wardrobe consistency
- Preserve environment continuity
- Preserve lighting continuity
- Vertical 9:16 cinematic reel framing
- Natural realistic body mechanics
- Realistic gravity and cloth simulation behavior
- Realistic cinematic lens behavior
- Realistic skin light interaction
- Realistic eye reflections
- Subtle micro expressions
- Cinematic commercial-grade composition
- Real-world camera movement implication
- Avoid exaggerated poses
- Avoid animation/cartoon aesthetics entirely
- Avoid over-stylized diffusion-art look
- Assume final video will use frame interpolation between these keyframes

For EACH keyframe include:
- shot type
- framing
- camera angle
- lens feel
- lighting
- subject pose
- emotional tone
- environmental consistency
- movement implication

Generate only 4–7 keyframes maximum.

Return output matching this JSON schema exactly:
{{
  "keyframes": [
    {{
      "text": "string"
    }}
  ]
}}
"""
    response_json = generate_json(prompt)
    keyframes_list = response_json.get("keyframes", [])
    
    # Format keyframe string as expected by client: "• Keyframe 1\ntext\n\n• Keyframe 2..."
    formatted_keyframes = "\n\n".join([f"• Keyframe {i + 1}\n{kf.get('text', '')}" for i, kf in enumerate(keyframes_list)])
    
    # Update Notion
    await update_notion_page(req.projectId, {
        "Keyframe Prompts": to_rich_text_property(formatted_keyframes)
    })
    
    return {
        "keyframes": formatted_keyframes
    }


@app.post("/api/generate-storyboard-prompt")
async def generate_storyboard_prompt(req: GenerateStoryboardRequest):
    keyframes_str = "\n".join([f"- {kf.text}" for kf in req.keyframes])
    
    prompt = f"""You are a cinematic AI commercial director creating a hyper-realistic vertical storyboard for Higgsfield AI video generation.

The storyboard is for a premium advertising reel promoting:
https://machineavatars.com/

About the platform:
Machine Avatars allows businesses to integrate highly intelligent AI avatars into their websites. These avatars converse naturally with visitors, answer questions, qualify leads, guide customers, automate interactions, and provide actionable analytics and business insights. The platform combines conversational AI, human-like avatar interaction, and business automation to improve engagement and increase conversions.

Your task:
Generate ONLY the essential cinematic storyboard beats required for producing a highly realistic short-form reel.

The storyboard will later guide:
- Higgsfield image generation
- AI frame interpolation
- cinematic scene continuity
- camera movement planning
- emotional pacing

Speaking Script:
{req.script}

Selected Hook:
{req.selectedHook}

Keyframes:
{keyframes_str}

Tone:
{req.tone}

Audience:
{req.audience}

Instructions:
- Generate ONLY the necessary storyboard moments
- Avoid unnecessary scene changes
- Prioritize emotional pacing and visual clarity
- Every scene should help AI video interpolation remain stable
- Preserve exact avatar identity throughout
- Preserve wardrobe consistency
- Preserve environment continuity
- Preserve lighting consistency
- Preserve realistic human body mechanics
- Preserve realistic facial physics
- Preserve realistic eye movement
- Preserve realistic breathing and posture behavior
- Avoid exaggerated poses
- Avoid animation/cartoon aesthetics entirely
- The reel should feel premium, modern, intelligent, and emotionally engaging
- Focus heavily on realism and believable commercial cinematography

Storyboard should include:
- scene progression
- shot transitions
- emotional progression
- camera movement
- framing
- lighting atmosphere
- movement implication
- pacing guidance
- environmental continuity
- realistic lens behavior
- realistic depth of field
- realistic commercial-grade cinematography

The reel structure should generally follow:
- strong emotional hook
- intelligent product reveal
- avatar interaction
- customer engagement visualization
- business intelligence implication
- premium futuristic atmosphere
- subtle conversion-focused ending

Generate ONLY 4–6 storyboard scenes maximum.

Return output matching this JSON schema exactly:
{{
  "storyboard": "string"
}}

The storyboard field must contain one continuous cinematic text block.
Do not return arrays.
Do not return scene objects.
Do not return nested JSON.
Do not stringify JSON.
Do not wrap in markdown.
"""
    response_json = generate_json(prompt)
    storyboard = response_json.get("storyboard", "")
    
    # Update Notion
    await update_notion_page(req.projectId, {
        "Storyboard Prompt": to_rich_text_property(storyboard)
    })
    
    return {
        "storyboard": storyboard
    }


@app.post("/api/generate-video-generation-hook-prompt")
async def generate_video_generation_hook_prompt(req: GenerateVideoHookRequest):
    keyframes_str = "\n".join([f"- {kf.text}" for kf in req.keyframes])
    
    prompt = f"""You are a cinematic AI commercial director generating hyper-realistic Higgsfield video prompts for the HOOK section of a premium vertical advertising reel.

The reel is promoting:
https://machineavatars.com/

About the platform:
Machine Avatars helps businesses integrate intelligent AI avatars into websites. These avatars naturally converse with visitors, answer questions, qualify leads, guide customer decisions, and generate actionable business insights through analytics and conversational intelligence.

Your task:
Generate ONLY the HOOK SECTION video generation prompts.

The generated prompts will later be used inside Higgsfield AI video generation.

IMPORTANT:
- The hook sequence must be partitioned into cinematic segments of approximately 8–10 seconds each
- Each segment should end ONLY at natural cinematic jump-cut moments
- Segments must be optimized to reduce Higgsfield token usage
- Segment continuity must remain seamless between cuts
- Every segment should feel visually connected when stitched together
- The final reel should feel like a premium cinematic commercial

Context:
Speaking Script:
{req.script}

Selected Hook:
{req.selectedHook}

Storyboard:
{req.storyboard}

Keyframes:
{keyframes_str}

Tone:
{req.tone}

Audience:
{req.audience}

Instructions:
- Hyper realistic human facial movement
- Ultra realistic lip sync preparation
- Realistic eye movement
- Natural micro expressions
- Realistic breathing
- Realistic skin texture interaction with light
- Realistic cloth movement physics
- Preserve exact facial identity from provided assets
- Preserve wardrobe consistency
- Preserve lighting continuity
- Preserve environmental continuity
- Vertical 9:16 cinematic reel framing
- Premium commercial cinematography
- Realistic handheld or stabilized cinematic motion
- Natural lens compression
- Realistic depth of field
- Social-media optimized pacing
- Cinematic but believable human movement
- No animation/cartoon aesthetics
- No diffusion-art look
- The reel must feel indistinguishable from real cinema footage

For EACH segment include:
- duration estimate
- camera movement
- framing
- lens feel
- lighting atmosphere
- emotional tone
- movement implication
- transition implication into next jump cut
- realistic subject movement
- realistic facial behavior
- realistic body mechanics
- environment continuity

The hook should:
- emotionally interrupt scrolling immediately
- create curiosity within first 2 seconds
- feel premium and futuristic
- visually communicate intelligence and conversational AI
- emphasize realistic AI avatar interaction
- imply business growth and engagement benefits subtly

Generate ONLY the segmented Higgsfield video hook part.

Return output matching this JSON schema exactly:
{{
  "videoHookPrompt": "string"
}}
"""
    response_json = generate_json(prompt)
    video_hook = response_json.get("videoHookPrompt", "")
    
    # Update Notion
    await update_notion_page(req.projectId, {
        "Video Prompt Hook Part": to_rich_text_property(video_hook)
    })
    
    return {
        "videoHookPrompt": video_hook
    }


@app.post("/api/generate-video-speaking-part")
async def generate_video_speaking_part(req: GenerateVideoSpeakRequest):
    prompt = f"""You are a cinematic AI video director creating hyper-realistic vertical short-form reels for Higgsfield AI video generation.

Generate ONLY a cinematic video generation prompt for the speaking/dialogue section of the reel.

The generated video will later be synced to separately provided voice audio, so all facial movement, lip movement, pacing, eye movement, breathing, and expression timing must feel naturally aligned for realistic speech delivery.

Context:
- The speaking script will already exist
- Assets, character references, environments, and style references will be provided separately to Higgsfield
- The generated prompt must strongly preserve asset consistency
- The avatar/person must maintain identical facial structure, hairstyle, skin texture, clothing identity, and proportions across the full sequence
- Video must feel indistinguishable from real cinematic camera footage

Speaking Script:
{req.script}

Requirements:
- hyper realistic human facial animation
- ultra realistic lip sync behavior
- natural micro expressions
- realistic blinking
- subtle breathing movement
- realistic jaw and cheek motion while speaking
- cinematic vertical reel composition
- realistic handheld or cinematic stabilized camera motion
- natural lens compression
- shallow depth of field
- realistic lighting interaction on skin
- cinematic color grading
- smooth human movement
- premium commercial aesthetic
- social-media optimized framing
- realistic eye focus shifts
- preserve exact character identity from provided assets
- preserve wardrobe consistency
- preserve environment consistency
- avoid animation/cartoon feel entirely
- pacing optimized for 10–15 second reels
- realistic body language matching speech rhythm
- include camera movement suggestions
- include emotional atmosphere
- assume final render is intended for Instagram/TikTok premium ad quality

The output should ONLY contain the Higgsfield cinematic video generation prompt.
Return output matching this JSON schema exactly:
{{
  "script": "string"
}}
"""
    response_json = generate_json(prompt)
    video_speak = response_json.get("script", "")
    
    # Update Notion
    await update_notion_page(req.projectId, {
        "Video Prompt Speaking Part": to_rich_text_property(video_speak)
    })
    
    return {
        "videoSpeakingPrompt": video_speak
    }


@app.post("/api/edit-section")
async def edit_section(req: EditSectionRequest):
    prompt = f"""Current:
{req.currentContent}

User Modification Request:
{req.editInstruction}

Modify ONLY according to the user request.
"""
    
    # Non-structured response from Gemini
    if not gemini_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server.")
        
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    try:
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        updated_content = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
        
    # Update in Notion based on the section index
    columns = {
        0: "Marketing Hooks",
        1: "Speaking Script Final",
        2: "Keyframe Prompts",
        3: "Storyboard Prompt",
        4: "Video Prompt Hook Part",
        5: "Video Prompt Speaking Part"
    }
    
    col_name = columns.get(req.section)
    if not col_name:
        raise HTTPException(status_code=400, detail="Invalid section ID")
        
    await update_notion_page(req.projectId, {
        col_name: to_rich_text_property(updated_content)
    })
    
    return {
        "updatedContent": updated_content
    }


@app.get("/api/get-projects")
async def get_projects():
    if not NOTION_API_KEY:
        raise HTTPException(status_code=500, detail="NOTION_API_KEY is not configured on the server.")
        
    url = f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query"
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, headers=notion_headers, json={})
            r.raise_for_status()
            results = r.json().get("results", [])
        except httpx.HTTPStatusError as e:
            logger.error(f"Notion Database Query Error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=502, detail=f"Notion returned error: {e.response.text}")
        except Exception as e:
            logger.error(f"Notion connection error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to connect to Notion: {str(e)}")
            
    projects = []
    for page in results:
        properties = page.get("properties", {})
        pid = page.get("id")
        
        title = get_title(properties, "Hooks") or "Untitled"
        hook = get_title(properties, "Hooks")
        tone = get_rich_text(properties, "Tone")
        audience = get_rich_text(properties, "Audience")
        selected_hook = get_rich_text(properties, "Selected One-liner")
        script = get_rich_text(properties, "Speaking Script Final")
        
        # Marketing Hooks splitting logic
        marketing_hooks_str = get_rich_text(properties, "Marketing Hooks")
        marketing_hooks = []
        if marketing_hooks_str:
            s = marketing_hooks_str.strip()
            # Remove leading numbers if present, e.g. "1. Hook" -> "Hook"
            if re.match(r'^\d+\.\s', s):
                s = re.sub(r'^\d+\.\s', '', s)
            parts = re.split(r'\n+\d+\.\s', s)
            marketing_hooks = [p.strip() for p in parts if p.strip()]
            
        # Keyframe splitting logic
        keyframes_str = get_rich_text(properties, "Keyframe Prompts")
        keyframes = []
        if keyframes_str:
            parts = keyframes_str.split("• ")
            keyframes = [{"text": p.strip(), "image": None} for p in parts if p.strip()]
            
        storyboard = get_rich_text(properties, "Storyboard Prompt")
        video_hook = get_rich_text(properties, "Video Prompt Hook Part")
        video_speak = get_rich_text(properties, "Video Prompt Speaking Part")
        
        projects.append({
            "id": pid,
            "title": title,
            "hook": hook,
            "tone": tone,
            "audience": audience,
            "selectedHook": selected_hook,
            "script": script,
            "marketingHooks": marketing_hooks,
            "keyframes": keyframes,
            "storyboard": storyboard,
            "videoHook": video_hook,
            "videoSpeak": video_speak
        })
        
    return {
        "projects": projects
    }


if __name__ == "__main__":
    import uvicorn
    # Read port from env or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
