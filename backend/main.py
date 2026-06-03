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

PROMPTS_FILE = os.path.join(os.path.dirname(__file__), "prompts.json")

DEFAULT_PROMPTS = {
    "hooks": "Take in account the hook description, tone and audiece directed towards neatly, should not deviate from that.\nGIVE ME 10 ONE LINER MARKETING HOOKS.\nThe marketing hook is for advertising our website https://machineavatars.com/, make it accordingly, highlight the features of the avatar rather than a plain chatbot, the analytics dashboard and whatever you see fit and that which will make us standout from our competitors. Make it a one-liner that an entrepreneur can relate to.",
    "script": "Requirements:\n- 10–15 seconds ONLY\n- extremely engaging opening\n- conversational, not corporate\n- cinematic pacing\n- social-media optimized\n- short punchy lines\n- emotionally intelligent\n- sound premium and futuristic\n- mention how the avatar improves customer interaction\n- mention analytics/business intelligence subtly\n- imply conversion growth and automation benefits\n- should sound natural when spoken aloud\n- avoid generic AI buzzwords\n- avoid long explanations\n- no scene directions\n- no markdown\n- no labels",
    "keyframes": "Instructions:\n- Generate ONLY the keyframes absolutely necessary for temporal continuity\n- Avoid redundant frames\n- Prioritize cinematic transition anchors\n- Each keyframe should represent a major emotional or visual beat\n- Every frame must be optimized for Higgsfield image generation\n- Hyper realism is mandatory\n- Human physics must remain natural and believable\n- Preserve exact facial identity across all frames\n- Preserve hairstyle consistency\n- Preserve skin texture realism\n- Preserve wardrobe consistency\n- Preserve environment continuity\n- Preserve lighting continuity\n- Vertical 9:16 cinematic reel framing\n- Natural realistic body mechanics\n- Realistic gravity and cloth simulation behavior\n- Realistic cinematic lens behavior\n- Realistic skin light interaction\n- Realistic eye reflections\n- Subtle micro expressions\n- Cinematic commercial-grade composition\n- Real-world camera movement implication\n- Avoid exaggerated poses\n- Avoid animation/cartoon aesthetics entirely\n- Avoid over-stylized diffusion-art look\n- Assume final video will use frame interpolation between these keyframes",
    "storyboard": "Instructions:\n- Generate ONLY the necessary storyboard moments\n- Avoid unnecessary scene changes\n- Prioritize emotional pacing and visual clarity\n- Every scene should help AI video interpolation remain stable\n- Preserve exact avatar identity throughout\n- Preserve wardrobe consistency\n- Preserve environment continuity\n- Preserve lighting consistency\n- Preserve realistic human body mechanics\n- Preserve realistic facial physics\n- Preserve realistic eye movement\n- Preserve realistic breathing and posture behavior\n- Avoid exaggerated poses\n- Avoid animation/cartoon aesthetics entirely\n- The reel should feel premium, modern, intelligent, and emotionally engaging\n- Focus heavily on realism and believable commercial cinematography",
    "videoHook": "Instructions:\n- Hyper realistic human facial movement\n- Ultra realistic lip sync preparation\n- Realistic eye movement\n- Natural micro expressions\n- Realistic breathing\n- Realistic skin texture interaction with light\n- Realistic cloth movement physics\n- Preserve exact facial identity from provided assets\n- Preserve wardrobe consistency\n- Preserve lighting continuity\n- Preserve environmental continuity\n- Vertical 9:16 cinematic reel framing\n- Premium commercial cinematography\n- Realistic handheld or stabilized cinematic motion\n- Natural lens compression\n- Realistic depth of field\n- Social-media optimized pacing\n- Cinematic but believable human movement\n- No animation/cartoon aesthetics\n- No diffusion-art look\n- The reel must feel indistinguishable from real cinema footage\n\nThe hook should:\n- emotionally interrupt scrolling immediately\n- create curiosity within first 2 seconds\n- feel premium and futuristic\n- visually communicate intelligence and conversational AI\n- emphasize realistic AI avatar interaction\n- imply business growth and engagement benefits subtly",
    "videoSpeak": "Requirements:\n- hyper realistic human facial animation\n- ultra realistic lip sync behavior\n- natural micro expressions\n- realistic blinking\n- subtle breathing movement\n- realistic jaw and cheek motion while speaking\n- cinematic vertical reel composition\n- realistic handheld or cinematic stabilized camera motion\n- natural lens compression\n- shallow depth of field\n- realistic lighting interaction on skin\n- cinematic color grading\n- smooth human movement\n- premium commercial aesthetic\n- social-media optimized framing\n- realistic eye focus shifts\n- preserve exact character identity from provided assets\n- preserve wardrobe consistency\n- preserve environment consistency\n- avoid animation/cartoon feel entirely\n- pacing optimized for 10–15 second reels\n- realistic body language matching speech rhythm\n- include camera movement suggestions\n- include emotional atmosphere\n- assume final render is intended for Instagram/TikTok premium ad quality"
}

