"""
Vision-based crowd level detection using OpenAI GPT-4 Vision API
"""
import os
import base64
import json
import re
from openai import OpenAI

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

def analyze_crowd_level(base64_image: str) -> dict:
    """
    Analyze an image to detect crowd density level using GPT-4 Vision
    
    Args:
        base64_image: Base64 encoded image string (may include data URI prefix)
    
    Returns:
        dict: {
            'crowd_level': 'Low' | 'Medium' | 'High',
            'confidence': float (0-100),
            'description': str,
            'error': str (if failed)
        }
    """
    try:
        if not client:
            return {
                "crowd_level": "Unknown",
                "confidence": 0,
                "description": "OpenAI API key not configured",
                "error": "OPENAI_API_KEY not set"
            }
        
        # Remove data URI prefix if present
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
        
        print("🚀 Sending image to OpenAI GPT-4...")
        
        # Call GPT-4 Vision using OpenAI's chat completions API with image_url
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=256,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        },
                        {
                            "type": "text",
                            "text": """Analyze this canteen/dining area image and estimate the crowd density level.
                            
Respond ONLY with valid JSON (no markdown, no code blocks, just pure JSON):
{
  "crowd_level": "Low" or "Medium" or "High",
  "confidence": 0-100,
  "reasoning": "brief explanation of what you see"
}

Guidelines:
- Low: Empty or very few people (less than 20% capacity)
- Medium: Moderate crowd, some empty seats (20-70% capacity)  
- High: Very crowded, hard to find seating (more than 70% capacity)

If image doesn't show a dining area clearly, estimate based on visible crowd density."""
                        }
                    ]
                }
            ]
        )
        
        # Parse the response
        result_text = response.choices[0].message.content
        print(f"🧠 AI Response: {result_text[:100]}...")
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            result_json = json.loads(json_match.group())
            crowd_level = result_json.get("crowd_level", "Unknown")
            
            # Normalize crowd level
            if isinstance(crowd_level, str):
                crowd_level = crowd_level.strip().capitalize()
            
            if crowd_level not in ["Low", "Medium", "High"]:
                crowd_level = "Unknown"
            
            confidence = result_json.get("confidence", 0)
            if isinstance(confidence, str):
                confidence = int(confidence) if confidence.isdigit() else 0
            
            return {
                "crowd_level": crowd_level,
                "confidence": confidence,
                "description": result_json.get("reasoning", ""),
                "error": None
            }
        else:
            print(f"⚠️  Could not parse JSON from response: {result_text}")
            return {
                "crowd_level": "Unknown",
                "confidence": 0,
                "description": result_text,
                "error": "Could not parse response as JSON"
            }
            
    except Exception as e:
        print(f"❌ Vision analysis error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "crowd_level": "Unknown",
            "confidence": 0,
            "description": str(e),
            "error": str(e)
        }