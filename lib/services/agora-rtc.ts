import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { callApi } from "@/lib/api/call";

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
  onConnectionStateChange?: (state: string) => void;
  onNetworkQuality?: (quality: number) => void;
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
  private currentChannelName = "";
  private currentUid = 0;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.leave().catch(() => {});
      });
    }
  }

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
   * Enumerate available microphone devices
   */
  async getMicrophones(): Promise<MediaDeviceInfo[]> {
    if (typeof window === "undefined") return [];
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      return await AgoraRTC.getMicrophones();
    } catch {
      return [];
    }
  }

  /**
   * Enumerate available camera devices
   */
  async getCameras(): Promise<MediaDeviceInfo[]> {
    if (typeof window === "undefined") return [];
    try {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      return await AgoraRTC.getCameras();
    } catch {
      return [];
    }
  }

  /**
   * Switch active microphone device
   */
  async setMicrophone(deviceId: string): Promise<void> {
    if (this.localAudioTrack) {
      await this.localAudioTrack.setDevice(deviceId);
    }
  }

  /**
   * Switch active camera device
   */
  async setCamera(deviceId: string): Promise<void> {
    if (this.localVideoTrack) {
      await this.localVideoTrack.setDevice(deviceId);
    }
  }

  /**
   * Initialize Agora client and join the RTC channel
   */
  async join(options: AgoraRtcJoinOptions): Promise<void> {
    if (typeof window === "undefined") return;

    // Leave any existing session first
    await this.leave();

    this.currentChannelName = options.channelName;
    this.currentUid = options.uid;

    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    AgoraRTC.setLogLevel(1); // Set to WARNING in production

    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    // Handle connection state changes
    this.client.on("connection-state-change", (curState) => {
      if (options.onConnectionStateChange) {
        options.onConnectionStateChange(curState);
      }
    });

    // Handle network quality stats
    this.client.on("network-quality", (stats) => {
      if (options.onNetworkQuality) {
        options.onNetworkQuality(stats.downlinkNetworkQuality);
      }
    });

    // Handle token privilege expiration (renew proactively)
    this.client.on("token-privilege-will-expire", async () => {
      console.warn("[Agora RTC] Token privilege will expire soon, renewing...");
      try {
        const tokenRes = await callApi.generateRtcToken(
          this.currentChannelName,
          this.currentUid,
          "publisher"
        );
        if (this.client && tokenRes.token) {
          await this.client.renewToken(tokenRes.token);
          console.log("[Agora RTC] Token renewed successfully");
        }
      } catch (err) {
        console.error("[Agora RTC] Failed to renew token:", err);
      }
    });

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

    // Create local tracks with production-grade AEC, ANS, AGC
    const tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [];

    try {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "speech_standard",
        AEC: true,
        ANS: true,
        AGC: true,
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
