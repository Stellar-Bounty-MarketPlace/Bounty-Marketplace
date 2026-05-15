import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  readonly chatModel: string;
  readonly embeddingModel: string;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: config.get<string>('OPENAI_API_KEY'),
    });
    this.chatModel = config.get<string>('OPENAI_CHAT_MODEL', 'gpt-4o');
    this.embeddingModel = config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small');
  }

  async chat(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: Partial<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming>,
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.chatModel,
      messages,
      temperature: 0.2,
      ...options,
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async chatJson<T>(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: Partial<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming>,
  ): Promise<T> {
    const content = await this.chat(messages, {
      response_format: { type: 'json_object' },
      ...options,
    });
    return JSON.parse(content) as T;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: text.slice(0, 8000), // token limit guard
    });
    return response.data[0]?.embedding ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: texts.map((t) => t.slice(0, 8000)),
    });
    return response.data.map((d) => d.embedding);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += (a[i] ?? 0) * (b[i] ?? 0);
      normA += (a[i] ?? 0) ** 2;
      normB += (b[i] ?? 0) ** 2;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }
}
