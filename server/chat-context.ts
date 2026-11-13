import type { Message, Visualization } from "@shared/schema";

type ChatStorage = {
  getVisualizationsByProjectGroup(group: string): Promise<Visualization[]>;
  getMessagesByVisualization(id: number): Promise<Message[]>;
};

// Read existing records only. A chart group shares its saved conversation
// without moving, deleting, or rewriting messages belonging to any chart.
export async function loadChatContext(storage: ChatStorage, visualization: Visualization) {
  const group = visualization.projectGroup
    ? await storage.getVisualizationsByProjectGroup(visualization.projectGroup)
    : [visualization];
  const charts = group.filter(chart => chart.userId === visualization.userId);
  const histories = await Promise.all(charts.map(chart => storage.getMessagesByVisualization(chart.id)));
  const messages = histories.flat().sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id - b.id);
  return { charts, messages };
}
