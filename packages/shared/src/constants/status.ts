export enum MatchStatus {
  PENDING = 'pending',
  ANALYZING = 'analyzing',
  ANALYZED = 'analyzed',
  DISMISSED = 'dismissed',
  PARTICIPANDO = 'participando',
  QUOTA_EXCEEDED = 'quota_exceeded',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum NotificationType {
  NEW_MATCH = 'new_match',
  ANALYSIS_COMPLETE = 'analysis_complete',
  STATUS_CHANGE = 'status_change',
  DEADLINE_ALERT = 'deadline_alert',
}

export enum NotificationChannel {
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  WEBPUSH = 'webpush',
}

export enum AISource {
  PLATFORM = 'platform',
  OWN = 'own',
}
