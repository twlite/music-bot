export default function logReady(client: { user: { tag: string } }) {
  console.log(`Logged in as ${client.user.tag}`);
}
