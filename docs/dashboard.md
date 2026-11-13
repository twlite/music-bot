# Using the dashboard

Join a Discord voice channel, run `/join`, then `/web` to open your private dashboard link. `/join` creates an empty queue without playing a track. It leaves an existing connected queue alone. `/play` still connects and starts playback directly.

The dashboard controls the same guild queue as slash commands. Other users in that voice channel see changes when they happen. Playback progress advances locally and receives periodic corrections from the bot.

## Queue

Paste a track URL or enter a song name in **Up next**, then click **Add**. The navigation search also supports adding tracks and playlists. Rows show the title, artist, duration and the name/avatar captured for the user who queued the track. Older records that contain only a user ID display **Unknown user**; autoplay tracks have no requester.

Drag a row's handle above another row to change its position, or drop it at the bottom to move it to the end. For keyboard control, focus the handle and press **Alt + Up/Down**. The three-dot menu and right-click context menu provide **Play next**, **Move up**, **Move down**, **Move to end** and **Remove from queue**. Removing an upcoming track does not stop the song currently playing. Edits use track IDs so a stale browser cannot accidentally remove a different item at the same numeric position.

## Playback and seeking

Use the play/pause, previous, next, shuffle, volume and repeat controls below the artwork. Scrub the timeline with the mouse, touch or arrow keys. Seek requests wait 300 milliseconds after your last change; changing tracks cancels a pending seek. Live streams and tracks without a known duration cannot be scrubbed.

## Sound

The **Sound** tab includes the 15-band equalizer, named EQ presets and independent effect switches. Multiple effects can be active together, and changing the EQ does not clear those effects. Settings persist per guild in MongoDB and apply when a queue is recreated.

EQ presets are registered through Discord Player's `AudioFilter.defineBulk` API. Existing custom band settings remain supported. Gains are limited to the range accepted by the bot, including presets with strong bass or treble cuts. **Reset equalizer** flattens the bands and retains active effects.

The dashboard offers effects that preserve track timing. Speed changes, reversal and silence removal are not included because they change how source timestamps relate to playback. Remedia still determines whether a particular graph is supported by its FFmpeg build; a rejected combination produces an error and does not save that combination.

## Lyrics

Open **Lyrics** to look up the playing track through Discord Player's official LRCLIB plugin. When synchronized lyrics are available, the current line is highlighted and scrolls into view as playback advances. Scroll manually to stop automatic following, then click **Follow playback** to resume. Click a synchronized line to seek to its timestamp.

Plain lyrics appear without synchronization when timestamps are unavailable. Instrumentals and some recordings have no lyrics. Lyrics matching depends on the track's title and artist; uploads or poorly labeled provider results may not match. Results are shared between dashboard tabs, tied to the current track and discarded when the playing track changes or its last dashboard client disconnects.
