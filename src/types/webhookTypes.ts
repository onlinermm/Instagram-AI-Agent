export interface InteractionResult {
  profileUrl: string;
  success: boolean;
  message: string;
  postUrl?: string;
  liked: boolean;
  commented: boolean;
  comment?: string;
  isReel: boolean;
  error?: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  timestamp: string;
  totalProfiles: number;
  successfulInteractions: number;
  failedInteractions: number;
  results: InteractionResult[];
}

export interface WebhookPayload {
  profileUrl?: string;
  username?: string;
  timestamp?: string;
  message?: string;
  profiles?: string[];
  enableLiking?: boolean;
  enableCommenting?: boolean;
  enableScreenshots?: boolean;
  enableContentFiltering?: boolean;
  [key: string]: any;
} 