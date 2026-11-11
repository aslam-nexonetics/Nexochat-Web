import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

export interface AgoraRtcJoinOptions {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
  callType: "audio" | "video";
  onRemoteUserJoined?: (uid: number) => void;
  onRemoteUserLeft?: (uid: number) => void;
  onRemoteVideoTrack?: (track: IRemoteVideoTrack | null) => void;
  onRemoteAudioTrack?: (track: IRemoteAudioTrack | null) => void;
}

class AgoraRtcService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private remoteVideoTrack: IRemoteVideoTrack | null = null;
  private remoteAudioTrack: IRemoteAudioTrack | null = null;
  private localVideoElement: HTMLElement | null = null;
  private remoteVideoElement: HTMLElement | null = null;
  private isJoined = false;

  public getLocalAudioTrack() {
    return this.localAudioTrack;
  }

  public getLocalVideoTrack() {
    return this.localVideoTrack;
  }

  public getRemoteVideoTrack() {
    return this.remoteVideoTrack;
  }

  public getRemoteAudioTrack() {
    return this.remoteAudioTrack;
  }

  public getIsJoined() {
    return this.isJoined;
  }

  /**
   * Initialize Agora client and join the RTC channel
   */
  async join(options: AgoraRtcJoinOptions): Promise<void> {
    if (typeof window === "undefined") return;

    // Leave any existing session first
    await this.leave();

    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    AgoraRTC.setLogLevel(1); // Set to WARNING in production

    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    // Handle remote user publishing tracks
    this.client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (!this.client) return;
      await this.client.subscribe(user, mediaType);

      if (mediaType === "video" && user.videoTrack) {
        this.remoteVideoTrack = user.videoTrack;
        if (options.onRemoteVideoTrack) {
          options.onRemoteVideoTrack(this.remoteVideoTrack);
        }
        if (this.remoteVideoElement) {
          this.remoteVideoTrack.play(this.remoteVideoElement);
        }
      }

      if (mediaType === "audio" && user.audioTrack) {
        this.remoteAudioTrack = user.audioTrack;
        this.remoteAudioTrack.play();
        if (options.onRemoteAudioTrack) {
          options.onRemoteAudioTrack(this.remoteAudioTrack);
        }
      }

      if (options.onRemoteUserJoined && typeof user.uid === "number") {
        options.onRemoteUserJoined(user.uid);
      }
    });

    // Handle remote user unpublishing tracks
    this.client.on("user-unpublished", (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      if (mediaType === "video") {
        this.remoteVideoTrack = null;
        if (options.onRemoteVideoTrack) {
          options.onRemoteVideoTrack(null);
        }
      }
      if (mediaType === "audio") {
        this.remoteAudioTrack = null;
        if (options.onRemoteAudioTrack) {
          options.onRemoteAudioTrack(null);
        }
      }
    });

    // Handle remote user leaving
    this.client.on("user-left", (user: IAgoraRTCRemoteUser) => {
      this.remoteVideoTrack = null;
      this.remoteAudioTrack = null;
      if (options.onRemoteVideoTrack) options.onRemoteVideoTrack(null);
      if (options.onRemoteAudioTrack) options.onRemoteAudioTrack(null);
      if (options.onRemoteUserLeft && typeof user.uid === "number") {
        options.onRemoteUserLeft(user.uid);
      }
    });

    // Join RTC Channel
    await this.client.join(
      options.appId,
      options.channelName,
      options.token || null,
      options.uid
    );
    this.isJoined = true;

    // Create local tracks
    const tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [];

    try {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "speech_standard",
        AEC: true,
        ANS: true,
      });
      tracksToPublish.push(this.localAudioTrack);
    } catch (err) {
      console.warn("Failed to acquire microphone track:", err);
    }

    if (options.callType === "video") {
      try {
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: "720p_1",
          optimizationMode: "detail",
        });
        tracksToPublish.push(this.localVideoTrack);

        if (this.localVideoElement) {
          this.localVideoTrack.play(this.localVideoElement);
        }
      } catch (err) {
        console.warn("Failed to acquire camera track:", err);
      }
    }

    if (tracksToPublish.length > 0 && this.client) {
      await this.client.publish(tracksToPublish);
    }
  }

  /**
   * Bind local video stream to an HTML container element
   */
  attachLocalVideo(element: HTMLElement | null) {
    this.localVideoElement = element;
    if (this.localVideoTrack && element) {
      this.localVideoTrack.play(element);
    }
  }

  /**
   * Bind remote video stream to an HTML container element
   */
  attachRemoteVideo(element: HTMLElement | null) {
    this.remoteVideoElement = element;
    if (this.remoteVideoTrack && element) {
      this.remoteVideoTrack.play(element);
    }
  }

  /**
   * Mute or unmute local microphone
   */
  async setMuted(muted: boolean): Promise<void> {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(!muted);
    }
  }

  /**
   * Enable or disable local camera video
   */
  async setVideoEnabled(enabled: boolean): Promise<void> {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setEnabled(enabled);
    }
  }

  /**
   * Cleanly leave channel and release camera/microphone hardware
   */
  async leave(): Promise<void> {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      if (this.client) {
        if (this.isJoined) {
          await this.client.leave();
        }
        this.client.removeAllListeners();
        this.client = null;
      }
    } catch (e) {
      console.warn("Error during Agora RTC leave:", e);
    } finally {
      this.isJoined = false;
      this.remoteVideoTrack = null;
      this.remoteAudioTrack = null;
      this.localVideoElement = null;
      this.remoteVideoElement = null;
    }
  }
}

export const agoraRtcService = new AgoraRtcService();
