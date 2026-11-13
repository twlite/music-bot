declare module "spotify-url-info" {
  export default function spotifyURLInfo(fetcher: typeof fetch): {
    getTracks(
      url: string,
      options?: { signal?: AbortSignal },
    ): Promise<
      { name: string; artist?: string; uri?: string; duration?: number }[]
    >;
  };
}