def get_prompts():
    if not os.path.exists(PROMPTS_FILE):
        with open(PROMPTS_FILE, "w") as f:
            json.dump(DEFAULT_PROMPTS, f, indent=2)
        return DEFAULT_PROMPTS
    try:
        with open(PROMPTS_FILE, "r") as f:
            return json.load(f)
    except:
        return DEFAULT_PROMPTS

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

class OptimizePromptRequest(BaseModel):
    userDirection: str
    globalPrompt: str
    referencesCount: int

class SearchImagesRequest(BaseModel):
    query: str
    limit: Optional[int] = 5


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


# Ordered fallback model list – most stable first
FALLBACK_MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
]


def _get_model_list() -> list:
    """Deduplicated ordered list starting from the configured model."""
    seen = set()
    result = []
    for m in FALLBACK_MODELS:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


def _call_gemini(prompt: str, as_json: bool = True):
    """Try each model in fallback order; raise on all failing."""
    if not gemini_client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server.")

    last_err = None
    for model_name in _get_model_list():
        try:
            logger.info(f"Trying Gemini model: {model_name}")
            cfg = types.GenerateContentConfig(response_mime_type="application/json") if as_json else None
            kwargs = dict(model=model_name, contents=prompt)
            if cfg:
                kwargs["config"] = cfg
            response = gemini_client.models.generate_content(**kwargs)
            if as_json:
                return json.loads(response.text)
            return response.text.strip()
        except Exception as e:
            err_str = str(e)
            # 503 / resource exhausted – try next model
            if "503" in err_str or "UNAVAILABLE" in err_str or "exhausted" in err_str.lower() or "high demand" in err_str.lower():
                logger.warning(f"Model {model_name} unavailable, trying next fallback. Error: {err_str[:120]}")
                last_err = e
                continue
            # Any other error – fail immediately
            logger.error(f"Gemini generation error on {model_name}: {e}")
            raise HTTPException(status_code=500, detail=f"AI generation failed: {err_str}")

    raise HTTPException(status_code=503, detail=f"All Gemini models are currently overloaded. Please retry shortly. Last error: {str(last_err)[:200]}")


# Helper: Gemini JSON Generation
def generate_json(prompt: str) -> dict:
    return _call_gemini(prompt, as_json=True)

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

@app.get("/api/prompts")
def get_prompts_api():
    return get_prompts()

@app.post("/api/prompts")
def update_prompts_api(req: Dict[str, str]):
    current = get_prompts()
    current.update(req)
    with open(PROMPTS_FILE, "w") as f:
        json.dump(current, f, indent=2)
    return {"status": "success"}


@app.post("/api/generate-hooks")
async def generate_hooks(req: GenerateHooksRequest):
    # 1. Create a database page
    project_id = await create_notion_page(req.hook, req.tone, req.audience)
    
    # 2. Run LLM to generate 10 hooks
    master_prompts = get_prompts()
    prompt = f"""{req.hook} {req.tone}

{master_prompts.get("hooks", DEFAULT_PROMPTS["hooks"])}

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
    master_prompts = get_prompts()
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

{master_prompts.get("script", DEFAULT_PROMPTS["script"])}

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
    master_prompts = get_prompts()
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

{master_prompts.get("keyframes", DEFAULT_PROMPTS["keyframes"])}

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
    
    master_prompts = get_prompts()
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

{master_prompts.get("storyboard", DEFAULT_PROMPTS["storyboard"])}

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
    
    master_prompts = get_prompts()
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

{master_prompts.get("videoHook", DEFAULT_PROMPTS["videoHook"])}

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
    master_prompts = get_prompts()
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

{master_prompts.get("videoSpeak", DEFAULT_PROMPTS["videoSpeak"])}

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
    updated_content = _call_gemini(prompt, as_json=False)
        
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


import base64
import traceback

class GenerateImageRequest(BaseModel):
    prompt: str
    aspect_ratio: Optional[str] = "1:1"
    model: Optional[str] = "black-forest-labs/FLUX.1-schnell"


@app.post("/api/generate-image")
async def generate_image(req: GenerateImageRequest):
    """
    Generate an image via Hugging Face Inference API.
    Returns base64-encoded image data.
    """
    try:
        import base64

        model = req.model or "black-forest-labs/FLUX.1-schnell"
        logger.info(f"Generating image via Hugging Face model={model}")

        hf_key = os.getenv("HUGGINGFACE_API_KEY")
        if not hf_key:
            raise HTTPException(status_code=500, detail="HUGGINGFACE_API_KEY is not configured on the server.")

        headers = {
            "Authorization": f"Bearer {hf_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "inputs": req.prompt,
        }

        url = f"https://router.huggingface.co/hf-inference/models/{model}"

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            r = await client.post(url, headers=headers, json=payload)

            if not r.is_success:
                # HF sometimes returns 503 while model is loading, we should bubble this up gracefully
                logger.error(f"Hugging Face image error: {r.status_code} — {r.text[:300]}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Hugging Face returned {r.status_code}: {r.text[:300]}"
                )

            image_bytes = r.content
            content_type = r.headers.get("content-type", "image/jpeg").split(";")[0].strip()
            
            if content_type == "application/json":
                # Handle edge cases where HF returns a success status code but actually returns an error JSON
                err_text = r.text[:200]
                logger.error(f"Hugging Face returned JSON instead of image: {err_text}")
                raise HTTPException(status_code=502, detail=f"Hugging Face error: {err_text}")

        b64_data = base64.b64encode(image_bytes).decode("utf-8")
        return {
            "status": "success",
            "mime_type": content_type,
            "image": f"data:{content_type};base64,{b64_data}",
        }
    except HTTPException:
        raise
    except Exception as e:
        trace_str = traceback.format_exc()
        logger.error(f"Hugging Face image generation error: {e}\n{trace_str}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@app.post("/api/optimize-prompt")
async def optimize_prompt(req: OptimizePromptRequest):
    prompt = f"""You are an expert AI image generation prompt engineer.
    
