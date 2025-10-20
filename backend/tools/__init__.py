"""Custom Tool Functions

All custom tools for agents are defined here.
"""

from typing import Dict, Any, Callable


def calculate_stats(input_data: Any) -> Dict[str, Any]:
    """Calculate statistical metrics for a list of numbers.

    Args:
        input_data: List of numbers or comma-separated string

    Returns:
        Dict with count, sum, mean, min, max
    """
    # Parse input
    if isinstance(input_data, dict):
        numbers = input_data.get("numbers", [])
    elif isinstance(input_data, str):
        try:
            numbers = [float(x.strip()) for x in input_data.split(",")]
        except:
            return {"error": "Could not parse numbers"}
    else:
        numbers = input_data

    if not numbers:
        return {"error": "No numbers provided"}

    return {
        "count": len(numbers),
        "sum": sum(numbers),
        "mean": sum(numbers) / len(numbers),
        "min": min(numbers),
        "max": max(numbers),
        "range": max(numbers) - min(numbers),
    }


def sentiment_analyzer(input_data: Any) -> Dict[str, Any]:
    """Analyze sentiment of text (simple word-based implementation).

    Args:
        input_data: Text to analyze

    Returns:
        Dict with sentiment classification and scores
    """
    text = str(input_data).lower()

    positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "love", "happy", "joy"]
    negative_words = ["bad", "terrible", "awful", "horrible", "hate", "sad", "angry", "disappointing"]

    positive_count = sum(1 for word in positive_words if word in text)
    negative_count = sum(1 for word in negative_words if word in text)

    if positive_count > negative_count:
        sentiment = "positive"
        score = positive_count - negative_count
    elif negative_count > positive_count:
        sentiment = "negative"
        score = negative_count - positive_count
    else:
        sentiment = "neutral"
        score = 0

    return {
        "sentiment": sentiment,
        "score": score,
        "positive_count": positive_count,
        "negative_count": negative_count,
        "text_length": len(text),
        "word_count": len(text.split()),
    }


def web_scraper(input_data: Any) -> Dict[str, Any]:
    """Scrape content from a URL (placeholder implementation).

    Args:
        input_data: URL to scrape

    Returns:
        Dict with scraped content
    """
    # TODO: Implement actual web scraping
    # This is a placeholder - implement with requests + BeautifulSoup
    url = str(input_data)
    return {
        "url": url,
        "status": "not_implemented",
        "message": "Web scraping not yet implemented. Add your implementation here."
    }


def get_all_tools() -> Dict[str, Callable]:
    """Get all registered tool functions.

    Returns:
        Dict mapping tool names to callable functions
    """
    return {
        "calculate_stats": calculate_stats,
        "sentiment_analyzer": sentiment_analyzer,
        "web_scraper": web_scraper,
    }
