export var MatchStatus;
(function (MatchStatus) {
    MatchStatus["PENDING"] = "pending";
    MatchStatus["ANALYZING"] = "analyzing";
    MatchStatus["ANALYZED"] = "analyzed";
    MatchStatus["DISMISSED"] = "dismissed";
    MatchStatus["PARTICIPANDO"] = "participando";
    MatchStatus["QUOTA_EXCEEDED"] = "quota_exceeded";
})(MatchStatus || (MatchStatus = {}));
export var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["FAILED"] = "failed";
})(NotificationStatus || (NotificationStatus = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["NEW_MATCH"] = "new_match";
    NotificationType["ANALYSIS_COMPLETE"] = "analysis_complete";
    NotificationType["STATUS_CHANGE"] = "status_change";
    NotificationType["DEADLINE_ALERT"] = "deadline_alert";
})(NotificationType || (NotificationType = {}));
export var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["TELEGRAM"] = "telegram";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["WEBPUSH"] = "webpush";
})(NotificationChannel || (NotificationChannel = {}));
export var AISource;
(function (AISource) {
    AISource["PLATFORM"] = "platform";
    AISource["OWN"] = "own";
})(AISource || (AISource = {}));
//# sourceMappingURL=status.js.map