import type { User } from 'discord.js';
import type { TrackRequester } from '@music-bot/shared';

/** Snapshot public Discord identity when a request is made, without later API lookups. */
export function requester(user: Pick<User, 'id' | 'displayName' | 'displayAvatarURL'>): TrackRequester {
  return {
    id: user.id,
    displayName: user.displayName,
    displayAvatarURL: user.displayAvatarURL(),
  };
}
