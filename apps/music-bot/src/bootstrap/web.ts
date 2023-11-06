import { publicProcedure, router } from '#bot/web/trpc';
import { createHTTPServer } from '@trpc/server/adapters/standalone';

const appRouter = router({
  ping: publicProcedure.query(async () => {
    return 'pong';
  }),
});

const server = createHTTPServer({
  router: appRouter,
});

const { port } = server.listen(Number(process.env.TRPC_PORT));

console.log(`TRPC server listening on port: *${port}`);

export type AppRouter = typeof appRouter;
