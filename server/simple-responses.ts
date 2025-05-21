/**
 * This module provides pre-defined responses for when the OpenAI API is not working
 * To ensure the application can still function.
 */

// Get a response for a user's chat message
export function getChatResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('explain') || lowerMessage.includes('what does')) {
    return "This visualization appears to show data trends that you can explore further. The chart format displays information in a structured way that allows for comparison between different values. If you have specific questions about particular elements in the chart, I'd be happy to help analyze those areas.";
  }
  
  if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
    return "Looking at the visualization, there seem to be some notable patterns in the data. These patterns might indicate relationships between variables or changes over time. To get more specific insights, you could focus on particular data points or regions of the chart that interest you most.";
  }
  
  if (lowerMessage.includes('compare') || lowerMessage.includes('difference')) {
    return "The visualization allows for comparison between different data points or categories. The variations in height, length, or color likely represent meaningful differences in the underlying data. These visual cues help highlight contrasts that might be important for your analysis.";
  }
  
  if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('advice')) {
    return "Based on this visualization, I would recommend looking closely at the most prominent features - the highest points, deepest colors, or largest segments often indicate important information. Also consider how the data is distributed and whether there are any outliers that might need special attention.";
  }
  
  // Default response
  return "I understand you're asking about this visualization. The chart presents data in a visual format that makes patterns and relationships easier to identify. If you have specific questions about particular elements or trends in the chart, feel free to ask and I'll help interpret those aspects.";
}

// Get analysis points for a visualization
export function getVisualizationAnalysis(): { summary: string; points: string[] } {
  return {
    summary: "This visualization appears to display data in a structured format. The visual representation helps identify patterns, trends, and relationships that might not be immediately obvious in raw data.",
    points: [
      "The chart format highlights key information through visual elements like size, position, and color",
      "Look for outliers or unusual patterns that might indicate interesting insights",
      "Consider how different parts of the visualization relate to each other for deeper understanding",
      "The specific context and purpose of this chart can help determine which aspects are most relevant"
    ]
  };
}