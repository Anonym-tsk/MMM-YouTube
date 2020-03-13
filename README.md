# MMM-YouTube
MagicMirror module for youtube player with runtime configuration and controllable by notification.

## Feature
- Embedded YouTube Player on MagicMirror
- Load and Play videos dynamically on runtime, not only statically by configuration.
- Almost every YouTube iFrame APIs be supported.
- Controllable by notification and callback
- Controllable by MMM-TelegramBot command

## New Update
**[1.0.4] (2020-03-13)**
- Added width and height to config options to set Youtube window in MM - @andyb2000




## Installation
```js
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-YouTube
```

## Configuration
### Simple Version (Just being ready)
```js
{
  module: "MMM-YouTube",
  position: "top_right",
},
```

### Defaults & Details
You don't need to copy & paste all of these. Just select what you need and rewrite it into your `config.js`. Other values will be applied automatically.
```js
{
  module: "MMM-YouTube",
  position: "top_right",
  config: {
    verbose:true,
    defaultQuality: "default",
    width: "800px",
    height: "600px",
    volume: 100,
    disableCC: true,
    showPlayingOnly: true,
    defaultLoop: false,
    defaultShuffle: false,
    defaultAutoplay: true,
    onStartPlay: null,
    playerVars: {
      controls: 0,
      hl: "en",
      enablejsapi: 1,
      showinfo: 0,
      rel: 0,
      cc_load_policy: 0,
    },
    telegramBotCommand: {
      YOUTUBE_LOAD_BY_URL: "yt",
      YOUTUBE_CONTROL: "yc"
    },
    outNotifications: {
      "-1": "UNSTARTED",
      "0": "ENDED",
      "1": "PLAYING",
      "2": "PAUSED",
      "3": "BUFFERING",
      "5": "VIDEO CUED",
    }
  }
},
```
#### verbose: true
If you set `false`, front-end log will be hidden. When you need to debug, set this field as `true`

#### defaultQuality: "default"
The parameter value can be `small`, `medium`, `large`, `hd720`, `hd1080`, `highres` or `default`. I recommend that you set the parameter value to `default`, which instructs YouTube to select the most appropriate playback quality, which will vary for different users, videos, systems and other playback conditions.
And even if you set other value, it doesn't mean the quality is guaranteed on playing. It could be changed by YouTube by force. Usually, Quality could be changed by player size, network speed, computing power and etc.

> more : https://developers.google.com/youtube/iframe_api_reference#Playback_quality

#### volume: 100
Set youtube player volume on startup (`0` to `100`)

#### disableCC: true
Caption will not be shown with `true`

#### showPlayingOnly: true
with `true`, This module will be appeared only when it is played.

#### defaultLoop: false,
Set default looping status of video(s)

#### defaultShuffle: false,
Set default shuffle status of playlist. This will be applied only when playlist be loaded.

#### defaultAutoplay: true,
Set default autoplay status. If this is set as `false`, video will be loaded but not played automatically.

#### playerVars: {}
Set environment of player.

Some of these parameters might not be working due to YouTube API's limitation.

> more: https://developers.google.com/youtube/player_parameters#Parameters


#### onStartPlay: {}
If you want to play a video from startup of MagicMirror, set the video info here. OR if you don't want, just set as `null`
```js
onStartPlay: {
  type: "id",
  id: "UOxkGD8qRB4",
  shuffle: true,
  loop: false,
  autoplay: true,
}
```
See `VIDEO_LOAD` section also.

#### telegramBotCommand: {}
You can redefine telegramBot commands for this module. Default values are
- `/yt` : load video by url
- `/yl` : load playlist with id
- `/yc` : control video

#### outNotifications: {}
When player status be changed, one of `outNotifications` will be emitted.

I believe you don't need to modify this. You can redefine notification message with this.


## TelegramBot Commands
You can load and control video with MMM-TelegramBot
- `/yt YOUTUBE_URL` : load specific Youtube clip on MagicMirror and play it. (e.g: `/yt https://www.youtube.com/watch?v=6i0a7RDPkM8`)
- `/yl YOUTUBE_PLAYLIST_ID` : load specific Youtube playlist on MagicMirror and play it. (e.g: `/yl PL55713C70BA91BD6E`)
- `/yc CONTROL_COMMAND` : control video. (e.g: `/yc pauseVideo`)
See `Control Commands` section for Available control commands

## Control by notification
You can control video by notification from other module.
e.g)
```js
this.sendNotification("YOUTUBE_LOAD", {type:"id", id:"UOxkGD8qRB4"})
```
### YOUTUBE_LOAD
You can use one of 3 types for loading YouTube video. And these object structure could be used `onStartPlay`.
#### type:id
```js
this.sendNotification("YOUTUBE_LOAD", {
  type: "id", //REQUIRED
  id: "UOxkGD8qRB4", //REQUIRED. YouTube Video Id.
  loop: false, //OPTIONAL
  autoplay: true, //OPTIONAL
})
```
#### type:url
```js
this.sendNotification("YOUTUBE_LOAD", {
  type: "url", //REQUIRED
  id: "https://www.youtube.com/watch?v=UOxkGD8qRB4", //REQUIRED. YouTube Video URL
  loop: false, //OPTIONAL
  autoplay: true, //OPTIONAL
})
```
#### type:playlist
```js
this.sendNotification("YOUTUBE_LOAD", {
  type: "playlist", //REQUIRED
  listType: "playlist", //REQUIRED. "playlist", "search", "user_uploads" be available.
  id: "PL4QNnZJr8sRNKjKzArmzTBAlNYBDN2h-J", //REQUIRED. See description
  index: 0, // OPTIONAL.
  shuffle: false, //OPTIONAL
  loop: false, //OPTIONAL
  autoplay: true, //OPTIONAL
})
```
- `listType:"playlist"` : `id` should be YouTube Playlist Id. (e.g: PL4QNnZJr8sRNKjKzArmzTBAlNYBDN2h-J)
- `listType:"search"` : `id` should be search terms. (e.g: "Michael Jackson")
- `listType:"user_uploads"` : `id` should be user id (e.g: "eouia0819")


### YOUTUBE_CONTROL
You can use most of YouTube iFrame API methods to control the player.
```js
this.sendNotification("YOUTUBE_CONTROL", {
  command: "playVideo"
})

this.sendNotification("YOUTUBE_CONTROL", {
  command: "setVolume",
  params: "60",
})

this.sendNotification("YOUTUBE_CONTROL", {
  command: "getVolume",
  callback: (ret) => {
    console.log("Current volume is", ret)
  }
})
```
Each control command could have these fields.
- `command` : REQUIRED. You can use almost all of YouTube iFrame API
- `param`: OPTIONAL. When parameter is required for the API
- `callback`: OPTIONAL. This callback function will be called after command with result.

#### Available commands
`playVideo`, `pauseVideo`, `nextVideo`, `previousVideo`, `mute`, `unMute`, ...
See https://developers.google.com/youtube/iframe_api_reference#Functions

> KNOWN ISSUE: When you use `stopVideo`, it will not stop the video but replay current video. Use `pauseVideo` instead. I'll fix this someday... Sorry.


## UPDATE HISTORY
**[1.0.3]**
- added: `YOUTUBE_PLAYER_ERROR` (payload:{kind, code}) notification will be emitted on youtube player error.

**[1.0.2]**
- added: `/yl` - `MMM-TelegramBot` command for playing playlist by id

**[1.0.1]**
- added : `youtu.be` URL format is supported.