User Direction:
{req.userDirection}

Global Prompt Aspects to factor in:
{req.globalPrompt}

Number of reference images provided by the user: {req.referencesCount}

Task: Write a highly optimized prompt for a high-end AI image generation model. 
- The prompt should describe the scene clearly based on the user's direction.
- It MUST seamlessly incorporate the style, physics, and constraints from the Global Prompt.
- If reference images are provided ({req.referencesCount}), implicitly suggest referencing the specific subject/assets in those images.
- DO NOT include extra conversational text, just the final prompt.

Return output matching this JSON schema exactly:
{{
  "optimizedPrompt": "string"
}}
"""
    response_json = generate_json(prompt)
    optimized_prompt = response_json.get("optimizedPrompt", "")
    
    return {
        "optimizedPrompt": optimized_prompt
    }

from duckduckgo_search import DDGS

@app.post("/api/search-images")
async def search_images(req: SearchImagesRequest):
    try:
        results = []
        try:
            with DDGS() as ddgs:
                ddgs_images = ddgs.images(
                    keywords=req.query,
                    region="wt-wt",
                    safesearch="moderate",
                    max_results=req.limit,
                )
                for r in ddgs_images:
                    results.append({
                        "title": r.get("title", ""),
                        "image": r.get("image", ""),
                        "thumbnail": r.get("thumbnail", ""),
                        "url": r.get("url", ""),
                        "source": "DuckDuckGo"
                    })
        except Exception as ddg_err:
            logger.warning(f"DDG search failed (possibly ratelimited): {ddg_err}. Falling back to Wikimedia Commons.")
            # Fallback to Wikimedia Commons API
            async with httpx.AsyncClient() as client:
                wiki_url = "https://en.wikipedia.org/w/api.php"
                params = {
                    "action": "query",
                    "format": "json",
                    "prop": "pageimages",
                    "generator": "prefixsearch",
                    "redirects": 1,
                    "formatversion": 2,
                    "piprop": "original|thumbnail",
                    "pithumbsize": 600,
                    "pilimit": req.limit or 10,
                    "gpssearch": req.query,
                    "gpslimit": req.limit or 10
                }
                r = await client.get(wiki_url, params=params)
                if r.is_success:
                    pages = r.json().get("query", {}).get("pages", [])
                    for page in pages:
                        thumbnail = page.get("thumbnail", {}).get("source")
                        original = page.get("original", {}).get("source")
                        if thumbnail or original:
                            results.append({
                                "title": page.get("title", ""),
                                "image": original or thumbnail,
                                "thumbnail": thumbnail or original,
                                "url": f"https://en.wikipedia.org/?curid={page.get('pageid')}",
                                "source": "Wikimedia"
                            })
                            
        return {"images": results}
    except Exception as e:
        logger.error(f"Image search error: {e}")
        raise HTTPException(status_code=500, detail=f"Image search failed: {str(e)}")

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


@app.delete("/api/delete-project/{project_id}")
async def delete_project(project_id: str):
    if not NOTION_API_KEY:
        raise HTTPException(status_code=500, detail="NOTION_API_KEY is not configured on the server.")

    url = f"https://api.notion.com/v1/pages/{project_id}"
    body = {"archived": True}

    async with httpx.AsyncClient() as client:
        try:
            r = await client.patch(url, headers=notion_headers, json=body)
            r.raise_for_status()
            return {"success": True}
        except httpx.HTTPStatusError as e:
            logger.error(f"Notion Delete Error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=502, detail=f"Notion returned error: {e.response.text}")
        except Exception as e:
            logger.error(f"Notion connection error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to connect to Notion: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    # Read port from env or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
