import AsyncStorage from "@react-native-async-storage/async-storage";
import { Conversation } from "@/types/aichat";

const STORAGE_KEY = "@orion_ai_conversations";

export class ConversationStorage {
  async saveConversations(conversations: Conversation[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }

  async loadConversations(): Promise<Conversation[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const conversations = await this.loadConversations();
    const index = conversations.findIndex((c) => c.id === conversation.id);

    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    await this.saveConversations(conversations);
  }

  async deleteConversation(id: string): Promise<void> {
    const conversations = await this.loadConversations();
    const filtered = conversations.filter((c) => c.id !== id);
    await this.saveConversations(filtered);
  }

  async archiveConversation(id: string): Promise<void> {
    const conversations = await this.loadConversations();
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      conversation.status = "archived";
      await this.saveConversations(conversations);
    }
  }
}

export const conversationStorage = new ConversationStorage();