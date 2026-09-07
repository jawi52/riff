export interface DeviceInfo {
  os: "windows" | "mac" | "ios" | "android" | "linux" | "other";
  name: string;
  isMobile: boolean;
  browser: string;
  supportsNativePrompt: boolean;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      os: "windows",
      name: "Windows PC",
      isMobile: false,
      browser: "Browser",
      supportsNativePrompt: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator as any)?.userAgentData?.platform?.toLowerCase() || navigator.platform?.toLowerCase() || "";

  // iOS Detection (iPhone, iPad, iPod, or iPadOS on Mac platform)
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || (platform === "macintel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|opios/.test(userAgent);
    return {
      os: "ios",
      name: /iphone/.test(userAgent) ? "iPhone" : "iPad",
      isMobile: true,
      browser: isSafari ? "Safari" : "Browser",
      supportsNativePrompt: false, // Apple iOS does not support beforeinstallprompt programmatic prompt
    };
  }

  // Android Detection
  if (/android/.test(userAgent)) {
    return {
      os: "android",
      name: "Android Device",
      isMobile: true,
      browser: /chrome/.test(userAgent) ? "Chrome" : "Mobile Browser",
      supportsNativePrompt: true,
    };
  }

  // Windows Detection
  if (/win/.test(platform) || /windows/.test(userAgent)) {
    return {
      os: "windows",
      name: "Windows PC",
      isMobile: false,
      browser: /edg/.test(userAgent) ? "Edge" : /chrome/.test(userAgent) ? "Chrome" : "Browser",
      supportsNativePrompt: true,
    };
  }

  // macOS Detection
  if (/mac/.test(platform) || /macintosh|mac os x/.test(userAgent)) {
    return {
      os: "mac",
      name: "Mac",
      isMobile: false,
      browser: /chrome/.test(userAgent) ? "Chrome" : /safari/.test(userAgent) ? "Safari" : "Browser",
      supportsNativePrompt: true,
    };
  }

  // Linux Detection
  if (/linux/.test(platform) || /linux/.test(userAgent)) {
    return {
      os: "linux",
      name: "Linux PC",
      isMobile: false,
      browser: "Browser",
      supportsNativePrompt: true,
    };
  }

  return {
    os: "other",
    name: "Your Device",
    isMobile: /mobile|tablet/.test(userAgent),
    browser: "Browser",
    supportsNativePrompt: true,
  };
}
