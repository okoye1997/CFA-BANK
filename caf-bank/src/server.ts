import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { getToken } from "next-auth/jwt";
import type { NextApiRequest } from "next";
import { connectMongo } from "./lib/mongodb";
import { SupportConversation, User } from "./lib/models";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = Number(process.env.PORT || 3000);
async function main() {
  await app.prepare();
  const server = createServer((request, response) => handle(request, response));
  const io = new Server(server, { path: "/socket.io", cors: { origin: process.env.APP_URL || "http://localhost:3000", credentials: true } });
  globalThis.supportIO = io;
  io.use(async (socket, nextMiddleware) => {
    try {
      const rawCookie = socket.request.headers.cookie || "";
      const cookies = Object.fromEntries(rawCookie.split("; ").filter(Boolean).map(pair => { const at = pair.indexOf("="); return [pair.slice(0, at), decodeURIComponent(pair.slice(at + 1))]; }));
      const request = Object.assign(socket.request, { cookies });
      const token = await getToken({ req: request as NextApiRequest, secret: process.env.AUTH_SECRET });
      if (!token?.id) return nextMiddleware(new Error("Unauthorized"));
      await connectMongo();
      const user = await User.findById(token.id).select("role");
      if (!user) return nextMiddleware(new Error("Unauthorized"));
      socket.data.userId = String(user._id);
      socket.data.role = user.role;
      nextMiddleware();
    } catch { nextMiddleware(new Error("Unauthorized")); }
  });
  io.on("connection", socket => {
    socket.join(`user:${socket.data.userId}`);
    socket.on("support:join", async (conversationId: string) => {
      if (!/^[a-f0-9]{24}$/i.test(conversationId)) return;
      await connectMongo();
      const filter = socket.data.role === "ADMIN" ? { _id: conversationId } : { _id: conversationId, userId: socket.data.userId };
      if (await SupportConversation.exists(filter)) socket.join(`support:${conversationId}`);
    });
  });
  server.listen(port, () => console.log(`CAF Bank listening on http://localhost:${port}`));
  if (process.env.CRON_SECRET) {
    const pendingTimer = setInterval(() => {
      fetch(`http://127.0.0.1:${port}/api/jobs/pending-followup`, { method: "POST", headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }).catch(() => {});
    }, 60 * 60_000);
    const emailTimer = setInterval(() => {
      fetch(`http://127.0.0.1:${port}/api/jobs/email`, { method: "POST", headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }).catch(() => {});
    }, 5 * 60_000);
    pendingTimer.unref(); emailTimer.unref();
  }
}
main().catch(error => { console.error(error); process.exit(1); });
