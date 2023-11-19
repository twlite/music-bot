import { app } from '#bot/web/index';

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
  console.log(`Web server listening on port: *${PORT}`);
});
