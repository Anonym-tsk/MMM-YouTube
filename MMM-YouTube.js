Module.register("MMM-YouTube", {
  defaults: {
    playerVars: {
      controls: 0,
      hl: "en",
      enablejsapi: 1,
      showinfo: 0,
      rel: 0,
      cc_load_policy: 0,
    },
    defaultQuality: "default",
    disableCC: true,
    showPlayingOnly: true,
    onStartPlay: null,
    defaultLoop: false,
    defaultShuffle: false,
    defaultAutoplay: true,
    verbose:true,
    telegramBotCommand: {
      YOUTUBE_LOAD_BY_URL: "yt",
      YOUTUBE_LOAD_PLAYLIST: "yl",
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
  },

  getStyles: function() {
    return ["MMM-YouTube.css"]
  },

  start: function() {
    this.isYoutubeReady = false
    this.YTPlayer = null
    this.suspended = false
    this.list = false
    this.videoLoop = this.config.defaultLoop
    this.videoShuffle = this.config.defaultShuffle
    this.videoAutoplay = this.config.defaultAutoplay

  },
  getCommands: function(commander) {
    commander.add({
      command: this.config.telegramBotCommand.YOUTUBE_LOAD_BY_URL,
      description: "Play youtube clip by url",
      callback: "T_yt"
    })
    commander.add({
      command: this.config.telegramBotCommand.YOUTUBE_LOAD_PLAYLIST,
      description: "Play youtube playlist by ID",
      callback: "T_yl"
    })
    commander.add({
      command: this.config.telegramBotCommand.YOUTUBE_CONTROL,
      description: "Youutube player control - https://developers.google.com/youtube/iframe_api_reference#Functions",
      callback: "T_yc"
    })
  },

  T_yt: function(command, handler) {
    if (handler.args) {
      this.loadVideo({type:"url", id:handler.args, autoplay:true})
    } else {
      this.loadVideo(this.config.onStartPlay)
    }
  },

  T_yl: function(command, handler) {
    if (handler.args) {
      this.loadVideo({type:"playlist", id:handler.args, autoplay:true})
    } else {
      this.loadVideo(this.config.onStartPlay)
    }
  },

  T_yc: function(command, handler) {
    if (!handler.args) {
      handler.reply("TEXT", "E: Action Required.")
      return
    }
    var param = handler.args.split(" ")
    var ret = this.controlPlayer(param[0], param[1])
    if (ret) handler.reply("TEXT", ret.toString())
  },



  getDom: function () {
    var dom = document.createElement("div")
    dom.id = "YOUTUBE"
    if (this.config.showPlayingOnly) dom.style.display = "none"
    var player = document.createElement("div")
    player.id = "YOUTUBE_PLAYER"
    dom.appendChild(player)
    return dom
  },

  suspend: function () {
    this.suspended = true
    var ret = this.controlPlayer("getPlayerState")
    if (ret == 1) {
      this.controlPlayer("pauseVideo")
    }
  },

  resume: function () {
    this.suspended = false
    var ret = this.controlPlayer("getPlayerState")
    if (ret == 1) {
      this.controlPlayer("playVideo")
    }
  },

  notificationReceived: function (noti, payload) {
    if (noti == "DOM_OBJECTS_CREATED") {
      this.prepare()
    }
    if (noti == "YOUTUBE_LOAD") {
      this.loadVideo(payload)
    }
    if (noti == "YOUTUBE_CONTROL") {
      /*
        {
          command: "playVideo",
          param: {},
          callback: (ret)=<{}
        }
      */
      var ret = this.controlPlayer(payload.command, payload.param)
      if (typeof payload.callback == "function") payload.callback(ret)
    }
  },

  loadVideo: function(payload) {
    var option = {}
    var method = ""
    if (!payload) return false
    if (typeof payload.id == "undefined") return false
    this.list = false
    if (payload.type == "id") {
      option = {videoId: payload.id}
      method = "VideoById"
    } else if (payload.type == "url") {
      var regulateURL = (url) => {
        var regex = new RegExp(/[\/?&]v((=|\/)([^?&#\/]*)|\?|\/|&|#|$)/)
        var results = regex.exec(url)
        if (!results) {
          var shortener = new RegExp(/youtu\.be\/(.+)$/)
          var ret = shortener.exec(url)
          if (!ret) return null
          if (ret[1]) return ret[1]
          return null
        }
        if (!results[3]) return null
        return decodeURIComponent(results[3].replace(/\+/g, ' '));
      }
      var regulated = regulateURL(payload.id)
      if (regulated) {
        option = {mediaContentUrl: `http://www.youtube.com/v/${regulated}?version=3`}
        method = "VideoByUrl"
      } else {
        return false
      }

    } else if (payload.type == "playlist") {
      this.list = true
      option = {
        list: payload.id,
        listType: (payload.listType) ? payload.listType : "playlist",
        index: (payload.index) ? payload.index : 0,
      }
      method = "Playlist"
    } else {
      return false
    }
    option.suggestedQuality = this.config.defaultQuality

    var fn = "cue" + method
    this.videoLoop = (payload.hasOwnProperty("loop"))
      ? payload.loop : this.config.defaultLoop
    this.videoShuffle = (payload.hasOwnProperty("shuffle"))
      ? payload.shuffle : this.config.defaultShuffle
    this.videoAutoplay = (payload.hasOwnProperty("autoplay"))
      ? payload.autoplay : this.config.defaultAutoplay
    this.controlPlayer(fn, option)
  },

  controlPlayer: function(command, param=null) {
    if (this.config.verbose) console.log("[YOUTUBE] Control:", command, param)
    if (!this.YTPlayer || !command) return false
    if (typeof this.YTPlayer[command] == "function") {
      var ret = this.YTPlayer[command](param)
      if (ret && ret.constructor.name == "Y") ret = null
      return ret
    }
  },

  prepare: function() {
    var tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    var firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    window.onYouTubeIframeAPIReady = () => {
      this.isYoutubeReady = true
      if (this.config.verbose) console.log("[YOUTUBE] API is ready.")
      this.initPlayer(this.makeYTOptions())
    }
  },

  playerOnReady: function(ev) {
    if (this.config.verbose) console.log("[YOUTUBE] Player is ready.")
    if (this.config.onStartPlay) {
      this.loadVideo(this.config.onStartPlay)
    }
  },

  playerOnStateChange: function(ev) {
    if (this.config.verbose) console.log("[YOUTUBE] Status Changed:", ev.data)
    this.sendNotification(this.config.outNotifications[ev.data])
    if (this.config.disableCC && ev.data == 1) {
      ev.target.unloadModule("captions");  //Works for html5 ignored by AS3
      ev.target.unloadModule("cc");
    }

    if (this.config.showPlayingOnly) {
      var dom = document.getElementById("YOUTUBE")
      if (ev.data == 1) {
        dom.style.display = "block"
      } else {
        dom.style.display = "none"
      }
    }
    if (ev.data == 5) {
      var id = 0
      if (this.list) {
        var list = this.controlPlayer("getPlaylist")
        if (!Array.isArray(list)) return false
        if (this.config.verbose) console.log("[YOUTUBE] Playlist count:", list.length)
        if (list.length > 0) {
          if (this.videoShuffle) {
            id = Math.floor(Math.random()*list.length)
          }
          this.controlPlayer("setShuffle", this.videoShuffle)
        }
      }
      this.controlPlayer("setLoop", this.videoLoop)
      if (this.videoAutoplay) {
        if (id > 0) {
          this.controlPlayer("playVideoAt", id)
        } else {
          this.controlPlayer("playVideo")
        }
      }
    }
  },

  playerOnError: function(ev) {
    var kind = "Unknown Error"
    switch(ev.data) {
      case 2 :
        kind = "Invalid Parameter"
        break
      case 5 :
        kind = "HTML5 Player Error"
        break
      case 100 :
        kind = "Video Not Found (removed or privated)"
        break
      case 101 :
      case 150 :
        kind = "Not Allowed By Owner"
        break
      default:
        break
    }
    if (this.config.verbose) console.log(`[YOUTUBE] Player Error: (${ev.data})`, kind)
    if (ev.data == 2) {
      ev.target.stopVideo()
    }
  },

  makeYTOptions: function(options={}) {
    if (options.hasOwnProperty("playerVars")) {
      options.playerVars = Object.assign({}, this.config.playerVars, options.playerVars)
    } else {
      options.playerVars = Object.assign({}, this.config.playerVars)
    }

    options = Object.assign({}, this.config.defaultPlayerOptions, options)
    options.events = {}
    options.events.onReady = (ev) => {
      this.playerOnReady(ev)
    }
    options.events.onStateChange = (ev) => {
      this.playerOnStateChange(ev)
    }
    options.events.onError = (ev) => {
      this.playerOnError(ev)
    }
    options.events.onAPIChanged = (ev) => {
      //nothing to do...
    }
    return options
  },

  initPlayer: function(options) {
    this.YTPlayer = new YT.Player("YOUTUBE_PLAYER", options)
  }
})
