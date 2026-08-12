"""AI Expense Tracker — LLM categorization (Stage 3).

Uses the OpenAI SDK pointed at a free OpenAI-compatible proxy.
Configuration via env vars (with working defaults):
  LLM_BASE_URL  (default https://sodeom.com/v1)
  LLM_API_KEY   (default "any" — the proxy requires no key)
  LLM_MODEL     (default mistral-small-latest)

Resilience: real LLM APIs fail. We try tool calling -> JSON parsing -> keyword fallback.
"""

import json
import os
import re
from typing import Dict

from openai import OpenAI

BASE_URL = os.getenv("LLM_BASE_URL", "https://sodeom.com/v1")
API_KEY = os.getenv("LLM_API_KEY", "any")
MODEL = os.getenv("LLM_MODEL", "mistral-small-latest")

CATEGORIES = [
    "groceries", "dining", "transport", "shopping",
    "bills", "entertainment", "health", "subscriptions",
]

# Last-resort fallback if the LLM is down (same idea as the frontend mockup's matcher)
KEYWORDS: Dict[str, list[str]] = {
    "dining": ["coffee", "restaurant", "lunch", "dinner", "chipotle", "pizza", "cafe", "bar"],
    "groceries": ["grocery", "market", "trader", "safeway", "whole foods", "aldi"],
    "transport": ["uber", "lyft", "gas", "shell", "fuel", "transit", "parking", "train"],
    "shopping": ["amazon", "target", "store", "clothes", "shoes", "nike"],
    "bills": ["electric", "water", "internet", "rent", "pg&e", "utility", "phone bill"],
    "subscriptions": ["netflix", "spotify", "subscription", "icloud", "figma", "membership"],
    "entertainment": ["movie", "concert", "game", "steam", "amc", "ticket"],
    "health": ["pharmacy", "cvs", "doctor", "gym", "walgreens", "medicine"],
}

_client = OpenAI(base_url=BASE_URL, api_key=API_KEY, timeout=45, max_retries=1)

_TOOLS = [{
    "type": "function",
    "function": {
        "name": "classify_expense",
        "description": "Assign a category and confidence score to an expense description.",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "enum": CATEGORIES},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "required": ["category", "confidence"],
        },
    },
}]

_SYSTEM_PROMPT = (
    "You categorize personal expenses. Call classify_expense with the category "
    "and a confidence score. Categories: " + ", ".join(CATEGORIES) + "."
)


def _parse_tool_call(message) -> Dict:
    """Extract category/confidence from a tool call, if the model made one."""
    if not message.tool_calls:
        return {}
    args = json.loads(message.tool_calls[0].function.arguments)
    return {"category": args.get("category"), "confidence": args.get("confidence")}


def _parse_json_text(text: str) -> Dict:
    """Fallback: pull the first JSON object out of plain text."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {}
    data = json.loads(match.group())
    return {"category": data.get("category"), "confidence": data.get("confidence")}


def _keyword_match(description: str) -> Dict:
    """Last-resort fallback when the LLM is unreachable."""
    lower = description.lower()
    for category, words in KEYWORDS.items():
        if any(w in lower for w in words):
            return {"category": category, "confidence": 0.6}
    return {"category": "shopping", "confidence": 0.5}


def classify(description: str) -> Dict:
    """Categorize an expense description. Never raises — always returns a result."""
    try:
        response = _client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": description},
            ],
            tools=_TOOLS,
            max_tokens=120,
        )
        message = response.choices[0].message
        result = _parse_tool_call(message) or _parse_json_text(message.content or "")
        if result.get("category") in CATEGORIES:
            result["confidence"] = float(result.get("confidence") or 0.5)
            return result
    except Exception:
        pass  # fall through to keyword matching
    return _keyword_match(description)
