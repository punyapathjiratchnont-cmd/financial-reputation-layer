import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// หมายเหตุ: การใช้งาน Supabase MCP แบบ Remote ต้องติดตั้ง @ai-sdk/mcp
// และเปิดใช้งาน Client เพื่อดึง Tools ออกมาใช้งาน

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  /*
  // ตัวอย่างการเชื่อมต่อ Supabase MCP ด้วย Vercel AI SDK (แบบเต็ม)
  import { createMCPClient } from '@ai-sdk/mcp';
  
  const mcpClient = await createMCPClient({
    url: 'https://mcp.supabase.com/mcp', // URL ของ Supabase Remote MCP
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`
    }
  });
  
  const supabaseTools = await mcpClient.getTools();
  */

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    // tools: supabaseTools, // ใส่ tools ที่ได้จาก MCP ตรงนี้
    system: "คุณคือผู้ช่วยจัดการฐานข้อมูล Supabase (Supabase MCP Assistant) หากผู้ใช้งานสอบถามเกี่ยวกับฐานข้อมูล ให้ตอบกลับพร้อมคำแนะนำ (นี่คือแอปพลิเคชันที่สร้างด้วย Vercel AI SDK)",
  });

  return result.toTextStreamResponse();
}
