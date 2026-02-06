import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCodeDataURL(
  url: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    color: {
      ...defaultOptions.color,
      ...options.color,
    },
  };

  return QRCode.toDataURL(url, mergedOptions);
}

export function generateSnackUrl(
  repoUrl: string,
  projectName: string
): string {
  const owner = extractGitHubOwner(repoUrl);
  const repo = extractGitHubRepo(repoUrl);
  
  if (!owner || !repo) {
    return `https://snack.expo.dev/?name=${encodeURIComponent(projectName)}`;
  }
  
  return `https://snack.expo.dev/git/${encodeURIComponent(`github.com/${owner}/${repo}`)}?branch=main&path=mobile`;
}

export function generateExpoGoDeepLink(
  projectName: string,
  owner: string
): string {
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `exp://u.expo.dev/${owner}/${sanitizedName}`;
}

export function generateExpoDevUrl(
  repoUrl: string
): string {
  const owner = extractGitHubOwner(repoUrl);
  const repo = extractGitHubRepo(repoUrl);
  
  if (!owner || !repo) {
    return "https://expo.dev";
  }
  
  return `https://github.com/${owner}/${repo}/tree/main/mobile`;
}

function extractGitHubOwner(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^\/]+)/);
  return match ? match[1] : "";
}

function extractGitHubRepo(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
  return match ? match[1].replace(".git", "") : "";
}
